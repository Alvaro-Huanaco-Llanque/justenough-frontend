import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { haySesion } from './api';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import Dashboard from './pages/Dashboard';
import ProducidoCompras from './pages/ProducidoCompras';
import Ventas from './pages/Ventas';
import Desechos from './pages/Desechos';
import Sugerencias from './pages/Sugerencias';
import Madurez from './pages/Madurez';
import Calendario from './pages/Calendario';
import Productos from './pages/Productos';
import Impacto from './pages/Impacto';
import VerificarEmail from './pages/VerificarEmail';
import Catalogo from './pages/Catalogo';

// Páginas que requieren haber iniciado sesión: sin token, vuelven al login
function Privada({ children }) {
  return haySesion() ? children : <Navigate to="/" replace />;
}

// Login y registro: si ya hay sesión, van directo al panel
function Publica({ children }) {
  return haySesion() ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Publica><Login /></Publica>} />
        <Route path="/registro" element={<Publica><Registro /></Publica>} />
        <Route path="/recuperar" element={<Publica><RecuperarPassword /></Publica>} />
        <Route path="/verificar" element={<VerificarEmail />} />
        <Route path="/dashboard" element={<Privada><Dashboard /></Privada>} />
        <Route path="/catalogo" element={<Privada><Catalogo /></Privada>} />
        <Route path="/producido" element={<Privada><ProducidoCompras /></Privada>} />
        <Route path="/ventas" element={<Privada><Ventas /></Privada>} />
        <Route path="/desechos" element={<Privada><Desechos /></Privada>} />
        <Route path="/sugerencias" element={<Privada><Sugerencias /></Privada>} />
        <Route path="/madurez" element={<Privada><Madurez /></Privada>} />
        <Route path="/calendario" element={<Privada><Calendario /></Privada>} />
        <Route path="/productos" element={<Privada><Productos /></Privada>} />
        <Route path="/impacto" element={<Privada><Impacto /></Privada>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
