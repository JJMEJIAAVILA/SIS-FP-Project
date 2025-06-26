// SIS-FP/backend/routes/empresas.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    updateSalida
} = require('../controllers/empresaController');

// Rutas para la gestión de Empresas
router.route('/')
    .get(protect, getEmpresas)
    .post(protect, createEmpresa);

router.route('/:id')
    .put(protect, updateEmpresa)
    .delete(protect, deleteEmpresa);

// Nueva ruta para registrar la salida de una empresa
router.put('/:id/salida', protect, updateSalida);

module.exports = router;