// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya usuarios duplicados
        trim: true,  // Elimina espacios en blanco al inicio y final
        lowercase: true // Guarda el username en minúsculas
    },
    password: {
        type: String,
        required: true
    },
    email: { // Añadimos email para futuras funcionalidades (recuperación de contraseña, verificación)
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, ingrese un email válido'] // Regex para validación básica de email
    },
    role: { // Para control de acceso basado en roles (admin, user, etc.)
        type: String,
        enum: ['user', 'admin'], // Solo permite 'user' o 'admin'
        default: 'user'
    },
    isActive: { // Para activar/desactivar cuentas (ej. después de verificación de email)
        type: Boolean,
        default: false // Inicialmente inactivo hasta la verificación de email
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);