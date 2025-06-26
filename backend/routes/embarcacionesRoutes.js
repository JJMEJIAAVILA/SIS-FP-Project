// SIS-FP/backend/routes/embarcacionesRoutes.js
const express = require('express');
const router = express.Router();
const {
    getEmbarcaciones,
    createEmbarcacion,
    updateEmbarcacion,
    updateSalidaEmbarcacion, // Importa la función para registrar zarpe
    deleteEmbarcacion
} = require('../controllers/embarcacionController'); // Importa todas las funciones del controlador

const { protect } = require('../middleware/authMiddleware'); // ¡Importa la función 'protect' desestructurada!

// Definición de las rutas para Embarcaciones
// Todas estas rutas están protegidas por el middleware 'protect'
router.route('/')
    .get(protect, getEmbarcaciones) // GET para obtener todas las embarcaciones
    .post(protect, createEmbarcacion); // POST para crear una nueva embarcación

router.route('/:id')
    .put(protect, updateEmbarcacion) // PUT para actualizar una embarcación (edición general)
    .delete(protect, deleteEmbarcacion); // DELETE para eliminar una embarcación

// Ruta específica para actualizar la hora y fecha de salida (zarpe)
router.put('/:id/salida', protect, updateSalidaEmbarcacion); // PUT para registrar zarpe

module.exports = router;