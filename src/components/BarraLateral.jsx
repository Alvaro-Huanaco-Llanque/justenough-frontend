import { useNavigate } from 'react-router-dom';
import { obtenerUsuario, cerrarSesion, iniciales } from '../api';

// Opciones del menú. Para agregar, renombrar o reordenar una sección, se cambia solo acá.
const MENU = [
  { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
  { id: 'sugerencias', label: 'Sugerencias', icon: '✨', badge: 3, ruta: '/sugerencias' },
  { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '/ventas' },
  { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '/desechos' },
  { id: 'producido', label: 'Producido / Compras', icon: '📦', ruta: '/producido' },
  { id: 'productos', label: 'Inventario', icon: '⭐', ruta: '/productos' },
  { id: 'catalogo', label: 'Catálogo', icon: '📋', ruta: '/catalogo' },
  { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '/impacto' },
  { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '/calendario' },
  { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '/madurez' },
];

const bgApp = '#FAF9F6';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';
const goldLight = '#F9EBBF';

const tituloSeccion = { fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' };

// Barra lateral compartida por todas las páginas internas.
// seccionActiva: id de la opción del MENU que se resalta (ej: 'ventas').
function BarraLateral({ seccionActiva }) {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const salir = () => { cerrarSesion(); navigate('/'); };

  const estiloItem = (activo) => ({
    padding: '10px 12px', borderRadius: '20px', cursor: 'pointer',
    backgroundColor: activo ? goldLight : 'transparent',
    color: activo ? textDark : textGray,
    fontWeight: activo ? 'bold' : '500',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem'
  });

  return (
    <div style={{ width: '260px', height: '100%', backgroundColor: bgApp, borderRight: `1px solid ${borderLight}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '25px 20px', boxSizing: 'border-box', flexShrink: 0, overflowY: 'auto' }}>
      <div>
        {/* Logo y comercio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ color: goldPrimary, fontSize: '1.8rem', fontWeight: 'bold' }}>(o)</span>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.2' }}>{usuario?.comercio?.nombre ?? 'Mi comercio'}</span>
            <span style={{ fontSize: '0.7rem', color: '#B89732', fontWeight: 'bold', letterSpacing: '0.5px' }}>PLAN BÁSICO</span>
          </div>
        </div>

        {/* Espacio de trabajo */}
        <div style={{ marginBottom: '20px' }}>
          <span style={tituloSeccion}>ESPACIO DE TRABAJO</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {MENU.map((item) => {
              const activo = seccionActiva === item.id;
              return (
                <div key={item.id} onClick={() => navigate(item.ruta)} style={estiloItem(activo)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ opacity: activo ? 1 : 0.6 }}>{item.icon}</span> {item.label}
                  </div>
                  {item.badge && <span style={{ backgroundColor: goldPrimary, color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{item.badge}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Administración (la página de configuración todavía no existe) */}
        <div>
          <span style={tituloSeccion}>ADMINISTRACIÓN</span>
          <div style={{ ...estiloItem(seccionActiva === 'configuracion'), justifyContent: 'flex-start', gap: '12px' }}>
            <span style={{ opacity: 0.6 }}>⚙️</span> Configuración
          </div>
        </div>
      </div>

      {/* Usuario logueado */}
      <div style={{ borderTop: `1px solid ${borderLight}`, paddingTop: '20px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: textDark, fontSize: '0.9rem', flexShrink: 0 }}>{iniciales(usuario?.nombre)}</div>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{usuario?.nombre}</span>
            <span onClick={salir} style={{ fontSize: '0.8rem', color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar sesión</span>
          </div>
        </div>
        <span onClick={salir} title="Cerrar sesión" style={{ color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}>⎋</span>
      </div>
    </div>
  );
}

export default BarraLateral;
