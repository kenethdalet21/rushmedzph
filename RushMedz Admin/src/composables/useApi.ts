import axios, { type AxiosInstance } from 'axios';
import { ref } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086';

// Enable local storage mock when backend is unavailable (development fallback)
const USE_LOCAL_MOCK = import.meta.env.VITE_USE_LOCAL_MOCK === 'true' || true;

type AuthUser = {
  id: string | number | null;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  profileImageUrl?: string | null;
};

interface StoredUser extends AuthUser {
  password: string;
}

// Local storage keys for mock auth
const MOCK_USERS_KEY = 'rushmedz_mock_users';

const getMockUsers = (): StoredUser[] => {
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveMockUsers = (users: StoredUser[]) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const generateMockToken = (user: AuthUser): string => {
  // Simple base64 encoded mock token (NOT secure - dev only)
  const payload = { sub: user.username, role: user.role, id: user.id, exp: Date.now() + 86400000 };
  return 'mock_' + btoa(JSON.stringify(payload));
};

const normalizeAuthResponse = (data: any): { token: string; user: AuthUser } => {
  const token = data?.token;
  const user: AuthUser = {
    id: data?.userId ?? data?.adminId ?? data?.id ?? null,
    username: data?.username ?? '',
    email: data?.email ?? undefined,
    fullName: data?.fullName ?? undefined,
    role: String(data?.role ?? 'admin').toLowerCase(),
    profileImageUrl: data?.profileImageUrl ?? null,
  };

  return { token, user };
};

export const useApi = () => {
  const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach the bearer token to every request when present.
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return { api, baseURL: API_BASE_URL };
};

export const useAuth = () => {
  const { api } = useApi();
  const isAuthenticated = ref(!!localStorage.getItem('adminToken'));
  const currentUser = ref<AuthUser | null>(
    localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser') as string) : null
  );

  /**
   * Attempts real API login, falls back to local mock if backend unavailable
   */
  const login = async (username: string, password: string) => {
    // Try real API first
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      const { token, user } = normalizeAuthResponse(data);

      if (token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        currentUser.value = user;
        isAuthenticated.value = true;
        return { token, user };
      }
    } catch (err: any) {
      // If network error and mock enabled, try local auth
      if (USE_LOCAL_MOCK && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'))) {
        console.warn('[Auth] Backend unavailable, using local mock auth');
        return loginMock(username, password);
      }
      throw err;
    }

    throw new Error('Login failed: missing token in response');
  };

  /**
   * Local mock login - checks against localStorage users
   */
  const loginMock = (username: string, password: string) => {
    const users = getMockUsers();
    const found = users.find((u) => u.username === username && u.password === password);

    if (!found) {
      throw new Error('Invalid username or password');
    }

    const user: AuthUser = {
      id: found.id,
      username: found.username,
      email: found.email,
      fullName: found.fullName,
      role: found.role,
      profileImageUrl: found.profileImageUrl,
    };

    const token = generateMockToken(user);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    currentUser.value = user;
    isAuthenticated.value = true;
    return { token, user };
  };

  /**
   * Attempts real API register, falls back to local mock if backend unavailable
   */
  const register = async (userData: any) => {
    const role = (userData.role || 'admin').toLowerCase();

    // Try real API first
    try {
      const { data } = await api.post(`/api/auth/register/${role}`, userData);
      return data;
    } catch (err: any) {
      // If network error and mock enabled, use local registration
      if (USE_LOCAL_MOCK && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'))) {
        console.warn('[Auth] Backend unavailable, using local mock registration');
        return registerMock(userData);
      }
      throw err;
    }
  };

  /**
   * Local mock registration - stores user in localStorage
   */
  const registerMock = (userData: any) => {
    const users = getMockUsers();

    // Check if username already exists
    if (users.some((u) => u.username === userData.username)) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    if (userData.email && users.some((u) => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser: StoredUser = {
      id: Date.now(),
      username: userData.username,
      password: userData.password,
      email: userData.email,
      fullName: userData.fullName,
      role: (userData.role || 'admin').toLowerCase(),
      profileImageUrl: null,
    };

    users.push(newUser);
    saveMockUsers(users);

    return { message: 'Registration successful', userId: newUser.id };
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    currentUser.value = null;
    isAuthenticated.value = false;
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      logout();
      return;
    }

    // For mock tokens, just validate from localStorage
    if (token.startsWith('mock_')) {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        currentUser.value = JSON.parse(storedUser);
        isAuthenticated.value = true;
        return;
      }
      logout();
      return;
    }

    // For real tokens, verify with backend
    try {
      const { data } = await api.get('/api/auth/me');
      currentUser.value = data;
      isAuthenticated.value = true;
    } catch {
      logout();
    }
  };

  return { login, register, logout, checkAuth, isAuthenticated, currentUser };
};
