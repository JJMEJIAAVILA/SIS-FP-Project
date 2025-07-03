// SIS-FP/backend/controllers/embarcacionController.js - CORREGIDO
const asyncHandler = require('express-async-handler'); // Importa el middleware para manejar errores asíncronos
const Embarcacion = require('../models/Embarcacion'); // Importa el modelo de Embarcacion

// @desc    Obtener todas las embarcaciones
// @route   GET /api/embarcaciones
// @access  Private (requiere autenticación JWT)
const getEmbarcaciones = asyncHandler(async (req, res) => {
    // CAMBIO: Ordenar por fecha de creación más antigua primero (createdAt: 1)
    const embarcaciones = await Embarcacion.find({}).sort({ createdAt: 1 });
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

    // CAMBIO: Asegurarse de que fechaRegistro sea un objeto Date
    const fechaRegistroDate = new Date(req.body.fechaRegistro);

    const embarcacion = await Embarcacion.create({
        fechaRegistro: fechaRegistroDate, // Usar el objeto Date
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
        throw new Error('Embarcación no encontrada'); // Corregido 'new new Error' a 'new Error'
    }

    // CAMBIO: Si fechaRegistro viene en el body, asegúrate de que sea un objeto Date
    const updateData = {
        piloto: req.body.piloto ? req.body.piloto.toUpperCase() : embarcacion.piloto,
        nombre_embarcacion: req.body.nombre_embarcacion ? req.body.nombre_embarcacion.toUpperCase() : embarcacion.nombre_embarcacion,
        tipo_embarcacion: req.body.tipo_embarcacion ? req.body.tipo_embarcacion.toUpperCase() : embarcacion.tipo_embarcacion,
        hora_entrada: req.body.hora_entrada || embarcacion.hora_entrada,
        observaciones: req.body.observaciones ? req.body.observaciones.toUpperCase() : embarcacion.observaciones
    };

    if (req.body.fechaRegistro) {
        updateData.fechaRegistro = new Date(req.body.fechaRegistro);
    } else {
        updateData.fechaRegistro = embarcacion.fechaRegistro; // Mantener la fecha existente si no se proporciona
    }

    const updatedEmbarcacion = await Embarcacion.findByIdAndUpdate(
        id,
        updateData,
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
    embarcacion.fecha_salida = new Date(fecha_salida); // CAMBIO: Convertir a objeto Date

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