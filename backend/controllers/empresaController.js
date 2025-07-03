// SIS-FP/backend/controllers/empresaController.js - CORREGIDO
const Empresa = require('../models/Empresa');

// @desc    Obtener todas las empresas
// @route   GET /api/empresas
// @access  Protected
const getEmpresas = async (req, res) => {
    try {
        // CAMBIO: Ordenar por fecha de creación más antigua primero (createdAt: 1)
        const empresas = await Empresa.find().sort({ createdAt: 1 });
        res.status(200).json({ empresas });
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las empresas.' });
    }
};

// @desc    Crear una nueva empresa
// @route   POST /api/empresas
// @access  Protected
const createEmpresa = async (req, res) => {
    const {
        fecha_entrada, hora_entrada,
        nombre_empresa, identificacion, area_ingreso, empresa, carne,
        tipo_empresa, dependencia, dispositivo, codigo_dispositivo, observaciones
    } = req.body;

    if (!fecha_entrada || !hora_entrada || !nombre_empresa || !identificacion || !area_ingreso || !empresa || !tipo_empresa) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios: Fecha Entrada, Hora Entrada, Nombre Empresa, Identificación, Área Ingreso, Empresa, Tipo Empresa.' });
    }

    try {
        // CAMBIO: Eliminado el check de 'existingEmpresa' para permitir múltiples registros
        // if (existingEmpresa) {
        //     return res.status(409).json({ message: `La identificación ${identificacion} ya está registrada.` });
        // }

        const newEmpresa = new Empresa({
            fecha_entrada: new Date(fecha_entrada),
            hora_entrada,
            nombre_empresa: nombre_empresa.toUpperCase(),
            identificacion: identificacion.toUpperCase(),
            area_ingreso: area_ingreso.toUpperCase(),
            empresa: empresa.toUpperCase(),
            carne: carne ? carne.toUpperCase() : '-',
            tipo_empresa: tipo_empresa.toUpperCase(),
            dependencia: dependencia ? dependencia.toUpperCase() : '-',
            dispositivo: dispositivo ? dispositivo.toUpperCase() : '-',
            codigo_dispositivo: codigo_dispositivo ? codigo_dispositivo.toUpperCase() : '-',
            observaciones: observaciones ? observaciones.toUpperCase() : '-'
        });

        await newEmpresa.save();
        res.status(201).json({ message: 'Registro de empresa creado exitosamente.', empresa: newEmpresa });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el registro de empresa.' });
    }
};

// @desc    Actualizar una empresa por ID
// @route   PUT /api/empresas/:id
// @access  Protected
const updateEmpresa = async (req, res) => {
    const { id } = req.params;
    const {
        fecha_entrada, hora_entrada,
        nombre_empresa, identificacion, area_ingreso, empresa, carne,
        tipo_empresa, dependencia, dispositivo, codigo_dispositivo, observaciones
    } = req.body;

    try {
        const empresaToUpdate = await Empresa.findById(id);

        if (!empresaToUpdate) {
            return res.status(404).json({ message: 'Registro de empresa no encontrado.' });
        }

        // CAMBIO: Eliminado el check de unicidad para 'identificacion' al actualizar,
        // ya que la identificación puede repetirse en diferentes registros.
        // if (identificacion && identificacion.toUpperCase() !== empresaToUpdate.identificacion) {
        //     const existingIdentificacion = await Empresa.findOne({ identificacion: identificacion.toUpperCase() });
        //     if (existingIdentificacion && String(existingIdentificacion._id) !== id) {
        //         return res.status(409).json({ message: `La identificación ${identificacion} ya está registrada en otro registro.` });
        //     }
        // }

        empresaToUpdate.fecha_entrada = fecha_entrada ? new Date(fecha_entrada) : empresaToUpdate.fecha_entrada;
        empresaToUpdate.hora_entrada = hora_entrada || empresaToUpdate.hora_entrada;
        empresaToUpdate.nombre_empresa = nombre_empresa ? nombre_empresa.toUpperCase() : empresaToUpdate.nombre_empresa;
        empresaToUpdate.identificacion = identificacion ? identificacion.toUpperCase() : empresaToUpdate.identificacion;
        empresaToUpdate.area_ingreso = area_ingreso ? area_ingreso.toUpperCase() : empresaToUpdate.area_ingreso;
        empresaToUpdate.empresa = empresa ? empresa.toUpperCase() : empresaToUpdate.empresa;
        empresaToUpdate.carne = carne ? carne.toUpperCase() : empresaToUpdate.carne;
        empresaToUpdate.tipo_empresa = tipo_empresa ? tipo_empresa.toUpperCase() : empresaToUpdate.tipo_empresa;
        empresaToUpdate.dependencia = dependencia ? dependencia.toUpperCase() : empresaToUpdate.dependencia;
        empresaToUpdate.dispositivo = dispositivo ? dispositivo.toUpperCase() : empresaToUpdate.dispositivo;
        empresaToUpdate.codigo_dispositivo = codigo_dispositivo ? codigo_dispositivo.toUpperCase() : empresaToUpdate.codigo_dispositivo;
        empresaToUpdate.observaciones = observaciones ? observaciones.toUpperCase() : empresaToUpdate.observaciones;

        await empresaToUpdate.save();
        res.status(200).json({ message: 'Registro de empresa actualizado exitosamente.', empresa: empresaToUpdate });
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el registro de empresa.' });
    }
};

// @desc    Eliminar una empresa por ID
// @route   DELETE /api/empresas/:id
// @access  Protected
const deleteEmpresa = async (req, res) => {
    const { id } = req.params;

    try {
        const empresa = await Empresa.findByIdAndDelete(id);

        if (!empresa) {
            return res.status(404).json({ message: 'Registro de empresa no encontrado.' });
        }

        res.status(200).json({ message: 'Registro de empresa eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el registro de empresa.' });
    }
};

// @desc    Registrar fecha y hora de salida para una empresa
// @route   PUT /api/empresas/:id/salida
// @access  Protected
const updateSalida = async (req, res) => {
    const { id } = req.params;
    const { fecha_salida, hora_salida } = req.body;

    if (!fecha_salida || !hora_salida) {
        return res.status(400).json({ message: 'La fecha y hora de salida son obligatorias.' });
    }

    try {
        const empresaToUpdate = await Empresa.findById(id);

        if (!empresaToUpdate) {
            return res.status(404).json({ message: 'Registro de empresa no encontrado.' });
        }

        empresaToUpdate.fecha_salida = new Date(fecha_salida);
        empresaToUpdate.hora_salida = hora_salida;

        await empresaToUpdate.save();
        res.status(200).json({ message: 'Fecha y hora de salida registradas exitosamente.', empresa: empresaToUpdate });
    } catch (error) {
        console.error('Error al registrar salida de empresa:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar la salida.' });
    }
};

module.exports = {
    getEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    updateSalida
};