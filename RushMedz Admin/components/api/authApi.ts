import axios from 'axios';
const API_BASE = 'http://localhost:8086/api/auth';
export async function login(username: string, password: string) {
  const response = await axios.post(`${API_BASE}/login`, { username, password });
  return response.data.token;
}
