import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  tokenExpiryTime: number | null;
  isAuthenticated: boolean;
  setAuth: (token: string, expiryTime: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      tokenExpiryTime: null,
      isAuthenticated: false,
      setAuth: (token, expiryTime) => set({ 
        accessToken: token, 
        tokenExpiryTime: expiryTime,
        isAuthenticated: true 
      }),
      logout: () => set({ 
        accessToken: null, 
        tokenExpiryTime: null,
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenExpiryTime: state.tokenExpiryTime,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);