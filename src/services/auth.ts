import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl'
].join(' ');

const TOKEN_STORAGE_KEY = 'youtube_auth_token';
const EXPIRY_STORAGE_KEY = 'youtube_token_expiry';

let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
  // Remove offline access as we're using implicit flow
  // authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'select_account consent');

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
    // Store with longer expiry and refresh token handling
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(EXPIRY_STORAGE_KEY, (expiryTime + 24 * 60 * 60 * 1000).toString()); // Add 24 hours
    useAuthStore.getState().setAuth(accessToken, expiryTime);
    return { accessToken, expiryTime };
  }

  return null;
}

export function checkTokenExpiry(expiryTime: number) {
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  return Date.now() >= (expiryTime - REFRESH_THRESHOLD);
}

export function refreshSession() {
  const now = Date.now();
  
  // Prevent too frequent refreshes
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    logger.auth('Skipping refresh - too soon');
    return true;
  }

  logger.auth('Starting session refresh check');
  const { accessToken, tokenExpiryTime, logout, setAuth } = useAuthStore.getState();
  
  // Try to get from localStorage first
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const storedExpiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
  
  if (storedToken && storedExpiry) {
    const expiryTime = parseInt(storedExpiry);
    logger.auth('Found stored token', { expiryTime: new Date(expiryTime).toISOString() });
    
    if (now < expiryTime) {
      logger.auth('Using stored token');
      setAuth(storedToken, expiryTime);
      lastRefreshTime = now;
      return true;
    }
  }

  if (accessToken && tokenExpiryTime && now < tokenExpiryTime) {
    logger.auth('Using current token');
    lastRefreshTime = now;
    return true;
  }

  logger.auth('Session expired, logging out');
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(EXPIRY_STORAGE_KEY);
  logout();
  return false;
}

// Add this new function to check session on app start
export function checkStoredSession() {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const storedExpiry = localStorage.getItem(EXPIRY_STORAGE_KEY);

  if (storedToken && storedExpiry) {
    const expiryTime = parseInt(storedExpiry);
    if (Date.now() < expiryTime) {
      useAuthStore.getState().setAuth(storedToken, expiryTime);
      return true;
    }
  }
  return false;
}