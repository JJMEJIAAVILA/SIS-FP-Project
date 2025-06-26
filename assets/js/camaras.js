// assets/js/camaras.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for camaras.js');

    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        apiBaseUrl: 'http://localhost:3000/api/camaras' // URL de la API para cámaras
    };

    const state = {
        camarasData: [], // Contendrá los datos de cámaras del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null, // Almacena el _id de MongoDB de la cámara a editar
        currentHistorialCamaraId: null // ID de la cámara cuyo historial se está viendo/editando
    };

    const elements = {
        tableBody: document.getElementById('tableBody'),
        newRegisterForm: document.getElementById('newRegisterForm'),
        registerForm: document.getElementById('registerForm'),
        newRegisterBtn: document.getElementById('newRegisterBtn'),
        cancelFormBtn: document.getElementById('cancelFormBtn'),
        searchInput: document.getElementById('searchInput'),
        exportExcelBtn: document.getElementById('exportExcelBtn'),
        currentRecordsSpan: document.getElementById('currentRecords'),
        currentPageSpan: document.getElementById('currentPage'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        userDisplay: document.getElementById('userDisplay'),

        // Elementos del modal de historial
        historialModal: document.getElementById('historialModal'),
        historialCamaraNombre: document.getElementById('historialCamaraNombre'),
        historialCamaraArea: document.getElementById('historialCamaraArea'),
        historialCamaraId: document.getElementById('historialCamaraId'), // Hidden input para el ID de la cámara
        addHistorialEntryForm: document.getElementById('addHistorialEntryForm'),
        historialModalBody: document.getElementById('historialModalBody'),
        closeHistorialModalBtn: document.getElementById('closeHistorialModalBtn')
    };

    // --- Funciones de Inicialización ---
    async function init() {
        console.log('init() called');
        if (!await checkAuthentication()) {
            return;
        }
        loadUser();
        setupEventListeners();
        await fetchAndRenderTable(); // Cargar datos desde el backend al inicio
    }

    // --- Protección de la Ruta (Verificación de Token) ---
    async function checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
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
        console.log('setupEventListeners() called');

        if (elements.newRegisterBtn) elements.newRegisterBtn.addEventListener('click', showRegisterForm);
        if (elements.cancelFormBtn) elements.cancelFormBtn.addEventListener('click', hideRegisterForm);
        if (elements.registerForm) elements.registerForm.addEventListener('submit', handleFormSubmit);
        else console.error('ERROR: registerForm element not found!');

        if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearch);
        if (elements.exportExcelBtn) elements.exportExcelBtn.addEventListener('click', exportExcel);
        if (elements.prevPageBtn) elements.prevPageBtn.addEventListener('click', goToPrevPage);
        if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', goToNextPage);
        if (elements.tableBody) elements.tableBody.addEventListener('click', handleTableClick);

        // Listeners para el modal de historial
        if (elements.closeHistorialModalBtn) elements.closeHistorialModalBtn.addEventListener('click', hideHistorialModal);
        if (elements.addHistorialEntryForm) elements.addHistorialEntryForm.addEventListener('submit', handleAddHistorialEntry);
    }

    // --- Funciones de Formulario de Registro/Edición de Cámara ---
    function showRegisterForm() {
        console.log('showRegisterForm() called');
        elements.newRegisterForm.classList.remove('hidden');
        elements.registerForm.reset();
        state.editMode = false; // Asegurarse de que no estamos en modo edición al abrir para nuevo registro
        state.editItemId = null;

        // Establecer estado_actual predeterminado si es un nuevo registro
        if (!state.editMode) {
            elements.registerForm.estado_actual.value = 'FUNCIONANDO';
        }
    }

    function hideRegisterForm() {
        console.log('hideRegisterForm() called');
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItemId = null;
        elements.registerForm.reset();
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('handleFormSubmit: Formulario enviado. (Paso 1)');

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const formData = new FormData(elements.registerForm);
        const camaraData = {
            area: formData.get('area').toUpperCase(),
            camara: formData.get('camara').toUpperCase(),
            tipo: formData.get('tipo').toUpperCase(),
            estado_actual: formData.get('estado_actual').toUpperCase(),
            observaciones_general: formData.get('observaciones_general').toUpperCase() || '-'
        };

        console.log('handleFormSubmit: Datos a enviar:', camaraData);

        // Validaciones básicas
        if (!camaraData.area || !camaraData.camara || !camaraData.tipo || !camaraData.estado_actual) {
            alert('Por favor, complete todos los campos obligatorios: Área, Cámara, Tipo, Estado Actual.');
            console.error('handleFormSubmit: Campos obligatorios faltantes.');
            return;
        }

        try {
            let response;
            const headers = getAuthHeaders();

            if (state.editMode) {
                console.log(`handleFormSubmit: Enviando PUT a ${config.apiBaseUrl}/${state.editItemId}`);
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(camaraData)
                });
            } else {
                console.log(`handleFormSubmit: Enviando POST a ${config.apiBaseUrl}`);
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(camaraData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el registro de cámara: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('handleFormSubmit: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('handleFormSubmit: Respuesta exitosa del servidor:', result);

            alert(`Registro de cámara ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm();
            await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
        } catch (error) {
            console.error('handleFormSubmit: Error en la solicitud fetch:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    // --- Funciones de Tabla y Datos ---
    async function fetchAndRenderTable() {
        console.log('fetchAndRenderTable() called');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. Cannot fetch data.');
            elements.tableBody.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicia sesión.</td></tr>`;
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
                state.camarasData = [];
                renderTable();
                return;
            }

            const data = await response.json();
            state.camarasData = data.camaras || data; // Asume que la respuesta es { camaras: [...] } o un array directo

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de cámaras:', error);
            alert(`No se pudo conectar con el servidor para cargar las cámaras: ${error.message}`);
            state.camarasData = [];
            renderTable();
        }
    }

    function renderTable() {
        console.log('renderTable() called');
        const dataToRender = state.filteredData || state.camarasData;
        const start = (state.currentPage - 1) * config.itemsPerPage;
        const end = start + config.itemsPerPage;
        const pageData = dataToRender.slice(start, end);

        elements.tableBody.innerHTML = '';

        if (pageData.length === 0 && dataToRender.length === 0) {
            showNoDataMessage(true);
        } else if (pageData.length === 0 && dataToRender.length > 0) {
            showNoDataMessage(false); // No hay resultados para la búsqueda
        }
        else {
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
                <td colspan="9" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach((camara, index) => {
            const formattedUltimaFalla = camara.ultima_fecha_falla ? new Date(camara.ultima_fecha_falla).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedUltimoArreglo = camara.ultima_fecha_arreglo ? new Date(camara.ultima_fecha_arreglo).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';

            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3">${camara.area || '-'}</td>
                <td class="px-4 py-3">${camara.camara || '-'}</td>
                <td class="px-4 py-3">${camara.tipo || '-'}</td>
                <td class="px-4 py-3">${camara.estado_actual || '-'}</td>
                <td class="px-4 py-3 text-center">${formattedUltimaFalla}</td>
                <td class="px-4 py-3 text-center">${formattedUltimoArreglo}</td>
                <td class="px-4 py-3">${camara.observaciones_general || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${camara._id}">Editar</button>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded historial-btn" data-id="${camara._id}" data-camara="${camara.camara}" data-area="${camara.area}">Historial</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${camara._id}">Eliminar</button>
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

    // --- Funciones de Búsqueda y Paginación ---
    function handleSearch() {
        const searchTerm = this.value.toUpperCase();
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.camarasData.filter(camara =>
                Object.values(camara).some(value =>
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
        const data = state.filteredData || state.camarasData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // --- Exportación de Datos ---
    function exportExcel() {
        if (state.camarasData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const exportableData = state.camarasData.map(item => {
            const newItem = { ...item };
            delete newItem._id;
            delete newItem.__v;
            delete newItem.historial; // No exportar el array de historial directamente

            // Formatear fechas para Excel
            newItem.ultima_fecha_falla = newItem.ultima_fecha_falla ? new Date(newItem.ultima_fecha_falla).toLocaleDateString('es-ES') : '-';
            newItem.ultima_fecha_arreglo = newItem.ultima_fecha_arreglo ? new Date(newItem.ultima_fecha_arreglo).toLocaleDateString('es-ES') : '-';

            return newItem;
        });

        // Definir el orden manual de las columnas para el Excel
        const headers = [
            'area', 'camara', 'tipo', 'estado_actual',
            'ultima_fecha_falla', 'ultima_fecha_arreglo', 'observaciones_general'
        ];

        const data = exportableData.map(camara =>
            headers.map(header => camara[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro_Camaras");
        XLSX.writeFile(workbook, "registros_camaras.xlsx");
        alert('Datos exportados a Excel correctamente');
    }

    // --- Funciones de Acción en la Tabla (Editar, Historial, Eliminar) ---
    async function handleTableClick(e) {
        const itemId = e.target.dataset.id;
        if (!itemId) return;

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(itemId);
        } else if (e.target.classList.contains('historial-btn')) {
            const camaraNombre = e.target.dataset.camara;
            const camaraArea = e.target.dataset.area;
            await showHistorialModal(itemId, camaraNombre, camaraArea);
        } else if (e.target.classList.contains('delete-btn')) {
            await handleDelete(itemId);
        }
    }

    function handleEdit(itemId) {
        state.editMode = true;
        state.editItemId = itemId;
        const camara = state.camarasData.find(c => c._id === state.editItemId);
        if (camara) {
            elements.registerForm.area.value = camara.area || '';
            elements.registerForm.camara.value = camara.camara || '';
            elements.registerForm.tipo.value = camara.tipo || '';
            elements.registerForm.estado_actual.value = camara.estado_actual || '';
            elements.registerForm.observaciones_general.value = camara.observaciones_general || '';
            showRegisterForm();
        }
    }

    async function handleDelete(itemId) {
        if (!confirm('¿Está seguro de que desea eliminar este registro de cámara?')) {
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
            alert('Registro de cámara eliminado exitosamente.');
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert(`Error de conexión con el servidor o al eliminar el registro: ${error.message}`);
        }
    }

    // --- Funciones del Modal de Historial ---
    async function showHistorialModal(camaraId, camaraNombre, camaraArea) {
        console.log(`showHistorialModal() called for ID: ${camaraId}`);
        state.currentHistorialCamaraId = camaraId;
        elements.historialCamaraNombre.textContent = camaraNombre;
        elements.historialCamaraArea.textContent = camaraArea;
        elements.historialCamaraId.value = camaraId; // Set hidden input value

        // Autocompletar fecha de evento con la fecha actual por defecto
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        elements.addHistorialEntryForm.fecha_evento_historial.value = `${year}-${month}-${day}`;
        elements.addHistorialEntryForm.estado_actual_historial.value = ''; // Limpiar selección previa
        elements.addHistorialEntryForm.observaciones_historial.value = ''; // Limpiar observaciones

        await fetchAndRenderHistorial(camaraId);
        elements.historialModal.classList.remove('hidden');
    }

    function hideHistorialModal() {
        console.log('hideHistorialModal() called');
        elements.historialModal.classList.add('hidden');
        state.currentHistorialCamaraId = null;
        elements.historialModalBody.innerHTML = ''; // Limpiar el contenido del historial al cerrar
    }

    async function fetchAndRenderHistorial(camaraId) {
        console.log(`fetchAndRenderHistorial() called for ID: ${camaraId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. Cannot fetch historial data.');
            elements.historialModalBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-400">No autenticado para ver historial.</td></tr>`;
            return;
        }

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${camaraId}/historial`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al cargar historial: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al cargar historial: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('fetchAndRenderHistorial: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                elements.historialModalBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-red-400">${errorMessage}</td></tr>`;
                return;
            }

            const data = await response.json();
            console.log('Historial recibido:', data.historial);
            renderHistorialEntries(data.historial);

        } catch (error) {
            console.error('Error al cargar el historial de la cámara:', error);
            alert(`Error de conexión con el servidor al cargar historial: ${error.message}`);
            elements.historialModalBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-red-400">Error de conexión al cargar historial.</td></tr>`;
        }
    }

    function renderHistorialEntries(historial) {
        elements.historialModalBody.innerHTML = '';
        if (historial && historial.length > 0) {
            historial.forEach(entry => {
                const formattedFechaEvento = entry.fecha_evento ? new Date(entry.fecha_evento).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
                const row = document.createElement('tr');
                row.className = 'hover:bg-white hover:bg-opacity-10';
                row.innerHTML = `
                    <td class="px-4 py-3 text-center">${formattedFechaEvento}</td>
                    <td class="px-4 py-3">${entry.estado_en_momento || '-'}</td>
                    <td class="px-4 py-3">${entry.observaciones_historial || '-'}</td>
                `;
                elements.historialModalBody.appendChild(row);
            });
        } else {
            elements.historialModalBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-400">No hay entradas en el historial.</td></tr>`;
        }
    }

    async function handleAddHistorialEntry(e) {
        e.preventDefault();
        console.log('handleAddHistorialEntry: Formulario de historial enviado.');

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const camaraId = elements.historialCamaraId.value;
        const formData = new FormData(elements.addHistorialEntryForm);
        const historialEntryData = {
            estado_actual: formData.get('estado_actual_historial').toUpperCase(),
            fecha_evento: formData.get('fecha_evento_historial'),
            observaciones_historial: formData.get('observaciones_historial').toUpperCase() || '-'
        };

        console.log('Historial Entry Data to send:', historialEntryData);

        if (!historialEntryData.estado_actual || !historialEntryData.fecha_evento) {
            alert('Por favor, complete el estado y la fecha del evento para el historial.');
            return;
        }

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${camaraId}/historial`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(historialEntryData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al añadir entrada al historial: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al añadir historial: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('handleAddHistorialEntry: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Historial entry added successfully:', result);
            alert('Entrada de historial añadida exitosamente.');

            // Recargar la tabla principal para reflejar el último estado/falla/arreglo
            await fetchAndRenderTable();
            // Recargar el historial del modal para mostrar la nueva entrada
            await fetchAndRenderHistorial(camaraId);
            elements.addHistorialEntryForm.reset(); // Limpiar el formulario del modal
            // Restablecer el estado_actual del formulario a "Seleccione..."
            elements.addHistorialEntryForm.estado_actual_historial.value = '';

        } catch (error) {
            console.error('Error al añadir entrada de historial:', error);
            alert(`Error de conexión con el servidor o al añadir entrada de historial: ${error.message}`);
        }
    }

    init(); // Iniciar la aplicación
}); 