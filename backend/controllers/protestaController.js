// SIS-FP/backend/controllers/protestaController.js - CORREGIDO
const Protesta = require('../models/Protesta');

// Función auxiliar para manejar la fecha para evitar el problema del día anterior
// Convierte una fecha string (YYYY-MM-DD) a un objeto Date que representa el inicio del día UTC
const parseDateForDB = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Divide "YYYY-MM-DD" en partes
    // Crea un objeto Date en UTC usando el año, mes (0-indexado) y día
    // Esto asegura que la fecha se guarde como el inicio de ese día en UTC,
    // sin importar la zona horaria del servidor.
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};

// @desc    Crear un nuevo registro de protesta
// @route   POST /api/protestas
// @access  Private (requiere token de autenticación)
exports.createProtesta = async (req, res) => {
    try {
        const {
            fecha,
            tipo_protesta,
            vias,
            sector_bloqueo,
            motivo_protesta,
            generador_protesta,
            hora_inicio,
            hora_finalizacion,
            tiempo_total_bloqueo,
            geoposicion,
            observaciones
        } = req.body;

        // Validación de campos obligatorios
        if (!fecha || !tipo_protesta) {
            return res.status(400).json({ message: 'La fecha y el tipo de protesta son obligatorios.' });
        }

        const newProtesta = new Protesta({
            fecha: parseDateForDB(fecha), // Usar la función auxiliar para la fecha
            tipo_protesta: tipo_protesta.toUpperCase(), // Asegurar mayúsculas
            vias: vias ? vias.toUpperCase() : '-', // Asegurar mayúsculas y default
            sector_bloqueo: sector_bloqueo ? sector_bloqueo.toUpperCase() : '-', // Asegurar mayúsculas y default
            motivo_protesta: motivo_protesta ? motivo_protesta.toUpperCase() : '-', // Asegurar mayúsculas y default
            generador_protesta: generador_protesta ? generador_protesta.toUpperCase() : '-', // Asegurar mayúsculas y default
            hora_inicio: hora_inicio || '-',
            hora_finalizacion: hora_finalizacion || '-', // Asegurar default si no viene
            fecha_finalizacion: null, // Siempre nulo al crear
            tiempo_total_bloqueo: tiempo_total_bloqueo || '-', // Asegurar default si no viene
            geoposicion: geoposicion ? geoposicion.toUpperCase() : '-', // Asegurar mayúsculas y default
            observaciones: observaciones ? observaciones.toUpperCase() : '-' // Asegurar mayúsculas y default
        });

        const savedProtesta = await newProtesta.save();
        res.status(201).json(savedProtesta);

    } catch (error) {
        console.error('Error al crear el registro de protesta:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // No hay manejo de error 11000 aquí, lo cual es correcto si no hay campos unique en el modelo
        res.status(500).json({ message: 'Error del servidor al crear el registro de protesta.', error: error.message });
    }
};

// @desc    Obtener todos los registros de protestas
// @route   GET /api/protestas
// @access  Private
exports.getProtestas = async (req, res) => {
    try {
        // CAMBIO: Ordenar por fecha y luego por createdAt de forma ascendente (más antiguos primero)
        const protestas = await Protesta.find().sort({ fecha: 1, createdAt: 1 });
        res.status(200).json({ protestas });
    } catch (error) {
        console.error('Error al obtener los registros de protestas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los registros de protestas.', error: error.message });
    }
};

// @desc    Obtener un registro de protesta por ID
// @route   GET /api/protestas/:id
// @access  Private
exports.getProtestaById = async (req, res) => {
    try {
        const protesta = await Protesta.findById(req.params.id);
        if (!protesta) {
            return res.status(404).json({ message: 'Registro de protesta no encontrado.' });
        }
        res.status(200).json(protesta);
    } catch (error) {
        console.error('Error al obtener el registro por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el registro por ID.', error: error.message });
    }
};

// @desc    Actualizar un registro de protesta
// @route   PUT /api/protestas/:id
// @access  Private
exports.updateProtesta = async (req, res) => {
    try {
        const { fecha, fecha_finalizacion, ...otherFields } = req.body;

        const updateFields = { ...otherFields };

        // Convertir la fecha a objeto Date si viene definida, usando la función auxiliar
        if (fecha) {
            updateFields.fecha = parseDateForDB(fecha);
        }
        // Manejar fecha_finalizacion en la actualización general
        if (fecha_finalizacion) {
            updateFields.fecha_finalizacion = parseDateForDB(fecha_finalizacion);
        } else if (fecha_finalizacion === null) { // Permite borrar la fecha de finalización si se envía null
            updateFields.fecha_finalizacion = null;
        }

        // Asegurar que los campos string se conviertan a mayúsculas si se actualizan
        if (updateFields.tipo_protesta) updateFields.tipo_protesta = updateFields.tipo_protesta.toUpperCase();
        if (updateFields.vias) updateFields.vias = updateFields.vias.toUpperCase();
        if (updateFields.sector_bloqueo) updateFields.sector_bloqueo = updateFields.sector_bloqueo.toUpperCase();
        if (updateFields.motivo_protesta) updateFields.motivo_protesta = updateFields.motivo_protesta.toUpperCase();
        if (updateFields.generador_protesta) updateFields.generador_protesta = updateFields.generador_protesta.toUpperCase();
        if (updateFields.geoposicion) updateFields.geoposicion = updateFields.geoposicion.toUpperCase();
        if (updateFields.observaciones) updateFields.observaciones = updateFields.observaciones.toUpperCase();


        const updatedProtesta = await Protesta.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedProtesta) {
            return res.status(404).json({ message: 'Registro de protesta no encontrado para actualizar.' });
        }

        res.status(200).json(updatedProtesta);

    } catch (error) {
        console.error('Error al actualizar el registro de protesta:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el registro de protesta.', error: error.message });
    }
};

// @desc    Eliminar un registro de protesta
// @route   DELETE /api/protestas/:id
// @access  Private
exports.deleteProtesta = async (req, res) => {
    try {
        const protesta = await Protesta.findByIdAndDelete(req.params.id);
        if (!protesta) {
            return res.status(404).json({ message: 'Registro de protesta no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Registro de protesta eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el registro de protesta:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el registro de protesta.', error: error.message });
    }
};

// @desc    Finalizar una protesta (actualiza hora_finalizacion, fecha_finalizacion y tiempo_total_bloqueo)
// @route   PUT /api/protestas/:id/finalizar
// @access  Private
exports.finalizarProtesta = async (req, res) => {
    try {
        const { hora_finalizacion, fecha_finalizacion, tiempo_total_bloqueo } = req.body;

        if (!hora_finalizacion || !fecha_finalizacion || !tiempo_total_bloqueo) {
            return res.status(400).json({ message: 'Hora de finalización, fecha de finalización y tiempo total de bloqueo son obligatorios para finalizar la protesta.' });
        }

        const updatedProtesta = await Protesta.findByIdAndUpdate(
            req.params.id,
            {
                hora_finalizacion,
                fecha_finalizacion: parseDateForDB(fecha_finalizacion), // Usar la función auxiliar
                tiempo_total_bloqueo
            },
            { new: true, runValidators: true }
        );

        if (!updatedProtesta) {
            return res.status(404).json({ message: 'Protesta no encontrada para finalizar.' });
        }

        res.status(200).json(updatedProtesta);

    } catch (error) {
        console.error('Error al finalizar la protesta:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al finalizar la protesta.', error: error.message });
    }
};