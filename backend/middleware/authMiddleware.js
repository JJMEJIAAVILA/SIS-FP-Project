// SIS-FP/backend/middleware/authMiddleware.js - ACTUALIZADO con authorizeRoles

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importar el modelo de usuario

// Clave secreta para JWT (debe ser la misma que en server.js)
const JWT_SECRET = process.env.JWT_SECRET || 'miSuperClaveSecretaParaJWT123!';

// Middleware para proteger rutas (verificar token y añadir usuario a req)
exports.protect = async (req, res, next) => {
    let token;

    // Verificar si el token está en las cabeceras de autorización (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token de la cabecera
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Obtener usuario del token (excluir la contraseña)
            // .select('-password') asegura que la contraseña no sea cargada
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
            }

            next(); // Continuar con la siguiente función de middleware/ruta

        } catch (error) {
            console.error('Error en el middleware de protección:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado, por favor, inicia sesión de nuevo.' });
            }
            return res.status(401).json({ message: 'No autorizado, token fallido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

// NUEVO MIDDLEWARE: Autorizar roles
// Recibe una lista de roles permitidos y devuelve una función de middleware
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user viene del middleware 'protect'
        if (!req.user || !req.user.role) {
            // Si no hay usuario o rol (lo cual no debería pasar si 'protect' ya corrió)
            return res.status(403).json({ message: 'Acceso denegado, rol de usuario no definido.' });
        }

        // Verificar si el rol del usuario está incluido en la lista de roles permitidos
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Acceso denegado. Tu rol (${req.user.role}) no tiene permiso para realizar esta acción.` });
        }

        next(); // El usuario tiene el rol permitido, continuar
    };
};