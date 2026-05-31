import { create } from 'zustand';
import { adminApi } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

interface AdminStore extends AuthState {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response: any = await adminApi.staffLogin(email, password);
      set({
        user: response.staff,
        token: response.accessToken,
        refreshToken: response.refreshToken,
        isLoggedIn: true,
        loading: false,
      });
      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminToken', response.accessToken);
        localStorage.setItem('adminRefreshToken', response.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(response.staff));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ loading: false, error: errorMessage, isLoggedIn: false });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
    }
  },

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
}));
