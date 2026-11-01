import { useState, useEffect } from 'react';
import BarraLateral from '../components/BarraLateral';
import { apiFetch, leerMensajeError, actualizarUsuarioGuardado } from '../api';
import { RUBROS, formatearFechaLarga } from '../utils/productos';

const bgApp = '#FAF9F6';
const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

const PASSWORD_VACIA = { passwordActual: '', passwordNueva: '', repetir: '' };

// Configuración de la cuenta. En el MVP cada comercio tiene una única cuenta (la del dueño),
// así que acá se editan juntos los datos de la persona y los del comercio.
function Configuracion() {
  const [form, setForm] = useState(null);
  const [email, setEmail] = useState('');
  const [fechaAlta, setFechaAlta] = useState('');
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [password, setPassword] = useState(PASSWORD_VACIA);
  const [avisoPassword, setAvisoPassword] = useState(null);

  const cargarEnFormulario = (datos) => {
    setEmail(datos.email);
    setFechaAlta(datos.fechaAlta);
    setForm({
      nombre: datos.nombre ?? '', nombreComercio: datos.nombreComercio ?? '', rubro: datos.rubro ?? 'PANADERIA',
      direccion: datos.direccion ?? '', localidad: datos.localidad ?? '', provincia: datos.provincia ?? '',
      telefono: datos.telefono ?? '', alertasPorEmail: datos.alertasPorEmail
    });
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch('/api/configuracion');
        if (res.ok) cargarEnFormulario(await res.json());
        else setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudo cargar la configuración.') });
      } catch {
        setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
      }
    };
    cargar();
  }, []);

  const cambiar = (campo, valor) => setForm({ ...form, [campo]: valor });

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    try {
      const res = await apiFetch('/api/configuracion', { method: 'PUT', body: JSON.stringify(form) });
      if (res.ok) {
        const datos = await res.json();
        cargarEnFormulario(datos);
        actualizarUsuarioGuardado(datos.usuario);   // la barra lateral muestra el nombre nuevo
        setAviso({ tipo: 'ok', texto: 'Cambios guardados.' });
      } else {
        setAviso({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron guardar los cambios.') });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    }
    setGuardando(false);
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (password.passwordNueva.length < 8) { setAvisoPassword({ tipo: 'error', texto: 'La contraseña nueva debe tener al menos 8 caracteres.' }); return; }
    if (password.passwordNueva !== password.repetir) { setAvisoPassword({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' }); return; }
    try {
      const res = await apiFetch('/api/configuracion/password', {
        method: 'PUT',
        body: JSON.stringify({ passwordActual: password.passwordActual, passwordNueva: password.passwordNueva })
      });
      if (res.ok) {
        setPassword(PASSWORD_VACIA);
        setAvisoPassword({ tipo: 'ok', texto: 'Contraseña actualizada.' });
      } else {
        setAvisoPassword({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudo cambiar la contraseña.') });
      }
    } catch {
      setAvisoPassword({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: textDark };
  const tarjeta = { backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '25px' };
  const campo = (etiqueta, nombre, props = {}) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={labelStyle}>{etiqueta}</label>
      <input value={form[nombre]} onChange={e => cambiar(nombre, e.target.value)} style={inputStyle} required {...props} />
    </div>
  );
  const mensaje = (a) => a && (
    <div style={{ padding: '10px 14px', borderRadius: '8px', marginTop: '15px', fontSize: '0.9rem', backgroundColor: a.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: a.tipo === 'ok' ? '#137333' : '#C5221F' }}>{a.texto}</div>
  );
  const botonPrincipal = { padding: '10px 22px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>

      <BarraLateral seccionActiva="configuracion" />

      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Configuración</h1>
          <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Los datos de tu cuenta y de tu comercio.</p>
        </div>

        {!form && !aviso && <p style={{ color: textGray }}>Cargando...</p>}
        {!form && mensaje(aviso)}

        {form && (
          <div style={{ maxWidth: '760px' }}>
            <form onSubmit={guardar}>
              {/* Cuenta */}
              <div style={tarjeta}>
                <h3 style={{ fontSize: '1.15rem', color: textDark, margin: '0 0 20px 0' }}>Tu cuenta</h3>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  {campo('Nombre', 'nombre', { maxLength: 100 })}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Email</label>
                    <input value={email} disabled style={{ ...inputStyle, backgroundColor: '#F5F5F5', color: textGray }} />
                    <span style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginTop: '5px' }}>Es tu usuario para iniciar sesión: no se puede cambiar.</span>
                  </div>
                </div>
              </div>

              {/* Comercio */}
              <div style={tarjeta}>
                <h3 style={{ fontSize: '1.15rem', color: textDark, margin: '0 0 5px 0' }}>Tu comercio</h3>
                {fechaAlta && <p style={{ color: textGray, fontSize: '0.85rem', margin: '0 0 20px 0' }}>Usando Just Enough desde el {formatearFechaLarga(fechaAlta).toLowerCase()}.</p>}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  {campo('Nombre del comercio', 'nombreComercio', { maxLength: 100 })}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Rubro</label>
                    <select value={form.rubro} onChange={e => cambiar('rubro', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {RUBROS.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  {campo('Dirección', 'direccion')}
                  {campo('Teléfono', 'telefono')}
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {campo('Localidad', 'localidad')}
                  {campo('Provincia', 'provincia')}
                </div>
              </div>

              {/* Preferencias */}
              <div style={tarjeta}>
                <h3 style={{ fontSize: '1.15rem', color: textDark, margin: '0 0 15px 0' }}>Alertas</h3>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.alertasPorEmail} onChange={e => cambiar('alertasPorEmail', e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: goldPrimary }} />
                  <span>
                    <span style={{ fontSize: '0.95rem', color: textDark, fontWeight: '600', display: 'block' }}>Recibir las alertas también por email</span>
                    <span style={{ fontSize: '0.85rem', color: textGray }}>Stock bajo y días sin cargar datos. Siempre las vas a ver en la campanita.</span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
                <button type="submit" disabled={guardando} style={{ ...botonPrincipal, cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <div style={{ flex: 1 }}>{mensaje(aviso)}</div>
              </div>
            </form>

            {/* Contraseña */}
            <form onSubmit={cambiarPassword} style={tarjeta}>
              <h3 style={{ fontSize: '1.15rem', color: textDark, margin: '0 0 20px 0' }}>Cambiar contraseña</h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                {['passwordActual', 'passwordNueva', 'repetir'].map((nombre, i) => (
                  <div key={nombre} style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>{['Contraseña actual', 'Contraseña nueva', 'Repetir la nueva'][i]}</label>
                    <input type="password" required value={password[nombre]} onChange={e => setPassword({ ...password, [nombre]: e.target.value })} style={inputStyle}
                      autoComplete={nombre === 'passwordActual' ? 'current-password' : 'new-password'} />
                  </div>
                ))}
              </div>
              <button type="submit" style={{ ...botonPrincipal, backgroundColor: bgCard, border: `1px solid ${borderLight}` }}>Cambiar contraseña</button>
              {mensaje(avisoPassword)}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Configuracion;
