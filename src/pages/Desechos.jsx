import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Desechos() {
  const navigate = useNavigate();
  const seccionActiva = 'desechos';

  const [fecha, setFecha] = useState('2025-06-12');

  // Estado inicial de los productos en la tabla de desechos
  const [productos, setProductos] = useState([
    { id: 1, nombre: "Medialuna", cantidad: 10, motivo: "Fin de vida útil", observaciones: "", estado: "Guardado" },
    { id: 2, nombre: "Cookie 50g", cantidad: 2, motivo: "Defecto de cocción", observaciones: "", estado: "Guardado" },
    { id: 3, nombre: "Muffin", cantidad: 0, motivo: "Seleccionar", observaciones: "", estado: "Pendiente" },
    { id: 4, nombre: "Budín", cantidad: 1, motivo: "Producto dañado", observaciones: "", estado: "Guardado" },
    { id: 5, nombre: "Scon", cantidad: 0, motivo: "Seleccionar", observaciones: "", estado: "Pendiente" }
  ]);

  // Actualizar un campo específico de la tabla
  const actualizarProducto = (id, campo, valor) => {
    setProductos(productos.map(prod => {
      if (prod.id === id) {
        return { ...prod, [campo]: valor };
      }
      return prod;
    }));
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



  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';
  const goldLight = '#F9EBBF';

  // Opciones para el select de motivos
  const motivos = ["Seleccionar", "Fin de vida útil", "Producto dañado", "Defecto de cocción", "Otro"];

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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Desechos</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título interno y Selector de Fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Desechos</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Registrá únicamente los productos descartados durante el día.</p>
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

        {/* Tarjetas de Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#FCE8E6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#C5221F' }}>
              ⚠
            </div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>13 uds.</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>Desechadas hoy</span>
            </div>
          </div>

          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#B89732' }}>
              💰
            </div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>$18.600</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>Costo estimado del descarte</span>
            </div>
          </div>
        </div>

        {/* Tabla de Carga de Desechos */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>CANTIDAD DESECHADA</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>MOTIVO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>OBSERVACIONES</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod, index) => (
                <tr key={prod.id} style={{ borderBottom: index === productos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                  <td style={{ padding: '15px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>
                    {prod.nombre}
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    <input 
                      type="number" 
                      value={prod.cantidad}
                      onChange={(e) => actualizarProducto(prod.id, 'cantidad', e.target.value)}
                      style={{ width: '80px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
                    />
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    <select 
                      value={prod.motivo}
                      onChange={(e) => actualizarProducto(prod.id, 'motivo', e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', cursor: 'pointer', width: '170px' }}
                    >
                      {motivos.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '15px 0' }}>
                    <input 
                      type="text" 
                      placeholder="Detalle opcional"
                      value={prod.observaciones}
                      onChange={(e) => actualizarProducto(prod.id, 'observaciones', e.target.value)}
                      style={{ width: '150px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.85rem', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
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

          {/* Pie de Tabla */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>3 de 5 productos cargados hoy</span>
            <button style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar desechos</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Desechos;