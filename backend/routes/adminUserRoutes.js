// SIS-FP/backend/routes/adminUserRoutes.js

const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// Todas las rutas de administración de usuarios requieren autenticación y rol de 'admin'
router.use(protect); // Primero, asegurar que el usuario esté autenticado
router.use(authorizeRoles('admin')); // Luego, asegurar que el usuario tenga el rol de 'admin'

// Rutas para la gestión de usuarios por administradores
router.get('/', adminUserController.getUsers); // Obtener todos los usuarios
router.post('/', adminUserController.createUser); // Crear un nuevo usuario
router.get('/:id', adminUserController.getUserById); // Obtener un usuario por ID
router.put('/:id', adminUserController.updateUser); // Actualizar un usuario por ID
router.delete('/:id', adminUserController.deleteUser); // Eliminar un usuario por ID

module.exports = router;