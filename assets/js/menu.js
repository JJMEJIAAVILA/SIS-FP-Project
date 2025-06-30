// assets/js/menu.js - Lógica del menú principal

document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos de la UI ---
    const welcomeTitle = document.getElementById('welcomeTitle'); // Título principal SIS-FP
    const avatarInitials = document.getElementById('avatarInitials'); // Iniciales del avatar
    const logoutBtn = document.getElementById('logoutBtn'); // Botón de cerrar sesión
    const adminUsersCard = document.getElementById('adminUsersCard'); // La nueva tarjeta de admin en HTML

    // Dropdown del usuario (tu código original)
    const menuButton = document.getElementById('menuButton');
    const userMenu = document.getElementById('userMenu');

    // --- Obtener datos del usuario desde localStorage ---
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role'); // ¡OBTENER EL ROL!

    // --- Lógica de Autenticación y Visualización ---
    if (!token || !username || !role) {
        // Si falta cualquier dato esencial, redirigir al login
        console.warn('Faltan datos de autenticación (token, username o role). Redirigiendo a login.');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
        return; // Detener la ejecución
    }

    // Actualizar el avatar con las iniciales
    if (avatarInitials) {
        const names = username.split(' ');
        let initials = '';
        if (names.length > 1) {
            initials = names[0][0] + names[names.length - 1][0];
        } else if (username.length > 0) {
            initials = username.substring(0, 2);
        } else {
            initials = 'US';
        }
        avatarInitials.textContent = initials.toUpperCase();
    }

    // Mostrar/Ocultar la tarjeta de administración según el rol
    if (adminUsersCard) {
        if (role === 'admin') {
            adminUsersCard.classList.remove('hidden'); // Mostrar si es admin
        } else {
            adminUsersCard.classList.add('hidden'); // Asegurarse de que esté oculto si no es admin
        }
    }

    // --- Configurar menú desplegable (tu código original) ---
    if (menuButton && userMenu) {
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('show');
            menuButton.classList.toggle('open');
        });

        document.addEventListener('click', function(e) {
            if (userMenu.classList.contains('show') && !userMenu.contains(e.target) && e.target !== menuButton) {
                userMenu.classList.remove('show');
                menuButton.classList.remove('open');
            }
        });
    }

    // --- Configurar cierre de sesión ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role'); // Eliminar el rol al cerrar sesión
            window.location.href = 'login.html';
        });
    }
});