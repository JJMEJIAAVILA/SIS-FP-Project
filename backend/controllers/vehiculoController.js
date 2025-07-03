// SIS-FP/backend/controllers/vehiculoController.js - CORREGIDO
const Vehiculo = require('../models/Vehiculo');

// Obtener todos los vehículos
exports.getVehiculos = async (req, res) => {
    try {
        // CAMBIO: Ordenar por fecha de creación más antigua primero (createdAt: 1)
        const vehiculos = await Vehiculo.find().sort({ createdAt: 1 });
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

        // CAMBIO: Usar fechaRegistro directamente del body si viene, o generar un Date object si no.
        // Si el frontend ya envía fechaRegistro como ISO string, Mongoose lo parseará.
        // Si no viene, usamos la fecha y hora actual como un objeto Date.
        let fechaRegistro = req.body.fechaRegistro; // Asume que el frontend podría enviarlo
        if (!fechaRegistro) {
            fechaRegistro = new Date(); // Genera un objeto Date con la fecha y hora actuales
        } else {
            fechaRegistro = new Date(fechaRegistro); // Asegura que sea un objeto Date
        }


        const newVehiculo = new Vehiculo({
            fechaRegistro, // Ahora es un objeto Date
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
        // CAMBIO: Eliminado el manejo específico de error 11000 para placa,
        // ya que ahora se permiten placas duplicadas.
        // if (error.code === 11000) { // Error de clave duplicada (placa única)
        //     return res.status(409).json({ message: 'Ya existe un vehículo con esa placa.' });
        // }
        res.status(500).json({ message: 'Error interno del servidor al crear vehículo.' });
    }
};

// Actualizar un vehículo por ID (para edición completa si es necesario, o solo algunos campos)
exports.updateVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        // CAMBIO: Si fechaRegistro viene en el body, asegúrate de que sea un objeto Date
        if (req.body.fechaRegistro) {
            req.body.fechaRegistro = new Date(req.body.fechaRegistro);
        }

        const updatedVehiculo = await Vehiculo.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedVehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado.' });
        }
        res.status(200).json({ message: 'Vehículo actualizado exitosamente', vehiculo: updatedVehiculo });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        // CAMBIO: Eliminado el manejo específico de error 11000 para placa,
        // ya que ahora se permiten placas duplicadas.
        // if (error.code === 11000) { // Error de clave duplicada (placa única)
        //     return res.status(409).json({ message: 'Ya existe un vehículo con esa placa.' });
        // }
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

        // CAMBIO: Asegúrate de que fecha_salida sea un objeto Date
        const fechaSalidaDate = new Date(fecha_salida);

        const updatedVehiculo = await Vehiculo.findByIdAndUpdate(
            id,
            { hora_salida, fecha_salida: fechaSalidaDate },
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