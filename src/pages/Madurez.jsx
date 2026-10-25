import BarraLateral from '../components/BarraLateral';

function Madurez() {
  // Datos simulados de madurez del modelo
  const productosMadurez = [
    { id: 1, nombre: "Medialuna", dias: 72, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 2, nombre: "Cookie 50g", dias: 64, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 3, nombre: "Budín", dias: 61, estado: "Alta", mensaje: "Nivel máximo alcanzado" },
    { id: 4, nombre: "Muffin", dias: 45, estado: "Media", mensaje: "Faltan 15 días para Alta" },
    { id: 5, nombre: "Scon", dias: 12, estado: "Baja", mensaje: "Faltan 18 días para Media" }
  ];

  const getBadgeColor = (estado) => {
    if (estado === 'Alta') return { bg: '#E6F4EA', color: '#137333' };
    if (estado === 'Media') return { bg: '#FEF7E0', color: '#B06000' };
    return { bg: '#F1F3F4', color: '#666666' }; // Baja (Gris)
  };

  const bgApp = '#FAF9F6'; 
  const bgCard = '#FFFFFF';
  const borderLight = '#EAE6DF';
  const textDark = '#1A1A1A';
  const textGray = '#666666';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', backgroundColor: bgApp, boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <BarraLateral seccionActiva="madurez" />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 50px', boxSizing: 'border-box' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: textDark, margin: '0 0 5px 0', fontWeight: 'bold' }}>Madurez</h1>
            <p style={{ color: textGray, margin: 0, fontSize: '1rem' }}>Viernes, 12 de junio</p>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bgCard, border: `1px solid ${borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: textGray }}>
            🔔
          </button>
        </div>

        {/* Título de Sección */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.6rem', color: textDark, margin: '0 0 5px 0' }}>Madurez del modelo</h2>
          <p style={{ color: textGray, margin: 0, fontSize: '0.95rem' }}>Cuantos más días cargues, más precisas son las sugerencias.</p>
        </div>

        {/* Grilla de Tarjetas de Madurez */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {productosMadurez.map((prod) => {
            const badge = getBadgeColor(prod.estado);
            // Calculamos el progreso sobre 60 días máximo
            const progresoPorcentaje = Math.min((prod.dias / 60) * 100, 100);

            return (
              <div key={prod.id} style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Título y Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: textDark }}>{prod.nombre}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color }}>
                    {prod.estado}
                  </span>
                </div>

                {/* Número de Días */}
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: textDark }}>{prod.dias}</span>
                  <span style={{ fontSize: '0.9rem', color: textGray, marginLeft: '5px' }}>días de datos</span>
                </div>

                {/* Barra de Progreso */}
                <div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#F1EDE4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${progresoPorcentaje}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: textGray, fontWeight: '500' }}>{prod.mensaje}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Leyenda Footer */}
        <div style={{ backgroundColor: bgCard, border: `1px solid ${borderLight}`, borderRadius: '50px', padding: '15px 30px', textAlign: 'center', color: textGray, fontSize: '0.85rem' }}>
          Baja &lt; 30 días &nbsp;&nbsp;·&nbsp;&nbsp; Media 30–59 &nbsp;&nbsp;·&nbsp;&nbsp; Alta 60+
        </div>

      </div>
    </div>
  );
}

export default Madurez;