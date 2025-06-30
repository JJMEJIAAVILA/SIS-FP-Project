// SIS-FP/backend/controllers/dashboardController.js - ACTUALIZADO para filtros de rango de fechas y LOGGING DETALLADO
// Corregido: Campo de fecha de Protesta de 'fecha_inicio' a 'fecha'
// Corregido: Campo de motivo de Protesta de 'motivo' a 'motivo_protesta'
// Corregido: Campo de identificación de Empresa de 'identificacion_personal' a 'identificacion'
// NUEVO: Añadido contador para Antecedentes

const Protesta = require('../models/Protesta');
const Empresa = require('../models/Empresa');
const FuerzaPublica = require('../models/FuerzaPublica');
const Vehiculo = require('../models/Vehiculo');
const Embarcacion = require('../models/Embarcacion');
const Antecedente = require('../models/Antecedente'); // Asegúrate de que este modelo exista si lo usas
const Luz = require('../models/Luz'); // Asegúrate de que este modelo exista si lo usas
const Camara = require('../models/Camara'); // Asegúrate de que este modelo exista si lo usas

// Función auxiliar para parsear las fechas de filtro a un rango de UTC para la DB
const parseDateRangeForDB = (startDateString, endDateString) => {
    let dateFilter = {};

    if (!startDateString && !endDateString) {
        console.log('parseDateRangeForDB: No se proporcionaron fechas, devolviendo filtro vacío.');
        return {}; // Si no hay fechas, devuelve un objeto vacío para no aplicar filtro
    }

    let start = null;
    let end = null;

    if (startDateString) {
        start = new Date(startDateString);
        // Asegurar que el inicio sea el comienzo del día en UTC
        dateFilter.$gte = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    }

    if (endDateString) {
        end = new Date(endDateString);
        // Asegurar que el fin sea el final del día en UTC
        // Sumamos un día a la fecha de fin y luego tomamos el comienzo de ese día
        // Esto captura todo el día de 'endDateString' hasta las 23:59:59.999 UTC
        dateFilter.$lte = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0) - 1);
    }

    // Si solo hay una fecha (ej. para 'specificDay' del frontend), nos aseguramos de que sea un rango de un día completo
    if (startDateString && !endDateString) {
        console.log('parseDateRangeForDB: Solo fecha de inicio proporcionada, creando rango de un día completo.');
        const singleDay = new Date(startDateString);
        dateFilter.$gte = new Date(Date.UTC(singleDay.getFullYear(), singleDay.getMonth(), singleDay.getDate()));
        dateFilter.$lte = new Date(Date.UTC(singleDay.getFullYear(), singleDay.getMonth(), singleDay.getDate() + 1, 0, 0, 0, 0) - 1);
    } else if (!startDateString && endDateString) {
        console.log('parseDateRangeForDB: Solo fecha de fin proporcionada, creando rango de un día con esa fecha.');
        const singleDay = new Date(endDateString);
        dateFilter.$gte = new Date(Date.UTC(singleDay.getFullYear(), singleDay.getMonth(), singleDay.getDate()));
        dateFilter.$lte = new Date(Date.UTC(singleDay.getFullYear(), singleDay.getMonth(), singleDay.getDate() + 1, 0, 0, 0, 0) - 1);
    }

    console.log('parseDateRangeForDB: Filtro de fecha generado FINAL:', JSON.stringify(dateFilter));
    return dateFilter;
};


