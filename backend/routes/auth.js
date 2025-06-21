// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens web JSON
const User = require('../models/User'); // Importamos el modelo de usuario

// Clave secreta para firmar los JWTs (debe ser una cadena larga y aleatoria)
// ¡IMPORTANTE!: En un entorno de producción, esta clave debería ser cargada desde una variable de entorno.
const jwtSecret = process.env.JWT_SECRET;

// @route   POST /api/register
// @desc    Registrar un nuevo usuario
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validación básica
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Por favor, ingrese todos los campos requeridos.' });
    }

    try {
        // Verificar si el usuario o email ya existen
        let userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario o el email ya están registrados.' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10); // Genera un "salt" para la seguridad
        const hashedPassword = await bcrypt.hash(password, salt); // Hashea la contraseña

        // Crear un nuevo usuario (inicialmente inactivo para verificación de email)
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            // role: 'user', // Por defecto ya está en el modelo
            // isActive: false // Por defecto ya está en el modelo
        });

        // Guardar usuario en la base de datos
        await newUser.save();

        // Aquí podríamos enviar un email de verificación (lo haremos en un paso posterior)
        // Por ahora, solo confirmamos el registro.

        res.status(201).json({ message: 'Usuario registrado exitosamente. Por favor, verifique su email para activar la cuenta.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al registrar el usuario.');
    }
});

// @route   POST /api/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
        return res.status(400).json({ message: 'Por favor, ingrese usuario y contraseña.' });
    }

    try {
        // Buscar usuario por username (también podrías buscar por email)
        const user = await User.findOne({ username: username.toLowerCase() }); // Usamos toLowerCase por si se guardó así

        // Verificar si el usuario existe
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // Verificar si la cuenta está activa (para futura verificación de email)
        if (!user.isActive) {
            return res.status(401).json({ message: 'Su cuenta no está activa. Por favor, verifique su email.' });
        }

        // Comparar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // Generar token JWT
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            jwtSecret, // Tu clave secreta definida arriba o en .env
            { expiresIn: '1h' }, // El token expirará en 1 hora
            (err, token) => {
                if (err) throw err;
                res.json({ token, message: 'Inicio de sesión exitoso.' });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al iniciar sesión.');
    }
});

module.exports = router;