import axios from 'axios';
import { getToken } from './tokenStorage';
const API_BASE = 'http://localhost:8086/api/merchant/users';
export async function fetchMerchantUsers() {
  const token = await getToken();
  const response = await axios.get(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
export async function createMerchantUser(user: any) {
  const token = await getToken();
  const response = await axios.post(API_BASE, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
export async function deleteMerchantUser(id: number) {
  const token = await getToken();
  await axios.delete(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
