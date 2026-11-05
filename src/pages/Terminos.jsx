import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Marca';

const seccion = { marginBottom: '22px' };
const titulo = { fontSize: '1.1rem', margin: '0 0 8px 0' };
const texto = { color: '#444444', lineHeight: 1.6 };

// Términos y condiciones y política de privacidad.
// Este texto es un punto de partida: tiene que revisarlo un asesor legal antes de cobrarle a clientes.
function Terminos() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF9F6', fontFamily: 'Arial, sans-serif', padding: '40px 16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', backgroundColor: '#FFFFFF', border: '1px solid #EAE6DF', borderRadius: '16px', padding: '32px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Logo tamano={40} />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>Just Enough</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: '0 0 20px 0' }}>Términos y privacidad</h1>

        <section style={seccion}>
          <h2 style={titulo}>Qué es Just Enough</h2>
          <p style={texto}>Es un sistema para que comercios gastronómicos registren su stock, ventas, compras y desechos, y reciban sugerencias de producción. Las sugerencias son orientativas: las decisiones de compra y producción son siempre del comercio.</p>
        </section>

        <section style={seccion}>
          <h2 style={titulo}>Tu cuenta</h2>
          <p style={texto}>Sos responsable de los datos que cargás y de cuidar tu contraseña. Para usar el sistema necesitás un email válido y datos reales de tu comercio.</p>
        </section>

        <section style={seccion}>
          <h2 style={titulo}>Qué datos guardamos</h2>
          <p style={texto}>Tu nombre y email; el nombre, dirección y teléfono de tu comercio; y lo que cargás en el sistema (productos, precios, ventas, compras, desechos y eventos). Los usamos para que el sistema funcione y para enviarte los avisos que elijas. No los vendemos a terceros.</p>
        </section>

        <section style={seccion}>
          <h2 style={titulo}>Tus derechos sobre tus datos</h2>
          <p style={texto}>Podés ver y corregir tus datos, descargarlos o dar de baja tu cuenta en cualquier momento desde Configuración. La baja borra definitivamente el comercio y todo lo que cargaste.</p>
        </section>

        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
          ← Volver
        </button>
      </div>
    </div>
  );
}

export default Terminos;
