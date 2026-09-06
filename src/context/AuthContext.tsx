import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService, LoginCredentials } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionExpiring: boolean;
  sessionExpiresIn: number | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  extendSession: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_WARNING_MS = 5 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 10 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpiring, setSessionExpiring] = useState<boolean>(false);
  const [sessionExpiresIn, setSessionExpiresIn] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    const checkSessionExpiry = () => {
      if (!sessionStartTime || !token) return;
      const now = Date.now();
      const remaining = SESSION_TIMEOUT_MS - (now - sessionStartTime);

      if (remaining <= 0) {
        handleLogout();
      } else if (remaining <= SESSION_WARNING_MS) {
        setSessionExpiring(true);
        setSessionExpiresIn(Math.ceil(remaining / 1000));
      } else {
        setSessionExpiring(false);
        setSessionExpiresIn(null);
      }
    };

    const interval = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionStartTime, token]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
      setSessionStartTime(null);
      setSessionExpiring(false);
      setSessionExpiresIn(null);
      localStorage.removeItem('ictims_auth_token');
      localStorage.removeItem('ictims_auth_user');
      localStorage.removeItem('ictims_session_start');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ictims_auth_token');
      const storedUser = localStorage.getItem('ictims_auth_user');
      const storedSessionStart = localStorage.getItem('ictims_session_start');

      if (storedToken && storedUser && storedSessionStart) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const sessionStart = parseInt(storedSessionStart, 10);
          const now = Date.now();

          if (now - sessionStart < SESSION_TIMEOUT_MS) {
            setToken(storedToken);
            setUser(parsedUser);
            setSessionStartTime(sessionStart);
            
            try {
              const response = await authService.getUser();
              if (response.success && response.data) {
                setUser(response.data);
                localStorage.setItem('ictims_auth_user', JSON.stringify(response.data));
              }
            } catch (error) {
              console.error('Failed to refresh user data:', error);
            }
          } else {
            await authService.logout();
          }
        } catch (e) {
          await authService.logout();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        const now = Date.now();
        setToken(response.data.token);
        setUser(response.data.user);
        setSessionStartTime(now);
        setSessionExpiring(false);
        setSessionExpiresIn(null);
        return;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = handleLogout;

  const extendSession = useCallback(() => {
    if (token && user) {
      const now = Date.now();
      setSessionStartTime(now);
      setSessionExpiring(false);
      setSessionExpiresIn(null);
      localStorage.setItem('ictims_session_start', now.toString());
    }
  }, [token, user]);

  const refreshUser = async () => {
    try {
      const response = await authService.getUser();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('ictims_auth_user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        sessionExpiring,
        sessionExpiresIn,
        login,
        logout,
        extendSession,
        refreshUser,
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
