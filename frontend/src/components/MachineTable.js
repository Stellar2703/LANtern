import React, { useState } from 'react';
import { Table, Button, Alert, Badge, Dropdown, DropdownButton, Spinner, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import './animations.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function MachineTable({ machines, onAction, onEdit, onDelete }) {
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [machineStatuses, setMachineStatuses] = useState({});
  const [pingInProgress, setPingInProgress] = useState({});
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealMachine, setRevealMachine] = useState(null);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [revealedData, setRevealedData] = useState(null);

  // Ping verification function
  const verifyMachineStatus = async (machine) => {
    setPingInProgress(prev => ({ ...prev, [machine.id]: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/machines/${machine.id}/ping`);
      const isOnline = response.data.isOnline;
      
      setMachineStatuses(prev => ({
        ...prev,
        [machine.id]: {
          isOnline,
          lastPing: new Date(),
          responseTime: response.data.responseTime || null
        }
      }));

      // Update machine status in database if different
      if ((isOnline && machine.is_active !== 1) || (!isOnline && machine.is_active !== 0)) {
        await axios.put(`${API_BASE_URL}/machines/${machine.id}`, {
          ...machine,
          is_active: isOnline ? 1 : 0
        });
      }
    } catch (error) {
      console.error('Ping failed:', error);
      setMachineStatuses(prev => ({
        ...prev,
        [machine.id]: {
          isOnline: false,
          lastPing: new Date(),
          responseTime: null,
          error: true
        }
      }));
    } finally {
      setPingInProgress(prev => ({ ...prev, [machine.id]: false }));
    }
  };

  const maskIp = (ip) => {
    if (!ip) return 'hidden';
    const parts = ip.split('.');
    if (parts.length !== 4) return 'hidden';
    return `***.***.***.${parts[3]}`;
  };

  const maskMac = (mac) => {
    if (!mac) return 'hidden';
    const parts = mac.split(':');
    if (parts.length < 6) return '••:••:••:••:••:••';
    return `${parts[0]}:${parts[1]}:XX:XX:XX:${parts[5]}`;
  };

  const maskUsername = (u) => {
    if (!u) return 'hidden';
    return u.length > 1 ? `${u[0]}***` : '***';
  };

  const openRevealModal = (machine) => {
    setRevealMachine(machine);
    setRevealedData(null);
    setRevealPassword('');
    setRevealError(null);
    setShowRevealModal(true);
  };

  const handleRevealSubmit = async () => {
    if (!revealMachine) return;
    setRevealLoading(true);
    setRevealError(null);
    try {
      const resp = await axios.post(`${API_BASE_URL}/machines/${revealMachine.id}/reveal`, { password: revealPassword });
      setRevealedData(resp.data);
    } catch (err) {
      console.error('Reveal failed', err);
      setRevealError(err.response?.data?.error || 'Reveal failed');
    } finally {
      setRevealLoading(false);
    }
  };

  // Removed auto-ping functionality - only ping when refresh button is clicked

  const handleMachineSelect = (machineId, isSelected) => {
    setSelectedMachines(prev =>
      isSelected
        ? [...prev, machineId]
        : prev.filter(id => id !== machineId)
    );
  };

  const getMachineStatus = (machine) => {
    const pingStatus = machineStatuses[machine.id];
    if (pingStatus) {
      return pingStatus.isOnline;
    }
    // Use database status if no ping has been performed
    return machine.is_active === 1;
  };

  const getStatusBadge = (machine) => {
    const isOnline = getMachineStatus(machine);
    const pingStatus = machineStatuses[machine.id];
    const isPinging = pingInProgress[machine.id];

    if (isPinging) {
      return (
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark px-3 py-2" style={{ 
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            <div className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '12px', height: '12px' }}></div>
            Checking...
          </span>
        </div>
      );
    }

    if (pingStatus?.error) {
      return (
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger px-3 py-2" style={{ 
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            <i className="fas fa-times-circle me-1"></i>
            Offline
          </span>
        </div>
      );
    }

    // Show if status is from ping or database
    const statusSource = pingStatus ? 'Live' : 'Last Known';
    
    return isOnline ? (
      <div className="d-flex align-items-center gap-2">
        <span className="badge bg-success px-3 py-2" style={{ 
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '500'
        }} title={pingStatus?.responseTime ? `${statusSource} - Response time: ${pingStatus.responseTime}ms` : `${statusSource} - Machine is online`}>
          <i className="fas fa-circle me-1" style={{ fontSize: '0.6rem' }}></i>
          Online
          {pingStatus?.responseTime && (
            <small className="ms-1">({pingStatus.responseTime}ms)</small>
          )}
        </span>
        {!pingStatus && (
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Last Known</small>
        )}
      </div>
    ) : (
      <div className="d-flex align-items-center gap-2">
        <span className="badge bg-secondary px-3 py-2" style={{ 
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '500'
        }} title={`${statusSource} - Machine is offline or unreachable`}>
          <i className="fas fa-circle me-1" style={{ fontSize: '0.6rem' }}></i>
          Offline
        </span>
        {!pingStatus && (
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Last Known</small>
        )}
      </div>
    );
  };

  return (
    <div className="machine-table-container">
      {selectedMachines.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h6 className="mb-3 text-blue-800 fw-semibold">
            <i className="fas fa-layer-group me-2"></i>
            Bulk Actions ({selectedMachines.length} selected)
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="success"
              size="sm"
              className="px-3 py-2"
              style={{ borderRadius: '8px', fontSize: '0.875rem' }}
              onClick={() => onAction(selectedMachines, 'wake')}
            >
              <i className="fas fa-power-off me-2"></i> 
              Start All
            </Button>
            <Button
              variant="warning"
              size="sm"
              className="px-3 py-2"
              style={{ borderRadius: '8px', fontSize: '0.875rem' }}
              onClick={() => onAction(selectedMachines, 'restart')}
            >
              <i className="fas fa-redo me-2"></i> 
              Restart All
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="px-3 py-2"
              style={{ borderRadius: '8px', fontSize: '0.875rem' }}
              onClick={() => onAction(selectedMachines, 'shutdown')}
            >
              <i className="fas fa-power-off me-2"></i> 
              Shutdown All
            </Button>
          </div>
        </div>
      )}

      <Table className="mb-0" style={{ fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ 
            backgroundColor: '#f8fafc', 
            borderBottom: '2px solid #e2e8f0',
          }}>
            <th style={{ 
              width: '50px', 
              padding: '16px 12px',
              borderRight: '1px solid #e2e8f0',
              verticalAlign: 'middle'
            }}>
              <div className="custom-checkbox">
                <input
                  type="checkbox"
                  id="select-all-machines"
                  className="curved-checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMachines(machines.map(m => m.id));
                    } else {
                      setSelectedMachines([]);
                    }
                  }}
                  checked={selectedMachines.length === machines.length && machines.length > 0}
                />
                <label htmlFor="select-all-machines" className="checkbox-label"></label>
              </div>
            </th>
            <th style={{ 
              padding: '16px',
              borderRight: '1px solid #e2e8f0',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.875rem'
            }}>
              <i className="fas fa-desktop me-2 text-blue-600"></i>Machine
            </th>
            <th style={{ 
              padding: '16px',
              borderRight: '1px solid #e2e8f0',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.875rem'
            }}>
              <i className="fas fa-network-wired me-2 text-green-600"></i>Network
            </th>
            <th style={{ 
              padding: '16px',
              borderRight: '1px solid #e2e8f0',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.875rem'
            }}>
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-signal me-1 text-purple-600"></i>Status
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-decoration-none"
                  onClick={() => {
                    machines.forEach(machine => verifyMachineStatus(machine));
                  }}
                  disabled={Object.values(pingInProgress).some(Boolean)}
                  title="Refresh all machine statuses"
                  style={{ fontSize: '0.75rem', color: '#6b7280' }}
                >
                  {Object.values(pingInProgress).some(Boolean) ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="fas fa-sync-alt"></i>
                  )}
                </Button>
              </div>
            </th>
            <th style={{ 
              padding: '16px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.875rem',
              width: '150px'
            }}>
              <i className="fas fa-cogs me-2 text-orange-600"></i>Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine, index) => (
            <tr 
              key={machine.id} 
              className="table-row" 
              style={{
                animationDelay: `${index * 0.1}s`,
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <td style={{ 
                padding: '16px 12px',
                borderRight: '1px solid #f1f5f9',
                verticalAlign: 'middle'
              }}>
                <div className="custom-checkbox">
                  <input
                    type="checkbox"
                    id={`machine-${machine.id}`}
                    className="curved-checkbox"
                    onChange={e => handleMachineSelect(machine.id, e.target.checked)}
                    checked={selectedMachines.includes(machine.id)}
                  />
                  <label htmlFor={`machine-${machine.id}`} className="checkbox-label"></label>
                </div>
              </td>
              <td style={{ 
                padding: '16px',
                borderRight: '1px solid #f1f5f9',
                verticalAlign: 'middle'
              }}>
                <div className="d-flex flex-column">
                  <span className="fw-semibold text-gray-900 mb-1" style={{ fontSize: '0.9rem' }}>
                    {machine.name}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    <i className="fas fa-user me-1"></i>
                    {maskUsername(machine.username)}
                  </span>
                </div>
              </td>
              <td style={{ 
                padding: '16px',
                borderRight: '1px solid #f1f5f9',
                verticalAlign: 'middle'
              }}>
                <div className="d-flex flex-column">
                  <code className="bg-gray-100 px-2 py-1 rounded text-dark mb-1" style={{ fontSize: '0.8rem' }}>
                    {maskIp(machine.ip_address)}
                  </code>
                  <code className="bg-gray-50 px-2 py-1 rounded text-muted" style={{ fontSize: '0.75rem' }}>
                    {maskMac(machine.mac_address)}
                  </code>
                  <div className="mt-2">
                    <Button variant="link" size="sm" onClick={() => openRevealModal(machine)} style={{ padding: 0 }}>
                      <i className="fas fa-eye me-1"></i>Reveal
                    </Button>
                  </div>
                </div>
              </td>
              <td style={{ 
                padding: '16px',
                borderRight: '1px solid #f1f5f9',
                verticalAlign: 'middle'
              }}>
                {getStatusBadge(machine)}
              </td>
              <td style={{ 
                padding: '16px',
                verticalAlign: 'middle'
              }}>
                <DropdownButton
                  id={`machine-actions-${machine.id}`}
                  title={
                    <span style={{ fontSize: '0.875rem' }}>
                      <i className="fas fa-ellipsis-h me-1"></i>
                    </span>
                  }
                  variant="outline-secondary"
                  size="sm"
                  style={{ 
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <Dropdown.Item 
                    onClick={() => onAction([machine.id], 'wake')}
                    className="text-success"
                  >
                    <i className="fas fa-play me-2"></i>Start
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => onAction([machine.id], 'shutdown')}
                    className="text-danger"
                  >
                    <i className="fas fa-power-off me-2"></i>Shutdown
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => onAction([machine.id], 'restart')}
                    className="text-warning"
                  >
                    <i className="fas fa-redo me-2"></i>Restart
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={() => onEdit(machine)}
                    className="text-info"
                  >
                    <i className="fas fa-edit me-2"></i>Edit
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => openRevealModal(machine)} className="text-secondary">
                    <i className="fas fa-eye me-2"></i>Reveal Sensitive
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={() => onDelete(machine.id)}
                    className="text-danger"
                  >
                    <i className="fas fa-trash me-2"></i>Delete
                  </Dropdown.Item>
                </DropdownButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {machines.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <i className="fas fa-desktop" style={{ 
              fontSize: '4rem', 
              color: '#cbd5e1' 
            }}></i>
          </div>
          <h5 className="text-gray-600 mb-2">No machines found</h5>
          <p className="text-gray-500 mb-0" style={{ fontSize: '0.9rem' }}>
            Add your first machine to start managing your network
          </p>
        </div>
      )}
      {/* Reveal Modal */}
      <Modal show={showRevealModal} onHide={() => setShowRevealModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reveal Sensitive Details {revealMachine ? `- ${revealMachine.name}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {revealError && (
            <Alert variant="danger">{revealError}</Alert>
          )}

          {!revealedData && (
            <Form.Group>
              <Form.Label>Enter reveal password</Form.Label>
              <Form.Control
                type="password"
                value={revealPassword}
                onChange={(e) => setRevealPassword(e.target.value)}
                placeholder="Password"
                autoFocus
              />
            </Form.Group>
          )}

          {revealedData && (
            <div>
              <h6 className="mb-2">Connection Details</h6>
              <div className="mb-2">
                <strong>IP:</strong>
                <div className="mt-1"><code className="p-2 bg-gray-100 rounded">{revealedData.ip_address}</code></div>
              </div>
              <div className="mb-2">
                <strong>MAC:</strong>
                <div className="mt-1"><code className="p-2 bg-gray-100 rounded">{revealedData.mac_address}</code></div>
              </div>
              <div className="mb-2">
                <strong>Username:</strong>
                <div className="mt-1"><code className="p-2 bg-gray-100 rounded">{revealedData.username}</code></div>
              </div>
              <div className="mb-2">
                <strong>Stored credential (hashed):</strong>
                <div className="mt-1"><code className="p-2 bg-gray-100 rounded">{revealedData.encrypted_password}</code></div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevealModal(false)}>
            Close
          </Button>
          {!revealedData && (
            <Button variant="primary" onClick={handleRevealSubmit} disabled={revealLoading || !revealPassword}>
              {revealLoading ? <Spinner animation="border" size="sm" /> : 'Reveal'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MachineTable;