import React from 'react';
import { Nav, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      path: '/machines',
      icon: 'fas fa-desktop',
      label: 'Machines',
      description: 'Manage network computers'
    },
    {
      path: '/clusters',
      icon: 'fas fa-layer-group',
      label: 'Clusters',
      description: 'Group management'
    }
  ];

  return (
    <div 
      className="d-flex flex-column h-100"
      style={{
        width: '280px',
        backgroundColor: '#1f2937',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* Logo Section */}
      <div className="p-4 border-bottom" style={{ borderColor: '#374151 !important' }}>
        <Link 
          to="/" 
          className="d-flex align-items-center text-decoration-none"
          style={{ color: 'white' }}
        >
          <div 
            className="d-flex align-items-center justify-content-center me-3"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '12px',
              fontSize: '1.2rem'
            }}
          >
            <i className="fas fa-network-wired"></i>
          </div>
          <div>
            <h4 className="mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>
              LANturn
            </h4>
            <small className="text-gray-400" style={{ fontSize: '0.75rem' }}>
              Network Management
            </small>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-grow-1 p-3">
        <div className="mb-4">
          <h6 className="text-gray-400 text-uppercase mb-3" style={{ 
            fontSize: '0.7rem', 
            fontWeight: '600',
            letterSpacing: '1px'
          }}>
            Navigation
          </h6>
          <Nav className="flex-column">
            {navigationItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`d-flex align-items-center p-3 mb-2 rounded-lg text-decoration-none ${
                  isActiveRoute(item.path) ? 'active-nav-item' : ''
                }`}
                style={{
                  color: isActiveRoute(item.path) ? '#3b82f6' : '#d1d5db',
                  backgroundColor: isActiveRoute(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: isActiveRoute(item.path) ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  if (!isActiveRoute(item.path)) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveRoute(item.path)) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#d1d5db';
                  }
                }}
              >
                <i 
                  className={`${item.icon} me-3`} 
                  style={{ 
                    fontSize: '1rem',
                    width: '20px',
                    textAlign: 'center',
                    color: isActiveRoute(item.path) ? '#3b82f6' : 'inherit'
                  }}
                ></i>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    {item.label}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: isActiveRoute(item.path) ? 'rgba(59, 130, 246, 0.7)' : '#9ca3af'
                  }}>
                    {item.description}
                  </div>
                </div>
              </Nav.Link>
            ))}
          </Nav>
        </div>
      </div>

      {/* User Section */}
      <div className="border-top" style={{ borderColor: '#374151 !important' }}>
        <Dropdown dropup>
          <Dropdown.Toggle 
            variant="link"
            className="d-flex align-items-center w-100 p-4 text-decoration-none border-0"
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '0.9rem'
            }}
          >
            <div 
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#374151',
                borderRadius: '50%',
                fontSize: '0.9rem'
              }}
            >
              <i className="fas fa-user"></i>
            </div>
            <div className="flex-grow-1 text-start">
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {user?.role || 'Administrator'}
              </div>
            </div>
            <i className="fas fa-chevron-up ms-2" style={{ fontSize: '0.75rem' }}></i>
          </Dropdown.Toggle>

          <Dropdown.Menu 
            className="w-100"
            style={{
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              marginBottom: '8px'
            }}
          >
            <Dropdown.Item 
              onClick={handleLogout} 
              className="d-flex align-items-center"
              style={{
                color: '#f3f4f6',
                backgroundColor: 'transparent',
                fontSize: '0.875rem'
              }}
            >
              <i className="fas fa-sign-out-alt me-2" style={{ fontSize: '0.75rem' }}></i>
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}

export default Sidebar;