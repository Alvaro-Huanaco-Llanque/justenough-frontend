import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { BotonAlertas } from '../components/Alertas';
import ModalCorreccion from '../components/ModalCorreccion';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useAvisoSinGuardar, useFechaDeCarga } from '../utils/hooks';
import {
  UNIDADES, sumarDias, formatearFechaLarga, unidadCorta, cantidadConUnidad, resumirPorUnidad, formatearPrecio, formatearPorcentaje, DIAS_MAX_ATRAS
} from '../utils/productos';

// Conversión entre unidades de la misma familia (peso o volumen): cuántas unidades base tiene cada una
const EQUIVALENCIAS = { KG: { familia: 'peso', base: 1000 }, GRAMO: { familia: 'peso', base: 1 }, LITRO: { familia: 'volumen', base: 1000 }, ML: { familia: 'volumen', base: 1 } };

// Pasa una cantidad cargada en "unidadCargada" a la unidad en que se vende el producto.
// Devuelve null si no se puede convertir (ej: kilos a unidades).
function convertir(cantidad, unidadCargada, unidadProducto) {
  if (!unidadCargada || unidadCargada === unidadProducto) return cantidad;
  const origen = EQUIVALENCIAS[unidadCargada];
  const destino = EQUIVALENCIAS[unidadProducto];
  if (!origen || !destino || origen.familia !== destino.familia) return null;
  return cantidad * origen.base / destino.base;
}

let siguienteFila = 1;
const filaVacia = () => ({ id: siguienteFila++, productoId: '', cantidad: '', unidad: '' });

const DIAS_POR_TANDA = 30;

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';

// Precio del día guardado en el registro: cambiar el precio en el catálogo no reescribe lo que ya se vendió
const precioDe = (r) => r.precioVenta ?? r.producto?.precioVenta ?? 0;

