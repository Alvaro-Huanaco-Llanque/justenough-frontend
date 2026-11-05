import { useState } from 'react';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { MOTIVOS_DESECHO, formatearFechaLarga, cantidadConUnidad, unidadCorta } from '../utils/productos';

const TITULOS = { INGRESO: 'el ingreso', VENTA: 'la venta', DESECHO: 'el desecho' };

// Corrige el total cargado de un día, para arreglar un error de carga. El stock se ajusta solo por la diferencia.
// producto = { id, nombre, unidadMedida }, tipo = INGRESO | VENTA | DESECHO, actual = total cargado hoy en ese día
function ModalCorreccion({ producto, fecha, tipo, actual, motivoActual, alCerrar, alGuardar }) {
  const [cantidad, setCantidad] = useState(String(actual));
  const [motivo, setMotivo] = useState(motivoActual ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const numero = cantidad === '' ? 0 : parseFloat(cantidad);
    if (Number.isNaN(numero) || numero < 0) { setError('Ingresá una cantidad válida (0 o más).'); return; }
    if (tipo === 'DESECHO' && numero > 0 && !motivo) { setError('Elegí el motivo del desecho.'); return; }
    setGuardando(true);
    setError('');
    try {
      const res = await apiFetch('/api/registros-diarios/corregir', {
        method: 'PUT',
        body: JSON.stringify({ productoId: producto.id, fecha, tipo, cantidad: numero, motivo: tipo === 'DESECHO' && motivo ? motivo : null })
      });
      if (res.ok) {
        alGuardar(`Corregido: ${producto.nombre} quedó en ${cantidadConUnidad(numero, producto.unidadMedida)} ese día.`);
      } else {
        setError(await leerMensajeError(res, 'No se pudo guardar la corrección.'));
      }
    } catch {
      setError(MENSAJE_SIN_CONEXION);
    }
    setGuardando(false);
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE6DF', backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#1A1A1A' };

  return (
    <div className="modal-fondo">
      <div className="modal-caja" role="dialog" aria-modal="true" aria-label="Corregir carga" style={{ maxWidth: '420px' }}>
        <h3 style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>Corregir {TITULOS[tipo]}</h3>
        <p style={{ color: '#666666', fontSize: '0.92rem', margin: '0 0 20px 0' }}>
          <strong style={{ color: '#1A1A1A' }}>{producto.nombre}</strong> · {formatearFechaLarga(fecha)}. Escribí el <strong>total correcto</strong> de ese día: el stock se ajusta por la diferencia.
        </p>

        <label htmlFor="correccion-cantidad" style={labelStyle}>Total correcto</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <input id="correccion-cantidad" type="number" min="0" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)} style={inputStyle} autoFocus />
          <span style={{ color: '#666666' }}>{unidadCorta(producto.unidadMedida)}</span>
        </div>

        {tipo === 'DESECHO' && (
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="correccion-motivo" style={labelStyle}>Motivo</label>
            <select id="correccion-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Seleccionar</option>
              {MOTIVOS_DESECHO.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </select>
          </div>
        )}

        {error && <p role="alert" style={{ color: '#C5221F', fontSize: '0.88rem', margin: '0 0 10px 0' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={alCerrar} style={{ padding: '10px 20px', backgroundColor: '#FFFFFF', color: '#1A1A1A', border: '1px solid #EAE6DF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer' }}>
            {guardando ? 'Guardando...' : 'Guardar corrección'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCorreccion;
