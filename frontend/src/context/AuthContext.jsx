import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('feedbackhub_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('feedbackhub_token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await authService.getCurrentUser();
          setUser(res.data);
          localStorage.setItem('feedbackhub_user', JSON.stringify(res.data));
        } catch (err) {
          // Token invalid or route not found
          console.warn('Auth token verification:', err.message);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('feedbackhub_token', authToken);
    localStorage.setItem('feedbackhub_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (e) {
      console.warn('Backend logout error:', e);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('feedbackhub_token');
      localStorage.removeItem('feedbackhub_user');
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
