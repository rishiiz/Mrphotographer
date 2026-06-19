import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('mrphotographer_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to load user info', err);
      // If token expired or invalid, clear it
      api.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      await loadUser();
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleRegister = async (registerData) => {
    setLoading(true);
    try {
      const data = await api.register(registerData);
      await loadUser();
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      reloadProfile: loadUser
    }}>
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
