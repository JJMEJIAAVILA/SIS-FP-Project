// SIS-FP/backend/routes/protestasRoutes.js - ACTUALIZADO

const express = require('express');
const router = express.Router();
const protestaController = require('../controllers/protestaController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Rutas principales para operaciones CRUD de protestas
router.post('/', protestaController.createProtesta);
router.get('/', protestaController.getProtestas);
router.get('/:id', protestaController.getProtestaById);
router.put('/:id', protestaController.updateProtesta);
router.delete('/:id', protestaController.deleteProtesta);

// NUEVA RUTA: Para finalizar una protesta
router.put('/:id/finalizar', protestaController.finalizarProtesta);

module.exports = router;