import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'support';
  createdAt: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_USER_KEY = '@epharma_admin_user';
const ADMIN_TOKEN_KEY = '@epharma_admin_token';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:8085/api';

  // Load stored user on mount
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(ADMIN_USER_KEY),
        AsyncStorage.getItem(ADMIN_TOKEN_KEY),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Basic input checks
      if (password.length < 6) {
        throw new Error('Invalid credentials');
      }

      const mockUser: AdminUser = {
        id: Math.random().toString(36).substring(7),
        email,
        name: email.split('@')[0],
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      // Request a JWT from backend
      const resp = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: mockUser.email, role: 'admin', name: mockUser.name }),
      });
      if (!resp.ok) throw new Error(`Auth error ${resp.status}`);
      const data: any = await resp.json();
      const jwtToken = data?.token as string;
      if (!jwtToken) throw new Error('Failed to obtain token');

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(mockUser)),
        AsyncStorage.setItem(ADMIN_TOKEN_KEY, jwtToken),
      ]);

      setUser(mockUser);
      setToken(jwtToken);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: string = 'admin'
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (name.length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      const newUser: AdminUser = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        role: role as AdminUser['role'],
        createdAt: new Date().toISOString(),
      };

      // Request a JWT from backend
      const resp = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUser.email, role: 'admin', name: newUser.name }),
      });
      if (!resp.ok) throw new Error(`Auth error ${resp.status}`);
      const data: any = await resp.json();
      const jwtToken = data?.token as string;
      if (!jwtToken) throw new Error('Failed to obtain token');

      // Store credentials
      await Promise.all([
        AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(ADMIN_TOKEN_KEY, jwtToken),
      ]);

      setUser(newUser);
      setToken(jwtToken);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear stored data
      await Promise.all([
        AsyncStorage.removeItem(ADMIN_USER_KEY),
        AsyncStorage.removeItem(ADMIN_TOKEN_KEY),
      ]);

      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AdminAuthContextType = {
    user,
    loading,
    error,
    token,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
