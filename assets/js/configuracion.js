// assets/js/configuracion.js
document.addEventListener('DOMContentLoaded', function() {
    const guardarBtn = document.getElementById('guardarBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const regresarBtn = document.getElementById('regresarBtn');

    // --- 1. Protección de la Ruta (checkAuthentication) ---
    const checkAuthentication = async function() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Si no hay token, redirigir al login y detener la ejecución
            window.location.href = 'login.html';
            return false;
        }
        // Opcional: Podrías hacer una validación más profunda del token aquí
        // haciendo una petición a una ruta protegida simple como /api/protected
        // para asegurar que el token es válido y no expirado.
        return true;
    };

    // --- 2. Cargar Datos del Usuario al iniciar la página ---
    const loadUserData = async function() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No hay token de autenticación para cargar los datos del usuario.');
            return; // checkAuthentication ya redirigirá si no hay token
        }

        try {
            // **IMPORTANTE**: Asume que tienes una ruta en tu backend como /api/user/profile
            // que devuelve la información del usuario autenticado.
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Rellenar los campos del formulario con los datos recibidos
                document.getElementById('nombre').value = data.username || ''; // Usamos 'username' del token/backend
                document.getElementById('email').value = data.email || '';
                document.getElementById('telefono').value = data.telefono || ''; // Asume que el backend devuelve 'telefono'
                document.getElementById('idioma').value = data.idioma || 'es'; // Asume 'idioma'
                document.getElementById('tema').value = data.tema || 'oscuro'; // Asume 'tema'
            } else {
                console.error('Error al cargar los datos del usuario:', data.message || 'Error desconocido.');
                // Si hay un error al cargar los datos, el token podría ser inválido/expirado
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                alert('Su sesión ha expirado o es inválida. Por favor, inicie sesión de nuevo.');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error de red al cargar los datos del usuario:', error);
            alert('No se pudo conectar con el servidor para cargar los datos.');
        }
    };

    // --- 3. Guardar Cambios (Modificado para interactuar con el backend) ---
    guardarBtn.addEventListener('click', async function() {
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const idioma = document.getElementById('idioma').value;
        const tema = document.getElementById('tema').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Por favor, inicie sesión.');
            window.location.href = 'login.html';
            return;
        }

        const updateData = {
            username: nombre, // Asume que el campo 'nombre' corresponde al 'username'
            email: email,
            telefono: telefono,
            idioma: idioma,
            tema: tema
        };

        // Si se proporciona una nueva contraseña, inclúyela en los datos de actualización
        if (password) {
            updateData.password = password;
        }

        try {
            // **IMPORTANTE**: Asume que tienes una ruta en tu backend como /api/user/profile
            // que permite actualizar la información del usuario autenticado.
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'PUT', // O 'PATCH' si solo actualizas algunos campos
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cambios guardados correctamente.');
                // Opcional: Actualizar el username en localStorage si el nombre ha cambiado
                localStorage.setItem('username', nombre);
                // Si se cambió la contraseña, quizás es buena idea forzar un nuevo login
                // o simplemente limpiar los campos de contraseña
                document.getElementById('password').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                alert(`Error al guardar cambios: ${data.message || 'Error desconocido.'}`);
            }
        } catch (error) {
            console.error('Error de red al guardar los cambios:', error);
            alert('No se pudo conectar con el servidor para guardar los cambios.');
        }
    });

    cancelarBtn.addEventListener('click', function() {
        // Simplemente recarga los datos originales
        loadUserData();
        alert('Cambios cancelados, los datos originales han sido restaurados.');
        // Limpiar campos de contraseña al cancelar
        document.getElementById('password').value = '';
        document.getElementById('confirmPassword').value = '';
    });

    regresarBtn.addEventListener('click', function() {
        window.location.href = 'menu.html';
    });

    // --- Ejecutar funciones al cargar la página ---
    (async function() {
        const isAuthenticated = await checkAuthentication();
        if (isAuthenticated) {
            await loadUserData(); // Solo cargar datos si está autenticado
        }
    })();
});