import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pantalla from '../components/Pantalla';
import { BotonAlertas } from '../components/Alertas';
import { apiFetch, leerMensajeError, actualizarUsuarioGuardado, actualizarToken, cerrarSesion, MENSAJE_SIN_CONEXION } from '../api';
import { RUBROS, PROVINCIAS, formatearFechaLarga } from '../utils/productos';

const bgCard = '#FFFFFF';
const borderLight = '#EAE6DF';
const textDark = '#1A1A1A';
const textGray = '#666666';
const goldPrimary = '#D4AF37';

const PASSWORD_VACIA = { passwordActual: '', passwordNueva: '', repetir: '' };

// Configuración de la cuenta. En el MVP cada comercio tiene una única cuenta (la del dueño),
// así que acá se editan juntos los datos de la persona y los del comercio.
function Configuracion() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [email, setEmail] = useState('');
  const [fechaAlta, setFechaAlta] = useState('');
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [password, setPassword] = useState(PASSWORD_VACIA);
  const [avisoPassword, setAvisoPassword] = useState(null);
  const [avisoDatos, setAvisoDatos] = useState(null);
  const [baja, setBaja] = useState(null);   // null = oculto; si no, la contraseña que se está escribiendo
  const [errorBaja, setErrorBaja] = useState('');

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
        setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
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
      setAviso({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
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
        sinRefrescar: true,
        body: JSON.stringify({ passwordActual: password.passwordActual, passwordNueva: password.passwordNueva })
      });
      if (res.ok) {
        // Las demás sesiones se cerraron: esta sigue con el token nuevo
        actualizarToken((await res.json()).token);
        setPassword(PASSWORD_VACIA);
        setAvisoPassword({ tipo: 'ok', texto: 'Contraseña actualizada. Se cerró la sesión en tus otros dispositivos.' });
      } else {
        setAvisoPassword({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudo cambiar la contraseña.') });
      }
    } catch {
      setAvisoPassword({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
  };

  const descargarDatos = async () => {
    setAvisoDatos(null);
    try {
      const res = await apiFetch('/api/configuracion/exportar');
      if (!res.ok) { setAvisoDatos({ tipo: 'error', texto: await leerMensajeError(res, 'No se pudieron descargar los datos.') }); return; }
      const url = URL.createObjectURL(await res.blob());
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'just-enough-mis-datos.json';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setAvisoDatos({ tipo: 'error', texto: MENSAJE_SIN_CONEXION });
    }
  };

  const darDeBaja = async (e) => {
    e.preventDefault();
    setErrorBaja('');
    try {
      const res = await apiFetch('/api/configuracion/eliminar-cuenta', { method: 'POST', sinRefrescar: true, body: JSON.stringify({ password: baja }) });
      if (res.ok) {
        cerrarSesion();
        navigate('/', { replace: true });
      } else {
        setErrorBaja(await leerMensajeError(res, 'No se pudo dar de baja la cuenta.'));
      }
    } catch {
      setErrorBaja(MENSAJE_SIN_CONEXION);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: textDark };
  const tarjeta = { backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, padding: '30px', marginBottom: '25px' };
  const campo = (etiqueta, nombre, props = {}) => (
    <div style={{ minWidth: 0 }}>
      <label htmlFor={`config-${nombre}`} style={labelStyle}>{etiqueta}</label>
      <input id={`config-${nombre}`} value={form[nombre]} onChange={e => cambiar(nombre, e.target.value)} style={inputStyle} required {...props} />
    </div>
  );
  const mensaje = (a) => a && (
    <div role={a.tipo === 'ok' ? 'status' : 'alert'} style={{ padding: '10px 14px', borderRadius: '8px', marginTop: '15px', fontSize: '0.9rem', backgroundColor: a.tipo === 'ok' ? '#E6F4EA' : '#FCE8E6', color: a.tipo === 'ok' ? '#137333' : '#C5221F' }}>{a.texto}</div>
  );
  const botonPrincipal = { padding: '10px 22px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' };
  const botonSecundario = { ...botonPrincipal, backgroundColor: bgCard, border: `1px solid ${borderLight}` };

  // Si la provincia guardada no está en la lista (cuentas anteriores), se conserva como opción
  const provincias = form && form.provincia && !PROVINCIAS.includes(form.provincia) ? [form.provincia, ...PROVINCIAS] : PROVINCIAS;

  return (
    <Pantalla seccion="configuracion">
      <div className="fila-cabecera" style={{ marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 5px 0' }}>Configuración</h1>
          <p style={{ color: textGray, fontSize: '1rem' }}>Los datos de tu cuenta y de tu comercio.</p>
        </div>
        <BotonAlertas />
      </div>

      {!form && !aviso && <p style={{ color: textGray }}>Cargando...</p>}
      {!form && mensaje(aviso)}

      {form && (
        <div style={{ maxWidth: '760px' }}>
          <form onSubmit={guardar}>
            <div style={tarjeta}>
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 20px 0' }}>Tu cuenta</h3>
              <div className="grilla-2" style={{ gap: '15px' }}>
                {campo('Nombre', 'nombre', { maxLength: 100 })}
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="config-email" style={labelStyle}>Email</label>
                  <input id="config-email" value={email} disabled style={{ ...inputStyle, backgroundColor: '#F5F5F5', color: textGray }} />
                  <span style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginTop: '5px' }}>Es tu usuario para iniciar sesión: no se puede cambiar.</span>
                </div>
              </div>
            </div>

            <div style={tarjeta}>
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 5px 0' }}>Tu comercio</h3>
              {fechaAlta && <p style={{ color: textGray, fontSize: '0.85rem', margin: '0 0 20px 0' }}>Usando Just Enough desde el {formatearFechaLarga(fechaAlta).toLowerCase()}.</p>}
              <div className="grilla-2" style={{ gap: '15px', marginBottom: '15px' }}>
                {campo('Nombre del comercio', 'nombreComercio', { maxLength: 100 })}
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="config-rubro" style={labelStyle}>Rubro</label>
                  <select id="config-rubro" value={form.rubro} onChange={e => cambiar('rubro', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {RUBROS.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
                  </select>
                </div>
              </div>
              <div className="grilla-2" style={{ gap: '15px', marginBottom: '15px' }}>
                {campo('Dirección', 'direccion', { maxLength: 200 })}
                {campo('Teléfono', 'telefono', { maxLength: 30 })}
              </div>
              <div className="grilla-2" style={{ gap: '15px' }}>
                {campo('Localidad', 'localidad', { maxLength: 100 })}
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="config-provincia" style={labelStyle}>Provincia</label>
                  <select id="config-provincia" value={form.provincia} onChange={e => cambiar('provincia', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={tarjeta}>
              <h3 style={{ fontSize: '1.15rem', margin: '0 0 15px 0' }}>Alertas</h3>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.alertasPorEmail} onChange={e => cambiar('alertasPorEmail', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: goldPrimary }} />
                <span>
                  <span style={{ fontSize: '0.95rem', color: textDark, fontWeight: '600', display: 'block' }}>Recibir las alertas también por email</span>
                  <span style={{ fontSize: '0.85rem', color: textGray }}>Stock bajo y días sin cargar datos. Siempre las vas a ver en la campanita.</span>
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '35px' }}>
              <button type="submit" disabled={guardando} style={{ ...botonPrincipal, cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <div style={{ flex: 1, minWidth: '200px' }}>{mensaje(aviso)}</div>
            </div>
          </form>

          <form onSubmit={cambiarPassword} style={tarjeta}>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 20px 0' }}>Cambiar contraseña</h3>
            <div className="grilla-3" style={{ gap: '15px', marginBottom: '20px' }}>
              {['passwordActual', 'passwordNueva', 'repetir'].map((nombre, i) => (
                <div key={nombre} style={{ minWidth: 0 }}>
                  <label htmlFor={`clave-${nombre}`} style={labelStyle}>{['Contraseña actual', 'Contraseña nueva', 'Repetir la nueva'][i]}</label>
                  <input id={`clave-${nombre}`} type="password" required maxLength={72} value={password[nombre]} onChange={e => setPassword({ ...password, [nombre]: e.target.value })} style={inputStyle}
                    autoComplete={nombre === 'passwordActual' ? 'current-password' : 'new-password'} />
                </div>
              ))}
            </div>
            <button type="submit" style={botonSecundario}>Cambiar contraseña</button>
            {mensaje(avisoPassword)}
          </form>

          <div style={tarjeta}>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 8px 0' }}>Tus datos</h3>
            <p style={{ color: textGray, fontSize: '0.9rem', margin: '0 0 15px 0' }}>
              Descargá todo lo que cargaste o dá de baja la cuenta. Leé los{' '}
              <button type="button" onClick={() => navigate('/terminos')} style={{ padding: 0, background: 'none', border: 'none', color: '#B89732', font: 'inherit', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>términos y la política de privacidad</button>.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button type="button" onClick={descargarDatos} style={botonSecundario}>Descargar mis datos</button>
              {baja === null && (
                <button type="button" onClick={() => { setErrorBaja(''); setBaja(''); }} style={{ ...botonSecundario, color: '#C5221F', borderColor: '#E8B4B0' }}>Dar de baja la cuenta</button>
              )}
            </div>
            {mensaje(avisoDatos)}

            {baja !== null && (
              <form onSubmit={darDeBaja} style={{ marginTop: '20px', padding: '18px', borderRadius: '10px', backgroundColor: '#FCE8E6' }}>
                <p style={{ color: '#8C1D18', fontSize: '0.92rem', margin: '0 0 12px 0' }}>
                  <strong>Esto no se puede deshacer.</strong> Se borran para siempre el comercio, los productos, las ventas y todo el historial.
                </p>
                <label htmlFor="baja-clave" style={labelStyle}>Escribí tu contraseña para confirmar</label>
                <input id="baja-clave" type="password" required value={baja} onChange={e => setBaja(e.target.value)} autoComplete="current-password" style={{ ...inputStyle, marginBottom: '12px' }} />
                {errorBaja && <p role="alert" style={{ color: '#C5221F', fontSize: '0.88rem', margin: '0 0 12px 0' }}>{errorBaja}</p>}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setBaja(null)} style={botonSecundario}>Cancelar</button>
                  <button type="submit" style={{ ...botonPrincipal, backgroundColor: '#C5221F', color: '#FFFFFF' }}>Borrar todo definitivamente</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Pantalla>
  );
}

export default Configuracion;
