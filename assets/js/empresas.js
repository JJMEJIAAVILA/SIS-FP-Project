// assets/js/empresas.js - ACTUALIZADO para autocompletar fecha/hora, usar IDs y corregir problema de zona horaria

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial User Display Setup ---
    const userDisplayElement = document.getElementById('userDisplay');
    const storedUsername = localStorage.getItem('username');

    if (userDisplayElement) {
        if (storedUsername) {
            userDisplayElement.textContent = storedUsername.toUpperCase(); // Usuario en MAYÚSCULAS
        } else {
            userDisplayElement.textContent = 'INVITADO';
        }
    }

    // --- CONFIGURACIÓN DE LA APLICACIÓN ---
    const config = {
        apiBaseUrl: 'http://localhost:3000/api/empresas',
        itemsPerPage: 10,
        defaultPage: 1
    };

    const state = {
        empresasData: [],
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null,
        empresaSalidaId: null // Almacena el ID de la empresa para el registro de salida
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
        // Elementos del modal de salida
        salidaForm: document.getElementById('salidaForm'),
        salidaRegistroForm: document.getElementById('salidaRegistroForm'),
        cancelSalidaBtn: document.getElementById('cancelSalidaBtn'),

        // --- ELEMENTOS DE FECHA Y HORA POR ID ---
        fechaEntradaInput: document.getElementById('fechaEntradaEmpresa'),
        horaEntradaInput: document.getElementById('horaEntradaEmpresa'),
        fechaSalidaModalInput: document.getElementById('fechaSalidaEmpresaModal'),
        horaSalidaModalInput: document.getElementById('horaSalidaEmpresaModal')
    };

    // --- Funciones Auxiliares para Fecha y Hora ---
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Meses son 0-11
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // --- Funciones de UI (MOVIDAS ARRIBA PARA ASEGURAR DEFINICIÓN) ---
    function updateUI(data, end) {
        elements.currentRecordsSpan.textContent = data.length;
        elements.currentPageSpan.textContent = state.currentPage;
        elements.prevPageBtn.disabled = state.currentPage === 1;
        elements.nextPageBtn.disabled = end >= data.length;
    }

    function showNoDataMessage(isTotalEmpty) {
        let message = isTotalEmpty
            ? 'No hay registros disponibles. Agregue un nuevo registro.'
            : 'No se encontraron resultados para su búsqueda.';
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="16" class="px-6 py-4 text-center text-gray-400"> <!-- Colspan corregido a 16 -->
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach((empresa, index) => {
            // Formatear fechas y horas para visualización
            // IMPORTANTE: Asegúrate de que fecha_entrada y fecha_salida sean objetos Date válidos
            // Si son ISO strings del backend, new Date() los parseará correctamente.
            const formattedFechaEntrada = empresa.fecha_entrada ? new Date(empresa.fecha_entrada).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraEntrada = empresa.hora_entrada || '-';

            const formattedFechaSalida = empresa.fecha_salida ? new Date(empresa.fecha_salida).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            const formattedHoraSalida = empresa.hora_salida || '-';

            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3 text-center">${formattedFechaEntrada}</td>
                <td class="px-4 py-3 text-center">${formattedHoraEntrada}</td>
                <td class="px-4 py-3 text-center">${formattedFechaSalida}</td>
                <td class="px-4 py-3 text-center">${formattedHoraSalida}</td>
                <td class="px-4 py-3">${empresa.nombre_empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.identificacion || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.area_ingreso || '-'}</td>
                <td class="px-4 py-3">${empresa.empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.carne || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.tipo_empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.dependencia || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.dispositivo || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.codigo_dispositivo || '-'}</td>
                <td class="px-4 py-3">${empresa.observaciones || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${empresa._id}">Editar</button>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded salida-btn" data-id="${empresa._id}">Salida</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${empresa._id}">Eliminar</button>
                </td>
            `;
            elements.tableBody.appendChild(row);
        });
    }

    // --- Funciones de Inicialización ---
    async function init() {
        if (!await checkAuthentication()) {
            return;
        }
        setupEventListeners();
        await fetchAndRenderTable();
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

    function setupEventListeners() {
        elements.newRegisterBtn.addEventListener('click', showRegisterForm);
        elements.cancelFormBtn.addEventListener('click', hideRegisterForm);
        elements.registerForm.addEventListener('submit', handleFormSubmit);
        elements.searchInput.addEventListener('input', handleSearch);
        elements.exportBtn.addEventListener('click', exportToExcel);
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
        elements.nextPageBtn.addEventListener('click', goToNextPage);
        elements.tableBody.addEventListener('click', handleTableClick);

        // Listeners para el formulario de salida
        if (elements.salidaRegistroForm) {
            elements.salidaRegistroForm.addEventListener('submit', handleSalidaSubmit);
        }
        if (elements.cancelSalidaBtn) {
            elements.cancelSalidaBtn.addEventListener('click', hideSalidaForm);
        }
    }

    // --- Funciones de Formulario de Registro/Edición de Empresa ---
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
            if (elements.fechaEntradaInput) {
                elements.fechaEntradaInput.value = getCurrentDate();
            }
            if (elements.horaEntradaInput) {
                elements.horaEntradaInput.value = getCurrentTime();
            }
        }
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItemId = null;
        elements.registerForm.reset();
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

        // --- INICIO DE LA CORRECCIÓN DE ZONA HORARIA PARA FECHA DE ENTRADA ---
        const rawFechaEntrada = formData.get('fecha_entrada'); // "YYYY-MM-DD"
        let fechaEntradaISO = null;
        if (rawFechaEntrada) {
            // Crea un objeto Date en la zona horaria local para el inicio del día
            const localDate = new Date(`${rawFechaEntrada}T00:00:00`);
            // Convierte esa fecha local a un ISO string UTC
            fechaEntradaISO = localDate.toISOString();
        }
        // --- FIN DE LA CORRECCIÓN DE ZONA HORARIA ---

        const empresaData = {
            fecha_entrada: fechaEntradaISO, // Envía la fecha corregida en ISO 8601
            hora_entrada: formData.get('hora_entrada'),
            nombre_empresa: formData.get('nombre_empresa').toUpperCase(),
            identificacion: formData.get('identificacion').toUpperCase(),
            area_ingreso: formData.get('area_ingreso').toUpperCase(),
            empresa: formData.get('empresa').toUpperCase(),
            carne: formData.get('carne').toUpperCase() || '-',
            tipo_empresa: formData.get('tipo_empresa').toUpperCase(),
            dependencia: formData.get('dependencia').toUpperCase() || '-',
            dispositivo: formData.get('dispositivo').toUpperCase() || '-',
            codigo_dispositivo: formData.get('codigo_dispositivo').toUpperCase() || '-',
            observaciones: formData.get('observaciones').toUpperCase() || '-'
        };

        try {
            let response;
            const headers = getAuthHeaders();

            if (state.editMode) {
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(empresaData)
                });
            } else {
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(empresaData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el registro: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            alert(`Registro ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm();
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error en la solicitud al backend:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    // --- Funciones de Formulario de Salida de Empresa ---
    function showSalidaForm(itemId) {
        elements.newRegisterForm.classList.add('hidden'); // Ocultar formulario de registro
        if (elements.salidaForm) {
            elements.salidaForm.classList.remove('hidden');
        }
        if (elements.salidaRegistroForm) {
            elements.salidaRegistroForm.reset();
        }
        state.empresaSalidaId = itemId; // Almacenar el ID de la empresa para la salida

        // Autocompletar fecha y hora actuales para el modal de salida
        if (elements.fechaSalidaModalInput) {
            elements.fechaSalidaModalInput.value = getCurrentDate();
        }
        if (elements.horaSalidaModalInput) {
            elements.horaSalidaModalInput.value = getCurrentTime();
        }
    }

    function hideSalidaForm() {
        if (elements.salidaForm) {
            elements.salidaForm.classList.add('hidden');
        }
        state.empresaSalidaId = null;
        if (elements.salidaRegistroForm) {
            elements.salidaRegistroForm.reset();
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
        const rawFechaSalida = elements.fechaSalidaModalInput.value; // "YYYY-MM-DD"
        let fechaSalidaISO = null;
        if (rawFechaSalida) {
            // Crea un objeto Date en la zona horaria local para el inicio del día
            const localDate = new Date(`${rawFechaSalida}T00:00:00`);
            // Convierte esa fecha local a un ISO string UTC
            fechaSalidaISO = localDate.toISOString();
        }
        // --- FIN DE LA CORRECCIÓN DE ZONA HORARIA ---

        const horaSalida = elements.horaSalidaModalInput.value;

        if (!fechaSalidaISO || !horaSalida) { // Ahora verificamos fechaSalidaISO
            alert('La fecha y hora de salida son obligatorias.');
            return;
        }

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${state.empresaSalidaId}/salida`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ fecha_salida: fechaSalidaISO, hora_salida: horaSalida }) // Enviar fecha corregida
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
            elements.tableBody.innerHTML = `<tr><td colspan="16" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicie sesión.</td></tr>`; // Colspan corregido a 16
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
                state.empresasData = [];
                renderTable();
                return;
            }

            const data = await response.json();

            state.empresasData = data.empresas || data;

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de empresas:', error);
            alert(`No se pudo conectar con el servidor para cargar las empresas: ${error.message}`);
            state.empresasData = [];
            renderTable();
        }
    }

    function renderTable() {
        const dataToRender = state.filteredData || state.empresasData;
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

    function handleSearch() {
        const searchTerm = this.value.toUpperCase();
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.empresasData.filter(empresa =>
                Object.values(empresa).some(value =>
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
        const data = state.filteredData || state.empresasData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    function exportToExcel() {
        const dataToExport = state.filteredData || state.empresasData;
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
            newItem.fecha_entrada = newItem.fecha_entrada ? new Date(newItem.fecha_entrada).toLocaleDateString('es-ES') : '';
            newItem.hora_entrada = newItem.hora_entrada || '';
            newItem.fecha_salida = newItem.fecha_salida ? new Date(newItem.fecha_salida).toLocaleDateString('es-ES') : '';
            newItem.hora_salida = newItem.hora_salida || '';

            return newItem;
        });

        const headers = [
            'fecha_entrada', 'hora_entrada', 'fecha_salida', 'hora_salida',
            'nombre_empresa', 'identificacion', 'area_ingreso', 'empresa', 'carne',
            'tipo_empresa',
            'dependencia', 'dispositivo', 'codigo_dispositivo',
            'observaciones'
        ];

        const data = exportableData.map(empresa =>
            headers.map(header => empresa[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Empresas');

        XLSX.writeFile(workbook, 'registros_empresas.xlsx');
        alert('Datos de empresas exportados correctamente en formato Excel (.xlsx)');
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
        if (!confirm('¿Está seguro de que desea eliminar este registro?')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicie sesión.');
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

            alert('Registro eliminado exitosamente.');
            await fetchAndRenderTable();
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    function loadEditData() {
        const empresa = state.empresasData.find(p => p._id === state.editItemId);
        if (empresa) {
            // Rellenar el formulario con los datos de la empresa
            // Formatear la fecha de entrada para input type="date"
            // Asegúrate de que empresa.fecha_entrada sea un Date o ISO string válido
            elements.fechaEntradaInput.value = empresa.fecha_entrada ? new Date(empresa.fecha_entrada).toISOString().split('T')[0] : '';
            elements.horaEntradaInput.value = empresa.hora_entrada || '';

            elements.registerForm.nombre_empresa.value = empresa.nombre_empresa || '';
            elements.registerForm.identificacion.value = empresa.identificacion || '';
            elements.registerForm.area_ingreso.value = empresa.area_ingreso || '';
            elements.registerForm.empresa.value = empresa.empresa || '';
            elements.registerForm.carne.value = empresa.carne || '';
            elements.registerForm.tipo_empresa.value = empresa.tipo_empresa || '';
            elements.registerForm.dependencia.value = empresa.dependencia || '';
            elements.registerForm.dispositivo.value = empresa.dispositivo || '';
            elements.registerForm.codigo_dispositivo.value = empresa.codigo_dispositivo || '';
            elements.registerForm.observaciones.value = empresa.observaciones || '';

            // Si hay fecha y hora de salida en el registro, también rellenarlas en el formulario principal
            // (Esto asume que el formulario principal tiene campos para fecha_salida y hora_salida para edición)
            // Si no, estos campos solo se manejarán en el modal de salida.
            if (elements.registerForm.fecha_salida && empresa.fecha_salida) {
                elements.registerForm.fecha_salida.value = new Date(empresa.fecha_salida).toISOString().split('T')[0];
            }
            if (elements.registerForm.hora_salida && empresa.hora_salida) {
                elements.registerForm.hora_salida.value = empresa.hora_salida;
            }
        }
    }

    init(); // Iniciar la aplicación
});