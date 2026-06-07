import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

async function fetchMe() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const data = await fetchMe();
    setUser(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // If returning from OAuth callback, AuthCallback handles exchange; skip /me here.
    if (typeof window !== 'undefined' && window.location.hash?.includes('session_id=')) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    let active = true;
    const tasks = [];
    fetchMe().then((data) => {
      if (!active) return;
      tasks.push(setTimeout(() => setUser(data), 0));
      tasks.push(setTimeout(() => setLoading(false), 0));
    });
    return () => {
      active = false;
      tasks.forEach(clearTimeout);
    };
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (err) { console.warn('logout request failed', err); }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, checkAuth, logout }),
    [user, loading, checkAuth, logout]
  );

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
