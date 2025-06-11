document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        fuerzaPublicaData: [],
        currentPage: config.defaultPage,
        filteredData: null,
        itemCounter: 1,
        editMode: false,
        editItem: null
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
        userDisplay: document.getElementById('userDisplay')
    };

    // Inicialización
    function init() {
        loadUser();
        setupEventListeners();
        renderTable();
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
            fecha: formData.get('fecha'),
            fuerza_publica: formData.get('fuerza_publica'),
            unidades: formData.get('unidades'),
            hora_llegada: formData.get('hora_llegada'),
            hora_salida: formData.get('hora_salida'),
            accion_realizada: formData.get('accion_realizada'),
            observaciones: formData.get('observaciones')
        };

        if (state.editMode) {
            const index = state.fuerzaPublicaData.findIndex(fuerzaPublica => fuerzaPublica.item === state.editItem);
            if (index !== -1) {
                state.fuerzaPublicaData[index] = newEntry;
            }
            state.editMode = false;
            state.editItem = null;
        } else {
            state.fuerzaPublicaData.push(newEntry);
        }
        renderTable();
        hideRegisterForm();
        alert('Registro guardado exitosamente');
    }

    // Funciones de tabla y paginación (igual a luces.js)
    function renderTable() {
        const data = state.filteredData || state.fuerzaPublicaData;
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
                <td colspan="9" class="px-6 py-4 text-center text-gray-400">
                    No hay registros disponibles. Agregue un nuevo registro.
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach(fuerzaPublica => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${fuerzaPublica.item}</td>
                <td class="px-4 py-3">${fuerzaPublica.fecha || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.fuerza_publica || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.unidades || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.hora_llegada || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.hora_salida || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.accion_realizada || ''}</td>
                <td class="px-4 py-3">${fuerzaPublica.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-item="${fuerzaPublica.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-item="${fuerzaPublica.item}">Eliminar</button>
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
            state.filteredData = state.fuerzaPublicaData.filter(fuerzaPublica => 
                Object.values(fuerzaPublica).some(
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
        const data = state.filteredData || state.fuerzaPublicaData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos (igual a luces.js)
    function exportExcel() {
        if (state.fuerzaPublicaData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.fuerzaPublicaData[0]);
        const data = state.fuerzaPublicaData.map(fuerzaPublica => headers.map(header => fuerzaPublica[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "sistema_fuerza_publica.xlsx");
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
        const fuerzaPublica = state.fuerzaPublicaData.find(fp => fp.item === state.editItem);
        if (fuerzaPublica) {
            elements.registerForm.fecha.value = fuerzaPublica.fecha;
            elements.registerForm.fuerza_publica.value = fuerzaPublica.fuerza_publica;
            elements.registerForm.unidades.value = fuerzaPublica.unidades;
            elements.registerForm.hora_llegada.value = fuerzaPublica.hora_llegada;
            elements.registerForm.hora_salida.value = fuerzaPublica.hora_salida;
            elements.registerForm.accion_realizada.value = fuerzaPublica.accion_realizada;
            elements.registerForm.observaciones.value = fuerzaPublica.observaciones;
            showRegisterForm();
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.fuerzaPublicaData = state.fuerzaPublicaData.filter(fuerzaPublica => fuerzaPublica.item !== item);
                renderTable();
            }
        }
    }

    // Iniciar aplicación
    init();
});