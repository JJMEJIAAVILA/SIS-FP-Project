// SIS-FP/backend/controllers/adminUserController.js

const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Necesario para hashear contraseñas si se actualizan

// @desc    Obtener todos los usuarios (solo para administradores)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        // Excluir la contraseña de los resultados
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios.', error: error.message });
    }
};

// @desc    Obtener un usuario por ID (solo para administradores)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuario por ID.', error: error.message });
    }
};

// @desc    Crear un nuevo usuario (solo para administradores)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    const { username, email, password, telefono, idioma, tema, role } = req.body;

    // Validaciones básicas
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Nombre de usuario, correo electrónico, contraseña y rol son campos obligatorios.' });
    }
    if (!['admin', 'operator', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Rol inválido. Los roles permitidos son: admin, operator, viewer.' });
    }

    try {
        // Verificar si el usuario o correo ya existen
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario o el correo electrónico ya están registrados.' });
        }

        // Crear nuevo usuario. El pre-save hook en el modelo User hasheará la contraseña.
        const newUser = new User({
            username,
            email,
            password, // La contraseña se hasheará automáticamente por el hook 'pre-save'
            telefono: telefono || '',
            idioma: idioma || 'es',
            tema: tema || 'oscuro',
            role
        });

        const savedUser = await newUser.save();
        // Devolver el usuario sin la contraseña
        const userResponse = savedUser.toObject();
        delete userResponse.password;
        res.status(201).json({ message: 'Usuario creado exitosamente.', user: userResponse });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.code === 11000) { // Error de duplicado de MongoDB
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear usuario.', error: error.message });
    }
};

// @desc    Actualizar un usuario existente (solo para administradores)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    const { username, email, password, telefono, idioma, tema, role } = req.body;

    try {
        const user = await User.findById(req.params.id).select('+password'); // Seleccionar password para poder hashear si cambia
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
        }

        // Validar que el rol sea válido si se proporciona
        if (role && !['admin', 'operator', 'viewer'].includes(role)) {
            return res.status(400).json({ message: 'Rol inválido. Los roles permitidos son: admin, operator, viewer.' });
        }

        // Actualizar campos si se proporcionan y son diferentes
        if (username !== undefined && username !== user.username) user.username = username;
        if (email !== undefined && email !== user.email) user.email = email;
        if (telefono !== undefined && telefono !== user.telefono) user.telefono = telefono;
        if (idioma !== undefined && idioma !== user.idioma) user.idioma = idioma;
        if (tema !== undefined && tema !== user.tema) user.tema = tema;
        if (role !== undefined && role !== user.role) user.role = role;

        // Si se proporciona una nueva contraseña, hashearla
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save(); // save() disparará el pre-save hook si la contraseña cambia

        // Devolver el usuario actualizado sin la contraseña
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: userResponse });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === 11000) { // Error de duplicado de MongoDB
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `El ${field} ya está en uso.` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar usuario.', error: error.message });
    }
};

// @desc    Eliminar un usuario (solo para administradores)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
        }

        // Opcional: Evitar que un admin se elimine a sí mismo o que se elimine el único admin
        // if (user.role === 'admin' && req.user.id === req.params.id) {
        //     return res.status(400).json({ message: 'Un administrador no puede eliminarse a sí mismo.' });
        // }

        await user.deleteOne(); // Usar deleteOne() en lugar de findByIdAndDelete() si se cargó el documento
        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar usuario.', error: error.message });
    }
};