function Ventas() {
  const [params] = useSearchParams();
  const [fecha, setFecha, hoy] = useFechaDeCarga(params.get('fecha'));

  const [productos, setProductos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [diasHistorial, setDiasHistorial] = useState(DIAS_POR_TANDA);

  const [ventas, setVentas] = useState(() => [filaVacia()]);
  const [guardando, setGuardando] = useState(false);
  const [fechasExpandidas, setFechasExpandidas] = useState({});
  const [aviso, setAviso] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [correccion, setCorreccion] = useState(null);
  const [version, setVersion] = useState(0);   // cambiarla vuelve a pedir productos y registros

  // Se piden los días que hacen falta: el historial visible y las dos semanas para comparar la fecha elegida
  const inicioHistorial = sumarDias(hoy, -diasHistorial);
  const inicioComparacion = sumarDias(fecha, -14);
  const desde = inicioComparacion < inicioHistorial ? inicioComparacion : inicioHistorial;

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const [resProductos, resRegistros] = await Promise.all([
          apiFetch('/api/productos'),
          apiFetch(`/api/registros-diarios?desde=${desde}&hasta=${hoy}`)
        ]);
        if (!vigente) return;
        if (!resProductos.ok || !resRegistros.ok) {
          setErrorCarga(await leerMensajeError(resProductos.ok ? resRegistros : resProductos, 'No se pudieron cargar las ventas.'));
          return;
        }
        const [lista, regs] = await Promise.all([resProductos.json(), resRegistros.json()]);
        if (!vigente) return;
        setErrorCarga('');
        setProductos(lista.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setRegistros(regs);
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
    };
    cargar();
    return () => { vigente = false; };
  }, [desde, hoy, version]);

  const hayFilasEscritas = ventas.some(v => v.productoId || v.cantidad);
  useAvisoSinGuardar(hayFilasEscritas, 'Tenés ventas sin guardar. ¿Salir igual?');

  const cambiarFecha = (nueva) => {
    if (hayFilasEscritas && !window.confirm('Tenés ventas sin guardar para esta fecha. ¿Cambiar de fecha igual?')) return;
    setAviso(null);
    setVentas([filaVacia()]);
    setFecha(nueva);
  };

  // ================= MANEJO DE VENTAS =================
  const agregarFilaVenta = () => setVentas([...ventas, filaVacia()]);

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
    const conProducto = ventas.filter(v => v.productoId);
    if (conProducto.length === 0 || conProducto.every(v => v.cantidad === '')) {
      setAviso({ tipo: 'error', texto: 'Completá al menos un producto para guardar.' });
      return;
    }
    for (const v of conProducto) {
      const prod = productos.find(p => p.id.toString() === v.productoId);
      const nombre = prod?.nombre ?? 'el producto';
      const cantidad = parseFloat(v.cantidad);
      if (Number.isNaN(cantidad) || cantidad <= 0) {
        setAviso({ tipo: 'error', texto: `La cantidad de ${nombre} tiene que ser mayor a 0.` });
        return;
      }
      const convertida = prod ? convertir(cantidad, v.unidad, prod.unidadMedida) : cantidad;
      if (convertida === null) {
        setAviso({ tipo: 'error', texto: `${nombre} se vende por ${unidadCorta(prod.unidadMedida, 1)}: no se puede cargar en ${unidadCorta(v.unidad)}.` });
        return;
      }
      ventasAEnviar[v.productoId] = (ventasAEnviar[v.productoId] || 0) + convertida;
    }

    setGuardando(true);
    try {
      const res = await apiFetch('/api/registros-diarios/ventas-batch', {
        method: 'POST',
        body: JSON.stringify({ fecha, ventas: ventasAEnviar })
      });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: 'Ventas registradas. Se sumaron a lo del día y el stock ya se descontó.' });
        setVentas([filaVacia()]);
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar las ventas.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
    setGuardando(false);
  };

  // ================= KPIs E HISTORIAL =================
  const toggleHistorial = (fechaKey) => setFechasExpandidas({ ...fechasExpandidas, [fechaKey]: !fechasExpandidas[fechaKey] });

  const ingresoEntre = (inicio, fin) => registros
    .filter(r => r.fecha >= inicio && r.fecha <= fin)
    .reduce((acc, r) => acc + r.cantidadVendida * precioDe(r), 0);

  const registrosFecha = registros.filter(r => r.fecha === fecha && r.cantidadVendida > 0);
  const resumenCantidadFecha = resumirPorUnidad(registrosFecha.map(r => ({ cantidad: r.cantidadVendida, unidadMedida: r.producto?.unidadMedida })));
  const ingresoFecha = ingresoEntre(fecha, fecha);

  // Últimos 7 días completos contra los 7 anteriores: hoy no cuenta porque todavía se está vendiendo
  const finPeriodo = fecha === hoy ? sumarDias(hoy, -1) : fecha;
  const ingresoSemana = ingresoEntre(sumarDias(finPeriodo, -6), finPeriodo);
  const ingresoAnterior = ingresoEntre(sumarDias(finPeriodo, -13), sumarDias(finPeriodo, -7));
  const crecimiento = ingresoAnterior > 0 ? ((ingresoSemana - ingresoAnterior) / ingresoAnterior) * 100 : null;

  const historialAgrupado = {};
  registros.forEach(reg => {
    if (reg.cantidadVendida > 0 && reg.producto && reg.fecha >= inicioHistorial) {
      if (!historialAgrupado[reg.fecha]) historialAgrupado[reg.fecha] = { fecha: reg.fecha, totalArs: 0, detalle: [] };
      const precio = precioDe(reg);
      historialAgrupado[reg.fecha].totalArs += reg.cantidadVendida * precio;
      historialAgrupado[reg.fecha].detalle.push({ producto: reg.producto, cant: reg.cantidadVendida, subtotal: reg.cantidadVendida * precio });
    }
  });
  const historialArray = Object.values(historialAgrupado).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
  const registroDe = (productoId) => registros.find(r => r.fecha === fecha && r.producto?.id.toString() === productoId);

  return (
    <Pantalla seccion="ventas">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Ventas</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>Registrá lo que vendiste. Cada carga se suma a lo del día.</p>
        </div>
        <div className="cabecera-acciones">
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
            <span style={{ marginRight: '10px', color: textGray }}>📅</span>
            <input type="date" aria-label="Fecha" value={fecha} min={sumarDias(hoy, -DIAS_MAX_ATRAS)} max={hoy} onChange={(e) => e.target.value && cambiarFecha(e.target.value)} style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }} />
          </div>
          <BotonAlertas />
        </div>
      </div>

      <Aviso aviso={aviso} />
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      {/* INDICADORES KPI: sin datos no se muestran, para no confundir un error con "no vendí nada" */}
      {!errorCarga && <div className="grilla-2" style={{ marginBottom: '30px' }}>
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🧾</div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: textDark }}>{formatearPrecio(ingresoFecha)}</div>
            <div style={{ color: textGray, fontSize: '0.9rem', marginTop: '4px' }}>{fecha === hoy ? 'Vendido hoy' : 'Vendido ese día'}: {resumenCantidadFecha}</div>
          </div>
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', backgroundColor: crecimiento === null || crecimiento >= 0 ? '#E6F4EA' : '#FCE8E6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            {crecimiento === null || crecimiento >= 0 ? '📈' : '📉'}
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: textDark }}>
              {crecimiento === null ? '—' : `${crecimiento > 0 ? '+' : ''}${formatearPorcentaje(crecimiento)}`}
            </div>
            <div style={{ color: textGray, fontSize: '0.9rem', marginTop: '4px' }}>
              {crecimiento === null ? 'Todavía no hay dos semanas para comparar' : 'Últimos 7 días contra los 7 anteriores'}
            </div>
          </div>
        </div>
      </div>}

      {/* CARGA DE VENTAS */}
      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.4rem', margin: '0 0 10px 0' }}>Cargar ventas del {formatearFechaLarga(fecha).toLowerCase()}</h2>
        <p style={{ color: textGray, margin: '0 0 25px 0', fontSize: '0.95rem' }}>Anotá solo lo que vendiste desde la última carga. Para arreglar un error usá "Corregir" más abajo.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {ventas.map((venta) => {
            const prod = productos.find(p => p.id.toString() === venta.productoId);
            const yaVendido = venta.productoId ? registroDe(venta.productoId)?.cantidadVendida ?? 0 : 0;
            return (
              <div key={venta.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${borderLight}` }}>
                <select aria-label="Producto vendido" value={venta.productoId} onChange={(e) => actualizarFilaVenta(venta.id, 'productoId', e.target.value)} style={{ ...inputStyle, flex: '3 1 220px', minWidth: 0 }}>
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.precioVenta ? ` — ${formatearPrecio(p.precioVenta)}` : ''}
                    </option>
                  ))}
                </select>
                <input type="number" min="0" step="any" placeholder="Cantidad" aria-label="Cantidad vendida" value={venta.cantidad} onChange={(e) => actualizarFilaVenta(venta.id, 'cantidad', e.target.value)} style={{ ...inputStyle, flex: '1 1 100px', minWidth: 0 }} />
                <select aria-label="Unidad" value={venta.unidad} onChange={(e) => actualizarFilaVenta(venta.id, 'unidad', e.target.value)} style={{ ...inputStyle, flex: '1 1 100px', minWidth: 0 }}>
                  <option value="">-</option>
                  {UNIDADES.map(u => <option key={u.valor} value={u.valor}>{u.corta}</option>)}
                </select>
                {ventas.length > 1 && <button onClick={() => eliminarFilaVenta(venta.id)} aria-label="Quitar fila" title="Quitar" style={{ background: 'none', border: 'none', color: '#C5221F', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>}
                {prod && (
                  <div style={{ flexBasis: '100%', fontSize: '0.85rem', color: textGray }}>
                    {prod.controlaStock === false ? 'Se prepara al momento' : `Stock: ${cantidadConUnidad(prod.stock, prod.unidadMedida)}`}
                    {yaVendido > 0 && <> · Ya vendido ese día: <strong style={{ color: textDark }}>{cantidadConUnidad(yaVendido, prod.unidadMedida)}</strong></>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={agregarFilaVenta} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar otro producto vendido</button>
          <button onClick={guardarVentasDelDia} disabled={guardando} style={{ padding: '12px 25px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando...' : 'Guardar ventas'}
          </button>
        </div>
      </div>

      {/* HISTORIAL */}
      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.4rem', margin: '0 0 10px 0' }}>Historial de ventas</h2>
        <p style={{ color: textGray, margin: '0 0 25px 0', fontSize: '0.95rem' }}>Abrí un día para ver el detalle o corregir una venta.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {historialArray.map((hist) => {
            const expandido = fechasExpandidas[hist.fecha];
            return (
              <div key={hist.fecha} style={{ border: `1px solid ${borderLight}`, borderRadius: '12px', overflow: 'hidden' }}>
                <button onClick={() => toggleHistorial(hist.fecha)} aria-expanded={Boolean(expandido)} style={{ width: '100%', padding: '20px', backgroundColor: '#FFFFFF', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '15px', minWidth: 0 }}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <span>
                      <span style={{ fontWeight: 'bold', color: textDark, fontSize: '1.05rem', display: 'block' }}>{formatearFechaLarga(hist.fecha)}</span>
                      <span style={{ color: textGray, fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{hist.detalle.length} producto{hist.detalle.length === 1 ? '' : 's'} con ventas</span>
                    </span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', color: hist.totalArs > 0 ? '#137333' : textDark, fontSize: '1.05rem', display: 'block' }}>{formatearPrecio(hist.totalArs)}</span>
                      <span style={{ color: textGray, fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{resumirPorUnidad(hist.detalle.map(d => ({ cantidad: d.cant, unidadMedida: d.producto.unidadMedida })))}</span>
                    </span>
                    <span style={{ color: textGray, fontSize: '1.2rem', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </span>
                </button>
                {expandido && (
                  <div className="grilla-2" style={{ padding: '20px', backgroundColor: '#FAF9F6', borderTop: `1px solid ${borderLight}` }}>
                    {hist.detalle.map((item) => (
                      <div key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '1px dashed #DCCDB8', paddingBottom: '8px' }}>
                        <span style={{ color: textDark, fontWeight: '500', fontSize: '0.95rem' }}>{item.producto.nombre} ({cantidadConUnidad(item.cant, item.producto.unidadMedida)})</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#B89732', fontWeight: 'bold', fontSize: '0.95rem' }}>{formatearPrecio(item.subtotal)}</span>
                          {hist.fecha >= sumarDias(hoy, -DIAS_MAX_ATRAS) && (
                            <button onClick={() => setCorreccion({ producto: item.producto, fecha: hist.fecha, actual: item.cant })} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Corregir</button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {historialArray.length === 0 && !errorCarga && <div style={{ color: textGray, textAlign: 'center', padding: '20px' }}>No hay ventas registradas en este período.</div>}
          {!errorCarga && (
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setDiasHistorial(d => d + DIAS_POR_TANDA)} style={{ padding: '8px 16px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Ver {DIAS_POR_TANDA} días más
              </button>
            </div>
          )}
        </div>
      </div>

      {correccion && (
        <ModalCorreccion
          producto={correccion.producto}
          fecha={correccion.fecha}
          tipo="VENTA"
          actual={correccion.actual}
          alCerrar={() => setCorreccion(null)}
          alGuardar={(texto) => { setCorreccion(null); setAviso({ tipo: 'ok', texto }); setVersion(v => v + 1); }}
        />
      )}
    </Pantalla>
  );
}

export default Ventas;
