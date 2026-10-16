import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Registro() {
  const [paso, setPaso] = useState(1);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  
  // Estados del Paso 1 (Comercio)
  const [nombreComercio, setNombreComercio] = useState('');
  const [rubro, setRubro] = useState('PANADERIA');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estados del Paso 2 (Usuario/Dueño)
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terminos, setTerminos] = useState(false);

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSiguiente = (e) => {
    e.preventDefault();
    if (!nombreComercio || !direccion || !telefono) {
      setError('Por favor completa todos los campos del comercio.');
      return;
    }
    setError('');
    setPaso(2);
  };

  const handleRegistroFinal = async (e) => {
    e.preventDefault();
    if (!terminos) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nombreUsuario, 
          email: email, 
          password: password 
        })
      });

      if (res.ok) {
        // En lugar de redirigir de una, activamos la pantalla de verificación de email
        setVerificandoEmail(true);
      } else {
        const errText = await res.text();
        setError('Error al registrarse: ' + errText);
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

      {/* Lado Derecho - Formulario / Pantalla de Verificación */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px 0' }}>
          
          {verificandoEmail ? (
            /* ================= PANTALLA: VERIFICÁ TU EMAIL ================= */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                backgroundColor: '#FDF8EC', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                ✉️
              </div>

              <div>
                <h2 style={{ fontSize: '2rem', color: '#1a1a1a', marginBottom: '10px', marginTop: '0' }}>Verificá tu email</h2>
                <p style={{ color: '#666666', fontSize: '0.95rem', lineHeight: '1.5', margin: '0' }}>
                  Te enviamos un enlace a <strong style={{ color: '#1a1a1a' }}>{email}</strong>
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <button 
                  onClick={() => alert('¡Correo de verificación reenviado con éxito!')}
                  style={{ 
                    width: '100%',
                    padding: '14px', 
                    backgroundColor: '#FFFFFF', 
                    color: '#1a1a1a',
                    border: '1px solid #dcd6cd', 
                    borderRadius: '8px', 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    cursor: 'pointer'
                  }}
                >
                  Reenviar email
                </button>

                <button 
                  onClick={() => navigate('/')}
                  style={{ 
                    width: '100%',
                    padding: '14px', 
                    backgroundColor: '#F4D06F', 
                    color: '#1a1a1a',
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    cursor: 'pointer'
                  }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          ) : (
            /* ================= FLUJO DE REGISTRO (PASO 1 Y 2) ================= */
            <>
              {/* Enlace superior */}
              <div style={{ marginBottom: '25px' }}>
                <span 
                  onClick={() => navigate('/')} 
                  style={{ color: '#B89732', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  ← Volver a iniciar sesión
                </span>
              </div>

              {/* Barra de progreso de 2 pasos */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#B89732', borderRadius: '2px' }}></div>
                <div style={{ flex: 1, height: '4px', backgroundColor: paso === 2 ? '#B89732' : '#e0e0e0', borderRadius: '2px' }}></div>
              </div>

              {paso === 1 ? (
                /* ================= PASO 1: TU COMERCIO ================= */
                <form onSubmit={handleSiguiente} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#888888', fontWeight: 'bold', letterSpacing: '0.5px' }}>PASO 1 DE 2</span>
                  <h2 style={{ fontSize: '2rem', marginBottom: '5px', color: '#1a1a1a', marginTop: '0' }}>Tu comercio</h2>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Nombre</label>
                    <input 
                      type="text" 
                      value={nombreComercio} 
                      onChange={(e) => setNombreComercio(e.target.value)} 
                      required 
                      style={inputStyle}
                      placeholder="Panadería La Espiga"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Rubro</label>
                    <select 
                      value={rubro} 
                      onChange={(e) => setRubro(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="PANADERIA">Panadería</option>
                      <option value="CAFETERIA">Cafetería</option>
                      <option value="RESTAURANTE">Restaurante</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Dirección</label>
                    <input 
                      type="text" 
                      value={direccion} 
                      onChange={(e) => setDireccion(e.target.value)} 
                      required 
                      style={inputStyle}
                      placeholder="Av. Corrientes 1234, CABA"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Teléfono</label>
                    <input 
                      type="text" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                      required 
                      style={inputStyle}
                      placeholder="+54 11 5555-5555"
                    />
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
                    Continuar
                  </button>
                </form>
              ) : (
                /* ================= PASO 2: TUS DATOS ================= */
                <form onSubmit={handleRegistroFinal} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#888888', fontWeight: 'bold', letterSpacing: '0.5px' }}>PASO 2 DE 2</span>
                  <h2 style={{ fontSize: '2rem', marginBottom: '5px', color: '#1a1a1a', marginTop: '0' }}>Tus datos</h2>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#444444', fontSize: '0.9rem', fontWeight: '500' }}>Nombre</label>
                    <input 
                      type="text" 
                      value={nombreUsuario} 
                      onChange={(e) => setNombreUsuario(e.target.value)} 
                      required 
                      style={inputStyle}
                      placeholder="Camila Méndez"
                    />
                  </div>

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
                      placeholder="••••••••"
                    />
                    <span style={{ fontSize: '0.8rem', color: '#888888', marginTop: '6px', display: 'block' }}>Mínimo 8 caracteres</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                    <input 
                      type="checkbox" 
                      checked={terminos} 
                      onChange={(e) => setTerminos(e.target.checked)} 
                      id="terminos"
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="terminos" style={{ fontSize: '0.9rem', color: '#444444', cursor: 'pointer' }}>
                      Acepto los términos y condiciones
                    </label>
                  </div>

                  {error && <p style={{ color: 'red', margin: '0', fontSize: '0.9rem' }}>{error}</p>}

                  {/* Contenedor de botones: Volver al paso 1 y Crear cuenta */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setPaso(1)}
                      style={{ 
                        flex: 1,
                        padding: '14px', 
                        backgroundColor: '#F0EFEA', 
                        color: '#333333',
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '1rem', 
                        fontWeight: 'bold', 
                        cursor: 'pointer'
                      }}
                    >
                      Volver
                    </button>
                    <button 
                      type="submit" 
                      style={{ 
                        flex: 2,
                        padding: '14px', 
                        backgroundColor: '#F4D06F', 
                        color: '#1a1a1a',
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '1rem', 
                        fontWeight: 'bold', 
                        cursor: 'pointer'
                      }}
                    >
                      Crear cuenta
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}

export default Registro;