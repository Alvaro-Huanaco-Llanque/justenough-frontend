import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useHoy } from '../utils/hooks';
import {
  formatearCantidad, formatearFechaLarga, fechaCorta, lunesDe, sumarDias, resumirPorUnidad, unidadCorta,
  etiquetaConfianza, colorConfianza
} from '../utils/productos';

const DIAS_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DIAS_CORTOS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const textApagado = '#8A8A8A';
const goldPrimary = '#D4AF37';
const goldLight = '#F9EBBF';

const ventaEsperada = (s) => s.demandaEsperada ?? s.cantidadSugerida;

// El dorado se intensifica según cuánto se espera vender ese día comparado con el resto de la semana del producto
const fondoCalor = (intensidad) => `rgba(212, 175, 55, ${0.1 + intensidad * 0.5})`;

// Agrupa las filas individuales de la BD (1 por día) en una fila semanal por producto
function agruparPorProducto(listaSugerencias, lunesSemana) {
  const mapa = {};
  const baseLunes = new Date(lunesSemana + 'T00:00:00');

  listaSugerencias.forEach((s) => {
    if (!s.producto) return;
    const pId = s.producto.id;
    if (!mapa[pId]) {
      mapa[pId] = { id: pId, nombre: s.producto.nombre, unidadMedida: s.producto.unidadMedida, nivelConfianza: s.nivelConfianza, dias: {} };
    }
    const fechaSug = new Date(s.fecha + 'T00:00:00');
    const diffDias = Math.round((fechaSug - baseLunes) / (1000 * 60 * 60 * 24));
    if (diffDias >= 0 && diffDias < 7) {
      mapa[pId].dias[DIAS_KEYS[diffDias]] = s;
      // La confianza que vale es la del cálculo más reciente: la del último día de la semana
      mapa[pId].nivelConfianza = s.nivelConfianza;
    }
  });

  return Object.values(mapa).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

const valoresDe = (prod) => DIAS_KEYS.filter(d => prod.dias[d]).map(d => ventaEsperada(prod.dias[d]));

// El día con más venta esperada. Los productos pueden medirse en kilos o unidades, así que no se suman:
// se compara cada día con el promedio de su producto, y después se promedia entre productos.
function diaMasFuerte(filas) {
  const acumulado = DIAS_KEYS.map(() => ({ suma: 0, productos: 0 }));
  filas.forEach((prod) => {
    const valores = valoresDe(prod);
    const promedio = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);
    if (promedio <= 0) return;
    DIAS_KEYS.forEach((d, i) => {
      if (!prod.dias[d]) return;
      acumulado[i].suma += ventaEsperada(prod.dias[d]) / promedio;
      acumulado[i].productos += 1;
    });
  });
  let mejor = null;
  acumulado.forEach((a, i) => {
    if (a.productos === 0) return;
    const indice = a.suma / a.productos;
    if (!mejor || indice > mejor.indice) mejor = { posicion: i, indice };
  });
  return mejor;
}

