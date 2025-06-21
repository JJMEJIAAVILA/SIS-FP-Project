// assets/js/menu.js
document.addEventListener('DOMContentLoaded', function() {
    // --- 1. Autenticación y Redirección ---
    const checkAuthentication = async function() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Si no hay token, redirigir al login y detener la ejecución
            window.location.href = 'login.html';
            return false;
        }

        // Si ya hay un username en localStorage, lo usamos y no hacemos otra llamada
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            updateUserDisplay(storedUsername);
            return true;
        }

        // Si hay token pero no username, intentar obtener el username del backend (ruta protegida)
        try {
            const response = await fetch('http://localhost:3000/api/protected', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.user && data.user.username) {
                localStorage.setItem('username', data.user.username); // Guardar para futuras cargas
                updateUserDisplay(data.user.username);
            } else {
                // Si la respuesta no es OK o no hay username, el token podría ser inválido/expirado
                console.error('Error al obtener datos del usuario:', data.message || 'Token inválido.');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = 'login.html';
                return false;
            }
        } catch (error) {
            console.error('Error de red al verificar el token o obtener usuario:', error);
            // Posiblemente un error de red o servidor, redirigir por seguridad
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    };

    // --- Función para actualizar el display del usuario ---
    const updateUserDisplay = function(username) {
        const avatarInitials = document.getElementById('avatarInitials');
        if (avatarInitials) {
            // Obtener iniciales (primera letra del nombre y primera del apellido)
            const names = username.split(' ');
            let initials = '';

            if (names.length > 1) {
                initials = names[0][0] + names[names.length - 1][0];
            } else if (username.length > 0) {
                initials = username.substring(0, 2); // Si es una sola palabra, toma las primeras 2 letras
            } else {
                initials = 'US'; // Valor por defecto si no hay nombre
            }
            avatarInitials.textContent = initials.toUpperCase();
        }

        const welcomeTitle = document.querySelector('.main-container h1');
        if (welcomeTitle) {
            // Reemplazar el "Bienvenido, Usuario" con el nombre real
            welcomeTitle.innerHTML = `Bienvenido, <span id="usernameDisplay">${username}</span>`;
            // Asegurarse de que el color del nombre de usuario en el título siga siendo el azul principal
            const usernameSpan = document.getElementById('usernameDisplay');
            if (usernameSpan) {
                usernameSpan.style.color = '#00a8e8'; /* Color azul principal */
            }
        }
    };


    // --- 2. Configurar menú desplegable (tu código original) ---
    const menuButton = document.getElementById('menuButton');
    const userMenu = document.getElementById('userMenu');

    if (menuButton && userMenu) {
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('show');
            menuButton.classList.toggle('open'); // Opcional: para animar el icono de hamburguesa
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (userMenu.classList.contains('show') && !userMenu.contains(e.target) && e.target !== menuButton) {
                userMenu.classList.remove('show');
                menuButton.classList.remove('open'); // Opcional: para animar el icono de hamburguesa
            }
        });
    }

    // --- 3. Configurar cierre de sesión (actualizado para usar 'token' y 'username') ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token'); // Eliminar el token JWT
            localStorage.removeItem('username'); // Eliminar el username
            window.location.href = 'login.html'; // Redirigir al login
        });
    }

    // --- Inicializar todo al cargar la página ---
    (async function() { // Usamos una IIFE asíncrona para poder usar await
        const isAuthenticated = await checkAuthentication();
        if (isAuthenticated) {
            // Si el usuario está autenticado, podemos proceder con la configuración de la UI
            // updateUserDisplay() ya es llamado dentro de checkAuthentication
            // setupUserInitials(); // Ya no es necesario llamarlo aquí si updateUserDisplay hace el trabajo
        }
    })();
});