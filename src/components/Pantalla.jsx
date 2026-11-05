import BarraLateral from './BarraLateral';

// Estructura de todas las pantallas internas: menú lateral y contenido con su scroll
function Pantalla({ seccion, children, claseRaiz = '', claseContenido = '' }) {
  return (
    <div className={`app-raiz ${claseRaiz}`}>
      <BarraLateral seccionActiva={seccion} />
      <main className={`app-contenido ${claseContenido}`}>{children}</main>
    </div>
  );
}

// Mensaje de resultado o de error, igual en todas las pantallas. aviso = { tipo: 'ok' | 'error', texto }
export function Aviso({ aviso }) {
  if (!aviso) return null;
  const ok = aviso.tipo === 'ok';
  return (
    <div role={ok ? 'status' : 'alert'} style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', backgroundColor: ok ? '#E6F4EA' : '#FCE8E6', color: ok ? '#137333' : '#C5221F' }}>
      {aviso.texto}
    </div>
  );
}

export default Pantalla;
