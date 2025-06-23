// assets/js/empresas.js
document.addEventListener('DOMContentLoaded', function() {
    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        // URL base de tu API de backend
        apiBaseUrl: 'http://localhost:3000/api/empresas' // Nueva URL para la API de empresas
    };

    const state = {
        empresasData: [], // Ahora esto se llenará desde el backend
        currentItemId: null, // Para manejar IDs de la DB, no un contador local
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItemId: null // Almacena el ID de la empresa a editar (del backend)
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
        userDisplay: document.getElementById('userDisplay')
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
        // Opcional: Podrías hacer una validación más profunda del token aquí
        // haciendo una petición a una ruta protegida simple para asegurar que el token es válido.
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
        elements.tableBody.addEventListener('click', handleTableClick); // Para botones de editar/salida
    }

    // --- Funciones de Formulario ---
    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        elements.registerForm.reset(); // Limpiar formulario
        if (state.editMode && state.editItemId) {
            loadEditData(); // Cargar datos si estamos en modo edición
        } else {
            // Asegurarse de que el campo de fecha_entrada tenga la fecha/hora actual por defecto
            // Esto es útil para nuevos registros
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            elements.registerForm.fecha_entrada.value = `${year}-${month}-${day} ${hours}:${minutes}`;
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
        // Crear un objeto con los datos del formulario
        const empresaData = {
            fecha_entrada: formData.get('fecha_entrada'),
            // fecha_salida se manejará por separado en el backend o en la acción de "Salida"
            nombre_empresa: formData.get('nombre_empresa').toUpperCase(),
            identificacion: formData.get('identificacion').toUpperCase(),
            area_ingreso: formData.get('area_ingreso').toUpperCase(),
            empresa: formData.get('empresa').toUpperCase(),
            carne: formData.get('carne').toUpperCase() || '-',
            tipo_empresa: formData.get('tipo_empresa').toUpperCase(),
            area: formData.get('area').toUpperCase() || '-',
            dependencia: formData.get('dependencia').toUpperCase() || '-',
            dispositivo: formData.get('dispositivo').toUpperCase() || '-',
            codigo_dispositivo: formData.get('codigo_dispositivo').toUpperCase() || '-',
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
                    body: JSON.stringify(empresaData)
                });
            } else {
                // Nuevo registro: enviar POST al backend
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(empresaData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                alert(`Registro ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
                hideRegisterForm(); // Ocultar formulario y resetear estado
                await fetchAndRenderTable(); // Recargar y renderizar la tabla con los datos actualizados
            } else {
                alert(`Error al ${state.editMode ? 'modificar' : 'guardar'} el registro: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error en la solicitud al backend:', error);
            alert('Error de conexión con el servidor. Inténtelo de nuevo.');
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
                state.empresasData = data; // Guardar los datos recibidos del backend
                state.filteredData = null; // Resetear filtro
                state.currentPage = config.defaultPage; // Volver a la primera página
                renderTable(); // Renderizar la tabla con los nuevos datos
            } else {
                alert(`Error al cargar los registros: ${data.message || 'Error desconocido'}`);
                state.empresasData = []; // Vaciar datos si hay error
                renderTable(); // Renderizar tabla vacía
            }
        } catch (error) {
            console.error('Error al cargar los datos de empresas:', error);
            alert('No se pudo conectar con el servidor para cargar las empresas.');
            state.empresasData = []; // Vaciar datos si hay error de red
            renderTable(); // Renderizar tabla vacía
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

    function showNoDataMessage(isTotalEmpty) {
        let message = isTotalEmpty
            ? 'No hay registros disponibles. Agregue un nuevo registro.'
            : 'No se encontraron resultados para su búsqueda.';
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="15" class="px-6 py-4 text-center text-gray-400">
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach((empresa, index) => {
            // Usar empresa._id como identificador único para las acciones
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3 text-center">${empresa.fecha_entrada || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.fecha_salida || '-'}</td>
                <td class="px-4 py-3">${empresa.nombre_empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.identificacion || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.area_ingreso || '-'}</td>
                <td class="px-4 py-3">${empresa.empresa || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.carne || '-'}</td>
                <td class="px-4 py-3 text-center">${empresa.tipo_empresa || '-'}</td>
                <td class="px-4 py-3">${empresa.area || '-'}</td>
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

        // Crear una copia de los datos para no modificar los originales
        const exportableData = dataToExport.map(item => ({ ...item }));

        // Eliminar el campo '_id' de cada objeto antes de exportar
        exportableData.forEach(item => {
            delete item._id;
            delete item.__v; // Eliminar también la versión de Mongoose si no es necesaria
        });

        // Asegurarse de que el orden de las cabeceras sea el deseado
        // Esto asume que el primer objeto en exportableData tiene todas las claves.
        // Si no, podrías definir las cabeceras manualmente en el orden que las quieres en el Excel.
        const headers = Object.keys(exportableData[0]);

        const data = exportableData.map(empresa => headers.map(header => empresa[header]));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Empresas');

        XLSX.writeFile(workbook, 'registros_empresas.xlsx');
        alert('Datos de empresas exportados correctamente en formato Excel (.xlsx)');
    }

    // --- Funciones de Acción en la Tabla (Editar, Salida, Eliminar) ---
    async function handleTableClick(e) {
        const itemId = e.target.dataset.id; // Usamos data-id que ahora viene del backend (_id)
        if (!itemId) return; // Si no tiene data-id, no es un botón de acción

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(itemId);
        } else if (e.target.classList.contains('salida-btn')) {
            await handleSalida(itemId);
        } else if (e.target.classList.contains('delete-btn')) {
            await handleDelete(itemId);
        }
    }

    function handleEdit(itemId) {
        state.editMode = true;
        state.editItemId = itemId; // Almacenar el ID del backend
        showRegisterForm(); // Mostrar el formulario para edición
    }

    async function handleSalida(itemId) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicie sesión.');
            window.location.href = '../login.html';
            return;
        }

        const now = new Date();
        const fechaSalida = prompt('Ingrese la fecha y hora de salida:', `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);

        if (fechaSalida === null) { // Si el usuario cancela el prompt
            return;
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}/${itemId}/salida`, { // Nueva ruta para actualizar salida
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fecha_salida: fechaSalida })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Fecha de salida registrada exitosamente.');
                await fetchAndRenderTable(); // Recargar la tabla
            } else {
                alert(`Error al registrar salida: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al registrar salida:', error);
            alert('Error de conexión con el servidor al registrar salida.');
        }
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
            const response = await fetch(`${config.apiBaseUrl}/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                alert('Registro eliminado exitosamente.');
                await fetchAndRenderTable(); // Recargar la tabla
            } else {
                alert(`Error al eliminar registro: ${result.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            alert('Error de conexión con el servidor al eliminar registro.');
        }
    }

    function loadEditData() {
        // En modo edición, buscar la empresa en los datos actuales por su _id del backend
        const empresa = state.empresasData.find(p => p._id === state.editItemId);
        if (empresa) {
            // Rellenar el formulario con los datos de la empresa
            elements.registerForm.fecha_entrada.value = empresa.fecha_entrada || '';
            elements.registerForm.nombre_empresa.value = empresa.nombre_empresa || '';
            elements.registerForm.identificacion.value = empresa.identificacion || '';
            elements.registerForm.area_ingreso.value = empresa.area_ingreso || '';
            elements.registerForm.empresa.value = empresa.empresa || '';
            elements.registerForm.carne.value = empresa.carne || '';
            elements.registerForm.tipo_empresa.value = empresa.tipo_empresa || '';
            elements.registerForm.area.value = empresa.area || '';
            elements.registerForm.dependencia.value = empresa.dependencia || '';
            elements.registerForm.dispositivo.value = empresa.dispositivo || '';
            elements.registerForm.codigo_dispositivo.value = empresa.codigo_dispositivo || '';
            elements.registerForm.observaciones.value = empresa.observaciones || '';
            // No cargar fecha_salida en el formulario de entrada
        }
    }

    init(); // Iniciar la aplicación
});