// SIS-FP/backend/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// Todas las rutas del dashboard requieren autenticación
router.use(protect);

// Ruta principal para obtener todos los datos del dashboard
router.get('/', dashboardController.getDashboardData);

// Puedes añadir rutas específicas si necesitas datos muy detallados para un solo gráfico
// Por ejemplo:
// router.get('/personal-hour-data', dashboardController.getPersonalHourData);
// router.get('/vehicular-type-data', dashboardController.getVehicularTypeData);

module.exports = router;