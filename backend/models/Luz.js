// SIS-FP/backend/models/Luz.js
const mongoose = require('mongoose');

// Esquema para un registro individual de falla dentro del historial de una luz
const fallaAnidadaSchema = new mongoose.Schema({
    fecha_falla: {
        type: Date,
        required: true
    },
    fecha_arreglo: {
        type: Date,
        default: null // Puede ser nulo hasta que se resuelva
    },
    observaciones: {
        type: String,
        uppercase: true, // Guardar en mayúsculas
        default: ''
    },
    estado_falla_en_momento: { // Estado de la luz cuando se registró esta falla
        type: String,
        enum: ['NO FUNCIONA', 'CON FALLAS'],
        required: true
    }
}, {
    timestamps: true // Añade createdAt y updatedAt para cada registro de falla individual
});

// Esquema para los registros de Luces
const luzSchema = new mongoose.Schema({
    item: {
        type: Number,
        required: true,
        unique: true // Asegura que cada ITEM sea único
    },
    area: {
        type: String,
        required: true,
        uppercase: true // Guardar en mayúsculas
    },
    circuito: {
        type: String,
        required: true,
        uppercase: true // Guardar en mayúsculas
    },
    luminaria: {
        type: String,
        required: true,
        uppercase: true // Guardar en mayúsculas
    },
    estado_actual: {
        type: String,
        required: true,
        enum: ['FUNCIONANDO', 'NO FUNCIONA', 'CON FALLAS'], // Opciones permitidas
        default: 'FUNCIONANDO'
    },
    fecha_registro: { // Fecha de creación del registro de luz
        type: Date,
        default: Date.now
    },
    // NUEVO: Array para el historial de fallas anidado
    historialFallas: [fallaAnidadaSchema] // Un array de objetos con el esquema de fallaAnidadaSchema
}, {
    timestamps: true // Añade createdAt y updatedAt para el documento de Luz
});

const Luz = mongoose.model('Luz', luzSchema);
// Ya no necesitamos exportar HistorialFallaLuz como un modelo separado
// const HistorialFallaLuz = mongoose.model('HistorialFallaLuz', historialFallaLuzSchema);

module.exports = { Luz }; // Solo exportamos el modelo Luz