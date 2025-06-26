// SIS-FP/backend/routes/camarasRoutes.js

const express = require('express');
const router = express.Router();
const camaraController = require('../controllers/camaraController');
// CORRECTO: Destructurar la función 'protect' directamente
const { protect } = require('../middleware/authMiddleware');

// Proteger todas las rutas de cámaras con el middleware de autenticación
// CORRECTO: Usar 'protect' directamente como middleware
router.use(protect);

// Rutas principales para operaciones CRUD de cámaras
router.post('/', camaraController.createCamara);
router.get('/', camaraController.getCamaras);
router.get('/:id', camaraController.getCamaraById);
router.put('/:id', camaraController.updateCamara);
router.delete('/:id', camaraController.deleteCamara);

// Rutas para el historial
router.get('/:id/historial', camaraController.getHistorial);
router.put('/:id/historial', camaraController.addHistorialEntry); // Usamos PUT para añadir una entrada y actualizar el estado

module.exports = router;