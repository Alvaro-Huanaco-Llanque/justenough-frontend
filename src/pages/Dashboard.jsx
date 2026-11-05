import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, obtenerUsuario, EVENTO_DATOS_CAMBIARON, MENSAJE_SIN_CONEXION } from '../api';
import { useHoy } from '../utils/hooks';
import {
  formatearFechaLarga, formatearCantidad, formatearPrecio, cantidadConUnidad, resumirPorUnidad,
  etiquetaConfianza, colorConfianza, diaCorto
} from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';
const goldLight = '#F9EBBF';

// Saludo según la hora del día
function saludo() {
  const hora = new Date().getHours();
  if (hora < 13) return 'Buen día';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

// Texto y color de la variación del desperdicio: bajar es bueno
function variacion(valor, referencia) {
  if (valor === null || valor === undefined) return { texto: `Sin datos de ${referencia} para comparar`, color: textGray };
  const signo = valor > 0 ? '+' : '';
  return { texto: `${signo}${formatearCantidad(valor)}% vs. ${referencia}`, color: valor <= 0 ? '#137333' : '#C5221F' };
}

function Dashboard() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const hoy = useHoy();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [alertasAbiertas, setAlertasAbiertas] = useState(false);
  const [version, setVersion] = useState(0);

  // Marcar alertas como leídas desde el panel actualiza la tarjeta
  useEffect(() => {
    const recargar = () => setVersion(v => v + 1);
    window.addEventListener(EVENTO_DATOS_CAMBIARON, recargar);
    return () => window.removeEventListener(EVENTO_DATOS_CAMBIARON, recargar);
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/dashboard');
        if (!vigente) return;
        if (res.ok) {
          const data = await res.json();
          if (vigente) {
            setDatos(data);
            setError('');
          }
        } else {
          setError(await leerMensajeError(res, 'No se pudo cargar el resumen.'));
        }
      } catch {
        if (vigente) setError(MENSAJE_SIN_CONEXION);
      }
    };
    cargar();
    return () => { vigente = false; };
  }, [alertasAbiertas, version, hoy]);

  const stockHoy = datos?.stockHoy ?? [];
  const flujo = datos?.flujoDesperdicios ?? [];
  const desperdicioVar = variacion(datos?.variacionDesperdicio, 'semana anterior');
  const maxFlujo = Math.max(1, ...flujo.map(d => Math.max(d.producido, d.desperdiciado)));

  const tarjeta = (titulo, icono, iconoBg, iconoColor, valor, pie, pieColor, alClick) => (
    <div onClick={alClick} style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}`, cursor: alClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>{titulo}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: iconoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconoColor, fontSize: '0.9rem', flexShrink: 0 }}>{icono}</div>
      </div>
      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{valor}</span>
      <span style={{ fontSize: '0.85rem', color: pieColor, display: 'block', marginTop: '8px', fontWeight: '500' }}>{pie}</span>
    </div>
  );

  return (
    <Pantalla seccion="principal">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Principal</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
        </div>
        <BotonAlertas abierto={alertasAbiertas} alCambiar={setAlertasAbiertas} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>{saludo()}, {usuario?.nombre?.split(' ')[0]}</h2>
        <p style={{ color: textGray, fontSize: '0.95rem' }}>Así se encuentra tu negocio.</p>
      </div>

      <Aviso aviso={error ? { tipo: 'error', texto: error } : null} />

      {/* Faltan las ventas de ayer */}
      {datos?.fechaSinCarga && (
        <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '30px', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#B06000', fontSize: '1.2rem' }}>⚠️</span>
            <span style={{ color: '#665324', fontSize: '0.95rem', fontWeight: '500' }}>
              Faltan las ventas de ayer ({formatearFechaLarga(datos.fechaSinCarga).toLowerCase()}). Sin ellas el stock y los resultados quedan incompletos.
            </span>
          </div>
          <button onClick={() => navigate(`/ventas?fecha=${datos.fechaSinCarga}`)} style={{ backgroundColor: goldLight, color: '#665324', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Cargar ahora
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="grilla-3" style={{ marginBottom: '30px' }}>
        {tarjeta('Desperdicio de la semana', '⚠', '#FCE8E6', '#C5221F',
          datos ? (
            <>
              {resumirPorUnidad((datos.desperdicioPorUnidad ?? []).map(d => ({ cantidad: d.cantidad, unidadMedida: d.unidadMedida })))}
              <span style={{ fontSize: '1.2rem', color: textGray, display: 'block', marginTop: '4px', whiteSpace: 'nowrap' }}>{formatearPrecio(datos.costoDesperdicioSemana)}</span>
            </>
          ) : '—',
          desperdicioVar.texto, desperdicioVar.color)}
        {tarjeta('Ventas de la semana', '🧾', '#E6F4EA', '#137333',
          datos ? (
            <>
              {resumirPorUnidad((datos.ventasSemanaPorUnidad ?? []).map(d => ({ cantidad: d.cantidad, unidadMedida: d.unidadMedida })))}
              <span style={{ fontSize: '1.2rem', color: textGray, display: 'block', marginTop: '4px', whiteSpace: 'nowrap' }}>{formatearPrecio(datos.recaudadoSemana)}</span>
            </>
          ) : '—',
          'Recaudado desde el lunes', textGray)}
        {tarjeta('Alertas sin leer', '🔔', '#FEF7E0', '#B06000', datos ? datos.alertasSinLeer : '—',
          datos?.alertasSinLeer ? 'Requieren tu atención' : 'Estás al día', textGray, () => setAlertasAbiertas(true))}
      </div>

      {/* Tabla: Stock de hoy */}
      <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>Stock de hoy</h3>
        <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Lo que tenés, lo que vendiste y lo que desechaste hoy. La venta esperada es solo una referencia.</p>

        <div className="tabla-contenedor">
          <table className="tabla-tarjetas" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0 8px 12px 0', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ padding: '0 8px 12px 0', fontWeight: 'bold' }}>STOCK ACTUAL</th>
                <th style={{ padding: '0 8px 12px 0', fontWeight: 'bold' }}>VENDIDO</th>
                <th style={{ padding: '0 8px 12px 0', fontWeight: 'bold' }}>DESECHADO</th>
                <th style={{ padding: '0 8px 12px 0', fontWeight: 'bold' }}>VENTA ESPERADA</th>
                <th style={{ padding: '0 0 12px 0', fontWeight: 'bold' }}>CONFIANZA</th>
              </tr>
            </thead>
            <tbody>
              {!datos && !error && (
                <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: textGray }}>Cargando...</td></tr>
              )}
              {datos && stockHoy.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: textGray }}>
                  <MensajeVacio>
                    Todavía no hay productos con stock.{' '}
                    <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</button>
                  </MensajeVacio>
                </td></tr>
              )}
              {stockHoy.map((item, index) => {
                const badge = colorConfianza(item.confianza);
                return (
                  <tr key={item.productoId} style={{ borderBottom: index === stockHoy.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td className="tarjeta-titulo" style={{ padding: '20px 8px 20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{item.nombre}</td>
                    <td data-label="STOCK ACTUAL" style={{ padding: '20px 8px 20px 0', fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{cantidadConUnidad(item.stock, item.unidadMedida)}</td>
                    <td data-label="VENDIDO" style={{ padding: '20px 8px 20px 0', color: textDark, fontSize: '0.95rem' }}>{cantidadConUnidad(item.vendidoHoy, item.unidadMedida)}</td>
                    <td data-label="DESECHADO" style={{ padding: '20px 8px 20px 0', color: textDark, fontSize: '0.95rem' }}>{cantidadConUnidad(item.desechadoHoy, item.unidadMedida)}</td>
                    <td data-label="VENTA ESPERADA" style={{ padding: '20px 8px 20px 0', color: textGray, fontSize: '0.95rem' }}>{cantidadConUnidad(item.ventaEsperada, item.unidadMedida)}</td>
                    <td data-label="CONFIANZA" style={{ padding: '20px 0' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                        {etiquetaConfianza(item.confianza)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico: Flujo de desperdicios */}
      <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
        <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>Flujo de desperdicios</h3>
            <p style={{ color: textGray, fontSize: '0.9rem', margin: '0' }}>Producción y desperdicio de los últimos 7 días</p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#F4E3B5', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Producido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#C99B36', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.85rem', color: textGray, fontWeight: '500' }}>Desperdiciado</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', gap: '4px' }}>
          {flujo.map((dia) => (
            <div key={dia.fecha} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', flex: '1 1 0', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '180px', width: '100%', justifyContent: 'center' }}>
                <div title={`Producido: ${formatearCantidad(dia.producido)}`} style={{ width: '40%', maxWidth: '28px', height: `${(dia.producido / maxFlujo) * 100}%`, backgroundColor: '#F4E3B5', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                <div title={`Desperdiciado: ${formatearCantidad(dia.desperdiciado)}`} style={{ width: '40%', maxWidth: '28px', height: `${(dia.desperdiciado / maxFlujo) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{diaCorto(dia.fecha)}</span>
            </div>
          ))}
        </div>
      </div>
    </Pantalla>
  );
}

export default Dashboard;
