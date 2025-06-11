document.addEventListener('DOMContentLoaded', function() {
   const loginForm = document.getElementById('loginForm');
   const togglePassword = document.getElementById('togglePassword');
   const passwordInput = document.getElementById('contrasena');
   
   // Mostrar/ocultar contraseña
   togglePassword.addEventListener('click', function() {
       const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
       passwordInput.setAttribute('type', type);
       this.classList.toggle('fa-eye-slash');
   });
   
   // Manejar el envío del formulario
   loginForm.addEventListener('submit', function(e) {
       e.preventDefault();
       
       const usuario = document.getElementById('usuario').value.trim();
       const contrasena = passwordInput.value.trim();
       
       // Validación básica
       if (!usuario || !contrasena) {
           showAlert('Por favor, complete todos los campos', 'error');
           return;
       }
       
       // Simular autenticación (en producción, esto sería una petición al servidor)
       authenticateUser(usuario, contrasena);
   });
   
   // Función para autenticar usuario
   function authenticateUser(username, password) {
       // Aquí normalmente harías una petición al servidor
       // Para este ejemplo, simulamos un retraso de red
       showAlert('Verificando credenciales...', 'loading');
       
       setTimeout(() => {
           // Simulamos credenciales válidas (en producción, esto lo verificaría el backend)
           if (username && password) {
               // Guardar usuario en localStorage (simulación)
               localStorage.setItem('currentUser', username);
               
               // Redirigir a la página de inicio de sesión exitoso
               window.location.href = 'inicio_sesion_exitoso.html';
           } else {
               showAlert('Credenciales incorrectas. Intente nuevamente.', 'error');
           }
       }, 1500);
   }
   
   // Función para mostrar alertas/feedback
   function showAlert(message, type) {
       // Eliminar alertas previas si existen
       const existingAlert = document.querySelector('.alert-message');
       if (existingAlert) {
           existingAlert.remove();
       }
       
       const alertDiv = document.createElement('div');
       alertDiv.className = `alert-message alert-${type}`;
       alertDiv.textContent = message;
       
       // Insertar después del formulario
       loginForm.appendChild(alertDiv);
       
       // Eliminar después de 3 segundos (excepto para loading)
       if (type !== 'loading') {
           setTimeout(() => {
               alertDiv.remove();
           }, 3000);
       }
   }
});