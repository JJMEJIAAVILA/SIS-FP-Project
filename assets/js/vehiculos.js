// assets/js/vehiculos.js
document.addEventListener('DOMContentLoaded', function() {
    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
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
        loadUser(); // Carga el nombre de usuario en la UI (ahora en mayúsculas)
        setupEventListeners(); // Configura todos los oyentes de eventos
        await fetchAndRenderTable(); // Cargar datos desde el backend al inicio
    }

    // --- Protección de la Ruta (Verificación de Token) ---
    async function checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html'; // Ajusta la ruta si es necesario
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

    // --- CAMBIO AQUÍ: Nombre de usuario en mayúsculas ---
    function loadUser() {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            elements.userDisplay.textContent = storedUsername.toUpperCase(); // Convertir a mayúsculas
        } else {
            elements.userDisplay.textContent = 'INVITADO';
        }
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

        // Asegúrate de que los elementos de salida existan antes de añadir listeners
        if (elements.salidaRegistroForm) {
            elements.salidaRegistroForm.addEventListener('submit', handleSalidaSubmit); // Listener para el formulario de salida
        }
        if (elements.cancelSalidaBtn) {
            elements.cancelSalidaBtn.addEventListener('click', hideSalidaForm); // Listener para cancelar salida
        }
    }

    // --- Funciones de Formulario de Registro/Edición de Vehículo ---
    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        // Asegurarse de ocultar el formulario de salida si está visible
        if (elements.salidaForm) {
            elements.salidaForm.classList.add('hidden');
        }
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
            const headers = getAuthHeaders(); // Obtener cabeceras con token

            if (state.editMode) {
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(vehiculoData)
                });
            } else {
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(vehiculoData)
                });
            }

            // --- Manejo de errores mejorado ---
            if (!response.ok) {
                const errorText = await response.text(); // Lee el cuerpo una sola vez como texto
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el registro de vehículo: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText); // Intenta parsear como JSON
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Solo parsear si response.ok

            alert(`Registro de vehículo ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm(); // Ocultar formulario y resetear estado
            await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
        } catch (error) {
            console.error('Error en la solicitud al backend:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    // --- Funciones de Formulario de Salida de Vehículo ---
    function showSalidaForm(itemId) {
        elements.newRegisterForm.classList.add('hidden'); // Ocultar formulario de registro
        if (elements.salidaForm) { // Asegurarse de que el elemento exista
            elements.salidaForm.classList.remove('hidden');
        }
        if (elements.salidaRegistroForm) { // Asegurarse de que el elemento exista
            elements.salidaRegistroForm.reset(); // Limpiar formulario de salida
        }
        state.vehiculoSalidaId = itemId; // Almacenar el ID del vehículo para la salida

        // Autocompletar fecha y hora actuales
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');

        // Asumiendo que fecha_salida es un input type="date" y hora_salida es input type="time"
        if (elements.salidaRegistroForm.fecha_salida) {
            elements.salidaRegistroForm.fecha_salida.value = `${year}-${month}-${day}`;
        }
        if (elements.salidaRegistroForm.hora_salida) {
            elements.salidaRegistroForm.hora_salida.value = `${hours}:${minutes}`;
        }
    }

    function hideSalidaForm() {
        if (elements.salidaForm) { // Asegurarse de que el elemento exista
            elements.salidaForm.classList.add('hidden');
        }
        state.vehiculoSalidaId = null; // Limpiar ID del vehículo de salida
        if (elements.salidaRegistroForm) { // Asegurarse de que el elemento exista
            elements.salidaRegistroForm.reset(); // Resetear el formulario de salida
        }
    }

    async function handleSalidaSubmit(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicie sesión.');
            window.location.href = '../login.html';
            return;
        }

        const fechaSalida = elements.salidaRegistroForm.fecha_salida.value;
        const horaSalida = elements.salidaRegistroForm.hora_salida.value;

        if (!fechaSalida || !horaSalida) {
            alert('La fecha y hora de salida son obligatorias.');
            return;
        }

        try {
            const headers = getAuthHeaders(); // Obtener cabeceras con token
            const response = await fetch(`${config.apiBaseUrl}/${state.vehiculoSalidaId}/salida`, { // Nueva ruta para actualizar salida
                method: 'PUT',
                headers: headers,
                // --- CAMBIO CLAVE AQUÍ: Enviar fecha_salida y hora_salida por separado ---
                body: JSON.stringify({ fecha_salida: fechaSalida, hora_salida: horaSalida })
            });

            // --- Manejo de errores mejorado ---
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al registrar salida: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Solo parsear si response.ok

            alert('Fecha y hora de salida registradas exitosamente.');
            hideSalidaForm(); // Ocultar formulario de salida
            await fetchAndRenderTable(); // Recargar la tabla
        } catch (error) {
            console.error('Error al registrar salida:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }


    // --- Funciones de Tabla y Datos ---
    async function fetchAndRenderTable() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. Cannot fetch data.');
            elements.tableBody.innerHTML = `<tr><td colspan="13" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicie sesión.</td></tr>`;
            return;
        }
        try {
            const headers = getAuthHeaders(); // Obtener cabeceras con token
            const response = await fetch(config.apiBaseUrl, {
                method: 'GET',
                headers: headers
            });

            // --- Manejo de errores mejorado ---
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al cargar los registros: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                alert(errorMessage);
                state.vehiculosData = []; // Vaciar datos si hay error
                renderTable(); // Renderizar tabla vacía
                return; // Detener la ejecución
            }

            const data = await response.json();

            // *** IMPORTANTE: Ajusta esto según la respuesta REAL de tu API de vehículos ***
            // Si tu backend devuelve { vehiculos: [...] }, usa data.vehiculos
            // Si tu backend devuelve directamente [...], usa data
            state.vehiculosData = data.vehiculos || data; // Asume que la respuesta es { vehiculos: [...] } o un array directo

            state.filteredData = null; // Resetear filtro
            state.currentPage = config.defaultPage; // Volver a la primera página
            renderTable(); // Renderizar la tabla con los nuevos datos

        } catch (error) {
            console.error('Error al cargar los datos de vehículos:', error);
            alert(`No se pudo conectar con el servidor para cargar los vehículos: ${error.message}`);
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
        // Asegúrate de que el colspan sea el número correcto de columnas en tu tabla HTML de vehículos
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
            // Formatear fechas y horas para visualización
            const formattedFechaRegistro = vehiculo.fechaRegistro ? new Date(vehiculo.fechaRegistro).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraEntrada = vehiculo.hora_entrada || '-';

            // Si fecha_salida es un Date object del backend, formatéalo. Si es string, úsalo.
            const formattedFechaSalida = vehiculo.fecha_salida ? new Date(vehiculo.fecha_salida).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraSalida = vehiculo.hora_salida || '-';


            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3 text-center">${formattedFechaRegistro}</td>
                <td class="px-4 py-3">${vehiculo.conductor || '-'}</td>
                <td class="px-4 py-3">${vehiculo.empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.placa || '-'}</td>
                <td class="px-4 py-3 text-center">${vehiculo.tipo_vehiculo || '-'}</td>
                <td class="px-4 py-3 text-center">${formattedHoraEntrada}</td>
                <td class="px-4 py-3 text-center">${formattedHoraSalida}</td>
                <td class="px-4 py-3 text-center">${formattedFechaSalida}</td>
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

        const exportableData = dataToExport.map(item => {
            const newItem = { ...item };
            delete newItem._id;
            delete newItem.__v;

            // Formatear fechas y horas para Excel
            newItem.fechaRegistro = newItem.fechaRegistro ? new Date(newItem.fechaRegistro).toLocaleDateString('es-ES') : '';
            newItem.hora_entrada = newItem.hora_entrada || '';
            newItem.fecha_salida = newItem.fecha_salida ? new Date(newItem.fecha_salida).toLocaleDateString('es-ES') : '';
            newItem.hora_salida = newItem.hora_salida || '';

            return newItem;
        });

        // Define el orden manual de las columnas para el Excel de vehículos
        const headers = [
            'fechaRegistro', 'conductor', 'empresa', 'placa', 'tipo_vehiculo',
            'hora_entrada', 'hora_salida', 'fecha_salida', 'parqueadero_interno',
            'parqueadero_visitantes', 'observaciones'
        ];

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
        const itemId = e.target.dataset.id;
        if (!itemId) return;

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
        state.editItemId = itemId;
        showRegisterForm();
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
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${itemId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al eliminar registro de vehículo: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            alert('Registro de vehículo eliminado exitosamente.');
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error al eliminar registro de vehículo:', error);
            alert(`Error de conexión con el servidor o al eliminar registro: ${error.message}`);
        }
    }

    function loadEditData() {
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