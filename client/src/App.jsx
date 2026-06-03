import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Widget from './Widget';
import Dashboard from './Dashboard/Dashboard';
import Login from './Login';
import Register from './Register';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Widget />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/*" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
