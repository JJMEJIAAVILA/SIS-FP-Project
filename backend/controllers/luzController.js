// SIS-FP/backend/controllers/luzController.js
const { Luz } = require('../models/Luz'); // Solo importamos Luz

// @desc    Obtener todas las luces
// @route   GET /api/luces
// @access  Protected (Mantener protegido para asegurar que solo usuarios autenticados puedan ver los datos)
const getLuces = async (req, res) => {
    try {
        const luces = await Luz.find().sort({ item: 1 }); // Ordenar por ITEM ascendente
        res.status(200).json({ luces }); // Solo enviamos las luces, no el historial separado
    } catch (error) {
        console.error('Error al obtener luces:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las luces.' });
    }
};

// @desc    Crear una nueva luz
// @route   POST /api/luces
// @access  Protected
const createLuz = async (req, res) => {
    const { item, area, circuito, luminaria, estado_actual } = req.body;

    if (!item || !area || !circuito || !luminaria || !estado_actual) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios.' });
    }

    try {
        const existingLuz = await Luz.findOne({ item });
        if (existingLuz) {
            return res.status(409).json({ message: `El ITEM ${item} ya existe.` });
        }

        const newLuz = new Luz({
            item,
            area,
            circuito,
            luminaria,
            estado_actual
            // historialFallas se inicializa como un array vacío por defecto
        });

        await newLuz.save();
        res.status(201).json({ message: 'Luz creada exitosamente.', luz: newLuz });
    } catch (error) {
        console.error('Error al crear luz:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la luz.' });
    }
};

// @desc    Actualizar una luz por ID
// @route   PUT /api/luces/:id
// @access  Protected
const updateLuz = async (req, res) => {
    const { id } = req.params;
    const { item, area, circuito, luminaria, estado_actual } = req.body; // No incluir historialFallas aquí

    try {
        const luz = await Luz.findById(id);

        if (!luz) {
            return res.status(404).json({ message: 'Luz no encontrada.' });
        }

        if (item && item !== luz.item) {
            const existingLuzWithNewItem = await Luz.findOne({ item });
            if (existingLuzWithNewItem && String(existingLuzWithNewItem._id) !== id) {
                return res.status(409).json({ message: `El ITEM ${item} ya existe en otra luz.` });
            }
        }

        luz.item = item || luz.item;
        luz.area = area ? area.toUpperCase() : luz.area;
        luz.circuito = circuito ? circuito.toUpperCase() : luz.circuito;
        luz.luminaria = luminaria ? luminaria.toUpperCase() : luz.luminaria;
        luz.estado_actual = estado_actual || luz.estado_actual;

        await luz.save();
        res.status(200).json({ message: 'Luz actualizada exitosamente.', luz });
    } catch (error) {
        console.error('Error al actualizar luz:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la luz.' });
    }
};

// @desc    Eliminar una luz por ID
// @route   DELETE /api/luces/:id
// @access  Protected
const deleteLuz = async (req, res) => {
    const { id } = req.params;

    try {
        const luz = await Luz.findByIdAndDelete(id); // Usa findByIdAndDelete para simplificar

        if (!luz) {
            return res.status(404).json({ message: 'Luz no encontrada.' });
        }

        // Ya no necesitamos eliminar historial de fallas por separado, ya está incrustado
        res.status(200).json({ message: 'Luz eliminada exitosamente (incluido su historial de fallas).' });
    } catch (error) {
        console.error('Error al eliminar luz:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la luz.' });
    }
};

// --- NUEVAS FUNCIONES PARA LA GESTIÓN DE FALLAS ANIDADAS ---

