import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Inicializamos el token leyéndolo del localStorage si ya existe
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || '');
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios", err);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre, email: regEmail, password: regPassword })
      });
      if (res.ok) {
        setMensaje('¡Usuario registrado con éxito!');
        cargarUsuarios();
      } else {
        const errText = await res.text();
        setMensaje('Error en registro: ' + errText);
      }
    } catch (err) {
      setMensaje('Error de conexión con el backend');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        const jwtToken = data.token;
        setToken(jwtToken);
        // ¡Guardamos el token en el localStorage!
        localStorage.setItem('jwt_token', jwtToken);
        setMensaje('¡Login exitoso! Token guardado en localStorage.');
      } else {
        setMensaje('Error en login: ' + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      setMensaje('Error de conexión con el backend');
    }
  };

  // Función para cerrar sesión y limpiar el almacenamiento
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('jwt_token');
    setMensaje('Sesión cerrada correctamente.');
  };

  const [perfilMensaje, setPerfilMensaje] = useState('');

  const probarRutaProtegida = async () => {
    try {
      const jwtGuardado = localStorage.getItem('jwt_token');
      if (!jwtGuardado) {
        setPerfilMensaje('No hay token guardado. Iniciá sesión primero.');
        return;
      }

      const res = await fetch('http://localhost:8080/api/usuarios/perfil', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtGuardado}`
        }
      });

      if (res.ok) {
        const data = await res.text(); // O .json() dependiendo de qué devuelva tu backend
        setPerfilMensaje('Éxito en ruta protegida: ' + data);
      } else {
        setPerfilMensaje('Acceso denegado (401/403). Token inválido o expirado.');
      }
    } catch (err) {
      setPerfilMensaje('Error de conexión con el backend');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Prueba de Backend - JustEnough</h2>
      
      {mensaje && <div style={{ background: '#eee', padding: '10px', marginBottom: '15px', color: '#000' }}>{mensaje}</div>}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Formulario Registro */}
        <form onSubmit={handleRegistro} style={{ flex: 1, border: '1px solid #ccc', padding: '15px' }}>
          <h3>Registro</h3>
          <div>
            <label>Nombre:</label><br/>
            <input type="text" value={regNombre} onChange={e => setRegNombre(e.target.value)} required />
          </div>
          <div>
            <label>Email:</label><br/>
            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
          </div>
          <div>
            <label>Contraseña:</label><br/>
            <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Registrar</button>
        </form>

        {/* Formulario Login */}
        <form onSubmit={handleLogin} style={{ flex: 1, border: '1px solid #ccc', padding: '15px' }}>
          <h3>Login</h3>
          <div>
            <label>Email:</label><br/>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
          </div>
          <div>
            <label>Contraseña:</label><br/>
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Iniciar Sesión</button>
        </form>
      </div>

{token && (
        <div style={{ marginTop: '20px', background: '#e6ffe6', padding: '10px', wordBreak: 'break-all', color: '#000' }}>
          <strong>Token JWT Guardado:</strong> {token}
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={probarRutaProtegida} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
              Probar Ruta Protegida
            </button>
            <button onClick={handleLogout} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
              Cerrar Sesión
            </button>
          </div>
          {perfilMensaje && <div style={{ marginTop: '10px', fontWeight: 'bold' }}>{perfilMensaje}</div>}
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Usuarios en la Base de Datos ({usuarios.length})</h3>
        <ul>
          {usuarios.map(u => (
            <li key={u.id}>{u.nombre} - {u.email} ({u.activo ? 'Activo' : 'Inactivo'})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;