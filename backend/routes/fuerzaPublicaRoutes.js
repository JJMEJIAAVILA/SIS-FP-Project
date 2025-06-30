// SIS-FP/backend/routes/fuerzaPublicaRoutes.js

const express = require('express');
const router = express.Router();
const fuerzaPublicaController = require('../controllers/fuerzaPublicaController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// Aplica el middleware de protección a todas las rutas de fuerza pública
router.use(protect);

// Rutas principales para operaciones CRUD de apoyo de la fuerza pública
router.post('/', fuerzaPublicaController.createFuerzaPublica);
router.get('/', fuerzaPublicaController.getFuerzaPublica);
router.get('/:id', fuerzaPublicaController.getFuerzaPublicaById);
router.put('/:id', fuerzaPublicaController.updateFuerzaPublica);
router.delete('/:id', fuerzaPublicaController.deleteFuerzaPublica);

module.exports = router;