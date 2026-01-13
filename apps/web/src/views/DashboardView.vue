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
    <header class="page-header enter-rise">
      <div class="header-content">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Operational signals for the last hour</p>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" :disabled="metricsStore.isLoading" @click="refresh">
          <RefreshCw class="btn-icon" :class="{ spinning: metricsStore.isLoading }" />
          Refresh
        </button>
      </div>
    </header>

    <!-- Content -->
    <div class="dashboard-content enter-rise delay-1">
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
        <section class="overview-card">
          <div class="overview-left">
            <p class="eyebrow">Overview</p>
            <h2 class="overview-title">Live operational health</h2>
            <p class="overview-subtitle">The last hour of streaming signals, summarized.</p>
            <div class="overview-stats">
              <div class="stat-pill">
                <span class="stat-pill-label">Open incidents</span>
                <strong class="stat-pill-value">{{ metrics.openIncidentCount }}</strong>
              </div>
              <div class="stat-pill">
                <span class="stat-pill-label">Error rate</span>
                <strong class="stat-pill-value">{{ (metrics.errorRate * 100).toFixed(2) }}%</strong>
              </div>
              <div class="stat-pill">
                <span class="stat-pill-label">p50 interval</span>
                <strong class="stat-pill-value">{{ metrics.latencyMs.p50 }}ms</strong>
              </div>
            </div>
          </div>
          <div class="overview-right">
            <SystemHealthPulse
              :error-rate="metrics.errorRate"
              :open-incidents="metrics.openIncidentCount"
              :is-loading="metricsStore.isLoading"
            />
          </div>
        </section>

        <section class="main-grid">
          <div class="main-left">
            <div class="chart-card wide">
              <div class="card-header-row">
                <div>
                  <h3 class="card-title">Event volume</h3>
                  <p class="card-subtitle">Trends across severity levels</p>
                </div>
                <span class="card-chip">Last 60 minutes</span>
              </div>
              <EventVolumeChart :buckets="timeSeriesBuckets" :is-loading="isTimeSeriesLoading" />
            </div>

            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-header">
                  <div class="stat-info">
                    <p class="stat-label">p95 interval</p>
                    <p class="stat-value">
                      {{ metrics.latencyMs.p95 }}<span class="stat-unit">ms</span>
                    </p>
                  </div>
                  <div class="stat-icon accent">
                    <TrendingUp />
                  </div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-header">
                  <div class="stat-info">
                    <p class="stat-label">p99 interval</p>
                    <p class="stat-value">
                      {{ metrics.latencyMs.p99 }}<span class="stat-unit">ms</span>
                    </p>
                  </div>
                  <div class="stat-icon accent">
                    <Clock />
                  </div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-header">
                  <div class="stat-info">
                    <p class="stat-label">Active signals</p>
                    <p class="stat-value">
                      {{ metrics.topFingerprints.length }}<span class="stat-unit">types</span>
                    </p>
                  </div>
                  <div class="stat-icon accent">
                    <Activity />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="main-right">
            <div class="panel-card">
              <h3 class="panel-title">Error rate</h3>
              <ErrorRateGauge :value="metrics.errorRate" :is-loading="metricsStore.isLoading" />
            </div>
            <div class="panel-card">
              <h3 class="panel-title">Event flow</h3>
              <EventFlowVis :latest-event="latestEvent" />
            </div>
          </div>
        </section>

        <section class="chart-card fingerprints-card">
          <div class="card-header-row">
            <div>
              <h3 class="card-title">Top fingerprints</h3>
              <p class="card-subtitle">Highest volume sources in the last hour</p>
            </div>
          </div>

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
        </section>
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
  min-height: calc(100vh - 64px);
  background-color: transparent;
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
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  background-color: var(--color-sg-accent);
  border: none;
  border-radius: 999px;
  color: white;
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
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
  border-radius: 16px;
  border: 1px solid rgba(255, 69, 58, 0.2);
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
  border: 2px solid rgba(15, 23, 42, 0.12);
  border-top-color: var(--color-sg-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Metrics Container */
.metrics-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Overview */
.overview-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  padding: var(--space-8);
  background-color: var(--color-sg-bg-card);
  border-radius: 24px;
  border: 1px solid var(--color-sg-border);
  box-shadow: var(--shadow-lg);
}

@media (min-width: 1024px) {
  .overview-card {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
  }
}

.overview-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.eyebrow {
  font-size: var(--text-micro);
  color: var(--color-sg-text-subtle);
}

.overview-title {
  font-size: 28px;
  font-weight: var(--weight-semibold);
  color: var(--color-sg-text);
}

.overview-subtitle {
  font-size: var(--text-body);
  color: var(--color-sg-text-muted);
}

.overview-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.stat-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-sg-border);
  min-width: 140px;
}

.stat-pill-label {
  font-size: var(--text-micro);
  color: var(--color-sg-text-subtle);
}

.stat-pill-value {
  font-size: var(--text-title);
  color: var(--color-sg-text);
}

.overview-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Stats Grid */
/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .main-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.main-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.main-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.card-subtitle {
  font-size: var(--text-body);
  color: var(--color-sg-text-muted);
}

.card-chip {
  font-size: var(--text-micro);
  color: var(--color-sg-text-subtle);
  border: 1px solid var(--color-sg-border);
  padding: 4px 10px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.9);
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background-color: var(--color-sg-bg-card);
  border-radius: 18px;
  padding: var(--space-6);
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(16px);
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
  color: var(--color-sg-text-muted);
}

.stat-value {
  font-size: 36px;
  font-weight: var(--weight-semibold);
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
  border-radius: 12px;
  background-color: var(--color-sg-accent-subtle);
  color: var(--color-sg-accent);
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon.accent {
  background-color: var(--color-sg-accent-subtle);
  color: var(--color-sg-accent);
}

/* Chart Cards */
.chart-card {
  background-color: var(--color-sg-bg-card);
  border-radius: 18px;
  padding: var(--space-6);
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(16px);
}

.chart-card.wide {
  min-height: 360px;
}

.card-title {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  color: var(--color-sg-text);
  margin-bottom: var(--space-1);
}

.title-icon {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

.panel-card {
  background-color: var(--color-sg-bg-card);
  border-radius: 18px;
  padding: var(--space-6);
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(16px);
}

.fingerprints-card {
  padding-top: var(--space-6);
}

.panel-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  color: var(--color-sg-text-secondary);
  margin-bottom: var(--space-4);
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
  background-color: rgba(15, 23, 42, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.fingerprint-bar {
  height: 100%;
  background-color: var(--color-sg-accent);
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
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  border: 1px solid var(--color-sg-border);
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
