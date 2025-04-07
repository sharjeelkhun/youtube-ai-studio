const DEBUG = true;

export const logger = {
  query: (message: string, data?: any) => {
    if (DEBUG) console.log(`[Query] ${message}`, data || '');
  },
  auth: (message: string, data?: any) => {
    if (DEBUG) console.log(`[Auth] ${message}`, data || '');
  },
  cache: (message: string, data?: any) => {
    if (DEBUG) console.log(`[Cache] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Error] ${message}`, error || '');
  }
};
