import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Widget from './Widget';
import Admin from './Admin';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Widget />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
