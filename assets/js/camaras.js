document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        camarasData: [],
        currentPage: config.defaultPage,
        filteredData: null,
        itemCounter: 1,
        historialData: [],
        editMode: false,
        editItem: null,
        editHistorialMode: false,
        editHistorialItem: null
    };

    // Elementos del DOM
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
        historialBody: document.getElementById('historialBody')
    };

    // Inicialización
    function init() {
        loadUser();
        setupEventListeners();
        renderTable();
        renderHistorial();
    }

    function loadUser() {
        const currentUser = localStorage.getItem('currentUser');
        elements.userDisplay.textContent = currentUser || 'Usuario';
    }

    function setupEventListeners() {
        elements.newRegisterBtn.addEventListener('click', showRegisterForm);
        elements.cancelFormBtn.addEventListener('click', hideRegisterForm);
        elements.registerForm.addEventListener('submit', handleFormSubmit);
        elements.searchInput.addEventListener('input', handleSearch);
        elements.exportExcelBtn.addEventListener('click', exportExcel);
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
        elements.nextPageBtn.addEventListener('click', goToNextPage);
        elements.tableBody.addEventListener('click', handleTableClick);
        elements.historialBody.addEventListener('click', handleHistorialClick);
    }

    // Funciones de formulario
    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        elements.registerForm.reset();
        document.getElementById('fechaRegistro').value = new Date().toLocaleDateString();
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.registerForm);
        
        const newEntry = {
            item: state.editMode ? state.editItem : state.itemCounter++,
            area: formData.get('area'),
            camara: formData.get('camara'),
            tipo: formData.get('tipo'),
            estado_actual: formData.get('estado_actual'),
            fecha_falla: formData.get('fecha_falla') || null,
            fecha_arreglo: formData.get('fecha_arreglo') || null,
            observaciones: formData.get('observaciones')
        };

        if (state.editMode) {
            const index = state.camarasData.findIndex(camara => camara.item === state.editItem);
            if (index !== -1) {
                state.camarasData[index] = newEntry;
            }
            const historialIndex = state.historialData.findIndex(camara => camara.item === state.editItem);
            if (historialIndex !== -1) {
                state.historialData[historialIndex] = {
                    ...state.historialData[historialIndex],
                    fecha_arreglo: newEntry.fecha_arreglo
                };
            }
            state.editMode = false;
            state.editItem = null;
        } else {
            state.camarasData.push(newEntry);
            if (newEntry.fecha_falla) {
                state.historialData.push({
                    item: newEntry.item,
                    area: newEntry.area,
                    camara: newEntry.camara,
                    tipo: newEntry.tipo,
                    estado_actual: newEntry.estado_actual,
                    fecha_falla: newEntry.fecha_falla,
                    fecha_arreglo: newEntry.fecha_arreglo,
                    observaciones: newEntry.observaciones
                });
                renderHistorial();
            }
        }
        renderTable();
        hideRegisterForm();
        alert('Registro guardado exitosamente');
    }

    // Funciones de tabla y paginación (igual a luces.js)
    function renderTable() {
        const data = state.filteredData || state.camarasData;
        const start = (state.currentPage - 1) * config.itemsPerPage;
        const end = start + config.itemsPerPage;
        const pageData = data.slice(start, end);

        elements.tableBody.innerHTML = '';

        if (pageData.length === 0 && data.length === 0) {
            showNoDataMessage();
        } else {
            renderTableRows(pageData);
        }

        updateUI(data, end);
    }

    function showNoDataMessage() {
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-400">
                    No hay registros disponibles. Agregue un nuevo registro.
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach(camara => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${camara.item}</td>
                <td class="px-4 py-3">${camara.area || ''}</td>
                <td class="px-4 py-3">${camara.camara || ''}</td>
                <td class="px-4 py-3">${camara.tipo || ''}</td>
                <td class="px-4 py-3">${camara.estado_actual || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-item="${camara.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-item="${camara.item}">Eliminar</button>
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

    // Funciones de búsqueda (igual a luces.js)
    function handleSearch() {
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.camarasData.filter(camara => 
                Object.values(camara).some(
                    value => String(value).toLowerCase().includes(searchTerm)
                )
            );
        }
        
        state.currentPage = config.defaultPage;
        renderTable();
    }

    // Navegación de páginas (igual a luces.js)
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

    // Exportación de datos (igual a luces.js)
    function exportExcel() {
        if (state.camarasData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.camarasData[0]);
        const data = state.camarasData.map(camara => headers.map(header => camara[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "sistema_camaras.xlsx");
        alert('Datos exportados a Excel correctamente');
    }

    function handleTableClick(e) {
        if (e.target.classList.contains('edit-btn')) {
            handleEdit(e);
        } else if (e.target.classList.contains('delete-btn')) {
            handleDelete(e);
        }
    }

    function handleEdit(e) {
        state.editMode = true;
        state.editItem = parseInt(e.target.dataset.item);
        const camara = state.camarasData.find(c => c.item === state.editItem);
        if (camara) {
            elements.registerForm.area.value = camara.area;
            elements.registerForm.camara.value = camara.camara;
            elements.registerForm.tipo.value = camara.tipo;
            elements.registerForm.estado_actual.value = camara.estado_actual;
            elements.registerForm.fecha_falla.value = camara.fecha_falla;
            elements.registerForm.fecha_arreglo.value = camara.fecha_arreglo;
            elements.registerForm.observaciones.value = camara.observaciones;
            showRegisterForm();
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.camarasData = state.camarasData.filter(camara => camara.item !== item);
                renderTable();
            }
        }
    }

    function renderHistorial() {
        elements.historialBody.innerHTML = '';
        state.historialData.forEach(camara => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${camara.item}</td>
                <td class="px-4 py-3">${camara.area || ''}</td>
                <td class="px-4 py-3">${camara.camara || ''}</td>
                <td class="px-4 py-3">${camara.tipo || ''}</td>
                <td class="px-4 py-3">${camara.estado_actual || ''}</td>
                <td class="px-4 py-3 text-center">${camara.fecha_falla || ''}</td>
                <td class="px-4 py-3 text-center">${camara.fecha_arreglo || ''}</td>
                <td class="px-4 py-3">${camara.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded historial-edit-btn" data-item="${camara.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded historial-delete-btn" data-item="${camara.item}">Eliminar</button>
                </td>
            `;
            elements.historialBody.appendChild(row);
        });
    }

    function handleHistorialClick(e) {
        if (e.target.classList.contains('historial-edit-btn')) {
            handleEditHistorial(e);
        } else if (e.target.classList.contains('historial-delete-btn')) {
            handleDeleteHistorial(e);
        }
    }

    function handleEditHistorial(e) {
        state.editHistorialMode = true;
        state.editHistorialItem = parseInt(e.target.dataset.item);
        const camara = state.historialData.find(c => c.item === state.editHistorialItem);
        if (camara) {
            elements.registerForm.area.value = camara.area;
            elements.registerForm.camara.value = camara.camara;
            elements.registerForm.tipo.value = camara.tipo;
            elements.registerForm.estado_actual.value = camara.estado_actual;
            elements.registerForm.fecha_falla.value = camara.fecha_falla;
            elements.registerForm.fecha_arreglo.value = camara.fecha_arreglo;
            elements.registerForm.observaciones.value = camara.observaciones;
            showRegisterForm();
        }
    }

    function handleDeleteHistorial(e) {
        if (e.target.classList.contains('historial-delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro del historial?')) {
                state.historialData = state.historialData.filter(camara => camara.item !== item);
                renderHistorial();
            }
        }
    }

    // Iniciar aplicación
    init();
});