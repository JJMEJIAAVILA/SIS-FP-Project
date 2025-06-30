// SIS-FP/backend/models/FuerzaPublica.js - ACTUALIZADO con fecha_salida

const mongoose = require('mongoose');

const fuerzaPublicaSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        required: [true, 'Por favor, añade la fecha del registro']
    },
    fuerza_publica: {
        type: String,
        required: [true, 'Por favor, añade la fuerza pública'],
        uppercase: true,
        trim: true
    },
    unidades: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    hora_llegada: {
        type: String, // Formato HH:MM
        trim: true,
        default: '-'
    },
    hora_salida: {
        type: String, // Formato HH:MM
        trim: true,
        default: '-'
    },
    fecha_salida: { // NUEVO CAMPO: Fecha de salida
        type: Date,
        default: null // Por defecto será nulo hasta que se finalice el registro
    },
    accion_realizada: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    observaciones: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

const FuerzaPublica = mongoose.model('FuerzaPublica', fuerzaPublicaSchema);

module.exports = FuerzaPublica;