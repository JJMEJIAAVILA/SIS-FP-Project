// SIS-FP/backend/controllers/antecedenteController.js
const Antecedente = require('../models/Antecedente');

// @desc    Obtener todos los antecedentes
// @route   GET /api/antecedentes
// @access  Protected
const getAntecedentes = async (req, res) => {
    try {
        const antecedentes = await Antecedente.find().sort({ item: 1 }); // Ordenar por ITEM
        // *** CAMBIO CLAVE AQUÍ: Asegurarse de que la propiedad se llama 'antecedentes' ***
        res.status(200).json({ antecedentes: antecedentes }); // Exporta un objeto con la clave 'antecedentes'
    } catch (error) {
        console.error('Error al obtener antecedentes:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los antecedentes.' });
    }
};

// @desc    Crear un nuevo antecedente
// @route   POST /api/antecedentes
// @access  Protected
const createAntecedente = async (req, res) => {
    const { item, nombre, numero_identificacion, empresa, dependencia, observaciones, resultado_verificacion } = req.body;

    // Validar campos obligatorios
    if (!item || !nombre || !numero_identificacion || !resultado_verificacion) {
        return res.status(400).json({ message: 'Los campos ITEM, Nombre, Número de Identificación y Resultado de Verificación son obligatorios.' });
    }

    try {
        // Verificar si el ITEM o el Número de Identificación ya existen
        const existingAntecedente = await Antecedente.findOne({ $or: [{ item }, { numero_identificacion }] });
        if (existingAntecedente) {
            let message = '';
            if (existingAntecedente.item === item) {
                message = `El ITEM ${item} ya existe.`;
            } else if (existingAntecedente.numero_identificacion === numero_identificacion) {
                message = `El Número de Identificación ${numero_identificacion} ya está registrado.`;
            }
            return res.status(409).json({ message });
        }

        const newAntecedente = new Antecedente({
            item,
            nombre,
            numero_identificacion,
            empresa,
            dependencia,
            observaciones,
            resultado_verificacion
        });

        await newAntecedente.save();
        res.status(201).json({ message: 'Antecedente creado exitosamente.', antecedente: newAntecedente });
    } catch (error) {
        console.error('Error al crear antecedente:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el antecedente.' });
    }
};

// @desc    Actualizar un antecedente por ID
// @route   PUT /api/antecedentes/:id
// @access  Protected
const updateAntecedente = async (req, res) => {
    const { id } = req.params;
    const { item, nombre, numero_identificacion, empresa, dependencia, observaciones, resultado_verificacion } = req.body;

    try {
        const antecedente = await Antecedente.findById(id);

        if (!antecedente) {
            return res.status(404).json({ message: 'Antecedente no encontrado.' });
        }

        // Si se intenta cambiar el ITEM o el Número de Identificación, verificar unicidad
        if (item && item !== antecedente.item) {
            const existingItem = await Antecedente.findOne({ item });
            if (existingItem && String(existingItem._id) !== id) {
                return res.status(409).json({ message: `El ITEM ${item} ya existe en otro registro.` });
            }
        }
        if (numero_identificacion && numero_identificacion !== antecedente.numero_identificacion) {
            const existingNI = await Antecedente.findOne({ numero_identificacion });
            if (existingNI && String(existingNI._id) !== id) {
                return res.status(409).json({ message: `El Número de Identificación ${numero_identificacion} ya está registrado en otro registro.` });
            }
        }

        antecedente.item = item || antecedente.item;
        antecedente.nombre = nombre ? nombre.toUpperCase() : antecedente.nombre;
        antecedente.numero_identificacion = numero_identificacion || antecedente.numero_identificacion;
        antecedente.empresa = empresa ? empresa.toUpperCase() : antecedente.empresa;
        antecedente.dependencia = dependencia ? dependencia.toUpperCase() : antecedente.dependencia;
        antecedente.observaciones = observaciones ? observaciones.toUpperCase() : antecedente.observaciones;
        antecedente.resultado_verificacion = resultado_verificacion || antecedente.resultado_verificacion;

        await antecedente.save();
        res.status(200).json({ message: 'Antecedente actualizado exitosamente.', antecedente });
    } catch (error) {
        console.error('Error al actualizar antecedente:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el antecedente.' });
    }
};

// @desc    Eliminar un antecedente por ID
// @route   DELETE /api/antecedentes/:id
// @access  Protected
const deleteAntecedente = async (req, res) => {
    const { id } = req.params;

    try {
        const antecedente = await Antecedente.findByIdAndDelete(id);

        if (!antecedente) {
            return res.status(404).json({ message: 'Antecedente no encontrado.' });
        }

        res.status(200).json({ message: 'Antecedente eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar antecedente:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el antecedente.' });
    }
};

module.exports = {
    getAntecedentes,
    createAntecedente,
    updateAntecedente,
    deleteAntecedente
};