import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import Impacto from './pages/Impacto'; // <-- Importar Impacto

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/producido" element={<ProducidoCompras />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/desechos" element={<Desechos />} />
        <Route path="/sugerencias" element={<Sugerencias />} />
        <Route path="/madurez" element={<Madurez />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/impacto" element={<Impacto />} /> {/* <-- Añadir ruta */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;