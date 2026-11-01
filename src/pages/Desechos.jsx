import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError } from '../api';
import { MOTIVOS_DESECHO, unidadCorta, formatearCantidad, formatearPrecio, formatearFechaLarga, hoyISO } from '../utils/productos';

const bgApp = '#FAF9F6';
const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

// Desechos: lo que se tiró de cada producto en un día, con el motivo.
// La cantidad es el total del día: si se corrige, el stock se ajusta solo (igual que en Producido / Compras).
function Desechos() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(hoyISO());
  const [productos, setProductos] = useState([]);
  const [guardados, setGuardados] = useState({});   // productoId -> { cantidad, motivo, observaciones } ya guardado
  const [filas, setFilas] = useState({});           // productoId -> lo que está escrito
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);         // { tipo: 'ok' | 'error', texto }
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [resProductos, resRegistros] = await Promise.all([
          apiFetch('/api/productos'),
          apiFetch(`/api/registros-diarios?fecha=${fecha}`)
        ]);
        const lista = resProductos.ok ? await resProductos.json() : [];
        const registros = resRegistros.ok ? await resRegistros.json() : [];
        const yaGuardados = {};
        registros.forEach(r => {
          if (r.producto && (r.cantidadDesperdiciada ?? 0) > 0) {
            yaGuardados[r.producto.id] = { cantidad: String(r.cantidadDesperdiciada), motivo: r.motivoDesecho ?? '', observaciones: r.observacionDesecho ?? '' };
          }
        });
        setProductos(lista.filter(p => p.activo && p.controlaStock !== false).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setGuardados(yaGuardados);
        setFilas(yaGuardados);
      } catch {
        setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
      setCargando(false);
    };
    cargar();
  }, [fecha, version]);

  const filaDe = (id) => filas[id] ?? { cantidad: '', motivo: '', observaciones: '' };
  const actualizar = (id, campo, valor) => setFilas({ ...filas, [id]: { ...filaDe(id), [campo]: valor } });

  // "Guardado" si coincide con lo guardado, "Sin guardar" si se modificó, "Pendiente" si no se cargó nada
  const estadoDe = (id) => {
    const fila = filaDe(id);
    const guardado = guardados[id];
    const numero = parseFloat(fila.cantidad) || 0;
    if (guardado && numero === parseFloat(guardado.cantidad) && fila.motivo === guardado.motivo && fila.observaciones === guardado.observaciones) return 'Guardado';
    if (!guardado && numero === 0) return 'Pendiente';
    return 'Sin guardar';
  };
  const cambios = productos.filter(p => estadoDe(p.id) === 'Sin guardar');
  const hayCambios = cambios.length > 0;

  const cambiarFecha = (nueva) => {
    if (hayCambios && !window.confirm('Tenés desechos sin guardar. ¿Cambiar de fecha igual?')) return;
    setAviso(null);
    setFecha(nueva);
  };

  const guardar = async () => {
    if (!hayCambios) { setAviso({ tipo: 'error', texto: 'No hay cambios para guardar.' }); return; }
    const sinMotivo = cambios.find(p => (parseFloat(filaDe(p.id).cantidad) || 0) > 0 && !filaDe(p.id).motivo);
    if (sinMotivo) { setAviso({ tipo: 'error', texto: `Elegí el motivo del desecho de ${sinMotivo.nombre}.` }); return; }
    if (cambios.some(p => (parseFloat(filaDe(p.id).cantidad) || 0) < 0)) { setAviso({ tipo: 'error', texto: 'Las cantidades no pueden ser negativas.' }); return; }

    setGuardando(true);
    const desechos = Object.fromEntries(cambios.map(p => {
      const f = filaDe(p.id);
      return [p.id, { cantidad: parseFloat(f.cantidad) || 0, motivo: f.motivo || null, observaciones: f.observaciones }];
    }));
    try {
      const res = await apiFetch('/api/registros-diarios/desechos-batch', { method: 'POST', body: JSON.stringify({ fecha, desechos }) });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: `Desechos guardados (${cambios.length} producto${cambios.length === 1 ? '' : 's'}). El stock ya se descontó en Inventario.` });
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar los desechos.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    }
    setGuardando(false);
  };

  // Resumen con lo guardado del día (no con lo que se está escribiendo)
  const totalUnidades = Object.values(guardados).reduce((acc, g) => acc + (parseFloat(g.cantidad) || 0), 0);
  const costoTotal = productos.reduce((acc, p) => acc + (parseFloat(guardados[p.id]?.cantidad) || 0) * (p.costoUnitario || 0), 0);
  const cargadosHoy = Object.keys(guardados).length;

  const estiloEstado = {
    'Guardado': { bg: '#E6F4EA', color: '#137333' },
    'Sin guardar': { bg: '#FEF7E0', color: '#B06000' },
    'Pendiente': { bg: '#F1F3F4', color: textGray },
  };
  const inputBase = { padding: '10px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: textDark };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="desechos" />

      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Desechos</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoyISO())}</p>
          </div>
          <BotonAlertas />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Desechos del {formatearFechaLarga(fecha).toLowerCase()}</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Registrá únicamente los productos descartados durante el día.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
            <span style={{ marginRight: '10px', color: textGray }}>📅</span>
            <input type="date" value={fecha} max={hoyISO()} onChange={(e) => e.target.value && cambiarFecha(e.target.value)}
              style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }} />
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#FCE8E6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#C5221F' }}>⚠</div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>{formatearCantidad(totalUnidades)} unidades</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>{fecha === hoyISO() ? 'Desechadas hoy' : 'Desechadas ese día'}</span>
            </div>
          </div>
          <div style={{ backgroundColor: bgCard, padding: '20px 25px', borderRadius: '16px', border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#B89732' }}>💰</div>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block', lineHeight: '1.1' }}>{formatearPrecio(costoTotal)}</span>
              <span style={{ fontSize: '0.9rem', color: textGray }}>Costo estimado del descarte</span>
            </div>
          </div>
        </div>

        {aviso && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: aviso.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: aviso.tipo === 'ok' ? '#137333' : '#C5221F' }}>
            {aviso.texto}
          </div>
        )}

        {/* Tabla de Carga de Desechos */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '25px 30px', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>CANTIDAD DESECHADA</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>MOTIVO</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>OBSERVACIONES</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold' }}>STOCK</th>
                <th style={{ paddingBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>Cargando...</td></tr>}
              {!cargando && productos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>
                  <MensajeVacio>
                    No hay productos activos.{' '}
                    <span onClick={() => navigate('/catalogo')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</span>
                  </MensajeVacio>
                </td></tr>
              )}
              {!cargando && productos.map((prod, index) => {
                const fila = filaDe(prod.id);
                const estado = estadoDe(prod.id);
                const colores = estiloEstado[estado];
                return (
                  <tr key={prod.id} style={{ borderBottom: index === productos.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '15px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td style={{ padding: '15px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" placeholder="0" value={fila.cantidad} onChange={(e) => actualizar(prod.id, 'cantidad', e.target.value)} style={{ ...inputBase, width: '80px' }} />
                        <span style={{ color: textGray, fontSize: '0.85rem' }}>{unidadCorta(prod.unidadMedida)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px 0' }}>
                      <select value={fila.motivo} onChange={(e) => actualizar(prod.id, 'motivo', e.target.value)} style={{ ...inputBase, cursor: 'pointer', width: '170px' }}>
                        <option value="">Seleccionar</option>
                        {MOTIVOS_DESECHO.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '15px 0' }}>
                      <input type="text" placeholder="Detalle opcional" maxLength={255} value={fila.observaciones} onChange={(e) => actualizar(prod.id, 'observaciones', e.target.value)} style={{ ...inputBase, width: '150px', fontSize: '0.85rem' }} />
                    </td>
                    <td style={{ padding: '15px 0', color: textGray, fontSize: '0.9rem' }}>{formatearCantidad(prod.stock)} {unidadCorta(prod.unidadMedida)}</td>
                    <td style={{ padding: '15px 0', textAlign: 'right' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: colores.bg, color: colores.color }}>{estado}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>{cargadosHoy} de {productos.length} productos con desechos cargados</span>
            <button onClick={guardar} disabled={guardando || cargando}
              style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : hayCambios ? `Guardar desechos (${cambios.length})` : 'Guardar desechos'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '14px 20px', color: '#665324', fontSize: '0.9rem' }}>
          Cargá el total desechado en el día. Si corregís un día ya guardado, el stock se ajusta solo. Para dejar un producto en 0, borrá la cantidad y guardá.
        </div>
      </div>
    </div>
  );
}

export default Desechos;
