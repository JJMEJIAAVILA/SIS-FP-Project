document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        vehiculosData: [],
        currentItem: 1,
        currentPage: config.defaultPage,
        filteredData: null,
        vehiculoSalidaId: null
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
        salidaForm: document.getElementById('salidaForm'),
        salidaRegistroForm: document.getElementById('salidaRegistroForm'),
        cancelSalidaBtn: document.getElementById('cancelSalidaBtn')
    };

    // Inicialización
    function init() {
        loadUser();
        setupEventListeners();
        renderTable();
    }

    function loadUser() {
        elements.userDisplay.textContent = localStorage.getItem('currentUser') || 'Usuario';
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
        elements.cancelSalidaBtn.addEventListener('click', hideSalidaForm);
        elements.salidaRegistroForm.addEventListener('submit', handleSalidaSubmit);
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
            item: state.currentItem++,
            fecha: formData.get('fechaRegistro'),
            conductor: formData.get('conductor'),
            empresa: formData.get('empresa'),
            placa: formData.get('placa'),
            tipo_vehiculo: formData.get('tipo_vehiculo'),
            hora_entrada: formData.get('hora_entrada'),
            hora_salida: null,
            fecha_salida: null,
            parqueadero_interno: formData.get('parqueadero_interno'),
            parqueadero_visitantes: formData.get('parqueadero_visitantes'),
            observaciones: formData.get('observaciones')
        };

        state.vehiculosData.push(newEntry);
        renderTable();
        hideRegisterForm();
        alert('Registro guardado exitosamente');
    }

    // Funciones de tabla y paginación
    function renderTable() {
        const data = state.filteredData || state.vehiculosData;
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
        data.forEach(vehiculo => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${vehiculo.item}</td>
                <td class="px-4 py-3 text-center">${vehiculo.fecha || ''}</td>
                <td class="px-4 py-3">${vehiculo.conductor || ''}</td>
                <td class="px-4 py-3">${vehiculo.empresa || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.placa || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.tipo_vehiculo || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.hora_entrada || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.hora_salida || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.fecha_salida || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.parqueadero_interno || ''}</td>
                <td class="px-4 py-3 text-center">${vehiculo.parqueadero_visitantes || ''}</td>
                <td class="px-4 py-3">${vehiculo.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded salida-btn" data-id="${vehiculo.item}">Registrar Salida</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${vehiculo.item}">Eliminar</button>
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
            state.filteredData = state.vehiculosData.filter(vehiculo => 
                Object.values(vehiculo).some(
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
        const data = state.filteredData || state.vehiculosData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos
    function exportExcel() {
        if (state.vehiculosData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.vehiculosData[0]);
        const data = state.vehiculosData.map(vehiculo => headers.map(header => vehiculo[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "registro_vehiculos.xlsx");
        alert('Datos exportados a Excel correctamente');
    }

    function handleTableClick(e) {
        if (e.target.classList.contains('salida-btn')) {
            state.vehiculoSalidaId = parseInt(e.target.dataset.id);
            showSalidaForm();
        } else if (e.target.classList.contains('delete-btn')) {
            handleDelete(e);
        }
    }

    function showSalidaForm() {
        elements.salidaForm.classList.remove('hidden');
    }

    function hideSalidaForm() {
        elements.salidaForm.classList.add('hidden');
    }

    function handleSalidaSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.salidaRegistroForm);

        const vehiculo = state.vehiculosData.find(v => v.item === state.vehiculoSalidaId);
        if (vehiculo) {
            vehiculo.hora_salida = formData.get('hora_salida');
            vehiculo.fecha_salida = formData.get('fecha_salida');
            renderTable();
            hideSalidaForm();
            alert('Salida registrada exitosamente');
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.vehiculosData = state.vehiculosData.filter(vehiculo => vehiculo.item !== id);
                renderTable();
            }
        }
    }

    // Iniciar aplicación
    init();
});