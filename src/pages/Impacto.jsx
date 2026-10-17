import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Impacto() {
  const navigate = useNavigate();
  const seccionActiva = 'impacto';

  const [exportMenuAbierto, setExportMenuAbierto] = useState(false);

  // Datos simulados (Mock data)
  const productosDropdown = [
    "Todos los productos", "Medialuna de manteca", "Medialuna de grasa", "Scon", 
    "Budín de limón", "Croissant", "Tostado de jamón y queso", "Alfajor de maicena", 
    "Brownie", "Cheesecake", "Torta de chocolate", "Muffin", "Cookie con chips de chocolate", 
    "Chipá", "Tostadas con manteca y mermelada", "Lemon pie"
  ];

  const precisionProductos = [
    { id: 1, nombre: "Medialuna", sugerido: "120 uds.", vendido: "112 uds.", desperdicio: "8 uds.", precision: "93%", estado: "Alto" },
    { id: 2, nombre: "Budín", sugerido: "40 uds.", vendido: "37 uds.", desperdicio: "3 uds.", precision: "92%", estado: "Alto" },
    { id: 3, nombre: "Cookie 50g", sugerido: "90 uds.", vendido: "81 uds.", desperdicio: "9 uds.", precision: "90%", estado: "Alto" },
    { id: 4, nombre: "Muffin", sugerido: "60 uds.", vendido: "48 uds.", desperdicio: "12 uds.", precision: "80%", estado: "Medio" },
    { id: 5, nombre: "Scon", sugerido: "35 uds.", vendido: "26 uds.", desperdicio: "9 uds.", precision: "74%", estado: "Bajo" }
  ];

  const graficoBarras = [
    { dia: 'Jue', sugerido: 60, vendido: 45 },
    { dia: 'Vie', sugerido: 75, vendido: 65 },
    { dia: 'Sáb', sugerido: 100, vendido: 85 },
    { dia: 'Dom', sugerido: 55, vendido: 50 },
    { dia: 'Lun', sugerido: 65, vendido: 60 },
    { dia: 'Mar', sugerido: 85, vendido: 75 },
    { dia: 'Mié', sugerido: 70, vendido: 65 }
  ];

  const ajustesMotivo = [
    { motivo: "Evento", cantidad: 9, max: 10 },
    { motivo: "Feriado", cantidad: 6, max: 10 },
    { motivo: "Clima", cantidad: 4, max: 10 },
    { motivo: "Promoción", cantidad: 3, max: 10 },
    { motivo: "Otro", cantidad: 2, max: 10 }
  ];

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

  const getPrecisionStyle = (estado) => {
    if (estado === 'Alto') return { bg: '#E6F4EA', color: '#137333' };
    if (estado === 'Medio') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#FCE8E6', color: '#C5221F' }; // Bajo
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
      <div style={{ width: '260px', height: '100%', backgroundColor: bgApp, borderRight: `1px solid ${borderLight}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '25px 20px', boxSizing: 'border-box', flexShrink: 0, overflowY: 'auto' }}>
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

        <div style={{ borderTop: `1px solid ${borderLight}`, paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginTop: '20px' }}>
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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Impacto</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Barra de Controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Resultados del sistema</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Compará lo que el sistema sugirió con lo que realmente pasó.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select style={{ padding: '10px 15px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: bgCard, outline: 'none', cursor: 'pointer', color: textDark, fontSize: '0.95rem' }}>
              <option>Últimos 30 días</option>
              <option>Últimos 7 días</option>
            </select>
            
            <select style={{ padding: '10px 15px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: bgCard, outline: 'none', cursor: 'pointer', color: textDark, fontSize: '0.95rem', width: '200px' }}>
              {productosDropdown.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setExportMenuAbierto(!exportMenuAbierto)}
                style={{ padding: '10px 20px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>↓</span> Exportar reporte
              </button>
              {exportMenuAbierto && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, width: '220px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${borderLight}`, color: textDark, fontSize: '0.95rem' }} className="hover-bg">PDF (resumen con gráficos)</div>
                  <div style={{ padding: '12px 20px', cursor: 'pointer', color: textDark, fontSize: '0.95rem' }} className="hover-bg">CSV (datos crudos)</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjetas Superiores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Precisión de predicción</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#137333', fontSize: '0.9rem' }}>◎</div>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark, display: 'block' }}>87%</span>
            <span style={{ fontSize: '0.85rem', color: '#137333', display: 'block', marginTop: '8px', fontWeight: '500' }}>+5 pts vs. mes anterior</span>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Desperdicio reducido</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FDF8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B89732', fontSize: '0.9rem' }}>🍃</div>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark, display: 'block' }}>-35%</span>
            <span style={{ fontSize: '0.85rem', color: textGray, display: 'block', marginTop: '8px' }}>vs. período base</span>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>Ahorro estimado</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FDF8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B89732', fontSize: '0.9rem' }}>$</div>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark, display: 'block' }}>$1.8M</span>
            <span style={{ fontSize: '0.85rem', color: textGray, display: 'block', marginTop: '8px' }}>este mes</span>
          </div>
        </div>

        {/* Gráfico Predicho vs Real */}
        <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Predicho vs. real</h3>
              <p style={{ color: textGray, fontSize: '0.9rem', margin: '0' }}>Unidades sugeridas a producir vs. unidades vendidas, últimos 7 días</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#F4E3B5', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Sugerido</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#C99B36', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Vendido</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 20px' }}>
            {graficoBarras.map((diaInfo, i) => {
              const maxVal = 100; 
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '80px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '180px', width: '100%', justifyContent: 'center' }}>
                    <div title={`Sugerido: ${diaInfo.sugerido}`} style={{ width: '32px', height: `${(diaInfo.sugerido / maxVal) * 100}%`, backgroundColor: '#F4E3B5', borderRadius: '4px 4px 0 0' }}></div>
                    <div title={`Vendido: ${diaInfo.vendido}`} style={{ width: '32px', height: `${(diaInfo.vendido / maxVal) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{diaInfo.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fila Dividida: Evolución Desperdicio & Ajustes por motivo */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          
          {/* Evolución Desperdicio (Línea) */}
          <div style={{ flex: 1.5, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Evolución del desperdicio</h3>
            <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 30px 0' }}>Últimas 8 semanas · tendencia descendente</p>
            
            <div style={{ position: 'relative', height: '180px', width: '100%' }}>
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points="5,20 18,30 31,25 44,45 57,55 70,70 83,78 96,90" fill="none" stroke="#C99B36" strokeWidth="2" />
                {[
                  {x: 5, y: 20}, {x: 18, y: 30}, {x: 31, y: 25}, {x: 44, y: 45},
                  {x: 57, y: 55}, {x: 70, y: 70}, {x: 83, y: 78}, {x: 96, y: 90}
                ].map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="2" fill="#FFFFFF" stroke="#C99B36" strokeWidth="1.5" />
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                {['Sem. 8', 'Sem. 7', 'Sem. 6', 'Sem. 5', 'Sem. 4', 'Sem. 3', 'Sem. 2', 'Sem. 1'].map((sem, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', color: '#A0A0A0' }}>{sem}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Ajustes por motivo (Barras Horizontales) */}
          <div style={{ flex: 1, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
            <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Ajustes por motivo</h3>
            <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Cambios realizados a las sugerencias</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {ajustesMotivo.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.9rem', color: textDark, fontWeight: '600' }}>{item.motivo}</span>
                    <span style={{ fontSize: '0.9rem', color: textGray }}>{item.cantidad}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(item.cantidad / item.max) * 100}%`, height: '100%', backgroundColor: '#C99B36', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Banner de Sugerencias Aplicadas */}
        <div style={{ backgroundColor: bgCard, padding: '25px 30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px', position: 'relative' }}>
          <h3 style={{ fontSize: '1.1rem', color: textDark, margin: '0 0 15px 0' }}>Sugerencias aplicadas</h3>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '15px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>24</span>
            <span style={{ fontSize: '1.2rem', color: textGray }}>de 30</span>
          </div>

          <div style={{ width: '100%', height: '10px', backgroundColor: '#F1EDE4', borderRadius: '5px', overflow: 'hidden', marginBottom: '15px' }}>
            <div style={{ width: '80%', height: '100%', backgroundColor: '#D4AF37', borderRadius: '5px' }}></div>
          </div>

          <span style={{ position: 'absolute', top: '30px', right: '30px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FDF8EC', color: '#B89732', fontSize: '0.85rem', fontWeight: 'bold' }}>
            80%
          </span>

          <p style={{ color: textGray, fontSize: '0.95rem', margin: 0 }}>
            Cuando no se siguió la sugerencia, el desperdicio fue <strong style={{ color: textDark }}>2,1× mayor</strong>.
          </p>
        </div>

        {/* Tabla de Precisión por producto */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 20px 0' }}>Precisión por producto</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>SUGERIDO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>VENDIDO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>DESPERDICIO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>PRECISIÓN</th>
              </tr>
            </thead>
            <tbody>
              {precisionProductos.map((prod, index) => {
                const badge = getPrecisionStyle(prod.estado);
                return (
                  <tr key={prod.id} style={{ borderBottom: index === precisionProductos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{prod.sugerido}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{prod.vendido}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{prod.desperdicio}</td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                        {prod.precision}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando 5 de 18 productos</span>
            <span style={{ color: '#B89732', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>Ver todos</span>
          </div>
        </div>

      </div>

      <style>{`
        .hover-bg:hover { background-color: #FDF8EC; }
      `}</style>
    </div>
  );
}

export default Impacto;