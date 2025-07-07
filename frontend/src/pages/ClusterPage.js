import React, { useEffect, useState } from 'react';

function ClusterPage() {
  const [clusters, setClusters] = useState([]);
  const [systems, setSystems] = useState([]);
  const [newCluster, setNewCluster] = useState('');
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSystem, setNewSystem] = useState({
    name: '',
    mac: '',
    ip: '',
    username: '',
    password: '',
    cluster: '',
  });

  useEffect(() => {
    const storedClusters = JSON.parse(localStorage.getItem('clusters')) || [];
    const storedSystems = JSON.parse(localStorage.getItem('systems')) || [];
    setClusters(storedClusters);
    setSystems(storedSystems);
  }, []);

  const handleAddCluster = () => {
    if (!newCluster.trim()) return;
    const updatedClusters = [...clusters, newCluster];
    setClusters(updatedClusters);
    localStorage.setItem('clusters', JSON.stringify(updatedClusters));
    setNewCluster('');
  };

  const handleDeleteCluster = (clusterToDelete) => {
    const updatedClusters = clusters.filter(c => c !== clusterToDelete);
    const updatedSystems = systems.filter(sys => sys.cluster !== clusterToDelete);
    setClusters(updatedClusters);
    setSystems(updatedSystems);
    localStorage.setItem('clusters', JSON.stringify(updatedClusters));
    localStorage.setItem('systems', JSON.stringify(updatedSystems));
  };

  const getSystemCount = (clusterName) => {
    return systems.filter(sys => sys.cluster === clusterName).length;
  };

  const handleAddSystem = () => {
    if (!newSystem.name || !newSystem.mac || !newSystem.ip || !newSystem.cluster) return;
    const updatedSystems = [...systems, { ...newSystem, id: Date.now() }];
    setSystems(updatedSystems);
    localStorage.setItem('systems', JSON.stringify(updatedSystems));
    setShowAddForm(false);
    setNewSystem({
      name: '',
      mac: '',
      ip: '',
      username: '',
      password: '',
      cluster: ''
    });
  };

  const wakeSelected = () => {
    const selected = systems.filter(s => selectedSystems.includes(s.id));
    console.log('Wake:', selected);
    // backend wake logic here
  };

  const shutdownSelected = () => {
    const selected = systems.filter(s => selectedSystems.includes(s.id));
    console.log('Shutdown with credentials:', selected);
    // backend shutdown logic here
  };

  return (
    <div className="cluster-page">
      <div className="controls-row">
        <input
          type="text"
          placeholder="Enter cluster name"
          value={newCluster}
          onChange={(e) => setNewCluster(e.target.value)}
          className="search-box"
        />
        <button onClick={handleAddCluster} className="btn-primary">Add Cluster</button>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">Add System</button>
        <button onClick={wakeSelected} className="btn-wake">Wake Selected</button>
        <button onClick={shutdownSelected} className="btn-danger">Shutdown Selected</button>
      </div>

      <div className="cluster-list">
        {clusters.map((cluster, index) => (
          <div key={index} className="cluster-item-row">
            <div className="cluster-name-box">
              <span>{cluster}</span>
              <button
                onClick={() => handleDeleteCluster(cluster)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
            <div className="system-count-box">
              <span>No. of Systems</span>
              <span className="divider">|</span>
              <span>{getSystemCount(cluster)}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div style={{
            backgroundColor: '#1e1e1e',
            padding: '2rem',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New System</h3>
            <input
              type="text"
              placeholder="System Name"
              className="search-box"
              value={newSystem.name}
              onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="MAC Address"
              className="search-box"
              value={newSystem.mac}
              onChange={(e) => setNewSystem({ ...newSystem, mac: e.target.value })}
            />
            <input
              type="text"
              placeholder="IP Address"
              className="search-box"
              value={newSystem.ip}
              onChange={(e) => setNewSystem({ ...newSystem, ip: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username (for shutdown)"
              className="search-box"
              value={newSystem.username}
              onChange={(e) => setNewSystem({ ...newSystem, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password (for shutdown)"
              className="search-box"
              value={newSystem.password}
              onChange={(e) => setNewSystem({ ...newSystem, password: e.target.value })}
            />
            <select
              className="search-box"
              value={newSystem.cluster}
              onChange={(e) => setNewSystem({ ...newSystem, cluster: e.target.value })}
            >
              <option value="">Select Cluster</option>
              {clusters.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn-danger" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddSystem}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-placeholder" />
    </div>
  );
}

export default ClusterPage;