// Sugerencias: la venta esperada de cada día de la semana. Es una referencia para mirar, no hay nada que aceptar.
function Sugerencias() {
  const navigate = useNavigate();
  const hoy = useHoy();

  const [semanaElegida, setSemanaElegida] = useState(null);   // null = la semana actual, y avanza sola
  const lunesActual = lunesDe(hoy);
  const lunesSemana = semanaElegida ?? lunesActual;
  const esSemanaActual = lunesSemana === lunesActual;

  const [filasProductos, setFilasProductos] = useState([]);
  const [estadoCalculo, setEstadoCalculo] = useState({ basico: false, desactualizada: false });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // El backend las recalcula solo en segundo plano cuando cambian días pasados o eventos, y cada noche
  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch(`/api/sugerencias/semana?desde=${lunesSemana}`);
        if (!vigente) return;
        if (res.ok) {
          const data = await res.json();
          if (!vigente) return;
          setErrorCarga('');
          setFilasProductos(agruparPorProducto(data.sugerencias, lunesSemana));
          setEstadoCalculo({
            basico: data.sugerencias.some(s => s.fecha >= hoy && s.origen === 'LOCAL'),
            desactualizada: data.desactualizada
          });
        } else {
          setErrorCarga(await leerMensajeError(res, 'No se pudieron obtener las sugerencias.'));
        }
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [lunesSemana, hoy]);

  const irASemana = (lunes) => {
    setCargando(true);
    setSemanaElegida(lunes === lunesActual ? null : lunes);
  };

  // Formateo del rango de fechas de la semana para el título
  const fechaLunesObj = new Date(lunesSemana + 'T00:00:00');
  const fechaDomingoObj = new Date(fechaLunesObj);
  fechaDomingoObj.setDate(fechaLunesObj.getDate() + 6);
  const opcionesCortas = { day: 'numeric', month: 'short' };
  const rangoTexto = `${fechaLunesObj.toLocaleDateString('es-AR', opcionesCortas)} – ${fechaDomingoObj.toLocaleDateString('es-AR', opcionesCortas)}`;

  const fechasSemana = DIAS_KEYS.map((_, i) => sumarDias(lunesSemana, i));

  // ================= Resumen de arriba =================
  const hayDatos = !cargando && filasProductos.length > 0;
  const aResumir = filasProductos.flatMap(prod => DIAS_KEYS
    .filter(d => prod.dias[d] && (!esSemanaActual || prod.dias[d].fecha === hoy))
    .map(d => ({ cantidad: ventaEsperada(prod.dias[d]), unidadMedida: prod.unidadMedida })));
  const masFuerte = hayDatos ? diaMasFuerte(filasProductos) : null;
  const sobrePromedio = masFuerte ? Math.round((masFuerte.indice - 1) * 100) : 0;
  const confiables = filasProductos.filter(p => p.nivelConfianza !== 'BAJA').length;

  const tarjeta = (titulo, icono, iconoBg, valor, pie) => (
    <div style={{ backgroundColor: bgCard, padding: '22px 25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>{titulo}</span>
        <div aria-hidden="true" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: iconoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{icono}</div>
      </div>
      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{valor}</span>
      <span style={{ fontSize: '0.85rem', color: textGray, display: 'block', marginTop: '6px', fontWeight: '500' }}>{pie}</span>
    </div>
  );

  const botonSemana = { padding: '8px 14px', backgroundColor: bgCard, color: textDark, border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' };
  const thDia = { padding: '16px 2px 12px', fontWeight: 'bold', minWidth: '50px' };

  return (
    <Pantalla seccion="sugerencias">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Sugerencias</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
        </div>
        <BotonAlertas />
      </div>

      {estadoCalculo.basico && (
        <div role="status" style={{ backgroundColor: '#FEF7E0', border: '1px solid #E8C877', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', color: '#665324', fontSize: '0.92rem' }}>
          <strong>Cálculo básico.</strong> El motor de predicciones no está disponible: estas cantidades usan solo el promedio de tus ventas. Se actualizan solas cuando vuelva.
        </div>
      )}
      {estadoCalculo.desactualizada && (
        <div role="status" style={{ backgroundColor: '#E8F0FE', border: '1px solid #AFC6EF', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', color: '#1A3F7A', fontSize: '0.92rem' }}>
          Cambiaron datos de días pasados o del calendario: estamos actualizando las sugerencias.
        </div>
      )}
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      {/* Resumen */}
      <div className="grilla-3" style={{ marginBottom: '30px' }}>
        {tarjeta(esSemanaActual ? 'Se espera vender hoy' : 'Se espera vender en la semana', '🧾', '#FDF8EC',
          hayDatos ? resumirPorUnidad(aResumir) : '—',
          hayDatos ? `Sumando ${filasProductos.length} ${filasProductos.length === 1 ? 'producto' : 'productos'}` : 'Sin sugerencias para mostrar')}
        {tarjeta('Día más fuerte', '📈', '#E6F4EA',
          masFuerte ? formatearFechaLarga(fechasSemana[masFuerte.posicion]).split(',')[0] : '—',
          !masFuerte ? 'Sin sugerencias para mostrar'
            : sobrePromedio > 0 ? `${fechaCorta(fechasSemana[masFuerte.posicion])} · +${sobrePromedio}% sobre un día promedio`
            : 'Venta pareja toda la semana')}
        {tarjeta('Confianza', '🎯', '#FEF7E0',
          hayDatos ? `${confiables} de ${filasProductos.length}` : '—',
          'Productos con confianza Media o Alta')}
      </div>

      {/* Título y cambio de semana */}
      <div className="fila-cabecera" style={{ alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 320px' }}>
          <div aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🍪</div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 3px 0' }}>Sugerencia semanal · {rangoTexto}</h2>
            <p style={{ color: textGray, fontSize: '0.92rem' }}>Cuánto se espera vender cada día, según tus ventas, desechos y calendario. Es una referencia: no hay nada que aceptar.</p>
          </div>
        </div>
        <div style={{ display: 'inline-flex', border: `1px solid ${borderLight}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: bgCard }}>
          <button onClick={() => irASemana(sumarDias(lunesSemana, -7))} style={botonSemana} aria-label="Semana anterior">←</button>
          <button onClick={() => irASemana(lunesActual)} disabled={esSemanaActual} aria-current={esSemanaActual ? 'date' : undefined}
            style={{ ...botonSemana, borderLeft: `1px solid ${borderLight}`, borderRight: `1px solid ${borderLight}`, backgroundColor: esSemanaActual ? '#FDF8EC' : bgCard, color: esSemanaActual ? '#8A6D1C' : textDark, cursor: esSemanaActual ? 'default' : 'pointer' }}>
            Esta semana
          </button>
          <button onClick={() => irASemana(sumarDias(lunesSemana, 7))} style={botonSemana} aria-label="Semana siguiente">→</button>
        </div>
      </div>

      {/* Tabla semanal */}
      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px', overflow: 'hidden' }}>
        <div className="tabla-contenedor">
          <table aria-busy={cargando} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '640px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th scope="col" className="sug-col-producto" style={{ padding: '16px 12px 12px 16px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                {fechasSemana.map((fecha, i) => {
                  const esHoy = fecha === hoy;
                  return (
                    <th key={fecha} scope="col" className={esHoy ? 'sug-hoy' : undefined} aria-label={esHoy ? `${DIAS_CORTOS[i]}, hoy` : undefined} style={{ ...thDia, color: esHoy ? '#8A6D1C' : '#A0A0A0' }}>
                      <span style={{ display: 'block', marginBottom: '4px' }}>{DIAS_CORTOS[i]}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', fontSize: '0.8rem', backgroundColor: esHoy ? goldPrimary : 'transparent', color: esHoy ? '#FFFFFF' : textGray }}>{Number(fecha.slice(8))}</span>
                    </th>
                  );
                })}
                <th scope="col" style={{ padding: '16px 8px 12px', fontWeight: 'bold', borderLeft: `1px solid ${borderLight}` }}>SEMANA</th>
                <th scope="col" style={{ padding: '16px 12px 12px 6px', fontWeight: 'bold' }}>CONFIANZA</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                [0, 1, 2, 3].map(i => (
                  <tr key={i} style={{ borderBottom: i === 3 ? 'none' : `1px solid ${borderLight}` }}>
                    <td colSpan="10" style={{ padding: '16px 20px' }}><div className="sug-esqueleto" /></td>
                  </tr>
                ))
              ) : errorCarga ? null : filasProductos.length === 0 ? (
                <tr><td colSpan="10" style={{ padding: '40px', color: textGray }}><MensajeVacio>No hay sugerencias para esta semana. Solo se calculan para productos activos con stock.</MensajeVacio></td></tr>
              ) : (
                filasProductos.map((prod, index) => {
                  const badge = colorConfianza(prod.nivelConfianza);
                  // El color solo compara lo que todavía no pasó: los días pasados quedan apagados
                  const valores = DIAS_KEYS
                    .filter(d => prod.dias[d] && prod.dias[d].fecha >= hoy)
                    .map(d => ventaEsperada(prod.dias[d]))
                    .filter(v => v > 0);
                  const maximo = Math.max(0, ...valores);
                  const minimo = Math.min(maximo, ...valores);
                  const totalSemana = valoresDe(prod).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={prod.id} className="sug-fila" style={{ borderBottom: index === filasProductos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                      <td className="sug-col-producto" style={{ padding: '12px 12px 12px 16px', textAlign: 'left' }}>
                        <span style={{ display: 'block', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</span>
                        <span style={{ display: 'block', color: textApagado, fontSize: '0.75rem' }}>{unidadCorta(prod.unidadMedida)}</span>
                      </td>
                      {fechasSemana.map((fecha, i) => {
                        const celda = prod.dias[DIAS_KEYS[i]];
                        const esHoy = fecha === hoy;
                        const yaPaso = fecha < hoy;
                        const valor = celda ? ventaEsperada(celda) : null;
                        const sinVenta = !valor;
                        const intensidad = maximo > minimo ? (valor - minimo) / (maximo - minimo) : 0;
                        const rango = celda?.demandaMinima != null && celda?.demandaMaxima != null
                          ? `Entre ${formatearCantidad(celda.demandaMinima)} y ${formatearCantidad(celda.demandaMaxima)}` : undefined;
                        return (
                          <td key={fecha} className={esHoy ? 'sug-hoy' : undefined} title={rango} style={{ padding: '10px 2px' }}>
                            <div style={{
                              margin: '0 auto', maxWidth: '46px', padding: '8px 2px', borderRadius: '10px', fontSize: '0.9rem',
                              backgroundColor: sinVenta || yaPaso ? 'transparent' : fondoCalor(intensidad),
                              color: yaPaso || sinVenta ? textApagado : textDark,
                              fontWeight: !yaPaso && !sinVenta && valor === maximo && maximo > minimo ? '800' : '600'
                            }}>
                              {sinVenta ? '–' : formatearCantidad(valor)}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '10px 8px', borderLeft: `1px solid ${borderLight}`, fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{formatearCantidad(Math.round(totalSemana * 10) / 10)}</td>
                      <td style={{ padding: '10px 12px 10px 6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 9px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                          <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.color }} />
                          {etiquetaConfianza(prod.nivelConfianza)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${borderLight}`, backgroundColor: '#FAF9F6', fontSize: '0.85rem', color: textGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>Menos venta</span>
            <span aria-hidden="true" style={{ display: 'inline-flex', gap: '3px' }}>
              {[0, 0.33, 0.66, 1].map(n => <span key={n} style={{ width: '18px', height: '12px', borderRadius: '3px', backgroundColor: fondoCalor(n) }} />)}
            </span>
            <span>Más venta</span>
            <span style={{ color: textApagado }}>Cada producto se compara con el resto de su semana.<span className="sug-solo-mouse"> Pasá el mouse por un día para ver el rango.</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>✨ La confianza sale de cuánto se equivocó el motor.</span>
            <button onClick={() => navigate('/madurez')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Ver Madurez →</button>
          </div>
        </div>
      </div>
    </Pantalla>
  );
}

export default Sugerencias;
