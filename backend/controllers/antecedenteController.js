// SIS-FP/backend/controllers/antecedenteController.js - CORREGIDO (Validación de 6 meses)

const Antecedente = require('../models/Antecedente');

// @desc    Obtener todos los antecedentes
// @route   GET /api/antecedentes
// @access  Protected
const getAntecedentes = async (req, res) => {
    try {
        // CAMBIO: Ordenar por fechaRegistro (o createdAt) de forma ascendente para ver los más antiguos primero
        const antecedentes = await Antecedente.find().sort({ fechaRegistro: 1, createdAt: 1 });
        res.status(200).json({ antecedentes: antecedentes });
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
        // --- NUEVA VALIDACIÓN: No permitir verificación de la misma identificación antes de 6 meses ---
        const lastAntecedente = await Antecedente.findOne({ numero_identificacion })
            .sort({ fechaRegistro: -1 }) // Obtener el registro más reciente
            .exec();

        if (lastAntecedente) {
            // Usar fechaRegistro si existe, de lo contrario, usar createdAt (si timestamps está habilitado en el modelo)
            const lastVerificationDate = lastAntecedente.fechaRegistro || lastAntecedente.createdAt;

            if (lastVerificationDate) {
                const sixMonthsLater = new Date(lastVerificationDate);
                sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6); // Añadir 6 meses

                const now = new Date(); // Fecha y hora actuales

                if (now < sixMonthsLater) {
                    // Si no han pasado 6 meses, no permitir la verificación
                    // Formatear la fecha para el mensaje de error (YYYY-MM-DD)
                    const nextVerificationAllowedDate = sixMonthsLater.toISOString().split('T')[0];
                    return res.status(409).json({
                        message: `La verificación para el Número de Identificación ${numero_identificacion} no se puede realizar hasta el ${nextVerificationAllowedDate}. Han pasado menos de 6 meses desde la última verificación.`
                    });
                }
            }
        }
        // --- FIN NUEVA VALIDACIÓN ---

        // Validar si el ITEM ya existe (la validación de numero_identificacion ahora la maneja la lógica de los 6 meses)
        const existingItem = await Antecedente.findOne({ item });
        if (existingItem) {
            return res.status(409).json({ message: `El ITEM ${item} ya existe.` });
        }

        // Crear nuevo antecedente con los datos proporcionados
        const newAntecedente = new Antecedente({
            item,
            nombre: nombre.toUpperCase(), // Convertir a mayúsculas
            numero_identificacion,
            empresa: empresa ? empresa.toUpperCase() : '-', // Convertir a mayúsculas, default '-'
            dependencia: dependencia ? dependencia.toUpperCase() : '-', // Convertir a mayúsculas, default '-'
            observaciones: observaciones ? observaciones.toUpperCase() : '-', // Convertir a mayúsculas, default '-'
            resultado_verificacion: resultado_verificacion.toUpperCase(), // Convertir a mayúsculas
            fechaRegistro: new Date() // Establecer la fecha de registro al momento actual
        });

        await newAntecedente.save();
        res.status(201).json({ message: 'Antecedente creado exitosamente.', antecedente: newAntecedente });
    } catch (error) {
        console.error('Error al crear antecedente:', error);
        // Manejo de error específico para duplicados si el modelo tiene unique: true en item
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Error de duplicidad. El ITEM o Número de Identificación ya existe (revisar si hay índices únicos en la DB).' });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el antecedente.', error: error.message });
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

        // Si se intenta cambiar el ITEM, verificar unicidad con otros registros
        if (item && item !== antecedente.item) {
            const existingItem = await Antecedente.findOne({ item });
            if (existingItem && String(existingItem._id) !== id) {
                return res.status(409).json({ message: `El ITEM ${item} ya existe en otro registro.` });
            }
        }
        // No se permite cambiar numero_identificacion en la actualización si ya existe y no han pasado 6 meses
        // Si numero_identificacion se cambia, se debería validar la regla de los 6 meses para el nuevo NI
        // Por simplicidad, y para evitar re-verificaciones no intencionadas, si se cambia el NI,
        // se puede considerar como un nuevo registro para fines de esta validación, o simplemente no permitir el cambio si ya existe.
        // Para este caso, solo se mantiene la validación de unicidad para el ITEM.
        // Si se requiere la validación de 6 meses en la actualización de NI, sería una lógica más compleja.
        // Por ahora, solo se asegura que si el NI se cambia, no choque con otro existente (sin la regla de 6 meses).
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
        antecedente.resultado_verificacion = resultado_verificacion ? resultado_verificacion.toUpperCase() : antecedente.resultado_verificacion;

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