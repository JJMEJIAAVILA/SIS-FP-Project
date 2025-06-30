// assets/js/reporte_general.js - Dashboard con integración a Backend y filtros dinámicos
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for reporte_general.js');

    const config = {
        apiBaseUrl: 'http://localhost:3000/api/dashboard' // URL base para la API del dashboard
    };

    const elements = {
        userDisplay: document.getElementById('userDisplay'),
        personalHourChartCtx: document.getElementById('personalHourChart').getContext('2d'),
        vehicularTypeChartCtx: document.getElementById('vehicularTypeChart').getContext('2d'),
        embarcacionesTypeChartCtx: document.getElementById('embarcacionesTypeChart').getContext('2d'),
        protestasMotivoChartCtx: document.getElementById('protestasMotivoChart').getContext('2d'), // Nuevo
        fuerzaPublicaTypeChartCtx: document.getElementById('fuerzaPublicaTypeChart').getContext('2d'), // Nuevo

        totalProtestas: document.getElementById('totalProtestas'),
        totalFuerzaPublica: document.getElementById('totalFuerzaPublica'),
        totalPersonasVerificadas: document.getElementById('totalPersonasVerificadas'),
        totalVehiculosRegistrados: document.getElementById('totalVehiculosRegistrados'),
        totalEmbarcacionesRegistradas: document.getElementById('totalEmbarcacionesRegistradas'),

        // Elementos de filtro
        filterType: document.getElementById('filterType'),
        specificDayContainer: document.getElementById('specificDayContainer'),
        filterDate: document.getElementById('filterDate'), // Input de día específico
        specificMonthContainer: document.getElementById('specificMonthContainer'),
        filterMonth: document.getElementById('filterMonth'), // Input de mes específico
        specificYearContainer: document.getElementById('specificYearContainer'),
        filterYear: document.getElementById('filterYear'), // Input de año específico
        customRangeContainer: document.getElementById('customRangeContainer'),
        startDate: document.getElementById('startDate'), // Input de inicio de rango
        endDate: document.getElementById('endDate'), // Input de fin de rango
        filterVehicleType: document.getElementById('filterVehicleType'),
        filterBoatType: document.getElementById('filterBoatType'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn')
    };

    let personalHourChart; // Para almacenar la instancia del gráfico y poder destruirla/actualizarla
    let vehicularTypeChart;
    let embarcacionesTypeChart;
    let protestasMotivoChart; // Nuevo
    let fuerzaPublicaTypeChart; // Nuevo

    // --- Funciones de Inicialización ---
    async function init() {
        console.log('init() called');
        if (!await checkAuthentication()) {
            return;
        }
        loadUser();
        setupEventListeners();
        // Establecer el filtro por defecto a "Este Mes" y aplicar
        elements.filterType.value = 'thisMonth';
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
        elements.specificDayContainer.classList.add('hidden');
        elements.specificMonthContainer.classList.add('hidden');
        elements.specificYearContainer.classList.add('hidden');
        elements.customRangeContainer.classList.add('hidden');

        // Mostrar el contenedor relevante según el tipo de filtro
        switch (filterType) {
            case 'specificDay':
                elements.specificDayContainer.classList.remove('hidden');
                break;
            case 'specificMonth':
                elements.specificMonthContainer.classList.remove('hidden');
                break;
            case 'specificYear':
                elements.specificYearContainer.classList.remove('hidden');
                break;
            case 'customRange':
                elements.customRangeContainer.classList.remove('hidden');
                break;
            // Para 'today', 'last7days', 'thisMonth', 'thisYear', no se necesita input específico
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
            case 'customRange':
                startDate = elements.startDate.value;
                endDate = elements.endDate.value;
                break;
            default: // Por defecto, si no se selecciona nada o es 'month' (el valor inicial)
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
                let errorMessage = `Error al cargar datos del dashboard: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
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
        if (personalHourChart) personalHourChart.destroy();
        if (vehicularTypeChart) vehicularTypeChart.destroy();
        if (embarcacionesTypeChart) embarcacionesTypeChart.destroy();
        if (protestasMotivoChart) protestasMotivoChart.destroy(); // Nuevo
        if (fuerzaPublicaTypeChart) fuerzaPublicaTypeChart.destroy(); // Nuevo

        // Crear/Actualizar gráficos
        createPersonalHourChart(data.personalHour || { labels: [], data: [] });
        createVehicularTypeChart(data.vehicularType || { labels: [], data: [] });
        createEmbarcacionesTypeChart(data.embarcacionesType || { labels: [], data: [] });
        createProtestasMotivoChart(data.protestasMotivoChart || { labels: [], data: [] }); // Nuevo
        createFuerzaPublicaTypeChart(data.fuerzaPublicaTypeChart || { labels: [], data: [] }); // Nuevo

        // Mostrar totales
        displayTotals(data.totales || {});

        // Llenar selectores (si los datos de tipos vienen del backend)
        populateSelect('filterVehicleType', data.availableVehicleTypes || []);
        populateSelect('filterBoatType', data.availableBoatTypes || []);
    }

    function createPersonalHourChart(data) {
        personalHourChart = new Chart(elements.personalHourChartCtx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Ingreso de Personal',
                    data: data.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    function createVehicularTypeChart(data) {
        const backgroundColors = [
            'rgba(239, 68, 68, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
        ];

        vehicularTypeChart = new Chart(elements.vehicularTypeChartCtx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tipos de Vehículos',
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    function createEmbarcacionesTypeChart(data) {
        const backgroundColors = [
            'rgba(6, 182, 212, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(132, 204, 22, 0.7)',
            'rgba(20, 184, 166, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];

        embarcacionesTypeChart = new Chart(elements.embarcacionesTypeChartCtx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tipos de Embarcaciones',
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // NUEVO: Gráfico de Protestas por Motivo
    function createProtestasMotivoChart(data) {
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)', // Rojo
            'rgba(54, 162, 235, 0.7)', // Azul
            'rgba(255, 206, 86, 0.7)', // Amarillo
            'rgba(75, 192, 192, 0.7)', // Verde azulado
            'rgba(153, 102, 255, 0.7)', // Púrpura
            'rgba(255, 159, 64, 0.7)'  // Naranja
        ];
        protestasMotivoChart = new Chart(elements.protestasMotivoChartCtx, {
            type: 'bar', // O 'pie', 'doughnut'
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Protestas por Motivo',
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    // NUEVO: Gráfico de Apoyos por Fuerza Pública
    function createFuerzaPublicaTypeChart(data) {
        const backgroundColors = [
            'rgba(0, 123, 255, 0.7)', // Azul primario
            'rgba(40, 167, 69, 0.7)', // Verde
            'rgba(255, 193, 7, 0.7)', // Amarillo
            'rgba(220, 53, 69, 0.7)', // Rojo
            'rgba(108, 117, 125, 0.7)', // Gris
            'rgba(23, 162, 184, 0.7)' // Cian
        ];
        fuerzaPublicaTypeChart = new Chart(elements.fuerzaPublicaTypeChartCtx, {
            type: 'pie', // O 'bar', 'doughnut'
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Apoyos por Fuerza Pública',
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function displayTotals(totales) {
        elements.totalProtestas.textContent = totales.totalProtestas !== undefined ? totales.totalProtestas : '0';
        elements.totalFuerzaPublica.textContent = totales.totalFuerzaPublica !== undefined ? totales.totalFuerzaPublica : '0';
        elements.totalPersonasVerificadas.textContent = totales.totalPersonasVerificadas !== undefined ? totales.totalPersonasVerificadas : '0';
        elements.totalVehiculosRegistrados.textContent = totales.totalVehiculosRegistrados !== undefined ? totales.totalVehiculosRegistrados : '0';
        elements.totalEmbarcacionesRegistradas.textContent = totales.totalEmbarcacionesRegistradas !== undefined ? totales.totalEmbarcacionesRegistradas : '0';
    }

    function populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
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