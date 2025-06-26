// SIS-FP/backend/routes/vehiculos.js
const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');

// *********************************************************************************
// CAMBIO CLAVE AQUÍ: Desestructurar 'protect' del módulo authMiddleware
// *********************************************************************************
const { protect } = require('../middleware/authMiddleware'); // <--- ¡CAMBIO APLICADO AQUÍ!

// Rutas para las operaciones CRUD de vehículos, protegidas por autenticación
router.get('/', protect, vehiculoController.getVehiculos); // Usar 'protect'
router.post('/', protect, vehiculoController.createVehiculo); // Usar 'protect'
router.put('/:id', protect, vehiculoController.updateVehiculo); // Usar 'protect'
router.put('/:id/salida', protect, vehiculoController.registrarSalidaVehiculo); // Usar 'protect'
router.delete('/:id', protect, vehiculoController.deleteVehiculo); // Usar 'protect'

module.exports = router;