// assets/js/fuerza_publica.js - INTERFAZ COMPLETA CON BACKEND Y CORRECCIÓN DE FECHA + FUNCIONALIDAD FINALIZAR
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for fuerza_publica.js');

    // --- CONFIGURACIÓN DE LA APLICACIÓN ---
    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        apiBaseUrl: 'http://localhost:3000/api/fuerza_publica' // URL de la API para Fuerza Pública
    };

    // --- ESTADO DE LA APLICACIÓN ---
    const state = {
        fuerzaPublicaData: [], // Contendrá los datos de fuerza pública del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null, // Almacena el _id de MongoDB del registro a editar
        currentFuerzaPublicaIdToFinalize: null // ID del registro a finalizar
    };

    // --- ELEMENTOS DEL DOM ---
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

        // Elementos del modal de Finalizar Registro
        finalizarFuerzaPublicaModal: document.getElementById('finalizarFuerzaPublicaModal'),
        finalizarFuerzaPublicaForm: document.getElementById('finalizarFuerzaPublicaForm'),
        finalizarFuerzaPublicaId: document.getElementById('finalizarFuerzaPublicaId'),
        finalizarFuerzaPublicaFechaOriginal: document.getElementById('finalizarFuerzaPublicaFechaOriginal'), // Input hidden para la fecha original
        modalHoraSalida: document.getElementById('modalHoraSalida'),
        cancelFinalizarModalBtn: document.getElementById('cancelFinalizarModalBtn')
    };

    // --- FUNCIONES DE INICIALIZACIÓN ---
    async function init() {
        console.log('init() called');
        if (!await checkAuthentication()) {
            return;
        }
        loadUser();
        setupEventListeners();
        await fetchAndRenderTable(); // Cargar datos desde el backend al inicio
    }

    // --- PROTECCIÓN DE LA RUTA (VERIFICACIÓN DE TOKEN) ---
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

    // --- NOMBRE DE USUARIO EN MAYÚSCULAS ---
    function loadUser() {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            elements.userDisplay.textContent = storedUsername.toUpperCase();
        } else {
            elements.userDisplay.textContent = 'INVITADO';
        }
    }

    // --- CONFIGURACIÓN DE EVENT LISTENERS ---
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

        // Listeners para el modal de Finalizar Registro
        if (elements.cancelFinalizarModalBtn) elements.cancelFinalizarModalBtn.addEventListener('click', hideFinalizarFuerzaPublicaModal);
        if (elements.finalizarFuerzaPublicaForm) elements.finalizarFuerzaPublicaForm.addEventListener('submit', handleFinalizarFuerzaPublicaSubmit);
    }

    // --- FUNCIONES DEL FORMULARIO DE REGISTRO/EDICIÓN ---
    function showRegisterForm() {
        console.log('showRegisterForm() called');
        elements.newRegisterForm.classList.remove('hidden');

        // Solo resetear si no estamos en modo edición para no borrar los datos cargados
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
            // Asegurarse de que hora_salida esté vacío al crear uno nuevo
            if (elements.registerForm.hora_salida) {
                elements.registerForm.hora_salida.value = '';
            }
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
        console.log('handleFormSubmit: state.editMode =', state.editMode);
        console.log('handleFormSubmit: state.editItemId =', state.editItemId);

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const formData = new FormData(elements.registerForm);
        const fuerzaPublicaData = {
            fecha: formData.get('fecha'),
            fuerza_publica: formData.get('fuerza_publica').toUpperCase(),
            unidades: formData.get('unidades').toUpperCase() || '-',
            hora_llegada: formData.get('hora_llegada') || '-',
            hora_salida: formData.get('hora_salida') || '-',
            accion_realizada: formData.get('accion_realizada').toUpperCase() || '-',
            observaciones: formData.get('observaciones').toUpperCase() || '-'
        };

        console.log('handleFormSubmit: Datos a enviar:', fuerzaPublicaData);

        // Validaciones básicas
        if (!fuerzaPublicaData.fecha || !fuerzaPublicaData.fuerza_publica) {
            alert('Por favor, complete los campos obligatorios: Fecha y Fuerza Pública.');
            console.error('handleFormSubmit: Campos obligatorios faltantes.');
            return;
        }

        try {
            let response;
            const headers = getAuthHeaders();

            if (state.editMode && state.editItemId) { // Asegurarse de que editItemId también esté presente
                console.log(`handleFormSubmit: Enviando PUT a ${config.apiBaseUrl}/${state.editItemId}`);
                response = await fetch(`${config.apiBaseUrl}/${state.editItemId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(fuerzaPublicaData)
                });
            } else {
                console.log(`handleFormSubmit: Enviando POST a ${config.apiBaseUrl}`);
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(fuerzaPublicaData)
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
                console.error('handleFormSubmit: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('handleFormSubmit: Respuesta exitosa del servidor:', result);

            alert(`Registro ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideRegisterForm();
            await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
        } catch (error) {
            console.error('handleFormSubmit: Error en la solicitud fetch:', error);
            alert(`Error de conexión con el servidor o al procesar la respuesta: ${error.message}`);
        }
    }

    // --- FUNCIONES DE TABLA Y DATOS ---
    async function fetchAndRenderTable() {
        console.log('fetchAndRenderTable() called');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found. Cannot fetch data.');
            elements.tableBody.innerHTML = `<tr><td colspan="10" class="px-6 py-4 text-center text-gray-400">No autenticado. Por favor, inicia sesión.</td></tr>`; // Colspan ajustado a 10
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
                state.fuerzaPublicaData = [];
                renderTable();
                return;
            }

            const data = await response.json();
            state.fuerzaPublicaData = data.fuerzaPublica || data; // Asume que la respuesta es { fuerzaPublica: [...] } o un array directo

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de fuerza pública:', error);
            alert(`No se pudo conectar con el servidor para cargar los registros: ${error.message}`);
            state.fuerzaPublicaData = [];
            renderTable();
        }
    }

    function renderTable() {
        console.log('renderTable() called');
        const dataToRender = state.filteredData || state.fuerzaPublicaData;
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
                <td colspan="10" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `; // Colspan ajustado a 10
    }

    function renderTableRows(data) {
        data.forEach((fuerzaPublica, index) => {
            // Formatear la fecha de inicio usando componentes UTC para evitar desfase
            const fechaObj = fuerzaPublica.fecha ? new Date(fuerzaPublica.fecha) : null;
            const formattedFecha = fechaObj ?
                `${String(fechaObj.getUTCDate()).padStart(2, '0')}/${String(fechaObj.getUTCMonth() + 1).padStart(2, '0')}/${fechaObj.getUTCFullYear()}` : '-';

            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3">${formattedFecha}</td>
                <td class="px-4 py-3">${fuerzaPublica.fuerza_publica || '-'}</td>
                <td class="px-4 py-3">${fuerzaPublica.unidades || '-'}</td>
                <td class="px-4 py-3">${fuerzaPublica.hora_llegada || '-'}</td>
                <td class="px-4 py-3">${fuerzaPublica.hora_salida || '-'}</td>
                <td class="px-4 py-3">${fuerzaPublica.accion_realizada || '-'}</td>
                <td class="px-4 py-3">${fuerzaPublica.observaciones || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${fuerzaPublica._id}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${fuerzaPublica._id}">Eliminar</button>
                </td>
                <td class="px-4 py-3 text-center">
                    ${fuerzaPublica.hora_salida === '-' ?
                `<button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded finalizar-btn" 
                                 data-id="${fuerzaPublica._id}" 
                                 data-fecha-original="${fuerzaPublica.fecha ? new Date(fuerzaPublica.fecha).toISOString().split('T')[0] : ''}">Finalizar</button>`
                : `<span class="text-gray-400">Finalizado</span>`}
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

    // --- FUNCIONES DE BÚSQUEDA ---
    function handleSearch() {
        const searchTerm = this.value.toUpperCase(); // Buscar en mayúsculas para consistencia
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.fuerzaPublicaData.filter(fuerzaPublica =>
                Object.values(fuerzaPublica).some(value =>
                    value !== null && String(value).toUpperCase().includes(searchTerm)
                )
            );
        }
        state.currentPage = config.defaultPage;
        renderTable();
    }

    // --- NAVEGACIÓN DE PÁGINAS ---
    function goToPrevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    }

    function goToNextPage() {
        const data = state.filteredData || state.fuerzaPublicaData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);

        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // --- EXPORTACIÓN DE DATOS A EXCEL ---
    function exportExcel() {
        if (state.fuerzaPublicaData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const exportableData = state.fuerzaPublicaData.map(item => {
            const newItem = { ...item };
            delete newItem._id; // Eliminar el _id de MongoDB
            delete newItem.__v; // Eliminar la versión de Mongoose
            delete newItem.createdAt; // Eliminar timestamps si no se necesitan en el Excel
            delete newItem.updatedAt;

            // Formatear la fecha para Excel usando componentes UTC
            const fechaExcelObj = newItem.fecha ? new Date(newItem.fecha) : null;
            newItem.fecha = fechaExcelObj ?
                `${String(fechaExcelObj.getUTCDate()).padStart(2, '0')}/${String(fechaExcelObj.getUTCMonth() + 1).padStart(2, '0')}/${fechaExcelObj.getUTCFullYear()}` : '-';

            return newItem;
        });

        // Definir el orden manual de las columnas para el Excel
        const headers = [
            'fecha', 'fuerza_publica', 'unidades', 'hora_llegada', 'hora_salida',
            'accion_realizada', 'observaciones'
        ];

        const data = exportableData.map(fuerzaPublica =>
            headers.map(header => fuerzaPublica[header] || '-')
        );

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Apoyo_Fuerza_Publica");
        XLSX.writeFile(workbook, "registros_apoyo_fuerza_publica.xlsx");
        alert('Datos exportados a Excel correctamente.');
    }

    // --- MANEJO DE CLICKS EN LA TABLA (EDITAR/ELIMINAR/FINALIZAR) ---
    function handleTableClick(e) {
        const itemId = e.target.dataset.id; // Usar data-id para el _id de MongoDB
        if (!itemId) return;

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(itemId);
        } else if (e.target.classList.contains('delete-btn')) {
            handleDelete(itemId);
        } else if (e.target.classList.contains('finalizar-btn')) {
            const fechaOriginal = e.target.dataset.fechaOriginal; // Obtener la fecha original del data-attribute
            showFinalizarFuerzaPublicaModal(itemId, fechaOriginal);
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

            const fuerzaPublica = await response.json();
            console.log('Datos de fuerza pública para edición cargados:', fuerzaPublica);

            if (fuerzaPublica) {
                // Formatear la fecha para el input type="date" (YYYY-MM-DD)
                elements.registerForm.fecha.value = fuerzaPublica.fecha ? new Date(fuerzaPublica.fecha).toISOString().split('T')[0] : '';
                elements.registerForm.fuerza_publica.value = fuerzaPublica.fuerza_publica || '';
                elements.registerForm.unidades.value = fuerzaPublica.unidades || '';
                elements.registerForm.hora_llegada.value = fuerzaPublica.hora_llegada || '';
                elements.registerForm.hora_salida.value = fuerzaPublica.hora_salida || '';
                elements.registerForm.accion_realizada.value = fuerzaPublica.accion_realizada || '';
                elements.registerForm.observaciones.value = fuerzaPublica.observaciones || '';

                showRegisterForm(); // Mostrar el formulario con los datos cargados
            }
        } catch (error) {
            console.error('Error al cargar datos para edición:', error);
            alert(`Error de conexión con el servidor o al cargar datos para edición: ${error.message}`);
        }
    }

    async function handleDelete(itemId) {
        if (!confirm('¿Está seguro de que desea eliminar este registro?')) {
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
            alert('Registro eliminado exitosamente.');
            await fetchAndRenderTable(); // Recargar la tabla
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert(`Error de conexión con el servidor o al eliminar el registro: ${error.message}`);
        }
    }

    // --- FUNCIONES DEL MODAL DE FINALIZAR REGISTRO ---
    function showFinalizarFuerzaPublicaModal(fuerzaPublicaId, fechaOriginal) {
        console.log('showFinalizarFuerzaPublicaModal() called for ID:', fuerzaPublicaId);
        state.currentFuerzaPublicaIdToFinalize = fuerzaPublicaId;
        elements.finalizarFuerzaPublicaId.value = fuerzaPublicaId;
        elements.finalizarFuerzaPublicaFechaOriginal.value = fechaOriginal; // Guardar la fecha de entrada original

        // Autocompletar con la hora actual
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        elements.modalHoraSalida.value = currentTime;

        elements.finalizarFuerzaPublicaModal.classList.remove('hidden');
    }

    function hideFinalizarFuerzaPublicaModal() {
        console.log('hideFinalizarFuerzaPublicaModal() called');
        elements.finalizarFuerzaPublicaModal.classList.add('hidden');
        state.currentFuerzaPublicaIdToFinalize = null;
        elements.finalizarFuerzaPublicaForm.reset();
    }

    async function handleFinalizarFuerzaPublicaSubmit(e) {
        e.preventDefault();
        console.log('handleFinalizarFuerzaPublicaSubmit: Formulario de finalización enviado.');

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = '../login.html';
            return;
        }

        const registroId = elements.finalizarFuerzaPublicaId.value;
        const horaSalida = elements.modalHoraSalida.value;
        const fechaOriginal = elements.finalizarFuerzaPublicaFechaOriginal.value; // Recuperar la fecha original

        if (!horaSalida) {
            alert('Por favor, complete la hora de salida.');
            return;
        }

        const updateData = {
            hora_salida: horaSalida,
            // La fecha de salida será la misma que la fecha de entrada original
            fecha_salida: fechaOriginal // Enviamos la fecha original como fecha de salida
        };

        console.log('Finalizar Registro Data to send:', updateData);

        try {
            const headers = getAuthHeaders();
            // Usamos la ruta PUT general para actualizar el registro
            const response = await fetch(`${config.apiBaseUrl}/${registroId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al finalizar el registro: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al finalizar: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                console.error('handleFinalizarFuerzaPublicaSubmit: Error en la respuesta del servidor:', errorMessage, response.status, errorText);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Registro finalizado exitosamente:', result);
            alert('Registro finalizado exitosamente.');

            hideFinalizarFuerzaPublicaModal();
            await fetchAndRenderTable(); // Recargar la tabla para mostrar los cambios
        } catch (error) {
            console.error('Error al finalizar registro:', error);
            alert(`Error de conexión con el servidor o al finalizar el registro: ${error.message}`);
        }
    }

    init(); // Iniciar la aplicación
});