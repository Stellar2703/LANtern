import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Alert, Spinner, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MachineTable from '../components/MachineTable';
import ClusterManager from '../components/ClusterManager';
import '../components/enhanced-animations.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [action, setAction] = useState('');
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMachine, setNewMachine] = useState({
    name: '',
    mac_address: '',
    ip_address: '',
    subnet_mask: '255.255.255.0',
    broadcast_address: '',
    username: '',
    password: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/machines`);
      setMachines(response.data);
    } catch (err) {
      showAlert('Failed to fetch machines', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = async () => {
    if (!newMachine.name.trim()) {
      showAlert('Please enter a machine name', 'danger');
      return;
    }
    if (!newMachine.mac_address.trim()) {
      showAlert('Please enter a MAC address', 'danger');
      return;
    }
    if (!newMachine.ip_address.trim()) {
      showAlert('Please enter an IP address', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Adding machine:', newMachine);
      await axios.post(`${API_BASE_URL}/machines`, newMachine);
      setShowAddModal(false);
      setNewMachine({
        name: '',
        mac_address: '',
        ip_address: '',
        subnet_mask: '255.255.255.0',
        broadcast_address: '',
        username: '',
        password: ''
      });
      fetchMachines();
      showAlert('Machine added successfully! 🎉', 'success');
    } catch (err) {
      console.error('Add machine error:', err);
      showAlert('Failed to add machine. Please try again.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMachineAction = async (machineIds, actionType) => {
    setSelectedMachines(machineIds);
    setAction(actionType);
    // Directly confirm action without password modal
    confirmAction(machineIds, actionType);
  };

  const confirmAction = async (machineIds, actionType) => {
    try {
      await axios.post(`${API_BASE_URL}/machines/cluster-action`, {
        machineIds,
        action: actionType,
        initiated_by: 'admin'
      });
      showAlert(`${actionType} command sent successfully`, 'success');
    } catch (err) {
      showAlert(`Failed to perform ${actionType}`, 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  const handleEditMachine = (machine) => {
    setEditingMachine(machine);
    setNewMachine({
      name: machine.name,
      mac_address: machine.mac_address,
      ip_address: machine.ip_address,
      subnet_mask: machine.subnet_mask,
      broadcast_address: machine.broadcast_address,
      username: machine.username,
      password: machine.encrypted_password || machine.password || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateMachine = async () => {
    if (!newMachine.name.trim()) {
      showAlert('Please enter a machine name', 'danger');
      return;
    }
    if (!newMachine.mac_address.trim()) {
      showAlert('Please enter a MAC address', 'danger');
      return;
    }
    if (!newMachine.ip_address.trim()) {
      showAlert('Please enter an IP address', 'danger');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Updating machine:', editingMachine.id, newMachine);
      await axios.put(`${API_BASE_URL}/machines/${editingMachine.id}`, newMachine);
      setShowEditModal(false);
      setEditingMachine(null);
      setNewMachine({
        name: '',
        mac_address: '',
        ip_address: '',
        subnet_mask: '255.255.255.0',
        broadcast_address: '',
        username: '',
        password: ''
      });
      fetchMachines();
      showAlert('Machine updated successfully! ✨', 'success');
    } catch (err) {
      console.error('Update machine error:', err);
      showAlert('Failed to update machine. Please try again.', 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (window.confirm('⚠️ Are you sure you want to delete this machine? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/machines/${machineId}`);
        fetchMachines();
        showAlert('Machine deleted successfully! 🗑️', 'success');
      } catch (err) {
        console.error('Delete machine error:', err);
        showAlert('Failed to delete machine. Please try again.', 'danger');
      }
    }
  };

  // Filter machines based on search term
  const filteredMachines = machines.filter(machine => 
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.mac_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1" style={{ color: '#1f2937', fontWeight: '600' }}>
              Machine Management
            </h1>
            
          </div>
          <div className="d-flex gap-2">
            <Button 
              onClick={() => setShowAddModal(true)} 
              className="d-flex align-items-center gap-2"
              style={{ 
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-plus" style={{ fontSize: '0.75rem' }}></i>
              Add Machine
            </Button>
            <Button 
              onClick={() => setShowClusterModal(true)} 
              variant="outline-primary"
              className="d-flex align-items-center gap-2"
              style={{ 
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-layer-group" style={{ fontSize: '0.75rem' }}></i>
              Manage Clusters
            </Button>
          </div>
        </div>

        {/* Alert Section */}
        {alert.show && (
          <Alert 
            variant={alert.variant} 
            onClose={() => setAlert({ ...alert, show: false })} 
            dismissible
            className="mb-3"
            style={{
              backgroundColor: alert.variant === 'success' ? '#dcfce7' : '#fee2e2',
              border: `1px solid ${alert.variant === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: alert.variant === 'success' ? '#166534' : '#991b1b',
              borderRadius: '0.5rem'
            }}
          >
            <i className={`fas ${alert.variant === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
            {alert.message}
          </Alert>
        )}

        {/* Stats and Search */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 style={{ color: '#374151', fontWeight: '600', marginBottom: '0.25rem' }}>
              {filteredMachines.length} of {machines.length} Machine{machines.length !== 1 ? 's' : ''}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
              {machines.filter(m => m.is_active === 1).length} active, {' '}
              {machines.filter(m => m.is_active === 0).length} inactive
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <i className="fas fa-search position-absolute" 
                 style={{ 
                   left: '12px', 
                   top: '50%', 
                   transform: 'translateY(-50%)', 
                   color: '#6b7280',
                   fontSize: '0.875rem'
                 }}
              ></i>
              <Form.Control
                type="text"
                placeholder="Search machines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  width: '280px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-5" style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Loading machines...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-xl shadow-light overflow-hidden">
              <MachineTable 
                machines={filteredMachines} 
                onEdit={handleEditMachine}
                onDelete={handleDeleteMachine}
                onAction={handleMachineAction}
              />
            </div>
          </div>
        )}

        {/* Add Machine Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" className="fade">
        <Modal.Header closeButton className="gradient-bg">
          <Modal.Title>
            <i className="fas fa-plus-circle me-2"></i>
            Add New Machine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-tag me-2"></i>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.name}
                    onChange={e => setNewMachine({ ...newMachine, name: e.target.value })}
                    placeholder="Enter machine name"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-network-wired me-2"></i>MAC Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.mac_address}
                    onChange={e => setNewMachine({ ...newMachine, mac_address: e.target.value })}
                    placeholder="Enter MAC address"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-broadcast-tower me-2"></i>Broadcast Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.broadcast_address}
                    onChange={e => setNewMachine({ ...newMachine, broadcast_address: e.target.value })}
                    placeholder="Enter broadcast address"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-user me-2"></i>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.username}
                    onChange={e => setNewMachine({ ...newMachine, username: e.target.value })}
                    placeholder="Enter username"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label><i className="fas fa-lock me-2"></i>Password</Form.Label>
              <Form.Control
                type="password"
                value={newMachine.password}
                onChange={e => setNewMachine({ ...newMachine, password: e.target.value })}
                placeholder="Enter password"
                className="shadow-sm"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowAddModal(false)} className="btn-animated">
            <i className="fas fa-times me-2"></i>Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMachine} 
            disabled={isLoading}
            className="btn-animated"
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                Adding...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>Save Machine
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Machine Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" className="fade">
        <Modal.Header closeButton className="gradient-bg">
          <Modal.Title>
            <i className="fas fa-edit me-2"></i>
            Edit Machine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-tag me-2"></i>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.name}
                    onChange={e => setNewMachine({ ...newMachine, name: e.target.value })}
                    placeholder="Enter machine name"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-network-wired me-2"></i>MAC Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.mac_address}
                    onChange={e => setNewMachine({ ...newMachine, mac_address: e.target.value })}
                    placeholder="Enter MAC address"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-globe me-2"></i>IP Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.ip_address}
                    onChange={e => setNewMachine({ ...newMachine, ip_address: e.target.value })}
                    placeholder="Enter IP address"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-mask me-2"></i>Subnet Mask</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.subnet_mask}
                    onChange={e => setNewMachine({ ...newMachine, subnet_mask: e.target.value })}
                    placeholder="Enter subnet mask"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-broadcast-tower me-2"></i>Broadcast Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.broadcast_address}
                    onChange={e => setNewMachine({ ...newMachine, broadcast_address: e.target.value })}
                    placeholder="Enter broadcast address"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label><i className="fas fa-user me-2"></i>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMachine.username}
                    onChange={e => setNewMachine({ ...newMachine, username: e.target.value })}
                    placeholder="Enter username"
                    className="shadow-sm"
                  />
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label><i className="fas fa-lock me-2"></i>Password</Form.Label>
              <Form.Control
                type="password"
                value={newMachine.password}
                onChange={e => setNewMachine({ ...newMachine, password: e.target.value })}
                placeholder="Enter password"
                className="shadow-sm"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="btn-animated">
            <i className="fas fa-times me-2"></i>Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateMachine} 
            disabled={isUpdating}
            className="btn-animated"
          >
            {isUpdating ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>Update Machine
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <ClusterManager
        show={showClusterModal}
        onHide={() => setShowClusterModal(false)}
        machines={machines}
        onClusterCreated={() => {
          setShowClusterModal(false);
          showAlert('Cluster created successfully! 🎉', 'success');
        }}
      />

      {/* Password Confirmation Modal removed. Actions are now direct. */}
      </Container>
    </div>
  );
}

export default MachinesPage;