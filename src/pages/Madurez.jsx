import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla, { Aviso } from '../components/Pantalla';
import { MensajeVacio } from '../components/Marca';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';
import { useHoy } from '../utils/hooks';
import { formatearFechaLarga, etiquetaConfianza, colorConfianza } from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';

// Madurez del modelo: cuantos más días con ventas tiene un producto, más confiable es su sugerencia
function Madurez() {
  const navigate = useNavigate();
  const hoy = useHoy();
  const [madurez, setMadurez] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/madurez');
        if (res.ok) setMadurez(await res.json());
        else setError(await leerMensajeError(res, 'No se pudo cargar la madurez del modelo.'));
      } catch {
        setError(MENSAJE_SIN_CONEXION);
      }
    };
    cargar();
  }, []);

  const productos = madurez?.productos ?? [];

  return (
    <Pantalla seccion="madurez">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Madurez</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>{formatearFechaLarga(hoy)}</p>
        </div>
        <BotonAlertas />
      </div>

      <div className="fila-cabecera" style={{ marginBottom: '30px', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 5px 0' }}>Madurez del modelo</h2>
          <p style={{ color: textGray, fontSize: '0.95rem' }}>Cuantos más días con ventas cargues, más precisas son las sugerencias.</p>
        </div>
        {productos.length > 0 && (
          <span style={{ color: textGray, fontSize: '0.9rem' }}>
            {productos.filter(p => (p.confianzaMedida ?? p.nivel) === 'ALTA').length} en Alta · {productos.filter(p => (p.confianzaMedida ?? p.nivel) === 'MEDIA').length} en Media · {productos.filter(p => (p.confianzaMedida ?? p.nivel) === 'BAJA').length} en Baja
          </span>
        )}
      </div>

      <Aviso aviso={error ? { tipo: 'error', texto: error } : null} />
      {!madurez && !error && <p style={{ color: textGray }}>Cargando...</p>}

      {madurez && productos.length === 0 && (
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '40px', textAlign: 'center', color: textGray, marginBottom: '30px' }}>
          <MensajeVacio>
            Todavía no hay productos con stock para predecir.{' '}
            <button onClick={() => navigate('/catalogo')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>Agregalos en el Catálogo →</button>
          </MensajeVacio>
        </div>
      )}

      <div className="grilla-3" style={{ marginBottom: '30px' }}>
        {productos.map((prod) => {
          // Si el motor ya pudo medirse con este producto, vale eso; si no, lo que indican los días cargados
          const confianza = prod.confianzaMedida ?? prod.nivel;
          const badge = colorConfianza(confianza);
          return (
            <div key={prod.productoId} style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>{prod.nombre}</span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                  {etiquetaConfianza(confianza)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>{prod.dias}</span>
                <span style={{ fontSize: '0.9rem', color: textGray, marginLeft: '5px' }}>{prod.dias === 1 ? 'día con ventas' : 'días con ventas'}</span>
              </div>
              <div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ width: `${prod.progreso}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                </div>
                <span style={{ fontSize: '0.8rem', color: textGray, fontWeight: '500' }}>
                  {prod.errorMedido != null ? `Se equivocó ±${Math.round(prod.errorMedido)}% en las últimas 4 semanas` : prod.mensaje}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '50px', padding: '15px 30px', textAlign: 'center', color: textGray, fontSize: '0.85rem' }}>
        Con pocos días la confianza es Baja. Desde 4 semanas se mide con el error real: Media hasta ±50%, y Alta hasta ±25% con 8 semanas o más.
      </div>
    </Pantalla>
  );
}

export default Madurez;
