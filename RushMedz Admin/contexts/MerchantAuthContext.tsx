import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as OTPService from '../services/otp';

interface MerchantUser {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  licenseNumber: string;
  businessType: 'pharmacy' | 'clinic' | 'hospital';
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface MerchantAuthContextType {
  user: MerchantUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, doctorData?: any) => Promise<void>;
  signUp: (email: string, password: string, businessName: string, ownerName: string, phone: string, licenseNumber: string, businessType: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  sendOTP: (contactValue: string, contactType: 'email' | 'phone') => Promise<void>;
  verifyOTP: (contactValue: string, contactType: 'email' | 'phone', otpCode: string) => Promise<void>;
  resendOTP: (contactValue: string, contactType: 'email' | 'phone') => Promise<void>;
}

const MerchantAuthContext = createContext<MerchantAuthContextType | undefined>(undefined);

const MERCHANT_USER_KEY = '@epharma_merchant_user';
const MERCHANT_TOKEN_KEY = '@epharma_merchant_token';

export const MerchantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem(MERCHANT_USER_KEY),
        AsyncStorage.getItem(MERCHANT_TOKEN_KEY),
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

  const signIn = async (emailOrPhone: string, password: string, doctorData?: any) => {
    try {
      setLoading(true);
      setError(null);

      // If doctor data is provided, use it directly
      if (doctorData) {
        await Promise.all([
          AsyncStorage.setItem(MERCHANT_USER_KEY, JSON.stringify(doctorData)),
          AsyncStorage.setItem(MERCHANT_TOKEN_KEY, doctorData.token || ''),
        ]);
        setUser(doctorData);
        return;
      }

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

      // Allow any password for testing (removed strict validation)
      if (password.length < 1) {
        throw new Error('Password is required');
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use email or phone as basis for stable merchant ID (consistent across logins)
      const stableMerchantId = (isEmail ? emailOrPhone : emailOrPhone.replace(/\D/g, '')).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      // Mock user data - always verified for testing
      const mockUser: MerchantUser = {
        id: stableMerchantId,
        email: isEmail ? emailOrPhone : 'merchant@epharma.com',
        businessName: 'ABC Pharmacy',
        ownerName: isEmail ? emailOrPhone.split('@')[0] : 'Merchant',
        phone: isPhone ? emailOrPhone : '+1234567890',
        licenseNumber: 'PH123456',
        businessType: 'pharmacy',
        createdAt: new Date().toISOString(),
        emailVerified: true, // Always verified for testing
        phoneVerified: true, // Always verified for testing
      };

      const mockToken = `token_${Math.random().toString(36).substring(7)}`;

      await Promise.all([
        AsyncStorage.setItem(MERCHANT_USER_KEY, JSON.stringify(mockUser)),
        AsyncStorage.setItem(MERCHANT_TOKEN_KEY, mockToken),
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
    businessName: string,
    ownerName: string,
    phone: string,
    licenseNumber: string,
    businessType: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password || !businessName || !ownerName || !phone || !licenseNumber) {
        throw new Error('All fields are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 1) {
        throw new Error('Password is required');
      }

      if (phone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use email as basis for stable merchant ID (consistent across logins)
      const stableMerchantId = email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const newUser: MerchantUser = {
        id: stableMerchantId,
        email,
        businessName,
        ownerName,
        phone,
        licenseNumber,
        businessType: businessType as MerchantUser['businessType'],
        createdAt: new Date().toISOString(),
      };

      const mockToken = `token_${Math.random().toString(36).substring(7)}`;

      await Promise.all([
        AsyncStorage.setItem(MERCHANT_USER_KEY, JSON.stringify(newUser)),
        AsyncStorage.setItem(MERCHANT_TOKEN_KEY, mockToken),
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
        AsyncStorage.removeItem(MERCHANT_USER_KEY),
        AsyncStorage.removeItem(MERCHANT_TOKEN_KEY),
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
      const response = await OTPService.sendOTP(contactValue, contactType);
      
      // In development mode, show OTP code in alert for testing
      if (response.otpCode) {
        Alert.alert(
          'OTP Sent (Development Mode)',
          `Your OTP code is: ${response.otpCode}\n\n${response.note || 'This code is only shown in development mode for testing purposes.'}`,
          [{ text: 'OK' }]
        );
      }
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
        await AsyncStorage.setItem(MERCHANT_USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
      throw err;
    }
  };

  const resendOTP = async (contactValue: string, contactType: 'email' | 'phone') => {
    try {
      setError(null);
      const response = await OTPService.resendOTP(contactValue, contactType);
      
      // In development mode, show OTP code in alert for testing
      if (response.otpCode) {
        Alert.alert(
          'OTP Resent (Development Mode)',
          `Your new OTP code is: ${response.otpCode}\n\n${response.note || 'This code is only shown in development mode for testing purposes.'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      throw err;
    }
  };

  const value: MerchantAuthContextType = {
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
    <MerchantAuthContext.Provider value={value}>
      {children}
    </MerchantAuthContext.Provider>
  );
};

export const useMerchantAuth = () => {
  const context = useContext(MerchantAuthContext);
  if (context === undefined) {
    throw new Error('useMerchantAuth must be used within a MerchantAuthProvider');
  }
  return context;
};
