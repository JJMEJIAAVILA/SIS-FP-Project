const Empresa = require('../models/Empresa'); // Ruta correcta para ir de 'controllers' a 'models'

// Obtener todas las empresas
exports.getEmpresas = async (req, res) => {
    try {
        const empresas = await Empresa.find().sort({ createdAt: -1 }); // Ordenar por las más recientes
        res.status(200).json(empresas);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener empresas.' });
    }
};

// Crear una nueva empresa
exports.createEmpresa = async (req, res) => {
    try {
        const {
            fecha_entrada,
            nombre_empresa,
            identificacion,
            area_ingreso,
            empresa,
            carne,
            tipo_empresa,
            area,
            dependencia,
            dispositivo,
            codigo_dispositivo,
            observaciones
        } = req.body;

        const newEmpresa = new Empresa({
            fecha_entrada,
            nombre_empresa,
            identificacion,
            area_ingreso,
            empresa,
            carne,
            tipo_empresa,
            area,
            dependencia,
            dispositivo,
            codigo_dispositivo,
            observaciones
        });

        await newEmpresa.save();
        res.status(201).json({ message: 'Empresa registrada exitosamente', empresa: newEmpresa });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear empresa.' });
    }
};

// Actualizar una empresa por ID
exports.updateEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEmpresa = await Empresa.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedEmpresa) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        res.status(200).json({ message: 'Empresa actualizada exitosamente', empresa: updatedEmpresa });
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar empresa.' });
    }
};

// Actualizar solo la fecha de salida de una empresa
exports.updateFechaSalida = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_salida } = req.body;

        const updatedEmpresa = await Empresa.findByIdAndUpdate(id, { fecha_salida }, { new: true });

        if (!updatedEmpresa) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        res.status(200).json({ message: 'Fecha de salida actualizada exitosamente', empresa: updatedEmpresa });
    } catch (error) {
        console.error('Error al actualizar fecha de salida:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar fecha de salida.' });
    }
};

// Eliminar una empresa por ID
exports.deleteEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEmpresa = await Empresa.findByIdAndDelete(id);

        if (!deletedEmpresa) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        res.status(200).json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar empresa.' });
    }
};