// URL del backend. Se puede cambiar con VITE_API_URL en un archivo .env del frontend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'jwt_token';
const USUARIO_KEY = 'usuario';

// Se dispara cuando cambió algo en el servidor: la campana se actualiza sola
export const EVENTO_DATOS_CAMBIARON = 'je:datos-cambiaron';

export function avisarDatosCambiaron() {
  window.dispatchEvent(new Event(EVENTO_DATOS_CAMBIARON));
}

// ================= SESIÓN =================
export function guardarSesion({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

// Al cambiar la contraseña las sesiones anteriores dejan de valer: esta sigue con el token nuevo
export function actualizarToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
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

// Después de editar la cuenta en Configuración, para que la barra lateral muestre los datos nuevos
export function actualizarUsuarioGuardado(usuario) {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
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
// "sinRefrescar": para cambiar la contraseña o dar de baja la cuenta, donde el token actual deja de valer
// y refrescar la pantalla con él cerraría la sesión.
export async function apiFetch(ruta, { sinRefrescar = false, ...opciones } = {}) {
  const headers = { ...(opciones.headers || {}) };
  const token = obtenerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opciones.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });

  if (res.status === 401 && token) {
    cerrarSesion();
    window.location.href = '/';
  }
  // Toda escritura que salió bien puede cambiar alertas o pendientes
  if (res.ok && !sinRefrescar && opciones.method && opciones.method !== 'GET') avisarDatosCambiaron();
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

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
