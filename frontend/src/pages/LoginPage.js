import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/enhanced-animations.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Call the onLogin callback to update app state
      onLogin(response.data.user, response.data.token);
      
      // Redirect to machines page
      navigate('/machines');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center particle-bg"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%)',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background elements */}
      <div 
        className="position-absolute"
        style={{
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      ></div>
      
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <Card className="shadow-lg border-0 rounded-4 glass-effect slide-in-modal">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center network-pulse glow-effect"
                    style={{
                      width: '100px',
                      height: '100px',
                      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '2.5rem',
                      boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <i className="fas fa-network-wired"></i>
                  </div>
                  <h2 className="text-dark mb-2 fw-bold gradient-text">LANtern</h2>
                  <p className="text-muted typewriter">Network Power Management System</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3 slide-in-modal">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="fas fa-user me-2 text-primary"></i>
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={credentials.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                      className="rounded-3 py-3 glass-effect"
                      style={{ 
                        fontSize: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="fas fa-lock me-2 text-primary"></i>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="rounded-3 py-3 glass-effect"
                      style={{ 
                        fontSize: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                      disabled={isLoading}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 rounded-3 py-3 fw-semibold btn-hover-effect ripple-effect morph-button"
                    style={{
                      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      borderColor: 'transparent',
                      fontSize: '1.1rem',
                      border: 'none'
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span className="data-stream">Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Default credentials: <strong>admin</strong> / <strong>admin123</strong>
                  </small>
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-3">
              <small className="text-light">
                <i className="fas fa-shield-alt me-1"></i>
                Secure Network Management • Version 2.0
              </small>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default LoginPage;