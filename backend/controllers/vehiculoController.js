// SIS-FP/backend/controllers/vehiculoController.js
const Vehiculo = require('../models/Vehiculo');

// Obtener todos los vehículos
exports.getVehiculos = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.find().sort({ createdAt: -1 }); // Ordenar por los más recientes
        res.status(200).json(vehiculos);
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener vehículos.' });
    }
};

// Crear un nuevo vehículo
exports.createVehiculo = async (req, res) => {
    try {
        const {
            conductor,
            empresa,
            placa,
            tipo_vehiculo,
            hora_entrada,
            parqueadero_interno,
            parqueadero_visitantes,
            observaciones
        } = req.body;

        // Validar campos requeridos
        if (!conductor || !empresa || !placa || !hora_entrada) {
            return res.status(400).json({ message: 'Faltan campos requeridos para el registro del vehículo.' });
        }

        // Generar fechaRegistro en el backend si no viene del frontend
        const now = new Date();
        const fechaRegistro = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5); // YYYY-MM-DD HH:MM

        const newVehiculo = new Vehiculo({
            fechaRegistro,
            conductor,
            empresa,
            placa,
            tipo_vehiculo,
            hora_entrada,
            parqueadero_interno,
            parqueadero_visitantes,
            observaciones
        });

        await newVehiculo.save();
        res.status(201).json({ message: 'Vehículo registrado exitosamente', vehiculo: newVehiculo });
    } catch (error) {
        console.error('Error al crear vehículo:', error);
        if (error.code === 11000) { // Error de clave duplicada (placa única)
            return res.status(409).json({ message: 'Ya existe un vehículo con esa placa.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear vehículo.' });
    }
};

// Actualizar un vehículo por ID (para edición completa si es necesario, o solo algunos campos)
exports.updateVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedVehiculo = await Vehiculo.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedVehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }
        res.status(200).json({ message: 'Vehículo actualizado exitosamente', vehiculo: updatedVehiculo });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        if (error.code === 11000) { // Error de clave duplicada (placa única)
            return res.status(409).json({ message: 'Ya existe un vehículo con esa placa.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar vehículo.' });
    }
};

// Registrar la salida de un vehículo por ID (actualizar hora_salida y fecha_salida)
exports.registrarSalidaVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { hora_salida, fecha_salida } = req.body;

        if (!hora_salida || !fecha_salida) {
            return res.status(400).json({ message: 'Hora y Fecha de salida son obligatorias.' });
        }

        const updatedVehiculo = await Vehiculo.findByIdAndUpdate(
            id,
            { hora_salida, fecha_salida },
            { new: true }
        );

        if (!updatedVehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }
        res.status(200).json({ message: 'Salida de vehículo registrada exitosamente', vehiculo: updatedVehiculo });
    } catch (error) {
        console.error('Error al registrar salida de vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar salida de vehículo.' });
    }
};

// Eliminar un vehículo por ID
exports.deleteVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVehiculo = await Vehiculo.findByIdAndDelete(id);

        if (!deletedVehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }
        res.status(200).json({ message: 'Vehículo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar vehículo.' });
    }
};