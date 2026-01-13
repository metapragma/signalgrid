<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number; // 0-1 range (e.g., 0.05 = 5%)
  isLoading?: boolean;
}>();

const percentage = computed(() => Math.round(props.value * 100 * 100) / 100);
const maxValue = 15;

const status = computed(() => {
  if (percentage.value >= 10) return 'critical';
  if (percentage.value >= 5) return 'degraded';
  return 'healthy';
});

const statusText = computed(() => status.value.charAt(0).toUpperCase() + status.value.slice(1));
const indicatorPosition = computed(() => {
  const clamped = Math.min(Math.max(percentage.value, 0), maxValue);
  const pct = (clamped / maxValue) * 100;
  return Math.min(Math.max(pct, 2), 98);
});
</script>

<template>
  <div class="gauge-container" :class="`status-${status}`">
    <div class="gauge-header">
      <div class="gauge-value">{{ percentage.toFixed(2) }}%</div>
      <div class="gauge-caption">Error rate (last hour)</div>
    </div>

    <div class="gauge-meter">
      <div class="meter-track">
        <div class="track-segment segment-healthy"></div>
        <div class="track-segment segment-degraded"></div>
        <div class="track-segment segment-critical"></div>
        <div
          class="meter-indicator"
          :style="{ left: `${indicatorPosition}%` }"
        >
          <span class="indicator-dot"></span>
        </div>
      </div>
      <div class="meter-scale">
        <span>0%</span>
        <span>5%</span>
        <span>10%</span>
        <span>15%</span>
      </div>
    </div>

    <div class="gauge-status" :class="`status-${status}`">
      {{ statusText }}
    </div>

    <div v-if="isLoading" class="gauge-loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.gauge-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  --indicator-color: var(--color-sg-accent);
  --indicator-glow: var(--color-sg-accent-subtle);
}

.gauge-container.status-healthy {
  --indicator-color: var(--color-sg-success);
  --indicator-glow: var(--color-sg-success-subtle);
}

.gauge-container.status-degraded {
  --indicator-color: var(--color-sg-warn);
  --indicator-glow: var(--color-sg-warn-subtle);
}

.gauge-container.status-critical {
  --indicator-color: var(--color-sg-error);
  --indicator-glow: var(--color-sg-error-subtle);
}

.gauge-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gauge-value {
  font-size: 32px;
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--color-sg-text);
  font-variant-numeric: tabular-nums;
}

.gauge-caption {
  font-size: var(--text-micro);
  color: var(--color-sg-text-muted);
}

.gauge-meter {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meter-track {
  position: relative;
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background-color: var(--color-sg-bg-active);
  border: 1px solid var(--color-sg-border);
}

.track-segment {
  flex: 1;
}

.segment-healthy {
  background-color: var(--color-sg-success);
}

.segment-degraded {
  background-color: var(--color-sg-warn);
}

.segment-critical {
  background-color: var(--color-sg-error);
}

.meter-indicator {
  position: absolute;
  top: -6px;
  transform: translateX(-50%);
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--indicator-color);
  box-shadow: 0 0 0 4px var(--indicator-glow);
  border: 1px solid var(--color-sg-bg-elevated);
}

.meter-scale {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-micro);
  color: var(--color-sg-text-subtle);
  padding: 0 2px;
}

.gauge-status {
  align-self: flex-start;
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  background-color: var(--color-sg-bg-elevated);
}

.gauge-status.status-healthy {
  color: var(--color-sg-success);
}

.gauge-status.status-degraded {
  color: var(--color-sg-warn);
}

.gauge-status.status-critical {
  color: var(--color-sg-error);
}

.gauge-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(251, 250, 247, 0.82);
  border-radius: 16px;
  z-index: 10;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(12, 56, 44, 0.16);
  border-top-color: var(--color-sg-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
