// URL del backend. Se puede cambiar con VITE_API_URL en un archivo .env del frontend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'jwt_token';
const USUARIO_KEY = 'usuario';

// ================= SESIÓN =================
export function guardarSesion({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Usuario logueado: { id, nombre, email, rol, comercio: { id, nombre, rubro } }
export function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem(USUARIO_KEY));
  } catch {
    return null;
  }
}

export function haySesion() {
  return Boolean(obtenerToken());
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

// "Camila Méndez" -> "CM"
export function iniciales(nombre = '') {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

// ================= PEDIDOS AL BACKEND =================
// Igual que fetch, pero agrega la URL base y el token. Si el backend responde 401
// (token vencido o inválido) cierra la sesión y vuelve al login.
export async function apiFetch(ruta, opciones = {}) {
  const headers = { ...(opciones.headers || {}) };
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opciones.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });

  if (res.status === 401 && token) {
    cerrarSesion();
    window.location.href = '/';
  }
  return res;
}

// Lee el mensaje de error que manda el backend ({ message }) sin romperse si no es JSON
export async function leerMensajeError(res, porDefecto = 'Ocurrió un error inesperado.') {
  try {
    const data = await res.json();
    return data.message || porDefecto;
  } catch {
    return porDefecto;
  }
}
