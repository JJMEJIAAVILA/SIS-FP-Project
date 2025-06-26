// SIS-FP/backend/routes/antecedentesRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta
const {
    getAntecedentes,
    createAntecedente,
    updateAntecedente,
    deleteAntecedente
} = require('../controllers/antecedenteController');

// Rutas para la gestión de Antecedentes
router.route('/')
    .get(protect, getAntecedentes)
    .post(protect, createAntecedente);

router.route('/:id')
    .put(protect, updateAntecedente)
    .delete(protect, deleteAntecedente);

module.exports = router;