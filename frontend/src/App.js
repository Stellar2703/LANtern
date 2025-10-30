import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import MachinesPage from './pages/MachinesPage';
import ClustersPage from './pages/ClustersPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './theme.css';
import './components/enhanced-animations.css';

function AppContent() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      {isAuthenticated() && <Sidebar />}
      
      {/* Main Content */}
      <div 
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: isAuthenticated() ? '280px' : '0',
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        <div className="flex-grow-1">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated() ? 
                  <Navigate to="/machines" replace /> : 
                  <LoginPage onLogin={login} />
              } 
            />
            <Route 
              path="/" 
              element={
                isAuthenticated() ? 
                  <Navigate to="/machines" replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/machines" 
              element={
                <ProtectedRoute>
                  <MachinesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clusters" 
              element={
                <ProtectedRoute>
                  <ClustersPage />
                </ProtectedRoute>
              } 
            />
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                <Navigate to={isAuthenticated() ? "/machines" : "/login"} replace />
              } 
            />
          </Routes>
        </div>
        
        {isAuthenticated() && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;