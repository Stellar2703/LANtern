import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">WoL Manager</div>
      <div className="navbar-links">
        <Link to="/systems">Systems</Link>
        <Link to="/">Clusters</Link>
      </div>
    </nav>
  );
}

export default Navbar;
