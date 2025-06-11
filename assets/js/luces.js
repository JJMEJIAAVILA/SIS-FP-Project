document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        lucesData: [],
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
            circuito: formData.get('circuito'),
            luminaria: formData.get('luminaria'),
            estado_actual: formData.get('estado_actual'),
            fecha_falla: formData.get('fecha_falla') || null,
            fecha_arreglo: formData.get('fecha_arreglo') || null,
            observaciones: formData.get('observaciones')
        };

        if (state.editMode) {
            const index = state.lucesData.findIndex(luz => luz.item === state.editItem);
            if (index !== -1) {
                state.lucesData[index] = newEntry;
            }
            const historialIndex = state.historialData.findIndex(luz => luz.item === state.editItem);
            if (historialIndex !== -1) {
                state.historialData[historialIndex] = {
                    ...state.historialData[historialIndex],
                    fecha_arreglo: newEntry.fecha_arreglo
                };
            }
            state.editMode = false;
            state.editItem = null;
        } else {
            state.lucesData.push(newEntry);
            if (newEntry.fecha_falla) {
                state.historialData.push({
                    item: newEntry.item,
                    area: newEntry.area,
                    circuito: newEntry.circuito,
                    luminaria: newEntry.luminaria,
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

    // Funciones de tabla y paginación
    function renderTable() {
        const data = state.filteredData || state.lucesData;
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
        data.forEach(luz => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${luz.item}</td>
                <td class="px-4 py-3">${luz.area || ''}</td>
                <td class="px-4 py-3">${luz.circuito || ''}</td>
                <td class="px-4 py-3">${luz.luminaria || ''}</td>
                <td class="px-4 py-3">${luz.estado_actual || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-item="${luz.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-item="${luz.item}">Eliminar</button>
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
        const searchTerm = this.value.toLowerCase();
        
        if (searchTerm === '') {
            state.filteredData = null;
        } else {
            state.filteredData = state.lucesData.filter(luz => 
                Object.values(luz).some(
                    value => String(value).toLowerCase().includes(searchTerm)
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
        const data = state.filteredData || state.lucesData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos
    function exportExcel() {
        if (state.lucesData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.lucesData[0]);
        const data = state.lucesData.map(luz => headers.map(header => luz[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "sistema_luces.xlsx");
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
        const luz = state.lucesData.find(l => l.item === state.editItem);
        if (luz) {
            elements.registerForm.area.value = luz.area;
            elements.registerForm.circuito.value = luz.circuito;
            elements.registerForm.luminaria.value = luz.luminaria;
            elements.registerForm.estado_actual.value = luz.estado_actual;
            elements.registerForm.fecha_falla.value = luz.fecha_falla;
            elements.registerForm.fecha_arreglo.value = luz.fecha_arreglo;
            elements.registerForm.observaciones.value = luz.observaciones;
            showRegisterForm();
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.lucesData = state.lucesData.filter(luz => luz.item !== item);
                renderTable();
            }
        }
    }

    function renderHistorial() {
        elements.historialBody.innerHTML = '';
        state.historialData.forEach(luz => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${luz.item}</td>
                <td class="px-4 py-3">${luz.area || ''}</td>
                <td class="px-4 py-3">${luz.circuito || ''}</td>
                <td class="px-4 py-3">${luz.luminaria || ''}</td>
                <td class="px-4 py-3">${luz.estado_actual || ''}</td>
                <td class="px-4 py-3 text-center">${luz.fecha_falla || ''}</td>
                <td class="px-4 py-3 text-center">${luz.fecha_arreglo || ''}</td>
                <td class="px-4 py-3">${luz.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded historial-edit-btn" data-item="${luz.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded historial-delete-btn" data-item="${luz.item}">Eliminar</button>
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
        const luz = state.historialData.find(l => l.item === state.editHistorialItem);
        if (luz) {
            elements.registerForm.area.value = luz.area;
            elements.registerForm.circuito.value = luz.circuito;
            elements.registerForm.luminaria.value = luz.luminaria;
            elements.registerForm.estado_actual.value = luz.estado_actual;
            elements.registerForm.fecha_falla.value = luz.fecha_falla;
            elements.registerForm.fecha_arreglo.value = luz.fecha_arreglo;
            elements.registerForm.observaciones.value = luz.observaciones;
            showRegisterForm();
        }
    }

    function handleDeleteHistorial(e) {
        if (e.target.classList.contains('historial-delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro del historial?')) {
                state.historialData = state.historialData.filter(luz => luz.item !== item);
                renderHistorial();
            }
        }
    }

    // Iniciar aplicación
    init();
});