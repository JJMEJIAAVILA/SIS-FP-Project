// SIS-FP/backend/controllers/embarcacionController.js
const asyncHandler = require('express-async-handler'); // Importa el middleware para manejar errores asíncronos
const Embarcacion = require('../models/Embarcacion'); // Importa el modelo de Embarcacion

// @desc    Obtener todas las embarcaciones
// @route   GET /api/embarcaciones
// @access  Private (requiere autenticación JWT)
const getEmbarcaciones = asyncHandler(async (req, res) => {
    const embarcaciones = await Embarcacion.find({}); // Encuentra todas las embarcaciones
    res.status(200).json(embarcaciones);
});

// @desc    Crear una nueva embarcación
// @route   POST /api/embarcaciones
// @access  Private
const createEmbarcacion = asyncHandler(async (req, res) => {
    // Validación básica de los campos requeridos
    if (!req.body.fechaRegistro || !req.body.piloto || !req.body.nombre_embarcacion) {
        res.status(400);
        throw new Error('Por favor, ingresa todos los campos obligatorios: fecha de registro, piloto y nombre de la embarcación.');
    }

    const embarcacion = await Embarcacion.create({
        fechaRegistro: req.body.fechaRegistro,
        piloto: req.body.piloto.toUpperCase(), // Convertir a mayúsculas
        nombre_embarcacion: req.body.nombre_embarcacion.toUpperCase(), // Convertir a mayúsculas
        tipo_embarcacion: req.body.tipo_embarcacion ? req.body.tipo_embarcacion.toUpperCase() : '-',
        hora_entrada: req.body.hora_entrada || '-',
        observaciones: req.body.observaciones ? req.body.observaciones.toUpperCase() : '-'
        // hora_salida y fecha_salida se inicializan como null por defecto en el modelo
    });

    res.status(201).json(embarcacion);
});

// @desc    Actualizar una embarcación (edición general de campos)
// @route   PUT /api/embarcaciones/:id
// @access  Private
const updateEmbarcacion = asyncHandler(async (req, res) => {
    const { id } = req.params; // Obtener el ID de la URL
    const embarcacion = await Embarcacion.findById(id);

    if (!embarcacion) {
        res.status(404);
        throw new new Error('Embarcación no encontrada');
    }

    // Actualizar solo los campos que vienen en el body.
    // Usamos el valor existente si el campo no se proporciona en la solicitud.
    const updatedEmbarcacion = await Embarcacion.findByIdAndUpdate(
        id,
        {
            fechaRegistro: req.body.fechaRegistro || embarcacion.fechaRegistro,
            piloto: req.body.piloto ? req.body.piloto.toUpperCase() : embarcacion.piloto,
            nombre_embarcacion: req.body.nombre_embarcacion ? req.body.nombre_embarcacion.toUpperCase() : embarcacion.nombre_embarcacion,
            tipo_embarcacion: req.body.tipo_embarcacion ? req.body.tipo_embarcacion.toUpperCase() : embarcacion.tipo_embarcacion,
            hora_entrada: req.body.hora_entrada || embarcacion.hora_entrada,
            observaciones: req.body.observaciones ? req.body.observaciones.toUpperCase() : embarcacion.observaciones
            // hora_salida y fecha_salida NO se actualizan aquí; se manejan por updateSalidaEmbarcacion
        },
        { new: true, runValidators: true } // 'new: true' para devolver el documento actualizado; 'runValidators: true' para aplicar validadores del esquema
    );

    res.status(200).json(updatedEmbarcacion);
});

// @desc    Actualizar la hora y fecha de salida (zarpe) de una embarcación
// @route   PUT /api/embarcaciones/:id/salida
// @access  Private
const updateSalidaEmbarcacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hora_salida, fecha_salida } = req.body;

    if (!hora_salida || !fecha_salida) {
        res.status(400);
        throw new Error('Por favor, proporciona la hora y la fecha de zarpe.');
    }

    const embarcacion = await Embarcacion.findById(id);

    if (!embarcacion) {
        res.status(404);
        throw new Error('Embarcación no encontrada');
    }

    embarcacion.hora_salida = hora_salida;
    embarcacion.fecha_salida = fecha_salida;

    const updatedEmbarcacion = await embarcacion.save(); // Guardar los cambios

    res.status(200).json(updatedEmbarcacion);
});


// @desc    Eliminar una embarcación
// @route   DELETE /api/embarcaciones/:id
// @access  Private
const deleteEmbarcacion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const embarcacion = await Embarcacion.findById(id);

    if (!embarcacion) {
        res.status(404);
        throw new Error('Embarcación no encontrada');
    }

    await Embarcacion.deleteOne({ _id: id }); // Eliminar el documento

    res.status(200).json({ message: `Embarcación con ID ${id} eliminada correctamente` });
});

// Exportar todas las funciones del controlador
module.exports = {
    getEmbarcaciones,
    createEmbarcacion,
    updateEmbarcacion,
    updateSalidaEmbarcacion,
    deleteEmbarcacion
};