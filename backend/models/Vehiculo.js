// SIS-FP/backend/models/Vehiculo.js - CORREGIDO: Eliminado unique de placa
const mongoose = require('mongoose');

const vehiculoSchema = new mongoose.Schema({
    fechaRegistro: {
        type: Date, // Ahora es de tipo Date
        required: true
    },
    conductor: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    empresa: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    placa: {
        type: String,
        required: true,
        // Eliminado: unique: true, // ¡ESTO SE ELIMINA PARA PERMITIR MÚLTIPLES REGISTROS!
        uppercase: true,
        trim: true
    },
    tipo_vehiculo: {
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    hora_entrada: {
        type: String, // Formato 'HH:MM'
        required: true
    },
    hora_salida: {
        type: String,
        // No necesita default: '-' si es String, pero si se deja sin valor, será null/undefined
    },
    fecha_salida: {
        type: Date, // Ahora es de tipo Date
        // No necesita default: '-' si es Date, se manejará como null si no se proporciona
    },
    parqueadero_interno: {
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    parqueadero_visitantes: {
        type: String,
        default: '-',
        uppercase: true,
        trim: true
    },
    observaciones: {
        type: String,
        default: '-',
        trim: true
    }
}, { timestamps: true }); // 'timestamps' añade createdAt y updatedAt automáticamente

module.exports = mongoose.model('Vehiculo', vehiculoSchema);