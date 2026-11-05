import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import {
  unidadCorta, etiquetaModalidad, formatearCantidad, cantidadConUnidad, fechaCorta, formatearMomento,
  MOTIVOS_AJUSTE_STOCK, TIPOS_MOVIMIENTO
} from '../utils/productos';

const POR_PAGINA = 8;

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

// Sin stock / Bajo (llegó al mínimo) / OK
const estadoDe = (p) => {
  if (p.stock <= 0) return 'Sin stock';
  if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) return 'Bajo';
  return 'OK';
};
const estiloEstado = {
  'Sin stock': { bg: '#FCE8E6', color: '#C5221F' },
  'Bajo': { bg: '#FEF7E0', color: '#B06000' },
  'OK': { bg: '#E6F4EA', color: '#137333' }
};

// Inventario: cuánto hay de cada producto activo del catálogo.
// El stock sube con Ingresos y baja con Ventas y Desechos; acá se corrige el conteo y se ve por qué cambió.
function Productos() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [programados, setProgramados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [aviso, setAviso] = useState(null);
  const [ajuste, setAjuste] = useState(null); // null = modal cerrado; si no, { producto, nuevoStock, motivo, observaciones }
  const [errorAjuste, setErrorAjuste] = useState('');
  const [historial, setHistorial] = useState(null); // null = cerrado; si no, { producto, movimientos, cargando, error }
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const [res, resProgramados] = await Promise.all([apiFetch('/api/productos'), apiFetch('/api/ingresos-programados')]);
        if (!vigente) return;
        if (!res.ok) {
          setErrorCarga(await leerMensajeError(res, 'No se pudo cargar el inventario.'));
        } else {
          const data = await res.json();
          const pendientes = resProgramados.ok ? await resProgramados.json() : [];
          if (!vigente) return;
          setErrorCarga('');
          setProductos(data.filter(p => p.activo && p.controlaStock !== false).sort((a, b) => a.nombre.localeCompare(b.nombre)));
          setProgramados(pendientes);
        }
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [version]);

  const abrirAjuste = (p) => { setErrorAjuste(''); setAjuste({ producto: p, nuevoStock: String(p.stock), motivo: 'CONTEO', observaciones: '' }); };

  const confirmarAjuste = async () => {
    const nuevo = parseFloat(ajuste.nuevoStock);
    if (ajuste.nuevoStock === '' || Number.isNaN(nuevo) || nuevo < 0) { setErrorAjuste('Ingresá una cantidad válida (0 o más).'); return; }
    try {
      const parametros = new URLSearchParams({ nuevoStock: String(nuevo), motivo: ajuste.motivo });
      if (ajuste.observaciones.trim()) parametros.set('observaciones', ajuste.observaciones.trim());
      const res = await apiFetch(`/api/productos/${ajuste.producto.id}/stock?${parametros}`, { method: 'PUT' });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: `Stock de ${ajuste.producto.nombre} corregido a ${cantidadConUnidad(nuevo, ajuste.producto.unidadMedida)}.` });
        setAjuste(null);
        setVersion(v => v + 1);
      } else {
        setErrorAjuste(await leerMensajeError(res, 'No se pudo corregir el stock.'));
      }
    } catch {
      setErrorAjuste(MENSAJE_SIN_CONEXION);
    }
  };

  const abrirHistorial = async (p) => {
    setHistorial({ producto: p, movimientos: [], cargando: true, error: '' });
    try {
      const res = await apiFetch(`/api/productos/${p.id}/movimientos`);
      if (res.ok) setHistorial({ producto: p, movimientos: await res.json(), cargando: false, error: '' });
      else setHistorial({ producto: p, movimientos: [], cargando: false, error: await leerMensajeError(res, 'No se pudieron cargar los movimientos.') });
    } catch {
      setHistorial({ producto: p, movimientos: [], cargando: false, error: MENSAJE_SIN_CONEXION });
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(productos.length / POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas);
  const datosPaginados = productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const cantidadBajos = productos.filter(p => estadoDe(p) !== 'OK').length;

  const proximoIngreso = (id) => programados.find(i => i.producto.id === id);

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark };
  const botonFila = { padding: '7px 14px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' };

  return (
    <Pantalla seccion="productos">
      <div className="fila-cabecera" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Inventario</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>Cuánto tenés de cada producto en este momento.</p>
        </div>
        <div className="cabecera-acciones">
          <button onClick={() => navigate('/catalogo')} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
            📋 Ir al Catálogo
          </button>
          <BotonAlertas />
        </div>
      </div>

      <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <span style={{ color: '#665324', fontSize: '0.95rem' }}>
          El stock <strong>sube</strong> cuando cargás Ingresos y <strong>baja</strong> con Ventas y Desechos. Usá <strong>Ajustar</strong> solo si el conteo no coincide, y <strong>Movimientos</strong> para ver por qué cambió.
        </span>
      </div>

      <Aviso aviso={aviso} />
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0 20px', marginBottom: '30px' }}>
        <div className="tabla-contenedor">
          <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 10px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold' }}>MODALIDAD</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold' }}>STOCK</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold' }}>MÍNIMO</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold' }}>ESTADO</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold' }}>PRÓXIMO INGRESO</th>
                <th style={{ padding: '20px 10px', fontWeight: 'bold', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={7} style={{ padding: '40px', color: textGray }}>Cargando...</td></tr>}
              {!cargando && !errorCarga && productos.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px', color: textGray }}>
                  <MensajeVacio>
                    Todavía no hay productos con stock.{' '}
                    <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</button>
                  </MensajeVacio>
                </td></tr>
              )}
              {!cargando && !errorCarga && datosPaginados.map((item, index) => {
                const estado = estadoDe(item);
                const badge = estiloEstado[estado];
                const proximo = proximoIngreso(item.id);
                return (
                  <tr key={item.id} style={{ borderBottom: index === datosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td className="tarjeta-titulo" style={{ padding: '18px 10px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>{item.nombre}</td>
                    <td data-label="MODALIDAD" style={{ padding: '18px 10px', color: textGray, fontSize: '0.9rem' }}>{etiquetaModalidad(item.modalidad)}</td>
                    <td data-label="STOCK" style={{ padding: '18px 10px', fontWeight: 'bold', color: textDark, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                      <span>{formatearCantidad(item.stock)} <span style={{ fontWeight: 'normal', color: textGray, fontSize: '0.85rem' }}>{unidadCorta(item.unidadMedida, item.stock)}</span></span>
                    </td>
                    <td data-label="MÍNIMO" style={{ padding: '18px 10px', color: textGray, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{item.stockMinimo > 0 ? cantidadConUnidad(item.stockMinimo, item.unidadMedida) : '—'}</td>
                    <td data-label="ESTADO" style={{ padding: '18px 10px' }}><span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>{estado}</span></td>
                    <td data-label="PRÓXIMO INGRESO" style={{ padding: '18px 10px', color: textGray, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{proximo ? `+${cantidadConUnidad(proximo.cantidad, item.unidadMedida)} el ${fechaCorta(proximo.fecha)}` : '—'}</td>
                    <td style={{ padding: '18px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', gap: '8px' }}>
                        <button onClick={() => abrirHistorial(item)} style={botonFila}>Movimientos</button>
                        <button onClick={() => abrirAjuste(item)} style={botonFila}>Ajustar</button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '15px 10px', borderTop: `1px solid ${borderLight}` }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            {productos.length} producto{productos.length === 1 ? '' : 's'}
            {cantidadBajos > 0 && <> · <span style={{ color: '#B06000', fontWeight: 'bold' }}>{cantidadBajos} con stock bajo o sin stock</span></>}
            {' '}· Página {pagina} de {totalPaginas}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setPaginaActual(Math.max(pagina - 1, 1))} disabled={pagina === 1} aria-label="Página anterior" style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === 1 ? '#F5F5F5' : bgCard, cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: textGray }}>&lt;</button>
            <button onClick={() => setPaginaActual(Math.min(pagina + 1, totalPaginas))} disabled={pagina === totalPaginas} aria-label="Página siguiente" style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === totalPaginas ? '#F5F5F5' : bgCard, cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* MODAL AJUSTE DE STOCK */}
      {ajuste && (
        <div className="modal-fondo">
          <div className="modal-caja" role="dialog" aria-modal="true" aria-label="Ajustar stock" style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0' }}>Ajustar stock</h3>
            <p style={{ color: textGray, fontSize: '0.92rem', margin: '0 0 20px 0' }}>
              <strong style={{ color: textDark }}>{ajuste.producto.nombre}</strong> · el sistema tiene {cantidadConUnidad(ajuste.producto.stock, ajuste.producto.unidadMedida)}.
            </p>

            <label htmlFor="ajuste-cantidad" style={labelStyle}>Cantidad real contada</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input id="ajuste-cantidad" type="number" min="0" step="any" value={ajuste.nuevoStock} onChange={e => setAjuste({ ...ajuste, nuevoStock: e.target.value })} style={inputStyle} autoFocus />
              <span style={{ color: textGray }}>{unidadCorta(ajuste.producto.unidadMedida)}</span>
            </div>

            <label htmlFor="ajuste-motivo" style={labelStyle}>Motivo</label>
            <select id="ajuste-motivo" value={ajuste.motivo} onChange={e => setAjuste({ ...ajuste, motivo: e.target.value })} style={{ ...inputStyle, cursor: 'pointer', marginBottom: '15px' }}>
              {MOTIVOS_AJUSTE_STOCK.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </select>

            <label htmlFor="ajuste-observaciones" style={labelStyle}>Observaciones (opcional)</label>
            <input id="ajuste-observaciones" type="text" maxLength={200} value={ajuste.observaciones} onChange={e => setAjuste({ ...ajuste, observaciones: e.target.value })} style={inputStyle} />

            {errorAjuste && <p role="alert" style={{ color: '#C5221F', fontSize: '0.88rem', margin: '10px 0 0 0' }}>{errorAjuste}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setAjuste(null)} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarAjuste} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar ajuste</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTOS */}
      {historial && (
        <div className="modal-fondo">
          <div className="modal-caja" role="dialog" aria-modal="true" aria-label="Movimientos de stock" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', margin: '0 0 5px 0' }}>Movimientos de {historial.producto.nombre}</h3>
                <p style={{ color: textGray, fontSize: '0.9rem' }}>Por qué cambió el stock. Se muestran los últimos 100.</p>
              </div>
              <button onClick={() => setHistorial(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>
            {historial.cargando && <p style={{ color: textGray }}>Cargando...</p>}
            {historial.error && <p role="alert" style={{ color: '#C5221F', fontSize: '0.9rem' }}>{historial.error}</p>}
            {!historial.cargando && !historial.error && historial.movimientos.length === 0 && (
              <p style={{ color: textGray }}>Todavía no hay movimientos. Los que se carguen desde ahora aparecen acá.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {historial.movimientos.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${borderLight}` }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: '600', color: textDark, fontSize: '0.92rem', display: 'block' }}>{TIPOS_MOVIMIENTO[m.tipo] ?? m.tipo}</span>
                    {m.detalle && <span style={{ color: textGray, fontSize: '0.85rem', display: 'block' }}>{m.detalle}</span>}
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{formatearMomento(m.momento)} · para el día {fechaCorta(m.fecha)}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'block', color: m.cantidad >= 0 ? '#137333' : '#C5221F' }}>{m.cantidad > 0 ? '+' : ''}{formatearCantidad(m.cantidad)}</span>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>quedó en {formatearCantidad(m.stockResultante)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Pantalla>
  );
}

export default Productos;
