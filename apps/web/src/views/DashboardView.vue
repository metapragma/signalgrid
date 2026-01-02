<script setup lang="ts">
import { onMounted, computed, onUnmounted, ref } from 'vue';
import { Activity, AlertTriangle, Clock, RefreshCw, TrendingUp, BarChart3 } from 'lucide-vue-next';
import { useMetricsStore } from '@/stores/metrics';

const metricsStore = useMetricsStore();

const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

const metrics = computed(() => metricsStore.metrics);

const errorRatePercent = computed(() => {
  if (!metrics.value) return 0;
  return Math.round(metrics.value.errorRate * 100 * 100) / 100;
});

const errorRateStatus = computed(() => {
  const rate = errorRatePercent.value;
  if (rate >= 10) return 'error';
  if (rate >= 5) return 'warn';
  return 'success';
});

const maxFingerprintCount = computed(() => {
  if (!metrics.value?.topFingerprints.length) return 1;
  return Math.max(...metrics.value.topFingerprints.map((f) => f.count));
});

const refresh = () => {
  metricsStore.fetchMetrics();
};

onMounted(() => {
  metricsStore.fetchMetrics();
  // Auto-refresh every 30 seconds
  refreshInterval.value = setInterval(() => {
    metricsStore.fetchMetrics();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div class="dashboard-view">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Real-time metrics and analytics</p>
      </div>
      <button class="refresh-btn" :disabled="metricsStore.isLoading" @click="refresh">
        <RefreshCw class="btn-icon" :class="{ spinning: metricsStore.isLoading }" />
        Refresh
      </button>
    </header>

    <!-- Content -->
    <div class="dashboard-content">
      <!-- Error -->
      <div v-if="metricsStore.error" class="error-banner">
        {{ metricsStore.error }}
      </div>

      <!-- Loading state -->
      <div v-if="metricsStore.isLoading && !metrics" class="loading-state">
        <div class="spinner"></div>
      </div>

      <!-- Metrics grid -->
      <div v-else-if="metrics" class="metrics-container">
        <!-- Stats row -->
        <div class="stats-grid">
          <!-- Error Rate Card -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-info">
                <p class="stat-label">Error Rate (1h)</p>
                <p class="stat-value" :class="`status-${errorRateStatus}`">
                  {{ errorRatePercent }}%
                </p>
              </div>
              <div class="stat-icon" :class="`status-${errorRateStatus}`">
                <AlertTriangle />
              </div>
            </div>
          </div>

          <!-- p50 Latency Card -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-info">
                <p class="stat-label">p50 Interval</p>
                <p class="stat-value">
                  {{ metrics.latencyMs.p50 }}<span class="stat-unit">ms</span>
                </p>
              </div>
              <div class="stat-icon accent">
                <Clock />
              </div>
            </div>
          </div>

          <!-- p99 Latency Card -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-info">
                <p class="stat-label">p99 Interval</p>
                <p class="stat-value">
                  {{ metrics.latencyMs.p99 }}<span class="stat-unit">ms</span>
                </p>
              </div>
              <div class="stat-icon accent">
                <TrendingUp />
              </div>
            </div>
          </div>
        </div>

        <!-- Latency percentiles bar chart -->
        <div class="chart-card">
          <h2 class="card-title">
            <Clock class="title-icon" />
            Event Interval Percentiles
          </h2>
          <div class="percentile-bars">
            <div class="percentile-row">
              <span class="percentile-label">p50</span>
              <div class="percentile-bar-bg">
                <div
                  class="percentile-bar"
                  :style="{
                    width: `${Math.min(100, (metrics.latencyMs.p50 / Math.max(metrics.latencyMs.p99, 1)) * 100)}%`,
                  }"
                ></div>
              </div>
              <span class="percentile-value">{{ metrics.latencyMs.p50 }}ms</span>
            </div>
            <div class="percentile-row">
              <span class="percentile-label">p95</span>
              <div class="percentile-bar-bg">
                <div
                  class="percentile-bar opacity-70"
                  :style="{
                    width: `${Math.min(100, (metrics.latencyMs.p95 / Math.max(metrics.latencyMs.p99, 1)) * 100)}%`,
                  }"
                ></div>
              </div>
              <span class="percentile-value">{{ metrics.latencyMs.p95 }}ms</span>
            </div>
            <div class="percentile-row">
              <span class="percentile-label">p99</span>
              <div class="percentile-bar-bg">
                <div class="percentile-bar opacity-50" style="width: 100%"></div>
              </div>
              <span class="percentile-value">{{ metrics.latencyMs.p99 }}ms</span>
            </div>
          </div>
        </div>

        <!-- Top fingerprints -->
        <div class="chart-card">
          <h2 class="card-title">
            <Activity class="title-icon" />
            Top Event Fingerprints (1h)
          </h2>

          <div v-if="metrics.topFingerprints.length === 0" class="empty-chart">
            No events in the last hour
          </div>

          <div v-else class="fingerprints-list">
            <div
              v-for="(fp, index) in metrics.topFingerprints"
              :key="fp.fingerprint"
              class="fingerprint-row"
            >
              <span class="fingerprint-rank">{{ index + 1 }}</span>
              <div class="fingerprint-content">
                <span class="fingerprint-name">{{ fp.fingerprint }}</span>
                <div class="fingerprint-bar-bg">
                  <div
                    class="fingerprint-bar"
                    :style="{ width: `${(fp.count / maxFingerprintCount) * 100}%` }"
                  ></div>
                </div>
              </div>
              <span class="fingerprint-count">{{ fp.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <BarChart3 />
        </div>
        <h2>No metrics available</h2>
        <p>Metrics will appear once events are recorded</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  min-height: calc(100vh - 56px);
  background-color: var(--color-sg-bg);
}

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 16px;
  border-bottom: 1px solid var(--color-sg-border);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 32px 24px;
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-sg-text);
  letter-spacing: -0.03em;
}

@media (min-width: 768px) {
  .page-title {
    font-size: 40px;
  }
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: transparent;
  border: 1px solid var(--color-sg-border);
  border-radius: 8px;
  color: var(--color-sg-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: var(--color-sg-bg-hover);
  border-color: var(--color-sg-border-light);
  color: var(--color-sg-text);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Content */
.dashboard-content {
  padding: 24px 16px;
}

@media (min-width: 768px) {
  .dashboard-content {
    padding: 24px;
  }
}

.error-banner {
  margin-bottom: 24px;
  padding: 12px 16px;
  background-color: var(--color-sg-error-muted);
  border: 1px solid var(--color-sg-error);
  border-radius: 8px;
  color: var(--color-sg-error);
  font-size: 14px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-sg-border);
  border-top-color: var(--color-sg-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Metrics Container */
.metrics-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-sg-text-muted);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-sg-text);
  font-variant-numeric: tabular-nums;
}

.stat-value.status-success {
  color: var(--color-sg-open);
}

.stat-value.status-warn {
  color: var(--color-sg-warn);
}

.stat-value.status-error {
  color: var(--color-sg-error);
}

.stat-unit {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-sg-text-subtle);
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
}

