import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraLateral from '../components/BarraLateral';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError } from '../api';
import { formatearFechaLarga, hoyISO, etiquetaConfianza } from '../utils/productos';

const bgApp = '#FAF9F6';
const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';

function colorNivel(nivel) {
  if (nivel === 'ALTA') return { bg: '#E6F4EA', color: '#137333' };
  if (nivel === 'MEDIA') return { bg: '#FEF7E0', color: '#B06000' };
  return { bg: '#F1F3F4', color: '#666666' };
}

// Madurez del modelo: cuantos más días de datos tiene un producto, más confiable es su sugerencia
function Madurez() {
  const navigate = useNavigate();
  const [madurez, setMadurez] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/madurez');
        if (res.ok) setMadurez(await res.json());
        else setError(await leerMensajeError(res, 'No se pudo cargar la madurez del modelo.'));
      } catch {
        setError('No se pudo conectar con el servidor.');
      }
    };
    cargar();
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="madurez" />

      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Madurez</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>{formatearFechaLarga(hoyISO())}</p>
          </div>
          <BotonAlertas />
        </div>

        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Madurez del modelo</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Cuantos más días cargues, más precisas son las sugerencias.</p>
          </div>
          {madurez && madurez.productos.length > 0 && (
            <span style={{ color: textGray, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              {madurez.productosAlta} en Alta · {madurez.productosMedia} en Media · {madurez.productosBaja} en Baja
            </span>
          )}
        </div>

        {error && <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: '#FCE8E6', color: '#C5221F' }}>{error}</div>}
        {!madurez && !error && <p style={{ color: textGray }}>Cargando...</p>}

        {madurez && madurez.productos.length === 0 && (
          <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '40px', textAlign: 'center', color: textGray, marginBottom: '30px' }}>
            <MensajeVacio>
              Todavía no hay productos para predecir.{' '}
              <span onClick={() => navigate('/catalogo')} style={{ color: '#B89732', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</span>
            </MensajeVacio>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {madurez?.productos.map((prod) => {
            const badge = colorNivel(prod.nivel);
            return (
              <div key={prod.productoId} style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>{prod.nombre}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                    {etiquetaConfianza(prod.nivel)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>{prod.dias}</span>
                  <span style={{ fontSize: '0.9rem', color: textGray, marginLeft: '5px' }}>{prod.dias === 1 ? 'día de datos' : 'días de datos'}</span>
                </div>
                <div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${prod.progreso}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: textGray, fontWeight: '500' }}>{prod.mensaje}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '50px', padding: '15px 30px', textAlign: 'center', color: textGray, fontSize: '0.85rem' }}>
          Baja &lt; {madurez?.diasParaMedia ?? 30} días &nbsp;&nbsp;·&nbsp;&nbsp; Media {madurez?.diasParaMedia ?? 30}–{(madurez?.diasParaAlta ?? 60) - 1} &nbsp;&nbsp;·&nbsp;&nbsp; Alta {madurez?.diasParaAlta ?? 60}+
        </div>

      </div>
    </div>
  );
}

export default Madurez;
