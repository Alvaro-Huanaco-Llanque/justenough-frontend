import { useState, useEffect } from 'react';
import Pantalla, { Aviso } from '../components/Pantalla';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useHoy } from '../utils/hooks';
import {
  formatearFechaLarga, formatearCantidad, formatearPorcentaje, formatearPrecio, formatearPrecioCorto, cantidadConUnidad,
  etiquetaMotivoDesecho, fechaCorta
} from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';
const POR_DEFECTO_VISIBLES = 5;

const VERDE = '#137333';
const ROJO = '#C5221F';

// Cuánto cambió un valor en % contra el período anterior. Si antes era 0 o negativo, un porcentaje no dice nada.
function cambioPorcentual(actual, anterior) {
  if (anterior == null || anterior <= 0) return null;
  return Math.round((actual - anterior) / anterior * 1000) / 10;
}

// Texto y color del cambio: según el indicador, lo bueno es subir o bajar
function textoCambio(valor, sufijo, subirEsBueno) {
  if (valor == null) return { texto: '—', color: textGray };
  if (valor === 0) return { texto: `Igual`, color: textGray };
  const bueno = subirEsBueno ? valor > 0 : valor < 0;
  return { texto: `${valor > 0 ? '+' : ''}${formatearCantidad(valor)}${sufijo}`, color: bueno ? VERDE : ROJO };
}

