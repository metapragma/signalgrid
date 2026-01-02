<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LayoutGrid, Eye, EyeOff, ArrowRight } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/feed');
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Login failed';
  }
};
</script>

<template>
  <main class="auth-page">
    <div class="auth-container">
      <!-- Logo -->
      <div class="logo">
        <LayoutGrid class="logo-icon" />
        <span class="logo-text">SignalGrid</span>
      </div>

      <!-- Auth Card -->
      <div class="auth-card">
        <div class="card-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                class="form-input"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <EyeOff v-if="showPassword" class="toggle-icon" />
                <Eye v-else class="toggle-icon" />
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="auth.loading" class="submit-btn">
            <span>{{ auth.loading ? 'Signing in...' : 'Sign In' }}</span>
            <ArrowRight v-if="!auth.loading" class="btn-icon" />
          </button>
        </form>

        <div class="card-footer">
          <p>
            Don't have an account?
            <router-link to="/register" class="link">Create one</router-link>
          </p>
        </div>
      </div>

      <!-- Footer Text -->
      <p class="footer-text">Real-time operations console for modern teams</p>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-sg-bg);
  padding: 24px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-sg-accent);
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-sg-text);
  letter-spacing: -0.03em;
}

.auth-card {
  width: 100%;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 16px;
  padding: 32px;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.card-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-sg-text);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.card-header p {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-sg-text);
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  background-color: var(--color-sg-bg);
  border: 1px solid var(--color-sg-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-sg-text);
  transition: all 0.15s;
}

.form-input::placeholder {
  color: var(--color-sg-text-subtle);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-sg-accent);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--color-sg-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}

.password-toggle:hover {
  color: var(--color-sg-text);
  background-color: var(--color-sg-bg-hover);
}

.toggle-icon {
  width: 18px;
  height: 18px;
}

.error-message {
  padding: 12px 14px;
  background-color: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  border-radius: 8px;
  color: var(--color-sg-error);
  font-size: 13px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  background-color: var(--color-sg-accent);
  border: none;
  border-radius: 8px;
  color: var(--color-sg-bg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--color-sg-accent-hover);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.card-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-sg-border);
  text-align: center;
}

.card-footer p {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

.link {
  color: var(--color-sg-accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s;
}

.link:hover {
  opacity: 0.8;
}

.footer-text {
  margin-top: 32px;
  font-size: 13px;
  color: var(--color-sg-text-subtle);
  text-align: center;
}
</style>
