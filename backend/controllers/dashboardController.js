// SIS-FP/backend/controllers/dashboardController.js - ACTUALIZADO y CORREGIDO (Julio 2025)
const Protesta = require('../models/Protesta');
const Empresa = require('../models/Empresa');
const FuerzaPublica = require('../models/FuerzaPublica');
const Vehiculo = require('../models/Vehiculo');
const Embarcacion = require('../models/Embarcacion');
const Antecedente = require('../models/Antecedente');
const Luz = require('../models/Luz');
const Camara = require('../models/Camara');

// Función auxiliar para parsear las fechas de filtro a un rango de UTC para la DB
const parseDateRangeForDB = (startDateString, endDateString) => {
    let dateFilter = {};

    if (!startDateString && !endDateString) {
        return {}; // Si no hay fechas, devuelve un objeto vacío para no aplicar filtro
    }

    const parseYMD = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return { year, month: month - 1, day }; // Restar 1 al mes porque Date.UTC espera meses 0-indexados
    };

    if (startDateString) {
        const { year, month, day } = parseYMD(startDateString);
        dateFilter.$gte = new Date(Date.UTC(year, month, day));
    }

    if (endDateString) {
        const { year, month, day } = parseYMD(endDateString);
        const nextDay = new Date(Date.UTC(year, month, day + 1));
        dateFilter.$lte = new Date(nextDay.getTime() - 1);
    }

    if (startDateString && !endDateString) {
        const { year, month, day } = parseYMD(startDateString);
        dateFilter.$gte = new Date(Date.UTC(year, month, day));
        const nextDay = new Date(Date.UTC(year, month, day + 1));
        dateFilter.$lte = new Date(nextDay.getTime() - 1);
    } else if (!startDateString && endDateString) {
        const { year, month, day } = parseYMD(endDateString);
        dateFilter.$gte = new Date(Date.UTC(year, month, day));
        const nextDay = new Date(Date.UTC(year, month, day + 1));
        dateFilter.$lte = new Date(nextDay.getTime() - 1);
    }

    return dateFilter;
};


