'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, type User } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { pseudo: string; email: string; password: string; country?: string; city?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = api.getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await api.get<User>('/users/me');
      setUser(userData);
    } catch {
      setUser(null);
      api.clearTokens();
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
    api.setTokens(res.accessToken, res.refreshToken);
    await fetchUser();
  };

  const register = async (data: { pseudo: string; email: string; password: string; country?: string; city?: string; role?: string }) => {
    const res = await api.post<{ accessToken: string; refreshToken: string }>('/auth/register', data);
    api.setTokens(res.accessToken, res.refreshToken);
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    api.clearTokens();
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
