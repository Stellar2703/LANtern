import React from 'react';
import { Nav, Navbar, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function NavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="shadow-sm" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center" style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.25rem', textDecoration: 'none' }}>
          <div 
            className="d-flex align-items-center justify-content-center me-2"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem'
            }}
          >
            <i className="fas fa-network-wired"></i>
          </div>
          LANturn
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/machines" 
              className="px-3 py-2 mx-1 rounded-md d-flex align-items-center"
              style={{ 
                color: '#4b5563', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#4b5563';
              }}
            >
              <i className="fas fa-server me-2" style={{ fontSize: '0.75rem' }}></i>
              Machines
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/clusters" 
              className="px-3 py-2 mx-1 rounded-md d-flex align-items-center"
              style={{ 
                color: '#4b5563', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#4b5563';
              }}
            >
              <i className="fas fa-layer-group me-2" style={{ fontSize: '0.75rem' }}></i>
              Clusters
            </Nav.Link>
          </Nav>
          
          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="outline-secondary" 
                id="user-dropdown"
                className="d-flex align-items-center border-0"
                style={{
                  backgroundColor: 'transparent',
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.5rem 0.75rem'
                }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center me-2"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%',
                    color: '#6b7280',
                    fontSize: '0.75rem'
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
                {user?.username || 'User'}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item disabled className="text-muted">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-shield-alt me-2" style={{ fontSize: '0.75rem' }}></i>
                    <span style={{ fontSize: '0.75rem' }}>Role: {user?.role || 'Unknown'}</span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center">
                  <i className="fas fa-sign-out-alt me-2" style={{ fontSize: '0.75rem' }}></i>
                  <span style={{ fontSize: '0.875rem' }}>Logout</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;