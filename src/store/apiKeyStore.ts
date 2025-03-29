import create from 'zustand';
import { persist } from 'zustand/middleware';

interface APIKeyStore {
  keys: Record<string, string>;
  setKey: (keyName: string, keyValue: string) => void;
  getKey: (keyName: string) => string | undefined;
}

export const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set, get) => ({
      keys: {},
      setKey: (keyName, keyValue) => {
        if (!keyValue || typeof keyValue !== 'string') {
          console.error(`Invalid API key for ${keyName}: ${keyValue}`);
          return;
        }
        set((state) => ({
          keys: {
            ...state.keys,
            [keyName]: keyValue,
          },
        }));
      },
      getKey: (keyName) => {
        const key = get().keys[keyName];
        return key;
      },
    }),
    {
      name: 'api-key-storage', // unique name for localStorage key
      getStorage: () => localStorage, // Use localStorage as the storage backend
    }
  )
);