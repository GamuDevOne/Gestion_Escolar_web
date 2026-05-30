document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('../api/auth/login.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Credenciales incorrectas');
            return;
        }

        // Guardar sesión en localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            email,
            rol:          data.rol,
            nombre:       data.nombre,
            id_referencia: data.id_referencia  // teacherId o studentId según el rol
        }));

        // Redirigir según rol
        const routes = {
            admin:      'admin.html',
            profesor:   'profesor.html',
            estudiante: 'estudiante.html'
        };
        window.location.href = routes[data.rol];

    } catch (err) {
        alert('No se pudo conectar con el servidor. Verifica que XAMPP esté corriendo.');
    }
});