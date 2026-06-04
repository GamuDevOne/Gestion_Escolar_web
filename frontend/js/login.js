document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });

        const json = await response.json();

        if (!response.ok) {
            alert(json.error || 'Credenciales incorrectas');
            return;
        }

        // Login devuelve { success, data: { token, rol, nombre, id_referencia } }
        const data = json.data;

        localStorage.setItem('currentUser', JSON.stringify({
            email,
            token:         data.token,
            rol:           data.rol,
            nombre:        data.nombre,
            id_referencia: data.id_referencia,
            password_cambiada:  data.password_cambiada
        }));

        // Si no ha cambiado la contraseña, redirigir al cambio
        if (!data.password_cambiada) {
            window.location.href = 'cambiar_password.html';
            return;
        }
        
        const routes = { admin: 'admin.html', profesor: 'profesor.html', estudiante: 'estudiante.html' };
        window.location.href = routes[data.rol];

    } catch (err) {
        alert('No se pudo conectar con el servidor. Verifica que XAMPP esté corriendo.');
    }
});