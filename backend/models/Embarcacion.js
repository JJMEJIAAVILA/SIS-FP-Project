// SIS-FP/backend/models/Embarcacion.js - ACTUALIZADO para tipos de fecha correctos
const mongoose = require('mongoose');

const embarcacionSchema = mongoose.Schema(
    {
        fechaRegistro: {
            type: Date, // CAMBIO CLAVE: Ahora es de tipo Date
            required: [true, 'Por favor, añade una fecha de registro']
        },
        piloto: {
            type: String,
            required: [true, 'Por favor, añade el nombre del piloto']
        },
        nombre_embarcacion: {
            type: String,
            required: [true, 'Por favor, añade el nombre de la embarcación']
        },
        tipo_embarcacion: {
            type: String,
            default: '-' // Valor por defecto
        },
        hora_entrada: {
            type: String, // Formato "HH:MM"
            default: '-' // Valor por defecto
        },
        hora_salida: {
            type: String, // Para la hora de zarpe (inicialmente null)
            default: null
        },
        fecha_salida: {
            type: Date, // CAMBIO CLAVE: Ahora es de tipo Date
            default: null // Se manejará como null si no se proporciona
        },
        observaciones: {
            type: String,
            default: '-' // Valor por defecto
        }
    },
    {
        timestamps: true // Añade createdAt y updatedAt automáticamente
    }
);

module.exports = mongoose.model('Embarcacion', embarcacionSchema);