// @desc    Obtener todos los datos agregados para el dashboard
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
    try {
        const { startDate, endDate, vehicleType, boatType } = req.query;

        console.log(`[Dashboard Controller] Solicitud recibida: startDate=${startDate}, endDate=${endDate}, vehicleType=${vehicleType}, boatType=${boatType}`);

        // Construir el filtro de rango de fechas para las consultas de MongoDB
        const dateRangeFilter = parseDateRangeForDB(startDate, endDate);
        const applyDateFilter = Object.keys(dateRangeFilter).length > 0;

        // --- 1. Totales Generales (Contadores) ---
        console.log('[Dashboard Controller] Obteniendo totales...');
        // Corregido: Usar 'fecha' en lugar de 'fecha_inicio' para Protesta
        const totalProtestas = await Protesta.countDocuments(applyDateFilter ? { fecha: dateRangeFilter } : {});
        console.log('  Total Protestas:', totalProtestas);

        const totalFuerzaPublica = await FuerzaPublica.countDocuments(applyDateFilter ? { fecha: dateRangeFilter } : {});
        console.log('  Total Fuerza Publica:', totalFuerzaPublica);

        // Contar personas verificadas desde el modelo Empresa
        // Corregido: Usar 'identificacion' en lugar de 'identificacion_personal'
        const personasVerifiedQuery = {
            identificacion: { $exists: true, $ne: null, $ne: '' } // CAMBIO: identificacion_personal a identificacion
        };
        if (applyDateFilter) {
            personasVerifiedQuery.fecha_entrada = dateRangeFilter;
        }
        const totalPersonasVerificadas = await Empresa.countDocuments(personasVerifiedQuery);
        console.log('  Total Personas Verificadas (Empresa):', totalPersonasVerificadas);

        // NUEVO: Contador para Antecedentes
        const antecedentesQuery = {};
        if (applyDateFilter) {
            antecedentesQuery.createdAt = dateRangeFilter; // Asumiendo que usas 'createdAt' para la fecha de registro
        }
        const totalAntecedentes = await Antecedente.countDocuments(antecedentesQuery);
        console.log('  Total Antecedentes Registrados:', totalAntecedentes);

        const vehiculosQuery = {};
        if (applyDateFilter) {
            vehiculosQuery.createdAt = dateRangeFilter;
        }
        const totalVehiculosRegistrados = await Vehiculo.countDocuments(vehiculosQuery);
        console.log('  Total Vehiculos Registrados:', totalVehiculosRegistrados);

        const embarcacionesQuery = {};
        if (applyDateFilter) {
            embarcacionesQuery.createdAt = dateRangeFilter;
        }
        const totalEmbarcacionesRegistradas = await Embarcacion.countDocuments(embarcacionesQuery);
        console.log('  Total Embarcaciones Registradas:', totalEmbarcacionesRegistradas);

        // Puedes añadir más totales aquí (ej. luces, cámaras)

        // --- 2. Gráfico: Ingreso de Personal por Hora (Desde Empresas) ---
        console.log('[Dashboard Controller] Agregando Personal por Hora...');
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
        console.log('  Personal Hour Data (raw):', personalHourData);
        const personalHourChart = {
            labels: personalHourData.map(item => item.label),
            data: personalHourData.map(item => item.data)
        };

        // --- 3. Gráfico: Control Vehicular por Tipo (Desde Vehiculos) ---
        console.log('[Dashboard Controller] Agregando Vehicular por Tipo...');
        const vehicularTypeMatch = {
            tipo_vehiculo: { $exists: true, $ne: null, $ne: '' }
        };
        if (applyDateFilter) {
            vehicularTypeMatch.createdAt = dateRangeFilter;
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
        console.log('  Vehicular Type Data (raw):', vehicularTypeData);
        const vehicularTypeChart = {
            labels: vehicularTypeData.map(item => item.label),
            data: vehicularTypeData.map(item => item.data)
        };

        // --- 4. Gráfico: Control Ingreso de Embarcaciones por Tipo (Desde Embarcaciones) ---
        console.log('[Dashboard Controller] Agregando Embarcaciones por Tipo...');
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
        console.log('  Embarcaciones Type Data (raw):', embarcacionesTypeData);
        const embarcacionesTypeChart = {
            labels: embarcacionesTypeData.map(item => item.label),
            data: embarcacionesTypeData.map(item => item.data)
        };

        // --- 5. Gráfico: Protestas por Motivo (Desde Protestas) ---
        console.log('[Dashboard Controller] Agregando Protestas por Motivo...');
        const protestasMotivoMatch = {
            motivo_protesta: { $exists: true, $ne: null, $ne: '' } // CAMBIO: 'motivo' a 'motivo_protesta'
        };
        if (applyDateFilter) {
            protestasMotivoMatch.fecha = dateRangeFilter; // CAMBIO: 'fecha_inicio' a 'fecha'
        }
        const protestasMotivoData = await Protesta.aggregate([
            { $match: protestasMotivoMatch },
            { $group: { _id: "$motivo_protesta", count: { $sum: 1 } } }, // CAMBIO: '$motivo' a '$motivo_protesta'
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: "$_id", data: "$count" } }
        ]);
        console.log('  Protestas Motivo Data (raw):', protestasMotivoData);
        const protestasMotivoChart = {
            labels: protestasMotivoData.map(item => item.label),
            data: protestasMotivoData.map(item => item.data)
        };

        // --- 6. Gráfico: Apoyos por Fuerza Pública (Desde FuerzaPublica) ---
        console.log('[Dashboard Controller] Agregando Apoyos por Fuerza Pública...');
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
        console.log('  Fuerza Publica Type Data (raw):', fuerzaPublicaTypeData);
        const fuerzaPublicaTypeChart = {
            labels: fuerzaPublicaTypeData.map(item => item.label),
            data: fuerzaPublicaTypeData.map(item => item.data)
        };

        // --- 7. Obtener Tipos Disponibles para Filtros (para selectores) ---
        console.log('[Dashboard Controller] Obteniendo tipos de vehículos y embarcaciones...');
        const availableVehicleTypes = await Vehiculo.distinct('tipo_vehiculo');
        const availableBoatTypes = await Embarcacion.distinct('tipo_embarcacion');
        console.log('  Available Vehicle Types:', availableVehicleTypes);
        console.log('  Available Boat Types:', availableBoatTypes);

        res.status(200).json({
            totales: {
                totalProtestas,
                totalFuerzaPublica,
                totalPersonasVerificadas,
                totalVehiculosRegistrados,
                totalEmbarcacionesRegistradas,
                totalAntecedentes // NUEVO: Incluir el total de antecedentes en la respuesta
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
        console.error('[Dashboard Controller] Error al obtener datos del dashboard:', error);
        res.status(500).json({ message: 'Error del servidor al obtener datos del dashboard.', error: error.message });
    }
};