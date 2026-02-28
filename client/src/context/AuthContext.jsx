import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('gopilot_token'));

  const fetchUser = useCallback(async () => {
    try {
      // Always try /me — works with session cookie (SSO) or JWT
      const res = await authApi.getMe();
      setUser(res.data);
      // If we got a user via session cookie but have no JWT, store one for API calls
      if (!token && res.data?.token) {
        localStorage.setItem('gopilot_token', res.data.token);
        setToken(res.data.token);
      }
    } catch {
      localStorage.removeItem('gopilot_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('gopilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('gopilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const registerParent = async (data) => {
    const res = await authApi.registerParent(data);
    localStorage.setItem('gopilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const loginWithGoogle = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const logout = () => {
    localStorage.removeItem('gopilot_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, registerParent, loginWithGoogle, logout, updateUser, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
