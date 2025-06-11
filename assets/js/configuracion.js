document.addEventListener('DOMContentLoaded', function() {
    const guardarBtn = document.getElementById('guardarBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    const regresarBtn = document.getElementById('regresarBtn');

    guardarBtn.addEventListener('click', function() {
        // Aquí puedes agregar la lógica para guardar los cambios
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const telefono = document.getElementById('telefono').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const idioma = document.getElementById('idioma').value;
        const tema = document.getElementById('tema').value;

        // Validar contraseñas
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        // Aquí puedes enviar los datos al servidor o guardarlos localmente
        console.log('Datos guardados:', { nombre, email, telefono, password, idioma, tema });
        alert('Cambios guardados correctamente.');
    });

    cancelarBtn.addEventListener('click', function() {
        // Aquí puedes agregar la lógica para cancelar los cambios
        alert('Cambios cancelados.');
    });

    regresarBtn.addEventListener('click', function() {
        // Redirige al usuario a la página de menú
        window.location.href = 'menu.html';
    });
});