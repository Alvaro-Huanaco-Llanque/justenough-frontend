import { useState, useEffect } from 'react';
import BarraLateral from '../components/BarraLateral';
import { apiFetch, leerMensajeError } from '../api';
import { formatearFechaLarga, hoyISO } from '../utils/productos';

const bgApp = '#FAF9F6';
const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const CATEGORIAS = ['Feria', 'Partido', 'Corte de calle', 'Vacaciones', 'Otro'];

// Colores y nombre de cada tipo de evento (los valores son los del enum TipoEvento del backend)
const ESTILO_TIPO = {
  FERIADO: { fondo: '#FCEAEA', texto: '#B03A3A', nombre: 'Feriado nacional' },
  FECHA_ESPECIAL: { fondo: '#F0EBFA', texto: '#6A4FA3', nombre: 'Efeméride' },
  EVENTO_LOCAL: { fondo: '#FDF6E3', texto: '#9C7A16', nombre: 'Evento propio' },
};

// Cómo llama ArgentinaDatos a cada tipo de feriado
const TIPO_FERIADO = { inamovible: 'Inamovible', trasladable: 'Trasladable', puente: 'Día no laborable (puente)' };

const IMPACTOS = { MAS_DEMANDA: '↑ Más demanda', MENOS_DEMANDA: '↓ Menos demanda' };

const EVENTO_VACIO = { nombre: '', fecha: '', categoria: 'Feria', impacto: 'MAS_DEMANDA' };

// Date local -> "AAAA-MM-DD" (sin pasar por UTC, para que no cambie el día)
const aISO = (fecha) => fecha.toLocaleDateString('en-CA');

// Días que se muestran para un mes: semanas completas de lunes a domingo,
// incluyendo los últimos días del mes anterior y los primeros del siguiente.
function diasDeLaGrilla(anio, mes) {
  const desplazamiento = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const total = Math.ceil((desplazamiento + diasDelMes) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(anio, mes, 1 - desplazamiento + i));
}

