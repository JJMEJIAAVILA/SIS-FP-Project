// SIS-FP/backend/controllers/camaraController.js - CORREGIDO

const Camara = require('../models/Camara');

// @desc    Crear un nuevo registro de cámara
// @route   POST /api/camaras
// @access  Private (requiere token de autenticación)
exports.createCamara = async (req, res) => {
    try {
        // Validación de datos de entrada
        const { area, camara, tipo, estado_actual, observaciones_general } = req.body;
        if (!area || !camara || !tipo || !estado_actual) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
        }

        const newCamara = new Camara({
            area,
            camara,
            tipo,
            estado_actual,
            observaciones_general,
        });

        // CORRECCIÓN: Solo se registra la fecha de falla si el estado inicial no es 'FUNCIONANDO'
        // El campo 'ultima_fecha_arreglo' se mantendrá nulo al crear un nuevo registro.
        if (estado_actual !== 'FUNCIONANDO') {
            newCamara.historial.push({
                estado_en_momento: estado_actual,
                fecha_evento: new Date(),
                observaciones_historial: observaciones_general || 'Primer registro con falla/estado no funcionando'
            });
            // Asignar fecha de última falla si el estado no es 'FUNCIONANDO'
            newCamara.ultima_fecha_falla = new Date();
        }

        const savedCamara = await newCamara.save();
        res.status(201).json(savedCamara);

    } catch (error) {
        // Manejo de error de duplicado (código 11000 de MongoDB)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ya existe una cámara con ese nombre. Por favor, ingrese un nombre diferente.' });
        }
        console.error('Error al crear el registro de cámara:', error);
        res.status(500).json({ message: 'Error del servidor al crear el registro de cámara.', error: error.message });
    }
};

// @desc    Obtener todos los registros de cámaras
// @route   GET /api/camaras
// @access  Private
exports.getCamaras = async (req, res) => {
    try {
        const camaras = await Camara.find().sort({ camara: 1 }); // Ordenar alfabéticamente por nombre de cámara
        res.status(200).json({ camaras });
    } catch (error) {
        console.error('Error al obtener los registros de cámaras:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los registros de cámaras.', error: error.message });
    }
};

// @desc    Obtener un registro de cámara por ID
// @route   GET /api/camaras/:id
// @access  Private
exports.getCamaraById = async (req, res) => {
    try {
        const camara = await Camara.findById(req.params.id);
        if (!camara) {
            return res.status(404).json({ message: 'Registro de cámara no encontrado.' });
        }
        res.status(200).json(camara);
    } catch (error) {
        console.error('Error al obtener el registro por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el registro por ID.', error: error.message });
    }
};

// @desc    Actualizar un registro de cámara
// @route   PUT /api/camaras/:id
// @access  Private
exports.updateCamara = async (req, res) => {
    try {
        const { estado_actual, observaciones_general, ...otherFields } = req.body;
        const updateFields = { ...otherFields, estado_actual, observaciones_general };

        // Pre-actualización: Obtener el documento actual para comparar el estado
        const oldCamara = await Camara.findById(req.params.id);
        if (!oldCamara) {
            return res.status(404).json({ message: 'Registro de cámara no encontrado.' });
        }

        // Si el estado actual cambia, actualiza las fechas de última falla/arreglo
        if (oldCamara.estado_actual !== estado_actual) {
            if (estado_actual === 'NO FUNCIONA' || estado_actual === 'CON FALLAS') {
                updateFields.ultima_fecha_falla = new Date();
            } else if (estado_actual === 'FUNCIONANDO') {
                updateFields.ultima_fecha_arreglo = new Date(); // Esta lógica es correcta para las actualizaciones
            }
        }

        // Ejecutar la actualización con findByIdAndUpdate
        const updatedCamara = await Camara.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true } // `new: true` devuelve el documento actualizado
        );

        if (!updatedCamara) {
            return res.status(404).json({ message: 'Registro de cámara no encontrado para actualizar.' });
        }

        res.status(200).json(updatedCamara);

    } catch (error) {
        // Manejo de error de duplicado (código 11000 de MongoDB)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ya existe una cámara con ese nombre. Por favor, ingrese un nombre diferente.' });
        }
        console.error('Error al actualizar el registro de cámara:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el registro de cámara.', error: error.message });
    }
};

// @desc    Eliminar un registro de cámara
// @route   DELETE /api/camaras/:id
// @access  Private
exports.deleteCamara = async (req, res) => {
    try {
        const camara = await Camara.findByIdAndDelete(req.params.id);
        if (!camara) {
            return res.status(404).json({ message: 'Registro de cámara no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Registro de cámara eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el registro de cámara:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el registro de cámara.', error: error.message });
    }
};

// --- Funciones para el Historial ---

// @desc    Obtener el historial de una cámara por ID
// @route   GET /api/camaras/:id/historial
// @access  Private
exports.getHistorial = async (req, res) => {
    try {
        const camara = await Camara.findById(req.params.id);
        if (!camara) {
            return res.status(404).json({ message: 'Cámara no encontrada.' });
        }
        // Devolver el historial ordenado por fecha descendente
        const historialOrdenado = camara.historial.sort((a, b) => b.fecha_evento - a.fecha_evento);
        res.status(200).json({ historial: historialOrdenado });
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el historial.', error: error.message });
    }
};

// @desc    Añadir una nueva entrada al historial de una cámara y actualizar su estado
// @route   PUT /api/camaras/:id/historial
// @access  Private
exports.addHistorialEntry = async (req, res) => {
    try {
        const { estado_actual, fecha_evento, observaciones_historial } = req.body;

        const camara = await Camara.findById(req.params.id);
        if (!camara) {
            return res.status(404).json({ message: 'Cámara no encontrada.' });
        }

        // Validar que los campos del historial estén presentes
        if (!estado_actual || !fecha_evento) {
            return res.status(400).json({ message: 'Estado y fecha del evento son obligatorios para el historial.' });
        }

        const newEntry = {
            estado_en_momento: estado_actual,
            fecha_evento: new Date(fecha_evento),
            observaciones_historial: observaciones_historial || '-',
        };

        // Añadir la nueva entrada al inicio del array de historial
        camara.historial.unshift(newEntry);

        // Actualizar el estado_actual y las fechas de última falla/arreglo del documento principal
        camara.estado_actual = estado_actual;

        if (estado_actual === 'NO FUNCIONA' || estado_actual === 'CON FALLAS') {
            camara.ultima_fecha_falla = new Date(fecha_evento);
        } else if (estado_actual === 'FUNCIONANDO') {
            camara.ultima_fecha_arreglo = new Date(fecha_evento);
        }

        // Limitar el historial a un número razonable de entradas (ej: 50) para evitar que el documento crezca demasiado
        if (camara.historial.length > 50) {
            camara.historial.splice(50); // Elimina las entradas más antiguas
        }

        await camara.save();

        res.status(200).json(camara);

    } catch (error) {
        console.error('Error al añadir entrada al historial:', error);
        res.status(500).json({ message: 'Error del servidor al añadir entrada al historial.', error: error.message });
    }
};