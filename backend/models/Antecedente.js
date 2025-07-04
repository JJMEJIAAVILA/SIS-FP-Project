// SIS-FP/backend/models/Antecedente.js - CORREGIDO (Eliminado unique de numero_identificacion)

const mongoose = require('mongoose');

const antecedenteSchema = new mongoose.Schema({
    item: {
        type: Number,
        required: true,
        unique: true // El ITEM sigue siendo único
    },
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    numero_identificacion: {
        type: String,
        required: true,
        // Eliminado: unique: true
        // La lógica de los 6 meses en el controlador ahora controlará la duplicidad temporal
    },
    empresa: {
        type: String,
        uppercase: true,
        default: ''
    },
    dependencia: {
        type: String,
        uppercase: true,
        default: ''
    },
    observaciones: {
        type: String,
        uppercase: true,
        default: ''
    },
    resultado_verificacion: {
        type: String,
        enum: ['CON ANTECEDENTES', 'SIN ANTECEDENTES', 'NO APLICA', 'PENDIENTE'],
        default: 'PENDIENTE',
        required: true
    }
}, {
    timestamps: true // Esto añade createdAt y updatedAt automáticamente
    // createdAt será usado por el controlador para la validación de 6 meses
});

const Antecedente = mongoose.model('Antecedente', antecedenteSchema);

module.exports = Antecedente;