import React from 'react';

function Footer() {
  return (
    <footer 
      className="py-3 border-top"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb'
      }}
    >
      <div className="container-fluid px-4">
        <div className="text-center">
          <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
            © 2025 LANturn - Network Management System
          </small>
          <div style={{ marginTop: '6px' }}>
            <small style={{ color: '#6b7280', fontSize: '0.78rem' }}>
              Developed by{' '}
              <a href="https://github.com/Stellar2703" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Shashwath V R
              </a>
              {' '}and{' '}
              <a href="https://github.com/abby-ra" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Abinaya R
              </a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
