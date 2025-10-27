import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import MachinesPage from './pages/MachinesPage';
import ClustersPage from './pages/ClustersPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './theme.css';
import './components/enhanced-animations.css';

function AppContent() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {isAuthenticated() && <Navbar />}
      
      <div className="flex-grow">
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