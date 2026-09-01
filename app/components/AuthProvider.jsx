'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, getStoredToken, getStoredUser, setStoredAuth } from '../lib/api.client';

const DEFAULT_CUSTOMER = {
  id: 'guest-customer',
  name: 'Guest Customer',
  role: 'customer',
  email: 'customer@stores.local',
  permissions: ['home', 'catalog', 'checkout'],
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const savedToken = getStoredToken();
      const savedUser = getStoredUser();

      if (!savedToken) {
        const defaultCustomerToken = 'customer-demo-token';
        if (!savedUser || savedUser.role !== 'customer') {
          setStoredAuth(defaultCustomerToken, DEFAULT_CUSTOMER);
          setToken(defaultCustomerToken);
          setUser(DEFAULT_CUSTOMER);
        } else {
          setToken(defaultCustomerToken);
          setUser(savedUser);
        }
        setReady(true);
        return;
      }

      try {
        const data = await apiFetch('/auth/me', { method: 'GET' });
        setStoredAuth(savedToken, data.user);
        setToken(savedToken);
        setUser(data.user);
      } catch (err) {
        setStoredAuth(null, null);
        setToken(null);
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    init();
  }, []);

  const login = async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    setStoredAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setStoredAuth(null, null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return context;
}
