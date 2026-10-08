import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  googleAuthUser,
  getCurrentUser,
  logoutUser,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state by checking the session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await getCurrentUser();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        // Not logged in or expired token; clean up state silently
        localStorage.removeItem('prepverse_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Standard Login
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginUser({ email, password });
      if (data.token) {
        localStorage.setItem('prepverse_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Standard Registration
  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await registerUser({ name, email, password });
      if (data.token) {
        localStorage.setItem('prepverse_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Exchange a Google Identity Services ID token for the PrepVerse session.
  const googleLogin = async (payload) => {
    setError(null);
    try {
      const data = await googleAuthUser(payload);
      if (data.token) {
        localStorage.setItem('prepverse_token', data.token);
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout network error, clearing client session anyway:', err.message);
    } finally {
      localStorage.removeItem('prepverse_token');
      setUser(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
