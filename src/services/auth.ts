import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

export function initiateAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    toast.error('Google Client ID is not configured');
    return;
  }

  const redirectUri = window.location.origin;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', YOUTUBE_SCOPES);
  authUrl.searchParams.append('include_granted_scopes', 'true');
  authUrl.searchParams.append('prompt', 'consent');

  window.location.href = authUrl.toString();
}

export function handleAuthCallback() {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (accessToken && expiresIn) {
    const expiryTime = Date.now() + parseInt(expiresIn) * 1000;
    return { accessToken, expiryTime };
  }

  return null;
}

export function checkTokenExpiry(expiryTime: number) {
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  return Date.now() >= (expiryTime - REFRESH_THRESHOLD);
}

export function refreshSession() {
  const { accessToken, tokenExpiryTime, logout } = useAuthStore.getState();
  
  if (!accessToken || !tokenExpiryTime) {
    logout();
    return false;
  }

  if (checkTokenExpiry(tokenExpiryTime)) {
    logout();
    initiateAuth();
    return false;
  }

  return true;
}