import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Ventas() {
  const navigate = useNavigate();
  const seccionActiva = 'ventas';

  const [fecha, setFecha] = useState('2025-06-12');
  const [paginaActual, setPaginaActual] = useState(1);
  const totalPaginas = 3;

  // Estado del historial expandido (por defecto abrimos el ID 1, que es "Hoy")
  const [historialExpandido, setHistorialExpandido] = useState(1);

  // Lista de 15 productos divididos en 3 páginas para la tabla de carga
  const [productos, setProductos] = useState([
    // Página 1
    { id: 1, nombre: "Medialuna de manteca", cantidad: 96, estado: "Guardado", pagina: 1 },
    { id: 2, nombre: "Medialuna de grasa", cantidad: 61, estado: "Guardado", pagina: 1 },
    { id: 3, nombre: "Scon", cantidad: 28, estado: "Guardado", pagina: 1 },
    { id: 4, nombre: "Budín de limón", cantidad: 19, estado: "Guardado", pagina: 1 },
    { id: 5, nombre: "Croissant", cantidad: 42, estado: "Guardado", pagina: 1 },
    // Página 2 (Simulados)
    { id: 6, nombre: "Tostado de jamón y queso", cantidad: 30, estado: "Guardado", pagina: 2 },
    { id: 7, nombre: "Alfajor de maicena", cantidad: 25, estado: "Guardado", pagina: 2 },
    { id: 8, nombre: "Brownie", cantidad: 15, estado: "Guardado", pagina: 2 },
    { id: 9, nombre: "Cheesecake", cantidad: 10, estado: "Guardado", pagina: 2 },
    { id: 10, nombre: "Torta de chocolate", cantidad: 8, estado: "Guardado", pagina: 2 },
    // Página 3 (Simulados)
    { id: 11, nombre: "Muffin", cantidad: 20, estado: "Guardado", pagina: 3 },
    { id: 12, nombre: "Cookie con chips", cantidad: 35, estado: "Guardado", pagina: 3 },
    { id: 13, nombre: "Chipá", cantidad: 50, estado: "Guardado", pagina: 3 },
    { id: 14, nombre: "Tostadas", cantidad: 12, estado: "Guardado", pagina: 3 },
    { id: 15, nombre: "Lemon pie", cantidad: 5, estado: "Pendiente", pagina: 3 }
  ]);

  // Datos simulados para el historial de ventas
  const historial = [
    {
      id: 1,
      titulo: "Hoy · 12 jun 2025",
      subtitulo: "5 productos con ventas",
      total: "246 uds.",
      detalle: [
        { nombre: "Medialuna de manteca", cantidad: "96 uds." },
        { nombre: "Medialuna de grasa", cantidad: "61 uds." },
        { nombre: "Croissant", cantidad: "42 uds." },
        { nombre: "Scon", cantidad: "28 uds." },
        { nombre: "Budín de limón", cantidad: "19 uds." }
      ]
    },
    {
      id: 2,
      titulo: "Ayer · 11 jun 2025",
      subtitulo: "5 productos con ventas",
      total: "231 uds.",
      detalle: []
    },
    {
      id: 3,
      titulo: "Martes · 10 jun 2025",
      subtitulo: "5 productos con ventas",
      total: "218 uds.",
      detalle: []
    }
  ];

  const actualizarProducto = (id, valor) => {
    setProductos(productos.map(prod => prod.id === id ? { ...prod, cantidad: valor } : prod));
  };

  const toggleHistorial = (id) => {
    setHistorialExpandido(historialExpandido === id ? null : id);
  };

  const productosPaginados = productos.filter(p => p.pagina === paginaActual);
  const rangoDesde = (paginaActual - 1) * 5 + 1;
  const rangoHasta = paginaActual * 5;

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
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Ventas</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título interno y Selector de Fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Ventas</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Registrá cuántas unidades vendiste de cada producto durante el día.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
            <span style={{ marginRight: '10px', color: textGray }}>📅</span>
            <input 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }}
            />
          </div>
        </div>

        {/* Tarjetas Superiores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#B89732' }}>
              🧾
            </div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>246 uds.</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>Vendidas hoy</span>
            </div>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#E6F4EA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#137333' }}>
              📈
            </div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>+6,5%</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>Respecto del jueves anterior</span>
            </div>
          </div>
        </div>

        {/* Sección 1: Tabla de Carga de Ventas */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Carga de ventas</h3>
          <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Ingresá únicamente las unidades efectivamente vendidas.</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold', width: '50%' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>UNIDADES VENDIDAS</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {productosPaginados.map((prod, index) => (
                <tr key={prod.id} style={{ borderBottom: index === productosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                  <td style={{ padding: '15px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>
                    {prod.nombre}
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    <input 
                      type="number" 
                      value={prod.cantidad}
                      onChange={(e) => actualizarProducto(prod.id, e.target.value)}
                      style={{ width: '120px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                    />
                  </td>
                  <td style={{ padding: '15px 0', textAlign: 'right' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: prod.estado === 'Guardado' ? '#E6F4EA' : '#FEF7E0', color: prod.estado === 'Guardado' ? '#137333' : '#B06000' }}>
                      {prod.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando {rangoDesde}–{rangoHasta} de 15 productos</span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === 1 ? '#F5F5F5' : bgCard, cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: textGray }}>&lt;</button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark }}>{paginaActual} <span style={{ color: textGray, fontWeight: 'normal' }}>/ {totalPaginas}</span></span>
                <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === totalPaginas ? '#F5F5F5' : bgCard, cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}>&gt;</button>
              </div>
              <button style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar ventas</button>
            </div>
          </div>
        </div>

        {/* Sección 2: Historial de Ventas */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Historial de ventas</h3>
          <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Consultá el detalle de las cargas anteriores.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {historial.map((item) => {
              const expandido = historialExpandido === item.id;
              return (
                <div key={item.id} style={{ border: `1px solid ${borderLight}`, borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Fila Principal (Clickeable) */}
                  <div 
                    onClick={() => toggleHistorial(item.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: expandido ? '#FAF9F6' : bgCard, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '36px', height: '36px', backgroundColor: '#FDF8EC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B89732' }}>📅</div>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{item.titulo}</span>
                        <span style={{ fontSize: '0.85rem', color: textGray }}>{item.subtitulo}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'right' }}>
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{item.total}</span>
                        <span style={{ fontSize: '0.75rem', color: textGray }}>Total vendido</span>
                      </div>
                      <span style={{ fontSize: '1.2rem', color: textGray, transform: expandido ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>›</span>
                    </div>
                  </div>

                  {/* Contenido Expandido */}
                  {expandido && item.detalle && item.detalle.length > 0 && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${borderLight}`, backgroundColor: bgCard }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 40px' }}>
                        {item.detalle.map((det, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid #F1EDE4`, paddingBottom: '8px' }}>
                            <span style={{ fontSize: '0.9rem', color: textDark, fontWeight: '500' }}>{det.nombre}</span>
                            <span style={{ fontSize: '0.9rem', color: '#B89732', fontWeight: 'bold' }}>{det.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón Flotante: Ir a Desechos */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button 
            onClick={() => navigate('/desechos')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span>🗑️</span> Ir a Desechos &gt;
          </button>
        </div>

      </div>
    </div>
  );
}

export default Ventas;