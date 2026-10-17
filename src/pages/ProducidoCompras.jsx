import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProducidoCompras() {
  const navigate = useNavigate();
  const seccionActiva = 'producido';

  const [fecha, setFecha] = useState('2025-06-12');
  const [paginaActual, setPaginaActual] = useState(1);
  const totalPaginas = 3;

  // Lista completa de los 15 productos divididos en 3 páginas (5 por página)
  const [productos, setProductos] = useState([
    // Página 1
    { id: 1, nombre: "Medialuna de manteca", modalidad: "Producido", cantidad: 120, costo: "", estado: "Guardado", pagina: 1 },
    { id: 2, nombre: "Medialuna de grasa", modalidad: "Comprado", cantidad: 116, costo: "770", estado: "Guardado", pagina: 1 },
    { id: 3, nombre: "Scon", modalidad: "Producido", cantidad: 112, costo: "", estado: "Guardado", pagina: 1 },
    { id: 4, nombre: "Budín de limón", modalidad: "Producido", cantidad: 108, costo: "", estado: "Guardado", pagina: 1 },
    { id: 5, nombre: "Croissant", modalidad: "Comprado", cantidad: 104, costo: "1130", estado: "Guardado", pagina: 1 },
    // Página 2
    { id: 6, nombre: "Tostado de jamón y queso", modalidad: "Producido", cantidad: 100, costo: "", estado: "Guardado", pagina: 2 },
    { id: 7, nombre: "Alfajor de maicena", modalidad: "Producido", cantidad: 96, costo: "", estado: "Guardado", pagina: 2 },
    { id: 8, nombre: "Brownie", modalidad: "Comprado", cantidad: 92, costo: "1490", estado: "Guardado", pagina: 2 },
    { id: 9, nombre: "Cheesecake", modalidad: "Producido", cantidad: 88, costo: "", estado: "Guardado", pagina: 2 },
    { id: 10, nombre: "Torta de chocolate", modalidad: "Producido", cantidad: 84, costo: "", estado: "Guardado", pagina: 2 },
    // Página 3
    { id: 11, nombre: "Muffin", modalidad: "Comprado", cantidad: 80, costo: "1850", estado: "Guardado", pagina: 3 },
    { id: 12, nombre: "Cookie con chips de chocolate", modalidad: "Producido", cantidad: 76, costo: "", estado: "Guardado", pagina: 3 },
    { id: 13, nombre: "Chipá", modalidad: "Producido", cantidad: 72, costo: "", estado: "Guardado", pagina: 3 },
    { id: 14, nombre: "Tostadas con manteca y mermelada", modalidad: "Comprado", cantidad: 68, costo: "2210", estado: "Guardado", pagina: 3 },
    { id: 15, nombre: "Lemon pie", modalidad: "Producido", cantidad: 64, costo: "", estado: "Pendiente", pagina: 3 }
  ]);

  const actualizarProducto = (id, campo, valor) => {
    setProductos(productos.map(prod => {
      if (prod.id === id) {
        const actualizado = { ...prod, [campo]: valor };
        if (campo === 'modalidad' && valor === 'Producido') {
          actualizado.costo = "";
        }
        return actualizado;
      }
      return prod;
    }));
  };

  // Filtrar productos de la página actual
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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Producido / Compras</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título interno y Selector de Fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Producido / Compras</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Registrá cómo ingresó cada producto al stock durante el día.</p>
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

        {/* Banner Informativo */}
        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: bgCard, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderLight}` }}>📦</div>
          <span style={{ color: '#665324', fontSize: '0.95rem' }}>
            <strong>Elegí "Producido" o "Comprado" para cada producto.</strong> Así el sistema se adapta tanto a comercios que elaboran como a los que compran mercadería terminada.
          </span>
        </div>

        {/* Tabla Editable con Estilos Claros Forzados */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px 30px', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>MODALIDAD</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>CANTIDAD</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>COSTO UNITARIO (SI ES COMPRADO)</th>
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
                    <select 
                      value={prod.modalidad}
                      onChange={(e) => actualizarProducto(prod.id, 'modalidad', e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                      <option value="Producido">Producido</option>
                      <option value="Comprado">Comprado</option>
                    </select>
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    <input 
                      type="number" 
                      value={prod.cantidad}
                      onChange={(e) => actualizarProducto(prod.id, 'cantidad', e.target.value)}
                      style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                    />
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    {prod.modalidad === 'Comprado' ? (
                      <div style={{ position: 'relative', width: '120px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textDark }}>$</span>
                        <input 
                          type="number" 
                          value={prod.costo}
                          onChange={(e) => actualizarProducto(prod.id, 'costo', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px 8px 25px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: '#1A1A1A', boxSizing: 'border-box' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', backgroundColor: '#F5F5F5', borderRadius: '6px', color: '#A0A0A0', fontSize: '0.95rem', display: 'inline-block', border: '1px solid transparent' }}>
                        No corresponde
                      </div>
                    )}
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

          {/* Paginación Interactiva y Guardar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando {rangoDesde}–{rangoHasta} de 15 productos</span>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === 1 ? '#F5F5F5' : bgCard, cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: textGray }}
                >
                  &lt;
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark }}>{paginaActual} <span style={{ color: textGray, fontWeight: 'normal' }}>/ {totalPaginas}</span></span>
                <button 
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === totalPaginas ? '#F5F5F5' : bgCard, cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}
                >
                  &gt;
                </button>
              </div>
              <button 
                onClick={() => alert('¡Ingresos guardados con éxito!')}
                style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Guardar ingresos
              </button>
            </div>
          </div>
        </div>

        {/* Botón Flotante: Ir a Ventas */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button 
            onClick={() => navigate('/ventas')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span>🧾</span> Ir a Ventas &gt;
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProducidoCompras;