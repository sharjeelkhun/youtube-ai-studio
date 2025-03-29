import create from 'zustand';

interface APIKeyStore {
  keys: Record<string, string>;
  setKey: (keyName: string, keyValue: string) => void;
  getKey: (keyName: string) => string | undefined;
}

export const useAPIKeyStore = create<APIKeyStore>((set, get) => ({
  keys: {},
  setKey: (keyName, keyValue) => {
    if (!keyValue || typeof keyValue !== 'string') {
      console.error(`Invalid API key for ${keyName}: ${keyValue}`);
      return;
    }
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
    console.log(`Retrieving API key for analyzeSEO: ${get().keys['cohere']}`);
    return key;
  },
}));