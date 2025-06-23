// SIS-FP/models/Empresa.js
const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
    // El campo '_id' será generado automáticamente por MongoDB
    fecha_entrada: {
        type: String, // Usamos String para flexibilidad con el formato 'YYYY-MM-DD HH:MM'
        required: true
    },
    fecha_salida: {
        type: String, // También String, por defecto '-' o cuando se actualice
        default: '-'
    },
    nombre_empresa: { // Corresponde a 'nombre_empresa' en tu formulario HTML
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    identificacion: { // Corresponde a 'identificacion' en tu formulario HTML
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    area_ingreso: { // Corresponde a 'area_ingreso' en tu formulario HTML
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    empresa: { // Corresponde a 'empresa' en tu formulario HTML
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    carne: { // Corresponde a 'carne' en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    tipo_empresa: { // Corresponde a 'tipo_empresa' (sexo) en tu formulario HTML
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    area: { // Corresponde a 'area' (área interventora) en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    dependencia: { // Corresponde a 'dependencia' en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    dispositivo: { // Corresponde a 'dispositivo' en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    codigo_dispositivo: { // Corresponde a 'codigo_dispositivo' en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    observaciones: { // Corresponde a 'observaciones' en tu formulario HTML
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    }
}, { timestamps: true }); // 'timestamps' añade createdAt y updatedAt automáticamente

module.exports = mongoose.model('Empresa', empresaSchema);