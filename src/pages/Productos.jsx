import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Productos() {
  const navigate = useNavigate();
  const seccionActiva = 'productos';

  // ================= ESTADOS GLOBALES =================
  const [pestanaActiva, setPestanaActiva] = useState('productos'); // 'productos' o 'insumos'
  const [paginaActual, setPaginaActual] = useState(1);
  
  // ================= ESTADOS PRODUCTOS =================
  const [productos, setProductos] = useState([]);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState('');
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', unidadMedida: 'UNIDAD', vidaUtilNum: '', vidaUtilTipo: 'horas', 
    stock: '', priorizado: false, requiereReceta: true,
    insumos: [{ id: Date.now(), ingrediente: '', cantidad: '' }]
  });

  // ================= ESTADOS INSUMOS =================
  const [insumos, setInsumos] = useState([]);
  const [modalEliminarInsumo, setModalEliminarInsumo] = useState(false);
  const [insumoAEliminar, setInsumoAEliminar] = useState('');
  const [panelInsumoAbierto, setPanelInsumoAbierto] = useState(false);
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: '', unidadMedida: 'KG', stockActual: '', vidaUtilNum: '', vidaUtilTipo: 'dias'
  });

  // ================= CARGA DE DATOS =================
  useEffect(() => {
    cargarProductos();
    cargarInsumos();
  }, []);

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:8080/api/productos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const productosMapeados = data.map(p => ({
          id: p.id,
          nombre: p.nombre,
          unidad: p.unidadMedida ? p.unidadMedida.toLowerCase() : 'unidad',
          vidaUtil: p.vidaUtilDias === 1 ? "24 h" : `${p.vidaUtilDias} días`,
          stock: p.stock || 0,
          minimo: p.stockMinimo || 0,
          priorizado: p.priorizado,
          estado: (p.stock || 0) <= (p.stockMinimo || 0) ? "Crítico" : "Óptimo"
        }));
        setProductos(productosMapeados);
      }
    } catch (err) {
      console.error("Error cargando productos", err);
    }
  };

  const cargarInsumos = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:8080/api/insumos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const insumosMapeados = data.map(i => ({
          id: i.id,
          nombre: i.nombre,
          unidad: i.unidadMedida ? i.unidadMedida.toLowerCase() : 'kg',
          stock: i.stockActual || 0,
          vidaUtil: i.vidaUtilDias === 1 ? "24 h" : `${i.vidaUtilDias} días`,
          estado: (i.stockActual || 0) <= 5 ? "Crítico" : "Óptimo"
        }));
        setInsumos(insumosMapeados);
      }
    } catch (err) {
      console.error("Error cargando insumos", err);
    }
  };

  // ================= LÓGICA DE PRODUCTOS =================
  const eliminarProducto = async () => {
    if (!productoAEliminar) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`http://localhost:8080/api/productos/${productoAEliminar}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProductos(productos.filter(p => p.id !== parseInt(productoAEliminar)));
    } catch (error) {
      console.error("Error eliminando producto");
    }
    setModalEliminar(false);
    setProductoAEliminar('');
  };

  const guardarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.vidaUtilNum) { alert("Nombre y vida útil requeridos"); return; }
    let diasCalculados = parseInt(nuevoProducto.vidaUtilNum, 10);
    if (nuevoProducto.vidaUtilTipo === 'horas') diasCalculados = Math.max(1, Math.ceil(diasCalculados / 24));
    else if (nuevoProducto.vidaUtilTipo === 'meses') diasCalculados = diasCalculados * 30;
    else if (nuevoProducto.vidaUtilTipo === 'año') diasCalculados = diasCalculados * 365;
    
    const productoParaBackend = {
      nombre: nuevoProducto.nombre, unidadMedida: nuevoProducto.unidadMedida, vidaUtilDias: diasCalculados,
      stock: parseFloat(nuevoProducto.stock) || 0, priorizado: nuevoProducto.priorizado, activo: true
    };

    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productoParaBackend)
      });
      if (res.ok) cargarProductos();
    } catch (error) { console.error("Error guardando producto"); }

    setPanelAbierto(false);
    setNuevoProducto({ nombre: '', unidadMedida: 'UNIDAD', vidaUtilNum: '', vidaUtilTipo: 'horas', stock: '', priorizado: false, requiereReceta: true, insumos: [{ id: Date.now(), ingrediente: '', cantidad: '' }] });
  };

  // ================= LÓGICA DE INSUMOS =================
  const eliminarInsumo = async () => {
    if (!insumoAEliminar) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`http://localhost:8080/api/insumos/${insumoAEliminar}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setInsumos(insumos.filter(i => i.id !== parseInt(insumoAEliminar)));
    } catch (error) { console.error("Error eliminando insumo"); }
    setModalEliminarInsumo(false);
    setInsumoAEliminar('');
  };

  const guardarInsumo = async () => {
    if (!nuevoInsumo.nombre || !nuevoInsumo.vidaUtilNum) { alert("Nombre y vida útil requeridos"); return; }
    let diasCalculados = parseInt(nuevoInsumo.vidaUtilNum, 10);
    if (nuevoInsumo.vidaUtilTipo === 'horas') diasCalculados = Math.max(1, Math.ceil(diasCalculados / 24));
    else if (nuevoInsumo.vidaUtilTipo === 'meses') diasCalculados = diasCalculados * 30;
    else if (nuevoInsumo.vidaUtilTipo === 'año') diasCalculados = diasCalculados * 365;
    
    const insumoParaBackend = {
      nombre: nuevoInsumo.nombre, 
      unidadMedida: nuevoInsumo.unidadMedida, 
      vidaUtilDias: diasCalculados,
      stockActual: parseFloat(nuevoInsumo.stockActual) || 0,
      costoUnitario: 0
    };

    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:8080/api/insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(insumoParaBackend)
      });
      if (res.ok) cargarInsumos();
    } catch (error) { console.error("Error guardando insumo"); }

    setPanelInsumoAbierto(false);
    setNuevoInsumo({ nombre: '', unidadMedida: 'KG', stockActual: '', vidaUtilNum: '', vidaUtilTipo: 'dias' });
  };

  const datosPaginados = pestanaActiva === 'productos' 
    ? productos.slice((paginaActual - 1) * 5, paginaActual * 5)
    : insumos.slice((paginaActual - 1) * 5, paginaActual * 5);
    
  const totalItems = pestanaActiva === 'productos' ? productos.length : insumos.length;
  const totalPaginasCalculadas = Math.ceil(totalItems / 5) || 1;

  const getEstadoEstilo = (estado) => {
    if (estado === 'Crítico') return { bg: '#FCE8E6', color: '#C5221F' };
    if (estado === 'Bajo') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#E6F4EA', color: '#137333' }; 
  };

  const menuSidebar = [
    { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
    { id: 'producido', label: 'Producido / Compras', icon: '📦', ruta: '/producido' },
    { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '/ventas' },
    { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '/desechos' },
    { id: 'sugerencias', label: 'Sugerencias', icon: '✨', badge: 3, ruta: '/sugerencias' },
    { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '/impacto' },
    { id: 'productos', label: 'Inventario', icon: '⭐', ruta: '/productos' },
    { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '/calendario' },
    { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '/madurez' },
  ];

  const bgApp = '#FAF9F6'; const bgCard = '#FFFFFF'; const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A'; const textGray = '#666666'; const goldPrimary = '#D4AF37'; const goldLight = '#F9EBBF';

  // Estilo estricto para inputs y selects (fondo blanco, texto oscuro)
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${borderLight}`,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none'
  };

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
                <div key={item.id} onClick={() => item.ruta !== '#' && navigate(item.ruta)} style={{ padding: '10px 12px', borderRadius: '20px', cursor: 'pointer', backgroundColor: seccionActiva === item.id ? goldLight : 'transparent', color: seccionActiva === item.id ? '#1A1A1A' : textGray, fontWeight: seccionActiva === item.id ? 'bold' : '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ opacity: seccionActiva === item.id ? 1 : 0.6 }}>{item.icon}</span> {item.label}
                  </div>
                  {item.badge && <span style={{ backgroundColor: goldPrimary, color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{item.badge}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Inventario</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Gestioná tus productos a la venta e insumos de stock.</p>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div style={{ display: 'flex', gap: '30px', borderBottom: `2px solid ${borderLight}`, marginBottom: '25px' }}>
          <div 
            onClick={() => { setPestanaActiva('productos'); setPaginaActual(1); }}
            style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'productos' ? 'bold' : '500', color: pestanaActiva === 'productos' ? textDark : textGray, borderBottom: pestanaActiva === 'productos' ? `3px solid ${goldPrimary}` : '3px solid transparent', transform: 'translateY(2px)' }}
          >
            Productos
          </div>
          <div 
            onClick={() => { setPestanaActiva('insumos'); setPaginaActual(1); }}
            style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'insumos' ? 'bold' : '500', color: pestanaActiva === 'insumos' ? textDark : textGray, borderBottom: pestanaActiva === 'insumos' ? `3px solid ${goldPrimary}` : '3px solid transparent', transform: 'translateY(2px)' }}
          >
            Insumos
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => pestanaActiva === 'productos' ? setModalEliminar(true) : setModalEliminarInsumo(true)}
              style={{ padding: '10px 20px', backgroundColor: '#FCE8E6', color: '#C5221F', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🗑️</span> Eliminar {pestanaActiva === 'productos' ? 'producto' : 'insumo'}
            </button>
            <button 
              onClick={() => pestanaActiva === 'productos' ? setPanelAbierto(true) : setPanelInsumoAbierto(true)}
              style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>+</span> Nuevo {pestanaActiva === 'productos' ? 'producto' : 'insumo'}
            </button>
          </div>
        </div>

        {/* TABLA DINÁMICA */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'left' }}>{pestanaActiva === 'productos' ? 'PRODUCTO' : 'INSUMO'}</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>{pestanaActiva === 'productos' ? 'STOCK' : 'STOCK ACTUAL'}</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>UNIDAD</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>VIDA ÚTIL</th>
                {pestanaActiva === 'productos' && <th style={{ padding: '20px', fontWeight: 'bold' }}>MÍNIMO</th>}
                {pestanaActiva === 'productos' && <th style={{ padding: '20px', fontWeight: 'bold' }}>PRIORIZADO</th>}
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {datosPaginados.map((item, index) => {
                const badge = getEstadoEstilo(item.estado);
                return (
                  <tr key={item.id} style={{ borderBottom: index === datosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 30px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>{item.nombre}</td>
                    <td style={{ padding: '20px', fontWeight: 'bold', color: textDark, fontSize: '1rem' }}>{item.stock}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.unidad}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.vidaUtil}</td>
                    {pestanaActiva === 'productos' && <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.minimo}</td>}
                    {pestanaActiva === 'productos' && <td style={{ padding: '20px', fontSize: '1.2rem', color: item.priorizado ? '#D4AF37' : '#D1CFC8' }}>{item.priorizado ? '★' : '☆'}</td>}
                    <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>{item.estado}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Página {paginaActual} de {totalPaginasCalculadas}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === 1 ? '#F5F5F5' : bgCard, cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: textGray }}>&lt;</button>
              <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginasCalculadas))} disabled={paginaActual === totalPaginasCalculadas} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: paginaActual === totalPaginasCalculadas ? '#F5F5F5' : bgCard, cursor: paginaActual === totalPaginasCalculadas ? 'not-allowed' : 'pointer', color: textDark }}>&gt;</button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL ELIMINAR PRODUCTO ================= */}
      {modalEliminar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', color: textDark }}>Eliminar producto</h3>
            <select value={productoAEliminar} onChange={(e) => setProductoAEliminar(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }}>
              <option value="">Seleccionar...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEliminar(false)} style={{ padding: '10px 20px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={eliminarProducto} style={{ padding: '10px 20px', backgroundColor: '#FCE8E6', color: '#C5221F', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ELIMINAR INSUMO ================= */}
      {modalEliminarInsumo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px', color: textDark }}>Eliminar insumo</h3>
            <select value={insumoAEliminar} onChange={(e) => setInsumoAEliminar(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }}>
              <option value="">Seleccionar...</option>
              {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalEliminarInsumo(false)} style={{ padding: '10px 20px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={eliminarInsumo} style={{ padding: '10px 20px', backgroundColor: '#FCE8E6', color: '#C5221F', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PANEL NUEVO PRODUCTO ================= */}
      {panelAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, padding: '30px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ color: textDark, margin: 0 }}>Nuevo producto</h2>
              <button onClick={() => setPanelAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Nombre</label>
              <input type="text" placeholder="Ej. Medialuna" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Stock inicial</label>
                <input type="number" placeholder="Ej. 15" value={nuevoProducto.stock} onChange={e => setNuevoProducto({...nuevoProducto, stock: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Unidad</label>
                <select value={nuevoProducto.unidadMedida} onChange={e => setNuevoProducto({...nuevoProducto, unidadMedida: e.target.value})} style={inputStyle}>
                  <option value="UNIDAD">un</option><option value="KG">kg</option><option value="GR">gr</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Vida útil</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" placeholder="Ej. 24" value={nuevoProducto.vidaUtilNum} onChange={e => setNuevoProducto({...nuevoProducto, vidaUtilNum: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                <select value={nuevoProducto.vidaUtilTipo} onChange={e => setNuevoProducto({...nuevoProducto, vidaUtilTipo: e.target.value})} style={{ ...inputStyle, width: '110px' }}>
                  <option value="horas">horas</option>
                  <option value="dias">días</option>
                  <option value="meses">meses</option>
                  <option value="año">año</option>
                </select>
              </div>
            </div>

            <button onClick={guardarProducto} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Guardar producto</button>
          </div>
        </div>
      )}

      {/* ================= PANEL NUEVO INSUMO ================= */}
      {panelInsumoAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, padding: '30px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ color: textDark, margin: 0 }}>Nuevo insumo</h2>
              <button onClick={() => setPanelInsumoAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Nombre</label>
              <input type="text" placeholder="Ej. Harina 000" value={nuevoInsumo.nombre} onChange={e => setNuevoInsumo({...nuevoInsumo, nombre: e.target.value})} style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Stock actual</label>
                <input type="number" placeholder="Ej. 25" value={nuevoInsumo.stockActual} onChange={e => setNuevoInsumo({...nuevoInsumo, stockActual: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Unidad</label>
                <select value={nuevoInsumo.unidadMedida} onChange={e => setNuevoInsumo({...nuevoInsumo, unidadMedida: e.target.value})} style={inputStyle}>
                  <option value="KG">kg</option><option value="LT">litro</option><option value="UNIDAD">un</option><option value="GR">gr</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Vida útil</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" placeholder="Ej. 6" value={nuevoInsumo.vidaUtilNum} onChange={e => setNuevoInsumo({...nuevoInsumo, vidaUtilNum: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                <select value={nuevoInsumo.vidaUtilTipo} onChange={e => setNuevoInsumo({...nuevoInsumo, vidaUtilTipo: e.target.value})} style={{ ...inputStyle, width: '110px' }}>
                  <option value="horas">horas</option>
                  <option value="dias">días</option>
                  <option value="meses">meses</option>
                  <option value="año">año</option>
                </select>
              </div>
            </div>

            <button onClick={guardarInsumo} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Guardar insumo</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Productos;