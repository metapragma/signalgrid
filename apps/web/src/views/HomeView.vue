<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LayoutGrid, ArrowRight, Activity, AlertTriangle, BarChart3 } from 'lucide-vue-next';

const auth = useAuthStore();
</script>

<template>
  <main class="home">
    <div class="hero enter-rise">
      <div class="logo">
        <LayoutGrid class="logo-icon" :stroke-width="0.5" />
        <span class="logo-text">SignalGrid</span>
      </div>

      <h1 class="title">Real-time Operations Console</h1>
      <p class="subtitle">
        Monitor events, track incidents, and respond faster with a unified operations platform.
      </p>

      <div class="hero-visual enter-rise delay-1" aria-hidden="true">
        <div class="window">
          <div class="window-bar">
            <div class="window-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="window-title">Operations Overview</span>
          </div>
          <div class="window-body">
            <div class="metric-grid">
              <div class="metric">
                <span>Latency</span>
                <strong>184ms</strong>
              </div>
              <div class="metric">
                <span>Error rate</span>
                <strong>0.6%</strong>
              </div>
              <div class="metric">
                <span>Incidents</span>
                <strong>2 open</strong>
              </div>
            </div>
            <div class="chart-spark">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

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
  background-color: transparent;
}

.hero {
  text-align: center;
  max-width: 720px;
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
  color: var(--color-sg-text-secondary);
}

.logo-text {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-display);
  color: var(--color-sg-text);
  letter-spacing: var(--tracking-tight);
}

.title {
  font-size: 40px;
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
  margin-bottom: var(--space-8);
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
  padding: 10px 22px;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  text-decoration: none;
  border-radius: 999px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  box-shadow: var(--shadow-sm);
}

.btn-primary {
  background-color: var(--color-sg-success);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-sg-bg-elevated);
  color: var(--color-sg-text);
  border: 1px solid var(--color-sg-border);
}

.btn-secondary:hover {
  background-color: var(--color-sg-bg-hover);
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
  border-radius: 16px;
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(8px);
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

.hero-visual {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-10);
}

.window {
  width: min(520px, 100%);
  background: var(--color-sg-bg-card);
  border: 1px solid var(--color-sg-border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.window-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: var(--color-sg-bg-elevated);
  border-bottom: 1px solid var(--color-sg-border);
}

.window-dots {
  display: flex;
  gap: 6px;
}

.window-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-sg-border-light);
}

.window-title {
  font-size: var(--text-micro);
  color: var(--color-sg-text-muted);
}

.window-body {
  padding: 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background-color: var(--color-sg-bg-elevated);
  border-radius: 14px;
  border: 1px solid var(--color-sg-border);
}

.metric span {
  font-size: var(--text-micro);
  color: var(--color-sg-text-muted);
}

.metric strong {
  font-size: var(--text-title);
  color: var(--color-sg-text);
}

.chart-spark {
  height: 80px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  align-items: end;
}

.chart-spark span {
  display: block;
  width: 100%;
  border-radius: 999px;
  background-color: var(--color-sg-success);
}

.chart-spark span:nth-child(1) {
  height: 60%;
}

.chart-spark span:nth-child(2) {
  height: 80%;
}

.chart-spark span:nth-child(3) {
  height: 45%;
}

.chart-spark span:nth-child(4) {
  height: 70%;
}

.nav-card:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--color-sg-text);
}
</style>
