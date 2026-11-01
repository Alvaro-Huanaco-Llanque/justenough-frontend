import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, obtenerUsuario } from '../api';
import {
  formatearFechaLarga, hoyISO, formatearCantidad, formatearPrecio, formatearPorcentaje, unidadCorta,
  etiquetaConfianza, colorConfianza, diaCorto
} from '../utils/productos';

const bgApp = '#FAF9F6';
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

// Texto y color de una variación: en desperdicio bajar es bueno; en precisión, subir es bueno
function variacion(valor, sufijo, subirEsBueno, referencia) {
  if (valor === null || valor === undefined) return { texto: `Sin datos de ${referencia} para comparar`, color: textGray };
  const signo = valor > 0 ? '+' : '';
  const bueno = subirEsBueno ? valor >= 0 : valor <= 0;
  return { texto: `${signo}${formatearCantidad(valor)}${sufijo} vs. ${referencia}`, color: bueno ? '#137333' : '#C5221F' };
}

function Dashboard() {
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [alertasAbiertas, setAlertasAbiertas] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/dashboard');
        if (res.ok) setDatos(await res.json());
        else setError(await leerMensajeError(res, 'No se pudo cargar el resumen.'));
      } catch {
        setError('No se pudo conectar con el servidor.');
      }
    };
    cargar();
  }, [alertasAbiertas]);   // al cerrar el panel de alertas se actualiza el contador de la tarjeta

  const desperdicioVar = variacion(datos?.variacionDesperdicio, '%', false, 'semana anterior');
  const precisionVar = variacion(datos?.variacionPrecision, ' pts', true, 'semana anterior');
  const maxFlujo = Math.max(1, ...(datos?.flujoDesperdicios ?? []).map(d => Math.max(d.producido, d.desperdiciado)));

  const tarjeta = (titulo, icono, iconoBg, iconoColor, valor, pie, pieColor, alClick) => (
    <div onClick={alClick} style={{ backgroundColor: bgCard, padding: '25px', borderRadius: '16px', border: `1px solid ${borderLight}`, cursor: alClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <span style={{ fontSize: '0.9rem', color: textGray, fontWeight: '500' }}>{titulo}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: iconoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconoColor, fontSize: '0.9rem' }}>{icono}</div>
      </div>
      <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: textDark, display: 'block' }}>{valor}</span>
      <span style={{ fontSize: '0.85rem', color: pieColor, display: 'block', marginTop: '8px', fontWeight: '500' }}>{pie}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>

      <BarraLateral seccionActiva="principal" />

      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Principal</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoyISO())}</p>
          </div>
          <BotonAlertas abierto={alertasAbiertas} alCambiar={setAlertasAbiertas} />
        </div>

        {/* Saludo */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 5px 0' }}>{saludo()}, {usuario?.nombre?.split(' ')[0]}</h2>
          <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Esto es lo que tenés que producir hoy.</p>
        </div>

        {error && (
          <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: '#FCE8E6', color: '#C5221F' }}>{error}</div>
        )}

        {/* Falta la carga de ayer */}
        {datos?.fechaSinCarga && (
          <div style={{ backgroundColor: '#FCF7E6', border: `1px solid ${goldPrimary}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#B06000', fontSize: '1.2rem' }}>⚠️</span>
              <span style={{ color: '#665324', fontSize: '0.95rem', fontWeight: '500' }}>
                Falta la carga de ayer ({formatearFechaLarga(datos.fechaSinCarga).toLowerCase()}). Sin ella la predicción pierde precisión.
              </span>
            </div>
            <button onClick={() => navigate('/ventas')} style={{ backgroundColor: goldLight, color: '#665324', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              Cargar ahora
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {tarjeta('Desperdicio de la semana', '⚠', '#FCE8E6', '#C5221F',
            datos ? (
              <>
                {formatearCantidad(datos.desperdicioSemana)} unidades
                <span style={{ fontSize: '1.3rem', color: textGray, display: 'block', marginTop: '4px', whiteSpace: 'nowrap' }}>{formatearPrecio(datos.costoDesperdicioSemana)}</span>
              </>
            ) : '—',
            desperdicioVar.texto, desperdicioVar.color)}
          {tarjeta('Precisión de la semana', '◎', '#E6F4EA', '#137333',
            datos?.precisionSemana != null ? formatearPorcentaje(datos.precisionSemana) : '—',
            datos?.precisionSemana != null ? precisionVar.texto : 'Se calcula cuando hay sugerencias y ventas de los mismos días', precisionVar.color)}
          {tarjeta('Alertas sin leer', '🔔', '#FEF7E0', '#B06000', datos ? datos.alertasSinLeer : '—',
            datos?.alertasSinLeer ? 'Requieren tu atención' : 'Estás al día', textGray, () => setAlertasAbiertas(true))}
        </div>

        {/* Tabla: Producción recomendada */}
        <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}`, marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Producción recomendada para hoy</h3>
              <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 25px 0' }}>Calculada según ventas, stock y comportamiento reciente. Se descuenta lo que ya tenés en stock.</p>
            </div>
            <span onClick={() => navigate('/sugerencias')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Ver semana →</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderLight}`, color: '#A0A0A0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>STOCK ESTIMADO</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>VENTA ESPERADA</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>PRODUCIR HOY</th>
                <th style={{ paddingBottom: '12px', fontWeight: 'bold' }}>CONFIANZA</th>
              </tr>
            </thead>
            <tbody>
              {!datos && !error && (
                <tr><td colSpan={5} style={{ padding: '30px 0', textAlign: 'center', color: textGray }}>Calculando...</td></tr>
              )}
              {datos && datos.produccionHoy.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '30px 0', textAlign: 'center', color: textGray }}>
                  <MensajeVacio>
                    Todavía no hay productos para predecir.{' '}
                    <span onClick={() => navigate('/catalogo')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</span>
                  </MensajeVacio>
                </td></tr>
              )}
              {datos?.produccionHoy.map((item, index) => {
                const badge = colorConfianza(item.confianza);
                const unidad = unidadCorta(item.unidadMedida);
                return (
                  <tr key={item.productoId} style={{ borderBottom: index === datos.produccionHoy.length - 1 ? 'none' : `1px solid ${borderLight}` }}>
                    <td style={{ padding: '20px 0', fontWeight: '600', color: textDark, fontSize: '0.95rem' }}>{item.nombre}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(item.stock)} {unidad}</td>
                    <td style={{ padding: '20px 0', color: textGray, fontSize: '0.95rem' }}>{formatearCantidad(item.sugerido)} {unidad}</td>
                    <td style={{ padding: '20px 0', fontWeight: 'bold', color: textDark, fontSize: '0.95rem' }}>{formatearCantidad(item.producir)} {unidad}</td>
                    <td style={{ padding: '20px 0' }}>
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

        {/* Gráfico: Flujo de desperdicios */}
        <div style={{ backgroundColor: bgCard, padding: '30px', borderRadius: '16px', border: `1px solid ${borderLight}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: textDark, margin: '0 0 5px 0' }}>Flujo de desperdicios</h3>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 20px' }}>
            {(datos?.flujoDesperdicios ?? []).map((dia) => (
              <div key={dia.fecha} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', width: '100%', justifyContent: 'center' }}>
                  <div title={`Producido: ${formatearCantidad(dia.producido)}`} style={{ width: '28px', height: `${(dia.producido / maxFlujo) * 100}%`, backgroundColor: '#F4E3B5', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                  <div title={`Desperdiciado: ${formatearCantidad(dia.desperdiciado)}`} style={{ width: '28px', height: `${(dia.desperdiciado / maxFlujo) * 100}%`, backgroundColor: '#C99B36', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '500' }}>{diaCorto(dia.fecha)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
