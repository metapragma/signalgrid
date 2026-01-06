<script setup lang="ts">
import { onMounted, computed, onUnmounted, ref } from 'vue';
import { Activity, Clock, RefreshCw, TrendingUp, BarChart3 } from 'lucide-vue-next';
import { useMetricsStore } from '@/stores/metrics';
import { useEventsStore } from '@/stores/events';
import { useTimeSeries } from '@/composables/useTimeSeries';
import EventVolumeChart from '@/components/dashboard/EventVolumeChart.vue';
import ErrorRateGauge from '@/components/dashboard/ErrorRateGauge.vue';
import SystemHealthPulse from '@/components/dashboard/SystemHealthPulse.vue';
import EventFlowVis from '@/components/dashboard/EventFlowVis.vue';

const metricsStore = useMetricsStore();
const eventsStore = useEventsStore();

// Time series data for the chart
const {
  buckets: timeSeriesBuckets,
  isLoading: isTimeSeriesLoading,
  fetch: fetchTimeSeries,
} = useTimeSeries({
  interval: '1m',
  duration: '1h',
  autoRefresh: true,
  refreshInterval: 30000,
});

const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

const metrics = computed(() => metricsStore.metrics);

const maxFingerprintCount = computed(() => {
  if (!metrics.value?.topFingerprints.length) return 1;
  return Math.max(...metrics.value.topFingerprints.map((f) => f.count));
});

// Latest event for particle system
const latestEvent = computed(() => {
  const event = eventsStore.events[0];
  if (!event) return null;
  return {
    ts: event.ts,
    severity: event.severity as 'debug' | 'info' | 'warn' | 'error',
  };
});

const refresh = async () => {
  await Promise.all([metricsStore.fetchMetrics(), fetchTimeSeries()]);
};

onMounted(async () => {
  // Fetch initial data
  await Promise.all([metricsStore.fetchMetrics(), fetchTimeSeries()]);

  // Auto-refresh ops metrics every 30 seconds
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
        <!-- Hero section: Health + Gauge -->
        <div class="hero-grid">
          <!-- System Health Pulse -->
          <div class="chart-card hero-card">
            <h2 class="card-title">System Health</h2>
            <SystemHealthPulse
              :error-rate="metrics.errorRate"
              :open-incidents="metrics.openIncidentCount"
              :is-loading="metricsStore.isLoading"
            />
          </div>

          <!-- Error Rate Gauge -->
          <div class="chart-card hero-card">
            <h2 class="card-title">Error Rate (1h)</h2>
            <ErrorRateGauge :value="metrics.errorRate" :is-loading="metricsStore.isLoading" />
          </div>

          <!-- Event Flow Visualization -->
          <div class="chart-card hero-card flow-card">
            <EventFlowVis :latest-event="latestEvent" />
          </div>
        </div>

        <!-- Event Volume Chart -->
        <div class="chart-card">
          <h2 class="card-title">
            <TrendingUp class="title-icon" />
            Event Volume (Last Hour)
          </h2>
          <EventVolumeChart :buckets="timeSeriesBuckets" :is-loading="isTimeSeriesLoading" />
        </div>

        <!-- Stats row -->
        <div class="stats-grid">
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

          <!-- p95 Latency Card -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-info">
                <p class="stat-label">p95 Interval</p>
                <p class="stat-value">
                  {{ metrics.latencyMs.p95 }}<span class="stat-unit">ms</span>
                </p>
              </div>
              <div class="stat-icon accent">
                <TrendingUp />
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
                <Clock />
              </div>
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
  gap: var(--space-4);
  padding: var(--space-8) var(--space-4) var(--space-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-12) var(--space-8) var(--space-8);
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.page-title {
  font-size: var(--text-display);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-display);
  color: var(--color-sg-text);
  letter-spacing: var(--tracking-tight);
}

@media (min-width: 768px) {
  .page-title {
    font-size: 36px;
  }
}

.page-subtitle {
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-sg-text-subtle);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-sg-bg-elevated);
  border: none;
  border-radius: 8px;
  color: var(--color-sg-text-muted);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: var(--color-sg-bg-hover);
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
  padding: var(--space-6) var(--space-4);
}

@media (min-width: 768px) {
  .dashboard-content {
    padding: var(--space-6);
  }
}

.error-banner {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background-color: var(--color-sg-error-muted);
  border-radius: 12px;
  color: var(--color-sg-error);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-sg-bg-hover);
  border-top-color: var(--color-sg-text-muted);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Metrics Container */
.metrics-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 1400px;
}

/* Hero Grid - Health, Gauge, Flow */
.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.hero-card {
  display: flex;
  flex-direction: column;
}

.flow-card {
  padding: var(--space-4);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background-color: var(--color-sg-bg-card);
  border-radius: 16px;
  padding: var(--space-6);
}

.stat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat-label {
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-sg-text-subtle);
}

.stat-value {
  font-size: var(--text-hero);
  font-weight: var(--weight-light);
  line-height: var(--leading-hero);
  letter-spacing: var(--tracking-tight);
  color: var(--color-sg-text);
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: var(--text-title);
  font-weight: var(--weight-regular);
  color: var(--color-sg-text-subtle);
  margin-left: 2px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--color-sg-text-subtle);
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon.accent {
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--color-sg-text-subtle);
}

/* Chart Cards */
.chart-card {
  background-color: var(--color-sg-bg-card);
  border-radius: 16px;
  padding: var(--space-6);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-sg-text-subtle);
  margin-bottom: var(--space-4);
}

.title-icon {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

/* Fingerprints List */
.fingerprints-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fingerprint-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.fingerprint-rank {
  width: 20px;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
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
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fingerprint-bar-bg {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.fingerprint-bar {
  height: 100%;
  background-color: var(--color-sg-text-subtle);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.fingerprint-count {
  width: 48px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: var(--text-body);
  font-variant-numeric: tabular-nums;
  color: var(--color-sg-text-muted);
}

.empty-chart {
  text-align: center;
  padding: var(--space-8);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-6);
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
  margin-bottom: var(--space-4);
  color: var(--color-sg-text-muted);
}

.empty-icon svg {
  width: 28px;
  height: 28px;
}

.empty-state h2 {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-title);
  color: var(--color-sg-text);
  margin-bottom: var(--space-1);
}

.empty-state p {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}
</style>
