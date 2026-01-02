<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LayoutGrid, ArrowRight, Activity, AlertTriangle, BarChart3 } from 'lucide-vue-next';

const auth = useAuthStore();
</script>

<template>
  <main class="home">
    <div class="hero">
      <div class="logo">
        <LayoutGrid class="logo-icon" />
        <span class="logo-text">SignalGrid</span>
      </div>

      <h1 class="title">Real-time Operations Console</h1>
      <p class="subtitle">
        Monitor events, track incidents, and respond faster with a unified operations platform.
      </p>

      <div v-if="auth.isAuthenticated" class="nav-cards">
        <RouterLink to="/feed" class="nav-card">
          <Activity class="card-icon" />
          <div class="card-content">
            <h3>Live Feed</h3>
            <p>Stream events in real-time</p>
          </div>
          <ArrowRight class="arrow-icon" />
        </RouterLink>

        <RouterLink to="/incidents" class="nav-card">
          <AlertTriangle class="card-icon" />
          <div class="card-content">
            <h3>Incidents</h3>
            <p>Track and resolve issues</p>
          </div>
          <ArrowRight class="arrow-icon" />
        </RouterLink>

        <RouterLink to="/dashboard" class="nav-card">
          <BarChart3 class="card-icon" />
          <div class="card-content">
            <h3>Dashboard</h3>
            <p>View metrics and analytics</p>
          </div>
          <ArrowRight class="arrow-icon" />
        </RouterLink>
      </div>

      <div v-else class="auth-buttons">
        <RouterLink to="/login" class="btn btn-primary">
          Sign In
          <ArrowRight class="btn-icon" />
        </RouterLink>
        <RouterLink to="/register" class="btn btn-secondary"> Create Account </RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background-color: var(--color-sg-bg);
}

.hero {
  text-align: center;
  max-width: 600px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: var(--color-sg-accent);
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-sg-text);
  letter-spacing: -0.03em;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-sg-text);
  margin-bottom: 12px;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .title {
    font-size: 48px;
  }
}

.subtitle {
  font-size: 16px;
  color: var(--color-sg-text-muted);
  margin-bottom: 40px;
  line-height: 1.6;
}

@media (min-width: 640px) {
  .subtitle {
    font-size: 18px;
  }
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}

@media (min-width: 480px) {
  .auth-buttons {
    flex-direction: row;
    max-width: none;
    justify-content: center;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.btn-primary {
  background-color: var(--color-sg-accent);
  color: var(--color-sg-bg);
}

.btn-primary:hover {
  background-color: var(--color-sg-accent-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--color-sg-bg-elevated);
  color: var(--color-sg-text);
  border: 1px solid var(--color-sg-border);
}

.btn-secondary:hover {
  background-color: var(--color-sg-bg-hover);
  border-color: var(--color-sg-border-light);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.nav-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-card:hover {
  background-color: var(--color-sg-bg-hover);
  border-color: var(--color-sg-border-light);
  transform: translateY(-2px);
}

.card-icon {
  width: 24px;
  height: 24px;
  color: var(--color-sg-accent);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-sg-text);
  margin-bottom: 2px;
}

.card-content p {
  font-size: 13px;
  color: var(--color-sg-text-muted);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: var(--color-sg-text-subtle);
  flex-shrink: 0;
  transition:
    transform 0.15s,
    color 0.15s;
}

.nav-card:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--color-sg-accent);
}
</style>
