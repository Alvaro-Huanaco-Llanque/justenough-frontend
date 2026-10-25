import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, obtenerUsuario, cerrarSesion, iniciales } from '../api';

function Ventas() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const salir = () => { cerrarSesion(); navigate('/'); };
  const seccionActiva = 'ventas';

  const hoyLocal = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(hoyLocal);
  const [pestanaActiva, setPestanaActiva] = useState('ventas'); // 'ventas' o 'inventario'
  
  const [productos, setProductos] = useState([]);
  const [registros, setRegistros] = useState([]);
  
  const [ventas, setVentas] = useState([{ id: Date.now(), productoId: '', cantidad: '', unidad: '' }]);
  const [preciosInput, setPreciosInput] = useState({}); // Estado para editar precios
  const [guardando, setGuardando] = useState(false);
  const [fechasExpandidas, setFechasExpandidas] = useState({});

  useEffect(() => {
    cargarProductos();
    cargarRegistros();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await apiFetch('/api/productos');
      if (res.ok) {
        const data = await res.json();
        const activos = data.filter(p => p.activo);
        setProductos(activos);
        
        // Inicializamos los inputs de precios con lo que viene de la BD
        const objPrecios = {};
        activos.forEach(p => objPrecios[p.id] = p.precioVenta || 0);
        setPreciosInput(objPrecios);
      }
    } catch (err) { console.error("Error cargando productos", err); }
  };

  const cargarRegistros = async () => {
    try {
      const res = await apiFetch('/api/registros-diarios');
      if (res.ok) setRegistros(await res.json());
    } catch (err) { console.error("Error cargando registros", err); }
  };

  // ================= MANEJO DE VENTAS =================
  const agregarFilaVenta = () => setVentas([...ventas, { id: Date.now(), productoId: '', cantidad: '', unidad: '' }]);
  
  const actualizarFilaVenta = (id, campo, valor) => {
    setVentas(ventas.map(v => {
      if (v.id === id) {
        const nuevaVenta = { ...v, [campo]: valor };
        if (campo === 'productoId') {
          const prod = productos.find(p => p.id.toString() === valor);
          nuevaVenta.unidad = prod ? prod.unidadMedida : '';
        }
        return nuevaVenta;
      }
      return v;
    }));
  };

  const eliminarFilaVenta = (id) => setVentas(ventas.filter(v => v.id !== id));

  const guardarVentasDelDia = async () => {
    const ventasAEnviar = {};
    let hayVentasValidas = false;

    ventas.forEach(v => {
      if (v.productoId && v.cantidad > 0) {
        hayVentasValidas = true;
        const prod = productos.find(p => p.id.toString() === v.productoId);
        let cantConvertida = parseFloat(v.cantidad);
        
        if (prod && v.unidad) {
          const baseUnit = prod.unidadMedida.toLowerCase();
          const targetUnit = v.unidad.toLowerCase();
          if (baseUnit === 'kg' && targetUnit === 'gr') cantConvertida /= 1000;
          else if (baseUnit === 'gr' && targetUnit === 'kg') cantConvertida *= 1000;
          else if (baseUnit === 'litro' && targetUnit === 'ml') cantConvertida /= 1000;
          else if (baseUnit === 'ml' && targetUnit === 'litro') cantConvertida *= 1000;
        }

        const actual = ventasAEnviar[v.productoId] || 0;
        ventasAEnviar[v.productoId] = actual + cantConvertida;
      }
    });
    
    if (!hayVentasValidas) { alert("Completá al menos un producto para guardar."); return; }

    setGuardando(true);
    try {
      const res = await apiFetch('/api/registros-diarios/ventas-batch', {
        method: 'POST',
        body: JSON.stringify({ fecha: fecha, ventas: ventasAEnviar })
      });
      if (res.ok) {
        alert("¡Ventas registradas con éxito!");
        setVentas([{ id: Date.now(), productoId: '', cantidad: '', unidad: '' }]); 
        cargarRegistros(); 
      } else {
        const err = await res.json();
        alert(err.message || "Error al guardar las ventas");
      }
    } catch (error) { alert("Error de conexión con el servidor."); }
    setGuardando(false);
  };

  // ================= MANEJO DE PRECIOS =================
  const guardarPrecioUnico = async (id) => {
    const nuevoPrecio = parseFloat(preciosInput[id]) || 0;
    try {
      const res = await apiFetch(`/api/productos/${id}/precio?nuevoPrecio=${nuevoPrecio}`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert("Precio actualizado");
        cargarProductos();
      }
    } catch (error) { console.error("Error guardando precio", error); }
  };

  // ================= KPIs E HISTORIAL =================
  const toggleHistorial = (fechaKey) => setFechasExpandidas({ ...fechasExpandidas, [fechaKey]: !fechasExpandidas[fechaKey] });

  const registrosHoy = registros.filter(r => r.fecha === fecha);
  const unidadesHoy = registrosHoy.reduce((acc, r) => acc + r.cantidadVendida, 0);
  const gananciasHoy = registrosHoy.reduce((acc, r) => acc + (r.cantidadVendida * (r.producto?.precioVenta || 0)), 0);
  
  const hace7Dias = new Date(new Date(fecha).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
  const unidadesSemanaPasada = registros.filter(r => r.fecha === hace7Dias).reduce((acc, r) => acc + r.cantidadVendida, 0);
  let crecimiento = unidadesSemanaPasada > 0 ? (((unidadesHoy - unidadesSemanaPasada) / unidadesSemanaPasada) * 100).toFixed(1) : (unidadesHoy > 0 ? 100 : 0);

  const historialAgrupado = {};
  registros.forEach(reg => {
    if (reg.cantidadVendida > 0 && reg.producto) {
      if (!historialAgrupado[reg.fecha]) historialAgrupado[reg.fecha] = { fecha: reg.fecha, totalUds: 0, totalArs: 0, detalle: [] };
      historialAgrupado[reg.fecha].totalUds += reg.cantidadVendida;
      historialAgrupado[reg.fecha].totalArs += (reg.cantidadVendida * (reg.producto.precioVenta || 0));
      historialAgrupado[reg.fecha].detalle.push({ nombre: reg.producto.nombre, cant: reg.cantidadVendida });
    }
  });
  const historialArray = Object.values(historialAgrupado).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  const menuSidebar = [
    { id: 'principal', label: 'Principal', icon: '🏠', ruta: '/dashboard' },
    { id: 'producido', label: 'Producido / Compras', icon: '📦', ruta: '/producido' },
    { id: 'ventas', label: 'Ventas', icon: '📈', ruta: '/ventas' },
    { id: 'desechos', label: 'Desechos', icon: '🗑️', ruta: '/desechos' },
    { id: 'sugerencias', label: 'Sugerencias', icon: '✨', badge: 3, ruta: '/sugerencias' },
    { id: 'impacto', label: 'Impacto', icon: '📊', ruta: '/impacto' },
    { id: 'productos', label: 'Repositorio', icon: '⭐', ruta: '/productos' },
    { id: 'calendario', label: 'Calendario', icon: '📅', ruta: '/calendario' },
    { id: 'madurez', label: 'Madurez', icon: '🌱', ruta: '/madurez' },
  ];

  const bgApp = '#FAF9F6'; const bgCard = '#FFFFFF'; const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A'; const textGray = '#666666'; const goldPrimary = '#D4AF37'; const goldLight = '#F9EBBF';
  const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', outline: 'none' };

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
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Ventas e Ingresos</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Gestioná tus ventas diarias y lista de precios.</p>
          </div>
          {pestanaActiva === 'ventas' && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
              <span style={{ marginRight: '10px', color: textGray }}>📅</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }} />
            </div>
          )}
        </div>

        {/* PESTAÑAS */}
        <div style={{ display: 'flex', gap: '30px', borderBottom: `2px solid ${borderLight}`, marginBottom: '30px' }}>
          <div onClick={() => setPestanaActiva('ventas')} style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'ventas' ? 'bold' : '500', color: pestanaActiva === 'ventas' ? textDark : textGray, borderBottom: pestanaActiva === 'ventas' ? `3px solid ${goldPrimary}` : '3px solid transparent' }}>Carga de ventas</div>
          <div onClick={() => setPestanaActiva('inventario')} style={{ padding: '10px 5px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: pestanaActiva === 'inventario' ? 'bold' : '500', color: pestanaActiva === 'inventario' ? textDark : textGray, borderBottom: pestanaActiva === 'inventario' ? `3px solid ${goldPrimary}` : '3px solid transparent' }}>Inventario de precios</div>
        </div>

        {pestanaActiva === 'ventas' ? (
          <>
            {/* INDICADORES KPI */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1, backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧾</div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark }}>$ {gananciasHoy.toLocaleString('es-AR')}</div>
                  <div style={{ color: textGray, fontSize: '0.9rem', marginTop: '4px' }}>Ganancia ({unidadesHoy} uds. vendidas)</div>
                </div>
              </div>

              <div style={{ flex: 1, backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: crecimiento >= 0 ? '#E6F4EA' : '#FCE8E6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: crecimiento >= 0 ? '#137333' : '#C5221F' }}>
                  {crecimiento >= 0 ? '📈' : '📉'}
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark }}>{crecimiento > 0 ? '+' : ''}{crecimiento}%</div>
                  <div style={{ color: textGray, fontSize: '0.9rem', marginTop: '4px' }}>Crecimiento vs. la semana anterior</div>
                </div>
              </div>
            </div>

            {/* CARGA DE VENTAS MANUAL */}
            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 10px 0' }}>Carga de ventas</h2>
              <p style={{ color: textGray, margin: '0 0 25px 0', fontSize: '0.95rem' }}>Anotá los productos que se vendieron y la cantidad correspondiente.</p>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '15px 0', fontWeight: 'bold', width: '45%' }}>PRODUCTO</th>
                    <th style={{ padding: '15px 0', fontWeight: 'bold', width: '25%' }}>CANTIDAD</th>
                    <th style={{ padding: '15px 0', fontWeight: 'bold', width: '20%' }}>UNIDAD</th>
                    <th style={{ padding: '15px 0', fontWeight: 'bold', width: '10%', textAlign: 'center' }}>QUITAR</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta.id} style={{ borderBottom: `1px solid ${borderLight}` }}>
                      <td style={{ padding: '15px 0' }}>
                        <select value={venta.productoId} onChange={(e) => actualizarFilaVenta(venta.id, 'productoId', e.target.value)} style={{ ...inputStyle, width: '90%' }}>
                          <option value="">Seleccionar producto...</option>
                          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '15px 0' }}>
                        <input type="number" min="0" placeholder="Ej. 10" value={venta.cantidad} onChange={(e) => actualizarFilaVenta(venta.id, 'cantidad', e.target.value)} style={{ ...inputStyle, width: '80%' }} />
                      </td>
                      <td style={{ padding: '15px 0' }}>
                        <select value={venta.unidad} onChange={(e) => actualizarFilaVenta(venta.id, 'unidad', e.target.value)} style={{ ...inputStyle, width: '90%', textTransform: 'lowercase' }}>
                          <option value="">-</option><option value="UNIDAD">un</option><option value="KG">kg</option><option value="GR">gr</option><option value="LITRO">litro</option><option value="ML">ml</option>
                        </select>
                      </td>
                      <td style={{ padding: '15px 0', textAlign: 'center' }}>
                        {ventas.length > 1 && <button onClick={() => eliminarFilaVenta(venta.id)} style={{ background: 'none', border: 'none', color: '#C5221F', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span onClick={agregarFilaVenta} style={{ color: '#D4AF37', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Agregar otro producto vendido</span>
                <button onClick={guardarVentasDelDia} disabled={guardando} style={{ padding: '12px 25px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Guardar ventas'}
                </button>
              </div>
            </div>

            {/* HISTORIAL */}
            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 10px 0' }}>Historial de ventas</h2>
              <p style={{ color: textGray, margin: '0 0 25px 0', fontSize: '0.95rem' }}>Consultá el detalle de las cargas anteriores.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {historialArray.map((hist) => {
                  const expandido = fechasExpandidas[hist.fecha];
                  return (
                    <div key={hist.fecha} style={{ border: `1px solid ${borderLight}`, borderRadius: '12px', overflow: 'hidden' }}>
                      <div onClick={() => toggleHistorial(hist.fecha)} style={{ padding: '20px', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ fontSize: '1.2rem' }}>📅</div>
                          <div>
                            <div style={{ fontWeight: 'bold', color: textDark, fontSize: '1.05rem' }}>{hist.fecha}</div>
                            <div style={{ color: textGray, fontSize: '0.85rem', marginTop: '4px' }}>{hist.detalle.length} productos con ventas</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', color: '#137333', fontSize: '1.05rem' }}>$ {hist.totalArs.toLocaleString('es-AR')}</div>
                            <div style={{ color: textGray, fontSize: '0.85rem', marginTop: '4px' }}>{hist.totalUds} uds. vendidas</div>
                          </div>
                          <div style={{ color: textGray, fontSize: '1.2rem', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</div>
                        </div>
                      </div>
                      {expandido && (
                        <div style={{ padding: '20px', backgroundColor: '#FAF9F6', borderTop: `1px solid ${borderLight}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          {hist.detalle.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed #DCCDB8`, paddingBottom: '8px' }}>
                              <span style={{ color: textDark, fontWeight: '500', fontSize: '0.95rem' }}>{item.nombre}</span>
                              <span style={{ color: '#B89732', fontWeight: 'bold', fontSize: '0.95rem' }}>{item.cant} uds.</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {historialArray.length === 0 && <div style={{ color: textGray, textAlign: 'center', padding: '20px' }}>No hay ventas registradas en el historial.</div>}
              </div>
            </div>
          </>
        ) : (
          /* PESTAÑA DE INVENTARIO / LISTA DE PRECIOS */
          <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 10px 0' }}>Lista de precios</h2>
            <p style={{ color: textGray, margin: '0 0 25px 0', fontSize: '0.95rem' }}>Definí a qué precio vas a vender cada producto al público.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '15px 0', fontWeight: 'bold', width: '35%' }}>PRODUCTO</th>
                  <th style={{ padding: '15px 0', fontWeight: 'bold', width: '20%' }}>STOCK ACTUAL</th>
                  <th style={{ padding: '15px 0', fontWeight: 'bold', width: '25%' }}>PRECIO DE VENTA (ARS)</th>
                  <th style={{ padding: '15px 0', fontWeight: 'bold', width: '20%', textAlign: 'right' }}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod, index) => (
                  <tr key={prod.id} style={{ borderBottom: index === productos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td style={{ padding: '20px 0', color: textGray }}>{prod.stock} <span style={{textTransform: 'lowercase'}}>{prod.unidadMedida}</span></td>
                    <td style={{ padding: '20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: textGray }}>$</span>
                        <input 
                          type="number" 
                          min="0"
                          value={preciosInput[prod.id] !== undefined ? preciosInput[prod.id] : ''}
                          onChange={(e) => setPreciosInput({...preciosInput, [prod.id]: e.target.value})}
                          style={{ ...inputStyle, width: '120px' }} 
                        />
                      </div>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <button onClick={() => guardarPrecioUnico(prod.id)} style={{ padding: '8px 16px', backgroundColor: '#FDF8EC', color: '#B89732', border: `1px solid ${goldPrimary}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Guardar
                      </button>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: textGray }}>No tenés productos cargados en el repositorio.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ventas;