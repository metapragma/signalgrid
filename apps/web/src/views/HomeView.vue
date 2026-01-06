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
  padding: var(--space-6);
  background-color: var(--color-sg-bg);
}

.hero {
  text-align: center;
  max-width: 600px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: var(--color-sg-text-muted);
}

.logo-text {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-display);
  color: var(--color-sg-text);
  letter-spacing: var(--tracking-tight);
}

.title {
  font-size: 36px;
  font-weight: var(--weight-semibold);
  line-height: var(--leading-display);
  color: var(--color-sg-text);
  margin-bottom: var(--space-3);
  letter-spacing: var(--tracking-tight);
}

@media (min-width: 640px) {
  .title {
    font-size: var(--text-hero);
  }
}

.subtitle {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
  margin-bottom: var(--space-10);
}

@media (min-width: 640px) {
  .subtitle {
    font-size: var(--text-title);
    line-height: var(--leading-title);
  }
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
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
  background-color: var(--color-sg-bg-hover);
  color: var(--color-sg-text);
  border: none;
}

.btn-secondary:hover {
  background-color: var(--color-sg-bg-active);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.nav-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: left;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-sg-bg-card);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-card:hover {
  background-color: var(--color-sg-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-icon {
  width: 24px;
  height: 24px;
  color: var(--color-sg-text-muted);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  margin-bottom: 2px;
}

.card-content p {
  font-size: var(--text-body);
  line-height: var(--leading-body);
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
  color: var(--color-sg-text);
}
</style>
