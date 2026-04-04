import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isLoading:       false,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('pd360_token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('pd360_token');
        localStorage.removeItem('pd360_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'pd360_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
