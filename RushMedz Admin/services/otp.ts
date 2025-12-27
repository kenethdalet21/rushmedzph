import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.3:8086/api/otp';

/**
 * OTP Service - handles all OTP-related API calls
 */

export interface OTPResponse {
  success: boolean;
  message: string;
  otpCode?: string; // Only returned in development mode
  note?: string; // Development mode notice
  verified?: boolean;
  remainingAttempts?: number;
}

/**
 * Send OTP to email or phone
 * @param contactValue Email address or phone number
 * @param contactType "email" or "phone"
 */
export const sendOTP = async (
  contactValue: string,
  contactType: 'email' | 'phone'
): Promise<OTPResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send`, {
      contactValue,
      contactType,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP code
 * @param contactValue Email address or phone number
 * @param contactType "email" or "phone"
 * @param otpCode The OTP code to verify
 */
export const verifyOTP = async (
  contactValue: string,
  contactType: 'email' | 'phone',
  otpCode: string
): Promise<OTPResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify`, {
      contactValue,
      contactType,
      otpCode,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to verify OTP');
  }
};

/**
 * Resend OTP to email or phone
 * @param contactValue Email address or phone number
 * @param contactType "email" or "phone"
 */
export const resendOTP = async (
  contactValue: string,
  contactType: 'email' | 'phone'
): Promise<OTPResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/resend`, {
      contactValue,
      contactType,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to resend OTP');
  }
};

/**
 * Check if contact is verified
 * @param contactValue Email address or phone number
 * @param contactType "email" or "phone"
 */
export const checkVerification = async (
  contactValue: string,
  contactType: 'email' | 'phone'
): Promise<{ success: boolean; verified: boolean }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/check-verification`, {
      contactValue,
      contactType,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to check verification');
  }
};
