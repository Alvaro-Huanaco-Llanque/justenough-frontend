import simbolo from '../assets/marca/logo.png';

// Logo de Just Enough: el símbolo naranja dentro del círculo crema.
// "tamano" = diámetro del círculo en píxeles.
export function Logo({ tamano = 40 }) {
  return (
    <div style={{ width: tamano, height: tamano, borderRadius: '50%', backgroundColor: '#FCF8EC', boxShadow: '0 2px 6px rgba(184, 151, 50, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={simbolo} alt="Just Enough" style={{ width: '68%', height: 'auto', display: 'block' }} />
    </div>
  );
}

// Mensaje para cuando una lista está vacía
export function MensajeVacio({ children }) {
  return <div>{children}</div>;
}
