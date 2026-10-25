import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { apiFetch, leerMensajeError } from '../api';
import { unidadCorta, etiquetaModalidad, formatearPrecio, formatearCantidad, formatearFechaLarga, hoyISO } from '../utils/productos';

const POR_PAGINA = 8;

// Producido / Compras: cuánto ingresó al stock de cada producto del catálogo en un día.
// La modalidad y el costo vienen del Catálogo; acá solo se carga la cantidad.
function ProducidoCompras() {
  const navigate = useNavigate();

  const [fecha, setFecha] = useState(hoyISO());
  const [paginaActual, setPaginaActual] = useState(1);
  const [productos, setProductos] = useState([]);
  const [guardadas, setGuardadas] = useState({}); // productoId -> cantidad ya guardada ese día
  const [cantidades, setCantidades] = useState({}); // productoId -> lo que está escrito en el input
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [version, setVersion] = useState(0);

  // Productos activos del catálogo + lo que ya se cargó en la fecha elegida
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

        const yaGuardadas = {};
        registros.forEach(r => {
          if (r.producto && r.cantidadProducida > 0) yaGuardadas[r.producto.id] = r.cantidadProducida;
        });
        setProductos(lista.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setGuardadas(yaGuardadas);
        setCantidades(Object.fromEntries(Object.entries(yaGuardadas).map(([id, c]) => [id, String(c)])));
      } catch {
        setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
      setCargando(false);
    };
    cargar();
  }, [fecha, version]);

  const cambiarFecha = (nuevaFecha) => {
    if (hayCambiosSinGuardar && !window.confirm('Tenés cantidades sin guardar. ¿Cambiar de fecha igual?')) return;
    setAviso(null);
    setPaginaActual(1);
    setFecha(nuevaFecha);
  };

  // "Guardado" si coincide con lo guardado, "Sin guardar" si se modificó, "Pendiente" si no se cargó nada
  const estadoDe = (id) => {
    const escrito = cantidades[id] ?? '';
    const guardado = guardadas[id];
    const numero = parseFloat(escrito) || 0;
    if (guardado !== undefined && numero === guardado) return 'Guardado';
    if (guardado === undefined && escrito === '') return 'Pendiente';
    return 'Sin guardar';
  };
  const cambios = productos.filter(p => estadoDe(p.id) === 'Sin guardar');
  const hayCambiosSinGuardar = cambios.length > 0;

  const guardar = async () => {
    if (!hayCambiosSinGuardar) { setAviso({ tipo: 'error', texto: 'No hay cantidades nuevas para guardar.' }); return; }
    if (cambios.some(p => (parseFloat(cantidades[p.id]) || 0) < 0)) { setAviso({ tipo: 'error', texto: 'Las cantidades no pueden ser negativas.' }); return; }

    setGuardando(true);
    const ingresos = Object.fromEntries(cambios.map(p => [p.id, parseFloat(cantidades[p.id]) || 0]));
    try {
      const res = await apiFetch('/api/registros-diarios/ingresos-batch', {
        method: 'POST',
        body: JSON.stringify({ fecha, ingresos })
      });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: `Ingresos guardados (${cambios.length} producto${cambios.length === 1 ? '' : 's'}). El stock ya se actualizó en Inventario.` });
        setVersion(v => v + 1);
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar los ingresos.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    }
    setGuardando(false);
  };

  const totalPaginas = Math.max(1, Math.ceil(productos.length / POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas);
  const productosPaginados = productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const rangoDesde = productos.length === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const rangoHasta = Math.min(pagina * POR_PAGINA, productos.length);

  const bgApp = '#FAF9F6';
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';

  const estiloEstado = {
    'Guardado': { bg: '#E6F4EA', color: '#137333' },
    'Sin guardar': { bg: '#FEF7E0', color: '#B06000' },
    'Pendiente': { bg: '#F1F3F4', color: textGray }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="producido" />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box', position: 'relative' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Producido / Compras</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoyISO())}</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título interno y Selector de Fecha */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>Ingresos del {formatearFechaLarga(fecha).toLowerCase()}</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Registrá cuánto produjiste o compraste de cada producto ese día.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '8px', padding: '8px 15px' }}>
            <span style={{ marginRight: '10px', color: textGray }}>📅</span>
            <input
              type="date"
              value={fecha}
              max={hoyISO()}
              onChange={(e) => e.target.value && cambiarFecha(e.target.value)}
              style={{ border: 'none', outline: 'none', color: '#0056b3', fontWeight: 'bold', fontSize: '1rem', backgroundColor: 'transparent' }}
            />
          </div>
        </div>

        {/* Banner Informativo */}
        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: bgCard, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderLight}`, flexShrink: 0 }}>📦</div>
          <span style={{ color: '#665324', fontSize: '0.95rem' }}>
            <strong>Cargá el total que ingresó en el día.</strong> Si corregís un día ya guardado, el stock se ajusta solo. La modalidad y el costo se cambian desde el{' '}
            <span onClick={() => navigate('/catalogo')} style={{ fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}>Catálogo</span>.
          </span>
        </div>

        {aviso && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: aviso.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: aviso.tipo === 'ok' ? '#137333' : '#C5221F' }}>
            {aviso.texto}
          </div>
        )}

        {/* Tabla de carga */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '20px 30px', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>MODALIDAD</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>CANTIDAD</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>COSTO UNITARIO</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>STOCK ACTUAL</th>
                <th style={{ padding: '15px 10px', fontWeight: 'bold' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>Cargando...</td></tr>
              )}
              {!cargando && productos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textGray }}>
                  No hay productos activos en el catálogo.{' '}
                  <span onClick={() => navigate('/catalogo')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en Catálogo →</span>
                </td></tr>
              )}
              {!cargando && productosPaginados.map((prod, index) => {
                const estado = estadoDe(prod.id);
                const colores = estiloEstado[estado];
                return (
                  <tr key={prod.id} style={{ borderBottom: index === productosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '18px 10px', fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{prod.nombre}</td>
                    <td style={{ padding: '18px 10px' }}>
                      <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: prod.modalidad === 'COMPRADO' ? '#E8F0FE' : '#FDF8EC', color: prod.modalidad === 'COMPRADO' ? '#1A56B8' : '#8A6D1C' }}>
                        {etiquetaModalidad(prod.modalidad)}
                      </span>
                    </td>
                    <td style={{ padding: '18px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={cantidades[prod.id] ?? ''}
                          onChange={(e) => setCantidades({ ...cantidades, [prod.id]: e.target.value })}
                          style={{ width: '90px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${borderLight}`, outline: 'none', fontSize: '0.95rem', backgroundColor: '#FFFFFF', color: textDark }}
                        />
                        <span style={{ color: textGray, fontSize: '0.85rem' }}>{unidadCorta(prod.unidadMedida)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 10px', color: textGray, fontSize: '0.95rem' }}>{formatearPrecio(prod.costoUnitario)}</td>
                    <td style={{ padding: '18px 10px', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(prod.stock)} {unidadCorta(prod.unidadMedida)}</td>
                    <td style={{ padding: '18px 10px' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: colores.bg, color: colores.color }}>
                        {estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación y Guardar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: textGray, fontSize: '0.9rem' }}>Mostrando {rangoDesde}–{rangoHasta} de {productos.length} productos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setPaginaActual(Math.max(pagina - 1, 1))}
                  disabled={pagina === 1}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === 1 ? '#F5F5F5' : bgCard, cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: textGray }}
                >
                  &lt;
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: textDark }}>{pagina} <span style={{ color: textGray, fontWeight: 'normal' }}>/ {totalPaginas}</span></span>
                <button
                  onClick={() => setPaginaActual(Math.min(pagina + 1, totalPaginas))}
                  disabled={pagina === totalPaginas}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === totalPaginas ? '#F5F5F5' : bgCard, cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}
                >
                  &gt;
                </button>
              </div>
              <button
                onClick={guardar}
                disabled={guardando || cargando}
                style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? 'Guardando...' : hayCambiosSinGuardar ? `Guardar ingresos (${cambios.length})` : 'Guardar ingresos'}
              </button>
            </div>
          </div>
        </div>

        {/* Botón Flotante: Ir a Ventas */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button
            onClick={() => navigate('/ventas')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#FDF8EC', color: '#665324', border: `1px solid ${goldPrimary}`, borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span>🧾</span> Ir a Ventas &gt;
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProducidoCompras;