// @desc    Registrar una nueva falla para una luz
// @route   POST /api/luces/:luzId/fallas
// @access  Protected
const reportarNuevaFalla = async (req, res) => {
    const { luzId } = req.params;
    const { fecha_falla, observaciones, estado_falla_en_momento } = req.body;

    if (!fecha_falla || !estado_falla_en_momento) {
        return res.status(400).json({ message: 'La fecha de falla y el estado son obligatorios.' });
    }

    try {
        const luz = await Luz.findById(luzId);
        if (!luz) {
            return res.status(404).json({ message: 'Luz no encontrada.' });
        }

        // Crear el nuevo objeto de falla
        const newFalla = {
            fecha_falla: new Date(fecha_falla),
            observaciones: observaciones ? observaciones.toUpperCase() : '',
            estado_falla_en_momento: estado_falla_en_momento.toUpperCase()
        };

        luz.historialFallas.push(newFalla); // Añadir la nueva falla al array
        luz.estado_actual = estado_falla_en_momento.toUpperCase(); // Actualizar el estado de la luz
        await luz.save(); // Guardar los cambios en la luz

        res.status(201).json({ message: 'Falla reportada y luz actualizada exitosamente.', luz });
    } catch (error) {
        console.error('Error al reportar falla:', error);
        res.status(500).json({ message: 'Error interno del servidor al reportar la falla.' });
    }
};

// @desc    Marcar la última falla pendiente de una luz como resuelta
// @route   PUT /api/luces/:luzId/marcar-resuelto
// @access  Protected
const marcarFallaResuelta = async (req, res) => {
    const { luzId } = req.params;
    const { fecha_arreglo } = req.body;

    if (!fecha_arreglo) {
        return res.status(400).json({ message: 'La fecha de arreglo es obligatoria.' });
    }

    try {
        const luz = await Luz.findById(luzId);
        if (!luz) {
            return res.status(404).json({ message: 'Luz no encontrada.' });
        }

        // Encontrar la última falla pendiente (sin fecha_arreglo)
        const lastPendingFalla = luz.historialFallas
            .filter(f => !f.fecha_arreglo) // Filtra las que no tienen fecha de arreglo
            .sort((a, b) => new Date(b.fecha_falla) - new Date(a.fecha_falla))[0]; // La más reciente

        if (!lastPendingFalla) {
            return res.status(404).json({ message: 'No se encontraron fallas pendientes para esta luz.' });
        }

        lastPendingFalla.fecha_arreglo = new Date(fecha_arreglo); // Asignar fecha de arreglo
        luz.estado_actual = 'FUNCIONANDO'; // Poner la luz en estado FUNCIONANDO

        await luz.save(); // Guardar los cambios en la luz
        res.status(200).json({ message: 'Falla marcada como resuelta y luz actualizada.', luz });
    } catch (error) {
        console.error('Error al marcar falla como resuelta:', error);
        res.status(500).json({ message: 'Error interno del servidor al marcar la falla como resuelta.' });
    }
};

// @desc    Eliminar una falla específica del historial de una luz
// @route   DELETE /api/luces/:luzId/fallas/:fallaId
// @access  Protected
const eliminarFallaEspecifica = async (req, res) => {
    const { luzId, fallaId } = req.params;

    try {
        const luz = await Luz.findById(luzId);
        if (!luz) {
            return res.status(404).json({ message: 'Luz no encontrada.' });
        }

        // Filtrar el array para eliminar la falla por su _id (que Mongoose asigna automáticamente)
        const initialLength = luz.historialFallas.length;
        luz.historialFallas = luz.historialFallas.filter(falla => String(falla._id) !== fallaId);

        if (luz.historialFallas.length === initialLength) {
            return res.status(404).json({ message: 'Falla no encontrada en el historial de esta luz.' });
        }

        // Opcional: Re-evaluar el estado actual de la luz si se eliminó la última falla pendiente
        // Esto es una lógica más avanzada y puede no ser necesaria inmediatamente.
        // Si no hay fallas pendientes, la luz podría volver a FUNCIONANDO, pero cuidado con las múltiples fallas.
        const hasPendingFallas = luz.historialFallas.some(f => !f.fecha_arreglo);
        if (!hasPendingFallas && luz.estado_actual !== 'FUNCIONANDO') {
            luz.estado_actual = 'FUNCIONANDO';
        }


        await luz.save();
        res.status(200).json({ message: 'Falla eliminada del historial exitosamente.', luz });
    } catch (error) {
        console.error('Error al eliminar falla específica:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la falla.' });
    }
};


module.exports = {
    getLuces,
    createLuz,
    updateLuz,
    deleteLuz,
    reportarNuevaFalla,    // Nueva función para reportar falla
    marcarFallaResuelta,   // Nueva función para marcar como resuelto
    eliminarFallaEspecifica // Nueva función para eliminar falla específica
};