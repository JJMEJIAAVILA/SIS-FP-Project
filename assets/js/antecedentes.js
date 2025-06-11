document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const config = {
        itemsPerPage: 10,
        defaultPage: 1
    };

    // Estado de la aplicación
    const state = {
        antecedentesData: [],
        currentItem: 1,
        currentPage: config.defaultPage,
        filteredData: null,
        editingItemId: null 
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
        saveBtn: document.getElementById('saveBtn'),
        editItemId: document.getElementById('editItemId')
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
    }

    // Funciones de formulario
    function showRegisterForm() {
        elements.newRegisterForm.classList.remove('hidden');
        elements.registerForm.reset();
        document.getElementById('fechaRegistro').value = new Date().toLocaleDateString();
        elements.saveBtn.textContent = 'Guardar';
        state.editingItemId = null;
    }

    function hideRegisterForm() {
        elements.newRegisterForm.classList.add('hidden');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.registerForm);
        
        const newEntry = {
            item: state.editingItemId || state.currentItem++,
            fecha: formData.get('fechaRegistro'),
            nombres_apellidos: formData.get('nombres_apellidos'),
            ni: formData.get('ni'),
            empresa: formData.get('empresa'),
            observaciones: formData.get('observaciones')
        };
        
        if (state.editingItemId) {
            const index = state.antecedentesData.findIndex(item => item.item === state.editingItemId);
            if (index !== -1) {
                state.antecedentesData[index] = newEntry;
            }
        } else {
            state.antecedentesData.push(newEntry);
        }

        renderTable();
        hideRegisterForm();
        alert('Registro guardado exitosamente');
    }

    // Funciones de tabla y paginación
    function renderTable() {
        const data = state.filteredData || state.antecedentesData;
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
        data.forEach(antecedente => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white hover:bg-opacity-10';
            row.innerHTML = `
                <td class="px-4 py-3 text-center">${antecedente.item}</td>
                <td class="px-4 py-3 text-center">${antecedente.fecha || ''}</td>
                <td class="px-4 py-3">${antecedente.nombres_apellidos || ''}</td>
                <td class="px-4 py-3 text-center">${antecedente.ni || ''}</td>
                <td class="px-4 py-3">${antecedente.empresa || ''}</td>
                <td class="px-4 py-3">${antecedente.observaciones || ''}</td>
                <td class="px-4 py-3 text-center">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded verificar-btn" data-ni="${antecedente.ni}">Verificar</button>
                    <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded edit-btn" data-id="${antecedente.item}">Editar</button>
                    <button class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded delete-btn" data-id="${antecedente.item}">Eliminar</button>
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
            state.filteredData = state.antecedentesData.filter(antecedente => 
                Object.values(antecedente).some(
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
        const data = state.filteredData || state.antecedentesData;
        const totalPages = Math.ceil(data.length / config.itemsPerPage);
        
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    }

    // Exportación de datos
    function exportExcel() {
        if (state.antecedentesData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        const headers = Object.keys(state.antecedentesData[0]);
        const data = state.antecedentesData.map(antecedente => headers.map(header => antecedente[header]));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registro");
        XLSX.writeFile(workbook, "verificacion_antecedentes.xlsx");
        alert('Datos exportados a Excel correctamente');
    }

    function handleTableClick(e) {
        if (e.target.classList.contains('verificar-btn')) {
            const ni = e.target.dataset.ni;
            window.open(`https://antecedentes.policia.gov.co:7005/WebJudicial/index.xhtml?numeroDocumento=${ni}`, '_blank');
        } else if (e.target.classList.contains('edit-btn')) {
            handleEdit(e);
        } else if (e.target.classList.contains('delete-btn')) {
            handleDelete(e);
        }
    }

    function handleEdit(e) {
        const id = parseInt(e.target.dataset.id);
        const itemToEdit = state.antecedentesData.find(item => item.item === id);
        if (itemToEdit) {
            showRegisterForm();
            elements.registerForm.nombres_apellidos.value = itemToEdit.nombres_apellidos;
            elements.registerForm.ni.value = itemToEdit.ni;
            elements.registerForm.empresa.value = itemToEdit.empresa;
            elements.registerForm.observaciones.value = itemToEdit.observaciones;
            elements.registerForm.fechaRegistro.value = itemToEdit.fecha;
            elements.editItemId.value = id;
            elements.saveBtn.textContent = 'Actualizar';
            state.editingItemId = id;
        }
    }

    function handleDelete(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                state.antecedentesData = state.antecedentesData.filter(antecedente => antecedente.item !== id);
                renderTable();
            }
        }
    }

    // Iniciar aplicación
    init();
});