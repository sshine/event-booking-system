import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onViewChange('events');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1 onClick={() => onViewChange('events')}>EventBooker</h1>
        </div>
        
        <div className="nav-links">
          <button 
            className={`nav-link ${currentView === 'events' ? 'active' : ''}`}
            onClick={() => onViewChange('events')}
          >
            Events
          </button>
          
          {isAuthenticated && (
            <button 
              className={`nav-link ${currentView === 'bookings' ? 'active' : ''}`}
              onClick={() => onViewChange('bookings')}
            >
              My Bookings
            </button>
          )}
        </div>
        
        <div className="nav-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">Welcome, {user?.name}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => onViewChange('login')}
              >
                Login
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => onViewChange('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};