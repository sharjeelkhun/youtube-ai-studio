import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function refreshToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Client ID is not configured');
  }

  const redirectUri = 'https://youtube-ai-studio.netlify.app';
  const scope = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('include_granted_scopes', 'true');
  authUrl.searchParams.append('prompt', 'consent');

  window.location.href = authUrl.toString();
}

export async function fetchWithAuth(url: string, options: RequestInit = {}, accessToken?: string) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid
      toast.error('Session expired. Please sign in again.');
      useAuthStore.getState().logout();
      await refreshToken();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch data from YouTube');
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export { YOUTUBE_API_BASE };