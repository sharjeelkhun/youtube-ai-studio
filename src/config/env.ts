import { z } from 'zod';

const envSchema = z.object({
  VITE_GEMINI_API_KEY: z.string().optional().default(''),
  VITE_GOOGLE_CLIENT_ID: z.string().optional().default(''),
  VITE_YOUTUBE_API_KEY: z.string().optional().default('')
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const env = {
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    return envSchema.parse({});
  }
}

export const env = validateEnv();

export function checkRequiredEnv(service: 'gemini' | 'google' | 'youtube'): boolean {
  switch (service) {
    case 'gemini':
      return Boolean(env.VITE_GEMINI_API_KEY);
    case 'google':
      return Boolean(env.VITE_GOOGLE_CLIENT_ID);
    case 'youtube':
      return Boolean(env.VITE_YOUTUBE_API_KEY);
    default:
      return false;
  }
}