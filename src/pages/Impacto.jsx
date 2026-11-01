import { useState, useEffect } from 'react';
import BarraLateral from '../components/BarraLateral';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError } from '../api';
import {
  formatearFechaLarga, hoyISO, formatearCantidad, formatearPorcentaje, formatearPrecioCorto, unidadCorta,
  etiquetaMotivoAjuste, diaCorto, fechaCorta
} from '../utils/productos';

const bgApp = '#FAF9F6';
const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';
const POR_DEFECTO_VISIBLES = 5;

// Alto (85% o más), Medio (70% a 84%), Bajo (menos de 70%)
function estiloPrecision(precision) {
  if (precision >= 85) return { bg: '#E6F4EA', color: '#137333' };
  if (precision >= 70) return { bg: '#FEF7E0', color: '#B06000' };
  return { bg: '#FCE8E6', color: '#C5221F' };
}

// Descarga los datos crudos del período como CSV (se abre con Excel)
function descargarCsv(impacto) {
  const encabezado = ['Fecha', 'Producto', 'Sugerido', 'Cantidad final', 'Producido', 'Vendido', 'Desperdicio', 'Costo unitario'];
  const numero = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ','));
  const texto = (t) => `"${String(t).replace(/"/g, '""')}"`;
  const filas = impacto.detalle.map(f => [f.fecha, texto(f.producto), numero(f.sugerido), numero(f.cantidadFinal),
    numero(f.producido), numero(f.vendido), numero(f.desperdicio), numero(f.costoUnitario)].join(';'));
  const contenido = '﻿' + [encabezado.join(';'), ...filas].join('\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `impacto_${impacto.desde}_${impacto.hasta}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function Impacto() {
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
        if (vigente) setError('No se pudo conectar con el servidor.');
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [dias, productoId]);

  const cambiarFiltro = (accion) => { setCargando(true); accion(); };

  // ================= Valores derivados =================
  const precisionDelta = impacto?.precision != null && impacto?.precisionAnterior != null
    ? impacto.precision - impacto.precisionAnterior : null;
  const maxBarras = Math.max(1, ...(impacto?.predichoVsReal ?? []).map(d => Math.max(d.sugerido, d.vendido)));
  const maxAjustes = Math.max(1, ...(impacto?.ajustesPorMotivo ?? []).map(a => a.cantidad));
  const evolucion = impacto?.evolucionDesperdicio ?? [];
  const tasas = evolucion.map(s => s.tasa ?? 0);
  const maxTasa = Math.max(1, ...tasas);
  const puntos = evolucion.map((s, i) => ({ x: 5 + i * (90 / Math.max(1, evolucion.length - 1)), y: 95 - ((s.tasa ?? 0) / maxTasa) * 85, semana: s }));
  const tendencia = tasas.length >= 2 ? (tasas[tasas.length - 1] < tasas[0] ? 'tendencia descendente' : tasas[tasas.length - 1] > tasas[0] ? 'tendencia ascendente' : 'estable') : '';
  const aplicadas = impacto?.sugerenciasAplicadas;
  const filasProductos = impacto ? (verTodos ? impacto.productos : impacto.productos.slice(0, POR_DEFECTO_VISIBLES)) : [];

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
    <div className="pantalla-impacto" style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <div className="no-imprimir"><BarraLateral seccionActiva="impacto" /></div>

      <div className="contenido-impacto" style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Impacto</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoyISO())}</p>
          </div>
          <div className="no-imprimir"><BotonAlertas /></div>
        </div>

        {/* Barra de Controles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Resultados del sistema</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>
              Compará lo que el sistema sugirió con lo que realmente pasó{impacto ? ` (${fechaCorta(impacto.desde)} al ${fechaCorta(impacto.hasta)})` : ''}.
            </p>
          </div>
          <div className="no-imprimir" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select value={dias} onChange={e => cambiarFiltro(() => setDias(Number(e.target.value)))} style={selectStyle}>
              <option value={30}>Últimos 30 días</option>
              <option value={7}>Últimos 7 días</option>
            </select>

            <select value={productoId} onChange={e => cambiarFiltro(() => setProductoId(e.target.value))} style={{ ...selectStyle, width: '200px' }}>
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

        {error && <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: '#FCE8E6', color: '#C5221F' }}>{error}</div>}
        {cargando && !impacto && <p style={{ color: textGray }}>Calculando resultados...</p>}

        {impacto && (
          <div style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {/* Tarjetas Superiores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              {tarjeta('Precisión de predicción', '◎', '#E6F4EA', '#137333',
                impacto.precision != null ? formatearPorcentaje(impacto.precision) : '—',
                impacto.precision == null ? 'Todavía no hay días con sugerencia y ventas cargadas'
                  : precisionDelta == null ? 'Sin período anterior para comparar'
                  : `${precisionDelta >= 0 ? '+' : ''}${formatearCantidad(Math.round(precisionDelta * 10) / 10)} pts vs. período anterior`,
                precisionDelta == null ? textGray : precisionDelta >= 0 ? '#137333' : '#C5221F')}
              {tarjeta('Desperdicio reducido', '🍃', '#FDF8EC', '#B89732',
                impacto.variacionDesperdicio != null ? `${impacto.variacionDesperdicio > 0 ? '+' : ''}${formatearPorcentaje(impacto.variacionDesperdicio)}` : '—',
                impacto.variacionDesperdicio != null
                  ? `vs. período base (se tiraba el ${formatearPorcentaje(impacto.tasaDesperdicioBase)}, ahora el ${formatearPorcentaje(impacto.tasaDesperdicio)})`
                  : 'Se calcula después de las primeras 2 semanas de uso')}
              {tarjeta('Ahorro estimado', '$', '#FDF8EC', '#B89732',
                impacto.ahorroEstimado != null ? formatearPrecioCorto(impacto.ahorroEstimado) : '—',
                impacto.ahorroEstimado != null ? `en los últimos ${dias} días` : 'Se calcula después de las primeras 2 semanas de uso')}
            </div>

            {/* Gráfico Predicho vs Real */}
            <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Predicho vs. real</h3>
                  <p style={{ color: textGray, fontSize: '0.9rem', margin: '0' }}>Unidades sugeridas a producir vs. unidades vendidas, últimos 7 días</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#F4E3B5', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Sugerido</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#C99B36', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Vendido</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 20px' }}>
                {impacto.predichoVsReal.map((dia) => (
                  <div key={dia.fecha} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '180px', width: '100%', justifyContent: 'center' }}>
                      <div title={`Sugerido: ${formatearCantidad(dia.sugerido)}`} style={{ width: '32px', height: `${(dia.sugerido / maxBarras) * 100}%`, backgroundColor: '#F4E3B5', borderRadius: '4px 4px 0 0' }}></div>
                      <div title={`Vendido: ${formatearCantidad(dia.vendido)}`} style={{ width: '32px', height: `${(dia.vendido / maxBarras) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{diaCorto(dia.fecha)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolución del desperdicio y Ajustes por motivo */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1.5, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Evolución del desperdicio</h3>
                <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 30px 0' }}>
                  % de lo producido que se tiró · últimas 8 semanas{tendencia ? ` · ${tendencia}` : ''}
                </p>
                <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                  <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline points={puntos.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#C99B36" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    {puntos.map((p) => (
                      <circle key={p.semana.desde} cx={p.x} cy={p.y} r="1.8" fill="#FFFFFF" stroke="#C99B36" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                        <title>{`${fechaCorta(p.semana.desde)} al ${fechaCorta(p.semana.hasta)}: ${p.semana.tasa != null ? formatearPorcentaje(p.semana.tasa) : 'sin datos'} (${formatearCantidad(p.semana.desperdiciado)} unidades)`}</title>
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

              <div style={{ flex: 1, backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Ajustes por motivo</h3>
                <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Cambios realizados a las sugerencias</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {impacto.ajustesPorMotivo.map((item) => (
                    <div key={item.motivo}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.9rem', color: textDark, fontWeight: '600' }}>{etiquetaMotivoAjuste(item.motivo)}</span>
                        <span style={{ fontSize: '0.9rem', color: textGray }}>{item.cantidad}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(item.cantidad / maxAjustes) * 100}%`, height: '100%', backgroundColor: '#C99B36', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sugerencias aplicadas */}
            <div style={{ backgroundColor: bgCard, padding: '25px 30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px', position: 'relative' }}>
              <h3 style={{ fontSize: '1.1rem', color: textDark, margin: '0 0 15px 0' }}>Sugerencias aplicadas</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '15px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>{aplicadas.aplicadas}</span>
                <span style={{ fontSize: '1.2rem', color: textGray }}>de {aplicadas.total}</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#F1EDE4', borderRadius: '5px', overflow: 'hidden', marginBottom: '15px' }}>
                <div style={{ width: `${aplicadas.porcentaje ?? 0}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '5px' }}></div>
              </div>
              {aplicadas.porcentaje != null && (
                <span style={{ position: 'absolute', top: '30px', right: '30px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FDF8EC', color: '#B89732', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {formatearPorcentaje(aplicadas.porcentaje)}
                </span>
              )}
              <p style={{ color: textGray, fontSize: '0.95rem', margin: 0 }}>
                {aplicadas.total === 0
                  ? 'Todavía no hay días con sugerencia y producción cargada para comparar.'
                  : aplicadas.vecesMasDesperdicio != null
                    ? <>Cuando no se siguió la sugerencia, el desperdicio fue <strong style={{ color: textDark }}>{formatearCantidad(aplicadas.vecesMasDesperdicio)}× {aplicadas.vecesMasDesperdicio >= 1 ? 'mayor' : 'menor'}</strong>.</>
                    : 'Se considera aplicada cuando lo producido quedó a ±10% de lo sugerido.'}
              </p>
            </div>

            {/* Precisión por producto */}
            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 20px 0' }}>Precisión por producto</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>SUGERIDO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>VENDIDO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>DESPERDICIO</th>
                    <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>PRECISIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {filasProductos.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '25px 0', textAlign: 'center', color: textGray }}>Sin datos para comparar en este período.</td></tr>
                  )}
                  {filasProductos.map((prod, index) => {
                    const badge = estiloPrecision(prod.precision ?? 0);
                    const u = unidadCorta(prod.unidadMedida);
                    return (
                      <tr key={prod.productoId} style={{ borderBottom: index === filasProductos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                        <td style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                        <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(prod.sugerido)} {u}</td>
                        <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(prod.vendido)} {u}</td>
                        <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(prod.desperdicio)} {u}</td>
                        <td style={{ padding: '20px 0', textAlign: 'right' }}>
                          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                            {prod.precision != null ? formatearPorcentaje(prod.precision) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {impacto.productos.length > POR_DEFECTO_VISIBLES && (
                <div className="no-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>Mostrando {filasProductos.length} de {impacto.productos.length} productos</span>
                  <span onClick={() => setVerTodos(!verTodos)} style={{ color: '#B89732', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>{verTodos ? 'Ver menos' : 'Ver todos'}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hover-bg:hover { background-color: #FDF8EC; }
        @media print {
          .no-imprimir { display: none !important; }
          .pantalla-impacto { height: auto !important; overflow: visible !important; width: 100% !important; }
          .contenido-impacto { overflow: visible !important; height: auto !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default Impacto;
