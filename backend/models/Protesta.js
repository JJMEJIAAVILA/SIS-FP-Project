// SIS-FP/backend/models/Protesta.js - ACTUALIZADO

const mongoose = require('mongoose');

const protestaSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        required: [true, 'Por favor, añade la fecha de la protesta']
    },
    tipo_protesta: {
        type: String,
        required: [true, 'Por favor, añade el tipo de protesta'],
        uppercase: true,
        trim: true
    },
    vias: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    sector_bloqueo: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    motivo_protesta: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    generador_protesta: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    hora_inicio: {
        type: String, // Formato HH:MM
        trim: true,
        default: '-'
    },
    hora_finalizacion: {
        type: String, // Formato HH:MM
        trim: true,
        default: '-'
    },
    // NUEVO CAMPO: Fecha de finalización
    fecha_finalizacion: {
        type: Date,
        default: null // Inicialmente nulo, se llenará al finalizar
    },
    tiempo_total_bloqueo: {
        type: String, // Se calculará en el frontend (ej: "2h 30m")
        trim: true,
        default: '-'
    },
    geoposicion: {
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

const Protesta = mongoose.model('Protesta', protestaSchema);

module.exports = Protesta;