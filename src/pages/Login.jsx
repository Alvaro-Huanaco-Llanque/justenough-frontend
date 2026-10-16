import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:8080/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('jwt_token', data.token);
        navigate('/dashboard'); 
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
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

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Lado Izquierdo - Branding (Paleta exacta Figma) */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#F7F4EB', 
        padding: '60px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <span style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: 'bold' }}>(o)</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1a1a1a' }}>Just Enough</span>
        </div>
        <h1 style={{ fontSize: '3.2rem', color: '#1a1a1a', lineHeight: '1.15', margin: '0 0 15px 0' }}>
          Producí lo justo.
        </h1>
        <h1 style={{ fontSize: '3.2rem', color: '#B89732', lineHeight: '1.15', margin: '0 0 25px 0' }}>
          Desperdiciá menos.
        </h1>
        <p style={{ color: '#666666', fontSize: '1.1rem', lineHeight: '1.5', maxWidth: '420px' }}>
          Predicciones simples para una producción gastronómica más eficiente.
        </p>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: '#1a1a1a', marginTop: '0' }}>Bienvenida de nuevo</h2>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={inputStyle}
                placeholder="camila@laespiga.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={inputStyle}
                placeholder="Ingresa tu contraseña"
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <span 
                  onClick={() => navigate('/recuperar')} 
                  style={{ color: '#B89732', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
            </div>

            {error && <p style={{ color: 'red', margin: '0', fontSize: '0.9rem' }}>{error}</p>}

            <button 
              type="submit" 
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
              Ingresar
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '25px', color: '#666666' }}>
            ¿No tenés cuenta? <span onClick={() => navigate('/registro')} style={{ color: '#B89732', cursor: 'pointer', fontWeight: 'bold' }}>Crear cuenta</span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;