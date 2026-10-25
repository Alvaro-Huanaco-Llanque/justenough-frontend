import { useState } from 'react';
import BarraLateral from '../components/BarraLateral';

function Calendario() {
  // Estado de los eventos en el calendario
  const [eventos, setEventos] = useState([
    { id: 1, dia: 15, titulo: "Güemes", subtitulo: "Nacional", tipo: "feriado" },
    { id: 2, dia: 16, titulo: "Partido Argentina", subtitulo: "", tipo: "evento" },
    { id: 3, dia: 20, titulo: "Día de la Bandera", subtitulo: "Nacional", tipo: "feriado" },
    { id: 4, dia: 20, titulo: "Feria en la plaza", subtitulo: "", tipo: "evento" }
  ]);

  // Estado del modal de "Agregar evento"
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({
    nombre: '',
    fecha: '',
    tipo: 'Feria',
    impacto: 'Más demanda'
  });

  const guardarEvento = () => {
    if (!nuevoEvento.nombre || !nuevoEvento.fecha) return;
    
    // Extraer el día de la fecha seleccionada (YYYY-MM-DD)
    const diaSeleccionado = parseInt(nuevoEvento.fecha.split('-')[2], 10);

    const eventoCreado = {
      id: Date.now(),
      dia: diaSeleccionado,
      titulo: nuevoEvento.nombre,
      subtitulo: nuevoEvento.tipo === 'Feria' ? '' : nuevoEvento.tipo,
      tipo: 'evento' // Lo marcamos como evento (amarillo)
    };

    setEventos([...eventos, eventoCreado]);
    setModalAbierto(false);
    setNuevoEvento({ nombre: '', fecha: '', tipo: 'Feria', impacto: 'Más demanda' });
  };

  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';
  const goldPrimary = '#D4AF37';

  // Generar array de 30 días para Junio
  const diasMes = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
      <BarraLateral seccionActiva="calendario" />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Calendario</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título de Sección y Botón Agregar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Calendario</h2>
            <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Junio · Los feriados y eventos se usan en la predicción.</p>
          </div>
          <button 
            onClick={() => setModalAbierto(true)}
            style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> Agregar evento
          </button>
        </div>

        {/* Grilla del Calendario */}
        <div style={{ backgroundColor: bgCard, borderRadius: '16px', border: `1px solid ${borderLight}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Días de la semana (Cabecera) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${borderLight}`, backgroundColor: bgCard }}>
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(dia => (
              <div key={dia} style={{ padding: '15px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#A0A0A0', letterSpacing: '0.5px' }}>
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes (Celdas) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
            {diasMes.map(dia => {
              // Filtrar eventos de este día
              const eventosDelDia = eventos.filter(e => e.dia === dia);
              
              return (
                <div key={dia} style={{ borderRight: `1px solid ${borderLight}`, borderBottom: `1px solid ${borderLight}`, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: textDark }}>{dia}</span>
                  
                  {/* Renderizar etiquetas de eventos */}
                  {eventosDelDia.map(ev => (
                    <div key={ev.id} style={{ 
                      backgroundColor: ev.tipo === 'feriado' ? '#F1F3F4' : '#FDF8EC', 
                      padding: '6px 8px', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      flexDirection: 'column' 
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: ev.tipo === 'feriado' ? textDark : '#B89732' }}>{ev.titulo}</span>
                      {ev.subtitulo && <span style={{ fontSize: '0.65rem', color: textGray }}>{ev.subtitulo}</span>}
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Celdas vacías para completar la grilla si es necesario (ej: 5 días vacíos al final para hacer 35) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: `1px solid ${borderLight}`, borderBottom: `1px solid ${borderLight}`, padding: '10px', backgroundColor: '#FAFAFA' }}></div>
            ))}
          </div>

        </div>

      </div>

      {/* ================= MODAL "AGREGAR EVENTO" ================= */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: bgCard, width: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            
            <h3 style={{ fontSize: '1.4rem', color: textDark, margin: '0 0 20px 0', fontWeight: 'bold' }}>Agregar evento</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Nombre</label>
              <input 
                type="text" 
                placeholder="Ej. Feria en la plaza"
                value={nuevoEvento.nombre}
                onChange={(e) => setNuevoEvento({...nuevoEvento, nombre: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Fecha</label>
              <input 
                type="date" 
                value={nuevoEvento.fecha}
                onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${goldPrimary}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} 
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Tipo</label>
              <select 
                value={nuevoEvento.tipo}
                onChange={(e) => setNuevoEvento({...nuevoEvento, tipo: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Feria">Feria</option>
                <option value="Partido">Partido</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: textDark, marginBottom: '8px' }}>Impacto esperado</label>
              <select 
                value={nuevoEvento.impacto}
                onChange={(e) => setNuevoEvento({...nuevoEvento, impacto: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${borderLight}`, backgroundColor: '#FFFFFF', color: textDark, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Más demanda">Más demanda</option>
                <option value="Menos demanda">Menos demanda</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalAbierto(false)} style={{ padding: '10px 20px', backgroundColor: bgCard, color: textDark, border: `1px solid ${borderLight}`, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button onClick={guardarEvento} style={{ padding: '10px 20px', backgroundColor: '#F4D06F', color: textDark, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                Guardar evento
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Calendario;