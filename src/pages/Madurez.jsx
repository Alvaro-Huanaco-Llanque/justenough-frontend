import { useNavigate } from 'react-router-dom';

function Madurez() {
  const navigate = useNavigate();
  const seccionActiva = 'madurez';

  // Datos simulados de madurez del modelo
  const productosMadurez = [
    { id: 1, nombre: "Medialuna", dias: 72, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 2, nombre: "Cookie 50g", dias: 64, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 3, nombre: "Budín", dias: 61, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 4, nombre: "Muffin", dias: 45, estado: "Media", mensaje: "Faltan 15 días para Alta" },
    { id: 5, nombre: "Scon", dias: 12, estado: "Baja", mensaje: "Faltan 18 días para Media" }
  ];

  // Menú con todas las rutas actualizadas
  const menuSidebar = [
    { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
    { id: 'producido', label: 'Producido / Compras', icon: '📦', ruta: '/producido' },
    { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '/ventas' },
    { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '/desechos' },
    { id: 'sugerencias', label: 'Sugerencias', icon: '✨', badge: 3, ruta: '/sugerencias' },
    { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '/impacto' },
    { id: 'productos', label: 'Productos', icon: '⭐', ruta: '/productos' },
    { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '/calendario' },
    { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '/madurez' },
  ];


  const getBadgeColor = (estado) => {
    if (estado === 'Alta') return { bg: '#E6F4EA', color: '#137333' };
    if (estado === 'Media') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#F1F3F4', color: '#666666' }; // Baja (Gris)
  };

  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';
  const goldLight = '#F9EBBF';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* ================= BARRA LATERAL ================= */}
      <div style={{ width: '260px', height: '100%', backgroundColor: bgApp, borderRight: `1px solid ${borderLight}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '25px 20px', boxSizing: 'border-box', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <span style={{ color: goldPrimary, fontSize: '1.8rem', fontWeight: 'bold' }}>(o)</span>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.2' }}>Panadería La Espiga</span>
              <span style={{ fontSize: '0.7rem', color: '#B89732', fontWeight: 'bold', letterSpacing: '0.5px' }}>PLAN BÁSICO</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' }}>ESPACIO DE TRABAJO</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuSidebar.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => item.ruta !== '#' && navigate(item.ruta)}
                  style={{ 
                    padding: '10px 12px', borderRadius: '20px', cursor: 'pointer',
                    backgroundColor: seccionActiva === item.id ? goldLight : 'transparent',
                    color: seccionActiva === item.id ? '#1A1A1A' : textGray,
                    fontWeight: seccionActiva === item.id ? 'bold' : '500',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ opacity: seccionActiva === item.id ? 1 : 0.6 }}>{item.icon}</span> {item.label}
                  </div>
                  {item.badge && <span style={{ backgroundColor: goldPrimary, color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{item.badge}</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' }}>ADMINISTRACIÓN</span>
            <div style={{ padding: '10px 12px', borderRadius: '20px', cursor: 'pointer', color: textGray, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
              <span style={{ opacity: 0.6 }}>⚙️</span> Configuración
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${borderLight}`, paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1A1A1A', fontSize: '0.9rem' }}>CM</div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark, display: 'block' }}>Camila Méndez</span>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Dueña</span>
            </div>
          </div>
          <span style={{ color: '#888', fontSize: '1.2rem' }}>›</span>
        </div>
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Madurez</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título de Sección */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Madurez del modelo</h2>
          <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Cuantos más días cargues, más precisas son las sugerencias.</p>
        </div>

        {/* Grilla de Tarjetas de Madurez */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {productosMadurez.map((prod) => {
            const badge = getBadgeColor(prod.estado);
            // Calculamos el progreso sobre 60 días máximo
            const progresoPorcentaje = Math.min((prod.dias / 60) * 100, 100);

            return (
              <div key={prod.id} style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Título y Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>{prod.nombre}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                    {prod.estado}
                  </span>
                </div>

                {/* Número de Días */}
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>{prod.dias}</span>
                  <span style={{ fontSize: '0.9rem', color: textGray, marginLeft: '5px' }}>días de datos</span>
                </div>

                {/* Barra de Progreso */}
                <div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${progresoPorcentaje}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: textGray, fontWeight: '500' }}>{prod.mensaje}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Leyenda Footer */}
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '50px', padding: '15px 30px', textAlign: 'center', color: textGray, fontSize: '0.85rem' }}>
          Baja &lt; 30 días &nbsp;&nbsp;·&nbsp;&nbsp; Media 30–59 &nbsp;&nbsp;·&nbsp;&nbsp; Alta 60+
        </div>

      </div>
    </div>
  );
}

export default Madurez;