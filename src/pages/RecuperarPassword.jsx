import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Marca';
import { apiFetch, leerMensajeError, MENSAJE_SIN_CONEXION } from '../api';

// Pide el link para restablecer la contraseña. El backend responde lo mismo exista o no la cuenta.
function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const res = await apiFetch('/api/usuarios/recuperar', { method: 'POST', body: JSON.stringify({ email }) });
      if (res.ok) setEnviado((await res.json()).message);
      else setError(await leerMensajeError(res, 'No se pudo enviar el mail.'));
    } catch {
      setError(MENSAJE_SIN_CONEXION);
    }
    setEnviando(false);
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

  return (
    <div className="auth-raiz">
      
      {/* Lado Izquierdo - Branding (Paleta exacta Figma) */}
      <div className="auth-marca">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Logo tamano={40} />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>Just Enough</span>
        </div>
        <h1 style={{ fontSize: '3.2rem', color: '#1a1a1a', lineHeight: '1.15', margin: '0 0 15px 0' }}>
          Producí lo justo.
        </h1>
        <h1 style={{ fontSize: '3.2rem', color: '#B89732', lineHeight: '1.15', margin: '0 0 25px 0' }}>
          Desperdiciá menos.
        </h1>
        <p style={{ color: '#666666', fontSize: '1.1rem', lineHeight: '1.5', maxWidth: '420px' }}>
          Recuperá el acceso a tu cuenta en segundos.
        </p>
      </div>

      {/* Lado Derecho - Formulario de Recuperación */}
      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: '#1a1a1a', marginTop: '0' }}>Recuperar contraseña</h2>
          <p style={{ color: '#666666', marginBottom: '30px' }}>Te enviaremos las instrucciones a tu correo.</p>
          
          {enviado ? (
            <div style={{ background: '#e6ffe6', padding: '15px', borderRadius: '8px', color: '#006600', marginBottom: '20px', border: '1px solid #b3ffb3' }}>
              {enviado} El link vence en 1 hora.
            </div>
          ) : (
            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={inputStyle}
                  placeholder="tu@email.com"
                />
              </div>

              {error && <p style={{ color: 'red', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                style={{
                  padding: '14px', 
                  backgroundColor: '#F4D06F', 
                  color: '#1a1a1a',
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1rem', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '25px' }}>
            <span 
              onClick={() => navigate('/')} 
              style={{ color: '#B89732', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ← Volver al inicio de sesión
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default RecuperarPassword;