function nombreMes(anio, mes) {
  const texto = new Date(anio, mes, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Calendario: feriados nacionales (ArgentinaDatos), efemérides y eventos propios del comercio.
// Los feriados y eventos propios se usan en la predicción de Sugerencias.
function Calendario() {
  const hoy = hoyISO();
  const [mesVisible, setMesVisible] = useState(() => {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }

  const [modal, setModal] = useState(null); // null = cerrado; si no, los datos del evento nuevo
  const [errorModal, setErrorModal] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cada vez que cambia el mes o "version" se vuelven a pedir los eventos
  const [version, setVersion] = useState(0);
  const recargar = () => setVersion(v => v + 1);

  const dias = diasDeLaGrilla(mesVisible.anio, mesVisible.mes);
  const desde = aISO(dias[0]);
  const hasta = aISO(dias[dias.length - 1]);

  useEffect(() => {
    let vigente = true; // evita pisar el mes nuevo con la respuesta de un mes anterior
    const cargar = async () => {
      try {
        const res = await apiFetch(`/api/eventos?desde=${desde}&hasta=${hasta}`);
        if (!vigente) return;
        if (res.ok) {
          setEventos(await res.json());
        } else {
          setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudo cargar el calendario.') });
        }
      } catch {
        if (vigente) setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [desde, hasta, version]);

  const mostrarAviso = (tipo, texto) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  };

  // ================= NAVEGACIÓN =================
  const irAMes = (anio, mes) => {
    const d = new Date(anio, mes, 1);
    setCargando(true);
    setMesVisible({ anio: d.getFullYear(), mes: d.getMonth() });
  };
  const irAHoy = () => {
    const d = new Date();
    if (d.getFullYear() !== mesVisible.anio || d.getMonth() !== mesVisible.mes) irAMes(d.getFullYear(), d.getMonth());
    setDiaSeleccionado(hoy);
  };
  const elegirDia = (fecha) => {
    setDiaSeleccionado(aISO(fecha));
    // Si se toca un día del mes anterior o siguiente, se pasa a ese mes
    if (fecha.getMonth() !== mesVisible.mes) irAMes(fecha.getFullYear(), fecha.getMonth());
  };

  // ================= ALTA Y BAJA DE EVENTOS PROPIOS =================
  // No se cargan eventos en días que ya pasaron: si el día elegido es pasado, se propone hoy
  const abrirModal = (fecha = diaSeleccionado) => {
    setErrorModal('');
    setModal({ ...EVENTO_VACIO, fecha: fecha < hoy ? hoy : fecha });
  };

  const guardarEvento = async () => {
    if (!modal.nombre.trim()) { setErrorModal('Poné un nombre para el evento.'); return; }
    if (!modal.fecha) { setErrorModal('Elegí una fecha.'); return; }
    if (modal.fecha < hoy) { setErrorModal('No se pueden agregar eventos en fechas que ya pasaron.'); return; }
    setGuardando(true);
    try {
      const res = await apiFetch('/api/eventos', { method: 'POST', body: JSON.stringify(modal) });
      if (res.ok) {
        const [a, m] = modal.fecha.split('-').map(Number);
        setModal(null);
        setDiaSeleccionado(modal.fecha);
        if (a !== mesVisible.anio || m - 1 !== mesVisible.mes) irAMes(a, m - 1);
        else recargar();
        mostrarAviso('ok', 'Evento agregado al calendario.');
      } else {
        setErrorModal(await leerMensajeError(res, 'No se pudo guardar el evento.'));
      }
    } catch {
      setErrorModal('No se pudo conectar con el servidor.');
    }
    setGuardando(false);
  };

  const eliminarEvento = async (evento) => {
    if (!window.confirm(`¿Borrar "${evento.titulo}" del calendario?`)) return;
    const res = await apiFetch(`/api/eventos/${evento.id}`, { method: 'DELETE' });
    if (res.ok) {
      setEventos(eventos.filter(e => e.id !== evento.id || !e.propio));
      mostrarAviso('ok', 'Evento borrado.');
    } else {
      mostrarAviso('error', await leerMensajeError(res, 'No se pudo borrar el evento.'));
    }
  };

  // ================= DATOS PARA PINTAR =================
  const eventosPorDia = {};
  eventos.forEach(e => { (eventosPorDia[e.fecha] ??= []).push(e); });
  const eventosDelDia = eventosPorDia[diaSeleccionado] ?? [];
  const esFeriado = (iso) => (eventosPorDia[iso] ?? []).some(e => e.tipo === 'FERIADO');

  // Lo que queda del mes visible a partir de hoy (o todo el mes, si es un mes futuro)
  const primerDiaMes = aISO(new Date(mesVisible.anio, mesVisible.mes, 1));
  const ultimoDiaMes = aISO(new Date(mesVisible.anio, mesVisible.mes + 1, 0));
  const proximos = eventos.filter(e =>
    e.tipo !== 'FECHA_ESPECIAL' && e.fecha >= primerDiaMes && e.fecha <= ultimoDiaMes && e.fecha >= hoy
  );

  const chip = (e, compacto) => {
    const estilo = ESTILO_TIPO[e.tipo] ?? ESTILO_TIPO.EVENTO_LOCAL;
    return (
      <div key={`${e.tipo}-${e.id ?? e.titulo}`} title={e.titulo} style={{ backgroundColor: estilo.fondo, color: estilo.texto, padding: compacto ? '3px 6px' : '6px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {e.tipo === 'EVENTO_LOCAL' && e.impacto && <span>{e.impacto === 'MAS_DEMANDA' ? '↑ ' : '↓ '}</span>}
        {e.titulo}
      </div>
    );
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' };
  const botonFlecha = { width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: bgCard, cursor: 'pointer', fontSize: '1rem', color: textDark };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>

      <BarraLateral seccionActiva="calendario" />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Calendario</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoy)} · Los feriados y tus eventos se usan en la predicción.</p>
          </div>
          <button onClick={() => abrirModal()} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            + Agregar evento
          </button>
        </div>

        {aviso && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: aviso.tipo === 'ok' ? '#EAF6EC' : '#FCEAEA', color: aviso.tipo === 'ok' ? '#2E7D32' : '#B03A3A' }}>
            {aviso.texto}
          </div>
        )}

        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>

          {/* ================= GRILLA DEL MES ================= */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Navegación y referencias */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => irAMes(mesVisible.anio, mesVisible.mes - 1)} title="Mes anterior" style={botonFlecha}>←</button>
                <h2 style={{ fontSize: '1.4rem', color: textDark, margin: 0, minWidth: '190px', textAlign: 'center' }}>{nombreMes(mesVisible.anio, mesVisible.mes)}</h2>
                <button onClick={() => irAMes(mesVisible.anio, mesVisible.mes + 1)} title="Mes siguiente" style={botonFlecha}>→</button>
                <button onClick={irAHoy} style={{ ...botonFlecha, width: 'auto', padding: '0 14px', fontWeight: 'bold', fontSize: '0.85rem' }}>Hoy</button>
                {cargando && <span style={{ color: textGray, fontSize: '0.85rem' }}>Cargando…</span>}
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: textGray }}>
                {Object.entries(ESTILO_TIPO).map(([tipo, estilo]) => (
                  <span key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: estilo.texto }}></span>{estilo.nombre}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: `1px solid ${borderLight}` }}>
                {DIAS_SEMANA.map(dia => (
                  <div key={dia} style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#A0A0A0', letterSpacing: '0.5px' }}>{dia}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(110px, auto)' }}>
                {dias.map((fecha, i) => {
                  const iso = aISO(fecha);
                  const delMes = fecha.getMonth() === mesVisible.mes;
                  const delDia = eventosPorDia[iso] ?? [];
                  const seleccionado = iso === diaSeleccionado;
                  const esHoy = iso === hoy;
                  const rojo = esFeriado(iso) || fecha.getDay() === 0;
                  return (
                    <div
                      key={iso}
                      onClick={() => elegirDia(fecha)}
                      style={{
                        borderRight: (i + 1) % 7 === 0 ? 'none' : `1px solid ${borderLight}`,
                        borderBottom: i >= dias.length - 7 ? 'none' : `1px solid ${borderLight}`,
                        padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', minWidth: 0,
                        backgroundColor: seleccionado ? '#FFFBEF' : delMes ? bgCard : '#FAFAFA',
                        boxShadow: seleccionado ? `inset 0 0 0 2px ${goldPrimary}` : 'none',
                        opacity: delMes ? 1 : 0.55
                      }}
                    >
                      <span style={{
                        alignSelf: 'flex-start', fontSize: '0.85rem', fontWeight: 'bold',
                        width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: esHoy ? goldPrimary : 'transparent',
                        color: esHoy ? '#FFF' : rojo ? '#B03A3A' : textDark
                      }}>{fecha.getDate()}</span>
                      {delDia.slice(0, 2).map(e => chip(e, true))}
                      {delDia.length > 2 && <span style={{ fontSize: '0.7rem', color: textGray, fontWeight: 'bold' }}>+{delDia.length - 2} más</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= PANEL DEL DÍA ================= */}
          <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#A0A0A0', fontWeight: 'bold', letterSpacing: '0.5px' }}>{diaSeleccionado === hoy ? 'HOY' : 'DÍA SELECCIONADO'}</span>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '4px 0 15px 0' }}>{formatearFechaLarga(diaSeleccionado)}</h3>

              {eventosDelDia.length === 0 && (
                <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 15px 0' }}>Día normal: no hay feriados ni eventos.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                {eventosDelDia.map(e => {
                  const estilo = ESTILO_TIPO[e.tipo] ?? ESTILO_TIPO.EVENTO_LOCAL;
                  const detalle = e.tipo === 'FERIADO' ? TIPO_FERIADO[e.categoria] ?? e.categoria
                    : e.tipo === 'EVENTO_LOCAL' ? [e.categoria, IMPACTOS[e.impacto]].filter(Boolean).join(' · ')
                    : null;
                  return (
                    <div key={`${e.tipo}-${e.id ?? e.titulo}`} style={{ borderLeft: `4px solid ${estilo.texto}`, backgroundColor: estilo.fondo, borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: estilo.texto, letterSpacing: '0.3px' }}>{estilo.nombre.toUpperCase()}</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark, margin: '2px 0' }}>{e.titulo}</div>
                        {detalle && <div style={{ fontSize: '0.8rem', color: textGray }}>{detalle}</div>}
                      </div>
                      {e.propio && (
                        <span onClick={() => eliminarEvento(e)} title="Borrar evento" style={{ cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0 }}>🗑️</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {diaSeleccionado >= hoy ? (
                <button onClick={() => abrirModal(diaSeleccionado)} style={{ width: '100%', padding: '10px', backgroundColor: bgCard, color: textDark, border: `1px dashed ${goldPrimary}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                  + Agregar evento este día
                </button>
              ) : (
                <p style={{ color: '#A0A0A0', fontSize: '0.8rem', margin: 0 }}>Este día ya pasó: no se le pueden agregar eventos.</p>
              )}
            </div>

            <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: textDark, margin: '0 0 12px 0' }}>Próximos feriados y eventos del mes</h3>
              {proximos.length === 0 ? (
                <p style={{ color: textGray, fontSize: '0.85rem', margin: 0 }}>No quedan feriados ni eventos este mes.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {proximos.map(e => (
                    <div key={`${e.tipo}-${e.id}`} onClick={() => setDiaSeleccionado(e.fecha)} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                      <span style={{ width: '34px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: ESTILO_TIPO[e.tipo]?.texto ?? textDark }}>{Number(e.fecha.slice(8))}</span>
                      <span style={{ fontSize: '0.85rem', color: textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titulo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL "AGREGAR EVENTO" ================= */}
      {modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>

            <h3 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 6px 0', fontWeight: 'bold' }}>Agregar evento</h3>
            <p style={{ color: textGray, fontSize: '0.85rem', margin: '0 0 20px 0' }}>Algo que pueda cambiar tus ventas ese día. Solo lo ve tu comercio.</p>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Nombre</label>
              <input type="text" placeholder="Ej. Argentina vs. Brasil" maxLength={120} value={modal.nombre}
                onChange={(e) => setModal({ ...modal, nombre: e.target.value })} style={inputStyle} autoFocus />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Fecha</label>
              <input type="date" min={hoy} value={modal.fecha} onChange={(e) => setModal({ ...modal, fecha: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Tipo</label>
              <select value={modal.categoria} onChange={(e) => setModal({ ...modal, categoria: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Impacto esperado</label>
              <select value={modal.impacto} onChange={(e) => setModal({ ...modal, impacto: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(IMPACTOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
              </select>
            </div>

            {errorModal && <p style={{ color: '#B03A3A', fontSize: '0.85rem', margin: '0 0 15px 0' }}>{errorModal}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button onClick={guardarEvento} disabled={guardando} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', fontSize: '0.9rem', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando…' : 'Guardar evento'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Calendario;
