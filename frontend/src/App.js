import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ClusterPage from './pages/ClusterPage';
import SystemsPage from './pages/SystemsPage';
import './styles/App.css';


function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ClusterPage />} />
          <Route path="/systems" element={<SystemsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
