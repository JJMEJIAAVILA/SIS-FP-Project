// assets/js/admin_users.js - Interfaz de Administración de Usuarios
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded for admin_users.js');

    // --- CONFIGURACIÓN DE LA APLICACIÓN ---
    const config = {
        itemsPerPage: 10,
        defaultPage: 1,
        apiBaseUrl: 'http://localhost:3000/api/admin/users' // URL de la API para Admin Users
    };

    // --- ESTADO DE LA APLICACIÓN ---
    const state = {
        usersData: [], // Contendrá los datos de usuarios del backend
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editUserId: null, // Almacena el _id de MongoDB del usuario a editar
        deleteUserId: null // Almacena el _id de MongoDB del usuario a eliminar
    };

    // --- ELEMENTOS DEL DOM ---
    const elements = {
        tableBody: document.getElementById('tableBody'),
        userFormContainer: document.getElementById('userFormContainer'),
        userForm: document.getElementById('userForm'),
        formTitle: document.getElementById('formTitle'),
        userId: document.getElementById('userId'), // Campo oculto para el ID del usuario
        newUserBtn: document.getElementById('newUserBtn'),
        cancelFormBtn: document.getElementById('cancelFormBtn'),
        searchInput: document.getElementById('searchInput'),
        currentRecordsSpan: document.getElementById('currentRecords'),
        currentPageSpan: document.getElementById('currentPage'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        userDisplay: document.getElementById('userDisplay'),

        // Elementos del modal de confirmación de eliminación
        deleteConfirmModal: document.getElementById('deleteConfirmModal'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
    };

    // --- FUNCIONES DE INICIALIZACIÓN ---
    async function init() {
        console.log('init() called');
        // Verificar autenticación y rol de administrador
        if (!await checkAuthenticationAndRole()) {
            return;
        }
        loadUser();
        setupEventListeners();
        await fetchAndRenderTable(); // Cargar datos de usuarios desde el backend al inicio
    }

    // --- PROTECCIÓN DE LA RUTA (VERIFICACIÓN DE TOKEN Y ROL) ---
    async function checkAuthenticationAndRole() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role'); // Obtener el rol del usuario

        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            return false;
        }

        if (role !== 'admin') {
            alert('Acceso denegado. Solo los administradores pueden acceder a esta página.');
            window.location.href = 'menu.html'; // Redirigir a una página accesible
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

        if (elements.newUserBtn) elements.newUserBtn.addEventListener('click', showUserForm);
        if (elements.cancelFormBtn) elements.cancelFormBtn.addEventListener('click', hideUserForm);
        if (elements.userForm) elements.userForm.addEventListener('submit', handleFormSubmit);
        else console.error('ERROR: userForm element not found!');

        if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearch);
        if (elements.prevPageBtn) elements.prevPageBtn.addEventListener('click', goToPrevPage);
        if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', goToNextPage);
        if (elements.tableBody) elements.tableBody.addEventListener('click', handleTableClick);

        // Listeners para el modal de confirmación de eliminación
        if (elements.cancelDeleteBtn) elements.cancelDeleteBtn.addEventListener('click', hideDeleteConfirmModal);
        if (elements.confirmDeleteBtn) elements.confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }

    // --- FUNCIONES DEL FORMULARIO DE CREACIÓN/EDICIÓN DE USUARIOS ---
    function showUserForm() {
        console.log('showUserForm() called');
        elements.userFormContainer.classList.remove('hidden');
        if (!state.editMode) {
            elements.formTitle.textContent = 'Nuevo Usuario';
            elements.userForm.reset();
            elements.userId.value = ''; // Asegurarse de que el ID esté vacío para nuevos usuarios
            // Asegurar que el campo de contraseña sea requerido para nuevos usuarios
            elements.userForm.password.required = true;
        } else {
            elements.formTitle.textContent = 'Editar Usuario';
            // En modo edición, la contraseña no es requerida por defecto
            elements.userForm.password.required = false;
        }
    }

    function hideUserForm() {
        console.log('hideUserForm() called');
        elements.userFormContainer.classList.add('hidden');
        state.editMode = false;
        state.editUserId = null;
        elements.userForm.reset();
        elements.userForm.password.required = true; // Restablecer a requerido por defecto
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('handleFormSubmit: Formulario enviado.');

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            return;
        }

        const formData = new FormData(elements.userForm);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            telefono: formData.get('telefono') || '',
            idioma: formData.get('idioma'),
            tema: formData.get('tema'),
            role: formData.get('role') // El rol es obligatorio para admin
        };

        // Solo añadir la contraseña si no está vacía (para edición) o si es un nuevo usuario
        if (formData.get('password')) {
            userData.password = formData.get('password');
        } else if (!state.editMode) { // Si es nuevo usuario y la contraseña está vacía
            alert('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }

        console.log('handleFormSubmit: Datos a enviar:', userData);

        try {
            let response;
            const headers = getAuthHeaders();

            if (state.editMode && state.editUserId) {
                console.log(`handleFormSubmit: Enviando PUT a ${config.apiBaseUrl}/${state.editUserId}`);
                response = await fetch(`${config.apiBaseUrl}/${state.editUserId}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(userData)
                });
            } else {
                console.log(`handleFormSubmit: Enviando POST a ${config.apiBaseUrl}`);
                response = await fetch(config.apiBaseUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(userData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al ${state.editMode ? 'modificar' : 'guardar'} el usuario: HTTP status ${response.status}`;
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

            alert(`Usuario ${state.editMode ? 'modificado' : 'guardado'} exitosamente.`);
            hideUserForm();
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
                let errorMessage = `Error al cargar los usuarios: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                alert(errorMessage);
                state.usersData = [];
                renderTable();
                return;
            }

            const data = await response.json();
            state.usersData = data || [];

            state.filteredData = null;
            state.currentPage = config.defaultPage;
            renderTable();

        } catch (error) {
            console.error('Error al cargar los datos de usuarios:', error);
            alert(`No se pudo conectar con el servidor para cargar los usuarios: ${error.message}`);
            state.usersData = [];
            renderTable();
        }
    }

    function renderTable() {
        console.log('renderTable() called');
        const dataToRender = state.filteredData || state.usersData;
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
            ? 'No hay usuarios disponibles. Agregue un nuevo usuario.'
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
        data.forEach((user, index) => {
            const createdAtDate = user.createdAt ? new Date(user.createdAt) : null;
            const formattedCreatedAt = createdAtDate ?
                `${String(createdAtDate.getUTCDate()).padStart(2, '0')}/${String(createdAtDate.getUTCMonth() + 1).padStart(2, '0')}/${createdAtDate.getUTCFullYear()}` : '-';

            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${index + 1 + ((state.currentPage - 1) * config.itemsPerPage)}</td>
                <td class="px-4 py-3">${user.username || '-'}</td>
                <td class="px-4 py-3">${user.email || '-'}</td>
                <td class="px-4 py-3">${user.telefono || '-'}</td>
                <td class="px-4 py-3">${user.idioma || '-'}</td>
                <td class="px-4 py-3">${user.tema || '-'}</td>
                <td class="px-4 py-3">${user.role || '-'}</td>
                <td class="px-4 py-3">${formattedCreatedAt}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${user._id}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${user._id}">Eliminar</button>
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
        const searchTerm = this.value.toUpperCase();
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.usersData.filter(user =>
                Object.values(user).some(value =>
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
        const data = state.filteredData || state.usersData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);

        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // --- MANEJO DE CLICKS EN LA TABLA (EDITAR/ELIMINAR) ---
    function handleTableClick(e) {
        const userId = e.target.dataset.id;
        if (!userId) return;

        if (e.target.classList.contains('edit-btn')) {
            handleEdit(userId);
        } else if (e.target.classList.contains('delete-btn')) {
            showDeleteConfirmModal(userId);
        }
    }

    async function handleEdit(userId) {
        state.editMode = true;
        state.editUserId = userId;
        console.log('handleEdit: Setting editMode = true, editUserId =', state.editUserId);

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${userId}`, {
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

            const user = await response.json();
            console.log('Datos de usuario para edición cargados:', user);

            if (user) {
                elements.userId.value = user._id;
                elements.userForm.username.value = user.username || '';
                elements.userForm.email.value = user.email || '';
                elements.userForm.telefono.value = user.telefono || '';
                elements.userForm.idioma.value = user.idioma || 'es';
                elements.userForm.tema.value = user.tema || 'oscuro';
                elements.userForm.role.value = user.role || 'operator';
                elements.userForm.password.value = ''; // Siempre vacío en edición por seguridad
                elements.userForm.password.required = false; // Contraseña no requerida en edición

                showUserForm(); // Mostrar el formulario con los datos cargados
            }
        } catch (error) {
            console.error('Error al cargar datos para edición:', error);
            alert(`Error de conexión con el servidor o al cargar datos para edición: ${error.message}`);
        }
    }

    // --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ---
    function showDeleteConfirmModal(userId) {
        state.deleteUserId = userId;
        elements.deleteConfirmModal.classList.remove('hidden');
    }

    function hideDeleteConfirmModal() {
        state.deleteUserId = null;
        elements.deleteConfirmModal.classList.add('hidden');
    }

    async function confirmDeleteUser() {
        const userId = state.deleteUserId;
        if (!userId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${config.apiBaseUrl}/${userId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al eliminar usuario: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor al eliminar: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            alert('Usuario eliminado exitosamente.');
            hideDeleteConfirmModal();
            await fetchAndRenderTable(); // Recargar la tabla
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert(`Error de conexión con el servidor o al eliminar el usuario: ${error.message}`);
        }
    }

    init(); // Iniciar la aplicación
});