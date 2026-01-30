import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  const checkAuth = useCallback(async () => {
    try {
      // Check for guest mode first
      const guestMode = localStorage.getItem('oracleiq_guest_mode');
      if (guestMode === 'true') {
        setUser({ id: 'guest', name: 'Guest User', email: 'guest@oracleiqtrader.com', isGuest: true });
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle OAuth callback
  const handleAuthCallback = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/session`, {
        session_id: sessionId
      }, {
        withCredentials: true
      });
      
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response.data.user;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  };

  // Login with Google - for self-hosted, use guest mode
  const loginWithGoogle = () => {
    // For self-hosted deployment, use guest mode
    localStorage.setItem('oracleiq_guest_mode', 'true');
    setUser({ id: 'guest', name: 'Guest User', email: 'guest@oracleiqtrader.com', isGuest: true });
    setIsAuthenticated(true);
  };

  // Guest login
  const loginAsGuest = () => {
    localStorage.setItem('oracleiq_guest_mode', 'true');
    setUser({ id: 'guest', name: 'Guest User', email: 'guest@oracleiqtrader.com', isGuest: true });
    setIsAuthenticated(true);
  };

  // Logout
  const logout = async () => {
    try {
      localStorage.removeItem('oracleiq_guest_mode');
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    loginWithGoogle,
    loginAsGuest,
    logout,
    handleAuthCallback,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
