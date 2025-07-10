import React, { useState, useEffect } from 'react';
import type { User, AuthResponse, AuthContextType } from '../types';
import { authApi } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
  }

  export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const initAuth = async () => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          try {
            const userObj = JSON.parse(savedUser);
            setUser(userObj);

            const { user: currentUser } = await authApi.getProfile();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (error) {
            console.error('Failed to restore auth state:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        setLoading(false);
      };

      initAuth();
    }, []);

    const login = async (email: string, password: string) => {
      const response: AuthResponse = await authApi.login({ email, password });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    };

    const register = async (email: string, password: string, name: string) => {
      const response: AuthResponse = await authApi.register({ email, password, name });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    };

    const logout = async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    const value: AuthContextType = {
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };