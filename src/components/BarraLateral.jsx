import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerUsuario, cerrarSesion, iniciales } from '../api';
import { Logo } from './Marca';

// Opciones del menú. Para agregar, renombrar o reordenar una sección, se cambia solo acá.
const MENU = [
  { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
  { id: 'productos', label: 'Inventario', icon: '⭐', ruta: '/productos' },
  { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '/ventas' },
  { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '/desechos' },
  { id: 'producido', label: 'Ingresos', icon: '📦', ruta: '/producido' },
  { id: 'catalogo', label: 'Catálogo', icon: '📋', ruta: '/catalogo' },
  { id: 'sugerencias', label: 'Sugerencias', icon: '✨', ruta: '/sugerencias' },
  { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '/calendario' },
  { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '/impacto' },
  { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '/madurez' },
];

const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldLight = '#F9EBBF';

const tituloSeccion = { fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' };

// Barra lateral compartida por todas las páginas internas.
// seccionActiva: id de la opción del MENU que se resalta (ej: 'ventas').
// En pantallas angostas queda oculta y se abre con el botón de menú.
function BarraLateral({ seccionActiva }) {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const salir = () => { cerrarSesion(); navigate('/'); };
  const [abierta, setAbierta] = useState(false);

  const ir = (ruta) => { setAbierta(false); navigate(ruta); };

  const estiloItem = (activo) => ({
    padding: '10px 12px', borderRadius: '20px', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit',
    backgroundColor: activo ? goldLight : 'transparent',
    color: activo ? textDark : textGray,
    fontWeight: activo ? 'bold' : '500',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem'
  });

  return (
    <>
      <button className="lateral-boton no-imprimir" onClick={() => setAbierta(true)} aria-label="Abrir menú">☰</button>
      <div className={`lateral-fondo ${abierta ? 'abierto' : ''}`} onClick={() => setAbierta(false)} />
      <nav className={`lateral no-imprimir ${abierta ? 'abierto' : ''}`} aria-label="Menú principal">
        <div>
          {/* Logo y comercio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Logo tamano={42} />
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
                  <button key={item.id} onClick={() => ir(item.ruta)} aria-current={activo ? 'page' : undefined} style={estiloItem(activo)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ opacity: activo ? 1 : 0.6 }}>{item.icon}</span> {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Administración */}
          <div>
            <span style={tituloSeccion}>ADMINISTRACIÓN</span>
            <button onClick={() => ir('/configuracion')} aria-current={seccionActiva === 'configuracion' ? 'page' : undefined} style={{ ...estiloItem(seccionActiva === 'configuracion'), justifyContent: 'flex-start', gap: '12px' }}>
              <span style={{ opacity: seccionActiva === 'configuracion' ? 1 : 0.6 }}>⚙️</span> Configuración
            </button>
          </div>
        </div>

        {/* Usuario logueado */}
        <div style={{ borderTop: `1px solid ${borderLight}`, paddingTop: '20px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: textDark, fontSize: '0.9rem', flexShrink: 0 }}>{iniciales(usuario?.nombre)}</div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{usuario?.nombre}</span>
            <button onClick={salir} style={{ padding: 0, border: 'none', background: 'none', fontSize: '0.8rem', color: '#B89732', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default BarraLateral;
