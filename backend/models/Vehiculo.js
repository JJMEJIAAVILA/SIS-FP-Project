// SIS-FP/backend/models/Vehiculo.js
const mongoose = require('mongoose');

const vehiculoSchema = new mongoose.Schema({
    fechaRegistro: { // Campo oculto en HTML, se puede generar en el backend o frontend
        type: String, // Usamos String para flexibilidad, o Date si quieres manejarlo como objeto Date
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
        unique: true, // La placa suele ser única
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
        default: '-' // Se actualizará al registrar salida
    },
    fecha_salida: {
        type: String,
        default: '-' // Se actualizará al registrar salida
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