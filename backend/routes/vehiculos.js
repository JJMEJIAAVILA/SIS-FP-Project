// SIS-FP/backend/routes/vehiculos.js
const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const authMiddleware = require('../middleware/authMiddleware'); // Asumiendo que usas el mismo middleware de auth

// Rutas para las operaciones CRUD de vehículos, protegidas por autenticación
router.get('/', authMiddleware, vehiculoController.getVehiculos);
router.post('/', authMiddleware, vehiculoController.createVehiculo);
router.put('/:id', authMiddleware, vehiculoController.updateVehiculo); // Para actualizar cualquier campo
router.put('/:id/salida', authMiddleware, vehiculoController.registrarSalidaVehiculo); // Ruta específica para registrar salida
router.delete('/:id', authMiddleware, vehiculoController.deleteVehiculo);

module.exports = router;