// @desc    Obtener todos los datos agregados para el dashboard
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
    try {
        const { startDate, endDate, vehicleType, boatType } = req.query;

        // Construir el filtro de rango de fechas para las consultas de MongoDB
        const dateRangeFilter = parseDateRangeForDB(startDate, endDate);
        const applyDateFilter = Object.keys(dateRangeFilter).length > 0;

        // --- 1. Totales Generales (Contadores) ---
        const totalProtestas = await Protesta.countDocuments(applyDateFilter ? { fecha: dateRangeFilter } : {});
        const totalFuerzaPublica = await FuerzaPublica.countDocuments(applyDateFilter ? { fecha: dateRangeFilter } : {});

        const entradasPersonalEmpresasQuery = {};
        if (applyDateFilter) {
            entradasPersonalEmpresasQuery.fecha_entrada = dateRangeFilter;
        }
        const totalEntradasPersonalEmpresas = await Empresa.countDocuments(entradasPersonalEmpresasQuery);

        const antecedentesQuery = {};
        if (applyDateFilter) {
            antecedentesQuery.createdAt = dateRangeFilter;
        }
        const totalAntecedentes = await Antecedente.countDocuments(antecedentesQuery);

        const vehiculosQuery = {};
        if (applyDateFilter) {
            vehiculosQuery.fechaRegistro = dateRangeFilter;
        }
        const totalVehiculosRegistrados = await Vehiculo.countDocuments(vehiculosQuery);

        const embarcacionesQuery = {};
        if (applyDateFilter) {
            embarcacionesQuery.createdAt = dateRangeFilter;
        }
        const totalEmbarcacionesRegistradas = await Embarcacion.countDocuments(embarcacionesQuery);

        // --- 2. Gráfico: Ingreso de Personal por Hora (Desde Empresas) ---
        const personalHourMatch = {
            hora_entrada: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            personalHourMatch.fecha_entrada = dateRangeFilter;
        }
        const personalHourData = await Empresa.aggregate([
            { $match: personalHourMatch },
            { $group: { _id: "$hora_entrada", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        const personalHourChart = {
            labels: personalHourData.map(item => item.label),
            data: personalHourData.map(item => item.data)
        };

        // --- 3. Gráfico: Control Vehicular por Tipo (Desde Vehiculos) ---
        const vehicularTypeMatch = {
            tipo_vehiculo: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            vehicularTypeMatch.fechaRegistro = dateRangeFilter;
        }
        if (vehicleType) {
            vehicularTypeMatch.tipo_vehiculo = vehicleType.toUpperCase();
        }
        const vehicularTypeData = await Vehiculo.aggregate([
            { $match: vehicularTypeMatch },
            { $group: { _id: "$tipo_vehiculo", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        const vehicularTypeChart = {
            labels: vehicularTypeData.map(item => item.label),
            data: vehicularTypeData.map(item => item.data)
        };

        // --- 4. Gráfico: Control Ingreso de Embarcaciones por Tipo (Desde Embarcaciones) ---
        const embarcacionesTypeMatch = {
            tipo_embarcacion: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            embarcacionesTypeMatch.createdAt = dateRangeFilter;
        }
        if (boatType) {
            embarcacionesTypeMatch.tipo_embarcacion = boatType.toUpperCase();
        }
        const embarcacionesTypeData = await Embarcacion.aggregate([
            { $match: embarcacionesTypeMatch },
            { $group: { _id: "$tipo_embarcacion", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        const embarcacionesTypeChart = {
            labels: embarcacionesTypeData.map(item => item.label),
            data: embarcacionesTypeData.map(item => item.data)
        };

        // --- 5. Gráfico: Protestas por Motivo (Desde Protestas) ---
        const protestasMotivoMatch = {
            motivo_protesta: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            protestasMotivoMatch.fecha = dateRangeFilter;
        }
        const protestasMotivoData = await Protesta.aggregate([
            { $match: protestasMotivoMatch },
            { $group: { _id: "$motivo_protesta", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        const protestasMotivoChart = {
            labels: protestasMotivoData.map(item => item.label),
            data: protestasMotivoData.map(item => item.data)
        };

        // --- 6. Gráfico: Apoyos por Fuerza Pública (Desde FuerzaPublica) ---
        const fuerzaPublicaTypeMatch = {
            fuerza_publica: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            fuerzaPublicaTypeMatch.fecha = dateRangeFilter;
        }
        const fuerzaPublicaTypeData = await FuerzaPublica.aggregate([
            { $match: fuerzaPublicaTypeMatch },
            { $group: { _id: "$fuerza_publica", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        const fuerzaPublicaTypeChart = {
            labels: fuerzaPublicaTypeData.map(item => item.label),
            data: fuerzaPublicaTypeData.map(item => item.data)
        };

        // --- 7. Obtener Tipos Disponibles para Filtros (para selectores) ---
        const availableVehicleTypes = await Vehiculo.distinct('tipo_vehiculo');
        const availableBoatTypes = await Embarcacion.distinct('tipo_embarcacion');

        res.status(200).json({
            totales: {
                totalProtestas,
                totalFuerzaPublica,
                totalEntradasPersonalEmpresas,
                totalAntecedentes,
                totalVehiculosRegistrados,
                totalEmbarcacionesRegistradas
            },
            personalHour: personalHourChart,
            vehicularType: vehicularTypeChart,
            embarcacionesType: embarcacionesTypeChart,
            protestasMotivoChart: protestasMotivoChart,
            fuerzaPublicaTypeChart: fuerzaPublicaTypeChart,
            availableVehicleTypes: availableVehicleTypes.filter(Boolean).sort(),
            availableBoatTypes: availableBoatTypes.filter(Boolean).sort()
        });

    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error); // Mantener este para errores críticos
        res.status(500).json({ message: 'Error del servidor al obtener datos del dashboard.', error: error.message });
    }
};