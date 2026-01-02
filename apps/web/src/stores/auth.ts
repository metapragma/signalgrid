import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SignalGridClient, SdkError, type MeResponse } from '@signalgrid/sdk';
import router from '@/router';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = defineStore('auth', () => {
  const client = new SignalGridClient({ baseUrl: API_BASE_URL });
  const user = ref<MeResponse | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Restore token on init
  if (token.value) {
    client.auth.setToken(token.value);
  }

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await client.auth.login({ email, password });
      token.value = result.token;
      localStorage.setItem('token', result.token);
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
      token.value = result.token;
      localStorage.setItem('token', result.token);
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
      logout();
      throw e;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    client.auth.setToken(null);
  };

  // Handle API errors - if 401, logout and redirect to login
  const handleApiError = (e: unknown): string => {
    if (e instanceof SdkError && e.status === 401) {
      logout();
      router.push({ name: 'login' });
      return 'Session expired. Please log in again.';
    }
    return e instanceof Error ? e.message : 'An error occurred';
  };

  // Try to fetch user on store init if we have a token
  const init = async () => {
    if (token.value) {
      try {
        await fetchMe();
      } catch {
        // Token was invalid, already logged out by fetchMe
      }
    }
  };

  return {
    client,
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    handleApiError,
    init,
  };
});
