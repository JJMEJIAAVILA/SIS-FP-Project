// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Para acceder a la clave secreta

// Obtener la clave secreta del entorno
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    // 1. Obtener el token del encabezado de autorización
    // El token generalmente viene en el formato: "Bearer TOKEN_AQUÍ"
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        // Si no hay encabezado de autorización
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    const token = authHeader.split(' ')[1]; // Extraer el token después de "Bearer "

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. Formato de token inválido.' });
    }

    try {
        // 2. Verificar el token
        // jwt.verify devuelve el payload decodificado si el token es válido
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Adjuntar la información del usuario al objeto de la petición (req.user)
        // Esto permite que las rutas protegidas accedan al ID del usuario, etc.
        req.user = decoded; // decoded contendrá { id: user._id, username: user.username }

        // 4. Continuar con la siguiente función middleware o la ruta final
        next();
    } catch (err) {
        // Si el token es inválido (ej. expirado, firma incorrecta)
        console.error('Error de verificación de token:', err.message);
        res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
    }
};

module.exports = authMiddleware;