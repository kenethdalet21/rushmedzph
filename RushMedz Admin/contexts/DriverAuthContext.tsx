import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as OTPService from '../services/otp';

interface DriverUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  licenseNumber: string;
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface DriverAuthContextType {
  user: DriverUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, vehicleType: string, licenseNumber: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  sendOTP: (contactValue: string, contactType: 'email' | 'phone') => Promise<void>;
  verifyOTP: (contactValue: string, contactType: 'email' | 'phone', otpCode: string) => Promise<void>;
  resendOTP: (contactValue: string, contactType: 'email' | 'phone') => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

const DRIVER_USER_KEY = '@epharma_driver_user';
const DRIVER_TOKEN_KEY = '@epharma_driver_token';

export const DriverAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(DRIVER_USER_KEY),
        AsyncStorage.getItem(DRIVER_TOKEN_KEY),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (emailOrPhone: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!emailOrPhone || !password) {
        throw new Error('Email/Phone and password are required');
      }

      // Check if input is email or phone
      const isEmail = /^[A-Za-z0-9+_.-]+@(.+)$/.test(emailOrPhone);
      const isPhone = (() => {
        const cleaned = emailOrPhone.replace(/\D/g, '');
        return (
          (cleaned.startsWith('63') && cleaned.length === 12) ||
          (cleaned.startsWith('09') && cleaned.length === 11)
        );
      })();

      if (!isEmail && !isPhone) {
        throw new Error('Please enter a valid email address or Philippine phone number');
      }

      if (password.length < 6) {
        throw new Error('Invalid credentials');
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data with verification status
      const mockUser: DriverUser = {
        id: Math.random().toString(36).substring(7),
        email: isEmail ? emailOrPhone : 'driver@epharma.com',
        name: isEmail ? emailOrPhone.split('@')[0] : 'Driver',
        phone: isPhone ? emailOrPhone : '+1234567890',
        vehicleType: 'motorcycle',
        licenseNumber: 'DL123456',
        createdAt: new Date().toISOString(),
        emailVerified: isEmail, // Mark as verified if logging in with email
        phoneVerified: isPhone, // Mark as verified if logging in with phone
      };

      // Check if the login credential is verified
      const loginCredentialVerified = isEmail ? mockUser.emailVerified : mockUser.phoneVerified;
      
      if (!loginCredentialVerified) {
        throw new Error(
          isEmail 
            ? 'Your email address has not been verified. Please verify your email before logging in.'
            : 'Your phone number has not been verified. Please verify your phone number before logging in.'
        );
      }

      const mockToken = `token_${Math.random().toString(36).substring(7)}`;

      await Promise.all([
        AsyncStorage.setItem(DRIVER_USER_KEY, JSON.stringify(mockUser)),
        AsyncStorage.setItem(DRIVER_TOKEN_KEY, mockToken),
      ]);

      setUser(mockUser);
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
    phone: string,
    vehicleType: string,
    licenseNumber: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password || !name || !phone || !licenseNumber) {
        throw new Error('All fields are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (phone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newUser: DriverUser = {
        id: Math.random().toString(36).substring(7),
        email,
        name,
        phone,
        vehicleType: vehicleType as DriverUser['vehicleType'],
        licenseNumber,
        createdAt: new Date().toISOString(),
      };

      const mockToken = `token_${Math.random().toString(36).substring(7)}`;

      await Promise.all([
        AsyncStorage.setItem(DRIVER_USER_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(DRIVER_TOKEN_KEY, mockToken),
      ]);

      setUser(newUser);
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
      
      await Promise.all([
        AsyncStorage.removeItem(DRIVER_USER_KEY),
        AsyncStorage.removeItem(DRIVER_TOKEN_KEY),
      ]);

      setUser(null);
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

  const sendOTP = async (contactValue: string, contactType: 'email' | 'phone') => {
    try {
      setError(null);
      await OTPService.sendOTP(contactValue, contactType);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      throw err;
    }
  };

  const verifyOTP = async (
    contactValue: string,
    contactType: 'email' | 'phone',
    otpCode: string
  ) => {
    try {
      setError(null);
      const result = await OTPService.verifyOTP(contactValue, contactType, otpCode);
      if (!result.verified) {
        throw new Error(result.message || 'Invalid OTP');
      }
      
      // Update user verification status
      if (user) {
        const updatedUser = {
          ...user,
          emailVerified: contactType === 'email' ? true : user.emailVerified,
          phoneVerified: contactType === 'phone' ? true : user.phoneVerified,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(DRIVER_USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
      throw err;
    }
  };

  const resendOTP = async (contactValue: string, contactType: 'email' | 'phone') => {
    try {
      setError(null);
      await OTPService.resendOTP(contactValue, contactType);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      throw err;
    }
  };

  const value: DriverAuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    sendOTP,
    verifyOTP,
    resendOTP,
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
};

export const useDriverAuth = () => {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
};
