// SIS-FP/backend/controllers/fuerzaPublicaController.js

const FuerzaPublica = require('../models/FuerzaPublica');

// Función auxiliar para manejar la fecha y evitar el problema del día anterior
// Convierte una fecha string (YYYY-MM-DD) a un objeto Date que representa el inicio del día UTC
const parseDateForDB = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Divide "YYYY-MM-DD" en partes
    // Crea un objeto Date en UTC usando el año, mes (0-indexado) y día
    // Esto asegura que la fecha se guarde como el inicio de ese día en UTC,
    // sin importar la zona horaria del servidor.
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};

// @desc    Crear un nuevo registro de apoyo de la fuerza pública
// @route   POST /api/fuerza_publica
// @access  Private (requiere token de autenticación)
exports.createFuerzaPublica = async (req, res) => {
    try {
        const {
            fecha,
            fuerza_publica,
            unidades,
            hora_llegada,
            hora_salida,
            accion_realizada,
            observaciones
        } = req.body;

        // Validación de campos obligatorios
        if (!fecha || !fuerza_publica) {
            return res.status(400).json({ message: 'La fecha y la fuerza pública son campos obligatorios.' });
        }

        const newFuerzaPublica = new FuerzaPublica({
            fecha: parseDateForDB(fecha), // Usar la función auxiliar para la fecha
            fuerza_publica,
            unidades,
            hora_llegada,
            hora_salida,
            accion_realizada,
            observaciones
        });

        const savedFuerzaPublica = await newFuerzaPublica.save();
        res.status(201).json(savedFuerzaPublica);

    } catch (error) {
        console.error('Error al crear el registro de fuerza pública:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear el registro de fuerza pública.', error: error.message });
    }
};

// @desc    Obtener todos los registros de apoyo de la fuerza pública
// @route   GET /api/fuerza_publica
// @access  Private
exports.getFuerzaPublica = async (req, res) => {
    try {
        const fuerzaPublica = await FuerzaPublica.find().sort({ fecha: -1, createdAt: -1 }); // Ordenar por fecha y creación descendente
        res.status(200).json({ fuerzaPublica });
    } catch (error) {
        console.error('Error al obtener los registros de fuerza pública:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los registros de fuerza pública.', error: error.message });
    }
};

// @desc    Obtener un registro de apoyo de la fuerza pública por ID
// @route   GET /api/fuerza_publica/:id
// @access  Private
exports.getFuerzaPublicaById = async (req, res) => {
    try {
        const fuerzaPublica = await FuerzaPublica.findById(req.params.id);
        if (!fuerzaPublica) {
            return res.status(404).json({ message: 'Registro de fuerza pública no encontrado.' });
        }
        res.status(200).json(fuerzaPublica);
    } catch (error) {
        console.error('Error al obtener el registro por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el registro por ID.', error: error.message });
    }
};

// @desc    Actualizar un registro de apoyo de la fuerza pública
// @route   PUT /api/fuerza_publica/:id
// @access  Private
exports.updateFuerzaPublica = async (req, res) => {
    try {
        const { fecha, ...otherFields } = req.body;

        const updateFields = { ...otherFields };

        // Convertir la fecha a objeto Date si viene definida, usando la función auxiliar
        if (fecha) {
            updateFields.fecha = parseDateForDB(fecha);
        }

        const updatedFuerzaPublica = await FuerzaPublica.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true } // new: true devuelve el documento actualizado; runValidators: true ejecuta validadores del esquema
        );

        if (!updatedFuerzaPublica) {
            return res.status(404).json({ message: 'Registro de fuerza pública no encontrado para actualizar.' });
        }

        res.status(200).json(updatedFuerzaPublica);

    } catch (error) {
        console.error('Error al actualizar el registro de fuerza pública:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el registro de fuerza pública.', error: error.message });
    }
};

// @desc    Eliminar un registro de apoyo de la fuerza pública
// @route   DELETE /api/fuerza_publica/:id
// @access  Private
exports.deleteFuerzaPublica = async (req, res) => {
    try {
        const fuerzaPublica = await FuerzaPublica.findByIdAndDelete(req.params.id);
        if (!fuerzaPublica) {
            return res.status(404).json({ message: 'Registro de fuerza pública no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Registro de fuerza pública eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el registro de fuerza pública:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el registro de fuerza pública.', error: error.message });
    }
};