import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [seccionActiva, setSeccionActiva] = useState('principal');
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Datos simulados (Mock data) alineados a las capturas
  const resumen = {
    usuario: "Camila",
    fecha: "Viernes, 12 de junio",
    metricas: {
      desperdicio: "91 uds. / $810.000",
      precision: "87%",
      alertas: 4
    },
    sugerenciasHoy: [
      { producto: "Medialuna", stock: "3 uds.", sugerido: "110 uds.", confianza: "Alta" },
      { producto: "Cookie 50g", stock: "8 uds.", sugerido: "75 uds.", confianza: "Alta" },
      { producto: "Muffin", stock: "42 uds.", sugerido: "0 uds.", confianza: "Media" },
      { producto: "Budín", stock: "28 uds.", sugerido: "10 uds.", confianza: "Alta" },
      { producto: "Scon", stock: "11 uds.", sugerido: "25 uds.", confianza: "Baja" }
    ],
    flujoDesperdicios: [
      { dia: 'Jue', producido: 50, desperdiciado: 15 },
      { dia: 'Vie', producido: 45, desperdiciado: 8 },
      { dia: 'Sáb', producido: 75, desperdiciado: 20 },
      { dia: 'Dom', producido: 40, desperdiciado: 5 },
      { dia: 'Lun', producido: 60, desperdiciado: 12 },
      { dia: 'Mar', producido: 80, desperdiciado: 10 },
      { dia: 'Mié', producido: 55, desperdiciado: 8 }
    ],
    notificaciones: [
      { id: 1, tipo: 'Inactividad', mensaje: 'Hace 1 día que no cargás datos', tiempo: 'Hoy, 09:30 · También enviada por email', leida: false },
      { id: 2, tipo: 'Stock bajo', mensaje: 'Medialuna está por debajo del mínimo (3 de 12)', tiempo: 'Hoy, 08:15 · También enviada por email', leida: false },
      { id: 3, tipo: 'Stock bajo', mensaje: 'Harina 000: quedan 28 kg, el mínimo es 30 kg', tiempo: 'Ayer, 18:40 · También enviada por email', leida: false },
      { id: 4, tipo: 'Modelo', mensaje: '¡Budín alcanzó confianza Alta!', tiempo: 'Ayer, 16:20 · También enviada por email', leida: false },
      { id: 5, tipo: 'Stock bajo (Leída)', mensaje: 'Cookie 50g por debajo del mínimo', tiempo: 'Ayer, 11:05 · También enviada por email', leida: true }
    ]
  };

  const getBadgeColor = (confianza) => {
    if (confianza === 'Alta') return { bg: '#E6F4EA', color: '#137333' };
    if (confianza === 'Media') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#FCE8E6', color: '#C5221F' };
  };

  const getNotificacionEstilo = (tipo) => {
    if (tipo === 'Inactividad') return { bg: '#FDF8EC', color: '#B89732', dot: '#D4AF37' };
    if (tipo === 'Stock bajo') return { bg: '#FCE8E6', color: '#C5221F', dot: '#C5221F' };
    if (tipo === 'Modelo') return { bg: '#E6F4EA', color: '#137333', dot: '#137333' };
    return { bg: '#F1F3F4', color: '#888888', dot: '#CCCCCC' }; // Leídas / Grises
  };

  // Estilos globales de paleta (Figma)
  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';
  const goldLight = '#F9EBBF';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <div style={{ 
        width: '260px', 
        height: '100%',
        backgroundColor: bgApp, 
        borderRight: `1px solid ${borderLight}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '25px 20px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div>
          {/* Logo y Comercio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <span style={{ color: goldPrimary, fontSize: '1.8rem', fontWeight: 'bold' }}>(o)</span>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.2' }}>Panadería La Espiga</span>
              <span style={{ fontSize: '0.7rem', color: '#B89732', fontWeight: 'bold', letterSpacing: '0.5px' }}>PLAN BÁSICO</span>
            </div>
          </div>

          {/* Menú - Espacio de Trabajo */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' }}>ESPACIO DE TRABAJO</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
                { id: 'producido', label: 'Producido / Compras', icon: '📦', ruta: '/producido' },
                { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '#' },
                { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '#' },
                { id: 'sugerencias', label: 'Sugerencias', icon: '✨', badge: 3, ruta: '#' },
                { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '#' },
                { id: 'productos', label: 'Productos', icon: '⭐', ruta: '#' },
                { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '#' },
                { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '#' },
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setSeccionActiva(item.id);
                    if (item.ruta !== '#') navigate(item.ruta);
                  }}
                  style={{ 
                    padding: '10px 12px', 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    backgroundColor: seccionActiva === item.id ? goldLight : 'transparent',
                    color: seccionActiva === item.id ? '#1A1A1A' : textGray,
                    fontWeight: seccionActiva === item.id ? 'bold' : '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ opacity: seccionActiva === item.id ? 1 : 0.6 }}>{item.icon}</span> 
                    {item.label}
                  </div>
                  {item.badge && (
                    <span style={{ backgroundColor: goldPrimary, color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Menú - Administración */}
          <div>
            <span style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '10px', paddingLeft: '10px' }}>ADMINISTRACIÓN</span>
            <div 
              onClick={() => setSeccionActiva('configuracion')}
              style={{ 
                padding: '10px 12px', 
                borderRadius: '20px', 
                cursor: 'pointer',
                color: seccionActiva === 'configuracion' ? '#1A1A1A' : textGray,
                fontWeight: seccionActiva === 'configuracion' ? 'bold' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ opacity: 0.6 }}>⚙️</span> Configuración
            </div>
          </div>
        </div>

        {/* Perfil Usuario (Abajo) */}
        <div style={{ borderTop: `1px solid ${borderLight}`, paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1A1A1A', fontSize: '0.9rem' }}>
              CM
            </div>
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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Principal</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{resumen.fecha}</p>
          </div>
          <button 
            onClick={() => setMostrarNotificaciones(true)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}
          >
            🔔
          </button>
        </div>

        {/* Saludo */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Buen día, {resumen.usuario}</h2>
          <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Esto es lo que tenés que producir hoy.</p>
        </div>

        {/* Banner de Alerta */}
        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#B06000', fontSize: '1.2rem' }}>⚠️</span>
            <span style={{ color: '#665324', fontSize: '0.95rem', fontWeight: '500' }}>Falta la carga de ayer (jueves 11). Sin ella la predicción pierde precisión.</span>
          </div>
          <button style={{ backgroundColor: goldLight, color: '#665324', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
            Cargar ahora
          </button>
        </div>

        {/* Tarjetas de Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Desperdicio de la semana</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FCE8E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5221F', fontSize: '0.9rem' }}>⚠</div>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{resumen.metricas.desperdicio}</span>
            <span style={{ fontSize: '0.85rem', color: '#137333', display: 'block', marginTop: '8px', fontWeight: '500' }}>-12% vs. semana anterior</span>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Precisión de la semana</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#137333', fontSize: '0.9rem' }}>◎</div>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{resumen.metricas.precision}</span>
            <span style={{ fontSize: '0.85rem', color: '#137333', display: 'block', marginTop: '8px', fontWeight: '500' }}>+5 pts vs. mes anterior</span>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Alertas sin leer</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF7E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B06000', fontSize: '0.9rem' }}>🔔</div>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{resumen.metricas.alertas}</span>
            <span style={{ fontSize: '0.85rem', color: textGray, display: 'block', marginTop: '8px' }}>Requieren tu atención</span>
          </div>
        </div>

        {/* Tabla: Producción recomendada */}
        <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Producción recomendada para hoy</h3>
          <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Calculada según ventas, stock y comportamiento reciente.</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>STOCK ESTIMADO</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>PRODUCIR HOY</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>CONFIANZA</th>
              </tr>
            </thead>
            <tbody>
              {resumen.sugerenciasHoy.map((item, index) => {
                const badge = getBadgeColor(item.confianza);
                return (
                  <tr key={index} style={{ borderBottom: index === resumen.sugerenciasHoy.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{item.producto}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{item.stock}</td>
                    <td style={{ padding: '20px 0', fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{item.sugerido}</td>
                    <td style={{ padding: '20px 0' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                        {item.confianza}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico: Flujo de desperdicios */}
        <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Flujo de desperdicios</h3>
              <p style={{ color: textGray, fontSize: '0.9rem', margin: '0' }}>Producción y desperdicio de los últimos 7 días</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#F4E3B5', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Producido</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#C99B36', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Desperdiciado</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 20px' }}>
            {resumen.flujoDesperdicios.map((diaInfo, i) => {
              const maxVal = 100; 
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '60px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', width: '100%', justifyContent: 'center' }}>
                    <div title={`Producido: ${diaInfo.producido}`} style={{ width: '28px', height: `${(diaInfo.producido / maxVal) * 100}%`, backgroundColor: '#F4E3B5', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                    <div title={`Desperdiciado: ${diaInfo.desperdiciado}`} style={{ width: '28px', height: `${(diaInfo.desperdiciado / maxVal) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{diaInfo.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ================= PANEL LATERAL DE NOTIFICACIONES (ALERTAS) ================= */}
      {mostrarNotificaciones && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '380px',
          height: '100%',
          backgroundColor: bgCard,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Cabecera del Panel */}
          <div style={{ padding: '30px 25px 20px 25px', borderBottom: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '1.6rem', color: textDark, margin: 0 }}>Alertas</h2>
              <span 
                onClick={() => setMostrarNotificaciones(false)} 
                style={{ fontSize: '1.5rem', cursor: 'pointer', color: textGray }}
              >
                ×
              </span>
            </div>
            <span style={{ color: '#B89732', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
              Marcar todas como leídas
            </span>
            
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 14px', backgroundColor: '#F4D06F', color: textDark, borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Todas</div>
              <div style={{ padding: '6px 14px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, color: textGray, borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Inactividad</div>
              <div style={{ padding: '6px 14px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, color: textGray, borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Stock bajo</div>
              <div style={{ padding: '6px 14px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, color: textGray, borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Modelo</div>
            </div>
          </div>

          {/* Lista de Notificaciones */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {resumen.notificaciones.map((notif) => {
              const estilo = getNotificacionEstilo(notif.leida ? 'Leida' : notif.tipo);
              const isLeida = notif.leida;
              return (
                <div key={notif.id} style={{ 
                  backgroundColor: bgCard, 
                  border: `1px solid ${borderLight}`, 
                  borderRadius: '12px', 
                  padding: '16px',
                  opacity: isLeida ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: estilo.dot }}></div>
                    <span style={{ 
                      backgroundColor: estilo.bg, 
                      color: estilo.color, 
                      padding: '4px 10px', 
                      borderRadius: '15px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold' 
                    }}>
                      {notif.tipo.replace(' (Leída)', '')}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: isLeida ? '500' : 'bold', color: textDark, lineHeight: '1.4' }}>
                    {notif.mensaje}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
                    {notif.tiempo}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;