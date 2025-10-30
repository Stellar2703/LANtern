import React, { useState, useEffect } from 'react';
import { Card, Button, Dropdown, ProgressBar } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const MachineCard = ({ machine, onAction, onEdit, onDelete, index }) => {
  const [machineStatus, setMachineStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cpuUsage] = useState(Math.floor(Math.random() * 100)); // Mock data
  const [memoryUsage] = useState(Math.floor(Math.random() * 100)); // Mock data
  const [lastSeen, setLastSeen] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastSeen(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handlePing = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/machines/${machine.id}/ping`);
      setMachineStatus(response.data);
    } catch (error) {
      console.error('Ping failed:', error);
      setMachineStatus({ isOnline: false, error: true });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        variant: 'warning',
        text: 'Checking...',
        icon: 'fas fa-spinner fa-spin',
        color: '#f59e0b'
      };
    }

    if (machineStatus) {
      return machineStatus.isOnline ? {
        variant: 'success',
        text: 'Online',
        icon: 'fas fa-circle',
        color: '#10b981'
      } : {
        variant: 'danger',
        text: 'Offline',
        icon: 'fas fa-circle',
        color: '#ef4444'
      };
    }

    // Default status based on machine.status
    switch (machine.status?.toLowerCase()) {
      case 'online':
        return {
          variant: 'success',
          text: 'Online',
          icon: 'fas fa-circle',
          color: '#10b981'
        };
      case 'offline':
        return {
          variant: 'danger',
          text: 'Offline',
          icon: 'fas fa-circle',
          color: '#ef4444'
        };
      default:
        return {
          variant: 'secondary',
          text: 'Unknown',
          icon: 'fas fa-question-circle',
          color: '#6b7280'
        };
    }
  };

  const status = getStatusInfo();

  return (
    <Card 
      style={{ 
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      className="h-100"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          color: 'white',
          padding: '1rem 1.25rem'
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="fas fa-server me-3" style={{ fontSize: '1.25rem', opacity: 0.9 }}></i>
            <div>
              <h6 className="mb-1" style={{ fontWeight: '600', fontSize: '1rem' }}>
                {machine.name}
              </h6>
              <small style={{ opacity: 0.85, fontSize: '0.8rem' }}>
                {machine.ip_address}
              </small>
            </div>
          </div>
          
          <div className="d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
            <i 
              className={status.icon} 
              style={{ 
                color: status.color, 
                marginRight: '0.375rem',
                fontSize: '0.625rem'
              }}
            ></i>
            <span style={{ fontWeight: '500' }}>{status.text}</span>
          </div>
        </div>
      </div>

      <Card.Body style={{ padding: '1.25rem' }}>
        {/* System Metrics */}
        <div className="mb-3">
          <div className="row g-3">
            <div className="col-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  <i className="fas fa-microchip me-1"></i>
                  CPU
                </small>
                <small style={{ fontWeight: '600', color: '#374151' }}>{cpuUsage}%</small>
              </div>
              <ProgressBar 
                now={cpuUsage} 
                style={{ 
                  height: '0.375rem', 
                  borderRadius: '0.25rem',
                  backgroundColor: '#f3f4f6'
                }}
              />
            </div>
            <div className="col-6">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  <i className="fas fa-memory me-1"></i>
                  RAM
                </small>
                <small style={{ fontWeight: '600', color: '#374151' }}>{memoryUsage}%</small>
              </div>
              <ProgressBar 
                now={memoryUsage} 
                style={{ 
                  height: '0.375rem', 
                  borderRadius: '0.25rem',
                  backgroundColor: '#f3f4f6'
                }}
              />
            </div>
          </div>
        </div>

        {/* Machine Details */}
        <div className="mb-3">
          <div 
            style={{ 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              padding: '0.75rem',
              border: '1px solid #f3f4f6'
            }}
          >
            <div className="row g-2">
              <div className="col-12">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-network-wired me-2" style={{ color: '#6b7280', fontSize: '0.75rem' }}></i>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>MAC:</small>
                  <code 
                    style={{ 
                      backgroundColor: '#e5e7eb',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.6875rem',
                      marginLeft: '0.5rem'
                    }}
                  >
                    {machine.mac_address}
                  </code>
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <i className="fas fa-user me-2" style={{ color: '#6b7280', fontSize: '0.75rem' }}></i>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>User:</small>
                  <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem', fontWeight: '500' }}>
                    {machine.username || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <i className="fas fa-clock me-2" style={{ color: '#6b7280', fontSize: '0.75rem' }}></i>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Last seen:</small>
                  <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem', fontWeight: '500' }}>
                    {lastSeen.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="outline-primary"
              onClick={handlePing}
              disabled={isLoading}
              style={{ 
                borderRadius: '0.375rem', 
                fontSize: '0.75rem',
                padding: '0.375rem 0.75rem',
                border: '1px solid #d1d5db'
              }}
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-satellite-dish'} me-1`}></i>
              {isLoading ? 'Pinging...' : 'Ping'}
            </Button>

            <Button
              size="sm"
              style={{ 
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '0.375rem', 
                fontSize: '0.75rem',
                padding: '0.375rem 0.75rem'
              }}
              onClick={() => onAction(machine.id, 'wake')}
            >
              <i className="fas fa-power-off me-1"></i>
              Wake
            </Button>
          </div>

          <Dropdown>
            <Dropdown.Toggle 
              size="sm" 
              variant="outline-secondary"
              style={{ 
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                padding: '0.375rem 0.5rem',
                border: '1px solid #d1d5db'
              }}
            >
              <i className="fas fa-ellipsis-v"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onEdit(machine)}>
                <i className="fas fa-edit me-2"></i>
                Edit
              </Dropdown.Item>
              <Dropdown.Item onClick={() => onAction(machine.id, 'restart')}>
                <i className="fas fa-redo me-2"></i>
                Restart
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => onAction(machine.id, 'shutdown')}
                className="text-warning"
              >
                <i className="fas fa-stop me-2"></i>
                Shutdown
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item 
                onClick={() => onDelete(machine.id)}
                className="text-danger"
              >
                <i className="fas fa-trash me-2"></i>
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MachineCard;