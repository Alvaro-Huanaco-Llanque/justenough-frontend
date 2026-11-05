import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Marca';
import { apiFetch, leerMensajeError } from '../api';

// Pantalla a la que lleva el link del mail de "¿Olvidaste tu contraseña?" (/restablecer?token=...)
function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState(token ? '' : 'El link no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".');
  const [listo, setListo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const restablecer = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== repetir) { setError('Las contraseñas no coinciden.'); return; }
    setError('');
    setEnviando(true);
    try {
      const res = await apiFetch('/api/usuarios/restablecer', { method: 'POST', body: JSON.stringify({ token, password }) });
      if (res.ok) setListo((await res.json()).message);
      else setError(await leerMensajeError(res, 'No se pudo restablecer la contraseña.'));
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
    setEnviando(false);
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dcd6cd', backgroundColor: '#FFFFFF', color: '#333333', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' };

  return (
    <div className="auth-raiz">
      <div className="auth-marca">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Logo tamano={40} />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>Just Enough</span>
        </div>
        <h1 style={{ fontSize: '3.2rem', color: '#1a1a1a', lineHeight: '1.15', margin: '0 0 15px 0' }}>Producí lo justo.</h1>
        <h1 style={{ fontSize: '3.2rem', color: '#B89732', lineHeight: '1.15', margin: '0 0 25px 0' }}>Desperdiciá menos.</h1>
        <p style={{ color: '#666666', fontSize: '1.1rem', lineHeight: '1.5', maxWidth: '420px' }}>Elegí una contraseña nueva para tu cuenta.</p>
      </div>

      <div className="auth-form">
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: '#1a1a1a', marginTop: '0' }}>Nueva contraseña</h2>

          {listo ? (
            <>
              <div style={{ background: '#e6ffe6', padding: '15px', borderRadius: '8px', color: '#006600', marginBottom: '20px', border: '1px solid #b3ffb3' }}>{listo}</div>
              <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', backgroundColor: '#F4D06F', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Ir a iniciar sesión
              </button>
            </>
          ) : (
            <form onSubmit={restablecer} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Contraseña nueva</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label style={labelStyle}>Repetir contraseña</label>
                <input type="password" value={repetir} onChange={e => setRepetir(e.target.value)} required style={inputStyle} autoComplete="new-password" />
              </div>
              {error && <p style={{ color: 'red', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
              <button type="submit" disabled={enviando || !token} style={{ padding: '14px', backgroundColor: '#F4D06F', color: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: enviando ? 'wait' : 'pointer', opacity: enviando || !token ? 0.7 : 1, marginTop: '10px' }}>
                {enviando ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '25px' }}>
            <span onClick={() => navigate('/recuperar')} style={{ color: '#B89732', cursor: 'pointer', fontWeight: 'bold' }}>Pedir un link nuevo</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RestablecerPassword;
