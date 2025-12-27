import type { WalletBalance, WalletTopUp, PaymentMethod, UUID } from '../types';

// Resolve base URL for device access: use env override, else LAN IP fallback.
// On physical Android/iOS devices, 'localhost' points to the device itself, so requests fail.
// We detected LAN IP 192.168.1.63; adjust if your machine IP changes.
const DEFAULT_HOST = 'http://192.168.1.63:8085';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_HOST) + '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let msg = `API Error ${res.status}`;
    try { const data: any = await res.json(); msg = data?.error || msg; } catch {}
    throw new Error(msg);
  }
  return await res.json() as T;
}

export const walletService = {
  async getBalance(userId: UUID): Promise<WalletBalance> {
    return fetchAPI<WalletBalance>(`/wallet/balance/${userId}`);
  },

  async listTopUps(userId: UUID): Promise<WalletTopUp[]> {
    return fetchAPI<WalletTopUp[]>(`/wallet/topups?userId=${userId}`);
  },

  async adminListTopUps(token: string): Promise<WalletTopUp[]> {
    return fetchAPI<WalletTopUp[]>(`/wallet/topups`, {
      headers: { Authorization: `Bearer ${token}` },
    } as RequestInit);
  },

  async topUp(userId: UUID, amount: number, paymentMethod: Exclude<PaymentMethod, 'wallet'>): Promise<WalletTopUp> {
    return fetchAPI<WalletTopUp>(`/wallet/topup`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, paymentMethod }),
    });
  },

  async deduct(userId: UUID, amount: number): Promise<WalletBalance> {
    return fetchAPI<WalletBalance>(`/wallet/deduct`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  },

  async adminRefundTopUp(token: string, topUpId: string, adminNote?: string): Promise<WalletTopUp> {
    return fetchAPI<WalletTopUp>(`/wallet/admin/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topUpId, adminNote }),
    });
  },

  async adminAdjustBalance(token: string, userId: UUID, delta: number, adminNote?: string): Promise<WalletTopUp> {
    return fetchAPI<WalletTopUp>(`/wallet/admin/adjust`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, delta, adminNote }),
    });
  },
};

export default walletService;
