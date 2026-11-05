import { useEffect } from 'react';

// Pide confirmar una acción que no se puede deshacer, con el aspecto del sistema en vez del aviso del navegador.
// El foco arranca en Cancelar y Escape cierra: así un Enter de más no ejecuta nada por error.
function ModalConfirmar({ titulo, children, textoConfirmar, procesando, alCancelar, alConfirmar }) {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape' && !procesando) alCancelar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [procesando, alCancelar]);

  return (
    <div className="modal-fondo">
      <div className="modal-caja" role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo" aria-describedby="confirmar-detalle" style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FCE8E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🗑️</span>
          <h3 id="confirmar-titulo" style={{ fontSize: '1.3rem', margin: 0 }}>{titulo}</h3>
        </div>
        <p id="confirmar-detalle" style={{ color: '#666666', fontSize: '0.92rem', lineHeight: '1.5', margin: 0 }}>{children}</p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={alCancelar} disabled={procesando} autoFocus style={{ padding: '10px 20px', backgroundColor: '#FFFFFF', color: '#1A1A1A', border: '1px solid #EAE6DF', borderRadius: '8px', fontWeight: 'bold', cursor: procesando ? 'not-allowed' : 'pointer' }}>Cancelar</button>
          <button onClick={alConfirmar} disabled={procesando} style={{ padding: '10px 20px', backgroundColor: '#C5221F', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: procesando ? 'wait' : 'pointer', opacity: procesando ? 0.7 : 1 }}>
            {procesando ? 'Un momento...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmar;
