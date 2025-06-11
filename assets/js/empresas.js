document.addEventListener('DOMContentLoaded', function() {
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    const state = {
        empresasData: [],
        currentItem: 1,
        currentPage: config.defaultPage,
        filteredData: null,
        editMode: false,
        editItem: null
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
        elements.exportBtn.addEventListener('click', exportToExcel);
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
        elements.nextPageBtn.addEventListener('click', goToNextPage);
        elements.tableBody.addEventListener('click', handleTableClick);
    }

    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        elements.registerForm.reset();
        if (state.editMode && state.editItem) {
            loadEditData();
        }
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
        state.editMode = false;
        state.editItem = null;
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.registerForm);

        const newEntry = {
            item: state.editMode ? state.editItem : state.currentItem++,
            fecha_entrada: formData.get('fecha_entrada'),
            fecha_salida: state.editMode ? state.empresasData.find(p => p.item === state.editItem).fecha_salida : '-',
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

        if (state.editMode) {
            const index = state.empresasData.findIndex(p => p.item === state.editItem);
            if (index !== -1) {
                state.empresasData[index] = newEntry;
            }
        } else {
            state.empresasData.push(newEntry);
        }

        renderTable();
        hideRegisterForm();
        alert(`Registro ${state.editMode ? 'modificado' : 'guardado'} exitosamente`);
    }

    function renderTable() {
        const data = state.filteredData || state.empresasData;
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
                <td colspan="15" class="px-6 py-4 text-center text-gray-400">
                    No hay registros disponibles. Agregue un nuevo registro.
                </td>
            </tr>
        `;
    }

    function renderTableRows(data) {
        data.forEach(empresa => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${empresa.item}</td>
                <td class="px-4 py-3 text-center">${empresa.fecha_entrada}</td>
                <td class="px-4 py-3 text-center">${empresa.fecha_salida}</td>
                <td class="px-4 py-3">${empresa.nombre_empresa}</td>
                <td class="px-4 py-3 text-center">${empresa.identificacion}</td>
                <td class="px-4 py-3 text-center">${empresa.area_ingreso}</td>
                <td class="px-4 py-3">${empresa.empresa}</td>
                <td class="px-4 py-3 text-center">${empresa.carne}</td>
                <td class="px-4 py-3 text-center">${empresa.tipo_empresa}</td>
                <td class="px-4 py-3">${empresa.area}</td>
                <td class="px-4 py-3 text-center">${empresa.dependencia}</td>
                <td class="px-4 py-3 text-center">${empresa.dispositivo}</td>
                <td class="px-4 py-3 text-center">${empresa.codigo_dispositivo}</td>
                <td class="px-4 py-3">${empresa.observaciones}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-item="${empresa.item}">Editar</button>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded salida-btn" data-item="${empresa.item}">Salida</button>
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
                Object.values(empresa).some(value => String(value).toUpperCase().includes(searchTerm))
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
        if (state.empresasData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = Object.keys(state.empresasData[0]);
        const data = state.empresasData.map(empresa => headers.map(header => empresa[header]));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Empresas');

        XLSX.writeFile(workbook, 'registros_empresas.xlsx');
        alert('Datos de empresas exportados correctamente en formato Excel (.xlsx)');
    }

    function handleTableClick(e) {
        if (e.target.classList.contains('edit-btn')) {
            handleEdit(e);
        } else if (e.target.classList.contains('salida-btn')) {
            handleSalida(e);
        }
    }

    function handleEdit(e) {
        state.editMode = true;
        state.editItem = parseInt(e.target.dataset.item);
        showRegisterForm();
    }

    function handleSalida(e) {
        const item = parseInt(e.target.dataset.item);
        const index = state.empresasData.findIndex(p => p.item === item);
        if (index !== -1) {
            const now = new Date();
            state.empresasData[index].fecha_salida = prompt('Ingrese la fecha y hora de salida:', `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`) || '-';
            renderTable();
            alert('Fecha de salida registrada exitosamente');
        }
    }

    function loadEditData() {
        const empresa = state.empresasData.find(p => p.item === state.editItem);
        if (empresa) {
            elements.registerForm.fecha_entrada.value = empresa.fecha_entrada;
            elements.registerForm.nombre_empresa.value = empresa.nombre_empresa;
            elements.registerForm.identificacion.value = empresa.identificacion;
            elements.registerForm.area_ingreso.value = empresa.area_ingreso;
            elements.registerForm.empresa.value = empresa.empresa;
            elements.registerForm.carne.value = empresa.carne;
            elements.registerForm.tipo_empresa.value = empresa.tipo_empresa;
            elements.registerForm.area.value = empresa.area;
            elements.registerForm.dependencia.value = empresa.dependencia;
            elements.registerForm.dispositivo.value = empresa.dispositivo;
            elements.registerForm.codigo_dispositivo.value = empresa.codigo_dispositivo;
            elements.registerForm.observaciones.value = empresa.observaciones;
        }
    }

    init();
});