.stat-icon.status-success {
  background-color: rgba(63, 185, 80, 0.15);
  color: var(--color-sg-open);
}

.stat-icon.status-warn {
  background-color: rgba(210, 153, 34, 0.15);
  color: var(--color-sg-warn);
}

.stat-icon.status-error {
  background-color: rgba(248, 81, 73, 0.15);
  color: var(--color-sg-error);
}

.stat-icon.accent {
  background-color: rgba(34, 211, 238, 0.15);
  color: var(--color-sg-accent);
}

/* Chart Cards */
.chart-card {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-sg-text-muted);
  margin-bottom: 20px;
}

.title-icon {
  width: 16px;
  height: 16px;
}

/* Percentile Bars */
.percentile-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.percentile-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.percentile-label {
  width: 32px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-sg-text-subtle);
}

.percentile-bar-bg {
  flex: 1;
  height: 24px;
  background-color: var(--color-sg-bg-card);
  border-radius: 6px;
  overflow: hidden;
}

.percentile-bar {
  height: 100%;
  background-color: var(--color-sg-accent);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.percentile-bar.opacity-70 {
  opacity: 0.7;
}

.percentile-bar.opacity-50 {
  opacity: 0.5;
}

.percentile-value {
  width: 80px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--color-sg-text);
}

/* Fingerprints List */
.fingerprints-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fingerprint-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fingerprint-rank {
  width: 20px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-sg-text-subtle);
}

.fingerprint-content {
  flex: 1;
  min-width: 0;
}

.fingerprint-name {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-sg-accent);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fingerprint-bar-bg {
  height: 8px;
  background-color: var(--color-sg-bg-card);
  border-radius: 4px;
  overflow: hidden;
}

.fingerprint-bar {
  height: 100%;
  background-color: var(--color-sg-accent);
  opacity: 0.6;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.fingerprint-count {
  width: 48px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--color-sg-text-muted);
}

.empty-chart {
  text-align: center;
  padding: 32px;
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-sg-bg-elevated);
  border-radius: 12px;
  margin-bottom: 16px;
  color: var(--color-sg-text-muted);
}

.empty-icon svg {
  width: 28px;
  height: 28px;
}

.empty-state h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-sg-text);
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}
</style>
