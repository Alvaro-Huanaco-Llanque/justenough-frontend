import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Sugerencias() {
  const navigate = useNavigate();
  const seccionActiva = 'sugerencias';

  // Datos simulados de la tabla semanal
  const [sugerencias, setSugerencias] = useState([
    { id: 1, nombre: "Medialuna", lun: 110, mar: 105, mie: 115, jue: 120, vie: 140, sab: 180, dom: 160, confianza: "Alta", diaAjustado: "sab" },
    { id: 2, nombre: "Cookie 50g", lun: 75, mar: 70, mie: 80, jue: 75, vie: 90, sab: 110, dom: 95, confianza: "Alta", diaAjustado: null },
    { id: 3, nombre: "Muffin", lun: 35, mar: 30, mie: 40, jue: 35, vie: 50, sab: 65, dom: 55, confianza: "Media", diaAjustado: null },
    { id: 4, nombre: "Budín", lun: 10, mar: 8, mie: 12, jue: 10, vie: 16, sab: 22, dom: 18, confianza: "Alta", diaAjustado: null },
    { id: 5, nombre: "Scon", lun: 25, mar: 20, mie: 24, jue: 22, vie: 30, sab: 42, dom: 35, confianza: "Baja", diaAjustado: null }
  ]);

  // Estado del Modal de Ajuste
  const [modal, setModal] = useState({
    abierto: false,
    producto: null,
    cantidadOriginal: '',
    nuevaCantidad: '',
    motivo: 'Evento',
    comentario: ''
  });

  const abrirModalAjuste = (prod) => {
    // Por defecto, abrimos el modal simulando el ajuste del sábado para replicar el mockup
    setModal({
      abierto: true,
      producto: prod,
      cantidadOriginal: `${prod.sab} uds.`,
      nuevaCantidad: '220',
      motivo: 'Evento',
      comentario: 'Feria en la plaza del barrio'
    });
  };

  const cerrarModal = () => {
    setModal({ ...modal, abierto: false });
  };

  const guardarAjuste = () => {
    // Aquí actualizarías el estado con la nueva cantidad (ej: modificando el sábado)
    const nuevasSugerencias = sugerencias.map(p => {
      if (p.id === modal.producto.id) {
        return { ...p, sab: modal.nuevaCantidad, diaAjustado: 'sab' };
      }
      return p;
    });
    setSugerencias(nuevasSugerencias);
    cerrarModal();
  };

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



  const getBadgeColor = (confianza) => {
    if (confianza === 'Alta') return { bg: '#E6F4EA', color: '#137333' };
    if (confianza === 'Media') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#FCE8E6', color: '#C5221F' };
  };

  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';
  const goldLight = '#F9EBBF';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Sugerencias</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título de la Semana y Botón General */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Sugerencia semanal · 15–21 jun</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Lun 15 – Dom 21 jun · Revisá y aceptá el plan sugerido.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🍪
            </div>
            <button style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
              Aceptar todas
            </button>
          </div>
        </div>

        {/* Tabla de Sugerencias */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>LUN</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MAR</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MIÉ</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>JUE</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>VIE</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>SÁB</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>DOM</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>CONFIANZA</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {sugerencias.map((prod, index) => {
                const badge = getBadgeColor(prod.confianza);
                return (
                  <tr key={prod.id} style={{ borderBottom: index === sugerencias.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '15px 20px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>
                      {prod.nombre}
                    </td>
                    {['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'].map(dia => (
                      <td key={dia} style={{ padding: '15px 10px' }}>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          border: prod.diaAjustado === dia ? `2px solid #F4D06F` : `1px solid ${borderLight}`,
                          backgroundColor: prod.diaAjustado === dia ? '#FDF8EC' : bgCard,
                          color: textDark, 
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          position: 'relative'
                        }}>
                          {prod[dia]}
                          {prod.diaAjustado === dia && <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '0.7rem' }}>✏️</span>}
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                        {prod.confianza}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button style={{ padding: '6px 12px', backgroundColor: '#FDF8EC', color: '#B89732', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Aceptar
                        </button>
                        <button 
                          onClick={() => abrirModalAjuste(prod)}
                          style={{ padding: '6px 12px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Ajustar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div style={{ padding: '15px 20px', borderTop: `1px solid ${borderLight}`, backgroundColor: bgApp, fontSize: '0.85rem', color: textGray, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> La confianza depende de los días de historial de cada producto. <span style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Ver Madurez →</span>
          </div>
        </div>

      </div>

      {/* ================= MODAL DE AJUSTE ================= */}
      {modal.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '450px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Ajustar {modal.producto.nombre} · Sábado 20 jun</h3>
                <p style={{ color: textGray, margin: 0, fontSize: '0.85rem' }}>Modificá la recomendación para este día.</p>
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Cantidad sugerida</label>
              <input type="text" value={modal.cantidadOriginal} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#F5F5F5', color: textGray, fontSize: '0.95rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Nueva cantidad</label>
              <input 
                type="number" 
                value={modal.nuevaCantidad}
                onChange={(e) => setModal({...modal, nuevaCantidad: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${goldPrimary}`, outline: 'none', backgroundColor: bgCard, color: textDark, fontSize: '0.95rem', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Motivo</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Feriado', 'Evento', 'Promoción', 'Clima', 'Otro'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setModal({...modal, motivo: m})}
                    style={{ 
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                      border: modal.motivo === m ? `1px solid transparent` : `1px solid ${borderLight}`,
                      backgroundColor: modal.motivo === m ? '#F4D06F' : bgCard,
                      color: textDark
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Comentario</label>
              <textarea 
                rows="3"
                value={modal.comentario}
                onChange={(e) => setModal({...modal, comentario: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, outline: 'none', backgroundColor: bgCard, color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', resize: 'none' }} 
              />
              <span style={{ fontSize: '0.75rem', color: textGray, marginTop: '5px', display: 'block' }}>El motivo se usa para mejorar las próximas predicciones.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button onClick={cerrarModal} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button onClick={guardarAjuste} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Guardar ajuste
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Sugerencias;