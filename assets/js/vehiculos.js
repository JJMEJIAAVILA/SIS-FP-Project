// assets/js/vehiculos.js - CÓDIGO COMPLETO Y ACTUALIZADO (Junio 2025) - SOLUCIÓN EMPRESAS APLICADA
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
        cancelSalidaBtn: document.getElementById('cancelSalidaBtn'), // Botón cancelar salida

        // --- ELEMENTOS AÑADIDOS POR ID DESDE EL HTML (para autocompletado y edición) ---
        fechaRegistroVehiculoInput: document.getElementById('fechaRegistroVehiculo'),
        horaEntradaVehiculoInput: document.getElementById('horaEntradaVehiculo'),
        fechaSalidaVehiculoModalInput: document.getElementById('fechaSalidaVehiculoModal'),
        horaSalidaVehiculoModalInput: document.getElementById('horaSalidaVehiculoModal')
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

    // --- Funciones Auxiliares para Fecha y Hora ---
    function getCurrentDate() {
        const today = new Date();
        // Obtener componentes de fecha en la zona horaria local
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
    }

    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`; // Formato HH:MM
    }

    // --- Nombre de usuario en mayúsculas ---
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
            // Autocompletar fecha y hora actual para el NUEVO registro
            if (elements.fechaRegistroVehiculoInput) {
                elements.fechaRegistroVehiculoInput.value = getCurrentDate();
            }
            if (elements.horaEntradaVehiculoInput) {
                elements.horaEntradaVehiculoInput.value = getCurrentTime();
            }
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

        // --- INICIO DE LA CORRECCIÓN DE ZONA HORARIA PARA FECHA DE REGISTRO (SOLUCIÓN EMPRESAS) ---
        const rawFechaRegistro = elements.fechaRegistroVehiculoInput.value; // "YYYY-MM-DD"
        let fechaRegistroISO = null;
        if (rawFechaRegistro) {
            // Crear un objeto Date en la zona horaria LOCAL para el inicio del día
            // Esto permite que new Date(string) interprete la fecha en la zona horaria local del navegador.
            const localDate = new Date(`${rawFechaRegistro}T00:00:00`);
            // Convierte esa fecha local a un ISO string UTC
            fechaRegistroISO = localDate.toISOString();
        }
        console.log('Frontend enviando fechaRegistroISO:', fechaRegistroISO); // LOGGING CRÍTICO
        // --- FIN DE LA CORRECCIÓN DE ZONA HORARIA ---

        const vehiculoData = {
            fechaRegistro: fechaRegistroISO, // Envía la fecha corregida en ISO 8601
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

        // Autocompletar fecha y hora actuales para el modal de salida
        if (elements.fechaSalidaVehiculoModalInput) {
            elements.fechaSalidaVehiculoModalInput.value = getCurrentDate();
        }
        if (elements.horaSalidaVehiculoModalInput) {
            elements.horaSalidaVehiculoModalInput.value = getCurrentTime();
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

        // --- INICIO DE LA CORRECCIÓN DE ZONA HORARIA PARA FECHA DE SALIDA ---
        const rawFechaSalida = elements.fechaSalidaVehiculoModalInput.value; // "YYYY-MM-DD"
        let fechaSalidaISO = null;
        if (rawFechaSalida) {
            // Crear un objeto Date en la zona horaria LOCAL
            const localDate = new Date(`${rawFechaSalida}T00:00:00`);
            fechaSalidaISO = localDate.toISOString();
        }
        // --- FIN DE LA CORRECCIÓN DE ZONA HORARIA ---

        const horaSalida = elements.horaSalidaVehiculoModalInput.value;

        if (!fechaSalidaISO || !horaSalida) {
            alert('La fecha y hora de salida son obligatorias.');
            return;
        }

        try {
            const headers = getAuthHeaders(); // Obtener cabeceras con token
            const response = await fetch(`${config.apiBaseUrl}/${state.vehiculoSalidaId}/salida`, { // Nueva ruta para actualizar salida
                method: 'PUT',
                headers: headers,
                // --- CAMBIO CLAVE AQUÍ: Enviar fecha_salida y hora_salida por separado ---
                body: JSON.stringify({ fecha_salida: fechaSalidaISO, hora_salida: horaSalida })
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
            alert(`Error de conexión con el servidor o al registrar salida: ${error.message}`);
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
            console.log('Datos de vehículos recibidos del backend:', data); // LOGGING CRÍTICO

            // Asume que la respuesta es { vehiculos: [...] } o un array directo
            state.vehiculosData = data.vehiculos || data;

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
            // vehiculo.fechaRegistro es un ISO string del backend (ej. "2025-06-30T00:00:00.000Z")
            // new Date() lo parseará y toLocaleDateString() lo mostrará en la zona horaria local
            let formattedFechaRegistro = '-';
            if (vehiculo.fechaRegistro) {
                const dateRegistro = new Date(vehiculo.fechaRegistro);
                if (!isNaN(dateRegistro.getTime())) { // Verificar si la fecha es válida
                    formattedFechaRegistro = dateRegistro.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
            }
            const formattedHoraEntrada = vehiculo.hora_entrada || '-';

            // --- Manejo de fecha_salida para evitar "Invalid Date" y mostrar correctamente ---
            let formattedFechaSalida = '-';
            if (vehiculo.fecha_salida) {
                const dateSalida = new Date(vehiculo.fecha_salida);
                if (!isNaN(dateSalida.getTime())) { // Verificar si la fecha es válida
                    formattedFechaSalida = dateSalida.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
            }
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
            // Asegúrate de que las fechas sean objetos Date válidos antes de formatear
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
            // vehiculo.fechaRegistro es un ISO string del backend, lo convertimos a YYYY-MM-DD para el input type="date"
            if (vehiculo.fechaRegistro) {
                const dateRegistro = new Date(vehiculo.fechaRegistro);
                if (!isNaN(dateRegistro.getTime())) {
                    elements.fechaRegistroVehiculoInput.value = dateRegistro.toISOString().split('T')[0];
                } else {
                    elements.fechaRegistroVehiculoInput.value = '';
                }
            } else {
                elements.fechaRegistroVehiculoInput.value = '';
            }

            elements.registerForm.conductor.value = vehiculo.conductor || '';
            elements.registerForm.empresa.value = vehiculo.empresa || '';
            elements.registerForm.placa.value = vehiculo.placa || '';
            elements.registerForm.tipo_vehiculo.value = vehiculo.tipo_vehiculo || '';
            elements.horaEntradaVehiculoInput.value = vehiculo.hora_entrada || '';
            elements.registerForm.parqueadero_interno.value = vehiculo.parqueadero_interno || '';
            elements.registerForm.parqueadero_visitantes.value = vehiculo.parqueadero_visitantes || '';
            elements.registerForm.observaciones.value = vehiculo.observaciones || '';

            // Si hay fecha y hora de salida en el registro, también rellenarlas en el modal de salida para edición
            if (elements.fechaSalidaVehiculoModalInput && vehiculo.fecha_salida) {
                const dateSalida = new Date(vehiculo.fecha_salida);
                if (!isNaN(dateSalida.getTime())) {
                    elements.fechaSalidaVehiculoModalInput.value = dateSalida.toISOString().split('T')[0];
                } else {
                    elements.fechaSalidaVehiculoModalInput.value = ''; // Limpiar si es inválida
                }
            }
            if (elements.horaSalidaVehiculoModalInput && vehiculo.hora_salida) {
                elements.horaSalidaVehiculoModalInput.value = vehiculo.hora_salida;
            }
        }
    }

    init(); // Iniciar la aplicación
});