import { useState, useEffect } from 'react';
import { apiFetch, leerMensajeError, EVENTO_DATOS_CAMBIARON, MENSAJE_SIN_CONEXION } from '../api';
import { formatearMomento } from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';

// Tipos de alerta del backend (enum TipoAlerta) con su nombre y colores
const TIPOS = {
  INACTIVIDAD: { nombre: 'Inactividad', bg: '#FDF8EC', color: '#B89732', dot: '#D4AF37' },
  STOCK_BAJO: { nombre: 'Stock bajo', bg: '#FCE8E6', color: '#C5221F', dot: '#C5221F' },
};
const LEIDA = { bg: '#F1F3F4', color: '#888888', dot: '#CCCCCC' };

// Campanita con la cantidad de alertas sin leer. Al tocarla abre el panel lateral de alertas.
// Opcionalmente, "abierto" y "alCambiar" dejan que otra parte de la pantalla (ej: la tarjeta
// "Alertas sin leer" de Principal) abra el mismo panel.
export function BotonAlertas({ abierto: abiertoExterno, alCambiar }) {
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const abierto = abiertoExterno ?? abiertoInterno;
  const setAbierto = alCambiar ?? setAbiertoInterno;
  const [sinLeer, setSinLeer] = useState(0);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Alertas"
        aria-label={`Alertas${sinLeer > 0 ? `: ${sinLeer} sin leer` : ''}`}
        style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray, flexShrink: 0 }}
      >
        🔔
        {sinLeer > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#C5221F', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
            {sinLeer > 99 ? '99+' : sinLeer}
          </span>
        )}
      </button>
      <PanelAlertas abierto={abierto} alCerrar={() => setAbierto(false)} alCambiarSinLeer={setSinLeer} />
    </>
  );
}

// Panel lateral con las alertas del comercio. Se mantiene montado para conocer la cantidad sin leer.
function PanelAlertas({ abierto, alCerrar, alCambiarSinLeer }) {
  const [alertas, setAlertas] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);   // cambiarla vuelve a pedir las alertas

  // Cualquier carga puede generar o resolver alertas
  useEffect(() => {
    const recargar = () => setVersion(v => v + 1);
    window.addEventListener(EVENTO_DATOS_CAMBIARON, recargar);
    return () => window.removeEventListener(EVENTO_DATOS_CAMBIARON, recargar);
  }, []);

  // Se cargan al entrar a la pantalla, cada vez que se abre el panel y cuando cambian los datos
  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/alertas');
        if (!vigente) return;
        if (res.ok) {
          const data = await res.json();
          if (!vigente) return;
          setAlertas(data);
          alCambiarSinLeer(data.filter(a => !a.leida).length);
          setError('');
        } else {
          setError(await leerMensajeError(res, 'No se pudieron cargar las alertas.'));
        }
      } catch {
        if (vigente) setError(MENSAJE_SIN_CONEXION);
      }
    };
    cargar();
    return () => { vigente = false; };
  }, [abierto, version, alCambiarSinLeer]);

  const marcarTodas = async () => {
    try {
      const res = await apiFetch('/api/alertas/leer-todas', { method: 'PUT' });
      if (!res.ok) setError(await leerMensajeError(res, 'No se pudieron marcar las alertas.'));
    } catch {
      setError(MENSAJE_SIN_CONEXION);
    }
  };

  const marcarLeida = async (alerta) => {
    if (alerta.leida) return;
    try {
      const res = await apiFetch(`/api/alertas/${alerta.id}/leida`, { method: 'PUT' });
      if (!res.ok) setError(await leerMensajeError(res, 'No se pudo marcar la alerta.'));
    } catch {
      setError(MENSAJE_SIN_CONEXION);
    }
  };

  if (!abierto) return null;

  const visibles = alertas.filter(a => filtro === 'TODAS' || a.tipo === filtro);
  const chip = (valor, texto) => (
    <button key={valor} onClick={() => setFiltro(valor)} style={{ padding: '6px 14px', backgroundColor: filtro === valor ? '#F4D06F' : bgCard, border: filtro === valor ? '1px solid transparent' : `1px solid ${borderLight}`, color: filtro === valor ? textDark : textGray, borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
      {texto}
    </button>
  );

  return (
    <>
      <div onClick={alCerrar} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 2600 }} />
      <div role="dialog" aria-label="Alertas" style={{ position: 'fixed', top: 0, right: 0, width: '380px', maxWidth: '100vw', height: '100%', backgroundColor: bgCard, boxShadow: '-4px 0 20px rgba(0,0,0,0.08)', zIndex: 2700, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <div style={{ padding: '30px 25px 20px 25px', borderBottom: `1px solid ${borderLight}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: 0 }}>Alertas</h2>
            <button onClick={alCerrar} aria-label="Cerrar alertas" style={{ fontSize: '1.5rem', cursor: 'pointer', color: textGray, background: 'none', border: 'none' }}>×</button>
          </div>
          {alertas.some(a => !a.leida) && (
            <button onClick={marcarTodas} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
              Marcar todas como leídas
            </button>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            {chip('TODAS', 'Todas')}
            {Object.entries(TIPOS).map(([valor, t]) => chip(valor, t.nombre))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {error && <p role="alert" style={{ color: '#C5221F', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
          {!error && visibles.length === 0 && (
            <p style={{ color: textGray, fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>No hay alertas{filtro !== 'TODAS' ? ' de este tipo' : ''}.</p>
          )}
          {visibles.map((alerta) => {
            const tipo = TIPOS[alerta.tipo] ?? TIPOS.INACTIVIDAD;
            const estilo = alerta.leida ? LEIDA : tipo;
            return (
              <div key={alerta.id} onClick={() => marcarLeida(alerta)} title={alerta.leida ? '' : 'Tocá para marcarla como leída'}
                style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '12px', padding: '16px', opacity: alerta.leida ? 0.6 : 1, cursor: alerta.leida ? 'default' : 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: estilo.dot }}></div>
                  <span style={{ backgroundColor: estilo.bg, color: estilo.color, padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {tipo.nombre}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: alerta.leida ? '500' : 'bold', color: textDark, lineHeight: '1.4' }}>
                  {alerta.mensaje}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
                  {formatearMomento(alerta.fechaCreacion)}{alerta.enviadaPorEmail ? ' · También enviada por email' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