// Descarga los datos crudos del período como CSV (se abre con Excel)
function descargarCsv(impacto) {
  const encabezado = ['Fecha', 'Producto', 'Producido', 'Vendido', 'Desperdicio', 'Costo unitario', 'Precio de venta'];
  const numero = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ','));
  // Un nombre que empieza con = + - @ lo ejecutaría Excel como fórmula: se lo trata como texto
  const texto = (t) => `"${String(t).replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  const filas = impacto.detalle.map(f => [f.fecha, texto(f.producto), numero(f.producido), numero(f.vendido),
    numero(f.desperdicio), numero(f.costoUnitario), numero(f.precioVenta)].join(';'));
  const contenido = '﻿' + [encabezado.join(';'), ...filas].join('\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `impacto_${impacto.desde}_${impacto.hasta}.csv`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Impacto() {
  const hoy = useHoy();
  const [dias, setDias] = useState(30);
  const [productoId, setProductoId] = useState('');
  const [productos, setProductos] = useState([]);
  const [impacto, setImpacto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exportMenuAbierto, setExportMenuAbierto] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    apiFetch('/api/productos')
      .then(res => (res.ok ? res.json() : []))
      .then(lista => setProductos(lista.filter(p => p.activo && p.controlaStock !== false).sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch(`/api/impacto?dias=${dias}${productoId ? `&productoId=${productoId}` : ''}`);
        if (!vigente) return;
        if (res.ok) { setImpacto(await res.json()); setError(''); }
        else setError(await leerMensajeError(res, 'No se pudo calcular el impacto.'));
      } catch {
        if (vigente) setError(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [dias, productoId]);

  const cambiarFiltro = (accion) => { setCargando(true); accion(); };

  // ================= Valores derivados =================
  const periodo = impacto?.periodo;
  const anterior = impacto?.periodoAnterior;
  const cambioGanancia = periodo && anterior ? textoCambio(cambioPorcentual(periodo.ganancia, anterior.ganancia), '%', true) : null;
  const semanas = impacto?.evolucionEconomica ?? [];
  const maxBarras = Math.max(1, ...semanas.map(s => Math.max(s.ganancia, s.costoDesperdicio)));
  const motivos = impacto?.desperdicioPorMotivo ?? [];
  const maxMotivo = Math.max(1, ...motivos.map(m => m.costo));
  const evolucion = impacto?.evolucionDesperdicio ?? [];
  // Una semana sin datos no es una semana con 0% de desperdicio: no se dibuja ni cuenta para la tendencia
  const conDatos = evolucion.filter(s => s.tasa != null);
  const maxTasa = Math.max(1, ...conDatos.map(s => s.tasa));
  const puntos = evolucion
    .map((s, i) => ({ x: 5 + i * (90 / Math.max(1, evolucion.length - 1)), y: 95 - ((s.tasa ?? 0) / maxTasa) * 85, semana: s }))
    .filter(p => p.semana.tasa != null);
  const primeraTasa = conDatos[0]?.tasa;
  const ultimaTasa = conDatos[conDatos.length - 1]?.tasa;
  const tendencia = conDatos.length >= 2
    ? (ultimaTasa < primeraTasa ? 'tendencia descendente' : ultimaTasa > primeraTasa ? 'tendencia ascendente' : 'estable')
    : '';
  const todosProductos = impacto?.productos ?? [];
  const filasProductos = verTodos ? todosProductos : todosProductos.slice(0, POR_DEFECTO_VISIBLES);

  // Filas de la comparativa: nombre, valor del período, valor anterior y cómo cambió
  const comparativa = periodo ? [
    { nombre: 'Recaudado', actual: formatearPrecio(periodo.recaudado), antes: anterior ? formatearPrecio(anterior.recaudado) : '—',
      cambio: anterior ? textoCambio(cambioPorcentual(periodo.recaudado, anterior.recaudado), '%', true) : null },
    { nombre: 'Ganancia estimada', actual: formatearPrecio(periodo.ganancia), antes: anterior ? formatearPrecio(anterior.ganancia) : '—', cambio: cambioGanancia },
    { nombre: 'Costo de lo desechado', actual: formatearPrecio(periodo.costoDesperdicio), antes: anterior ? formatearPrecio(anterior.costoDesperdicio) : '—',
      cambio: anterior ? textoCambio(cambioPorcentual(periodo.costoDesperdicio, anterior.costoDesperdicio), '%', false) : null },
    { nombre: '% de lo producido que se tiró',
      actual: periodo.tasaDesperdicio != null ? formatearPorcentaje(periodo.tasaDesperdicio) : '—',
      antes: anterior?.tasaDesperdicio != null ? formatearPorcentaje(anterior.tasaDesperdicio) : '—',
      cambio: periodo.tasaDesperdicio != null && anterior?.tasaDesperdicio != null
        ? textoCambio(Math.round((periodo.tasaDesperdicio - anterior.tasaDesperdicio) * 10) / 10, ' pts', false) : null },
  ] : [];

  const tarjeta = (titulo, icono, iconoBg, iconoColor, valor, pie, pieColor = textGray) => (
    <div style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>{titulo}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: iconoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconoColor, fontSize: '0.9rem' }}>{icono}</div>
      </div>
      <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{valor}</span>
      <span style={{ fontSize: '0.85rem', color: pieColor, display: 'block', marginTop: '8px', fontWeight: '500' }}>{pie}</span>
    </div>
  );

  const selectStyle = { padding: '10px 15px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: bgCard, outline: 'none', cursor: 'pointer', color: textDark, fontSize: '0.95rem' };

  return (
    <Pantalla seccion="impacto" claseRaiz="pantalla-impacto" claseContenido="contenido-impacto">

        {/* Cabecera */}
        <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Impacto</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
          </div>
          <div className="no-imprimir"><BotonAlertas /></div>
        </div>

        {/* Barra de Controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Resultados del sistema</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>
              Cómo vienen tus ventas, tu ganancia y tu desperdicio{impacto ? ` (${fechaCorta(impacto.desde)} al ${fechaCorta(impacto.hasta)})` : ''}.
            </p>
          </div>
          <div className="no-imprimir" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select aria-label="Período" value={dias} onChange={e => cambiarFiltro(() => setDias(Number(e.target.value)))} style={selectStyle}>
              <option value={30}>Últimos 30 días</option>
              <option value={7}>Últimos 7 días</option>
            </select>

            <select aria-label="Producto" value={productoId} onChange={e => cambiarFiltro(() => setProductoId(e.target.value))} style={{ ...selectStyle, width: '200px', maxWidth: '100%' }}>
              <option value="">Todos los productos</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setExportMenuAbierto(!exportMenuAbierto)}
                disabled={!impacto}
                style={{ padding: '10px 20px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '8px', fontWeight: 'bold', cursor: impacto ? 'pointer' : 'not-allowed', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>↓</span> Exportar reporte
              </button>
              {exportMenuAbierto && impacto && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, width: '220px', overflow: 'hidden' }}>
                  <div onClick={() => { setExportMenuAbierto(false); setTimeout(() => window.print(), 50); }} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${borderLight}`, color: textDark, fontSize: '0.95rem' }} className="hover-bg">PDF (resumen con gráficos)</div>
                  <div onClick={() => { setExportMenuAbierto(false); descargarCsv(impacto); }} style={{ padding: '12px 20px', cursor: 'pointer', color: textDark, fontSize: '0.95rem' }} className="hover-bg">CSV (datos crudos)</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Aviso aviso={error ? { tipo: 'error', texto: error } : null} />
        {cargando && !impacto && <p style={{ color: textGray }}>Calculando resultados...</p>}

        {impacto && (
          <div style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {/* Tarjetas Superiores */}
            <div className="grilla-3" style={{ marginBottom: '30px' }}>
              {tarjeta('Ganancia estimada', '$', '#E6F4EA', VERDE,
                formatearPrecioCorto(periodo.ganancia),
                !cambioGanancia || cambioGanancia.texto === '—' ? 'Sin período anterior para comparar' : `${cambioGanancia.texto} vs. período anterior`,
                cambioGanancia && cambioGanancia.texto !== '—' ? cambioGanancia.color : textGray)}
              {tarjeta('Desperdicio reducido', '🍃', '#FDF8EC', '#B89732',
                impacto.variacionDesperdicio != null ? `${impacto.variacionDesperdicio > 0 ? '+' : ''}${formatearPorcentaje(impacto.variacionDesperdicio)}` : '—',
                impacto.variacionDesperdicio != null
                  ? `vs. período base (se tiraba el ${formatearPorcentaje(impacto.tasaDesperdicioBase)}, ahora el ${formatearPorcentaje(impacto.tasaDesperdicio)})`
                  : 'Se calcula después de las primeras 2 semanas de uso')}
              {tarjeta('Ahorro estimado', '$', '#FDF8EC', '#B89732',
                impacto.ahorroEstimado != null ? formatearPrecioCorto(impacto.ahorroEstimado) : '—',
                impacto.ahorroEstimado != null ? `en los últimos ${dias} días` : 'Se calcula después de las primeras 2 semanas de uso')}
            </div>

            {/* Comparativa con el período anterior */}
            <div style={{ backgroundColor: bgCard, padding: '25px 30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Comparado con el período anterior</h3>
              <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 20px 0' }}>
                {anterior ? `Los últimos ${dias} días contra los ${dias} días anteriores.` : 'Todavía no hay datos del período anterior para comparar.'} La ganancia estimada es lo vendido por (precio − costo), menos el costo de lo desechado: no incluye otros gastos.
              </p>
              <div className="tabla-contenedor">
                <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>INDICADOR</th>
                      <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>ESTE PERÍODO</th>
                      <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PERÍODO ANTERIOR</th>
                      <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>CAMBIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativa.map((fila, index) => (
                      <tr key={fila.nombre} style={{ borderBottom: index === comparativa.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                        <td className="tarjeta-titulo" style={{ padding: '16px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{fila.nombre}</td>
                        <td data-label="ESTE PERÍODO" style={{ padding: '16px 0', color: textDark, fontSize: '0.95rem' }}>{fila.actual}</td>
                        <td data-label="PERÍODO ANTERIOR" style={{ padding: '16px 0', color: textGray, fontSize: '0.95rem' }}>{fila.antes}</td>
                        <td data-label="CAMBIO" style={{ padding: '16px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '0.95rem', color: fila.cambio?.color ?? textGray }}>{fila.cambio?.texto ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico: ganancia y desperdicio por semana */}
            <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
              <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Ganancia y desperdicio</h3>
                  <p style={{ color: textGray, fontSize: '0.9rem', margin: '0' }}>Por semana, últimas 8 semanas</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#C99B36', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Ganancia estimada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#E8A79F', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Costo de lo desechado</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', gap: '4px' }}>
                {semanas.map((s) => (
                  <div key={s.desde} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', flex: '1 1 0', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '180px', width: '100%', justifyContent: 'center' }}>
                      <div title={`${fechaCorta(s.desde)} al ${fechaCorta(s.hasta)} · Ganancia: ${formatearPrecio(s.ganancia)}`} style={{ width: '40%', maxWidth: '32px', height: `${(Math.max(0, s.ganancia) / maxBarras) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0' }}></div>
                      <div title={`${fechaCorta(s.desde)} al ${fechaCorta(s.hasta)} · Desechado: ${formatearPrecio(s.costoDesperdicio)}`} style={{ width: '40%', maxWidth: '32px', height: `${(s.costoDesperdicio / maxBarras) * 100}%`, backgroundColor: '#E8A79F', borderRadius: '4px 4px 0 0' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{fechaCorta(s.desde)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolución del desperdicio y Desperdicio por motivo */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: '1.5 1 320px', minWidth: 0, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Evolución del desperdicio</h3>
                <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 30px 0' }}>
                  % de lo producido que se tiró · últimas 8 semanas{tendencia ? ` · ${tendencia}` : ''}
                </p>
                <div style={{ position: 'relative', height: '180px', width: '100%', marginBottom: '50px' }}>
                  <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline points={puntos.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#C99B36" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    {puntos.map((p) => (
                      <circle key={p.semana.desde} cx={p.x} cy={p.y} r="1.8" fill="#FFFFFF" stroke="#C99B36" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                        <title>{`${fechaCorta(p.semana.desde)} al ${fechaCorta(p.semana.hasta)}: ${formatearPorcentaje(p.semana.tasa)}`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    {evolucion.map((s) => (
                      <span key={s.desde} style={{ fontSize: '0.7rem', color: '#A0A0A0', textAlign: 'center' }}>
                        {fechaCorta(s.desde)}<br />{s.tasa != null ? formatearPorcentaje(s.tasa) : '—'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ flex: '1 1 260px', minWidth: 0, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Desperdicio por motivo</h3>
                <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Cuánto costó lo desechado en el período</p>
                {motivos.length === 0 && <p style={{ color: textGray, fontSize: '0.9rem', margin: 0 }}>No hubo desechos en este período.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {motivos.map((item) => (
                    <div key={item.motivo}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.9rem', color: textDark, fontWeight: '600' }}>{etiquetaMotivoDesecho(item.motivo)}</span>
                        <span style={{ fontSize: '0.9rem', color: textGray, whiteSpace: 'nowrap' }}>{formatearPrecio(item.costo)}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(item.costo / maxMotivo) * 100}%`, height: '100%', backgroundColor: '#C99B36', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultado por producto */}
            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 20px 0' }}>Resultado por producto</h3>
              <div className="tabla-contenedor">
              <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>VENDIDO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>RECAUDADO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>DESPERDICIO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>GANANCIA ESTIMADA</th>
                  </tr>
                </thead>
                <tbody>
                  {filasProductos.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '25px 0', textAlign: 'center', color: textGray }}>Sin datos en este período.</td></tr>
                  )}
                  {filasProductos.map((prod, index) => (
                    <tr key={prod.productoId} style={{ borderBottom: index === filasProductos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                      <td className="tarjeta-titulo" style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                      <td data-label="VENDIDO" style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{cantidadConUnidad(prod.vendido, prod.unidadMedida)}</td>
                      <td data-label="RECAUDADO" style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearPrecio(prod.recaudado)}</td>
                      <td data-label="DESPERDICIO" style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{cantidadConUnidad(prod.desperdicio, prod.unidadMedida)}</td>
                      <td data-label="GANANCIA ESTIMADA" style={{ padding: '20px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '0.95rem', color: prod.ganancia < 0 ? ROJO : textDark }}>{formatearPrecio(prod.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {todosProductos.length > POR_DEFECTO_VISIBLES && (
                <div className="no-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando {filasProductos.length} de {todosProductos.length} productos</span>
                  <button onClick={() => setVerTodos(!verTodos)} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>{verTodos ? 'Ver menos' : 'Ver todos'}</button>
                </div>
              )}
            </div>
          </div>
        )}

      <style>{`
        .hover-bg:hover { background-color: #FDF8EC; }
        @media print {
          .no-imprimir { display: none !important; }
          .pantalla-impacto { height: auto !important; overflow: visible !important; width: 100% !important; }
          .contenido-impacto { overflow: visible !important; height: auto !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </Pantalla>
  );
}

export default Impacto;
