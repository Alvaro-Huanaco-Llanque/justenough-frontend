import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

// Componente temporal para el Dashboard (luego lo haremos en su propio archivo)
function DashboardPlaceholder() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>¡Login Exitoso! 🎉</h1>
      <p>Acá irá el panel principal (Dashboard) que diseñaron en Figma.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;