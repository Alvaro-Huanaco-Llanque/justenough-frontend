import { useState, useEffect } from 'react';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import ModalConfirmar from '../components/ModalConfirmar';
import { apiFetch, leerMensajeError, obtenerUsuario, MENSAJE_SIN_CONEXION } from '../api';
import { UNIDADES, MODALIDADES, unidadCorta, formatearPrecio, normalizarNombre } from '../utils/productos';

const PRODUCTO_VACIO = {
  nombre: '', unidadMedida: 'UNIDAD', modalidad: 'PRODUCIDO',
  precioVenta: '', costoUnitario: '', stockMinimo: '', stockInicial: '', activo: true, priorizado: false, controlaStock: true
};

const bgApp = '#FAF9F6'; const bgCard = '#FFFFFF'; const borderLight = '#EAE6DF';
const textDark = '#1A1A1A'; const textGray = '#666666'; const goldPrimary = '#D4AF37';

// Catálogo: la lista de comestibles que el comercio vende, con su modalidad y precios.
// Acá no se cuenta stock: eso se carga en Ingresos y se ve en Inventario.
function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [aviso, setAviso] = useState(null);
  const [panel, setPanel] = useState(null); // null = cerrado; si no, { id, ...campos }
  const [errorPanel, setErrorPanel] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null); // el producto que espera confirmación para eliminarse
  const [eliminando, setEliminando] = useState(false);

  // Cada vez que cambia "version" se vuelve a pedir el catálogo al backend
  const [version, setVersion] = useState(0);
  const recargar = () => setVersion(v => v + 1);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/productos');
        if (!vigente) return;
        if (res.ok) {
          const data = await res.json();
          if (!vigente) return;
          setErrorCarga('');
          setProductos(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        } else {
          setErrorCarga(await leerMensajeError(res, 'No se pudo cargar el catálogo.'));
        }
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [version]);

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 5000);
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
    activo: p.activo,
    controlaStock: p.controlaStock !== false,
    stock: parseFloat(p.stockInicial) || 0
  });

  // ================= CAMBIO RÁPIDO DE MODALIDAD (desde la tabla) =================
  const cambiarModalidad = async (producto, modalidad) => {
    try {
      const res = await apiFetch(`/api/productos/${producto.id}`, {
        method: 'PUT',
        body: JSON.stringify(aDatosBackend({ ...producto, modalidad }))
      });
      if (res.ok) {
        setProductos(productos.map(p => p.id === producto.id ? { ...p, modalidad } : p));
      } else {
        mostrarAviso('error', await leerMensajeError(res, 'No se pudo cambiar la modalidad.'));
      }
    } catch {
      mostrarAviso('error', MENSAJE_SIN_CONEXION);
    }
  };

  // ================= PANEL ALTA / EDICIÓN =================
  const abrirNuevo = () => {
    setErrorPanel('');
    // En un restaurante casi todo se prepara al momento: se propone así, y se puede cambiar
    const esRestaurante = obtenerUsuario()?.comercio?.rubro === 'RESTAURANTE';
    setPanel({ ...PRODUCTO_VACIO, controlaStock: !esRestaurante });
  };
  const abrirEdicion = (p) => {
    setErrorPanel('');
    setPanel({
      id: p.id, nombre: p.nombre, unidadMedida: p.unidadMedida, modalidad: p.modalidad,
      precioVenta: p.precioVenta, costoUnitario: p.costoUnitario, stockMinimo: p.stockMinimo,
      priorizado: p.priorizado, activo: p.activo, controlaStock: p.controlaStock !== false, stockActual: p.stock
    });
  };
  const cambiarCampo = (campo, valor) => setPanel({ ...panel, [campo]: valor });

  const guardarPanel = async () => {
    if (!panel.nombre.trim()) { setErrorPanel('El nombre es obligatorio.'); return; }
    if (!(parseFloat(panel.precioVenta) > 0)) { setErrorPanel('Poné el precio de venta: sin él no se pueden calcular los ingresos.'); return; }
    const buscado = normalizarNombre(panel.nombre);
    if (productos.some(p => p.id !== panel.id && normalizarNombre(p.nombre) === buscado)) {
      setErrorPanel('Ya hay un producto con ese nombre en el catálogo.');
      return;
    }

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
      setErrorPanel(MENSAJE_SIN_CONEXION);
    }
    setGuardando(false);
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      const res = await apiFetch(`/api/productos/${aEliminar.id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        mostrarAviso('ok', data.message);
        recargar();
      } else {
        mostrarAviso('error', await leerMensajeError(res, 'No se pudo eliminar el producto.'));
      }
    } catch {
      mostrarAviso('error', MENSAJE_SIN_CONEXION);
    }
    setEliminando(false);
    setAEliminar(null);
  };

  // ================= ESTILOS =================
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark };
  const ayuda = { fontSize: '0.8rem', color: '#888', display: 'block', marginTop: '6px' };
  const th = { padding: '18px 20px', fontWeight: 'bold', whiteSpace: 'nowrap' };
  const td = { padding: '16px 20px', fontSize: '0.95rem', color: textGray, whiteSpace: 'nowrap' };

  const activos = productos.filter(p => p.activo).length;
  // La unidad no se puede cambiar si ya hay stock: el backend también lo controla, porque además mira el historial
  const unidadBloqueada = panel?.id && panel.stockActual > 0;

  return (
    <Pantalla seccion="catalogo">
      <div className="fila-cabecera" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Catálogo</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>Los productos que vendés, cómo ingresan y cuánto cuestan.</p>
        </div>
        <div className="cabecera-acciones">
          <button onClick={abrirNuevo} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
            + Nuevo producto
          </button>
          <BotonAlertas />
        </div>
      </div>

      <Aviso aviso={aviso} />
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      <div className="tabla-contenedor" style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
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
            {!cargando && !errorCarga && productos.length === 0 && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '40px', whiteSpace: 'normal' }}>
                <MensajeVacio>Todavía no tenés productos en el catálogo. Empezá con <b>+ Nuevo producto</b> (ej: medialuna, scon, café).</MensajeVacio>
              </td></tr>
            )}
            {productos.map((p, i) => {
              const ganancia = (p.precioVenta || 0) - (p.costoUnitario || 0);
              return (
                <tr key={p.id} style={{ borderBottom: i === productos.length - 1 ? 'none' : `1px solid ${borderLight}`, opacity: p.activo ? 1 : 0.55 }}>
                  <td style={{ ...td, paddingLeft: '30px', fontWeight: '600', color: textDark, whiteSpace: 'normal' }}>
                    {p.nombre}
                    {p.controlaStock === false && <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: '#8A6D1C' }}>Se prepara al momento</span>}
                  </td>
                  <td style={td}>
                    <select aria-label={`Modalidad de ${p.nombre}`} value={p.modalidad} onChange={e => cambiarModalidad(p, e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '7px 10px', fontSize: '0.9rem', cursor: 'pointer' }}>
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
                  <td style={{ ...td, textAlign: 'right', paddingRight: '30px' }}>
                    <button onClick={() => abrirEdicion(p)} title="Editar" aria-label={`Editar ${p.nombre}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', marginRight: '6px' }}>✏️</button>
                    <button onClick={() => setAEliminar(p)} title="Eliminar" aria-label={`Eliminar ${p.nombre}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
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

      {/* PANEL ALTA / EDICIÓN */}
      {panel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 3000 }}>
          <div role="dialog" aria-modal="true" aria-label={panel.id ? 'Editar producto' : 'Nuevo producto'} style={{ position: 'absolute', top: 0, right: 0, width: '450px', maxWidth: '100%', height: '100%', backgroundColor: bgApp, padding: '30px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{panel.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setPanel(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="producto-nombre" style={labelStyle}>Nombre</label>
              <input id="producto-nombre" type="text" maxLength={100} placeholder="Ej. Medialuna" value={panel.nombre} onChange={e => cambiarCampo('nombre', e.target.value)} style={inputStyle} autoFocus />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="producto-modalidad" style={labelStyle}>Modalidad</label>
                <select id="producto-modalidad" value={panel.modalidad} onChange={e => cambiarCampo('modalidad', e.target.value)} style={inputStyle}>
                  {MODALIDADES.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="producto-unidad" style={labelStyle}>Se vende por</label>
                <select id="producto-unidad" value={panel.unidadMedida} disabled={Boolean(unidadBloqueada)} onChange={e => cambiarCampo('unidadMedida', e.target.value)} style={{ ...inputStyle, opacity: unidadBloqueada ? 0.6 : 1 }}>
                  {UNIDADES.map(u => <option key={u.valor} value={u.valor}>{u.etiqueta}</option>)}
                </select>
              </div>
            </div>
            {unidadBloqueada && <span style={{ ...ayuda, marginTop: '-8px', marginBottom: '15px' }}>La unidad no se puede cambiar porque ya hay stock cargado.</span>}

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="producto-precio" style={labelStyle}>Precio de venta ($)</label>
                <input id="producto-precio" type="number" min="0" step="any" placeholder="Ej. 1500" value={panel.precioVenta} onChange={e => cambiarCampo('precioVenta', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="producto-costo" style={labelStyle}>{panel.modalidad === 'COMPRADO' ? 'Costo de compra ($)' : 'Costo de producción ($)'}</label>
                <input id="producto-costo" type="number" min="0" step="any" placeholder="Ej. 600" value={panel.costoUnitario} onChange={e => cambiarCampo('costoUnitario', e.target.value)} style={inputStyle} />
              </div>
            </div>
            {!(parseFloat(panel.costoUnitario) > 0) && <span style={{ ...ayuda, marginTop: '-8px', marginBottom: '15px' }}>Sin costo no se puede calcular cuánta plata se pierde en desechos.</span>}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
              <input id="producto-almomento" type="checkbox" checked={panel.controlaStock === false} onChange={e => cambiarCampo('controlaStock', !e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: goldPrimary, flexShrink: 0 }} />
              <label htmlFor="producto-almomento" style={{ fontSize: '0.95rem', color: textDark, cursor: 'pointer' }}>
                Se prepara al momento
                <span style={{ ...ayuda, marginTop: '2px' }}>Café, platos, sándwiches: se vende sin llevar stock y no entra en Inventario, Desechos ni Sugerencias.</span>
              </label>
            </div>

            {panel.controlaStock !== false && (
              <>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  {!panel.id && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label htmlFor="producto-stock" style={labelStyle}>Stock inicial</label>
                      <input id="producto-stock" type="number" min="0" step="any" placeholder="Lo que tenés hoy" value={panel.stockInicial} onChange={e => cambiarCampo('stockInicial', e.target.value)} style={inputStyle} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label htmlFor="producto-minimo" style={labelStyle}>Stock mínimo</label>
                    <input id="producto-minimo" type="number" min="0" step="any" placeholder="Ej. 10" value={panel.stockMinimo} onChange={e => cambiarCampo('stockMinimo', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <span style={{ ...ayuda, marginTop: '-8px', marginBottom: '15px' }}>Cuando el stock llega a este número o baja de él, te avisamos.</span>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
                  <input id="producto-priorizado" type="checkbox" checked={Boolean(panel.priorizado)} onChange={e => cambiarCampo('priorizado', e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: goldPrimary, flexShrink: 0 }} />
                  <label htmlFor="producto-priorizado" style={{ fontSize: '0.95rem', color: textDark, cursor: 'pointer' }}>
                    No puede faltar
                    <span style={{ ...ayuda, marginTop: '2px' }}>Las sugerencias le suman un margen del 10%.</span>
                  </label>
                </div>
              </>
            )}

            {panel.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input id="activo" type="checkbox" checked={panel.activo} onChange={e => cambiarCampo('activo', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: goldPrimary }} />
                <label htmlFor="activo" style={{ fontSize: '0.95rem', color: textDark, cursor: 'pointer' }}>Activo (aparece en Ingresos, Ventas e Inventario)</label>
              </div>
            )}

            {errorPanel && <p role="alert" style={{ color: '#C5221F', fontSize: '0.9rem', margin: '10px 0 0 0' }}>{errorPanel}</p>}

            <button onClick={guardarPanel} disabled={guardando} style={{ width: '100%', padding: '15px', backgroundColor: '#F4D06F', color: '#665324', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', marginTop: '20px', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : panel.id ? 'Guardar cambios' : 'Agregar al catálogo'}
            </button>
          </div>
        </div>
      )}

      {aEliminar && (
        <ModalConfirmar
          titulo={`Eliminar ${aEliminar.nombre}`}
          textoConfirmar="Eliminar producto"
          procesando={eliminando}
          alCancelar={() => setAEliminar(null)}
          alConfirmar={eliminar}
        >
          ¿Querés eliminar este producto del catálogo? Si ya tiene ventas, ingresos o desechos cargados, se desactiva para conservar su historial.
        </ModalConfirmar>
      )}
    </Pantalla>
  );
}

export default Catalogo;
