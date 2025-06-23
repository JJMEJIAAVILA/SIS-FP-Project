// assets/js/vehiculos.js
document.addEventListener('DOMContentLoaded', function() {
    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        // URL base de tu API de vehículos
        apiBaseUrl: 'http://localhost:3000/api/vehiculos' // URL de la API para vehículos
    };

    const state = {
        vehiculosData: [], // Contendrá los datos de vehículos del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null, // Almacena el _id de MongoDB del vehículo a editar
        vehiculoSalidaId: null // Almacena el _id de MongoDB del vehículo para la salida
    };

    const elements = {
        tableBody: document.getElementById('tableBody'),
        newRegisterForm: document.getElementById('newRegisterForm'),
        registerForm: document.getElementById('registerForm'),
        newRegisterBtn: document.getElementById('newRegisterBtn'),
        cancelFormBtn: document.getElementById('cancelFormBtn'),
        searchInput: document.getElementById('searchInput'),
        exportBtn: document.getElementById('exportBtn'),
        currentRecordsSpan: document.getElementById('currentRecords'),
        currentPageSpan: document.getElementById('currentPage'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        userDisplay: document.getElementById('userDisplay'),
        salidaForm: document.getElementById('salidaForm'), // Formulario de salida
        salidaRegistroForm: document.getElementById('salidaRegistroForm'), // Formulario de salida
        cancelSalidaBtn: document.getElementById('cancelSalidaBtn') // Botón cancelar salida
    };

    // --- Funciones de Inicialización ---
    async function init() {
        if (!await checkAuthentication()) {
            return; // Redirige si no está autenticado
        }
        loadUser();
        setupEventListeners();
        await fetchAndRenderTable(); // Cargar datos desde el backend al inicio
    }

    // --- 1. Protección de la Ruta ---
    async function checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html'; // Ajusta la ruta si es necesario
            return false;
        }
        return true;
    }

    function loadUser() {
        elements.userDisplay.textContent = localStorage.getItem('username') || 'Usuario'; // Obtener del localStorage
    }

    function setupEventListeners() {
        elements.newRegisterBtn.addEventListener('click', showRegisterForm);
        elements.cancelFormBtn.addEventListener('click', hideRegisterForm);
        elements.registerForm.addEventListener('submit', handleFormSubmit);
        elements.searchInput.addEventListener('input', handleSearch);
        elements.exportBtn.addEventListener('click', exportToExcel);
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
        elements.nextPageBtn.addEventListener('click', goToNextPage);
        elements.tableBody.addEventListener('click', handleTableClick); // Para botones de editar/salida/eliminar
        elements.salidaRegistroForm.addEventListener('submit', handleSalidaSubmit); // Listener para el formulario de salida
        elements.cancelSalidaBtn.addEventListener('click', hideSalidaForm); // Listener para cancelar salida
    }

    // --- Funciones de Formulario de Registro/Edición de Vehículo ---
    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        elements.salidaForm.classList.add('hidden'); // Asegurarse de ocultar el formulario de salida
        elements.registerForm.reset(); // Limpiar formulario
        if (state.editMode && state.editItemId) {
            loadEditData(); // Cargar datos si estamos en modo edición
        } else {
            // Asegurarse de que el campo de fechaRegistro tenga la fecha actual por defecto
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            elements.registerForm.fechaRegistro.value = `${year}-${month}-${day}`;
        }
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItemId = null; // Limpiar ID del item en edición
        elements.registerForm.reset(); // Resetear el formulario
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicie sesión.');
            window.location.href = '../login.html';
            return;
        }

        const formData = new FormData(elements.registerForm);
        // Crear un objeto con los datos del formulario de vehículo
        const vehiculoData = {
            fechaRegistro: formData.get('fechaRegistro'),
            conductor: formData.get('conductor').toUpperCase(),
            empresa: formData.get('empresa').toUpperCase(),
            placa: formData.get('placa').toUpperCase(),
            tipo_vehiculo: formData.get('tipo_vehiculo').toUpperCase() || '-',
            hora_entrada: formData.get('hora_entrada') || '-',
            parqueadero_interno: formData.get('parqueadero_interno').toUpperCase() || '-',
            parqueadero_visitantes: formData.get('parqueadero_visitantes').toUpperCase() || '-',
            observaciones: formData.get('observaciones').toUpperCase() || '-'
        };

        try {
            let response;
            if (state.editMode) {
                // Modo edición: enviar PUT/PATCH al backend con el ID
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT', // o 'PATCH'
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(vehiculoData)
                });
            } else {
                // Nuevo registro: enviar POST al backend
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(vehiculoData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                alert(`Registro de vehículo ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
                hideRegisterForm(); // Ocultar formulario y resetear estado
                await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
            } else {
                alert(`Error al ${state.editMode ? 'modificar' : 'guardar'} el registro de vehículo: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error en la solicitud al backend:', error);
            alert('Error de conexión con el servidor. Inténtelo de nuevo.');
        }
    }

    // --- Funciones de Formulario de Salida de Vehículo ---
    function showSalidaForm(itemId) {
        elements.newRegisterForm.classList.add('hidden'); // Ocultar formulario de registro
        elements.salidaForm.classList.remove('hidden');
        elements.salidaRegistroForm.reset(); // Limpiar formulario de salida
        state.vehiculoSalidaId = itemId; // Almacenar el ID del vehículo para la salida

        // Autocompletar fecha y hora actuales
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        elements.salidaRegistroForm.fecha_salida.value = `${year}-${month}-${day}`;
        elements.salidaRegistroForm.hora_salida.value = `${hours}:${minutes}`;
    }

    function hideSalidaForm() {
        elements.salidaForm.classList.add('hidden');
        state.vehiculoSalidaId = null; // Limpiar ID del vehículo de salida
        elements.salidaRegistroForm.reset(); // Resetear el formulario de salida
    }

    async function handleSalidaSubmit(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const fechaSalida = elements.salidaRegistroForm.fecha_salida.value;
        const horaSalida = elements.salidaRegistroForm.hora_salida.value;

        // Combina fecha y hora para enviarlo al backend como un solo string
        const fechaHoraSalida = `${fechaSalida} ${horaSalida}`;

        try {
            const response = await fetch(`${config.apiBaseUrl}/${state.vehiculoSalidaId}/salida`, { // Nueva ruta para actualizar salida
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fecha_salida: fechaHoraSalida }) // Enviamos el campo fecha_salida
            });

            const result = await response.json();

            if (response.ok) {
                alert('Fecha y hora de salida registradas exitosamente.');
                hideSalidaForm(); // Ocultar formulario de salida
                await fetchAndRenderTable(); // Recargar la tabla
            } else {
                alert(`Error al registrar salida: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al registrar salida:', error);
            alert('Error de conexión con el servidor al registrar salida.');
        }
    }


    // --- Funciones de Tabla y Datos ---
    async function fetchAndRenderTable() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. Cannot fetch data.');
            return;
        }
        try {
            const response = await fetch(config.apiBaseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                state.vehiculosData = data; // Guardar los datos recibidos del backend
                state.filteredData = null; // Resetear filtro
                state.currentPage = config.defaultPage; // Volver a la primera página
                renderTable(); // Renderizar la tabla con los nuevos datos
            } else {
                alert(`Error al cargar los registros: ${data.message || 'Error desconocido'}`);
                state.vehiculosData = []; // Vaciar datos si hay error
                renderTable(); // Renderizar tabla vacía
            }
        } catch (error) {
            console.error('Error al cargar los datos de vehículos:', error);
            alert('No se pudo conectar con el servidor para cargar los vehículos.');
            state.vehiculosData = []; // Vaciar datos si hay error de red
            renderTable(); // Renderizar tabla vacía
        }
    }

    function renderTable() {
        const dataToRender = state.filteredData || state.vehiculosData;
        const start = (state.currentPage - 1) * config.itemsPerPage;
        const end = start + config.itemsPerPage;
        const pageData = dataToRender.slice(start, end);

        elements.tableBody.innerHTML = '';

        if (pageData.length === 0) {
            showNoDataMessage(dataToRender.length === 0);
        } else {
            renderTableRows(pageData);
        }

        updateUI(dataToRender, end);
    }

    function showNoDataMessage(isTotalEmpty) {
        let message = isTotalEmpty
            ? 'No hay registros disponibles. Agregue un nuevo registro.'
            : 'No se encontraron resultados para su búsqueda.';
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="13" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach((vehiculo, index) => {
            // Usar vehiculo._id como identificador único para las acciones
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3 text-center">${vehiculo.fechaRegistro || '-'}</td>
                <td class="px-4 py-3">${vehiculo.conductor || '-'}</td>
                <td class="px-4 py-3">${vehiculo.empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.placa || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.tipo_vehiculo || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.hora_entrada || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.hora_salida || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.fecha_salida ? vehiculo.fecha_salida.split(' ')[0] : '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.parqueadero_interno || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.parqueadero_visitantes || '-'}</td>
                <td class="px-4 py-3">${vehiculo.observaciones || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${vehiculo._id}">Editar</button>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded salida-btn" data-id="${vehiculo._id}">Salida</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${vehiculo._id}">Eliminar</button>
                </td>
            `;
            elements.tableBody.appendChild(row);
        });
    }

    function updateUI(data, end) {
        elements.currentRecordsSpan.textContent = data.length;
        elements.currentPageSpan.textContent = state.currentPage;
        elements.prevPageBtn.disabled = state.currentPage === 1;
        elements.nextPageBtn.disabled = end >= data.length;
    }

    function handleSearch() {
        const searchTerm = this.value.toUpperCase();
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.vehiculosData.filter(vehiculo =>
                Object.values(vehiculo).some(value =>
                    value !== null && String(value).toUpperCase().includes(searchTerm)
                )
            );
        }
        state.currentPage = config.defaultPage;
        renderTable();
    }

    function goToPrevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    }

    function goToNextPage() {
        const data = state.filteredData || state.vehiculosData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    function exportToExcel() {
        const dataToExport = state.filteredData || state.vehiculosData;
        if (dataToExport.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        // Crear una copia de los datos para no modificar los originales
        const exportableData = dataToExport.map(item => ({ ...item }));

        // Eliminar el campo '_id' de cada objeto antes de exportar
        exportableData.forEach(item => {
            delete item._id;
            delete item.__v; // Eliminar también la versión de Mongoose si no es necesaria
        });

        // Asegurarse de que el orden de las cabeceras sea el deseado
        // Define el orden manual de las columnas para el Excel de vehículos
        const headers = [
            'fechaRegistro', 'conductor', 'empresa', 'placa', 'tipo_vehiculo',
            'hora_entrada', 'hora_salida', 'fecha_salida', 'parqueadero_interno',
            'parqueadero_visitantes', 'observaciones'
        ];

        // Mapear los datos al orden de las cabeceras
        const data = exportableData.map(vehiculo =>
            headers.map(header => vehiculo[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Vehículos');

        XLSX.writeFile(workbook, 'registros_vehiculos.xlsx');
        alert('Datos de vehículos exportados correctamente en formato Excel (.xlsx)');
    }

    // --- Funciones de Acción en la Tabla (Editar, Salida, Eliminar) ---
    async function handleTableClick(e) {
        const itemId = e.target.dataset.id; // Usamos data-id que ahora viene del backend (_id)
        if (!itemId) return; // Si no tiene data-id, no es un botón de acción

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(itemId);
        } else if (e.target.classList.contains('salida-btn')) {
            showSalidaForm(itemId); // Mostrar el formulario de salida
        } else if (e.target.classList.contains('delete-btn')) {
            await handleDelete(itemId);
        }
    }

    function handleEdit(itemId) {
        state.editMode = true;
        state.editItemId = itemId; // Almacenar el ID del backend
        showRegisterForm(); // Mostrar el formulario para edición
    }

    async function handleDelete(itemId) {
        if (!confirm('¿Está seguro de que desea eliminar este registro de vehículo?')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                alert('Registro de vehículo eliminado exitosamente.');
                await fetchAndRenderTable(); // Recargar la tabla
            } else {
                alert(`Error al eliminar registro de vehículo: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al eliminar registro de vehículo:', error);
            alert('Error de conexión con el servidor al eliminar registro.');
        }
    }

    function loadEditData() {
        // En modo edición, buscar el vehículo en los datos actuales por su _id del backend
        const vehiculo = state.vehiculosData.find(p => p._id === state.editItemId);
        if (vehiculo) {
            // Rellenar el formulario con los datos del vehículo
            elements.registerForm.fechaRegistro.value = vehiculo.fechaRegistro || '';
            elements.registerForm.conductor.value = vehiculo.conductor || '';
            elements.registerForm.empresa.value = vehiculo.empresa || '';
            elements.registerForm.placa.value = vehiculo.placa || '';
            elements.registerForm.tipo_vehiculo.value = vehiculo.tipo_vehiculo || '';
            elements.registerForm.hora_entrada.value = vehiculo.hora_entrada || '';
            elements.registerForm.parqueadero_interno.value = vehiculo.parqueadero_interno || '';
            elements.registerForm.parqueadero_visitantes.value = vehiculo.parqueadero_visitantes || '';
            elements.registerForm.observaciones.value = vehiculo.observaciones || '';
            // No cargar hora_salida o fecha_salida en el formulario de entrada
        }
    }

    init(); // Iniciar la aplicación
});