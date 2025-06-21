// assets/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usuarioInput = document.getElementById('usuario');
    const contrasenaInput = document.getElementById('contrasena');
    const formMessageElement = document.getElementById('formMessage'); // Para mensajes generales
    const togglePasswordIcon = document.getElementById('togglePassword'); // Icono del ojo

    // --- Funcionalidad para mostrar/ocultar contraseña ---
    if (togglePasswordIcon && contrasenaInput) {
        togglePasswordIcon.addEventListener('click', function() {
            const type = contrasenaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            contrasenaInput.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash'); // Cambia el icono de ojo abierto a ojo tachado
        });
    }

    // --- Función para mostrar alertas/feedback generales (éxito, error, carga) ---
    function showAlert(message, type) {
        if (!formMessageElement) {
            console.error("Elemento 'formMessage' no encontrado en el HTML. No se pueden mostrar alertas.");
            return;
        }

        formMessageElement.className = 'alert-message'; // Resetear clases
        formMessageElement.textContent = '';
        formMessageElement.style.display = 'none';

        formMessageElement.textContent = message;
        formMessageElement.classList.add(`alert-${type}`);
        formMessageElement.style.display = 'block';

        if (type !== 'loading') {
            setTimeout(() => {
                formMessageElement.style.display = 'none';
                formMessageElement.textContent = '';
                formMessageElement.className = 'alert-message';
            }, 3000); // Ocultar después de 3 segundos
        }
    }

    // --- Manejar el envío del formulario de login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Evitar el envío predeterminado del formulario

            showAlert('', ''); // Limpiar mensaje previo

            const username = usuarioInput.value.trim();
            const password = contrasenaInput.value.trim();

            if (!username || !password) {
                showAlert('Por favor, ingrese su usuario y contraseña.', 'error');
                return;
            }

            showAlert('Iniciando sesión...', 'loading');

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) { // Status 200-299 (Login exitoso)
                    showAlert(data.message || 'Inicio de sesión exitoso.', 'success');
                    // Almacenar el token JWT. localStorage es persistente.
                    localStorage.setItem('token', data.token);
                    // Opcional: almacenar username si lo necesitas más tarde
                    // localStorage.setItem('username', username);

                    // Redirigir a la página de éxito o dashboard
                    setTimeout(() => {
                        window.location.href = 'inicio_sesion_exitoso.html'; // O la página que desees, por ejemplo 'menu.html'
                    }, 1500); // Dar un tiempo para que el usuario lea el mensaje
                } else { // Errores del servidor (ej. 401 Unauthorized, 400 Bad Request)
                    const errorMessage = data.message || 'Error al iniciar sesión. Intente de nuevo.';
                    showAlert(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error de red o del servidor:', error);
                showAlert('No se pudo conectar con el servidor. Intente más tarde.', 'error');
            }
        });
    } else {
        console.error("Elemento 'loginForm' no encontrado en el HTML.");
    }
});