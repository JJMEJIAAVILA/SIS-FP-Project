// assets/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('contrasena');
    const createAccountLink = document.querySelector('.btn-secondary'); // Selector para el botón "Crear cuenta"
    const forgotPasswordLink = document.querySelector('.forgot-password'); // Selector para "Olvidaste la contraseña"

    // *** CAMBIOS AÑADIDOS: Elemento para mostrar mensajes de error/éxito ***
    // Asegúrate de que este elemento exista en tu login.html,
    // puedes añadirlo, por ejemplo, justo antes del cierre del <form>:
    // <div id="formMessage" class="alert-message"></div>
    const formMessageElement = document.getElementById('formMessage'); // Necesitamos este elemento en el HTML

    // Mostrar/ocultar contraseña
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Manejar el envío del formulario de login
    loginForm.addEventListener('submit', async function(e) { // Marcamos la función como 'async'
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const contrasena = passwordInput.value.trim();

        // Validación básica
        if (!usuario || !contrasena) {
            showAlert('Por favor, complete todos los campos.', 'error');
            return;
        }

        // Llamar a la función de autenticación real
        await authenticateUser(usuario, contrasena);
    });

    // *** NUEVA FUNCIONALIDAD: Redirigir para crear cuenta ***
    if (createAccountLink) {
        createAccountLink.addEventListener('click', function(e) {
            e.preventDefault(); // Evita el comportamiento predeterminado del enlace
            window.location.href = 'registro_general.html'; // Redirige a la página de registro
        });
    }

    // *** FUNCIONALIDAD FUTURA: Olvidaste la contraseña ***
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAlert('Funcionalidad de recuperación de contraseña no implementada aún.', 'info');
            // window.location.href = 'recuperar_contrasena.html'; // Descomentar cuando tengas la página
        });
    }

    // *** CAMBIO CRÍTICO: Función para autenticar usuario con el backend real ***
    async function authenticateUser(username, password) {
        showAlert('Verificando credenciales...', 'loading');

        try {
            const response = await fetch('http://localhost:3000/api/login', { // Asegúrate que esta URL sea correcta para tu backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json(); // Parsea la respuesta JSON del backend

            if (response.ok) { // Si el status de la respuesta es 200-299 (éxito)
                // Almacenar el token JWT de forma segura
                // Siempre es buena práctica prefijar claves de localStorage para evitar colisiones
                localStorage.setItem('sis_fp_jwt_token', data.token);

                // Opcional: Almacenar el nombre de usuario (si lo necesitas en claro en el frontend)
                localStorage.setItem('sis_fp_current_user', username);

                showAlert('Inicio de sesión exitoso.', 'success');

                // Redirigir a la página principal después de un pequeño retraso
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; // O la página principal de tu aplicación
                }, 800); // Pequeño retraso para que el usuario vea el mensaje de éxito

            } else {
                // El backend devolvió un error (ej. 401 Unauthorized, 400 Bad Request)
                const errorMessage = data.message || 'Error desconocido al iniciar sesión.';
                showAlert(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showAlert('No se pudo conectar con el servidor. Intente más tarde.', 'error');
        }
    }

    // Función para mostrar alertas/feedback (modificada para usar formMessageElement)
    function showAlert(message, type) {
        // Si el elemento de mensaje no existe, no hacemos nada (o logeamos un error)
        if (!formMessageElement) {
            console.error("Elemento 'formMessage' no encontrado en el HTML. No se pueden mostrar alertas.");
            return;
        }

        // Limpiar clases y texto anteriores
        formMessageElement.className = 'alert-message'; // Reiniciar clases
        formMessageElement.textContent = '';
        formMessageElement.style.display = 'none'; // Ocultar por defecto

        formMessageElement.textContent = message;
        formMessageElement.classList.add(`alert-${type}`);
        formMessageElement.style.display = 'block'; // Mostrar el mensaje

        // Eliminar después de 3 segundos (excepto para loading)
        if (type !== 'loading') {
            setTimeout(() => {
                formMessageElement.style.display = 'none'; // Ocultar el mensaje
                formMessageElement.textContent = ''; // Limpiar el texto
                formMessageElement.className = 'alert-message'; // Resetear clases
            }, 3000);
        }
    }
});