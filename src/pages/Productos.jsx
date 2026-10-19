import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Productos() {
  const navigate = useNavigate();
  const seccionActiva = 'productos';

  const [paginaActual, setPaginaActual] = useState(1);
  const [productos, setProductos] = useState([]);

  // Cargar productos desde el Backend
useEffect(() => {
    const cargarProductos = async () => {
      try {
        // Recuperamos el token guardado al hacer login
        const token = localStorage.getItem('jwt_token');

        const res = await fetch('http://localhost:8080/api/productos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const productosConPagina = data.map(p => ({
            id: p.id,
            nombre: p.nombre,
            unidad: p.unidadMedida ? p.unidadMedida.toLowerCase() : 'unidad',
            vidaUtil: p.vidaUtilDias === 1 ? "24 h" : `${p.vidaUtilDias} días`,
            stock: p.stock || 0,
            minimo: p.stockMinimo || 0,
            priorizado: p.priorizado,
            estado: (p.stock || 0) <= (p.stockMinimo || 0) ? "Crítico" : "Óptimo",
            pagina: 1
          }));
          setProductos(productosConPagina);
        } else {
          cargarDatosSimulados();
        }
      } catch (err) {
        cargarDatosSimulados();
      }
    };
    cargarProductos();
  }, []);

  const cargarDatosSimulados = () => {
    setProductos([
      { id: 1, nombre: "Medialuna de manteca", stock: 3, unidad: "unidad", vidaUtil: "24 h", minimo: 12, priorizado: false, estado: "Crítico", pagina: 1 },
      { id: 2, nombre: "Medialuna de grasa", stock: 7, unidad: "unidad", vidaUtil: "3 días", minimo: 13, priorizado: false, estado: "Bajo", pagina: 1 },
      { id: 3, nombre: "Scon", stock: 11, unidad: "unidad", vidaUtil: "3 días", minimo: 14, priorizado: false, estado: "Óptimo", pagina: 1 },
      { id: 4, nombre: "Coca-Cola 500ml", stock: 24, unidad: "unidad", vidaUtil: "180 días", minimo: 10, priorizado: false, estado: "Óptimo", pagina: 1 }
    ]);
  };

  // Estado del modal "Eliminar producto"
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState('');

  const eliminarProducto = async () => {
    if (!productoAEliminar) return;

    try {
      const token = localStorage.getItem('jwt_token');

      const res = await fetch(`http://localhost:8080/api/productos/${productoAEliminar}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Enviamos el token real
        }
      });

      if (res.ok) {
        // Lo borramos de la tabla visualmente
        setProductos(productos.filter(p => p.id !== parseInt(productoAEliminar)));
      } else {
        // Fallback local si el backend da error
        setProductos(productos.filter(p => p.id !== parseInt(productoAEliminar)));
      }
    } catch (error) {
      // Fallback local si no hay conexión
      setProductos(productos.filter(p => p.id !== parseInt(productoAEliminar)));
    }

    setModalEliminar(false);
    setProductoAEliminar('');
  };

  // Estado del panel lateral "Nuevo producto"
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    unidadMedida: 'UNIDAD',
    vidaUtilNum: '',
    vidaUtilTipo: 'horas', 
    stock: '', // <-- Agregado el estado para el stock inicial
    priorizado: false,
    requiereReceta: true,
    insumos: [
      { id: Date.now(), ingrediente: '', cantidad: '' }
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

const guardarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.vidaUtilNum) {
      alert("El nombre y la vida útil son obligatorios.");
      return;
    }

    let diasCalculados = parseInt(nuevoProducto.vidaUtilNum, 10);
    if (nuevoProducto.vidaUtilTipo === 'horas') {
      diasCalculados = Math.max(1, Math.ceil(diasCalculados / 24));
    }
    
    // 1. Armamos el JSON EXACTO para el backend (SIN insumos, porque Java no los espera acá)
    const productoParaBackend = {
      nombre: nuevoProducto.nombre,
      unidadMedida: nuevoProducto.unidadMedida, 
      vidaUtilDias: diasCalculados,
      stock: parseFloat(nuevoProducto.stock) || 0,
      priorizado: nuevoProducto.priorizado,
      activo: true
    };

    const stringVidaUtil = nuevoProducto.vidaUtilTipo === 'horas' 
      ? `${nuevoProducto.vidaUtilNum} h` 
      : `${nuevoProducto.vidaUtilNum} días`;

    const productoVisual = {
      id: Date.now(),
      nombre: nuevoProducto.nombre,
      stock: parseFloat(nuevoProducto.stock) || 0,
      unidad: nuevoProducto.unidadMedida.toLowerCase(),
      vidaUtil: stringVidaUtil,
      minimo: 0,
      priorizado: nuevoProducto.priorizado,
      estado: "Bajo",
      pagina: 1
    };

    try {
      const token = localStorage.getItem('jwt_token');

      const res = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Enviamos el token real
        },
        body: JSON.stringify(productoParaBackend)
      });

      if (res.ok) {
        // ¡Si entró acá, se guardó en MySQL!
        const productoGuardadoDB = await res.json();
        const productoNuevoMapeado = {
          ...productoGuardadoDB,
          stock: productoGuardadoDB.stock || parseFloat(nuevoProducto.stock) || 0,
          unidad: productoGuardadoDB.unidadMedida.toLowerCase(),
          vidaUtil: stringVidaUtil,
          minimo: productoGuardadoDB.stockMinimo || 0,
          estado: "Bajo",
          pagina: 1
        };
        setProductos([productoNuevoMapeado, ...productos]);
        alert("¡Producto guardado exitosamente en la base de datos!");
      } else {
        console.error("El backend rechazó los datos. Revisa la consola de Spring Boot.");
        setProductos([productoVisual, ...productos]);
      }
    } catch (error) {
      console.error("No hay conexión con el backend.");
      setProductos([productoVisual, ...productos]);
    }

    setPanelAbierto(false);
    setNuevoProducto({
      nombre: '', unidadMedida: 'UNIDAD', vidaUtilNum: '', vidaUtilTipo: 'horas', stock: '', priorizado: false, requiereReceta: true,
      insumos: [{ id: Date.now(), ingrediente: '', cantidad: '' }]
    });
  };

  const productosPaginados = productos.filter(p => p.pagina === paginaActual);
  const rangoDesde = productos.length > 0 ? (paginaActual - 1) * 5 + 1 : 0;
  const rangoHasta = Math.min(paginaActual * 5, productos.length);
  const totalPaginasCalculadas = Math.ceil(productos.length / 5) || 1;

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
    return { bg: '#E6F4EA', color: '#137333' }; 
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Productos</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Productos</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Gestioná stock, recetas y mínimos adaptativos.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* BOTÓN ELIMINAR */}
            <button 
              onClick={() => setModalEliminar(true)}
              style={{ padding: '10px 20px', backgroundColor: '#FCE8E6', color: '#C5221F', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🗑️</span> Eliminar producto
            </button>
            <button 
              onClick={() => setPanelAbierto(true)}
              style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>+</span> Nuevo producto
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>STOCK</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>UNIDAD</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>VIDA ÚTIL</th>
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
                    <td style={{ padding: '20px', fontWeight: 'bold', color: textDark, fontSize: '1rem' }}>{prod.stock || 0}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{prod.unidad}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{prod.vidaUtil}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>
                      {prod.minimo > 0 && <span style={{ color: '#B89732', marginRight: '4px' }}>✨</span>}
                      {prod.minimo || 0}
                    </td>
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
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark }}>{paginaActual} <span style={{ color: textGray, fontWeight: 'normal' }}>/ {totalPaginasCalculadas}</span></span>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginasCalculadas))}
                disabled={paginaActual === totalPaginasCalculadas}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === totalPaginasCalculadas ? '#F5F5F5' : bgCard, cursor: paginaActual === totalPaginasCalculadas ? 'not-allowed' : 'pointer', color: textDark }}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MODAL ELIMINAR PRODUCTO ================= */}
      {modalEliminar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.4rem', color: textDark, margin: 0, fontWeight: 'bold' }}>Eliminar producto</h3>
              <button onClick={() => setModalEliminar(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>
            
            <p style={{ color: textGray, fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.4' }}>
              Seleccioná el producto que querés eliminar del catálogo. Esta acción no se puede deshacer.
            </p>

            <select 
              value={productoAEliminar} 
              onChange={(e) => setProductoAEliminar(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', marginBottom: '30px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEliminar(false)} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button 
                onClick={eliminarProducto} 
                disabled={!productoAEliminar} 
                style={{ padding: '10px 20px', backgroundColor: '#FCE8E6', color: '#C5221F', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: productoAEliminar ? 'pointer' : 'not-allowed', fontSize: '0.9rem', opacity: productoAEliminar ? 1 : 0.5 }}
              >
                Eliminar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= PANEL LATERAL "NUEVO PRODUCTO" ================= */}
      {panelAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            <div style={{ padding: '30px 30px 20px', borderBottom: `1px solid ${borderLight}`, backgroundColor: bgApp }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Nuevo producto</h2>
                  <p style={{ color: textGray, margin: 0, fontSize: '0.9rem' }}>Definí sus datos y receta.</p>
                </div>
                <button onClick={() => setPanelAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px 20px 30px 30px', boxSizing: 'border-box' }}>
              
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Cantidad (Se vende por)</label>
                  <select 
                    value={nuevoProducto.unidadMedida}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, unidadMedida: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="UNIDAD">un</option>
                    <option value="KG">kg</option>
                    <option value="GR">gr</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Vida útil</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      placeholder="Ej. 24"
                      min="1"
                      value={nuevoProducto.vidaUtilNum}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, vidaUtilNum: e.target.value})}
                      style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
                    />
                    <select 
                      value={nuevoProducto.vidaUtilTipo}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, vidaUtilTipo: e.target.value})}
                      style={{ width: '80px', padding: '10px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#F5F5F5', color: textDark, fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="horas">horas</option>
                      <option value="dias">días</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Nueva Fila: Stock Inicial y Priorizado */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Stock inicial</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 15"
                    value={nuevoProducto.stock}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
                  <input 
                    type="checkbox" 
                    checked={nuevoProducto.priorizado}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, priorizado: e.target.checked})}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: goldPrimary }}
                  />
                  <label style={{ fontSize: '0.95rem', color: textDark }}>Producto priorizado</label>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${borderLight}`, margin: '0 0 25px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: 0 }}>Receta de producción</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    checked={nuevoProducto.requiereReceta}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, requiereReceta: e.target.checked})}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: goldPrimary }}
                  />
                  <label style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Requiere<br/>elaboración</label>
                </div>
              </div>
              
              {nuevoProducto.requiereReceta ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                    {nuevoProducto.insumos.map((ins, idx) => (
                      <div key={ins.id} style={{ display: 'flex', gap: '10px' }}>
                        <select 
                          value={ins.ingrediente}
                          onChange={(e) => actualizarInsumo(ins.id, 'ingrediente', e.target.value)}
                          style={{ flex: 2, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">Seleccionar insumo...</option>
                          <option value="Harina 000">Harina 000</option>
                          <option value="Manteca">Manteca</option>
                          <option value="Huevos">Huevos</option>
                          <option value="Azúcar">Azúcar</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder={idx === 0 ? "Ej. 0,05" : "Cantidad"}
                          value={ins.cantidad}
                          onChange={(e) => actualizarInsumo(ins.id, 'cantidad', e.target.value)}
                          style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
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
                </>
              ) : (
                <div style={{ padding: '20px', backgroundColor: '#F5F5F5', borderRadius: '8px', textAlign: 'center', marginBottom: '40px' }}>
                  <span style={{ fontSize: '0.9rem', color: textGray }}>Este producto se revende y no consume insumos del inventario.</span>
                </div>
              )}

              <button 
                onClick={guardarProducto}
                style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxSizing: 'border-box' }}
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