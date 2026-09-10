import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { onUnauthorized } from '../utils/authEvents';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('studyboard_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('studyboard_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studyboard_user');
    }
  }, [user]);

  // Keep React state in sync when the axios interceptor detects a rejected
  // token (401) — without this, the app could end up in a half-logged-out
  // state (token cleared but user object still "logged in" in memory),
  // which is what caused the confusing bounce between pages.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('studyboard_token', data.token);
      setUser({ id: data.userId, name: data.name, email: data.email });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('studyboard_token', data.token);
      setUser({ id: data.userId, name: data.name, email: data.email });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('studyboard_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}