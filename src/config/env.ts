import { z } from 'zod';

const envSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string(),
  VITE_YOUTUBE_API_KEY: z.string(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_SUPABASE_URL: z.string().optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const env = {
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL
  };

  return envSchema.parse(env);
}

export const env = validateEnv();

// Check if a provider has a valid API key in the store
export function checkRequiredProvider(provider: 'gemini' | 'cohere'): boolean {
  const { getKey } = useAPIKeyStore.getState();
  return Boolean(getKey(provider));
}