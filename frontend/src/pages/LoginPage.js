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
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* Animated Background Elements */}
      <div 
        className="position-absolute"
        style={{
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05))',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
          filter: 'blur(40px)'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          bottom: '15%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse',
          filter: 'blur(30px)'
        }}
      ></div>
      <div 
        className="position-absolute"
        style={{
          top: '60%',
          left: '70%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(45deg, rgba(168, 85, 247, 0.08), rgba(139, 92, 246, 0.04))',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite',
          filter: 'blur(25px)'
        }}
      ></div>

      {/* Animated Grid Pattern */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      ></div>

      <Container className="position-relative">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="text-center mb-5" style={{ animation: 'slideInDown 1s ease-out' }}>
              <div 
                className="mx-auto mb-3 d-flex align-items-center justify-content-center position-relative"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '2rem',
                  boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
                  animation: 'logoSpin 2s ease-in-out infinite alternate'
                }}
              >
                <i className="fas fa-network-wired" style={{ animation: 'pulse 2s ease-in-out infinite' }}></i>
                
                {/* Orbiting dots */}
                <div 
                  className="position-absolute"
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#60a5fa',
                    borderRadius: '50%',
                    top: '-3px',
                    left: '50%',
                    transformOrigin: '0 43px',
                    animation: 'orbit 3s linear infinite'
                  }}
                ></div>
                <div 
                  className="position-absolute"
                  style={{
                    width: '4px',
                    height: '4px',
                    backgroundColor: '#a78bfa',
                    borderRadius: '50%',
                    top: '50%',
                    right: '-2px',
                    transformOrigin: '-43px 0',
                    animation: 'orbit 4s linear infinite reverse'
                  }}
                ></div>
              </div>
              <h1 
                className="mb-2" 
                style={{ 
                  fontWeight: '700', 
                  fontSize: '2.5rem',
                  animation: 'typewriter 2s steps(8) 0.5s forwards',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  width: '0',
                  margin: '0 auto',
                  color: '#60a5fa',
                  borderRight: '2px solid #3b82f6',
                  textShadow: '0 0 20px rgba(96, 165, 250, 0.5)'
                }}
              >
                LANturn
              </h1>
              <p 
                className="text-gray-400 mb-0" 
                style={{ 
                  fontSize: '1rem',
                  animation: 'fadeInUp 0.8s ease-out 1.5s both',
                  opacity: '0'
                }}
              >
                Network Management System
              </p>
            </div>

            <Card 
              className="border-0 shadow-2xl position-relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                animation: 'slideInUp 0.8s ease-out 0.3s both',
                transform: 'translateY(50px)',
                opacity: '0'
              }}
            >
              {/* Card shine effect */}
              <div 
                className="position-absolute w-100 h-100"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s ease-in-out infinite',
                  pointerEvents: 'none'
                }}
              ></div>

              <Card.Body className="p-5 position-relative">
                {error && (
                  <Alert 
                    variant="danger" 
                    className="mb-4 border-0 rounded-xl"
                    style={{ 
                      backgroundColor: '#fef2f2', 
                      color: '#dc2626',
                      animation: 'shake 0.5s ease-in-out'
                    }}
                  >
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group 
                    className="mb-4"
                    style={{ animation: 'fadeInLeft 0.6s ease-out 0.8s both', opacity: '0' }}
                  >
                    <Form.Label 
                      className="fw-semibold mb-2"
                      style={{ color: '#374151', fontSize: '0.9rem' }}
                    >
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={credentials.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      required
                      className="border-0 rounded-xl py-3"
                      style={{ 
                        fontSize: '1rem',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.3s ease'
                      }}
                      disabled={isLoading}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.06)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.06)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    />
                  </Form.Group>

                  <Form.Group 
                    className="mb-4"
                    style={{ animation: 'fadeInRight 0.6s ease-out 1s both', opacity: '0' }}
                  >
                    <Form.Label 
                      className="fw-semibold mb-2"
                      style={{ color: '#374151', fontSize: '0.9rem' }}
                    >
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      className="border-0 rounded-xl py-3"
                      style={{ 
                        fontSize: '1rem',
                        backgroundColor: '#f9fafb',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.3s ease'
                      }}
                      disabled={isLoading}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.06)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.06)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 border-0 rounded-xl py-3 fw-semibold position-relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      fontSize: '1rem',
                      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.3s ease',
                      animation: 'fadeInUp 0.6s ease-out 1.2s both',
                      opacity: '0'
                    }}
                    disabled={isLoading}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = 'translateY(-2px) scale(1.02)';
                        e.target.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = 'translateY(0) scale(1)';
                        e.target.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {/* Button ripple effect */}
                    <div 
                      className="position-absolute w-100 h-100 top-0 start-0"
                      style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                        animation: isLoading ? 'none' : 'buttonShimmer 2s ease-in-out infinite',
                        pointerEvents: 'none'
                      }}
                    ></div>
                    
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span style={{ animation: 'blink 1s linear infinite' }}>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <div 
                  className="text-center mt-4"
                  style={{ animation: 'fadeIn 0.6s ease-out 1.4s both', opacity: '0' }}
                >
                  <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    <i className="fas fa-info-circle me-1" style={{ animation: 'pulse 2s ease-in-out infinite' }}></i>
                    Default: <strong>admin</strong> / <strong>admin123</strong>
                  </small>
                </div>
              </Card.Body>
            </Card>

            <div 
              className="text-center mt-4"
              style={{ animation: 'fadeIn 0.6s ease-out 1.6s both', opacity: '0' }}
            >
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                <i className="fas fa-shield-alt me-1"></i>
                Secure • Reliable • Fast
              </small>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes logoSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(15deg); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes typewriter {
          from { width: 0; }
          to { width: 8ch; }
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes buttonShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.7; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;