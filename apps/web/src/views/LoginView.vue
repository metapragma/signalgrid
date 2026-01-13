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
        <LayoutGrid class="logo-icon" :stroke-width="1" />
        <span class="logo-text">SignalGrid</span>
      </div>

      <div class="auth-shell">
        <!-- Auth Card -->
        <div class="auth-card enter-rise">
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

        <aside class="auth-aside enter-rise delay-1" aria-hidden="true">
          <div class="aside-content">
            <h2>Stay ahead of every signal.</h2>
            <p>Real-time visibility, fewer surprises, faster response.</p>
          </div>
          <div class="aside-orb"></div>
        </aside>
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
  background-color: transparent;
  padding: var(--space-6);
}

.auth-container {
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-sg-text-muted);
}

.logo-text {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-title);
  color: var(--color-sg-text);
  letter-spacing: var(--tracking-tight);
}

.auth-card {
  width: 100%;
  background-color: var(--color-sg-bg-card);
  border-radius: 22px;
  padding: var(--space-8);
  border: 1px solid var(--color-sg-border);
  box-shadow: var(--shadow-lg);
}

.card-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.card-header h1 {
  font-size: 28px;
  font-weight: var(--weight-semibold);
  line-height: var(--leading-display);
  color: var(--color-sg-text);
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-2);
}

.card-header p {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-secondary);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 14px;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  transition: all 0.15s;
}

.form-input::placeholder {
  color: var(--color-sg-text-subtle);
}

.form-input:focus {
  outline: none;
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
  border-radius: 12px;
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
  padding: var(--space-3);
  background-color: var(--color-sg-error-muted);
  border-radius: 14px;
  color: var(--color-sg-error);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px 16px;
  background-color: var(--color-sg-accent);
  border: none;
  border-radius: 999px;
  color: white;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
  margin-top: var(--space-1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
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
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  text-align: center;
}

.card-footer p {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.link {
  color: var(--color-sg-accent);
  text-decoration: none;
  font-weight: var(--weight-medium);
  transition: color 0.15s;
}

.link:hover {
  color: var(--color-sg-accent-hover);
}

.footer-text {
  margin-top: var(--space-8);
  font-size: var(--text-micro);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-subtle);
  text-align: center;
}

.auth-shell {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 900px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: stretch;
  }
}

.auth-aside {
  display: none;
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  box-shadow: var(--shadow-lg);
  padding: var(--space-8);
}

.auth-aside::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.2);
  opacity: 0.2;
  pointer-events: none;
}

@media (min-width: 900px) {
  .auth-aside {
    display: flex;
    align-items: flex-end;
  }
}

.aside-content h2 {
  font-size: 24px;
  color: var(--color-sg-text);
  margin-bottom: var(--space-2);
}

.aside-content p {
  color: var(--color-sg-text-muted);
}

.aside-orb {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background-color: rgba(0, 203, 179, 0.2);
}
</style>
