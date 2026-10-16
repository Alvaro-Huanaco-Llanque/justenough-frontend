import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [seccionActiva, setSeccionActiva] = useState('principal');

  // Datos simulados (Mock data) limpios, sin referencias a USD
  const resumen = {
    usuario: "Camila",
    comercio: "Panadería La Espiga",
    fecha: "12 de jun. 2026",
    metricas: {
      produccionSemanal: "246 uds. / $810.000 ARS",
      prediccionPrecisa: "87%",
      alertasActivas: 4
    },
    sugerenciasHoy: [
      { producto: "Medialuna de manteca", stockHoy: "110 uds.", sugerido: "96 uds.", confianza: "Alta" },
      { producto: "Cookie 50g", stockHoy: "75 uds.", sugerido: "40 uds.", confianza: "Alta" },
      { producto: "Muffin", stockHoy: "0 uds.", sugerido: "42 uds.", confianza: "Media" },
      { producto: "Budín", stockHoy: "18 uds.", sugerido: "20 uds.", confianza: "Baja" }
    ]
  };

  const getBadgeColor = (confianza) => {
    if (confianza === 'Alta') return { bg: '#e6f4ea', color: '#137333' };
    if (confianza === 'Media') return { bg: '#fef7e0', color: '#b06000' };
    return { bg: '#fce8e6', color: '#c5221f' };
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#F9F8F6', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <div style={{ 
        width: '260px', 
        height: '100%',
        backgroundColor: '#FFFFFF', 
        borderRight: '1px solid #E5E0D8',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div>
          {/* Logo y Comercio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
            <span style={{ color: '#D4AF37', fontSize: '1.4rem', fontWeight: 'bold' }}>(o)</span>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1a1a1a', display: 'block' }}>{resumen.comercio}</span>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Versión 24</span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { id: 'principal', label: 'Principal', icon: '🏠' },
              { id: 'produccion', label: 'Producción / Compras', icon: '📦' },
              { id: 'ventas', label: 'Ventas', icon: '📈' },
              { id: 'desechos', label: 'Desechos', icon: '🗑️' },
              { id: 'sugerencias', label: 'Sugerencias', icon: '✨' },
              { id: 'impacto', label: 'Impacto', icon: '📊' },
              { id: 'productos', label: 'Productos', icon: '🥐' },
              { id: 'calendario', label: 'Calendario', icon: '📅' },
              { id: 'madurez', label: 'Madurez', icon: '🌱' },
              { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
            ].map((item) => (
              <div 
                key={item.id}
                onClick={() => setSeccionActiva(item.id)}
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  backgroundColor: seccionActiva === item.id ? '#F7F4EB' : 'transparent',
                  color: seccionActiva === item.id ? '#B89732' : '#555555',
                  fontWeight: seccionActiva === item.id ? 'bold' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.95rem'
                }}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Usuario inferior */}
        <div style={{ borderTop: '1px solid #E5E0D8', paddingTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F4D06F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1a1a1a' }}>
              {resumen.usuario[0]}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#333' }}>{resumen.usuario}</span>
          </div>
          <span 
            onClick={() => navigate('/')} 
            style={{ fontSize: '0.8rem', color: '#c5221f', cursor: 'pointer', fontWeight: 'bold' }}
            title="Cerrar sesión"
          >
            Salir
          </span>
        </div>
      </div>

      {/* ================= CONTENIDO PRINCIPAL (ANCHO COMPLETO) ================= */}
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px', boxSizing: 'border-box' }}>
        
        {/* Cabecera del Dashboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#1a1a1a', margin: '0 0 5px 0' }}>Principal</h1>
            <p style={{ color: '#666666', margin: 0, fontSize: '1.1rem' }}>Buen día, {resumen.usuario}</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666', backgroundColor: '#FFFFFF', padding: '8px 15px', borderRadius: '8px', border: '1px solid #E5E0D8' }}>
              📅 {resumen.fecha}
            </span>
            <button 
              onClick={() => alert('Actualizando predicciones con IA...')}
              style={{ 
                padding: '10px 18px', 
                backgroundColor: '#F4D06F', 
                color: '#1a1a1a', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer' 
              }}
            >
              🔄 Forzar ahora
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Superiores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
            <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '8px' }}>Producción de la semana</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1a1a1a' }}>{resumen.metricas.produccionSemanal}</span>
            <span style={{ fontSize: '0.8rem', color: '#137333', display: 'block', marginTop: '5px' }}>+8% vs. la semana anterior</span>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
            <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '8px' }}>Precisión de la predicción</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>{resumen.metricas.prediccionPrecisa}</span>
            <span style={{ fontSize: '0.8rem', color: '#137333', display: 'block', marginTop: '5px' }}>Modelo entrenado y activo</span>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
            <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '8px' }}>Alertas activas</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#B89732' }}>{resumen.metricas.alertasActivas}</span>
            <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginTop: '5px' }}>Requieren revisión de stock</span>
          </div>
        </div>

        {/* Sección: Producción recomendada para hoy */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E0D8' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#1a1a1a', marginTop: '0', marginBottom: '20px' }}>
            Producción recomendada para hoy
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D8', color: '#666', fontSize: '0.85rem' }}>
                <th style={{ paddingBottom: '12px' }}>PRODUCTO</th>
                <th style={{ paddingBottom: '12px' }}>STOCK HOY</th>
                <th style={{ paddingBottom: '12px' }}>PRODUCCIÓN SUGERIDA</th>
                <th style={{ paddingBottom: '12px' }}>CONFIANZA</th>
              </tr>
            </thead>
            <tbody>
              {resumen.sugerenciasHoy.map((item, index) => {
                const badge = getBadgeColor(item.confianza);
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #F1EDE4' }}>
                    <td style={{ padding: '15px 0', fontWeight: '500', color: '#1a1a1a' }}>{item.producto}</td>
                    <td style={{ padding: '15px 0', color: '#555' }}>{item.stockHoy}</td>
                    <td style={{ padding: '15px 0', fontWeight: 'bold', color: '#B89732' }}>{item.sugerido}</td>
                    <td style={{ padding: '15px 0' }}>
                      <span style={{ 
                        padding: '5px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {item.confianza}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;