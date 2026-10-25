import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, obtenerUsuario, cerrarSesion, iniciales } from '../api';

function Productos() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const salir = () => { cerrarSesion(); navigate('/'); };
  const seccionActiva = 'productos';

  const [pestanaActiva, setPestanaActiva] = useState('productos'); 
  const [paginaActual, setPaginaActual] = useState(1);
  
  const [productos, setProductos] = useState([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', unidadMedida: 'UNIDAD', stock: '', priorizado: false, requiereReceta: true,
    insumos: [{ id: Date.now(), ingrediente: '', cantidad: '' }]
  });

  const [insumos, setInsumos] = useState([]);
  const [panelInsumoAbierto, setPanelInsumoAbierto] = useState(false);
  const [modoNuevoInsumo, setModoNuevoInsumo] = useState(false);
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: '', unidadMedida: 'KG', stockActual: '', fechaCompra: ''
  });

  const [modalBaja, setModalBaja] = useState({
    activo: false, tipo: '', id: null, itemOriginal: null, modo: 'parcial', cantidadParcial: '', unidad: ''
  });

  useEffect(() => {
    cargarProductos();
    cargarInsumos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await apiFetch('/api/productos');
      if (res.ok) {
        const data = await res.json();
        setProductos(data.map(p => ({
          id: p.id, nombre: p.nombre, unidad: p.unidadMedida ? p.unidadMedida.toLowerCase() : 'unidad',
          stock: p.stock || 0, minimo: p.stockMinimo || 0, priorizado: p.priorizado,
          estado: (p.stock || 0) <= (p.stockMinimo || 0) ? "Crítico" : "Óptimo"
        })));
      }
    } catch (err) { console.error("Error cargando productos", err); }
  };

  const cargarInsumos = async () => {
    try {
      const res = await apiFetch('/api/insumos');
      if (res.ok) {
        const data = await res.json();
        setInsumos(data.map(i => ({
          id: i.id, nombre: i.nombre, unidad: i.unidadMedida ? i.unidadMedida.toLowerCase() : 'kg',
          stock: i.stockActual || 0, fechaCompra: i.fechaCompra || '-',
          estado: (i.stockActual || 0) <= 5 ? "Crítico" : "Óptimo"
        })));
      }
    } catch (err) { console.error("Error cargando insumos", err); }
  };

  const guardarProducto = async () => {
    if (!nuevoProducto.nombre) { alert("Nombre requerido"); return; }
    
    const insumosRecetaMapeados = nuevoProducto.requiereReceta ? nuevoProducto.insumos.map(i => ({
      ingrediente: i.ingrediente, cantidad: parseFloat(i.cantidad) || 0
    })) : [];

    const productoParaBackend = {
      nombre: nuevoProducto.nombre, unidadMedida: nuevoProducto.unidadMedida, 
      stock: parseFloat(nuevoProducto.stock) || 0, priorizado: nuevoProducto.priorizado, 
      activo: true, insumos: insumosRecetaMapeados 
    };

    try {
      const res = await apiFetch('/api/productos', {
        method: 'POST',
        body: JSON.stringify(productoParaBackend)
      });
      if (res.ok) {
        cargarProductos();
        cargarInsumos(); 
        setPanelAbierto(false);
        setNuevoProducto({ nombre: '', unidadMedida: 'UNIDAD', stock: '', priorizado: false, requiereReceta: true, insumos: [{ id: Date.now(), ingrediente: '', cantidad: '' }] });
        alert("¡Producto guardado con éxito!");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "No se pudo guardar el producto.");
      }
    } catch (error) { alert("Error de conexión con el servidor."); }
  };

  const guardarInsumo = async () => {
    if (!nuevoInsumo.nombre || !nuevoInsumo.fechaCompra) { alert("Nombre y fecha de compra requeridos"); return; }
    
    const insumoParaBackend = {
      nombre: nuevoInsumo.nombre.trim(), 
      unidadMedida: nuevoInsumo.unidadMedida, 
      fechaCompra: nuevoInsumo.fechaCompra,
      stockActual: parseFloat(nuevoInsumo.stockActual) || 0
    };

    try {
      const res = await apiFetch('/api/insumos', {
        method: 'POST',
        body: JSON.stringify(insumoParaBackend)
      });
      if (res.ok) cargarInsumos();
    } catch (error) { console.error("Error guardando insumo"); }

    setPanelInsumoAbierto(false);
    setNuevoInsumo({ nombre: '', unidadMedida: 'KG', stockActual: '', fechaCompra: '' });
    setModoNuevoInsumo(false);
  };

  const abrirModalBaja = (tipo, item) => {
    setModalBaja({
      activo: true, tipo: tipo, id: item.id, itemOriginal: item, modo: 'parcial', 
      cantidadParcial: '', unidad: item.unidad.toUpperCase() === 'LITRO' ? 'LITRO' : item.unidad.toUpperCase()
    });
  };

  const confirmarBaja = async () => {
    const { tipo, id, modo, cantidadParcial, unidad, itemOriginal } = modalBaja;
    
    if (modo === 'total') {
      try {
        const res = await apiFetch(`/api/${tipo}s/${id}`, { method: 'DELETE' });
        if (res.ok) {
          tipo === 'producto' ? setProductos(productos.filter(p => p.id !== id)) : setInsumos(insumos.filter(i => i.id !== id));
          setModalBaja({ ...modalBaja, activo: false });
        }
      } catch (error) { console.error("Error eliminando", error); }
    } else {
      let cantDescontar = parseFloat(cantidadParcial) || 0;
      if (cantDescontar <= 0) { alert("Ingresá una cantidad válida"); return; }
      
      const baseUnit = itemOriginal.unidad.toLowerCase();
      const targetUnit = unidad.toLowerCase();
      
      if (baseUnit === 'kg' && targetUnit === 'gr') cantDescontar = cantDescontar / 1000;
      else if (baseUnit === 'gr' && targetUnit === 'kg') cantDescontar = cantDescontar * 1000;
      else if (baseUnit === 'litro' && targetUnit === 'ml') cantDescontar = cantDescontar / 1000;
      else if (baseUnit === 'ml' && targetUnit === 'litro') cantDescontar = cantDescontar * 1000;
      
      const nuevoStock = itemOriginal.stock - cantDescontar;
      if (nuevoStock < 0) { alert("El descuento ingresado es mayor al stock disponible."); return; }
      
      try {
        const res = await apiFetch(`/api/${tipo}s/${id}/stock?nuevoStock=${nuevoStock}`, { 
          method: 'PUT' 
        });
        if (res.ok) {
          tipo === 'producto' ? cargarProductos() : cargarInsumos();
          setModalBaja({ ...modalBaja, activo: false });
        }
      } catch (error) { console.error("Error actualizando stock", error); }
    }
  };

  const actualizarInsumoReceta = (id, campo, valor) => setNuevoProducto({ ...nuevoProducto, insumos: nuevoProducto.insumos.map(ins => ins.id === id ? { ...ins, [campo]: valor } : ins) });
  const agregarInsumoReceta = () => setNuevoProducto({ ...nuevoProducto, insumos: [...nuevoProducto.insumos, { id: Date.now(), ingrediente: '', cantidad: '' }] });
  const eliminarInsumoReceta = (id) => setNuevoProducto({ ...nuevoProducto, insumos: nuevoProducto.insumos.filter(ins => ins.id !== id) });

  const datosPaginados = pestanaActiva === 'productos' ? productos.slice((paginaActual - 1) * 5, paginaActual * 5) : insumos.slice((paginaActual - 1) * 5, paginaActual * 5);
  const totalItems = pestanaActiva === 'productos' ? productos.length : insumos.length;
  const totalPaginasCalculadas = Math.ceil(totalItems / 5) || 1;
  const getEstadoEstilo = (estado) => estado === 'Crítico' ? { bg: '#FCE8E6', color: '#C5221F' } : { bg: '#E6F4EA', color: '#137333' }; 
  
  const opcionesBase = ['harina', 'leche', 'huevo'];
  const nombresLimpiosDB = insumos.map(i => i.nombre.replace(/\s+\d+$/, '').trim().toLowerCase());
  const opcionesSelectInsumos = [...new Set([...opcionesBase, ...nombresLimpiosDB])];
  const nombresInsumosUnicos = [...new Set(insumos.map(i => i.nombre))];

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

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* BARRA LATERAL */}
      <div style={{ width: '260px', height: '100%', backgroundColor: bgApp, borderRight: `1px solid ${borderLight}`, display: 'flex', flexDirection: 'column', padding: '25px 20px', boxSizing: 'border-box', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ color: goldPrimary, fontSize: '1.8rem', fontWeight: 'bold' }}>(o)</span>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{usuario?.comercio?.nombre ?? 'Mi comercio'}</span>
            <span style={{ fontSize: '0.7rem', color: '#B89732', fontWeight: 'bold' }}>PLAN BÁSICO</span>
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#A0A0A0', fontWeight: 'bold', marginBottom: '10px', paddingLeft: '10px' }}>ESPACIO DE TRABAJO</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuSidebar.map((item) => (
            <div key={item.id} onClick={() => item.ruta !== '#' && navigate(item.ruta)} style={{ padding: '10px 12px', borderRadius: '20px', cursor: 'pointer', backgroundColor: seccionActiva === item.id ? goldLight : 'transparent', color: seccionActiva === item.id ? '#1A1A1A' : textGray, fontWeight: seccionActiva === item.id ? 'bold' : '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ opacity: seccionActiva === item.id ? 1 : 0.6 }}>{item.icon}</span> {item.label}</div>
              {item.badge && <span style={{ backgroundColor: goldPrimary, color: '#FFF', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${borderLight}`, paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1A1A1A', fontSize: '0.9rem', flexShrink: 0 }}>{iniciales(usuario?.nombre)}</div>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{usuario?.nombre}</span>
            <span onClick={salir} style={{ fontSize: '0.8rem', color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar sesión</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Inventario</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Gestioná tus productos a la venta e insumos de stock.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '30px', borderBottom: `2px solid ${borderLight}`, marginBottom: '25px' }}>
          <div onClick={() => { setPestanaActiva('productos'); setPaginaActual(1); }} style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'productos' ? 'bold' : '500', color: pestanaActiva === 'productos' ? textDark : textGray, borderBottom: pestanaActiva === 'productos' ? `3px solid ${goldPrimary}` : '3px solid transparent' }}>Productos</div>
          <div onClick={() => { setPestanaActiva('insumos'); setPaginaActual(1); }} style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'insumos' ? 'bold' : '500', color: pestanaActiva === 'insumos' ? textDark : textGray, borderBottom: pestanaActiva === 'insumos' ? `3px solid ${goldPrimary}` : '3px solid transparent' }}>Insumos</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={() => pestanaActiva === 'productos' ? setPanelAbierto(true) : setPanelInsumoAbierto(true)} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> Nuevo {pestanaActiva === 'productos' ? 'producto' : 'insumo'}
          </button>
        </div>

        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'left' }}>{pestanaActiva === 'productos' ? 'PRODUCTO' : 'INSUMO'}</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>{pestanaActiva === 'productos' ? 'STOCK' : 'STOCK ACTUAL'}</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>UNIDAD</th>
                {pestanaActiva === 'insumos' && <th style={{ padding: '20px', fontWeight: 'bold' }}>FECHA DE COMPRA</th>}
                {pestanaActiva === 'productos' && <th style={{ padding: '20px', fontWeight: 'bold' }}>MÍNIMO</th>}
                {pestanaActiva === 'productos' && <th style={{ padding: '20px', fontWeight: 'bold' }}>PRIORIZADO</th>}
                <th style={{ padding: '20px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'right' }}>ACCIONES</th>
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
                    {pestanaActiva === 'insumos' && <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.fechaCompra}</td>}
                    {pestanaActiva === 'productos' && <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.minimo}</td>}
                    {pestanaActiva === 'productos' && <td style={{ padding: '20px', fontSize: '1.2rem', color: item.priorizado ? '#D4AF37' : '#D1CFC8' }}>{item.priorizado ? '★' : '☆'}</td>}
                    <td style={{ padding: '20px', textAlign: 'right' }}><span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>{item.estado}</span></td>
                    <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                      <button onClick={() => abrirModalBaja(pestanaActiva === 'productos' ? 'producto' : 'insumo', item)} style={{ background: 'none', border: 'none', color: '#C5221F', cursor: 'pointer', fontSize: '1.2rem' }} title="Dar de baja">🗑️</button>
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

      {/* MODAL BAJA DE INVENTARIO */}
      {modalBaja.activo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: bgCard, width: '450px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 20px 0' }}>Baja de inventario</h3>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: textDark }}>
                <input type="radio" checked={modalBaja.modo === 'parcial'} onChange={() => setModalBaja({...modalBaja, modo: 'parcial'})} style={{ accentColor: goldPrimary, width: '16px', height: '16px' }} />
                Descontar stock
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: textDark }}>
                <input type="radio" checked={modalBaja.modo === 'total'} onChange={() => setModalBaja({...modalBaja, modo: 'total'})} style={{ accentColor: goldPrimary, width: '16px', height: '16px' }} />
                Eliminar por completo
              </label>
            </div>

            {modalBaja.modo === 'parcial' ? (
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', padding: '15px', backgroundColor: '#F9F9F9', borderRadius: '8px', border: `1px solid ${borderLight}` }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Cantidad a descontar</label>
                  <input type="number" value={modalBaja.cantidadParcial} onChange={e => setModalBaja({...modalBaja, cantidadParcial: e.target.value})} style={inputStyle} placeholder="Ej. 2" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Unidad</label>
                  <select value={modalBaja.unidad} onChange={e => setModalBaja({...modalBaja, unidad: e.target.value})} style={inputStyle}>
                    <option value="KG">kg</option>
                    <option value="GR">gr</option>
                    <option value="LITRO">litro</option>
                    <option value="ML">ml</option>
                    <option value="UNIDAD">un</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ padding: '15px', backgroundColor: '#FCE8E6', color: '#C5221F', borderRadius: '8px', marginBottom: '25px', fontSize: '0.9rem' }}>
                Se eliminará todo este lote de "<b>{modalBaja.itemOriginal.nombre}</b>".
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalBaja({...modalBaja, activo: false})} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarBaja} style={{ padding: '10px 20px', backgroundColor: modalBaja.modo === 'total' ? '#C5221F' : '#F4D06F', color: modalBaja.modo === 'total' ? '#FFF' : '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar baja</button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL NUEVO PRODUCTO */}
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

            <hr style={{ border: 'none', borderTop: `1px solid ${borderLight}`, margin: '25px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input type="checkbox" checked={nuevoProducto.requiereReceta} onChange={(e) => setNuevoProducto({...nuevoProducto, requiereReceta: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: goldPrimary }} />
              <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: textDark }}>Requiere preparación</label>
            </div>

            {nuevoProducto.requiereReceta && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F9F9F9', borderRadius: '8px', border: `1px solid ${borderLight}` }}>
                <label style={{ fontSize: '0.85rem', color: textGray, display: 'block', marginBottom: '15px' }}>Insumos necesarios por unidad/kg:</label>
                
                {nuevoProducto.insumos.map((ins) => (
                  <div key={ins.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select value={ins.ingrediente} onChange={(e) => actualizarInsumoReceta(ins.id, 'ingrediente', e.target.value)} style={{ ...inputStyle, flex: 2 }}>
                      <option value="">Seleccionar insumo...</option>
                      {nombresInsumosUnicos.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
                    </select>
                    <input type="number" placeholder="Cant." value={ins.cantidad} onChange={(e) => actualizarInsumoReceta(ins.id, 'cantidad', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    {nuevoProducto.insumos.length > 1 && (
                      <button onClick={() => eliminarInsumoReceta(ins.id)} style={{ background: 'none', border: 'none', color: '#C5221F', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>×</button>
                    )}
                  </div>
                ))}
                <span onClick={agregarInsumoReceta} style={{ color: '#D4AF37', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block', marginTop: '10px' }}>+ Agregar otro insumo</span>
              </div>
            )}
            <button onClick={guardarProducto} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Guardar producto</button>
          </div>
        </div>
      )}

      {/* PANEL NUEVO INSUMO */}
      {panelInsumoAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, padding: '30px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ color: textDark, margin: 0 }}>Nuevo insumo</h2>
              <button onClick={() => { setPanelInsumoAbierto(false); setModoNuevoInsumo(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input type="checkbox" checked={modoNuevoInsumo} onChange={e => { setModoNuevoInsumo(e.target.checked); setNuevoInsumo({...nuevoInsumo, nombre: ''}); }} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: goldPrimary }} />
              <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: textDark }}>Agregar nuevo tipo de insumo</label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Nombre</label>
              {!modoNuevoInsumo ? (
                <select value={nuevoInsumo.nombre} onChange={e => setNuevoInsumo({...nuevoInsumo, nombre: e.target.value})} style={{ ...inputStyle, textTransform: 'capitalize' }}>
                  <option value="">Seleccionar...</option>
                  {opcionesSelectInsumos.map(opt => <option key={opt} value={opt} style={{textTransform: 'capitalize'}}>{opt}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Ej. Levadura" value={nuevoInsumo.nombre} onChange={e => setNuevoInsumo({...nuevoInsumo, nombre: e.target.value})} style={inputStyle} />
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Stock inicial</label>
                <input type="number" placeholder="Ej. 25" value={nuevoInsumo.stockActual} onChange={e => setNuevoInsumo({...nuevoInsumo, stockActual: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Unidad</label>
                <select value={nuevoInsumo.unidadMedida} onChange={e => setNuevoInsumo({...nuevoInsumo, unidadMedida: e.target.value})} style={inputStyle}>
                  <option value="KG">kg</option><option value="LITRO">litro</option><option value="UNIDAD">un</option><option value="GR">gr</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Fecha de compra</label>
              <input type="date" value={nuevoInsumo.fechaCompra} onChange={e => setNuevoInsumo({...nuevoInsumo, fechaCompra: e.target.value})} style={inputStyle} />
            </div>
            <button onClick={guardarInsumo} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Guardar insumo</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;