import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SignalGridClient, SdkError, type MeResponse } from '@signalgrid/sdk';
import router from '@/router';

// Use Vite proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// WebSocket URL - construct absolute URL for dev (Vite proxy), or derive from API URL in production
const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (API_BASE_URL.startsWith('/')) {
    // Development: use current origin with ws/wss protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return API_BASE_URL.replace(/^http/, 'ws');
};

// Refresh token 1 minute before expiration
const REFRESH_BUFFER_MS = 60 * 1000;

export const useAuthStore = defineStore('auth', () => {
  const client = new SignalGridClient({ baseUrl: API_BASE_URL, wsUrl: getWsUrl() });
  const user = ref<MeResponse | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const tokenExpiresAt = ref<string | null>(localStorage.getItem('tokenExpiresAt'));
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  // Timer for proactive token refresh
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Restore token on init
  if (token.value) {
    client.auth.setToken(token.value);
  }

  // Set up automatic token refresh on 401
  client.auth.setRefreshCallback(async () => {
    try {
      const result = await client.auth.refresh();
      setTokenData(result.token, result.expiresAt);
      return result;
    } catch {
      // Refresh failed, user needs to re-login
      await performLogout();
      router.push({ name: 'login' });
      return null;
    }
  });

  // Promise that resolves when init() completes - used by router guard
  let initPromise: Promise<void> | null = null;

  const setTokenData = (newToken: string, expiresAt: string) => {
    token.value = newToken;
    tokenExpiresAt.value = expiresAt;
    localStorage.setItem('token', newToken);
    localStorage.setItem('tokenExpiresAt', expiresAt);
    client.auth.setToken(newToken);
    scheduleTokenRefresh(expiresAt);
  };

  const clearTokenData = () => {
    token.value = null;
    tokenExpiresAt.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    client.auth.setToken(null);
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };

  const scheduleTokenRefresh = (expiresAt: string) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    const now = Date.now();
    const timeUntilRefresh = expiresAtMs - now - REFRESH_BUFFER_MS;

    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh now
      refreshToken();
      return;
    }

    refreshTimer = setTimeout(() => {
      refreshToken();
    }, timeUntilRefresh);
  };

  const refreshToken = async () => {
    try {
      const result = await client.auth.refresh();
      setTokenData(result.token, result.expiresAt);
    } catch {
      // Refresh failed, user needs to re-login
      await performLogout();
      router.push({ name: 'login' });
    }
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await client.auth.login({ email, password });
      setTokenData(result.token, result.expiresAt);
      await fetchMe();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const register = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await client.auth.register({ email, password });
      setTokenData(result.token, result.expiresAt);
      await fetchMe();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Registration failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const fetchMe = async () => {
    if (!token.value) return;
    try {
      user.value = await client.auth.me();
    } catch (e) {
      // Token might be invalid, clear it
      await performLogout();
      throw e;
    }
  };

  const performLogout = async () => {
    // Clear local state immediately so guards and UI react before network call.
    clearTokenData();
    try {
      // Call server to clear httpOnly cookie
      await client.auth.logout();
    } catch {
      // Ignore errors during logout
    }
  };

  const logout = async () => {
    await performLogout();
  };

  // Handle API errors - if 401, logout and redirect to login
  const handleApiError = (e: unknown): string => {
    if (e instanceof SdkError && e.status === 401) {
      performLogout();
      router.push({ name: 'login' });
      return 'Session expired. Please log in again.';
    }
    return e instanceof Error ? e.message : 'An error occurred';
  };

  // Try to fetch user on store init if we have a token
  const init = async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (token.value) {
        // Check if token is expired
        if (tokenExpiresAt.value) {
          const expiresAtMs = new Date(tokenExpiresAt.value).getTime();
          if (expiresAtMs <= Date.now()) {
            // Token expired, try to refresh
            try {
              await refreshToken();
            } catch {
              // Refresh failed, clear token
              clearTokenData();
              initialized.value = true;
              return;
            }
          } else {
            // Token still valid, schedule refresh
            scheduleTokenRefresh(tokenExpiresAt.value);
          }
        }

        try {
          await fetchMe();
        } catch {
          // Token was invalid, already logged out by fetchMe
        }
      }
      initialized.value = true;
    })();

    return initPromise;
  };

  // Wait for initialization to complete (used by router guard)
  const waitForInit = () => initPromise ?? Promise.resolve();

  return {
    client,
    user,
    token,
    tokenExpiresAt,
    loading,
    error,
    initialized,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    handleApiError,
    init,
    waitForInit,
  };
});
