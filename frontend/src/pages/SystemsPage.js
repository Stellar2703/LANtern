import React, { useEffect, useState } from 'react';

function SystemPage() {
  const [systems, setSystems] = useState([]);

  useEffect(() => {
    const storedSystems = JSON.parse(localStorage.getItem('systems')) || [];
    setSystems(storedSystems);
  }, []);

  const handleDeleteSystem = (id) => {
    const updatedSystems = systems.filter((sys) => sys.id !== id);
    setSystems(updatedSystems);
    localStorage.setItem('systems', JSON.stringify(updatedSystems));
  };

  const handleWake = (system) => {
    console.log('Waking system:', system);
    // TODO: Backend wake API call
  };

  const handleShutdown = (system) => {
    console.log('Shutting down system:', system);
    // TODO: Backend shutdown API call
  };

  return (
    <div className="systems-page">
        <div className="w-full flex justify-center mb-6">
    <h2 className="text-5xl font-bold text-white text-center underline underline-offset-8 decoration-blue-500">
      Systems List
    </h2>
  </div>


      {systems.length === 0 ? (
        <div className="text-gray-400">No systems available. Add from Cluster Page.</div>
      ) : (
        <div className="cluster-list">
          {systems.map((system) => (
            <div key={system.id} className="cluster-item-row">
              <div className="cluster-name-box">
                <div>
                  <div className="text-lg font-semibold">{system.name}</div>
                  <div className="text-sm text-gray-400">
                    IP: {system.ip} | MAC: {system.mac}
                  </div>
                  <div className="text-sm text-gray-400">
                    Cluster: {system.cluster} | User: {system.username || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="system-count-box">
                <button className="btn-wake" onClick={() => handleWake(system)}>Wake</button>
                <span className="divider">|</span>
                <button className="btn-danger" onClick={() => handleShutdown(system)}>Shutdown</button>
                <span className="divider">|</span>
                <button className="btn-danger" onClick={() => handleDeleteSystem(system.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-placeholder" />
    </div>
  );
}

export default SystemPage;
