// SIS-FP/assets/js/luces.js

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
    const tableBody = document.getElementById('tableBody'); // Tabla principal de luces
    // const fallasTableBody = document.getElementById('historialBody'); // ELIMINADO: Ya no hay tabla de historial separada
    const searchInput = document.getElementById('searchInput');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    // --- Variables de Estado para Datos y Paginación ---
    let allLucesData = [];    // Almacena todos los datos de luces cargados del backend
    // let allFallasData = [];   // ELIMINADO: Ya no se maneja un array de fallas separado
    let currentPage = 1;      // Página actual de la tabla de luces
    const recordsPerPage = 10; // Número de registros por página

    // --- Funciones de Utilidad ---

    // Formatea una cadena de fecha a 'DD/MM/YYYY'
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            const [year, month, day] = dateString.split('-');
            const parsedDate = new Date(year, month - 1, day); // Month is 0-indexed
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            }
            return dateString;
        }
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

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
    async function loadLuces() {
        try {
            const headers = getAuthHeaders(); // Obtener cabeceras con o sin token

            // Realizar la petición GET para obtener todas las luces
            const response = await fetch('http://localhost:3000/api/luces', { headers });

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
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();
            allLucesData = data.luces; // Ahora solo obtenemos el array de luces
            // allFallasData ya no es necesario como array separado

            renderLucesTable(allLucesData);
            // renderFallasTable(allFallasData); // ELIMINADO: Ya no se renderiza una tabla de fallas separada

        } catch (error) {
            console.error('Error al cargar las luces:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Error al cargar los datos.</td></tr>`;
            alert(`Error al cargar los datos: ${error.message}`);
        }
    }

    // --- Renderizado de la Tabla Principal de Luces ---

    function renderLucesTable(dataToRender) {
        tableBody.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredData = dataToRender.filter(luz => {
            return (luz.area && luz.area.toLowerCase().includes(searchTerm)) ||
                (luz.circuito && luz.circuito.toLowerCase().includes(searchTerm)) ||
                (luz.luminaria && luz.luminaria.toLowerCase().includes(searchTerm)) ||
                (luz.estado_actual && luz.estado_actual.toLowerCase().includes(searchTerm)) ||
                (luz.item && luz.item.toString().includes(searchTerm));
        });

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No hay registros disponibles. Agregue un nuevo registro.</td></tr>`;
            updatePaginationInfo(0);
            return;
        }

        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        paginatedData.forEach((luz) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${luz.item}</td>
                <td class="px-4 py-3">${luz.area || 'N/A'}</td>
                <td class="px-4 py-3">${luz.circuito || 'N/A'}</td>
                <td class="px-4 py-3">${luz.luminaria || 'N/A'}</td>
                <td class="px-4 py-3">${luz.estado_actual || 'N/A'}</td>
                <td class="px-4 py-3 text-center">
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded mr-2" data-id="${luz._id}">Editar</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" data-id="${luz._id}">Eliminar</button>
                    <button class="report-failure-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded ml-2" data-id="${luz._id}" data-estado="${luz.estado_actual}">Reportar Falla</button>
                    <!-- NUEVO: Botón para ver y gestionar historial de fallas -->
                    <button class="view-history-btn bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded ml-2" data-id="${luz._id}">Ver Historial</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updatePaginationInfo(filteredData.length);
    }

    // ELIMINADO: renderFallasTable ya no es necesaria

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
                const maxItem = allLucesData.reduce((max, luz) => Math.max(max, luz.item || 0), 0);
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

    // Envío del formulario (Agregar/Editar Luz)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = registerForm.dataset.editingId;
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        if (data.item) data.item = parseInt(data.item);
        if (data.area) data.area = data.area.toUpperCase();
        if (data.circuito) data.circuito = data.circuito.toUpperCase();
        if (data.luminaria) data.luminaria = data.luminaria.toUpperCase();
        if (data.estado_actual) data.estado_actual = data.estado_actual.toUpperCase();

        // Eliminar campos relacionados con historial de fallas, ya que no son parte del objeto Luz directamente en este formulario
        delete data.fecha_falla;
        delete data.fecha_arreglo;
        delete data.observaciones;

        const url = editingId ? `http://localhost:3000/api/luces/${editingId}` : 'http://localhost:3000/api/luces';
        const method = editingId ? 'PUT' : 'POST';

        const headers = getAuthHeaders();

        if (!headers['Authorization'] && (method === 'POST' || method === 'PUT')) {
            alert('Error: No se encontró el token de autenticación. Por favor, inicie sesión para registrar o actualizar luces.');
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

            alert(`Luz ${editingId ? 'actualizada' : 'agregada'} exitosamente.`);
            newRegisterForm.classList.add('hidden');
            loadLuces();
        } catch (error) {
            console.error('Error al guardar la luz:', error);
            alert(`Error al guardar la luz: ${error.message}`);
        }
    });

    // Delegación de eventos para botones en la tabla principal de luces (Editar, Eliminar, Reportar Falla, Ver Historial)
    tableBody.addEventListener('click', async (e) => {
        const headers = getAuthHeaders();

        if (!headers['Authorization']) {
            alert('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente para realizar esta acción.');
            return;
        }

        // --- Botón EDITAR (para la luz principal) ---
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            const luzToEdit = allLucesData.find(l => l._id === id);
            if (luzToEdit) {
                newRegisterForm.classList.remove('hidden');
                registerForm.dataset.editingId = luzToEdit._id;
                document.getElementById('saveBtn').textContent = 'ACTUALIZAR';

                registerForm.querySelector('[name="item"]').value = luzToEdit.item;
                registerForm.querySelector('[name="item"]').readOnly = true;
                registerForm.querySelector('[name="area"]').value = luzToEdit.area;
                registerForm.querySelector('[name="circuito"]').value = luzToEdit.circuito;
                registerForm.querySelector('[name="luminaria"]').value = luzToEdit.luminaria;
                const estadoActualInput = registerForm.querySelector('[name="estado_actual"]');
                if (estadoActualInput) {
                    estadoActualInput.value = luzToEdit.estado_actual;
                }
            }
        }
        // --- Botón ELIMINAR (para la luz principal) ---
        else if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar esta luz y todo su historial de fallas?')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/luces/${id}`, {
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
                    alert('Luz eliminada exitosamente.');
                    loadLuces();
                } catch (error) {
                    console.error('Error al eliminar la luz:', error);
                    alert(`Error al eliminar la luz: ${error.message}`);
                }
            }
        }
        // --- Botón REPORTAR FALLA (para la luz principal) ---
        else if (e.target.classList.contains('report-failure-btn')) {
            const luzId = e.target.dataset.id;
            const luz = allLucesData.find(l => l._id === luzId);

            if (!luz) {
                alert('Luz no encontrada para reportar falla.');
                return;
            }

            // Si la luz ya está en estado de falla, solo permitir marcar como resuelta o eliminar una falla específica
            if (luz.estado_actual === 'NO FUNCIONA' || luz.estado_actual === 'CON FALLAS') {
                alert('La luz ya se encuentra en un estado de falla. Para registrar una nueva falla o marcar como resuelta, use la opción "Ver Historial".');
                return;
            }

            const observaciones = prompt('Ingrese observaciones para la falla (opcional):');
            if (observaciones === null) return;

            let fechaFalla = prompt('Ingrese la fecha de la falla (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
            if (!fechaFalla) {
                alert('La fecha de la falla es requerida.');
                return;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFalla)) {
                alert('Formato de fecha inválido. UsebeginPath-MM-DD.');
                return;
            }

            let estadoFallaReportado = prompt('Estado de la falla (NO FUNCIONA / CON FALLAS):', 'NO FUNCIONA');
            estadoFallaReportado = estadoFallaReportado ? estadoFallaReportado.toUpperCase() : '';

            if (estadoFallaReportado !== 'NO FUNCIONA' && estadoFallaReportado !== 'CON FALLAS') {
                alert('Estado de falla inválido. Debe ser "NO FUNCIONA" o "CON FALLAS".');
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/luces/${luzId}/fallas`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        fecha_falla: fechaFalla,
                        observaciones: observaciones,
                        estado_falla_en_momento: estadoFallaReportado
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `Error al reportar falla: HTTP status ${response.status}`;
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonParseError) {
                        errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                    }
                    throw new Error(errorMessage);
                }
                alert('Falla reportada exitosamente.');
                loadLuces();
            } catch (error) {
                console.error('Error al reportar la falla:', error);
                alert(`Error al reportar la falla: ${error.message}`);
            }
        }
        // --- NUEVO: Botón Ver Historial ---
        else if (e.target.classList.contains('view-history-btn')) {
            const luzId = e.target.dataset.id;
            const luz = allLucesData.find(l => l._id === luzId);

            if (luz && luz.historialFallas && luz.historialFallas.length > 0) {
                let historyHtml = '<h3>Historial de Fallas:</h3><ul>';
                // Ordenar fallas por fecha más reciente primero
                const sortedHistory = [...luz.historialFallas].sort((a, b) => new Date(b.fecha_falla) - new Date(a.fecha_falla));

                sortedHistory.forEach(falla => {
                    historyHtml += `
                        <li>
                            <strong>Falla el:</strong> ${formatDate(falla.fecha_falla)} - <strong>Estado:</strong> ${falla.estado_falla_en_momento}
                            ${falla.fecha_arreglo ? ` - <strong>Arreglo el:</strong> ${formatDate(falla.fecha_arreglo)}` : ' - PENDIENTE'}
                            ${falla.observaciones ? ` - Obs: ${falla.observaciones}` : ''}
                            ${falla.fecha_arreglo ? '' : `<button class="mark-resolved-btn-modal bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded ml-2" data-luz-id="${luzId}" data-falla-id="${falla._id}">Marcar Resuelto</button>`}
                            <button class="delete-falla-btn-modal bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded ml-2" data-luz-id="${luzId}" data-falla-id="${falla._id}">Eliminar Falla</button>
                        </li>
                    `;
                });
                historyHtml += '</ul>';

                // Usar un modal simple para mostrar el historial
                // Necesitarás una implementación de modal (ej. div con posición fija y display:none)
                // Por simplicidad, usaremos un alert/confirm más avanzado o un div temporal
                showCustomModal('Historial de Fallas', historyHtml, luzId);

            } else {
                alert('No hay historial de fallas para esta luz.');
            }
        }
    });

    // --- NUEVO: Función para mostrar un modal personalizado ---
    // Tendrás que añadir el HTML para este modal en tu luces.html si no lo tienes
    function showCustomModal(title, content, luzId) {
        let modal = document.getElementById('customModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customModal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 hidden';
            modal.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full text-white">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xl font-bold" id="customModalTitle"></h4>
                        <button id="closeModalBtn" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div id="customModalContent" class="mb-4 max-h-96 overflow-y-auto"></div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('closeModalBtn').addEventListener('click', () => {
                modal.classList.add('hidden');
            });

            // Delegación de eventos para botones dentro del modal de historial
            document.getElementById('customModalContent').addEventListener('click', async (e) => {
                const headers = getAuthHeaders();
                if (!headers['Authorization']) {
                    alert('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.');
                    return;
                }

                if (e.target.classList.contains('mark-resolved-btn-modal')) {
                    const fallaId = e.target.dataset.fallaId;
                    const luzId = e.target.dataset.luzId;

                    let fechaArreglo = prompt('Ingrese la fecha de arreglo (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
                    if (!fechaArreglo) {
                        alert('La fecha de arreglo es requerida.');
                        return;
                    }
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaArreglo)) {
                        alert('Formato de fecha inválido. UsebeginPath-MM-DD.');
                        return;
                    }

                    try {
                        const response = await fetch(`http://localhost:3000/api/luces/${luzId}/marcar-resuelto`, {
                            method: 'PUT',
                            headers: headers,
                            body: JSON.stringify({ fecha_arreglo: fechaArreglo })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            let errorMessage = `Error al marcar como resuelto: HTTP status ${response.status}`;
                            try {
                                const errorData = JSON.parse(errorText);
                                errorMessage = errorData.message || errorMessage;
                            } catch (jsonParseError) {
                                errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                            }
                            throw new Error(errorMessage);
                        }
                        alert('Falla marcada como resuelta exitosamente.');
                        modal.classList.add('hidden'); // Cerrar modal después de la operación
                        loadLuces(); // Recargar datos
                    } catch (error) {
                        console.error('Error al marcar la falla como resuelta:', error);
                        alert(`Error al marcar la falla como resuelta: ${error.message}`);
                    }

                } else if (e.target.classList.contains('delete-falla-btn-modal')) {
                    const fallaId = e.target.dataset.fallaId;
                    const luzId = e.target.dataset.luzId;

                    if (confirm('¿Estás seguro de que quieres eliminar esta falla específica del historial?')) {
                        try {
                            const response = await fetch(`http://localhost:3000/api/luces/${luzId}/fallas/${fallaId}`, {
                                method: 'DELETE',
                                headers: headers
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                let errorMessage = `Error al eliminar falla: HTTP status ${response.status}`;
                                try {
                                    const errorData = JSON.parse(errorText);
                                    errorMessage = errorData.message || errorMessage;
                                } catch (jsonParseError) {
                                    errorMessage = `Error inesperado del servidor: ${errorText.substring(0, 100)}... (no es JSON válido)`;
                                }
                                throw new Error(errorMessage);
                            }
                            alert('Falla eliminada del historial exitosamente.');
                            modal.classList.add('hidden'); // Cerrar modal después de la operación
                            loadLuces(); // Recargar datos
                        } catch (error) {
                            console.error('Error al eliminar la falla:', error);
                            alert(`Error al eliminar la falla: ${error.message}`);
                        }
                    }
                }
            });
        }

        document.getElementById('customModalTitle').textContent = title;
        document.getElementById('customModalContent').innerHTML = content;
        modal.classList.remove('hidden');
    }

    // ELIMINADO: fallasTableBody.addEventListener ya no es necesaria

    // --- Paginación ---
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLucesTable(allLucesData);
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(allLucesData.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderLucesTable(allLucesData);
        }
    });

    // --- Búsqueda (Filtro) ---
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderLucesTable(allLucesData);
    });

    // --- Exportar a Excel ---
    exportExcelBtn.addEventListener('click', () => {
        if (allLucesData.length === 0) { // Solo se exportan luces si hay datos
            alert("No hay datos para exportar.");
            return;
        }

        const lucesToExport = allLucesData.map(luz => ({
            ITEM: luz.item,
            AREA: luz.area,
            CIRCUITO: luz.circuito,
            LUMINARIA: luz.luminaria,
            ESTADO_ACTUAL: luz.estado_actual,
            FECHA_REGISTRO: formatDateTime(luz.createdAt)
        }));

        const fallasToExport = [];
        allLucesData.forEach(luz => {
            if (luz.historialFallas && luz.historialFallas.length > 0) {
                luz.historialFallas.forEach(falla => {
                    fallasToExport.push({
                        ITEM_LUZ: luz.item,
                        AREA_LUZ: luz.area,
                        CIRCUITO_LUZ: luz.circuito,
                        LUMINARIA_LUZ: luz.luminaria,
                        ESTADO_DE_FALLA: falla.estado_falla_en_momento || 'N/A',
                        FECHA_FALLA: formatDate(falla.fecha_falla),
                        FECHA_ARREGLO: formatDate(falla.fecha_arreglo) || 'PENDIENTE',
                        OBSERVACIONES: falla.observaciones
                    });
                });
            }
        });

        const wb = XLSX.utils.book_new();

        if (lucesToExport.length > 0) {
            const wsLuces = XLSX.utils.json_to_sheet(lucesToExport);
            XLSX.utils.book_append_sheet(wb, wsLuces, "Luces Actuales");
        }

        if (fallasToExport.length > 0) {
            const wsFallas = XLSX.utils.json_to_sheet(fallasToExport);
            XLSX.utils.book_append_sheet(wb, wsFallas, "Historial Fallas");
        }

        if (wb.SheetNames.length > 0) {
            XLSX.writeFile(wb, "Reporte_Luces_y_Fallas.xlsx");
        } else {
            alert("No hay datos para exportar.");
        }
    });

    // Cargar datos al iniciar la página
    loadLuces();
});