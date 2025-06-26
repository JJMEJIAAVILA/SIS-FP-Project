// SIS-FP/backend/models/Camara.js

const mongoose = require('mongoose');

// Sub-esquema para el historial de fallas y arreglos
const historialSchema = new mongoose.Schema({
    estado_en_momento: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['FUNCIONANDO', 'NO FUNCIONA', 'CON FALLAS'],
        trim: true
    },
    fecha_evento: {
        type: Date,
        required: true,
        default: Date.now // La fecha se autocompleta si no se proporciona
    },
    observaciones_historial: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente al historial
});

const camaraSchema = new mongoose.Schema({
    area: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    camara: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya cámaras duplicadas
        uppercase: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['PTZ', 'FIJA'],
        trim: true
    },
    estado_actual: {
        type: String,
        required: true,
        uppercase: true,
        enum: ['FUNCIONANDO', 'NO FUNCIONA', 'CON FALLAS'],
        trim: true
    },
    // Nuevos campos para rastrear la última falla y arreglo, facilitando la visualización en la tabla
    ultima_fecha_falla: {
        type: Date,
        default: null
    },
    ultima_fecha_arreglo: {
        type: Date,
        default: null
    },
    observaciones_general: {
        type: String,
        uppercase: true,
        trim: true,
        default: '-'
    },
    // Array de sub-documentos para el historial de eventos
    historial: [historialSchema]

}, {
    timestamps: true // Añade createdAt y updatedAt a la cámara principal
});

// Middleware para actualizar las fechas de última falla/arreglo
camaraSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (update.estado_actual && docToUpdate.estado_actual !== update.estado_actual) {
        if (update.estado_actual === 'NO FUNCIONA' || update.estado_actual === 'CON FALLAS') {
            update.ultima_fecha_falla = new Date();
        } else if (update.estado_actual === 'FUNCIONANDO') {
            update.ultima_fecha_arreglo = new Date();
        }
    }
    next();
});

const Camara = mongoose.model('Camara', camaraSchema);

module.exports = Camara;