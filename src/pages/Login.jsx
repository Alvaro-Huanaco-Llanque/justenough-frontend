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
        // Guardamos el token y redirigimos al panel principal
        localStorage.setItem('jwt_token', data.token);
        navigate('/dashboard'); 
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Lado Izquierdo - Branding */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#FDFBF7', 
        padding: '50px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <h2 style={{ color: '#D4AF37', marginBottom: '20px' }}>(o) Just Enough</h2>
        <h1 style={{ fontSize: '3rem', color: '#333', lineHeight: '1.2' }}>
          Producí lo justo.<br/>Desperdiciá menos.
        </h1>
        <p style={{ color: '#666', fontSize: '1.2rem', marginTop: '20px' }}>
          Predicciones simples para una producción gastronómica más inteligente.
        </p>
      </div>

      {/* Lado Derecho - Formulario */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: '#333' }}>Bienvenida de nuevo</h2>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
                placeholder="camila@laespiga.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
                placeholder="Ingresa tu contraseña"
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <span style={{ color: '#D4AF37', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
            </div>

            {error && <p style={{ color: 'red', margin: '0' }}>{error}</p>}

            <button 
              type="submit" 
              style={{ 
                padding: '15px', 
                backgroundColor: '#F5D77F', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Ingresar
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            ¿No tenés cuenta? <span style={{ color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold' }}>Crear cuenta</span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;