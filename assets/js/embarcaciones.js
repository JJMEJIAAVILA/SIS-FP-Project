// assets/js/embarcaciones.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for embarcaciones.js'); // Debug: Confirm script loads

    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        apiBaseUrl: 'http://localhost:3000/api/embarcaciones' // URL de la API para embarcaciones
    };

    const state = {
        embarcacionesData: [], // Contendrá los datos de embarcaciones del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null, // Almacena el _id de MongoDB de la embarcación a editar
        embarcacionSalidaId: null // Almacena el _id de MongoDB de la embarcación para la salida
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
        salidaForm: document.getElementById('salidaForm'), // Formulario de salida (asumiendo que existe en embarcaciones.html)
        salidaRegistroForm: document.getElementById('salidaRegistroForm'), // Formulario de salida (asumiendo que existe)
        cancelSalidaBtn: document.getElementById('cancelSalidaBtn') // Botón cancelar salida (asumiendo que existe)
    };

    // --- Funciones de Inicialización ---
    async function init() {
        console.log('init() called'); // Debug: Confirm init is called
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
        console.log('setupEventListeners() called'); // Debug: Confirm setupEventListeners is called

        // Check if elements exist before adding listeners
        if (elements.newRegisterBtn) {
            elements.newRegisterBtn.addEventListener('click', showRegisterForm);
            console.log('Listener added to newRegisterBtn'); // Debug
        }
        if (elements.cancelFormBtn) {
            elements.cancelFormBtn.addEventListener('click', hideRegisterForm);
            console.log('Listener added to cancelFormBtn'); // Debug
        }

        // *** CRÍTICO: Verificar que elements.registerForm existe antes de añadir el listener ***
        if (elements.registerForm) {
            elements.registerForm.addEventListener('submit', handleFormSubmit);
            console.log('Listener added to registerForm for submit event'); // Debug
        } else {
            console.error('ERROR: registerForm element not found!'); // Debug: Crucial check
        }

        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', handleSearch);
            console.log('Listener added to searchInput'); // Debug
        }
        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', exportToExcel);
            console.log('Listener added to exportBtn'); // Debug
        }
        if (elements.prevPageBtn) {
            elements.prevPageBtn.addEventListener('click', goToPrevPage);
            console.log('Listener added to prevPageBtn'); // Debug
        }
        if (elements.nextPageBtn) {
            elements.nextPageBtn.addEventListener('click', goToNextPage);
            console.log('Listener added to nextPageBtn'); // Debug
        }
        if (elements.tableBody) {
            elements.tableBody.addEventListener('click', handleTableClick);
            console.log('Listener added to tableBody'); // Debug
        }

        // Asegúrate de que los elementos del formulario de salida existan antes de añadir listeners
        if (elements.salidaRegistroForm) {
            elements.salidaRegistroForm.addEventListener('submit', handleSalidaSubmit);
            console.log('Listener added to salidaRegistroForm'); // Debug
        }
        if (elements.cancelSalidaBtn) {
            elements.cancelSalidaBtn.addEventListener('click', hideSalidaForm);
            console.log('Listener added to cancelSalidaBtn'); // Debug
        }
    }

    // --- Funciones de Formulario de Registro/Edición de Embarcación ---
    function showRegisterForm() {
        console.log('showRegisterForm() called'); // Debug
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
        console.log('hideRegisterForm() called'); // Debug
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItemId = null; // Limpiar ID del item en edición
        elements.registerForm.reset(); // Resetear el formulario
    }

    async function handleFormSubmit(e) {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario (recargar la página)
        console.log('handleFormSubmit: Formulario enviado. (Paso 1)'); // DEBUG: Confirmar que la función se ejecuta

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            console.log('handleFormSubmit: No token found, redirecting.'); // DEBUG
            return;
        }

        const formData = new FormData(elements.registerForm);
        // Crear un objeto con los datos del formulario de embarcación
        const embarcacionData = {
            fechaRegistro: formData.get('fechaRegistro'),
            // CAMBIO CLAVE AQUÍ: Ahora se envía como 'piloto' para que coincida con el modelo
            piloto: formData.get('piloto').toUpperCase(), // <-- CORREGIDO: Usa el 'name="piloto"' del HTML
            nombre_embarcacion: formData.get('nombre_embarcacion').toUpperCase(),
            // El campo 'identificacion' no existe en el modelo, así que lo eliminamos de aquí
            tipo_embarcacion: formData.get('tipo_embarcacion').toUpperCase(),
            hora_entrada: formData.get('hora_entrada') || '-',
            observaciones: formData.get('observaciones').toUpperCase() || '-'
        };

        console.log('handleFormSubmit: Datos a enviar:', embarcacionData); // DEBUG: Mostrar los datos que se van a enviar

        // Validaciones básicas antes de enviar (puedes añadir más si es necesario)
        // CAMBIO AQUÍ: La validación ahora busca 'piloto' en lugar de 'identificacion'
        if (!embarcacionData.fechaRegistro || !embarcacionData.piloto || !embarcacionData.nombre_embarcacion || !embarcacionData.tipo_embarcacion || !embarcacionData.hora_entrada) {
            alert('Por favor, complete todos los campos obligatorios: Fecha de Registro, Nombre del Piloto, Nombre de la Embarcación, Tipo de Embarcación, Hora de Arribo.');
            console.error('handleFormSubmit: Campos obligatorios faltantes.'); // DEBUG: Registrar error de validación
            return;
        }

        try {
            let response;
            const headers = getAuthHeaders(); // Obtener cabeceras con token

            if (state.editMode) {
                console.log(`handleFormSubmit: Enviando PUT a ${config.apiBaseUrl}/${state.editItemId}`); // DEBUG
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(embarcacionData)
                });
            } else {
                console.log(`handleFormSubmit: Enviando POST a ${config.apiBaseUrl}`); // DEBUG
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(embarcacionData)
                });
            }

            // --- Manejo de errores mejorado ---
            if (!response.ok) {
                const errorText = await response.text(); // Lee el cuerpo una sola vez como texto
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el registro de embarcación: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText); // Intenta parsear como JSON
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('handleFormSubmit: Error en la respuesta del servidor:', errorMessage, response.status, errorText); // DEBUG
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Solo parsear si response.ok
            console.log('handleFormSubmit: Respuesta exitosa del servidor:', result); // DEBUG

            alert(`Registro de embarcación ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm(); // Ocultar formulario y resetear estado
            await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
        } catch (error) {
            console.error('handleFormSubmit: Error en la solicitud fetch:', error); // DEBUG
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    // --- Funciones de Formulario de Salida de Embarcación ---
    function showSalidaForm(itemId) {
        elements.newRegisterForm.classList.add('hidden'); // Ocultar formulario de registro
        if (elements.salidaForm) { // Asegurarse de que el elemento exista
            elements.salidaForm.classList.remove('hidden');
        }
        if (elements.salidaRegistroForm) { // Asegurarse de que el elemento exista
            elements.salidaRegistroForm.reset(); // Limpiar formulario de salida
        }
        state.embarcacionSalidaId = itemId; // Almacenar el ID de la embarcación para la salida

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
        state.embarcacionSalidaId = null; // Limpiar ID de la embarcación de salida
        if (elements.salidaRegistroForm) { // Asegurarse de que el elemento exista
            elements.salidaRegistroForm.reset(); // Resetear el formulario de salida
        }
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

        if (!fechaSalida || !horaSalida) {
            alert('La fecha y hora de salida son obligatorias.');
            return;
        }

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${state.embarcacionSalidaId}/salida`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ fecha_salida: fechaSalida, hora_salida: horaSalida })
            });

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

            const result = await response.json();

            alert('Fecha y hora de salida registradas exitosamente.');
            hideSalidaForm();
            await fetchAndRenderTable();
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
            elements.tableBody.innerHTML = `<tr><td colspan="10" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicie sesión.</td></tr>`;
            return;
        }
        try {
            const headers = getAuthHeaders();
            const response = await fetch(config.apiBaseUrl, {
                method: 'GET',
                headers: headers
            });

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
                state.embarcacionesData = [];
                renderTable();
                return;
            }

            const data = await response.json();

            // *** IMPORTANTE: Ajusta esto según la respuesta REAL de tu API de embarcaciones ***
            // Si tu backend devuelve { embarcaciones: [...] }, usa data.embarcaciones
            // Si tu backend devuelve directamente [...], usa data
            state.embarcacionesData = data.embarcaciones || data;

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de embarcaciones:', error);
            alert(`No se pudo conectar con el servidor para cargar las embarcaciones: ${error.message}`);
            state.embarcacionesData = [];
            renderTable();
        }
    }

    function renderTable() {
        const dataToRender = state.filteredData || state.embarcacionesData;
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
        // Asegúrate de que el colspan sea el número correcto de columnas en tu tabla HTML de embarcaciones
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach((embarcacion, index) => {
            // Formatear fechas y horas para visualización
            const formattedFechaRegistro = embarcacion.fechaRegistro ? new Date(embarcacion.fechaRegistro).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraEntrada = embarcacion.hora_entrada || '-';

            // Si fecha_salida es un Date object del backend, formatéalo. Si es string, úsalo.
            const formattedFechaSalida = embarcacion.fecha_salida ? new Date(embarcacion.fecha_salida).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraSalida = embarcacion.hora_salida || '-';


            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3 text-center">${formattedFechaRegistro}</td>
                <td class="px-4 py-3">${embarcacion.piloto || '-'}</td> <!-- CAMBIO AQUÍ: Mostrar 'piloto' -->
                <td class="px-4 py-3 text-center">${embarcacion.nombre_embarcacion || '-'}</td>
                <td class="px-4 py-3 text-center">${embarcacion.tipo_embarcacion || '-'}</td>
                <td class="px-4 py-3 text-center">${formattedHoraEntrada}</td>
                <td class="px-4 py-3 text-center">${formattedHoraSalida}</td>
                <td class="px-4 py-3 text-center">${formattedFechaSalida}</td>
                <td class="px-4 py-3">${embarcacion.observaciones || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${embarcacion._id}">Editar</button>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded salida-btn" data-id="${embarcacion._id}">Salida</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${embarcacion._id}">Eliminar</button>
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
            state.filteredData = state.embarcacionesData.filter(embarcacion =>
                Object.values(embarcacion).some(value =>
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
        const data = state.filteredData || state.embarcacionesData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    function exportToExcel() {
        const dataToExport = state.filteredData || state.embarcacionesData;
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

        // Define el orden manual de las columnas para el archivo Excel
        const headers = [
            'fechaRegistro', 'piloto', 'nombre_embarcacion', 'tipo_embarcacion', // CAMBIO AQUÍ: 'piloto' en lugar de 'identificacion'
            'hora_entrada', 'hora_salida', 'fecha_salida', 'observaciones'
        ];

        const data = exportableData.map(embarcacion =>
            headers.map(header => embarcacion[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Embarcaciones');

        XLSX.writeFile(workbook, 'registros_embarcaciones.xlsx');
        alert('Datos de embarcaciones exportados correctamente en formato Excel (.xlsx)');
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
        if (!confirm('¿Está seguro de que desea eliminar este registro de embarcación?')) {
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
                let errorMessage = `Error al eliminar registro: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            alert('Registro de embarcación eliminado exitosamente.');
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert(`Error de conexión con el servidor o al eliminar el registro: ${error.message}`);
        }
    }

    function loadEditData() {
        const embarcacion = state.embarcacionesData.find(p => p._id === state.editItemId);
        if (embarcacion) {
            // Rellenar el formulario con los datos de la embarcación
            elements.registerForm.fechaRegistro.value = embarcacion.fechaRegistro ? new Date(embarcacion.fechaRegistro).toISOString().split('T')[0] : '';
            // CAMBIO CLAVE AQUÍ: Cargar 'piloto' del backend en el campo 'piloto' del formulario
            elements.registerForm.piloto.value = embarcacion.piloto || ''; // <-- CORREGIDO
            elements.registerForm.nombre_embarcacion.value = embarcacion.nombre_embarcacion || '';
            elements.registerForm.tipo_embarcacion.value = embarcacion.tipo_embarcacion || '';
            elements.registerForm.hora_entrada.value = embarcacion.hora_entrada || '';
            elements.registerForm.observaciones.value = embarcacion.observaciones || '';
            // No cargar hora_salida o fecha_salida en el formulario de entrada
        }
    }

    init(); // Iniciar la aplicación
});