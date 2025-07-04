// SIS-FP/assets/js/antecedentes.js - ACTUALIZADO (Manejo de Fecha de Registro y Errores de 6 meses)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded for antecedentes.js');

    // --- Configuración Inicial de la Interfaz de Usuario ---
    const userDisplayElement = document.getElementById('userDisplay');
    const storedUsername = localStorage.getItem('username');

    if (userDisplayElement) {
        if (storedUsername) {
            userDisplayElement.textContent = storedUsername.toUpperCase();
        } else {
            userDisplayElement.textContent = 'INVITADO';
        }
    }

    // --- Referencias a Elementos del DOM ---
    const newRegisterBtn = document.getElementById('newRegisterBtn');
    const newRegisterForm = document.getElementById('newRegisterForm');
    const registerForm = document.getElementById('registerForm');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    // --- Variables de Estado para Datos y Paginación ---
    let allAntecedentesData = [];
    let currentPage = 1;
    const recordsPerPage = 10;

    // --- Funciones de Utilidad ---

    // Formatea una cadena de fecha y hora a 'DD/MM/YYYY' (solo fecha, para la tabla)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        // Usar UTC para evitar problemas de zona horaria al mostrar fechas guardadas en UTC
        return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
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
        console.log('Loading antecedentes...');
        try {
            const headers = getAuthHeaders();

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
                    window.location.href = './login.html'; // Redirigir a login
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();
            allAntecedentesData = data.antecedentes;
            console.log('Antecedentes loaded:', allAntecedentesData);

            renderAntecedentesTable(allAntecedentesData);

        } catch (error) {
            console.error('Error al cargar los antecedentes:', error);
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-400">Error al cargar los datos: ${error.message}</td></tr>`; // Colspan ajustado a 9
            alert(`Error al cargar los datos: ${error.message}`);
        }
    }

    // --- Renderizado de la Tabla de Antecedentes ---

    function renderAntecedentesTable(dataToRender) {
        tableBody.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredData = dataToRender.filter(antecedente => {
            // Asegurarse de que los campos existen antes de intentar acceder a ellos
            return (antecedente.nombre && antecedente.nombre.toLowerCase().includes(searchTerm)) ||
                (antecedente.numero_identificacion && antecedente.numero_identificacion.toLowerCase().includes(searchTerm)) ||
                (antecedente.empresa && antecedente.empresa.toLowerCase().includes(searchTerm)) ||
                (antecedente.dependencia && antecedente.dependencia.toLowerCase().includes(searchTerm)) ||
                (antecedente.observaciones && antecedente.observaciones.toLowerCase().includes(searchTerm)) ||
                (antecedente.resultado_verificacion && antecedente.resultado_verificacion.toLowerCase().includes(searchTerm)) ||
                (antecedente.item && antecedente.item.toString().includes(searchTerm));
        });

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-gray-400">No hay registros disponibles o no se encontraron resultados.</td></tr>`; // Colspan ajustado a 9
            updatePaginationInfo(0);
            return;
        }

        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        paginatedData.forEach((antecedente) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            // Usa antecedente.createdAt si fechaRegistro no está en tu modelo, o viceversa
            const fechaRegistroDisplay = formatDate(antecedente.fechaRegistro || antecedente.createdAt);

            row.innerHTML = `
                <td class="px-4 py-3 text-center">${antecedente.item || '-'}</td>
                <td class="px-4 py-3">${antecedente.nombre || '-'}</td>
                <td class="px-4 py-3 text-center">${antecedente.numero_identificacion || '-'}</td>
                <td class="px-4 py-3">${antecedente.empresa || '-'}</td>
                <td class="px-4 py-3">${antecedente.dependencia || '-'}</td>
                <td class="px-4 py-3">${antecedente.observaciones || 'Sin observaciones'}</td>
                <td class="px-4 py-3 text-center">${antecedente.resultado_verificacion || 'PENDIENTE'}</td>
                <td class="px-4 py-3 text-center">${fechaRegistroDisplay}</td> <!-- Nueva celda para la fecha de registro -->
                <td class="px-4 py-3 text-center">
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded mr-2" data-id="${antecedente._id}">Editar</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" data-id="${antecedente._id}">Eliminar</button>
                    <button class="verify-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded ml-2" data-id-number="${antecedente.numero_identificacion}">Verificar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        updatePaginationInfo(filteredData.length);
    }

    function updatePaginationInfo(totalRecords) {
        document.getElementById('currentRecords').textContent = totalRecords;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        document.getElementById('currentPage').textContent = `${currentPage} / ${totalPages}`;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalRecords === 0;
    }

    // --- Manejo de Eventos ---

    newRegisterBtn.addEventListener('click', () => {
        newRegisterForm.classList.toggle('hidden');
        if (!newRegisterForm.classList.contains('hidden')) {
            registerForm.reset();
            registerForm.dataset.editingId = '';
            document.getElementById('saveBtn').textContent = 'GUARDAR';

            const itemInput = registerForm.querySelector('[name="item"]');
            if (itemInput) {
                // Calcular el siguiente ITEM disponible
                const maxItem = allAntecedentesData.reduce((max, ant) => Math.max(max, ant.item || 0), 0);
                itemInput.value = maxItem + 1;
                itemInput.readOnly = false; // Asegurarse de que no esté en solo lectura para nuevos registros
            }
        }
    });

    cancelFormBtn.addEventListener('click', () => {
        newRegisterForm.classList.add('hidden');
        registerForm.reset();
        registerForm.dataset.editingId = '';
        const itemInput = registerForm.querySelector('[name="item"]');
        if (itemInput) {
            itemInput.readOnly = false;
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = registerForm.dataset.editingId;
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        if (data.item) data.item = parseInt(data.item);
        // Los campos de texto se convierten a mayúsculas en el backend, pero es buena práctica hacerlo también aquí
        // para una validación visual inmediata si se desea. Sin embargo, el backend es la fuente de verdad.

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
                console.error('Frontend Error:', errorMessage); // Log del error en consola
                alert(`Error al guardar el antecedente: ${errorMessage}`); // Mostrar mensaje de error al usuario
                throw new Error(errorMessage); // Lanzar error para el catch
            }

            alert(`Antecedente ${editingId ? 'actualizado' : 'agregado'} exitosamente.`);
            newRegisterForm.classList.add('hidden');
            loadAntecedentes(); // Recargar la tabla
        } catch (error) {
            console.error('Error en la solicitud fetch al guardar antecedente:', error);
            // El alert ya se mostró en el bloque if (!response.ok)
        }
    });

    tableBody.addEventListener('click', async (e) => {
        const headers = getAuthHeaders();

        if (!headers['Authorization'] && !e.target.classList.contains('verify-btn')) {
            alert('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente para realizar esta acción.');
            return;
        }

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
        } else if (e.target.classList.contains('delete-btn')) {
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
                        console.error('Frontend Error:', errorMessage);
                        throw new Error(errorMessage);
                    }
                    alert('Antecedente eliminado exitosamente.');
                    loadAntecedentes();
                } catch (error) {
                    console.error('Error al eliminar el antecedente:', error);
                    alert(`Error al eliminar el antecedente: ${error.message}`);
                }
            }
        } else if (e.target.classList.contains('verify-btn')) {
            const idNumber = e.target.dataset.idNumber;
            const verificationUrl = `https://antecedentes.policia.gov.co:7005/WebJudicial/antecedentes.xhtml`;
            window.open(verificationUrl, '_blank');
        }
    });

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

    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderAntecedentesTable(allAntecedentesData);
    });

    exportExcelBtn.addEventListener('click', () => {
        if (allAntecedentesData.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        const dataToExport = allAntecedentesData.map(antecedente => ({
            ITEM: antecedente.item || '-',
            NOMBRE: antecedente.nombre || '-',
            'N.I.': antecedente.numero_identificacion || '-',
            EMPRESA: antecedente.empresa || '-',
            DEPENDENCIA: antecedente.dependencia || '-',
            OBSERVACIONES: antecedente.observaciones || 'Sin observaciones',
            'RESULTADO DE VERIFICACIÓN': antecedente.resultado_verificacion || 'PENDIENTE',
            // Usa antecedente.createdAt si fechaRegistro no está en tu modelo, o viceversa
            'FECHA DE REGISTRO': formatDate(antecedente.fechaRegistro || antecedente.createdAt)
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Antecedentes");

        XLSX.writeFile(wb, "Reporte_Antecedentes.xlsx");
    });

    loadAntecedentes();
});