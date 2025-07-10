import React from 'react';
import { useAuth } from '../hooks/useAuth';

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
    <nav className="nav-full-width">
      <div className="nav-container">
        <div className="nav-brand">
          <h1 onClick={() => onViewChange('events')} className="cursor-pointer hover:text-secondary-green transition-colors">
            EventBooker
          </h1>
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
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-200">Welcome, {user?.name}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                className={`nav-link ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => onViewChange('login')}
              >
                Login
              </button>
              <button
                className={`nav-link ${currentView === 'register' ? 'active' : ''}`}
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