const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController'); // Ruta correcta para ir de 'routes' a 'controllers'
const authMiddleware = require('../middleware/authMiddleware'); // Ruta correcta para ir de 'routes' a 'middleware'

// Rutas para las operaciones CRUD de empresas, protegidas por autenticación
router.get('/', authMiddleware, empresaController.getEmpresas);
router.post('/', authMiddleware, empresaController.createEmpresa);
router.put('/:id', authMiddleware, empresaController.updateEmpresa);
router.put('/:id/salida', authMiddleware, empresaController.updateFechaSalida); // Ruta específica para actualizar salida
router.delete('/:id', authMiddleware, empresaController.deleteEmpresa);

module.exports = router;