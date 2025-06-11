document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        protestasData: [],
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
        elements.registerForm.hora_inicio.addEventListener('change', calculateBlockTime);
        elements.registerForm.hora_finalizacion.addEventListener('change', calculateBlockTime);
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
        elements.registerForm.hora_inicio.removeEventListener('change', calculateBlockTime);
        elements.registerForm.hora_finalizacion.removeEventListener('change', calculateBlockTime);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.registerForm);
        
        const newEntry = {
            item: state.editMode ? state.editItem : state.itemCounter++,
            fecha: formData.get('fecha'),
            tipo_protesta: formData.get('tipo_protesta'),
            vias: formData.get('vias'),
            sector_bloqueo: formData.get('sector_bloqueo'),
            motivo_protesta: formData.get('motivo_protesta'),
            generador_protesta: formData.get('generador_protesta'),
            hora_inicio: formData.get('hora_inicio'),
            hora_finalizacion: formData.get('hora_finalizacion'),
            tiempo_total_bloqueo: formData.get('tiempo_total_bloqueo'),
            geoposicion: formData.get('geoposicion'),
            observaciones: formData.get('observaciones')
        };

        if (state.editMode) {
            const index = state.protestasData.findIndex(protesta => protesta.item === state.editItem);
            if (index !== -1) {
                state.protestasData[index] = newEntry;
            }
            state.editMode = false;
            state.editItem = null;
        } else {
            state.protestasData.push(newEntry);
        }
        renderTable();
        hideRegisterForm();
        alert('Registro guardado exitosamente');
    }

    // Funciones de tabla y paginación (igual a luces.js)
    function renderTable() {
        const data = state.filteredData || state.protestasData;
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
                <td colspan="13" class="px-6 py-4 text-center text-gray-400">
                    No hay registros disponibles. Agregue un nuevo registro.
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach(protesta => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${protesta.item}</td>
                <td class="px-4 py-3">${protesta.fecha || ''}</td>
                <td class="px-4 py-3">${protesta.tipo_protesta || ''}</td>
                <td class="px-4 py-3">${protesta.vias || ''}</td>
                <td class="px-4 py-3">${protesta.sector_bloqueo || ''}</td>
                <td class="px-4 py-3">${protesta.motivo_protesta || ''}</td>
                <td class="px-4 py-3">${protesta.generador_protesta || ''}</td>
                <td class="px-4 py-3">${protesta.hora_inicio || ''}</td>
                <td class="px-4 py-3">${protesta.hora_finalizacion || ''}</td>
                <td class="px-4 py-3">${protesta.tiempo_total_bloqueo || ''}</td>
                <td class="px-4 py-3">${protesta.geoposicion || ''}</td>
                <td class="px-4 py-3">${protesta.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-item="${protesta.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-item="${protesta.item}">Eliminar</button>
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
            state.filteredData = state.protestasData.filter(protesta => 
                Object.values(protesta).some(
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
        const data = state.filteredData || state.protestasData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos (igual a luces.js)
    function exportExcel() {
        if (state.protestasData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.protestasData[0]);
        const data = state.protestasData.map(protesta => headers.map(header => protesta[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "sistema_protestas.xlsx");
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
        const protesta = state.protestasData.find(p => p.item === state.editItem);
        if (protesta) {
            elements.registerForm.fecha.value = protesta.fecha;
            elements.registerForm.tipo_protesta.value = protesta.tipo_protesta;
            elements.registerForm.vias.value = protesta.vias;
            elements.registerForm.sector_bloqueo.value = protesta.sector_bloqueo;
            elements.registerForm.motivo_protesta.value = protesta.motivo_protesta;
            elements.registerForm.generador_protesta.value = protesta.generador_protesta;
            elements.registerForm.hora_inicio.value = protesta.hora_inicio;
            elements.registerForm.hora_finalizacion.value = protesta.hora_finalizacion;
            elements.registerForm.tiempo_total_bloqueo.value = protesta.tiempo_total_bloqueo;
            elements.registerForm.geoposicion.value = protesta.geoposicion;
            elements.registerForm.observaciones.value = protesta.observaciones;
            showRegisterForm();
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const item = parseInt(e.target.dataset.item);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.protestasData = state.protestasData.filter(protesta => protesta.item !== item);
                renderTable();
            }
        }
    }

    // Función para calcular el tiempo total del bloqueo
    function calculateBlockTime() {
        const startTime = elements.registerForm.hora_inicio.value;
        const endTime = elements.registerForm.hora_finalizacion.value;

        if (startTime && endTime) {
            const start = new Date(`01/01/2000 ${startTime}`);
            const end = new Date(`01/01/2000 ${endTime}`);
            const diff = new Date(end - start);

            const hours = diff.getUTCHours();
            const minutes = diff.getUTCMinutes();
            elements.registerForm.tiempo_total_bloqueo.value = `${hours}h ${minutes}m`;
        } else {
            elements.registerForm.tiempo_total_bloqueo.value = '';
        }
    }

    // Iniciar aplicación
    init();
});