import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import ModalCorreccion from '../components/ModalCorreccion';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useAvisoSinGuardar, useFechaDeCarga } from '../utils/hooks';
import {
  unidadCorta, etiquetaModalidad, formatearPrecio, cantidadConUnidad, formatearFechaLarga, fechaCorta, sumarDias,
  DIAS_MAX_ATRAS, DIAS_MAX_ADELANTE
} from '../utils/productos';

const POR_PAGINA = 8;

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

// Ingresos: lo que se produjo o compró y entra al stock de cada producto.
// Cada carga se suma a lo del día. Si la fecha es futura, queda programada y suma al llegar ese día.
function ProducidoCompras() {
  const navigate = useNavigate();

  const [fecha, setFecha, hoy] = useFechaDeCarga();
  const [paginaActual, setPaginaActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [cargadas, setCargadas] = useState({});     // productoId -> total ya cargado ese día
  const [programados, setProgramados] = useState([]); // ingresos futuros pendientes
  const [cantidades, setCantidades] = useState({}); // productoId -> lo que está escrito para agregar
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [correccion, setCorreccion] = useState(null); // { producto, actual }
  const [version, setVersion] = useState(0);

  const esFutura = fecha > hoy;

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const [resProductos, resRegistros, resProgramados] = await Promise.all([
          apiFetch('/api/productos'),
          apiFetch(`/api/registros-diarios?fecha=${fecha}`),
          apiFetch('/api/ingresos-programados')
        ]);
        if (!vigente) return;
        if (!resProductos.ok || !resRegistros.ok || !resProgramados.ok) {
          setErrorCarga(await leerMensajeError(resProductos.ok ? resRegistros : resProductos, 'No se pudieron cargar los datos.'));
          setCargando(false);
          return;
        }
        const [lista, registros, pendientes] = await Promise.all([resProductos.json(), resRegistros.json(), resProgramados.json()]);
        if (!vigente) return;
        const yaCargadas = {};
        registros.forEach(r => {
          if (r.producto && r.cantidadProducida > 0) yaCargadas[r.producto.id] = r.cantidadProducida;
        });
        setErrorCarga('');
        setProductos(lista.filter(p => p.activo && p.controlaStock !== false).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setCargadas(yaCargadas);
        setProgramados(pendientes);
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [fecha, version]);

  const aCargar = productos.filter(p => (parseFloat(cantidades[p.id]) || 0) !== 0);
  const hayCambios = aCargar.length > 0;
  useAvisoSinGuardar(hayCambios, 'Tenés cantidades sin guardar. ¿Salir igual?');

  const cambiarFecha = (nuevaFecha) => {
    if (hayCambios && !window.confirm('Tenés cantidades sin guardar. ¿Cambiar de fecha igual?')) return;
    setAviso(null);
    setCantidades({});
    setPaginaActual(1);
    setFecha(nuevaFecha);
  };

  const guardar = async () => {
    if (!hayCambios) { setAviso({ tipo: 'error', texto: 'Escribí la cantidad de al menos un producto.' }); return; }
    if (aCargar.some(p => parseFloat(cantidades[p.id]) < 0)) { setAviso({ tipo: 'error', texto: 'Las cantidades no pueden ser negativas.' }); return; }

    setGuardando(true);
    const ingresos = Object.fromEntries(aCargar.map(p => [p.id, parseFloat(cantidades[p.id])]));
    try {
      const res = await apiFetch(esFutura ? '/api/ingresos-programados' : '/api/registros-diarios/ingresos-batch', {
        method: 'POST',
        body: JSON.stringify({ fecha, ingresos })
      });
      if (res.ok) {
        const n = aCargar.length;
        setAviso({
          tipo: 'ok',
          texto: esFutura
            ? `Programado para el ${formatearFechaLarga(fecha).toLowerCase()} (${n} producto${n === 1 ? '' : 's'}). Se suma al stock cuando llegue ese día.`
            : `Ingresos agregados (${n} producto${n === 1 ? '' : 's'}). El stock ya se actualizó.`
        });
        setCantidades({});
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar los ingresos.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
    setGuardando(false);
  };

  // "Ya llegó" o "Cancelar" de un ingreso programado
  const resolverProgramado = async (ingreso, accion) => {
    try {
      const res = accion === 'recibir'
        ? await apiFetch(`/api/ingresos-programados/${ingreso.id}/recibir`, { method: 'PUT' })
        : await apiFetch(`/api/ingresos-programados/${ingreso.id}`, { method: 'DELETE' });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: accion === 'recibir' ? `${ingreso.producto.nombre}: ya se sumó al stock.` : `Se canceló el ingreso de ${ingreso.producto.nombre}.` });
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudo actualizar el ingreso.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
  };

  const programadoDe = (id) => programados.filter(i => i.producto.id === id && i.fecha === fecha).reduce((acc, i) => acc + i.cantidad, 0);

  const totalPaginas = Math.max(1, Math.ceil(productos.length / POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas);
  const productosPaginados = productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const rangoDesde = productos.length === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const rangoHasta = Math.min(pagina * POR_PAGINA, productos.length);

  return (
    <Pantalla seccion="producido">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Ingresos</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
        </div>
        <BotonAlertas />
      </div>

      <div className="fila-cabecera" style={{ marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>{esFutura ? 'Programar para el' : 'Ingresos del'} {formatearFechaLarga(fecha).toLowerCase()}</h2>
          <p style={{ color: textGray, fontSize: '0.95rem' }}>Registrá lo que produjiste o compraste. Podés elegir una fecha futura para lo que llega más adelante.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
          <span style={{ marginRight: '10px', color: textGray }}>📅</span>
          <input
            type="date"
            aria-label="Fecha"
            value={fecha}
            min={sumarDias(hoy, -DIAS_MAX_ATRAS)}
            max={sumarDias(hoy, DIAS_MAX_ADELANTE)}
            onChange={(e) => e.target.value && cambiarFecha(e.target.value)}
            style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: esFutura ? '#E8F0FE' : '#FCF7E6', border: `1px solid ${esFutura ? '#1A56B8' : goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: bgCard, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderLight}`, flexShrink: 0 }}>{esFutura ? '🗓️' : '📦'}</div>
        <span style={{ color: esFutura ? '#1A3F7A' : '#665324', fontSize: '0.95rem' }}>
          {esFutura
            ? <><strong>Todavía no suma al stock.</strong> Se agrega solo cuando llegue ese día. Si llega antes, marcalo con "Ya llegó" en Próximos ingresos.</>
            : <><strong>Cada carga se suma a lo del día.</strong> Si compraste dos veces, cargá cada compra. Para arreglar un error usá "Corregir". La modalidad y el costo se cambian desde el{' '}
              <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: 'inherit', font: 'inherit', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>Catálogo</button>.</>}
        </span>
      </div>

      <Aviso aviso={aviso} />
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px 30px', marginBottom: '30px' }}>
        <div className="tabla-contenedor">
          <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>MODALIDAD</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>{esFutura ? 'YA PROGRAMADO' : 'YA CARGADO'}</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>AGREGAR</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>COSTO UNITARIO</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>STOCK ACTUAL</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>Cargando...</td></tr>}
              {!cargando && !errorCarga && productos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>
                  <MensajeVacio>
                    No hay productos con stock en el catálogo.{' '}
                    <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en Catálogo →</button>
                  </MensajeVacio>
                </td></tr>
              )}
              {!cargando && !errorCarga && productosPaginados.map((prod, index) => {
                const yaCargado = esFutura ? programadoDe(prod.id) : (cargadas[prod.id] ?? 0);
                return (
                  <tr key={prod.id} style={{ borderBottom: index === productosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td className="tarjeta-titulo" style={{ padding: '18px 10px', fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td data-label="MODALIDAD" style={{ padding: '18px 10px' }}>
                      <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: prod.modalidad === 'COMPRADO' ? '#E8F0FE' : '#FDF8EC', color: prod.modalidad === 'COMPRADO' ? '#1A56B8' : '#8A6D1C' }}>
                        {etiquetaModalidad(prod.modalidad)}
                      </span>
                    </td>
                    <td data-label={esFutura ? 'YA PROGRAMADO' : 'YA CARGADO'} style={{ padding: '18px 10px', color: textDark, fontSize: '0.95rem' }}>
                      <span>{yaCargado > 0 ? cantidadConUnidad(yaCargado, prod.unidadMedida) : '—'}</span>
                      {!esFutura && yaCargado > 0 && (
                        <button onClick={() => setCorreccion({ producto: prod, actual: yaCargado })} style={{ marginLeft: '8px', padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}>Corregir</button>
                      )}
                    </td>
                    <td data-label="AGREGAR" style={{ padding: '18px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          aria-label={`Cantidad a agregar de ${prod.nombre}`}
                          value={cantidades[prod.id] ?? ''}
                          onChange={(e) => setCantidades({ ...cantidades, [prod.id]: e.target.value })}
                          style={{ width: '90px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${(parseFloat(cantidades[prod.id]) || 0) !== 0 ? '#D4AF37' : borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: textDark }}
                        />
                        <span style={{ color: textGray, fontSize: '0.85rem' }}>{unidadCorta(prod.unidadMedida)}</span>
                      </div>
                    </td>
                    <td data-label="COSTO UNITARIO" style={{ padding: '18px 10px', color: textGray, fontSize: '0.95rem' }}>{formatearPrecio(prod.costoUnitario)}</td>
                    <td data-label="STOCK ACTUAL" style={{ padding: '18px 10px', color: textGray, fontSize: '0.95rem' }}>{cantidadConUnidad(prod.stock, prod.unidadMedida)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
          <span style={{ color: textGray, fontSize: '0.9rem' }}>Mostrando {rangoDesde}–{rangoHasta} de {productos.length} productos</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setPaginaActual(Math.max(pagina - 1, 1))} disabled={pagina === 1} aria-label="Página anterior"
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === 1 ? '#F5F5F5' : bgCard, cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: textGray }}>&lt;</button>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark }}>{pagina} <span style={{ color: textGray, fontWeight: 'normal' }}>/ {totalPaginas}</span></span>
              <button onClick={() => setPaginaActual(Math.min(pagina + 1, totalPaginas))} disabled={pagina === totalPaginas} aria-label="Página siguiente"
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === totalPaginas ? '#F5F5F5' : bgCard, cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}>&gt;</button>
            </div>
            <button onClick={guardar} disabled={guardando || cargando}
              style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : `${esFutura ? 'Programar' : 'Agregar ingresos'}${hayCambios ? ` (${aCargar.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>

      {programados.length > 0 && (
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px 30px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.15rem', margin: '0 0 5px 0' }}>Próximos ingresos</h3>
          <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 15px 0' }}>Se suman al stock cuando llega su día.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {programados.map((ingreso, i) => (
              <div key={ingreso.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${borderLight}` }}>
                <span style={{ fontSize: '0.95rem', color: textDark }}>
                  <strong>{fechaCorta(ingreso.fecha)}</strong> · {ingreso.producto.nombre}: {cantidadConUnidad(ingreso.cantidad, ingreso.producto.unidadMedida)}
                </span>
                <span style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => resolverProgramado(ingreso, 'recibir')} style={{ padding: '6px 12px', backgroundColor: '#E6F4EA', color: '#137333', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Ya llegó</button>
                  <button onClick={() => resolverProgramado(ingreso, 'cancelar')} style={{ padding: '6px 12px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Cancelar</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
        <button onClick={() => navigate('/ventas')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <span>🧾</span> Ir a Ventas &gt;
        </button>
      </div>

      {correccion && (
        <ModalCorreccion
          producto={correccion.producto}
          fecha={fecha}
          tipo="INGRESO"
          actual={correccion.actual}
          alCerrar={() => setCorreccion(null)}
          alGuardar={(texto) => { setCorreccion(null); setAviso({ tipo: 'ok', texto }); setVersion(v => v + 1); }}
        />
      )}
    </Pantalla>
  );
}

export default ProducidoCompras;
