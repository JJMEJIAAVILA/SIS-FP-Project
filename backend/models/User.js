// SIS-FP/backend/models/User.js - FINAL Y LIMPIO
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Necesario para el hashing de contraseñas

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Por favor, añade un nombre de usuario'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Por favor, añade un correo electrónico'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor, añade un correo electrónico válido'
        ]
    },
    password: {
        type: String,
        required: [true, 'Por favor, añade una contraseña'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false // No devolver la contraseña en las consultas por defecto
    },
    telefono: {
        type: String,
        default: ''
    },
    idioma: {
        type: String,
        enum: ['es', 'en'], // Puedes añadir más idiomas si es necesario
        default: 'es'
    },
    tema: {
        type: String,
        enum: ['oscuro', 'claro'], // Puedes añadir más temas
        default: 'oscuro'
    },
    role: { // Rol del usuario
        type: String,
        enum: ['admin', 'operator', 'viewer'], // Roles permitidos
        default: 'operator' // Rol por defecto para nuevos usuarios si no se especifica
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware de Mongoose para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;