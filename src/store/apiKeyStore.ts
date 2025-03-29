import create from 'zustand';

interface APIKeyStore {
  keys: Record<string, string>;
  setKey: (keyName: string, keyValue: string) => void;
  getKey: (keyName: string) => string | undefined;
}

export const useAPIKeyStore = create<APIKeyStore>((set, get) => ({
  keys: {},
  setKey: (keyName, keyValue) => {
    console.log(`Setting API key: ${keyName} = ${keyValue}`); // Debug log
    set((state) => ({
      keys: {
        ...state.keys,
        [keyName]: keyValue,
      },
    }));
  },
  getKey: (keyName) => {
    const key = get().keys[keyName];
    console.log(`Retrieving API key: ${keyName} = ${key}`); // Debug log
    return key;
  },
}));