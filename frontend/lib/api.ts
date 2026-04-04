import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 15000,
});

// ── Request interceptor — injecte le JWT ─────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pd360_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — gestion globale des erreurs ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pd360_token');
        localStorage.removeItem('pd360_user');
        // Rediriger vers login si pas déjà dessus
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),

  verifyEmail: (token: string) =>
    api.get<{ token: string; user: User }>(`/auth/verify-email?token=${token}`),

  getMe: () =>
    api.get<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (packId: string) =>
    api.post<{ checkoutUrl: string; transactionId: string }>('/payment/initiate', { packId }),

  checkStatus: (transactionId: string) =>
    api.get<{ status: string; amount: number; currency: string }>(`/payment/status/${transactionId}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (packId: string) =>
    api.get<{ packName: string; documents: Document[] }>(`/documents/list/${packId}`),

  requestToken: (packId: string, documentFilename: string) =>
    api.post<{ token: string; expiresAt: string }>('/documents/request-token', {
      packId,
      documentFilename,
    }),

  // L'URL de streaming — inclut le token dans l'URL (pas dans les headers car c'est un GET direct)
  getStreamUrl: (token: string) =>
    `${API_URL}/api/documents/view/${token}`,
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    api.get('/admin/stats'),

  getClients: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/clients', { params }),

  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/transactions', { params }),

  grantAccess: (userId: string, packId: string) =>
    api.post('/admin/grant-access', { userId, packId }),

  revokeAccess: (userId: string, packId: string) =>
    api.post('/admin/revoke-access', { userId, packId }),

  toggleUserStatus: (userId: string) =>
    api.patch(`/admin/users/${userId}/toggle`),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'client' | 'admin';
  isEmailVerified: boolean;
  purchases: Purchase[];
  lastLoginAt?: string;
  loginCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Purchase {
  _id: string;
  packId: PackInfo | string;
  purchasedAt: string;
  amount: number;
  currency: string;
  grantedManually?: boolean;
}

export interface PackInfo {
  _id: string;
  name: string;
  slug: string;
}

export interface Document {
  id: string;
  title: string;
  fileSize: number;
  pageCount: number;
}

export interface Pack {
  _id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  documents: Document[];
  isActive: boolean;
}
