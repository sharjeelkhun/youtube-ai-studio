import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface APIKeyState {
  cohereKey: string;
  setKey: (provider: string, key: string) => void;
  getKey: (provider: string) => string;
  clearKey: (provider: string) => void;
}

export const useAPIKeyStore = create<APIKeyState>()(
  persist(
    (set, get) => ({
      cohereKey: '',
      
      setKey: (provider, key) => 
        set({ [`${provider}Key`]: key }),
      
      getKey: (provider) => 
        get()[`${provider}Key` as keyof APIKeyState] as string,
      
      clearKey: (provider) =>
        set({ [`${provider}Key`]: '' }),
    }),
    {
      name: 'api-keys-storage',
      version: 1
    }
  )
);