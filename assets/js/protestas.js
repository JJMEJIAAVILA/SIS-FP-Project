// assets/js/protestas.js - ACTUALIZADO (Deshabilitar botón Finalizar si la protesta ya está finalizada)

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for protestas.js');

    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        apiBaseUrl: 'http://localhost:3000/api/protestas' // URL de la API para protestas
    };

    const state = {
        protestasData: [], // Contendrá los datos de protestas del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null, // Almacena el _id de MongoDB de la protesta a editar
        currentProtestaIdToFinalize: null // ID de la protesta a finalizar
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

        // Elementos del modal de Finalizar Protesta
        finalizarProtestaModal: document.getElementById('finalizarProtestaModal'),
        finalizarProtestaForm: document.getElementById('finalizarProtestaForm'),
        finalizarProtestaId: document.getElementById('finalizarProtestaId'),
        finalizarProtestaHoraInicio: document.getElementById('finalizarProtestaHoraInicio'),
        finalizarProtestaFecha: document.getElementById('finalizarProtestaFecha'),
        modalHoraFinalizacion: document.getElementById('modalHoraFinalizacion'),
        modalFechaFinalizacion: document.getElementById('modalFechaFinalizacion'),
        cancelFinalizarModalBtn: document.getElementById('cancelFinalizarModalBtn')
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

        // Listeners para el cálculo del tiempo de bloqueo en el formulario principal
        if (elements.registerForm.hora_inicio) elements.registerForm.hora_inicio.addEventListener('change', calculateBlockTime);
        if (elements.registerForm.hora_finalizacion) elements.registerForm.hora_finalizacion.addEventListener('change', calculateBlockTime);
        if (elements.registerForm.fecha) elements.registerForm.fecha.addEventListener('change', calculateBlockTime); // Añadido para recalcular si la fecha de inicio cambia
        if (elements.registerForm.fecha_finalizacion) elements.registerForm.fecha_finalizacion.addEventListener('change', calculateBlockTime); // Añadido para recalcular si la fecha de finalización cambia

        // Listeners para el modal de Finalizar Protesta
        if (elements.cancelFinalizarModalBtn) elements.cancelFinalizarModalBtn.addEventListener('click', hideFinalizarProtestaModal);
        if (elements.finalizarProtestaForm) elements.finalizarProtestaForm.addEventListener('submit', handleFinalizarProtestaSubmit);
        if (elements.modalHoraFinalizacion) elements.modalHoraFinalizacion.addEventListener('change', calculateModalBlockTime);
        if (elements.modalFechaFinalizacion) elements.modalFechaFinalizacion.addEventListener('change', calculateModalBlockTime);
    }

    // Funciones de formulario principal
    function showRegisterForm() {
        console.log('showRegisterForm() called');
        elements.newRegisterForm.classList.remove('hidden');

        if (!state.editMode) {
            elements.registerForm.reset();
            // Autocompletar fecha actual en el campo de fecha si es un nuevo registro
            if (elements.registerForm.fecha) {
                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                elements.registerForm.fecha.value = `${year}-${month}-${day}`;
            }
            // Asegurarse de que el campo de fecha_finalizacion esté vacío al crear uno nuevo
            if (elements.registerForm.fecha_finalizacion) {
                elements.registerForm.fecha_finalizacion.value = '';
            }
        }

        if (elements.registerForm.tiempo_total_bloqueo) {
            elements.registerForm.tiempo_total_bloqueo.value = '';
        }
    }

    function hideRegisterForm() {
        console.log('hideRegisterForm() called');
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItemId = null;
        elements.registerForm.reset();
        if (elements.registerForm.hora_inicio) elements.registerForm.hora_inicio.removeEventListener('change', calculateBlockTime);
        if (elements.registerForm.hora_finalizacion) elements.registerForm.hora_finalizacion.removeEventListener('change', calculateBlockTime);
        if (elements.registerForm.fecha) elements.registerForm.fecha.removeEventListener('change', calculateBlockTime);
        if (elements.registerForm.fecha_finalizacion) elements.registerForm.fecha_finalizacion.removeEventListener('change', calculateBlockTime);
    }

    // Función para calcular el tiempo total del bloqueo (formulario principal)
    function calculateBlockTime() {
        const fechaInicio = elements.registerForm.fecha.value; // Usar fecha de inicio del formulario
        const startTime = elements.registerForm.hora_inicio.value;
        const fechaFin = elements.registerForm.fecha_finalizacion.value; // Usar fecha de finalización del formulario
        const endTime = elements.registerForm.hora_finalizacion.value;
        const tiempoTotalBloqueoInput = elements.registerForm.tiempo_total_bloqueo;

        // Llamar a la función auxiliar que maneja fechas completas
        tiempoTotalBloqueoInput.value = calculateBlockTimeFromDates(
            fechaInicio, startTime,
            fechaFin, endTime
        );
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('handleFormSubmit: Formulario enviado. (Paso 1)');
        console.log('handleFormSubmit: state.editMode =', state.editMode);
        console.log('handleFormSubmit: state.editItemId =', state.editItemId);

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const formData = new FormData(elements.registerForm);
        const protestaData = {
            fecha: formData.get('fecha'),
            tipo_protesta: formData.get('tipo_protesta').toUpperCase(),
            vias: formData.get('vias').toUpperCase() || '-',
            sector_bloqueo: formData.get('sector_bloqueo').toUpperCase() || '-',
            motivo_protesta: formData.get('motivo_protesta').toUpperCase() || '-',
            generador_protesta: formData.get('generador_protesta').toUpperCase() || '-',
            hora_inicio: formData.get('hora_inicio') || '-',
            hora_finalizacion: formData.get('hora_finalizacion') || '-',
            fecha_finalizacion: formData.get('fecha_finalizacion') || null, // Incluir fecha_finalizacion
            tiempo_total_bloqueo: formData.get('tiempo_total_bloqueo') || '-',
            geoposicion: formData.get('geoposicion').toUpperCase() || '-',
            observaciones: formData.get('observaciones').toUpperCase() || '-'
        };

        console.log('handleFormSubmit: Datos a enviar:', protestaData);

        if (!protestaData.fecha || !protestaData.tipo_protesta) {
            alert('Por favor, complete los campos obligatorios: Fecha y Tipo de Protesta.');
            console.error('handleFormSubmit: Campos obligatorios faltantes.');
            return;
        }

        try {
            let response;
            const headers = getAuthHeaders();

            if (state.editMode && state.editItemId) {
                console.log(`handleFormSubmit: Enviando PUT a ${config.apiBaseUrl}/${state.editItemId}`);
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(protestaData)
                });
            } else {
                console.log(`handleFormSubmit: Enviando POST a ${config.apiBaseUrl}`);
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(protestaData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el registro de protesta: HTTP status ${response.status}`;
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

            alert(`Registro de protesta ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm();
            await fetchAndRenderTable();
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
            elements.tableBody.innerHTML = `<tr><td colspan="14" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicia sesión.</td></tr>`; // Colspan actualizado
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
                state.protestasData = [];
                renderTable();
                return;
            }

            const data = await response.json();
            state.protestasData = data.protestas || data;

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de protestas:', error);
            alert(`No se pudo conectar con el servidor para cargar las protestas: ${error.message}`);
            state.protestasData = [];
            renderTable();
        }
    }

    function renderTable() {
        console.log('renderTable() called');
        const dataToRender = state.filteredData || state.protestasData;
        const start = (state.currentPage - 1) * config.itemsPerPage;
        const end = start + config.itemsPerPage;
        const pageData = dataToRender.slice(start, end);

        elements.tableBody.innerHTML = '';

        if (pageData.length === 0 && dataToRender.length === 0) {
            showNoDataMessage(true);
        } else if (pageData.length === 0 && dataToRender.length > 0) {
            showNoDataMessage(false);
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
                <td colspan="14" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `; // Colspan actualizado
    }

    function renderTableRows(data) {
        data.forEach((protesta, index) => {
            // Formatear la fecha de inicio usando componentes UTC
            const fechaInicioObj = protesta.fecha ? new Date(protesta.fecha) : null;
            const formattedFecha = fechaInicioObj ?
                `${String(fechaInicioObj.getUTCDate()).padStart(2, '0')}/${String(fechaInicioObj.getUTCMonth() + 1).padStart(2, '0')}/${fechaInicioObj.getUTCFullYear()}` : '-';

            // Formatear la fecha de finalización usando componentes UTC
            const fechaFinalizacionObj = protesta.fecha_finalizacion ? new Date(protesta.fecha_finalizacion) : null;
            const formattedFechaFinalizacion = fechaFinalizacionObj ?
                `${String(fechaFinalizacionObj.getUTCDate()).padStart(2, '0')}/${String(fechaFinalizacionObj.getUTCMonth() + 1).padStart(2, '0')}/${fechaFinalizacionObj.getUTCFullYear()}` : '-';

            // Determinar si la protesta ya está finalizada
            const isFinalized = !!protesta.fecha_finalizacion; // True si fecha_finalizacion no es null/undefined

            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3">${formattedFecha}</td>
                <td class="px-4 py-3">${protesta.tipo_protesta || '-'}</td>
                <td class="px-4 py-3">${protesta.vias || '-'}</td>
                <td class="px-4 py-3">${protesta.sector_bloqueo || '-'}</td>
                <td class="px-4 py-3">${protesta.motivo_protesta || '-'}</td>
                <td class="px-4 py-3">${protesta.generador_protesta || '-'}</td>
                <td class="px-4 py-3">${protesta.hora_inicio || '-'}</td>
                <td class="px-4 py-3">${protesta.hora_finalizacion || '-'}</td>
                <td class="px-4 py-3">${formattedFechaFinalizacion}</td>
                <td class="px-4 py-3">${protesta.tiempo_total_bloqueo || '-'}</td>
                <td class="px-4 py-3">${protesta.geoposicion || '-'}</td>
                <td class="px-4 py-3">${protesta.observaciones || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${protesta._id}">Editar</button>
                    ${isFinalized
                ? `<button class="bg-gray-500 text-white px-2 py-1 rounded cursor-not-allowed" disabled>Finalizado</button>`
                : `<button class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded finalizar-btn" data-id="${protesta._id}" data-hora-inicio="${protesta.hora_inicio}" data-fecha-protesta="${protesta.fecha ? new Date(protesta.fecha).toISOString().split('T')[0] : ''}">Finalizar</button>`
            }
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${protesta._id}">Eliminar</button>
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

    // Funciones de búsqueda
    function handleSearch() {
        const searchTerm = this.value.toUpperCase();
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.protestasData.filter(protesta =>
                Object.values(protesta).some(value =>
                    value !== null && String(value).toUpperCase().includes(searchTerm)
                )
            );
        }
        state.currentPage = config.defaultPage;
        renderTable();
    }

    // Navegación de páginas
    function goToPrevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    }

    function goToNextPage() {
        const data = state.filteredData || state.protestasData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);

        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos
    function exportExcel() {
        if (state.protestasData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const exportableData = state.protestasData.map(item => {
            const newItem = { ...item };
            delete newItem._id;
            delete newItem.__v;

            // Formatear fechas para Excel usando componentes UTC
            const fechaInicioExcel = newItem.fecha ? new Date(newItem.fecha) : null;
            newItem.fecha = fechaInicioExcel ?
                `${String(fechaInicioExcel.getUTCDate()).padStart(2, '0')}/${String(fechaInicioExcel.getUTCMonth() + 1).padStart(2, '0')}/${fechaInicioExcel.getUTCFullYear()}` : '-';

            const fechaFinalizacionExcel = newItem.fecha_finalizacion ? new Date(newItem.fecha_finalizacion) : null;
            newItem.fecha_finalizacion = fechaFinalizacionExcel ?
                `${String(fechaFinalizacionExcel.getUTCDate()).padStart(2, '0')}/${String(fechaFinalizacionExcel.getUTCMonth() + 1).padStart(2, '0')}/${fechaFinalizacionExcel.getUTCFullYear()}` : '-';

            return newItem;
        });

        const headers = [
            'fecha', 'tipo_protesta', 'vias', 'sector_bloqueo', 'motivo_protesta',
            'generador_protesta', 'hora_inicio', 'hora_finalizacion', 'fecha_finalizacion',
            'tiempo_total_bloqueo', 'geoposicion', 'observaciones'
        ];

        const data = exportableData.map(protesta =>
            headers.map(header => protesta[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro_Protestas");
        XLSX.writeFile(workbook, "registros_protestas.xlsx");
        alert('Datos exportados a Excel correctamente.');
    }

    function handleTableClick(e) {
        const itemId = e.target.dataset.id;
        if (!itemId) return;

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(itemId);
        } else if (e.target.classList.contains('finalizar-btn')) {
            const horaInicio = e.target.dataset.horaInicio;
            const fechaProtesta = e.target.dataset.fechaProtesta; // Fecha de inicio de la protesta (YYYY-MM-DD)
            showFinalizarProtestaModal(itemId, horaInicio, fechaProtesta);
        } else if (e.target.classList.contains('delete-btn')) {
            handleDelete(itemId);
        }
    }

    async function handleEdit(itemId) {
        state.editMode = true;
        state.editItemId = itemId;
        console.log('handleEdit: Setting editMode = true, editItemId =', state.editItemId);

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${itemId}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al cargar datos para edición: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al cargar edición: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const protesta = await response.json();
            console.log('Datos de protesta para edición cargados:', protesta);

            if (protesta) {
                // Formatear la fecha de inicio para el input type="date"
                elements.registerForm.fecha.value = protesta.fecha ? new Date(protesta.fecha).toISOString().split('T')[0] : '';
                elements.registerForm.tipo_protesta.value = protesta.tipo_protesta || '';
                elements.registerForm.vias.value = protesta.vias || '';
                elements.registerForm.sector_bloqueo.value = protesta.sector_bloqueo || '';
                elements.registerForm.motivo_protesta.value = protesta.motivo_protesta || '';
                elements.registerForm.generador_protesta.value = protesta.generador_protesta || '';
                elements.registerForm.hora_inicio.value = protesta.hora_inicio || '';
                elements.registerForm.hora_finalizacion.value = protesta.hora_finalizacion || '';
                // Cargar fecha de finalización para el input type="date"
                elements.registerForm.fecha_finalizacion.value = protesta.fecha_finalizacion ? new Date(protesta.fecha_finalizacion).toISOString().split('T')[0] : '';
                elements.registerForm.tiempo_total_bloqueo.value = protesta.tiempo_total_bloqueo || '';
                elements.registerForm.geoposicion.value = protesta.geoposicion || '';
                elements.registerForm.observaciones.value = protesta.observaciones || '';

                calculateBlockTime(); // Recalcular el tiempo de bloqueo después de cargar los datos
                showRegisterForm(); // Mostrar el formulario con los datos cargados
            }
        } catch (error) {
            console.error('Error al cargar datos para edición:', error);
            alert(`Error de conexión con el servidor o al cargar datos para edición: ${error.message}`);
        }
    }

    async function handleDelete(itemId) {
        if (!confirm('¿Está seguro de que desea eliminar este registro de protesta?')) {
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
                    errorMessage = `Error inesperado del servidor al eliminar: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            alert('Registro de protesta eliminado exitosamente.');
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert(`Error de conexión con el servidor o al eliminar el registro: ${error.message}`);
        }
    }

    // --- Funciones del Modal de Finalizar Protesta ---
    async function showFinalizarProtestaModal(protestaId, horaInicio, fechaProtesta) {
        console.log('showFinalizarProtestaModal() called for ID:', protestaId);
        state.currentProtestaIdToFinalize = protestaId;
        elements.finalizarProtestaId.value = protestaId;
        elements.finalizarProtestaHoraInicio.value = horaInicio; // Hora de inicio de la protesta
        elements.finalizarProtestaFecha.value = fechaProtesta; // Fecha de inicio de la protesta (YYYY-MM-DD)

        // Autocompletar con la hora y fecha actuales
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

        elements.modalHoraFinalizacion.value = currentTime;
        elements.modalFechaFinalizacion.value = currentDate;

        // Calcular el tiempo de bloqueo inicial al abrir el modal (si ya hay datos)
        calculateModalBlockTime();

        elements.finalizarProtestaModal.classList.remove('hidden');
    }

    function hideFinalizarProtestaModal() {
        console.log('hideFinalizarProtestaModal() called');
        elements.finalizarProtestaModal.classList.add('hidden');
        state.currentProtestaIdToFinalize = null;
        elements.finalizarProtestaForm.reset();
    }

    // Función para calcular el tiempo total del bloqueo en el modal
    function calculateModalBlockTime() {
        const fechaInicio = elements.finalizarProtestaFecha.value;
        const horaInicio = elements.finalizarProtestaHoraInicio.value;
        const fechaFin = elements.modalFechaFinalizacion.value;
        const horaFin = elements.modalHoraFinalizacion.value;

        const tiempoCalculado = calculateBlockTimeFromDates(
            fechaInicio, horaInicio,
            fechaFin, horaFin
        );
        console.log(`Tiempo calculado en modal: ${tiempoCalculado}`);
        return tiempoCalculado;
    }

    async function handleFinalizarProtestaSubmit(e) {
        e.preventDefault();
        console.log('handleFinalizarProtestaSubmit: Formulario de finalización enviado.');

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const protestaId = elements.finalizarProtestaId.value;
        const horaFinalizacion = elements.modalHoraFinalizacion.value;
        const fechaFinalizacion = elements.modalFechaFinalizacion.value;
        const horaInicioOriginal = elements.finalizarProtestaHoraInicio.value;
        const fechaProtestaOriginal = elements.finalizarProtestaFecha.value;


        if (!horaFinalizacion || !fechaFinalizacion) {
            alert('Por favor, complete la hora y fecha de finalización.');
            return;
        }

        // Recalcular el tiempo total del bloqueo usando las horas y fechas originales y las de finalización del modal
        const tiempoTotalBloqueoCalculado = calculateBlockTimeFromDates(
            fechaProtestaOriginal, horaInicioOriginal,
            fechaFinalizacion, horaFinalizacion
        );


        const updateData = {
            hora_finalizacion: horaFinalizacion,
            fecha_finalizacion: fechaFinalizacion, // Enviar la fecha de finalización
            tiempo_total_bloqueo: tiempoTotalBloqueoCalculado
        };

        console.log('Finalizar Protesta Data to send:', updateData);

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${protestaId}/finalizar`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al finalizar protesta: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al finalizar: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('handleFinalizarProtestaSubmit: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Protesta finalizada exitosamente:', result);
            alert('Protesta finalizada exitosamente.');

            hideFinalizarProtestaModal();
            await fetchAndRenderTable(); // Recargar la tabla para mostrar los cambios
        } catch (error) {
            console.error('Error al finalizar protesta:', error);
            alert(`Error de conexión con el servidor o al finalizar la protesta: ${error.message}`);
        }
    }

    // Nueva función auxiliar para calcular tiempo total de bloqueo con fechas completas
    function calculateBlockTimeFromDates(fechaInicioStr, horaInicioStr, fechaFinStr, horaFinStr) {
        if (!fechaInicioStr || !horaInicioStr || !fechaFinStr || !horaFinStr) {
            return '-'; // Retorna '-' si faltan datos
        }

        try {
            // Combinar fecha y hora para crear objetos Date
            // Importante: Crear las fechas en UTC para evitar problemas de zona horaria
            const startDateTime = new Date(`${fechaInicioStr}T${horaInicioStr}:00Z`); // 'Z' indica UTC
            const endDateTime = new Date(`${fechaFinStr}T${horaFinStr}:00Z`); // 'Z' indica UTC

            // Verificar si las fechas son válidas
            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                console.error('Fechas o horas inválidas para el cálculo del bloqueo.');
                return '-';
            }

            // Calcular la diferencia en milisegundos
            const diffMs = endDateTime.getTime() - startDateTime.getTime();

            if (diffMs < 0) {
                // Si la hora de finalización es anterior a la de inicio, o la fecha de finalización es anterior
                return 'Tiempo inválido';
            }

            // Convertir milisegundos a horas, minutos y segundos
            const diffSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(diffSeconds / 3600);
            const minutes = Math.floor((diffSeconds % 3600) / 60);
            const seconds = diffSeconds % 60;

            let result = '';
            if (hours > 0) {
                result += `${hours}h `;
            }
            if (minutes > 0) {
                result += `${minutes}m `;
            }
            if (seconds > 0 || (hours === 0 && minutes === 0)) { // Mostrar segundos si no hay horas/minutos
                result += `${seconds}s`;
            }

            return result.trim();
        } catch (error) {
            console.error('Error al calcular el tiempo de bloqueo:', error);
            return '-';
        }
    }

    init(); // Iniciar la aplicación
});