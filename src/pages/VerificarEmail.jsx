import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, guardarSesion, leerMensajeError } from '../api';

// Página a la que lleva el link del mail de verificación: /verificar?token=...
function VerificarEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [estado, setEstado] = useState(token ? 'verificando' : 'error'); // verificando | ok | error
  const [mensaje, setMensaje] = useState(token ? '' : 'El link de verificación no es válido.');
  const [email, setEmail] = useState('');
  const [avisoReenvio, setAvisoReenvio] = useState('');
  // En desarrollo React ejecuta los efectos dos veces: sin esto, la segunda llamada vería el token ya usado
  const yaPedido = useRef(false);

  useEffect(() => {
    if (!token || yaPedido.current) return;
    yaPedido.current = true;

    const verificar = async () => {
      try {
        const res = await apiFetch('/api/usuarios/verificar', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        if (res.ok) {
          guardarSesion(await res.json());
          setEstado('ok');
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
        } else {
          setMensaje(await leerMensajeError(res, 'No se pudo verificar el email.'));
          setEstado('error');
        }
      } catch {
        setMensaje('No se pudo conectar con el servidor.');
        setEstado('error');
      }
    };
    verificar();
  }, [token, navigate]);

  const reenviarEmail = async (e) => {
    e.preventDefault();
    setAvisoReenvio('');
    try {
      const res = await apiFetch('/api/usuarios/reenviar-verificacion', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setAvisoReenvio(res.ok ? 'Listo, si la cuenta existe y no está verificada te enviamos un nuevo mail.' : await leerMensajeError(res, 'No se pudo reenviar el mail.'));
    } catch {
      setAvisoReenvio('No se pudo conectar con el servidor.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #dcd6cd',
    backgroundColor: '#FFFFFF',
    color: '#333333',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const botonPrimario = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#F4D06F',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  const iconos = { verificando: '⏳', ok: '✅', error: '⚠️' };
  const titulos = { verificando: 'Verificando tu email...', ok: '¡Email verificado!', error: 'No pudimos verificar tu email' };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* Lado Izquierdo - Branding (Paleta exacta Figma) */}
      <div style={{ flex: 1, backgroundColor: '#F7F4EB', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <span style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: 'bold' }}>(o)</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>Just Enough</span>
        </div>
        <h1 style={{ fontSize: '3.2rem', color: '#1a1a1a', lineHeight: '1.15', margin: '0 0 15px 0' }}>Producí lo justo.</h1>
        <h1 style={{ fontSize: '3.2rem', color: '#B89732', lineHeight: '1.15', margin: '0 0 25px 0' }}>Desperdiciá menos.</h1>
        <p style={{ color: '#666666', fontSize: '1.1rem', lineHeight: '1.5', maxWidth: '420px' }}>
          Predicciones simples para una producción gastronómica más eficiente.
        </p>
      </div>

      {/* Lado Derecho - Resultado de la verificación */}
      <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#FDF8EC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
            {iconos[estado]}
          </div>

          <div>
            <h2 style={{ fontSize: '2rem', color: '#1a1a1a', marginBottom: '10px', marginTop: '0' }}>{titulos[estado]}</h2>
            {estado === 'ok' && <p style={{ color: '#666666', fontSize: '0.95rem', margin: 0 }}>Tu cuenta está activa. Te llevamos a tu panel...</p>}
            {estado === 'error' && <p style={{ color: '#666666', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>{mensaje}</p>}
          </div>

          {estado === 'error' && (
            <form onSubmit={reenviarEmail} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <label style={{ color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Pedí un link nuevo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="tu@email.com" />
              <button type="submit" style={botonPrimario}>Reenviar email</button>
              {avisoReenvio && <p style={{ color: '#666666', margin: 0, fontSize: '0.9rem' }}>{avisoReenvio}</p>}
            </form>
          )}

          {estado !== 'verificando' && (
            <span onClick={() => navigate('/')} style={{ color: '#B89732', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
              ← Volver a iniciar sesión
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export default VerificarEmail;
