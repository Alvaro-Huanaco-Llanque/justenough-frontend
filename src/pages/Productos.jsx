import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { apiFetch, leerMensajeError } from '../api';
import { unidadCorta, etiquetaModalidad, formatearCantidad } from '../utils/productos';

const POR_PAGINA = 8;

// Inventario: cuánto hay de cada producto activo del catálogo.
// El stock sube con Producido / Compras y baja con Ventas y Desechos; acá solo se corrige el conteo.
// (Los insumos y recetas quedan ocultos por ahora: el backend los sigue teniendo para más adelante.)
function Productos() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [ajuste, setAjuste] = useState(null); // null = modal cerrado; si no, { producto, nuevoStock }
  const [errorAjuste, setErrorAjuste] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/productos');
        if (res.ok) {
          const data = await res.json();
          setProductos(data.filter(p => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }
      } catch {
        setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
      setCargando(false);
    };
    cargar();
  }, [version]);

  // Sin stock / Bajo (llegó al mínimo) / OK
  const estadoDe = (p) => {
    if (p.stock <= 0) return 'Sin stock';
    if (p.stockMinimo > 0 && p.stock <= p.stockMinimo) return 'Bajo';
    return 'OK';
  };
  const estiloEstado = {
    'Sin stock': { bg: '#FCE8E6', color: '#C5221F' },
    'Bajo': { bg: '#FEF7E0', color: '#B06000' },
    'OK': { bg: '#E6F4EA', color: '#137333' }
  };

  const abrirAjuste = (p) => { setErrorAjuste(''); setAjuste({ producto: p, nuevoStock: String(p.stock) }); };

  const confirmarAjuste = async () => {
    const nuevo = parseFloat(ajuste.nuevoStock);
    if (ajuste.nuevoStock === '' || Number.isNaN(nuevo) || nuevo < 0) { setErrorAjuste('Ingresá una cantidad válida (0 o más).'); return; }
    try {
      const res = await apiFetch(`/api/productos/${ajuste.producto.id}/stock?nuevoStock=${nuevo}`, { method: 'PUT' });
      if (res.ok) {
        setAviso({ tipo: 'ok', texto: `Stock de ${ajuste.producto.nombre} corregido a ${formatearCantidad(nuevo)} ${unidadCorta(ajuste.producto.unidadMedida)}.` });
        setAjuste(null);
        setVersion(v => v + 1);
      } else {
        setErrorAjuste(await leerMensajeError(res, 'No se pudo corregir el stock.'));
      }
    } catch {
      setErrorAjuste('No se pudo conectar con el servidor.');
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(productos.length / POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas);
  const datosPaginados = productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const cantidadBajos = productos.filter(p => estadoDe(p) !== 'OK').length;

  const bgApp = '#FAF9F6'; const bgCard = '#FFFFFF'; const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A'; const textGray = '#666666'; const goldPrimary = '#D4AF37';
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="productos" />

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Inventario</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Cuánto tenés de cada producto en este momento.</p>
          </div>
          <button onClick={() => navigate('/catalogo')} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
            📋 Ir al Catálogo
          </button>
        </div>

        {/* Banner Informativo */}
        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
          <span style={{ color: '#665324', fontSize: '0.95rem' }}>
            El stock <strong>sube</strong> cuando cargás Producido / Compras y <strong>baja</strong> con Ventas y Desechos. Usá <strong>Ajustar</strong> solo para corregir el conteo si no coincide con lo que hay.
          </span>
        </div>

        {aviso && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: aviso.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: aviso.tipo === 'ok' ? '#137333' : '#C5221F' }}>
            {aviso.texto}
          </div>
        )}

        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '0', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MODALIDAD</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>STOCK</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>MÍNIMO</th>
                <th style={{ padding: '20px', fontWeight: 'bold' }}>ESTADO</th>
                <th style={{ padding: '20px 30px', fontWeight: 'bold', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={6} style={{ padding: '40px', color: textGray }}>Cargando...</td></tr>
              )}
              {!cargando && productos.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', color: textGray }}>
                  Todavía no hay productos.{' '}
                  <span onClick={() => navigate('/catalogo')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</span>
                </td></tr>
              )}
              {!cargando && datosPaginados.map((item, index) => {
                const estado = estadoDe(item);
                const badge = estiloEstado[estado];
                const unidad = unidadCorta(item.unidadMedida);
                return (
                  <tr key={item.id} style={{ borderBottom: index === datosPaginados.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 30px', fontWeight: '600', color: textDark, fontSize: '0.95rem', textAlign: 'left' }}>{item.nombre}</td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.9rem' }}>{etiquetaModalidad(item.modalidad)}</td>
                    <td style={{ padding: '20px', fontWeight: 'bold', color: textDark, fontSize: '1.05rem' }}>{formatearCantidad(item.stock)} <span style={{ fontWeight: 'normal', color: textGray, fontSize: '0.85rem' }}>{unidad}</span></td>
                    <td style={{ padding: '20px', color: textGray, fontSize: '0.95rem' }}>{item.stockMinimo > 0 ? `${formatearCantidad(item.stockMinimo)} ${unidad}` : '—'}</td>
                    <td style={{ padding: '20px' }}><span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>{estado}</span></td>
                    <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                      <button onClick={() => abrirAjuste(item)} style={{ padding: '7px 14px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Ajustar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderTop: `1px solid ${borderLight}` }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              {productos.length} producto{productos.length === 1 ? '' : 's'}
              {cantidadBajos > 0 && <> · <span style={{ color: '#B06000', fontWeight: 'bold' }}>{cantidadBajos} con stock bajo o sin stock</span></>}
              {' '}· Página {pagina} de {totalPaginas}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setPaginaActual(Math.max(pagina - 1, 1))} disabled={pagina === 1} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === 1 ? '#F5F5F5' : bgCard, cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: textGray }}>&lt;</button>
              <button onClick={() => setPaginaActual(Math.min(pagina + 1, totalPaginas))} disabled={pagina === totalPaginas} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: pagina === totalPaginas ? '#F5F5F5' : bgCard, cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: textDark }}>&gt;</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AJUSTE DE STOCK */}
      {ajuste && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: bgCard, width: '420px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 8px 0' }}>Ajustar stock</h3>
            <p style={{ color: textGray, fontSize: '0.92rem', margin: '0 0 20px 0' }}>
              <strong style={{ color: textDark }}>{ajuste.producto.nombre}</strong> · el sistema tiene {formatearCantidad(ajuste.producto.stock)} {unidadCorta(ajuste.producto.unidadMedida)}.
            </p>

            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: textDark }}>Cantidad real contada</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="number" min="0" value={ajuste.nuevoStock} onChange={e => setAjuste({ ...ajuste, nuevoStock: e.target.value })} style={inputStyle} autoFocus />
              <span style={{ color: textGray }}>{unidadCorta(ajuste.producto.unidadMedida)}</span>
            </div>
            {errorAjuste && <p style={{ color: '#C5221F', fontSize: '0.88rem', margin: '10px 0 0 0' }}>{errorAjuste}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setAjuste(null)} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarAjuste} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar ajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;
