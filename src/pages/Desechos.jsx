import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import ModalCorreccion from '../components/ModalCorreccion';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useAvisoSinGuardar, useFechaDeCarga } from '../utils/hooks';
import {
  MOTIVOS_DESECHO, unidadCorta, cantidadConUnidad, resumirPorUnidad, formatearPrecio, formatearFechaLarga, sumarDias, DIAS_MAX_ATRAS
} from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

const FILA_VACIA = { cantidad: '', motivo: '', observaciones: '' };

// Desechos: lo que se tiró de cada producto, con el motivo.
// Cada carga se suma a lo del día y baja el stock. Para arreglar un error está "Corregir".
function Desechos() {
  const navigate = useNavigate();
  const [fecha, setFecha, hoy] = useFechaDeCarga();
  const [productos, setProductos] = useState([]);
  const [cargados, setCargados] = useState({});   // productoId -> { cantidad, motivo, costo } ya cargado ese día
  const [filas, setFilas] = useState({});         // productoId -> lo que está escrito para agregar
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [correccion, setCorreccion] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const [resProductos, resRegistros] = await Promise.all([
          apiFetch('/api/productos'),
          apiFetch(`/api/registros-diarios?fecha=${fecha}`)
        ]);
        if (!vigente) return;
        if (!resProductos.ok || !resRegistros.ok) {
          setErrorCarga(await leerMensajeError(resProductos.ok ? resRegistros : resProductos, 'No se pudieron cargar los datos.'));
          setCargando(false);
          return;
        }
        const [lista, registros] = await Promise.all([resProductos.json(), resRegistros.json()]);
        if (!vigente) return;
        const yaCargados = {};
        registros.forEach(r => {
          if (r.producto && (r.cantidadDesperdiciada ?? 0) > 0) {
            yaCargados[r.producto.id] = { cantidad: r.cantidadDesperdiciada, motivo: r.motivoDesecho ?? '', costo: r.costoUnitario ?? r.producto.costoUnitario ?? 0 };
          }
        });
        setErrorCarga('');
        setProductos(lista.filter(p => p.activo && p.controlaStock !== false).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setCargados(yaCargados);
      } catch {
        if (vigente) setErrorCarga(MENSAJE_SIN_CONEXION);
      }
      if (vigente) setCargando(false);
    };
    cargar();
    return () => { vigente = false; };
  }, [fecha, version]);

  const filaDe = (id) => filas[id] ?? FILA_VACIA;
  const actualizar = (id, campo, valor) => setFilas({ ...filas, [id]: { ...filaDe(id), [campo]: valor } });

  const aCargar = productos.filter(p => (parseFloat(filaDe(p.id).cantidad) || 0) !== 0);
  const hayCambios = aCargar.length > 0;
  useAvisoSinGuardar(hayCambios, 'Tenés desechos sin guardar. ¿Salir igual?');

  const cambiarFecha = (nueva) => {
    if (hayCambios && !window.confirm('Tenés desechos sin guardar. ¿Cambiar de fecha igual?')) return;
    setAviso(null);
    setFilas({});
    setFecha(nueva);
  };

  const guardar = async () => {
    if (!hayCambios) { setAviso({ tipo: 'error', texto: 'Escribí la cantidad de al menos un producto.' }); return; }
    const sinMotivo = aCargar.find(p => !filaDe(p.id).motivo);
    if (sinMotivo) { setAviso({ tipo: 'error', texto: `Elegí el motivo del desecho de ${sinMotivo.nombre}.` }); return; }
    if (aCargar.some(p => parseFloat(filaDe(p.id).cantidad) < 0)) { setAviso({ tipo: 'error', texto: 'Las cantidades no pueden ser negativas.' }); return; }

    setGuardando(true);
    const desechos = Object.fromEntries(aCargar.map(p => {
      const f = filaDe(p.id);
      return [p.id, { cantidad: parseFloat(f.cantidad), motivo: f.motivo, observaciones: f.observaciones }];
    }));
    try {
      const res = await apiFetch('/api/registros-diarios/desechos-batch', { method: 'POST', body: JSON.stringify({ fecha, desechos }) });
      if (res.ok) {
        const n = aCargar.length;
        setAviso({ tipo: 'ok', texto: `Desechos agregados (${n} producto${n === 1 ? '' : 's'}). El stock ya se descontó.` });
        setFilas({});
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar los desechos.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
    setGuardando(false);
  };

  // Resumen de lo ya cargado ese día, de los productos que se muestran, con el costo guardado de ese día
  const visiblesConDesecho = productos.filter(p => cargados[p.id]);
  const resumenCantidad = resumirPorUnidad(visiblesConDesecho.map(p => ({ cantidad: cargados[p.id].cantidad, unidadMedida: p.unidadMedida })));
  const costoTotal = visiblesConDesecho.reduce((acc, p) => acc + cargados[p.id].cantidad * cargados[p.id].costo, 0);

  const inputBase = { padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: textDark };

  return (
    <Pantalla seccion="desechos">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Desechos</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
        </div>
        <BotonAlertas />
      </div>

      <div className="fila-cabecera" style={{ alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>Desechos del {formatearFechaLarga(fecha).toLowerCase()}</h2>
          <p style={{ color: textGray, fontSize: '0.95rem' }}>Registrá lo que descartaste. Cada carga se suma a lo del día.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
          <span style={{ marginRight: '10px', color: textGray }}>📅</span>
          <input type="date" aria-label="Fecha" value={fecha} min={sumarDias(hoy, -DIAS_MAX_ATRAS)} max={hoy} onChange={(e) => e.target.value && cambiarFecha(e.target.value)}
            style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }} />
        </div>
      </div>

      <div className="grilla-2" style={{ marginBottom: '30px' }}>
        <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#FCE8E6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#C5221F', flexShrink: 0 }}>⚠</div>
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.2' }}>{resumenCantidad}</span>
            <span style={{ fontSize: '0.9rem', color: textGray }}>{fecha === hoy ? 'Desechado hoy' : 'Desechado ese día'}</span>
          </div>
        </div>
        <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#B89732', flexShrink: 0 }}>💰</div>
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.2' }}>{formatearPrecio(costoTotal)}</span>
            <span style={{ fontSize: '0.9rem', color: textGray }}>Costo estimado del descarte</span>
          </div>
        </div>
      </div>

      <Aviso aviso={aviso} />
      <Aviso aviso={errorCarga ? { tipo: 'error', texto: errorCarga } : null} />

      <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
        <div className="tabla-contenedor">
          <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0 8px 15px 0', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ padding: '0 8px 15px 0', fontWeight: 'bold' }}>YA DESECHADO</th>
                <th style={{ padding: '0 8px 15px 0', fontWeight: 'bold' }}>AGREGAR</th>
                <th style={{ padding: '0 8px 15px 0', fontWeight: 'bold' }}>MOTIVO</th>
                <th style={{ padding: '0 8px 15px 0', fontWeight: 'bold' }}>OBSERVACIONES</th>
                <th style={{ padding: '0 0 15px 0', fontWeight: 'bold' }}>STOCK</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>Cargando...</td></tr>}
              {!cargando && !errorCarga && productos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>
                  <MensajeVacio>
                    No hay productos con stock.{' '}
                    <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</button>
                  </MensajeVacio>
                </td></tr>
              )}
              {!cargando && !errorCarga && productos.map((prod, index) => {
                const fila = filaDe(prod.id);
                const cargado = cargados[prod.id];
                return (
                  <tr key={prod.id} style={{ borderBottom: index === productos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td className="tarjeta-titulo" style={{ padding: '15px 8px 15px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td data-label="YA DESECHADO" style={{ padding: '15px 8px 15px 0', color: textDark, fontSize: '0.92rem' }}>
                      <span>{cargado ? cantidadConUnidad(cargado.cantidad, prod.unidadMedida) : '—'}</span>
                      {cargado && (
                        <button onClick={() => setCorreccion({ producto: prod, actual: cargado.cantidad, motivo: cargado.motivo })} style={{ marginLeft: '8px', padding: 0, background: 'none', border: 'none', color: '#B89732', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}>Corregir</button>
                      )}
                    </td>
                    <td data-label="AGREGAR" style={{ padding: '15px 8px 15px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" step="any" placeholder="0" aria-label={`Cantidad a agregar de ${prod.nombre}`} value={fila.cantidad} onChange={(e) => actualizar(prod.id, 'cantidad', e.target.value)} style={{ ...inputBase, width: '80px' }} />
                        <span style={{ color: textGray, fontSize: '0.85rem' }}>{unidadCorta(prod.unidadMedida)}</span>
                      </div>
                    </td>
                    <td data-label="MOTIVO" style={{ padding: '15px 8px 15px 0' }}>
                      <select aria-label={`Motivo de ${prod.nombre}`} value={fila.motivo} onChange={(e) => actualizar(prod.id, 'motivo', e.target.value)} style={{ ...inputBase, cursor: 'pointer', width: '165px' }}>
                        <option value="">Seleccionar</option>
                        {MOTIVOS_DESECHO.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                      </select>
                    </td>
                    <td data-label="OBSERVACIONES" style={{ padding: '15px 8px 15px 0' }}>
                      <input type="text" placeholder="Opcional" aria-label={`Observaciones de ${prod.nombre}`} maxLength={255} value={fila.observaciones} onChange={(e) => actualizar(prod.id, 'observaciones', e.target.value)} style={{ ...inputBase, width: '130px', fontSize: '0.85rem' }} />
                    </td>
                    <td data-label="STOCK" style={{ padding: '15px 0', color: textGray, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{cantidadConUnidad(prod.stock, prod.unidadMedida)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>{visiblesConDesecho.length} de {productos.length} productos con desechos cargados</span>
          <button onClick={guardar} disabled={guardando || cargando}
            style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
            {guardando ? 'Guardando...' : `Agregar desechos${hayCambios ? ` (${aCargar.length})` : ''}`}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '14px 20px', color: '#665324', fontSize: '0.9rem' }}>
        Si tirás algo más durante el día, cargá solo lo nuevo: se suma a lo anterior. Para arreglar un error de carga usá "Corregir".
      </div>

      {correccion && (
        <ModalCorreccion
          producto={correccion.producto}
          fecha={fecha}
          tipo="DESECHO"
          actual={correccion.actual}
          motivoActual={correccion.motivo}
          alCerrar={() => setCorreccion(null)}
          alGuardar={(texto) => { setCorreccion(null); setAviso({ tipo: 'ok', texto }); setVersion(v => v + 1); }}
        />
      )}
    </Pantalla>
  );
}

export default Desechos;
