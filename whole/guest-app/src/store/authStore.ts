import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminApi } from '@/lib/api';

interface Staff {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
}

interface AuthStore {
  staff: Staff | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<string | null>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      staff: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      hydrated: false,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res: any = await adminApi.staffLogin(email, password);
          set({
            staff: res.staff,
            token: res.accessToken,
            refreshToken: res.refreshToken,
            loading: false,
            isAuthenticated: true,
          });
        } catch (e: any) {
          set({ error: e.message, loading: false, isAuthenticated: false });
          throw e;
        }
      },

      logout: () => set({ staff: null, token: null, refreshToken: null, isAuthenticated: false }),

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ staff: null, token: null, refreshToken: null, isAuthenticated: false });
          return null;
        }
        try {
          const res: any = await adminApi.refreshToken(refreshToken);
          set({ token: res.accessToken });
          return res.accessToken;
        } catch {
          set({ staff: null, token: null, refreshToken: null, isAuthenticated: false });
          return null;
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        staff: state.staff,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.token && state.staff) {
            state.isAuthenticated = true;
          }
          state.hydrated = true;
        }
      },
    }
  )
);
