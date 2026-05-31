/**
 * api.js — Helper de fetch autenticado
 * Centraliza la URL base, el token y el manejo de 401/403.
 * Todos los módulos (admin, profesor, estudiante) lo usan.
 */

const API_URL = 'http://localhost/gestion_escolar/api';

/** Obtiene el token almacenado en sesión local. */
function getToken() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user?.token ?? null;
}

/**
 * Wrapper de fetch que inyecta automáticamente el Bearer token.
 * Si recibe 401, limpia la sesión y redirige al login.
 * Si recibe 403, lanza un error descriptivo sin redirigir.
 *
 * @param {string} endpoint  - Ruta relativa a API_URL (ej: '/estudiantes/')
 * @param {object} options   - Opciones normales de fetch (method, body, etc.)
 * @returns {Promise<Response>}
 */
async function apiFetch(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
    }

    if (response.status === 403) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Acción no permitida');
    }

    return response;
}