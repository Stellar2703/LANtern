import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Set base URL for API requests
axios.defaults.baseURL = 'http://localhost:5001/api';

function App() {
  return (
    <Router>
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">WoL Manager</Link>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Systems</Link>
            <Link to="/logs" className="nav-link">Logs</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<SystemsPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function SystemsPage() {
  const [systems, setSystems] = useState([]);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSystem, setNewSystem] = useState({
    name: '',
    mac_address: '',
    ip_address: '',
    subnet_mask: '',
    broadcast_address: '',
    port: 9,
    description: ''
  });

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/systems');
      setSystems(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSystemSelect = (id) => {
    setSelectedSystems(prev => 
      prev.includes(id) 
        ? prev.filter(systemId => systemId !== id) 
        : [...prev, id]
    );
  };

  const wakeSystem = async (id) => {
    try {
      await axios.post(`/systems/wake/${id}`);
      alert('Wake-on-LAN packet sent successfully!');
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const wakeSelectedSystems = async () => {
    if (selectedSystems.length === 0) {
      alert('Please select at least one system');
      return;
    }

    try {
      const response = await axios.post('/systems/wake', { systemIds: selectedSystems });
      alert(response.data.message);
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleAddSystem = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/systems', newSystem);
      setShowAddForm(false);
      setNewSystem({
        name: '',
        mac_address: '',
        ip_address: '',
        subnet_mask: '',
        broadcast_address: '',
        port: 9,
        description: ''
      });
      fetchSystems();
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSystem(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="action-bar">
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add System'}
        </button>
        <button 
          onClick={wakeSelectedSystems}
          disabled={selectedSystems.length === 0}
          className="btn btn-success"
        >
          Wake Selected ({selectedSystems.length})
        </button>
      </div>

      {showAddForm && (
        <div className="card add-system-form">
          <h3>Add New System</h3>
          <form onSubmit={handleAddSystem}>
            <div className="form-group">
              <label>Name*</label>
              <input
                type="text"
                name="name"
                value={newSystem.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>MAC Address* (00:1A:2B:3C:4D:5E)</label>
              <input
                type="text"
                name="mac_address"
                value={newSystem.mac_address}
                onChange={handleInputChange}
                pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                required
              />
            </div>
            <div className="form-group">
              <label>IP Address</label>
              <input
                type="text"
                name="ip_address"
                value={newSystem.ip_address}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Subnet Mask</label>
              <input
                type="text"
                name="subnet_mask"
                value={newSystem.subnet_mask}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Broadcast Address</label>
              <input
                type="text"
                name="broadcast_address"
                value={newSystem.broadcast_address}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                name="port"
                value={newSystem.port}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newSystem.description}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
          </form>
        </div>
      )}

      <div className="systems-list">
        {systems.map(system => (
          <div key={system.id} className="card system-card">
            <div className="system-header">
              <input
                type="checkbox"
                checked={selectedSystems.includes(system.id)}
                onChange={() => handleSystemSelect(system.id)}
                className="system-checkbox"
              />
              <h3>{system.name}</h3>
              <button 
                onClick={() => wakeSystem(system.id)}
                className="btn btn-wake"
              >
                Wake
              </button>
            </div>
            <div className="system-details">
              <p><strong>MAC:</strong> {system.mac_address}</p>
              {system.ip_address && <p><strong>IP:</strong> {system.ip_address}</p>}
              {system.broadcast_address && <p><strong>Broadcast:</strong> {system.broadcast_address}</p>}
              {system.description && <p><strong>Description:</strong> {system.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/logs');
      setLogs(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Wake-on-LAN Logs</h2>
      <button onClick={fetchLogs} className="btn btn-refresh">Refresh</button>
      
      <table className="logs-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>System</th>
            <th>Triggered By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.system_name}</td>
              <td>{log.triggered_by}</td>
              <td>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;