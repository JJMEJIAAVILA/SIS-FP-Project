// SIS-FP/backend/models/Antecedente.js
const mongoose = require('mongoose');

const antecedenteSchema = new mongoose.Schema({
    item: {
        type: Number,
        required: true,
        unique: true // Asegura que cada ITEM sea único
    },
    nombre: {
        type: String,
        required: true,
        uppercase: true
    },
    numero_identificacion: {
        type: String,
        required: true,
        unique: true // El número de identificación debe ser único
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
    // Campo para el resultado de la verificación de antecedentes
    resultado_verificacion: {
        type: String,
        enum: ['CON ANTECEDENTES', 'SIN ANTECEDENTES', 'NO APLICA', 'PENDIENTE'],
        default: 'PENDIENTE', // Estado inicial antes de la verificación
        required: true
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

const Antecedente = mongoose.model('Antecedente', antecedenteSchema);

module.exports = Antecedente;