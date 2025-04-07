import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

const TOKEN_STORAGE_KEY = 'youtube_auth_token';
const EXPIRY_STORAGE_KEY = 'youtube_token_expiry';

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
    // Persist tokens
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(EXPIRY_STORAGE_KEY, expiryTime.toString());
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
  
  // Try to get from localStorage if not in state
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const storedExpiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
  
  const currentToken = accessToken || storedToken;
  const currentExpiry = tokenExpiryTime || (storedExpiry ? parseInt(storedExpiry) : null);

  if (!currentToken || !currentExpiry) {
    logout();
    return false;
  }

  if (checkTokenExpiry(currentExpiry)) {
    // Clear stored tokens
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
    logout();
    initiateAuth();
    return false;
  }

  // Update state if using stored values
  if (storedToken && storedExpiry && (!accessToken || !tokenExpiryTime)) {
    useAuthStore.getState().setAuth(storedToken, parseInt(storedExpiry));
  }

  return true;
}