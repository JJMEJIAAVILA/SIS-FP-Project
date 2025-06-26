// SIS-FP/assets/js/antecedentes.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración Inicial de la Interfaz de Usuario ---
    const userDisplayElement = document.getElementById('userDisplay');
    const storedUsername = localStorage.getItem('username'); // Obtener el nombre de usuario del localStorage

    if (userDisplayElement) {
        if (storedUsername) {
            userDisplayElement.textContent = storedUsername.toUpperCase(); // Mostrar el nombre de usuario en mayúsculas
        } else {
            userDisplayElement.textContent = 'INVITADO'; // Por defecto, mostrar 'INVITADO'
        }
    }

    // --- Referencias a Elementos del DOM ---
    const newRegisterBtn = document.getElementById('newRegisterBtn');
    const newRegisterForm = document.getElementById('newRegisterForm');
    const registerForm = document.getElementById('registerForm');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const tableBody = document.getElementById('tableBody'); // Tabla principal de antecedentes
    const searchInput = document.getElementById('searchInput');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    // --- Variables de Estado para Datos y Paginación ---
    let allAntecedentesData = [];    // Almacena todos los datos de antecedentes cargados del backend
    let currentPage = 1;      // Página actual de la tabla
    const recordsPerPage = 10; // Número de registros por página

    // --- Funciones de Utilidad ---

    // Formatea una cadena de fecha y hora a 'DD/MM/YYYY HH:MM'
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return dateTimeString;
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
            date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

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

    // --- Carga de Datos desde el Backend (API) ---
    async function loadAntecedentes() {
        try {
            const headers = getAuthHeaders(); // Obtener cabeceras con o sin token

            // Realizar la petición GET para obtener todos los antecedentes
            const response = await fetch('http://localhost:3000/api/antecedentes', { headers });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }

                if (response.status === 401) {
                    alert(`Sesión expirada o no autorizado: ${errorMessage}. Por favor, inicie sesión nuevamente.`);
                    // Opcional: Redirigir a la página de login
                    // window.location.href = './login.html';
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();
            allAntecedentesData = data.antecedentes;

            renderAntecedentesTable(allAntecedentesData);

        } catch (error) {
            console.error('Error al cargar los antecedentes:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Error al cargar los datos.</td></tr>`;
            alert(`Error al cargar los datos: ${error.message}`);
        }
    }

    // --- Renderizado de la Tabla de Antecedentes ---

    function renderAntecedentesTable(dataToRender) {
        tableBody.innerHTML = ''; // Limpiar la tabla antes de renderizar
        const searchTerm = searchInput.value.toLowerCase();

        // Filtrar datos basado en el término de búsqueda
        const filteredData = dataToRender.filter(antecedente => {
            return (antecedente.nombre && antecedente.nombre.toLowerCase().includes(searchTerm)) ||
                (antecedente.numero_identificacion && antecedente.numero_identificacion.toLowerCase().includes(searchTerm)) ||
                (antecedente.empresa && antecededente.empresa.toLowerCase().includes(searchTerm)) ||
                (antecedente.dependencia && antecededente.dependencia.toLowerCase().includes(searchTerm)) ||
                (antecedente.observaciones && antecededente.observaciones.toLowerCase().includes(searchTerm)) ||
                (antecedente.resultado_verificacion && antecededente.resultado_verificacion.toLowerCase().includes(searchTerm)) ||
                (antecedente.item && antecedente.item.toString().includes(searchTerm));
        });

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No hay registros disponibles. Agregue un nuevo registro.</td></tr>`;
            updatePaginationInfo(0);
            return;
        }

        // Aplicar paginación
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        paginatedData.forEach((antecedente) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${antecedente.item}</td>
                <td class="px-4 py-3">${antecedente.nombre || 'N/A'}</td>
                <td class="px-4 py-3 text-center">${antecedente.numero_identificacion || 'N/A'}</td>
                <td class="px-4 py-3">${antecedente.empresa || 'N/A'}</td>
                <td class="px-4 py-3">${antecedente.dependencia || 'N/A'}</td>
                <td class="px-4 py-3">${antecedente.observaciones || 'Sin observaciones'}</td>
                <td class="px-4 py-3 text-center">${antecedente.resultado_verificacion || 'PENDIENTE'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded mr-2" data-id="${antecedente._id}">Editar</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" data-id="${antecedente._id}">Eliminar</button>
                    <!-- Botón para verificar en la página de la Policía Nacional -->
                    <button class="verify-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded ml-2" data-id-number="${antecedente.numero_identificacion}">Verificar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updatePaginationInfo(filteredData.length); // Actualizar información de paginación
    }

    // Actualiza la información de paginación en la UI
    function updatePaginationInfo(totalRecords) {
        document.getElementById('currentRecords').textContent = totalRecords;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        document.getElementById('currentPage').textContent = `${currentPage} / ${totalPages}`;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalRecords === 0;
    }

    // --- Manejo de Eventos ---

    // Mostrar/Ocultar formulario de nuevo registro/edición
    newRegisterBtn.addEventListener('click', () => {
        newRegisterForm.classList.toggle('hidden');
        if (!newRegisterForm.classList.contains('hidden')) {
            registerForm.reset();
            registerForm.dataset.editingId = '';
            document.getElementById('saveBtn').textContent = 'GUARDAR';

            const itemInput = registerForm.querySelector('[name="item"]');
            if (itemInput) {
                const maxItem = allAntecedentesData.reduce((max, ant) => Math.max(max, ant.item || 0), 0);
                itemInput.value = maxItem + 1;
                itemInput.readOnly = false;
            }
        }
    });

    // Cancelar el formulario
    cancelFormBtn.addEventListener('click', () => {
        newRegisterForm.classList.add('hidden');
        registerForm.reset();
        registerForm.dataset.editingId = '';
        const itemInput = registerForm.querySelector('[name="item"]');
        if (itemInput) {
            itemInput.readOnly = false;
        }
    });

    // Envío del formulario (Agregar/Editar Antecedente)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = registerForm.dataset.editingId;
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        // Convertir item a número y campos de texto a mayúsculas
        if (data.item) data.item = parseInt(data.item);
        if (data.nombre) data.nombre = data.nombre.toUpperCase();
        if (data.empresa) data.empresa = data.empresa.toUpperCase();
        if (data.dependencia) data.dependencia = data.dependencia.toUpperCase();
        if (data.observaciones) data.observaciones = data.observaciones.toUpperCase();
        if (data.resultado_verificacion) data.resultado_verificacion = data.resultado_verificacion.toUpperCase();

        const url = editingId ? `http://localhost:3000/api/antecedentes/${editingId}` : 'http://localhost:3000/api/antecedentes';
        const method = editingId ? 'PUT' : 'POST';

        const headers = getAuthHeaders();

        if (!headers['Authorization']) {
            alert('Error: No se encontró el token de autenticación. Por favor, inicie sesión para registrar o actualizar antecedentes.');
            console.error('No se encontró el token en localStorage para la operación de guardar/editar.');
            return;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error al guardar: HTTP status ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                }
                throw new Error(errorMessage);
            }

            alert(`Antecedente ${editingId ? 'actualizado' : 'agregado'} exitosamente.`);
            newRegisterForm.classList.add('hidden');
            loadAntecedentes();
        } catch (error) {
            console.error('Error al guardar el antecedente:', error);
            alert(`Error al guardar el antecedente: ${error.message}`);
        }
    });

    // Delegación de eventos para botones en la tabla de antecedentes (Editar, Eliminar, Verificar)
    tableBody.addEventListener('click', async (e) => {
        const headers = getAuthHeaders();

        if (!headers['Authorization'] && !e.target.classList.contains('verify-btn')) { // 'verify-btn' no necesita token para abrir enlace
            alert('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente para realizar esta acción.');
            return;
        }

        // --- Botón EDITAR ---
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            const antecedenteToEdit = allAntecedentesData.find(a => a._id === id);
            if (antecedenteToEdit) {
                newRegisterForm.classList.remove('hidden');
                registerForm.dataset.editingId = antecedenteToEdit._id;
                document.getElementById('saveBtn').textContent = 'ACTUALIZAR';

                registerForm.querySelector('[name="item"]').value = antecedenteToEdit.item;
                registerForm.querySelector('[name="item"]').readOnly = true; // Item no editable al actualizar
                registerForm.querySelector('[name="nombre"]').value = antecedenteToEdit.nombre;
                registerForm.querySelector('[name="numero_identificacion"]').value = antecedenteToEdit.numero_identificacion;
                registerForm.querySelector('[name="empresa"]').value = antecedenteToEdit.empresa;
                registerForm.querySelector('[name="dependencia"]').value = antecedenteToEdit.dependencia;
                registerForm.querySelector('[name="observaciones"]').value = antecedenteToEdit.observaciones;
                registerForm.querySelector('[name="resultado_verificacion"]').value = antecedenteToEdit.resultado_verificacion;
            }
        }
        // --- Botón ELIMINAR ---
        else if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este registro de antecedente?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/antecedentes/${id}`, {
                        method: 'DELETE',
                        headers: headers
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = `Error al eliminar: HTTP status ${response.status}`;
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMessage = errorData.message || errorMessage;
                        } catch (jsonParseError) {
                            errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                        }
                        throw new Error(errorMessage);
                    }
                    alert('Antecedente eliminado exitosamente.');
                    loadAntecedentes();
                } catch (error) {
                    console.error('Error al eliminar el antecedente:', error);
                    alert(`Error al eliminar el antecedente: ${error.message}`);
                }
            }
        }
        // --- Botón VERIFICAR (Abre enlace externo) ---
        else if (e.target.classList.contains('verify-btn')) {
            const idNumber = e.target.dataset.idNumber;
            // Enlace oficial de consulta de antecedentes de la Policía Nacional de Colombia
            const verificationUrl = `https://antecedentes.policia.gov.co:7005/WebJudicial/antecedentes.xhtml`;

            // Abre el enlace en una nueva pestaña
            window.open(verificationUrl, '_blank');

            // Opcional: Podrías preguntar al usuario si desea actualizar el estado después de la verificación
            // const updateStatus = confirm('¿Ya verificó los antecedentes? ¿Desea actualizar el estado de este registro?');
            // if (updateStatus) {
            //     // Aquí puedes abrir un pequeño modal para que el usuario elija el resultado_verificacion
            //     // y luego hacer un PUT a la API /api/antecedentes/:id
            // }
        }
    });

    // --- Paginación ---
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderAntecedentesTable(allAntecedentesData);
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(allAntecedentesData.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderAntecedentesTable(allAntecedentesData);
        }
    });

    // --- Búsqueda (Filtro) ---
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderAntecedentesTable(allAntecedentesData);
    });

    // --- Exportar a Excel ---
    exportExcelBtn.addEventListener('click', () => {
        if (allAntecedentesData.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        const dataToExport = allAntecedentesData.map(antecedente => ({
            ITEM: antecedente.item,
            NOMBRE: antecededente.nombre,
            'N.I.': antecedente.numero_identificacion,
            EMPRESA: antecededente.empresa,
            DEPENDENCIA: antecededente.dependencia,
            OBSERVACIONES: antecedente.observaciones,
            'RESULTADO DE VERIFICACIÓN': antecedente.resultado_verificacion,
            'FECHA DE REGISTRO': formatDateTime(antecedente.createdAt)
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Antecedentes");

        XLSX.writeFile(wb, "Reporte_Antecedentes.xlsx");
    });

    // Cargar datos al iniciar la página
    loadAntecedentes();
});