import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';

const KioskControlModal = ({ show, onHide, machine, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [kioskConfig, setKioskConfig] = useState({
    url: 'https://www.google.com',
    password: '',
    action: 'start'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKioskConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const executeKioskAction = async (action) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = `/api/machines/${machine.id}/kiosk/${action}`;
      
      const requestBody = {
        password: kioskConfig.password
      };
      
      // Add URL only for start action
      if (action === 'start') {
        requestBody.url = kioskConfig.url;
      }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Kiosk ${action} command sent successfully to ${machine.name}!`);
        if (onSuccess) onSuccess();
        
        // Auto-close modal after success
        setTimeout(() => {
          onHide();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || `Failed to ${action} kiosk mode`);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeKioskAction(kioskConfig.action);
  };

  const getPresetUrls = () => [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'Dashboard', url: 'http://localhost:3000' },
    { name: 'Chrome New Tab', url: 'chrome://newtab/' },
    { name: 'Local Server', url: 'http://192.168.1.100' }
  ];

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-desktop me-2"></i>
          Kiosk Mode Control - {machine?.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-3">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Action Selection */}
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-cog me-2"></i>
              Action
            </Form.Label>
            <Form.Select
              name="action"
              value={kioskConfig.action}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="start">Start Kiosk Mode</option>
              <option value="stop">Stop Kiosk Mode</option>
            </Form.Select>
          </Form.Group>

          {/* URL Configuration (only for start action) */}
          {kioskConfig.action === 'start' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-link me-2"></i>
                  Kiosk URL
                </Form.Label>
                <Form.Control
                  type="url"
                  name="url"
                  value={kioskConfig.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  disabled={isLoading}
                  required
                />
                <Form.Text className="text-muted">
                  The website that will be displayed in kiosk mode
                </Form.Text>
              </Form.Group>

              {/* Preset URLs */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-star me-2"></i>
                  Quick Presets
                </Form.Label>
                <Row>
                  {getPresetUrls().map((preset, index) => (
                    <Col xs={6} md={4} key={index} className="mb-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => setKioskConfig(prev => ({
                          ...prev,
                          url: preset.url
                        }))}
                        disabled={isLoading}
                      >
                        {preset.name}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Form.Group>
            </>
          )}

          {/* Password Authentication */}
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-lock me-2"></i>
              Machine Password
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={kioskConfig.password}
              onChange={handleInputChange}
              placeholder="Enter machine password (optional if stored)"
              disabled={isLoading}
            />
            <Form.Text className="text-muted">
              Leave empty to use stored credentials
            </Form.Text>
          </Form.Group>

          {/* Machine Information */}
          <div className="bg-light p-3 rounded mb-3">
            <h6 className="mb-2">
              <i className="fas fa-info-circle me-2"></i>
              Target Machine Information
            </h6>
            <Row>
              <Col sm={6}>
                <small className="text-muted">Name:</small><br />
                <strong>{machine?.name}</strong>
              </Col>
              <Col sm={6}>
                <small className="text-muted">IP Address:</small><br />
                <strong>{machine?.ip_address}</strong>
              </Col>
            </Row>
          </div>

          {/* Action Description */}
          <div className="alert alert-info">
            <h6>
              <i className="fas fa-lightbulb me-2"></i>
              What this will do:
            </h6>
            {kioskConfig.action === 'start' ? (
              <ul className="mb-0">
                <li>Disable Windows key and Alt+Tab shortcuts</li>
                <li>Disable Task Manager access</li>
                <li>Start Google Chrome in fullscreen kiosk mode</li>
                <li>Navigate to the specified URL</li>
                <li>Lock the machine into kiosk mode</li>
              </ul>
            ) : (
              <ul className="mb-0">
                <li>Close all Chrome processes</li>
                <li>Re-enable Windows key and shortcuts</li>
                <li>Re-enable Task Manager access</li>
                <li>Restore normal desktop functionality</li>
              </ul>
            )}
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant={kioskConfig.action === 'start' ? 'success' : 'warning'}
          onClick={() => executeKioskAction(kioskConfig.action)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <i className={`fas ${kioskConfig.action === 'start' ? 'fa-play' : 'fa-stop'} me-2`}></i>
              {kioskConfig.action === 'start' ? 'Start' : 'Stop'} Kiosk Mode
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default KioskControlModal;