// assets/js/reporte_general.js - Dashboard con integración a Backend y filtros dinámicos (ACTUALIZADO Y CORREGIDO)

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for reporte_general.js');

    const config = {
        apiBaseUrl: 'http://localhost:3000/api/dashboard' // URL base para la API del dashboard
    };

    const elements = {
        userDisplay: document.getElementById('userDisplay'),
        personalHourChartCtx: document.getElementById('personalHourChart') ? document.getElementById('personalHourChart').getContext('2d') : null,
        vehicularTypeChartCtx: document.getElementById('vehicularTypeChart') ? document.getElementById('vehicularTypeChart').getContext('2d') : null,
        embarcacionesTypeChartCtx: document.getElementById('embarcacionesTypeChart') ? document.getElementById('embarcacionesTypeChart').getContext('2d') : null,
        protestasMotivoChartCtx: document.getElementById('protestasMotivoChart') ? document.getElementById('protestasMotivoChart').getContext('2d') : null,
        fuerzaPublicaTypeChartCtx: document.getElementById('fuerzaPublicaTypeChart') ? document.getElementById('fuerzaPublicaTypeChart').getContext('2d') : null,

        totalProtestas: document.getElementById('totalProtestas'),
        totalFuerzaPublica: document.getElementById('totalFuerzaPublica'),
        totalVehiculosRegistrados: document.getElementById('totalVehiculosRegistrados'),
        totalEmbarcacionesRegistradas: document.getElementById('totalEmbarcacionesRegistradas'),

        // --- KPIs ACTUALIZADOS Y NUEVOS ---
        totalPersonasVerificadas: document.getElementById('totalPersonasVerificadas'), // Este ID ahora mostrará totalAntecedentes del backend
        totalEntradasPersonalEmpresas: document.getElementById('totalEntradasPersonalEmpresas'), // NUEVO KPI para empresas

        // Elementos de filtro (usando los IDs de tu HTML original)
        filterType: document.getElementById('filterType'), // ID del selector de filtro principal
        specificDayContainer: document.getElementById('specificDayContainer'),
        filterDate: document.getElementById('filterDate'), // Input de día específico
        specificMonthContainer: document.getElementById('specificMonthContainer'),
        filterMonth: document.getElementById('filterMonth'), // Input de mes específico
        specificYearContainer: document.getElementById('specificYearContainer'),
        filterYear: document.getElementById('filterYear'), // Input de año específico
        customRangeContainer: document.getElementById('customRangeContainer'), // Contenedor de rango personalizado
        startDate: document.getElementById('startDate'), // Input de inicio de rango
        endDate: document.getElementById('endDate'), // Input de fin de rango
        filterVehicleType: document.getElementById('filterVehicleType'), // Selector de tipo de vehículo
        filterBoatType: document.getElementById('filterBoatType'), // Selector de tipo de embarcación
        applyFiltersBtn: document.getElementById('applyFiltersBtn')
    };

    let charts = {}; // Objeto para almacenar instancias de Chart.js

    // --- Funciones de Inicialización ---
    async function init() {
        console.log('init() called');
        if (!await checkAuthentication()) {
            return;
        }
        loadUser();
        setupEventListeners();
        // Establecer el filtro por defecto a "Este Mes" y aplicar
        elements.filterType.value = 'thisMonth'; // Asegurarse de que el valor inicial sea 'thisMonth'
        updateFilterVisibility(); // Asegura que los inputs correctos estén visibles
        await fetchAndRenderDashboardData(); // Cargar datos del dashboard al inicio
    }

    // --- Protección de la Ruta (Verificación de Token) ---
    async function checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = 'login.html'; // Redirige a login.html (asumiendo que está en la raíz)
            return false;
        }
        return true;
    }

    // Función auxiliar para obtener las cabeceras con el token
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    // --- Nombre de usuario en mayúsculas ---
    function loadUser() {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            elements.userDisplay.textContent = storedUsername.toUpperCase();
        } else {
            elements.userDisplay.textContent = 'INVITADO';
        }
    }

    function setupEventListeners() {
        if (elements.filterType) elements.filterType.addEventListener('change', updateFilterVisibility);
        if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', fetchAndRenderDashboardData);
        if (elements.filterVehicleType) elements.filterVehicleType.addEventListener('change', fetchAndRenderDashboardData);
        if (elements.filterBoatType) elements.filterBoatType.addEventListener('change', fetchAndRenderDashboardData);

        // Configurar inputs de fecha/mes/año con valores por defecto si aplica
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');

        if (elements.filterDate) elements.filterDate.value = `${year}-${month}-${day}`;
        if (elements.filterMonth) elements.filterMonth.value = `${year}-${month}`;
        if (elements.filterYear) elements.filterYear.value = year;
        if (elements.startDate) elements.startDate.value = `${year}-${month}-01`; // Inicio del mes actual
        if (elements.endDate) elements.endDate.value = `${year}-${month}-${day}`; // Día actual
    }

    // --- Lógica de visibilidad de filtros ---
    function updateFilterVisibility() {
        const filterType = elements.filterType.value;

        // Ocultar todos los contenedores de fecha/mes/año/rango
        // Asegúrate de que estos elementos existan en tu HTML si los usas
        if (elements.specificDayContainer) elements.specificDayContainer.classList.add('hidden');
        if (elements.specificMonthContainer) elements.specificMonthContainer.classList.add('hidden');
        if (elements.specificYearContainer) elements.specificYearContainer.classList.add('hidden');
        if (elements.customRangeContainer) elements.customRangeContainer.classList.add('hidden');


        // Mostrar el contenedor relevante según el tipo de filtro
        switch (filterType) {
            case 'specificDay':
                if (elements.specificDayContainer) elements.specificDayContainer.classList.remove('hidden');
                break;
            case 'specificMonth':
                if (elements.specificMonthContainer) elements.specificMonthContainer.classList.remove('hidden');
                break;
            case 'specificYear':
                if (elements.specificYearContainer) elements.specificYearContainer.classList.remove('hidden');
                break;
            case 'customRange': // Usar 'customRange' como en tu HTML
                if (elements.customRangeContainer) elements.customRangeContainer.classList.remove('hidden');
                break;
            // Para 'today', 'last7days', 'thisMonth', 'thisYear', no se necesita input específico
            // Nota: 'month' en tu select es 'thisMonth' en la lógica del backend
        }
    }

    // --- Carga y Renderizado de Datos del Dashboard ---
    async function fetchAndRenderDashboardData() {
        console.log('Fetching dashboard data...');
        const headers = getAuthHeaders();

        // 1. Construir los parámetros de fecha basados en el filtro seleccionado
        const filterType = elements.filterType.value;
        let startDate = '';
        let endDate = '';

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed

        switch (filterType) {
            case 'today':
                startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                endDate = startDate;
                break;
            case 'last7days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 6); // 6 días atrás para incluir hoy
                startDate = `${sevenDaysAgo.getFullYear()}-${(sevenDaysAgo.getMonth() + 1).toString().padStart(2, '0')}-${sevenDaysAgo.getDate().toString().padStart(2, '0')}`;
                endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                break;
            case 'month': // Este es el valor por defecto en tu HTML, mapea a 'thisMonth' en la lógica
            case 'thisMonth':
                startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
                endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate().toString().padStart(2, '0')}`; // Último día del mes
                break;
            case 'thisYear':
                startDate = `${currentYear}-01-01`;
                endDate = `${currentYear}-12-31`;
                break;
            case 'specificDay':
                startDate = elements.filterDate.value;
                endDate = elements.filterDate.value;
                break;
            case 'specificMonth':
                const specificMonthValue = elements.filterMonth.value; // Formato YYYY-MM
                if (specificMonthValue) {
                    const [year, month] = specificMonthValue.split('-');
                    startDate = `${year}-${month}-01`;
                    endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate().toString().padStart(2, '0')}`;
                }
                break;
            case 'specificYear':
                const specificYearValue = elements.filterYear.value;
                if (specificYearValue) {
                    startDate = `${specificYearValue}-01-01`;
                    endDate = `${specificYearValue}-12-31`;
                }
                break;
            case 'customRange': // Usar 'customRange' como en tu HTML
                startDate = elements.startDate.value;
                endDate = elements.endDate.value;
                break;
            default: // Fallback, aunque 'month' debería ser el default
                startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
                endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate().toString().padStart(2, '0')}`;
                break;
        }

        // Validar que las fechas de rango personalizado no estén vacías si el tipo es 'customRange'
        if (filterType === 'customRange' && (!startDate || !endDate)) {
            alert('Por favor, selecciona tanto la fecha de inicio como la fecha fin para el rango personalizado.');
            return;
        }
        // Validar que la fecha de inicio no sea posterior a la fecha fin
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            alert('La fecha de inicio no puede ser posterior a la fecha fin.');
            return;
        }


        const filters = {
            startDate: startDate,
            endDate: endDate,
            vehicleType: elements.filterVehicleType ? elements.filterVehicleType.value : '',
            boatType: elements.filterBoatType ? elements.filterBoatType.value : ''
        };

        // Construir la URL con parámetros de consulta para los filtros
        const queryParams = new URLSearchParams(filters).toString();
        const apiUrl = `${config.apiBaseUrl}?${queryParams}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al cargar los datos del dashboard: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                alert(errorMessage);
                return;
            }

            const data = await response.json();
            console.log('Dashboard data received:', data);

            // Renderizar gráficos y totales con los datos reales
            renderDashboard(data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            alert(`No se pudo cargar los datos del dashboard: ${error.message}`);
        }
    }

    function renderDashboard(data) {
        // Destruir gráficos existentes antes de crear nuevos para evitar duplicados
        if (charts.personalHourChart) charts.personalHourChart.destroy();
        if (charts.vehicularTypeChart) charts.vehicularTypeChart.destroy();
        if (charts.embarcacionesTypeChart) charts.embarcacionesTypeChart.destroy();
        if (charts.protestasMotivoChart) charts.protestasMotivoChart.destroy();
        if (charts.fuerzaPublicaTypeChart) charts.fuerzaPublicaTypeChart.destroy();

        // Crear/Actualizar gráficos
        charts.personalHourChart = createChart(elements.personalHourChartCtx, data.personalHour || { labels: [], data: [] }, 'bar', 'Ingreso de Personal por Hora');
        charts.vehicularTypeChart = createChart(elements.vehicularTypeChartCtx, data.vehicularType || { labels: [], data: [] }, 'pie', 'Control Ingreso Vehicular por Tipo');
        charts.embarcacionesTypeChart = createChart(elements.embarcacionesTypeChartCtx, data.embarcacionesType || { labels: [], data: [] }, 'doughnut', 'Control Ingreso de Embarcaciones por Tipo');
        charts.protestasMotivoChart = createChart(elements.protestasMotivoChartCtx, data.protestasMotivoChart || { labels: [], data: [] }, 'bar', 'Protestas por Motivo');
        charts.fuerzaPublicaTypeChart = createChart(elements.fuerzaPublicaTypeChartCtx, data.fuerzaPublicaTypeChart || { labels: [], data: [] }, 'pie', 'Apoyos por Fuerza Pública');

        // Mostrar totales
        displayTotals(data.totales || {});

        // Llenar selectores (si los datos de tipos vienen del backend)
        populateSelect('filterVehicleType', data.availableVehicleTypes || []);
        populateSelect('filterBoatType', data.availableBoatTypes || []);
    }

    // Función genérica para crear gráficos
    function createChart(ctx, chartData, type, title) {
        if (!ctx) {
            console.warn(`Contexto de gráfico no encontrado para ${title}.`);
            return null;
        }

        const labels = chartData.labels || [];
        const data = chartData.data || [];

        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
            'rgba(200, 200, 200, 0.7)', 'rgba(100, 140, 250, 0.7)', 'rgba(250, 100, 100, 0.7)',
            'rgba(140, 250, 100, 0.7)'
        ];
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        return new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: borderColors.slice(0, labels.length),
                    borderWidth: 1,
                    borderRadius: type === 'bar' ? 4 : 0, // Aplicar borderRadius solo a barras
                    hoverBackgroundColor: type === 'bar' ? backgroundColors.map(color => color.replace('0.7', '0.9')).slice(0, labels.length) : undefined
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: type === 'pie' || type === 'doughnut' ? 'bottom' : 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    title: {
                        display: true,
                        text: title,
                        color: '#fff'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== undefined) { // Para barras
                                    label += context.parsed.y;
                                } else if (context.parsed !== undefined) { // Para pie/doughnut
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    label += `${value} (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ccc'
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ccc',
                            beginAtZero: true
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    }
                }
            }
        });
    }


    // --- Funciones para Mostrar Totales ---
    function displayTotals(totales) {
        elements.totalProtestas.textContent = totales.totalProtestas !== undefined ? totales.totalProtestas : '0';
        elements.totalFuerzaPublica.textContent = totales.totalFuerzaPublica !== undefined ? totales.totalFuerzaPublica : '0';
        elements.totalVehiculosRegistrados.textContent = totales.totalVehiculosRegistrados !== undefined ? totales.totalVehiculosRegistrados : '0';
        elements.totalEmbarcacionesRegistradas.textContent = totales.totalEmbarcacionesRegistradas !== undefined ? totales.totalEmbarcacionesRegistradas : '0';

        // Mapeo de KPI: "Personas Verificadas" ahora usa el total de Antecedentes
        elements.totalPersonasVerificadas.textContent = totales.totalAntecedentes !== undefined ? totales.totalAntecedentes : '0';

        // NUEVO KPI: "Entradas de Personal (Empresas)"
        elements.totalEntradasPersonalEmpresas.textContent = totales.totalEntradasPersonalEmpresas !== undefined ? totales.totalEntradasPersonalEmpresas : '0';
    }

    // --- Funciones para Poblar Filtros de Tipo ---
    function populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.warn(`Selector con ID '${selectId}' no encontrado.`);
            return;
        }
        const currentValue = select.value;

        select.innerHTML = '<option value="">Todos los tipos</option>';

        options.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });

        if (options.includes(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = '';
        }
    }

    init(); // Iniciar la aplicación
});