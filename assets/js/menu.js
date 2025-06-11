document.addEventListener('DOMContentLoaded', function() {
    // 1. Configurar menú desplegable
    const menuButton = document.getElementById('menuButton');
    const userMenu = document.getElementById('userMenu');

    if (menuButton && userMenu) {
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function() {
            if (userMenu.classList.contains('show')) {
                userMenu.classList.remove('show');
            }
        });
    }

    // 2. Configurar iniciales del usuario
    const setupUserInitials = function() {
        const avatarInitials = document.getElementById('avatarInitials');
        const currentUser = localStorage.getItem('currentUser') || 'Usuario';

        // Obtener iniciales (primera letra del nombre y primera del apellido)
        const names = currentUser.split(' ');
        let initials = '';

        if (names.length > 1) {
            initials = names[0][0] + names[names.length - 1][0];
        } else if (currentUser.length > 0) {
            initials = currentUser.substring(0, 2);
        }

        avatarInitials.textContent = initials.toUpperCase();
    };

    // 3. Configurar cierre de sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Inicializar todo
    setupUserInitials();
});