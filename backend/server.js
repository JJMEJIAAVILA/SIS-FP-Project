const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ¡NUEVO! Importar el middleware de autenticación
const authMiddleware = require('./middleware/authMiddleware'); // Asegúrate de la ruta correcta

// Middleware
app.use(cors());
app.use(express.json());

// --- Configuración de la base de datos MongoDB y Modelo de Usuario ---
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sis_fp_db';

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB conectado correctamente'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema de Usuario ACTUALIZADO con nuevos campos
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telefono: { type: String, default: '' }, // Nuevo campo para el perfil
    idioma: { type: String, default: 'es' },  // Nuevo campo para el perfil
    tema: { type: String, default: 'oscuro' }, // Nuevo campo para el perfil
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- Clave Secreta para JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'miSuperClaveSecretaParaJWT123!';

// --- Rutas existentes ---
app.get('/', (req, res) => {
    res.send('¡Servidor backend de SIS-FP funcionando!');
});

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
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            telefono: '', // Valores por defecto para nuevos campos
            idioma: 'es',
            tema: 'oscuro'
        });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor, verifique su email para activar la cuenta.' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// Ruta de login de usuario
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email // Incluir el email en el payload del token es útil para el frontend
            // Puedes añadir otros campos que no sean sensibles aquí, como role, etc.
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
});

// Ruta protegida de ejemplo
app.get('/api/protected', authMiddleware, (req, res) => {
    res.status(200).json({
        message: '¡Acceso concedido a la ruta protegida!',
        user: req.user,
        data: 'Aquí están los datos sensibles que solo usuarios autenticados pueden ver.'
    });
});

// --- Rutas para la Configuración de Perfil de Usuario (NUEVAS) ---

// Ruta para obtener el perfil del usuario autenticado
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('-password'); // Excluir la contraseña

        if (!user) {
            return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
        }

        res.status(200).json({
            username: user.username,
            email: user.email,
            telefono: user.telefono,
            idioma: user.idioma,
            tema: user.tema
        });

    } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.' });
    }
});

// Ruta para actualizar el perfil del usuario autenticado
app.put('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, telefono, password, idioma, tema } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Actualizar campos si se proporcionan y son diferentes
        if (username !== undefined && username !== user.username) user.username = username;
        if (email !== undefined && email !== user.email) user.email = email;
        if (telefono !== undefined && telefono !== user.telefono) user.telefono = telefono;
        if (idioma !== undefined && idioma !== user.idioma) user.idioma = idioma;
        if (tema !== undefined && tema !== user.tema) user.tema = tema;

        // Si se proporciona una nueva contraseña, hashearla y actualizarla
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({ message: 'Perfil actualizado exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar el perfil del usuario:', error);
        if (error.code === 11000) { // Error de clave duplicada
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
    }
});

// --- FIN Rutas para la Configuración de Perfil de Usuario ---


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});