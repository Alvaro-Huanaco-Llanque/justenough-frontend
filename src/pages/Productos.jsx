import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Productos() {
  const navigate = useNavigate();
  const seccionActiva = 'productos';

  const [paginaActual, setPaginaActual] = useState(1);
  const totalPaginas = 3;

  // Estado de los productos
  const [productos, setProductos] = useState([
    { id: 1, nombre: "Medialuna de manteca", unidad: "unidad", vidaUtil: "24 h", stock: 3, minimo: 12, priorizado: false, estado: "Crítico", pagina: 1 },
    { id: 2, nombre: "Medialuna de grasa", unidad: "unidad", vidaUtil: "3 días", stock: 7, minimo: 13, priorizado: false, estado: "Bajo", pagina: 1 },
    { id: 3, nombre: "Scon", unidad: "unidad", vidaUtil: "3 días", stock: 11, minimo: 14, priorizado: false, estado: "Óptimo", pagina: 1 },
    { id: 4, nombre: "Budín de limón", unidad: "unidad", vidaUtil: "5 días", stock: 15, minimo: 15, priorizado: false, estado: "Óptimo", pagina: 1 },
    { id: 5, nombre: "Croissant", unidad: "unidad", vidaUtil: "24 h", stock: 19, minimo: 16, priorizado: false, estado: "Bajo", pagina: 1 }
  ]);

  // Estado del panel lateral "Nuevo producto"
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    unidad: 'unidad',
    vidaUtil: '',
    priorizado: false,
    insumos: [
      { id: Date.now(), ingrediente: 'Harina 000', cantidad: '' },
      { id: Date.now() + 1, ingrediente: 'Manteca', cantidad: '' },
      { id: Date.now() + 2, ingrediente: 'Huevos', cantidad: '' }
    ]
  });

  const agregarInsumo = () => {
    setNuevoProducto({
      ...nuevoProducto,
      insumos: [...nuevoProducto.insumos, { id: Date.now(), ingrediente: '', cantidad: '' }]
    });
  };

  const actualizarInsumo = (id, campo, valor) => {
    const nuevosInsumos = nuevoProducto.insumos.map(ins => 
      ins.id === id ? { ...ins, [campo]: valor } : ins
    );
    setNuevoProducto({ ...nuevoProducto, insumos: nuevosInsumos });
  };

  const guardarProducto = () => {
    if (!nuevoProducto.nombre) return;
    
    const productoCreado = {
      id: Date.now(),
      nombre: nuevoProducto.nombre,
      unidad: nuevoProducto.unidad,
      vidaUtil: nuevoProducto.vidaUtil || "24 h",
      stock: 0,
      minimo: 0,
      priorizado: nuevoProducto.priorizado,
      estado: "Bajo",
      pagina: 1
    };

    setProductos([productoCreado, ...productos]);
    setPanelAbierto(false);
    setNuevoProducto({
      nombre: '', unidad: 'unidad', vidaUtil: '', priorizado: false,
      insumos: [{ id: Date.now(), ingrediente: 'Harina 000', cantidad: '' }, { id: Date.now() + 1, ingrediente: 'Manteca', cantidad: '' }, { id: Date.now() + 2, ingrediente: 'Huevos', cantidad: '' }]
    });
  };

  const productosPaginados = productos.filter(p => p.pagina === paginaActual);
  const rangoDesde = (paginaActual - 1) * 5 + 1;
  const rangoHasta = Math.min(paginaActual * 5, productos.length);

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

  
  const getEstadoEstilo = (estado) => {
    if (estado === 'Crítico') return { bg: '#FCE8E6', color: '#C5221F' };
    if (estado === 'Bajo') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#E6F4EA', color: '#137333' }; // Óptimo
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
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Productos</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título y Botón Nuevo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Productos</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Gestioná stock, recetas y mínimos adaptativos.</p>
          </div>
          <button 
            onClick={() => setPanelAbierto(true)}
            style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Nuevo producto
          </button>
        </div>

        {/* Tabla de Productos */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>UNIDAD</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>VIDA ÚTIL</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>STOCK</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MÍNIMO ADAPTATIVO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>PRIORIZADO</th>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {productosPaginados.map((prod, index) => {
                const badge = getEstadoEstilo(prod.estado);
                return (
                  <tr key={prod.id} style={{ borderBottom: index === productosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 30px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>
                      {prod.nombre}
                    </td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{prod.unidad}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{prod.vidaUtil}</td>
                    <td style={{ padding: '20px', fontWeight: 'bold', color: textDark, fontSize: '1rem' }}>{prod.stock}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}><span style={{ color: '#B89732', marginRight: '4px' }}>✨</span>{prod.minimo}</td>
                    <td style={{ padding: '20px', fontSize: '1.2rem', color: prod.priorizado ? '#D4AF37' : '#D1CFC8', cursor: 'pointer' }}>
                      {prod.priorizado ? '★' : '☆'}
                    </td>
                    <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                        {prod.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando {rangoDesde}–{rangoHasta} de {productos.length} productos</span>
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
          </div>
        </div>

      </div>

      {/* ================= PANEL LATERAL "NUEVO PRODUCTO" ================= */}
      {panelAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Header del Panel */}
            <div style={{ padding: '30px 30px 20px', borderBottom: `1px solid ${borderLight}`, backgroundColor: bgApp }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Nuevo producto</h2>
                  <p style={{ color: textGray, margin: 0, fontSize: '0.9rem' }}>Definí sus datos y receta.</p>
                </div>
                <button onClick={() => setPanelAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
              </div>
            </div>

            {/* Contenido Scrolleable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Nombre</label>
                <input 
                  type="text" 
                  placeholder="Ej. Medialuna"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${goldPrimary}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Unidad</label>
                  <select 
                    value={nuevoProducto.unidad}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, unidad: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="unidad">unidad</option>
                    <option value="kg">kg</option>
                    <option value="gr">gr</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Vida útil</label>
                  <input 
                    type="text" 
                    placeholder="24 horas"
                    value={nuevoProducto.vidaUtil}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, vidaUtil: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={nuevoProducto.priorizado}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, priorizado: e.target.checked})}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{ fontSize: '0.95rem', color: textDark }}>Producto priorizado</label>
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${borderLight}`, margin: '0 0 25px 0' }} />

              {/* Receta */}
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 15px 0' }}>Receta</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                {nuevoProducto.insumos.map((ins, idx) => (
                  <div key={ins.id} style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      value={ins.ingrediente}
                      onChange={(e) => actualizarInsumo(ins.id, 'ingrediente', e.target.value)}
                      style={{ flex: 2, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Seleccionar insumo</option>
                      <option value="Harina 000">Harina 000</option>
                      <option value="Manteca">Manteca</option>
                      <option value="Huevos">Huevos</option>
                      <option value="Azúcar">Azúcar</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder={idx === 0 ? "0,05 kg" : idx === 1 ? "0,02 kg" : "0,1 u"}
                      value={ins.cantidad}
                      onChange={(e) => actualizarInsumo(ins.id, 'cantidad', e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>
                ))}
              </div>

              <span 
                onClick={agregarInsumo}
                style={{ color: '#8B6A20', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block', marginBottom: '40px' }}
              >
                + Agregar insumo
              </span>

              <button 
                onClick={guardarProducto}
                style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
              >
                Guardar producto
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Productos;