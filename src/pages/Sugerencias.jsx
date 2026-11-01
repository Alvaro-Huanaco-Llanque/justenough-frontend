import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError } from '../api';
import { MOTIVOS_AJUSTE, hoyISO, unidadCorta } from '../utils/productos';

const DIAS_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DIAS_NOMBRES = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo'
};

function obtenerLunesActual() {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 = dom, 1 = lun...
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunes = new Date(hoy.setDate(diff));
  return lunes.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function formatearConfianza(nivelEnum) {
  if (!nivelEnum) return 'Baja';
  const up = nivelEnum.toUpperCase();
  if (up === 'ALTA') return 'Alta';
  if (up === 'MEDIA') return 'Media';
  return 'Baja';
}

// Agrupa las filas individuales de la BD (1 por día) en una fila semanal por producto
function agruparPorProducto(listaSugerencias, lunesSemana) {
  const mapa = {};
  const baseLunes = new Date(lunesSemana + 'T00:00:00');

  listaSugerencias.forEach((s) => {
    if (!s.producto) return;
    const pId = s.producto.id;
    if (!mapa[pId]) {
      mapa[pId] = {
        id: pId,
        nombre: s.producto.nombre,
        unidadMedida: s.producto.unidadMedida || 'UNIDAD',
        confianza: formatearConfianza(s.nivelConfianza),
        dias: {}, // { lun: { sugerenciaId, sugerida, final, estado, fecha }, ... }
        aceptadaCompleta: true
      };
    }

    const fechaSug = new Date(s.fecha + 'T00:00:00');
    const diffDias = Math.round((fechaSug - baseLunes) / (1000 * 60 * 60 * 24));
    if (diffDias >= 0 && diffDias < 7) {
      const key = DIAS_KEYS[diffDias];
      mapa[pId].dias[key] = {
        sugerenciaId: s.id,
        sugerida: s.cantidadSugerida,
        final: s.cantidadFinal,
        estado: s.estado,
        fecha: s.fecha
      };
      if (s.estado === 'PENDIENTE') {
        mapa[pId].aceptadaCompleta = false;
      }
    }
  });

  return Object.values(mapa).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function Sugerencias() {
  const navigate = useNavigate();

  const [lunesSemana] = useState(obtenerLunesActual);
  const [filasProductos, setFilasProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);   // cambiarla vuelve a pedir la semana
  const recargar = () => setVersion(v => v + 1);

  // Estado del Modal de Ajuste
  const [modal, setModal] = useState({
    abierto: false,
    producto: null,
    diaKey: 'sab',
    sugerenciaId: null,
    fechaDia: '',
    cantidadOriginal: '',
    nuevaCantidad: '',
    motivo: 'EVENTO',
    comentario: ''
  });
  const hoy = hoyISO();

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  };

  // Sugerencias de la semana. El backend calcula las que falten y recalcula solo con la IA
  // cuando hay cargas nuevas (ventas, producción, desechos o eventos), así que no hace falta un botón.
  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch(`/api/sugerencias/semana?desde=${lunesSemana}`);
        if (!vigente) return;
        if (res.ok) {
          setFilasProductos(agruparPorProducto((await res.json()).sugerencias, lunesSemana));
        } else {
          setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron obtener las sugerencias.') });
        }
      } catch {
        if (vigente) setAviso({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [lunesSemana, version]);

  // Solo se pueden ajustar los días de hoy en adelante
  const esEditable = (infoDia) => Boolean(infoDia) && infoDia.fecha >= hoy;

  const abrirModalAjuste = (prod, diaInicial) => {
    const clave = esEditable(prod.dias[diaInicial]) ? diaInicial : DIAS_KEYS.find(d => esEditable(prod.dias[d]));
    const infoDia = clave && prod.dias[clave];
    if (!infoDia) { mostrarAviso('error', 'No quedan días de esta semana para ajustar.'); return; }

    setModal({
      abierto: true,
      producto: prod,
      diaKey: clave,
      sugerenciaId: infoDia.sugerenciaId,
      fechaDia: infoDia.fecha,
      cantidadOriginal: `${infoDia.sugerida} ${unidadCorta(prod.unidadMedida)}`,
      nuevaCantidad: String(infoDia.final),
      motivo: 'EVENTO',
      comentario: ''
    });
  };

  const cambiarDiaEnModal = (nuevoDiaKey) => {
    const infoDia = modal.producto?.dias[nuevoDiaKey];
    if (!esEditable(infoDia)) return;
    setModal({
      ...modal,
      diaKey: nuevoDiaKey,
      sugerenciaId: infoDia.sugerenciaId,
      fechaDia: infoDia.fecha,
      cantidadOriginal: `${infoDia.sugerida} ${unidadCorta(modal.producto.unidadMedida)}`,
      nuevaCantidad: String(infoDia.final)
    });
  };

  const cerrarModal = () => setModal({ ...modal, abierto: false });

  const guardarAjuste = async () => {
    const num = parseFloat(modal.nuevaCantidad);
    if (isNaN(num) || num < 0) {
      alert('Ingresá una cantidad válida.');
      return;
    }

    try {
      const res = await apiFetch(`/api/sugerencias/${modal.sugerenciaId}/ajustar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevaCantidad: num,
          motivo: modal.motivo,
          comentario: modal.comentario
        })
      });

      if (res.ok) {
        mostrarAviso('ok', `Ajuste guardado para ${modal.producto.nombre} (${DIAS_NOMBRES[modal.diaKey]}).`);
        cerrarModal();
        recargar();
      } else {
        alert(await leerMensajeError(res, 'No se pudo guardar el ajuste.'));
      }
    } catch {
      alert('Error al conectar con el servidor.');
    }
  };

  const aceptarFilaProducto = async (productoId, nombre) => {
    try {
      const res = await apiFetch(`/api/sugerencias/producto/${productoId}/aceptar?desde=${lunesSemana}`, {
        method: 'PUT'
      });
      if (res.ok) {
        mostrarAviso('ok', `Plan semanal de ${nombre} aceptado.`);
        recargar();
      } else {
        mostrarAviso('error', await leerMensajeError(res, 'No se pudo aceptar la sugerencia.'));
      }
    } catch {
      mostrarAviso('error', 'No se pudo aceptar la sugerencia.');
    }
  };

  const aceptarTodas = async () => {
    setProcesando(true);
    try {
      const res = await apiFetch(`/api/sugerencias/aceptar-todas?desde=${lunesSemana}`, {
        method: 'PUT'
      });
      if (res.ok) {
        mostrarAviso('ok', '¡Todas las sugerencias de la semana fueron aceptadas!');
        recargar();
      } else {
        mostrarAviso('error', await leerMensajeError(res, 'No se pudieron aceptar las sugerencias.'));
      }
    } catch {
      mostrarAviso('error', 'No se pudieron aceptar las sugerencias.');
    }
    setProcesando(false);
  };

  const getBadgeColor = (confianza) => {
    if (confianza === 'Alta') return { bg: '#E6F4EA', color: '#137333' };
    if (confianza === 'Media') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#FCE8E6', color: '#C5221F' };
  };

  // Formateo del rango de fechas de la semana para el título
  const fechaLunesObj = new Date(lunesSemana + 'T00:00:00');
  const fechaDomingoObj = new Date(fechaLunesObj);
  fechaDomingoObj.setDate(fechaLunesObj.getDate() + 6);
  const opcionesCortas = { day: 'numeric', month: 'short' };
  const rangoTexto = `${fechaLunesObj.toLocaleDateString('es-AR', opcionesCortas)} – ${fechaDomingoObj.toLocaleDateString('es-AR', opcionesCortas)}`;

  const bgApp = '#FAF9F6';
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';
  const goldLight = '#F9EBBF';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
      <BarraLateral seccionActiva="sugerencias" />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Sugerencias</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem', textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <BotonAlertas />
        </div>

        {/* Título de la Semana y Botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Sugerencia semanal · {rangoTexto}</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Revisá y aceptá el plan sugerido por el modelo predictivo.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🍪
            </div>
            <button
              onClick={aceptarTodas}
              disabled={procesando || filasProductos.length === 0}
              style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              Aceptar todas
            </button>
          </div>
        </div>

        {aviso && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: aviso.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: aviso.tipo === 'ok' ? '#137333' : '#C5221F' }}>
            {aviso.texto}
          </div>
        )}

        {/* Tabla de Sugerencias */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>LUN</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MAR</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MIÉ</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>JUE</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>VIE</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>SÁB</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>DOM</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>CONFIANZA</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="10" style={{ padding: '40px', color: textGray }}>Calculando predicciones...</td></tr>
              ) : filasProductos.length === 0 ? (
                <tr><td colSpan="10" style={{ padding: '40px', color: textGray }}><MensajeVacio>No hay productos de stock activos en el catálogo para predecir.</MensajeVacio></td></tr>
              ) : (
                filasProductos.map((prod, index) => {
                  const badge = getBadgeColor(prod.confianza);
                  return (
                    <tr key={prod.id} style={{ borderBottom: index === filasProductos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                      <td style={{ padding: '15px 20px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>
                        {prod.nombre}
                      </td>
                      {DIAS_KEYS.map(dia => {
                        const celda = prod.dias[dia];
                        const valorMostrar = celda ? celda.final : '-';
                        const fueAjustado = celda && celda.estado === 'AJUSTADA';
                        const fueAceptado = celda && celda.estado === 'ACEPTADA';
                        const editable = esEditable(celda);

                        return (
                          <td key={dia} style={{ padding: '15px 10px' }}>
                            <div
                              onClick={() => editable && abrirModalAjuste(prod, dia)}
                              title={editable ? 'Hacé clic para ajustar este día' : celda ? 'Este día ya pasó' : 'Sin sugerencia para este día'}
                              style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: fueAjustado ? `2px solid #F4D06F` : (fueAceptado ? `1px solid #137333` : `1px solid ${borderLight}`),
                                backgroundColor: fueAjustado ? '#FDF8EC' : (fueAceptado ? '#F4FBF6' : bgCard),
                                color: editable ? textDark : '#A0A0A0',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                position: 'relative',
                                cursor: editable ? 'pointer' : 'default'
                              }}
                            >
                              {valorMostrar}
                              {fueAjustado && <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '0.7rem' }}>✏️</span>}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '15px 10px' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                          {prod.confianza}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => aceptarFilaProducto(prod.id, prod.nombre)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: prod.aceptadaCompleta ? '#E6F4EA' : '#FDF8EC',
                              color: prod.aceptadaCompleta ? '#137333' : '#B89732',
                              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                            }}
                          >
                            {prod.aceptadaCompleta ? '✓ Aceptado' : 'Aceptar'}
                          </button>
                          <button 
                            onClick={() => abrirModalAjuste(prod)}
                            style={{ padding: '6px 12px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Ajustar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          <div style={{ padding: '15px 20px', borderTop: `1px solid ${borderLight}`, backgroundColor: bgApp, fontSize: '0.85rem', color: textGray, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> La confianza depende de los días de historial de cada producto.{' '}
            <span onClick={() => navigate('/madurez')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Ver Madurez →</span>
          </div>
        </div>

      </div>

      {/* ================= MODAL DE AJUSTE ================= */}
      {modal.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '460px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>
                  Ajustar {modal.producto.nombre} · {DIAS_NOMBRES[modal.diaKey]}
                </h3>
                <p style={{ color: textGray, margin: 0, fontSize: '0.85rem' }}>Modificá la recomendación para este día ({modal.fechaDia}).</p>
              </div>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: textGray }}>×</button>
            </div>

            {/* Selector rápido de día dentro del modal */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: textGray, marginBottom: '6px' }}>Día a modificar</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {DIAS_KEYS.map(d => (
                  <button
                    key={d}
                    onClick={() => cambiarDiaEnModal(d)}
                    disabled={!esEditable(modal.producto.dias[d])}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold',
                      textTransform: 'uppercase', cursor: esEditable(modal.producto.dias[d]) ? 'pointer' : 'not-allowed',
                      border: modal.diaKey === d ? `2px solid ${goldPrimary}` : `1px solid ${borderLight}`,
                      backgroundColor: modal.diaKey === d ? '#FDF8EC' : bgCard,
                      color: esEditable(modal.producto.dias[d]) ? textDark : '#C0C0C0'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Cantidad sugerida por IA</label>
              <input type="text" value={modal.cantidadOriginal} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#F5F5F5', color: textGray, fontSize: '0.95rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Nueva cantidad</label>
              <input 
                type="number" 
                value={modal.nuevaCantidad}
                onChange={(e) => setModal({...modal, nuevaCantidad: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${goldPrimary}`, outline: 'none', backgroundColor: bgCard, color: textDark, fontSize: '0.95rem', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Motivo</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {MOTIVOS_AJUSTE.map(m => (
                  <button
                    key={m.valor}
                    onClick={() => setModal({...modal, motivo: m.valor})}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                      border: modal.motivo === m.valor ? `1px solid transparent` : `1px solid ${borderLight}`,
                      backgroundColor: modal.motivo === m.valor ? '#F4D06F' : bgCard,
                      color: textDark
                    }}
                  >
                    {m.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Comentario</label>
              <textarea 
                rows="2"
                maxLength={255}
                value={modal.comentario}
                onChange={(e) => setModal({...modal, comentario: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, outline: 'none', backgroundColor: bgCard, color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', resize: 'none' }} 
              />
              <span style={{ fontSize: '0.75rem', color: textGray, marginTop: '5px', display: 'block' }}>El motivo se usa para mejorar las próximas predicciones.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={cerrarModal} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button onClick={guardarAjuste} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Guardar ajuste
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Sugerencias;