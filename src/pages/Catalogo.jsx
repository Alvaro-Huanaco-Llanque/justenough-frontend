import { useState, useEffect } from 'react';
import BarraLateral from '../components/BarraLateral';
import { apiFetch, leerMensajeError } from '../api';
import { UNIDADES, MODALIDADES, unidadCorta, formatearPrecio } from '../utils/productos';

const PRODUCTO_VACIO = {
  nombre: '', unidadMedida: 'UNIDAD', modalidad: 'PRODUCIDO',
  precioVenta: '', costoUnitario: '', stockMinimo: '', activo: true
};

// Catálogo: la lista de comestibles que el comercio vende, con su modalidad y precios.
// Acá no se cuenta stock: eso se carga en Producido / Compras y se ve en Inventario.
function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [panel, setPanel] = useState(null); // null = cerrado; si no, { id, ...campos }
  const [errorPanel, setErrorPanel] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cada vez que cambia "version" se vuelve a pedir el catálogo al backend
  const [version, setVersion] = useState(0);
  const recargar = () => setVersion(v => v + 1);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/productos');
        if (res.ok) {
          const data = await res.json();
          setProductos(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }
      } catch {
        setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
      setCargando(false);
    };
    cargar();
  }, [version]);

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  };

  // El backend espera todos los datos del catálogo en cada edición
  const aDatosBackend = (p) => ({
    nombre: p.nombre,
    unidadMedida: p.unidadMedida,
    modalidad: p.modalidad,
    precioVenta: parseFloat(p.precioVenta) || 0,
    costoUnitario: parseFloat(p.costoUnitario) || 0,
    stockMinimo: parseFloat(p.stockMinimo) || 0,
    priorizado: Boolean(p.priorizado),
    activo: p.activo
  });

  // ================= CAMBIO RÁPIDO DE MODALIDAD (desde la tabla) =================
  const cambiarModalidad = async (producto, modalidad) => {
    const res = await apiFetch(`/api/productos/${producto.id}`, {
      method: 'PUT',
      body: JSON.stringify(aDatosBackend({ ...producto, modalidad }))
    });
    if (res.ok) {
      setProductos(productos.map(p => p.id === producto.id ? { ...p, modalidad } : p));
    } else {
      mostrarAviso('error', await leerMensajeError(res, 'No se pudo cambiar la modalidad.'));
    }
  };

  // ================= PANEL ALTA / EDICIÓN =================
  const abrirNuevo = () => { setErrorPanel(''); setPanel({ ...PRODUCTO_VACIO }); };
  const abrirEdicion = (p) => {
    setErrorPanel('');
    setPanel({
      id: p.id, nombre: p.nombre, unidadMedida: p.unidadMedida, modalidad: p.modalidad,
      precioVenta: p.precioVenta, costoUnitario: p.costoUnitario, stockMinimo: p.stockMinimo,
      priorizado: p.priorizado, activo: p.activo
    });
  };
  const cambiarCampo = (campo, valor) => setPanel({ ...panel, [campo]: valor });

  const guardarPanel = async () => {
    if (!panel.nombre.trim()) { setErrorPanel('El nombre es obligatorio.'); return; }
    const nombreRepetido = productos.some(p => p.id !== panel.id && p.nombre.trim().toLowerCase() === panel.nombre.trim().toLowerCase());
    if (nombreRepetido) { setErrorPanel('Ya hay un producto con ese nombre en el catálogo.'); return; }

    setGuardando(true);
    const esNuevo = !panel.id;
    try {
      const res = await apiFetch(esNuevo ? '/api/productos' : `/api/productos/${panel.id}`, {
        method: esNuevo ? 'POST' : 'PUT',
        body: JSON.stringify(aDatosBackend(panel))
      });
      if (res.ok) {
        setPanel(null);
        mostrarAviso('ok', esNuevo ? 'Producto agregado al catálogo.' : 'Cambios guardados.');
        recargar();
      } else {
        setErrorPanel(await leerMensajeError(res, 'No se pudo guardar el producto.'));
      }
    } catch {
      setErrorPanel('No se pudo conectar con el servidor.');
    }
    setGuardando(false);
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) return;
    const res = await apiFetch(`/api/productos/${p.id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      mostrarAviso(data.borrado ? 'ok' : 'error', data.message);
      recargar();
    } else {
      mostrarAviso('error', await leerMensajeError(res, 'No se pudo eliminar el producto.'));
    }
  };

  // ================= ESTILOS =================
  const bgApp = '#FAF9F6'; const bgCard = '#FFFFFF'; const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A'; const textGray = '#666666'; const goldPrimary = '#D4AF37';
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark };
  const th = { padding: '18px 20px', fontWeight: 'bold', whiteSpace: 'nowrap' };
  const td = { padding: '16px 20px', fontSize: '0.95rem', color: textGray, whiteSpace: 'nowrap' };

  const activos = productos.filter(p => p.activo).length;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="catalogo" />

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Catálogo</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Los productos que vendés, cómo ingresan y cuánto cuestan.</p>
          </div>
          <button onClick={abrirNuevo} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
            + Nuevo producto
          </button>
        </div>

        {aviso && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: aviso.tipo === 'ok' ? '#E6F4EA' : '#FEF7E0', color: aviso.tipo === 'ok' ? '#137333' : '#8A5A00' }}>
            {aviso.texto}
          </div>
        )}

        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ ...th, paddingLeft: '30px' }}>PRODUCTO</th>
                <th style={th}>MODALIDAD</th>
                <th style={th}>UNIDAD</th>
                <th style={{ ...th, textAlign: 'right' }}>PRECIO DE VENTA</th>
                <th style={{ ...th, textAlign: 'right' }}>COSTO</th>
                <th style={{ ...th, textAlign: 'right' }}>GANANCIA</th>
                <th style={{ ...th, textAlign: 'center' }}>ESTADO</th>
                <th style={{ ...th, textAlign: 'right', paddingRight: '30px' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '40px' }}>Cargando...</td></tr>
              )}
              {!cargando && productos.length === 0 && (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '40px' }}>
                  Todavía no tenés productos en el catálogo. Empezá con <b>+ Nuevo producto</b> (ej: medialuna, scon, cookie).
                </td></tr>
              )}
              {productos.map((p, i) => {
                const ganancia = (p.precioVenta || 0) - (p.costoUnitario || 0);
                return (
                  <tr key={p.id} style={{ borderBottom: i === productos.length - 1 ? 'none' : `1px solid ${borderLight}`, opacity: p.activo ? 1 : 0.55 }}>
                    <td style={{ ...td, paddingLeft: '30px', fontWeight: '600', color: textDark }}>{p.nombre}</td>
                    <td style={td}>
                      <select value={p.modalidad} onChange={e => cambiarModalidad(p, e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '7px 10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                        {MODALIDADES.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                      </select>
                    </td>
                    <td style={td}>{unidadCorta(p.unidadMedida)}</td>
                    <td style={{ ...td, textAlign: 'right', color: textDark, fontWeight: '600' }}>{formatearPrecio(p.precioVenta)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{formatearPrecio(p.costoUnitario)}</td>
                    <td style={{ ...td, textAlign: 'right', color: ganancia < 0 ? '#C5221F' : '#137333', fontWeight: '600' }}>{formatearPrecio(ganancia)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: p.activo ? '#E6F4EA' : '#F1F3F4', color: p.activo ? '#137333' : textGray }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', paddingRight: '30px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => abrirEdicion(p)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', marginRight: '6px' }}>✏️</button>
                      <button onClick={() => eliminar(p)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {productos.length > 0 && (
            <div style={{ padding: '15px 30px', borderTop: `1px solid ${borderLight}`, color: '#888', fontSize: '0.85rem' }}>
              {productos.length} producto{productos.length === 1 ? '' : 's'} en el catálogo · {activos} activo{activos === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </div>

      {/* PANEL ALTA / EDICIÓN */}
      {panel && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '450px', height: '100%', backgroundColor: bgApp, padding: '30px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ color: textDark, margin: 0 }}>{panel.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Nombre</label>
              <input type="text" placeholder="Ej. Medialuna" value={panel.nombre} onChange={e => cambiarCampo('nombre', e.target.value)} style={inputStyle} autoFocus />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelStyle}>Modalidad</label>
                <select value={panel.modalidad} onChange={e => cambiarCampo('modalidad', e.target.value)} style={inputStyle}>
                  {MODALIDADES.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelStyle}>Se vende por</label>
                <select value={panel.unidadMedida} onChange={e => cambiarCampo('unidadMedida', e.target.value)} style={inputStyle}>
                  {UNIDADES.map(u => <option key={u.valor} value={u.valor}>{u.etiqueta}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelStyle}>Precio de venta ($)</label>
                <input type="number" min="0" placeholder="Ej. 1500" value={panel.precioVenta} onChange={e => cambiarCampo('precioVenta', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelStyle}>{panel.modalidad === 'COMPRADO' ? 'Costo de compra ($)' : 'Costo de producción ($)'}</label>
                <input type="number" min="0" placeholder="Ej. 600" value={panel.costoUnitario} onChange={e => cambiarCampo('costoUnitario', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Stock mínimo</label>
              <input type="number" min="0" placeholder="Ej. 10" value={panel.stockMinimo} onChange={e => cambiarCampo('stockMinimo', e.target.value)} style={inputStyle} />
              <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginTop: '6px' }}>Si el stock baja de este número, Inventario lo marca como crítico.</span>
            </div>

            {panel.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input id="activo" type="checkbox" checked={panel.activo} onChange={e => cambiarCampo('activo', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: goldPrimary }} />
                <label htmlFor="activo" style={{ fontSize: '0.95rem', color: textDark, cursor: 'pointer' }}>Activo (aparece en Producido / Compras, Ventas e Inventario)</label>
              </div>
            )}

            {errorPanel && <p style={{ color: '#C5221F', fontSize: '0.9rem', margin: '10px 0 0 0' }}>{errorPanel}</p>}

            <button onClick={guardarPanel} disabled={guardando} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', marginTop: '20px', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : panel.id ? 'Guardar cambios' : 'Agregar al catálogo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogo;
