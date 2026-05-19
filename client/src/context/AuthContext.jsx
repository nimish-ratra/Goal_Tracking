import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error(error);
    }
  };

  const azureLogin = async (accessToken, account) => {
    try {
      const res = await api.post('/auth/azure-sso', { accessToken, account });
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Azure SSO failed');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, azureLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
