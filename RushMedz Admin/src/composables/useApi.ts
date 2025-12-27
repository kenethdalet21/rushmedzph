import axios, { type AxiosInstance } from 'axios';
import { ref } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086';

export const useApi = () => {
  const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
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
  const currentUser = ref(null);

  const login = async (username: string, password: string) => {
    const response = await api.post('/api/auth/login', { username, password });
    const { token } = response.data;
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(response.data));
    currentUser.value = response.data;
    isAuthenticated.value = true;
    return response.data;
  };

  const register = async (userData: any) => {
    const role = (userData.role || 'admin').toLowerCase();
    const response = await api.post(`/api/auth/register/${role}`, userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    currentUser.value = null;
    isAuthenticated.value = false;
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me');
      currentUser.value = response.data;
      isAuthenticated.value = true;
    } catch {
      logout();
    }
  };

  return { login, register, logout, checkAuth, isAuthenticated, currentUser };
};
