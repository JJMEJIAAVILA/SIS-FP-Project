// SIS-FP/backend/server.js - Versión Corregida (Eliminada la ruta de registro público)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Importar la función 'protect' y 'authorizeRoles' desde authMiddleware
const { protect, authorizeRoles } = require('./middleware/authMiddleware');

// Importar el modelo de Usuario (AHORA SOLO SE IMPORTA, NO SE DEFINE AQUÍ)
const User = require('./models/User'); // <--- ¡CAMBIO CLAVE AQUÍ!

// Middleware
app.use(cors()); // Habilita CORS para permitir peticiones desde el frontend
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las peticiones

// --- Configuración de la base de datos MongoDB ---
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sis_fp_db';

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB conectado correctamente'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// --- Clave Secreta para JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'miSuperClaveSecretaParaJWT123!';

// --- Rutas de Autenticación y Perfil de Usuario ---

// Ruta raíz del backend
app.get('/', (req, res) => {
    res.send('¡Servidor backend de SIS-FP funcionando!');
});

// --- RUTA DE REGISTRO PÚBLICO ELIMINADA O COMENTADA PARA MAYOR SEGURIDAD ---
/*
// Ruta de registro de usuario
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o el correo electrónico ya están registrados.' });
        }
        // La contraseña se hasheará automáticamente por el hook 'pre-save' en el modelo User
        const newUser = new User({
            username,
            email,
            password,
            telefono: '',
            idioma: 'es',
            tema: 'oscuro',
            role: 'operator' // Por defecto, los registros normales son 'operator'
        });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});
*/
// --- FIN DE LA RUTA DE REGISTRO PÚBLICO ELIMINADA O COMENTADA ---


// Ruta de login de usuario
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }
    try {
        // Seleccionar la contraseña para poder compararla
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        // Usar el método matchPassword del modelo
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role // Incluir el rol en el token
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            username: user.username, // También enviamos el username para el frontend
            role: user.role // También enviamos el rol para el frontend
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
});

// Ruta protegida de ejemplo (usando 'protect')
app.get('/api/protected', protect, (req, res) => {
    res.status(200).json({
        message: '¡Acceso concedido a la ruta protegida!',
        user: req.user,
        data: 'Aquí están los datos sensibles que solo usuarios autenticados pueden ver.'
    });
});

// Ruta para obtener el perfil del usuario autenticado (usando 'protect')
app.get('/api/user/profile', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        // Excluimos la contraseña del resultado
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
        }
        res.status(200).json({
            username: user.username,
            email: user.email,
            telefono: user.telefono,
            idioma: user.idioma,
            tema: user.tema,
            role: user.role // Incluir el rol en el perfil
        });
    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.' });
    }
});

// Ruta para actualizar el perfil del usuario autenticado (usando 'protect')
app.put('/api/user/profile', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, telefono, password, idioma, tema } = req.body;
        const user = await User.findById(userId).select('+password'); // Seleccionar password para poder hashear si cambia
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        // Actualizar solo si los campos vienen definidos y son diferentes
        if (username !== undefined && username !== user.username) user.username = username;
        if (email !== undefined && email !== user.email) user.email = email;
        if (telefono !== undefined && telefono !== user.telefono) user.telefono = telefono;
        if (idioma !== undefined && idioma !== user.idioma) user.idioma = idioma;
        if (tema !== undefined && tema !== user.tema) user.tema = tema;
        // Solo actualizar contraseña si se proporciona una nueva
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        await user.save();
        res.status(200).json({ message: 'Perfil actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar el perfil del usuario:', error);
        // Manejo de error de duplicado (ej. username o email ya existen)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
    }
});


// --- Importar y usar Rutas Modulares ---
// IMPORTANTE: DEBEN ESTAR ANTES DE app.use(express.static...);

// Rutas para la gestión de Antecedentes (antecedentesRoutes.js)
const antecedentesRoutes = require('./routes/antecedentesRoutes');
app.use('/api/antecedentes', antecedentesRoutes);

// Rutas para la gestión de Cámaras (camarasRoutes.js)
const camarasRoutes = require('./routes/camarasRoutes');
app.use('/api/camaras', camarasRoutes);

// Rutas para la gestión de Embarcaciones (embarcacionesRoutes.js)
const embarcacionesRoutes = require('./routes/embarcacionesRoutes');
app.use('/api/embarcaciones', embarcacionesRoutes);

// Rutas para la gestión de Empresas (empresas.js)
const empresaRoutes = require('./routes/empresas');
app.use('/api/empresas', empresaRoutes);

// Rutas para la gestión de Apoyo de la Fuerza Pública (fuerzaPublicaRoutes.js)
const fuerzaPublicaRoutes = require('./routes/fuerzaPublicaRoutes');
app.use('/api/fuerza_publica', fuerzaPublicaRoutes);

// Rutas para la gestión de Luces (lucesRoutes.js)
const lucesRoutes = require('./routes/lucesRoutes');
app.use('/api/luces', lucesRoutes);

// Rutas para la gestión de Protestas (protestasRoutes.js)
const protestasRoutes = require('./routes/protestasRoutes');
app.use('/api/protestas', protestasRoutes);

// Rutas para la gestión de Vehículos (vehiculos.js)
const vehiculoRoutes = require('./routes/vehiculos');
app.use('/api/vehiculos', vehiculoRoutes);

// Rutas para el Dashboard
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Rutas para la gestión de usuarios por administradores
const adminUserRoutes = require('./routes/adminUserRoutes');
app.use('/api/admin/users', adminUserRoutes);


// --- Servir archivos estáticos del frontend ---
// ESTA LÍNEA DEBE SER LA ÚLTIMA DE LAS CONFIGURACIONES DE RUTAS
// Cualquier ruta API definida DESPUÉS de esta línea NO SERÁ ALCANZADA si la URL coincide con un archivo estático
app.use(express.static(__dirname + '/../'));


// --- Iniciar el servidor Express ---
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});