// SIS-FP/backend/routes/lucesRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta
const {
    getLuces,
    createLuz,
    updateLuz,
    deleteLuz,
    reportarNuevaFalla,      // Nueva función
    marcarFallaResuelta,     // Nueva función
    eliminarFallaEspecifica  // Nueva función
} = require('../controllers/luzController');


// Rutas para la gestión de Luces principales
router.route('/')
    .get(protect, getLuces) // Proteger también la lectura si solo usuarios autenticados deben ver luces
    .post(protect, createLuz);

router.route('/:id')
    .put(protect, updateLuz)
    .delete(protect, deleteLuz);

// --- NUEVAS RUTAS PARA LA GESTIÓN DE FALLAS ANIDADAS EN LAS LUCES ---

// POST /api/luces/:luzId/fallas: Reportar una nueva falla para una luz específica
router.post('/:luzId/fallas', protect, reportarNuevaFalla);

// PUT /api/luces/:luzId/marcar-resuelto: Marcar la última falla pendiente de una luz como resuelta
router.put('/:luzId/marcar-resuelto', protect, marcarFallaResuelta);

// DELETE /api/luces/:luzId/fallas/:fallaId: Eliminar una falla específica del historial de una luz
router.delete('/:luzId/fallas/:fallaId', protect, eliminarFallaEspecifica);


module.exports = router;