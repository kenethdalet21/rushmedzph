import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Unified user type that can represent any role
export interface UnifiedUser {
  id: string;
  email: string;
  role: 'admin' | 'driver' | 'merchant' | 'user';
  // Admin fields
  name?: string;
  adminRole?: 'superadmin' | 'admin' | 'support';
  // Driver fields
  vehicleType?: 'motorcycle' | 'car' | 'van';
  licenseNumber?: string;
  // Merchant fields
  businessName?: string;
  ownerName?: string;
  businessType?: 'pharmacy' | 'clinic' | 'hospital';
  // User fields
  phone?: string;
  address?: string;
    token?: string;
}

interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  loading: boolean;
  error: string | null;
  switchingRoles: boolean;
  signIn: (email: string, password: string, role: UnifiedUser['role']) => Promise<void>;
  signUp: (data: Partial<UnifiedUser> & { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: () => Promise<void>;
  clearError: () => void;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

const STORAGE_KEY = '@epharma_unified_auth';

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingRoles, setSwitchingRoles] = useState(false);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Failed to load user from storage:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: UnifiedUser) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to save user to storage:', err);
      throw new Error('Failed to persist session');
    }
  };

  const signIn = async (email: string, password: string, role: UnifiedUser['role']) => {
    try {
      setError(null);
      setLoading(true);

      // Validate credentials
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // TODO: Replace with actual API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication - accept demo credentials for each role
      const demoCredentials: Record<string, { email: string; password: string }> = {
        admin: { email: 'admin@epharma.com', password: 'admin123' },
        driver: { email: 'driver@epharma.com', password: 'driver123' },
        merchant: { email: 'merchant@epharma.com', password: 'merchant123' },
        user: { email: 'user@epharma.com', password: 'user123' },
      };

      const demo = demoCredentials[role];
      if (email !== demo.email || password !== demo.password) {
        throw new Error('Invalid email or password');
      }

      // Create user object based on role
      let userData: UnifiedUser;
      switch (role) {
        case 'admin':
          userData = {
            id: `admin_${Date.now()}`,
            email,
            role: 'admin',
            name: 'Admin User',
            adminRole: 'admin',
            token: 'demo-admin-token',
          };
          break;
        case 'driver':
          userData = {
            id: `driver_${Date.now()}`,
            email,
            role: 'driver',
            name: 'Driver User',
            vehicleType: 'motorcycle',
            licenseNumber: 'DL123456',
          };
          break;
        case 'merchant':
          userData = {
            id: `merchant_${Date.now()}`,
            email,
            role: 'merchant',
            businessName: 'Sample Pharmacy',
            ownerName: 'Merchant User',
            licenseNumber: 'BL789012',
            businessType: 'pharmacy',
          };
          break;
        case 'user':
          userData = {
            id: `user_${Date.now()}`,
            email,
            role: 'user',
            name: 'Customer User',
            phone: '+63 912 345 6789',
            address: '123 Main St',
          };
          break;
      }

      await saveUserToStorage(userData);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: Partial<UnifiedUser> & { email: string; password: string }) => {
    try {
      setError(null);
      setLoading(true);

      // Validate required fields
      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }

      if (!data.role) {
        throw new Error('Role is required');
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user object
      const userData: UnifiedUser = {
        id: `${data.role}_${Date.now()}`,
        email: data.email,
        role: data.role,
        name: data.name,
        adminRole: data.adminRole,
        vehicleType: data.vehicleType,
        licenseNumber: data.licenseNumber,
        businessName: data.businessName,
        ownerName: data.ownerName,
        businessType: data.businessType,
        phone: data.phone,
        address: data.address,
      };

      await saveUserToStorage(userData);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Failed to sign out:', err);
      throw new Error('Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async () => {
    // Sign out and allow role selection again
    console.log('switchRole START - setting switchingRoles flag');
    setSwitchingRoles(true);
    try {
      console.log('switchRole: removing AsyncStorage');
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('switchRole: AsyncStorage removed, calling setUser(null)');
      setUser(null);
      setError(null);
      setLoading(false);
      console.log('switchRole: setUser(null) called');
      
      // Reset the flag after a brief delay to allow state updates to propagate
      setTimeout(() => {
        console.log('switchRole: resetting switchingRoles to false');
        setSwitchingRoles(false);
      }, 100);
    } catch (err) {
      console.error('Failed to switch role:', err);
      setSwitchingRoles(false);
      setLoading(false);
      throw new Error('Switch role failed');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <UnifiedAuthContext.Provider
      value={{
        user,
        loading,
        error,
        switchingRoles,
        signIn,
        signUp,
        signOut,
        switchRole,
        clearError,
      }}
    >
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
  }
  return context;
}
