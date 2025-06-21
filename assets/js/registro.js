// assets/js/registro.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Elementos de los iconos de mostrar/ocultar contraseña
    const togglePasswordIcon = document.getElementById('togglePassword');
    const toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPassword');

    // Elementos para mensajes de error por campo
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Elemento para mensajes generales del formulario (éxito/error de servidor)
    const formMessageElement = document.getElementById('formMessage');

    // --- Funcionalidad para mostrar/ocultar contraseña (para ambos campos) ---
    function setupPasswordToggle(toggleIcon, passwordField) {
        toggleIcon.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash'); // Cambia el icono de ojo abierto a ojo tachado
        });
    }

    setupPasswordToggle(togglePasswordIcon, passwordInput);
    setupPasswordToggle(toggleConfirmPasswordIcon, confirmPasswordInput);

    // --- Función para mostrar mensajes de error específicos por campo ---
    function showFieldError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    // --- Función para limpiar mensajes de error específicos por campo ---
    function clearFieldError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    // --- Función para limpiar todos los mensajes de error de campo ---
    function clearAllFieldErrors() {
        clearFieldError(usernameError);
        clearFieldError(emailError);
        clearFieldError(passwordError);
        clearFieldError(confirmPasswordError);
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
            }, 3000);
        }
    }

    // --- Manejar el envío del formulario de registro ---
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllFieldErrors(); // Limpiar errores previos de campos
        showAlert('', ''); // Limpiar mensaje general previo

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let isValid = true;

        // Validaciones del lado del cliente
        if (!username) {
            showFieldError(usernameError, 'El nombre de usuario es requerido.');
            isValid = false;
        }
        // Puedes añadir validaciones de longitud mínima, caracteres, etc.

        if (!email) {
            showFieldError(emailError, 'El correo electrónico es requerido.');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) { // Regex simple para email
            showFieldError(emailError, 'Ingrese un correo electrónico válido.');
            isValid = false;
        }

        if (!password) {
            showFieldError(passwordError, 'La contraseña es requerida.');
            isValid = false;
        } else if (password.length < 6) { // Ejemplo: mínimo 6 caracteres
            showFieldError(passwordError, 'La contraseña debe tener al menos 6 caracteres.');
            isValid = false;
        }

        if (!confirmPassword) {
            showFieldError(confirmPasswordError, 'Confirme su contraseña.');
            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError(confirmPasswordError, 'Las contraseñas no coinciden.');
            isValid = false;
        }

        if (!isValid) {
            showAlert('Por favor, corrija los errores en el formulario.', 'error');
            return;
        }

        // Si todas las validaciones pasan, enviar al backend
        showAlert('Registrando usuario...', 'loading');

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) { // Éxito (status 200-299)
                showAlert(data.message || 'Registro exitoso. Redirigiendo al login...', 'success');
                // Redirigir al usuario a la página de login después de un registro exitoso
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500); // Dar un tiempo para que el usuario lea el mensaje
            } else {
                // Errores del servidor (ej. usuario/email ya existen, validación de backend)
                const errorMessage = data.message || 'Error al registrar usuario. Intente de nuevo.';
                showAlert(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            showAlert('No se pudo conectar con el servidor. Intente más tarde.', 'error');
        }
    });
});