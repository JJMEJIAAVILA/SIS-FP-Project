// SIS-FP/backend/models/Empresa.js - CORREGIDO: Eliminado unique de identificacion
const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
    fecha_entrada: {
        type: Date,
        required: true
    },
    hora_entrada: { // Nuevo campo para la hora de entrada
        type: String,
        default: ''
    },
    fecha_salida: {
        type: Date,
        default: null // Puede ser nulo si la empresa aún no ha salido
    },
    hora_salida: { // Nuevo campo para la hora de salida
        type: String,
        default: ''
    },
    nombre_empresa: {
        type: String,
        required: true,
        uppercase: true
    },
    identificacion: {
        type: String,
        required: true,
        // Eliminado: unique: true, // ¡ESTO SE ELIMINA PARA PERMITIR MÚLTIPLES REGISTROS!
    },
    area_ingreso: {
        type: String,
        uppercase: true,
        default: ''
    },
    empresa: {
        type: String,
        uppercase: true,
        default: ''
    },
    carne: {
        type: String,
        uppercase: true,
        default: '-'
    },
    tipo_empresa: {
        type: String,
        enum: ['FUNCIONARIO', 'CONTRATISTA FIJO', 'CONTRATISTA EVENTUAL', 'VISITANTE'],
        default: '',
        required: true
    },
    dependencia: {
        type: String,
        uppercase: true,
        default: ''
    },
    dispositivo: {
        type: String,
        uppercase: true,
        default: ''
    },
    codigo_dispositivo: {
        type: String,
        uppercase: true,
        default: ''
    },
    observaciones: {
        type: String,
        uppercase: true,
        default: ''
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

const Empresa = mongoose.model('Empresa', empresaSchema);

module.exports = Empresa;