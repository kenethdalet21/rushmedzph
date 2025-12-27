// API Base URL with fallback to localhost for development
const DEFAULT_HOST = 'http://localhost:8086';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_HOST) + '/api';

interface DoctorLoginRequest {
  emailOrPhone: string;
  password: string;
}

interface DoctorLoginResponse {
  success: boolean;
  message: string;
  doctorId: string;
  email: string;
  phone?: string;
  fullName: string;
  token: string;
  role: string;
}

interface DoctorRegisterRequest {
  firstName: string;
  lastName: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  email: string;
  phone: string;
  registrationType: 'solo' | 'clinic' | 'hospital';
  organization: string;
  organizationAddress: string;
  onlineServiceType: string;
  password: string;
}

interface DoctorRegisterResponse {
  success: boolean;
  message: string;
  doctorId: string;
  email: string;
  name: string;
}

interface MerchantLoginRequest {
  email: string;
  password: string;
}

interface MerchantLoginResponse {
  success: boolean;
  message: string;
  merchantId: string;
  email: string;
  businessName?: string;
  token?: string;
}

// Doctor Authentication
export const doctorAuth = {
  async login(data: DoctorLoginRequest): Promise<DoctorLoginResponse> {
    try {
      // Use the unified auth endpoint that checks all user tables
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.emailOrPhone,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network request failed' })) as any;
        throw new Error(error.error || error.message || `Login failed with status ${response.status}`);
      }

      const result = await response.json() as { token: string; role: string };
      
      // Verify it's a doctor login
      if (result.role !== 'doctor') {
        throw new Error('Invalid credentials for doctor login');
      }

      return {
        success: true,
        message: 'Login successful',
        doctorId: data.emailOrPhone,
        email: data.emailOrPhone.includes('@') ? data.emailOrPhone : '',
        phone: !data.emailOrPhone.includes('@') ? data.emailOrPhone : undefined,
        fullName: data.emailOrPhone.split('@')[0] || 'Doctor',
        token: result.token,
        role: result.role,
      };
    } catch (err: any) {
      // Catch network errors and provide better error message
      if (err.message === 'Network request failed') {
        throw new Error(`Network error: Cannot connect to server at ${API_BASE_URL}`);
      }
      throw err;
    }
  },

  async register(data: DoctorRegisterRequest): Promise<DoctorRegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/doctor/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network request failed' })) as any;
      throw new Error(error.message || `Registration failed with status ${response.status}`);
    }

    return response.json() as Promise<DoctorRegisterResponse>;
  },
};

// Merchant Authentication
export const merchantAuth = {
  async login(data: MerchantLoginRequest): Promise<MerchantLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/merchant/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network request failed' })) as any;
      throw new Error(error.message || `Login failed with status ${response.status}`);
    }

    return response.json() as Promise<MerchantLoginResponse>;
  },

  async register(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/merchant/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network request failed' })) as any;
      throw new Error(error.message || `Registration failed with status ${response.status}`);
    }

    return response.json() as Promise<any>;
  },
};

export default {
  doctorAuth,
  merchantAuth,
};
