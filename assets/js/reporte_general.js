document.addEventListener('DOMContentLoaded', function() {
    // Datos de ejemplo (deberías reemplazarlos con datos reales de tu aplicación)
    const sampleData = {
        personalHour: {
            labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            data: [12, 19, 8, 15, 22, 18, 25, 12, 10]
        },
        vehicularType: {
            labels: ['Camioneta', 'Automóvil', 'Motocicleta', 'Camión', 'Otros'],
            data: [25, 30, 15, 10, 5]
        },
        embarcacionesType: {
            labels: ['Yate', 'Lancha', 'Velero', 'Bote', 'Otros'],
            data: [10, 20, 5, 15, 3]
        },
        totales: {
            totalProtestas: 5,
            totalFuerzaPublica: 3,
            totalPersonasVerificadas: 150,
            totalVehiculosRegistrados: 85,
            totalEmbarcacionesRegistradas: 53
        },
        vehicleTypes: ['Camioneta', 'Automóvil', 'Motocicleta', 'Camión', 'Otros'],
        boatTypes: ['Yate', 'Lancha', 'Velero', 'Bote', 'Otros']
    };

    // Inicializar la aplicación
    initApp(sampleData);
});

function initApp(data) {
    // Mostrar usuario
    loadUser();
    
    // Crear gráficos
    createPersonalHourChart(data.personalHour);
    createVehicularTypeChart(data.vehicularType);
    createEmbarcacionesTypeChart(data.embarcacionesType);
    
    // Mostrar totales
    displayTotals(data.totales);
    
    // Configurar segmentadores
    setupFilters(data.vehicleTypes, data.boatTypes);
}

function loadUser() {
    const currentUser = localStorage.getItem('currentUser') || 'Usuario';
    document.getElementById('userDisplay').textContent = currentUser;
}

function createPersonalHourChart(data) {
    const ctx = document.getElementById('personalHourChart').getContext('2d');
    
    // Configuración del gráfico mejorada
    const chartConfig = {
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
    };
    
    new Chart(ctx, chartConfig);
}

function createVehicularTypeChart(data) {
    const ctx = document.getElementById('vehicularTypeChart').getContext('2d');
    
    const backgroundColors = [
        'rgba(239, 68, 68, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(139, 92, 246, 0.7)'
    ];
    
    new Chart(ctx, {
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
    const ctx = document.getElementById('embarcacionesTypeChart').getContext('2d');
    
    const backgroundColors = [
        'rgba(6, 182, 212, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(236, 72, 153, 0.7)',
        'rgba(132, 204, 22, 0.7)',
        'rgba(20, 184, 166, 0.7)'
    ];
    
    new Chart(ctx, {
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

function displayTotals(totales) {
    document.getElementById('totalProtestas').textContent = totales.totalProtestas;
    document.getElementById('totalFuerzaPublica').textContent = totales.totalFuerzaPublica;
    document.getElementById('totalPersonasVerificadas').textContent = totales.totalPersonasVerificadas;
    document.getElementById('totalVehiculosRegistrados').textContent = totales.totalVehiculosRegistrados;
    document.getElementById('totalEmbarcacionesRegistradas').textContent = totales.totalEmbarcacionesRegistradas;
}

function setupFilters(vehicleTypes, boatTypes) {
    // Llenar selectores con opciones
    populateSelect('filterVehicleType', vehicleTypes);
    populateSelect('filterBoatType', boatTypes);
    
    // Configurar event listeners
    document.getElementById('filterDate').addEventListener('change', applyFilters);
    document.getElementById('filterVehicleType').addEventListener('change', applyFilters);
    document.getElementById('filterBoatType').addEventListener('change', applyFilters);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    
    // Agregar opción "Todos" primero
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los tipos';
    select.appendChild(defaultOption);
    
    // Agregar las demás opciones
    options.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function applyFilters() {
    const filters = {
        date: document.getElementById('filterDate').value,
        vehicleType: document.getElementById('filterVehicleType').value,
        boatType: document.getElementById('filterBoatType').value
    };
    
    console.log('Filtros aplicados:', filters);
    // Aquí deberías implementar la lógica para filtrar tus datos
    // y actualizar los gráficos y totales según los filtros
    
    // Ejemplo de implementación:
    // 1. Hacer una petición al servidor con los filtros
    // 2. Actualizar los gráficos con los nuevos datos
    // 3. Actualizar los totales
    
    // Por ahora solo mostramos en consola
    alert('Funcionalidad de filtrado: En desarrollo. Filtros aplicados: ' + 
          JSON.stringify(filters, null, 2));
}