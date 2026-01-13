<script setup lang="ts">
import { computed } from 'vue';

type HealthStatus = 'healthy' | 'degraded' | 'critical';

const props = defineProps<{
  errorRate: number; // 0-1 range
  openIncidents?: number;
  isLoading?: boolean;
}>();

const status = computed<HealthStatus>(() => {
  const rate = props.errorRate * 100;
  const incidents = props.openIncidents ?? 0;

  // Critical: high error rate OR multiple open incidents
  if (rate >= 10 || incidents >= 3) return 'critical';
  // Degraded: moderate error rate OR any open incidents
  if (rate >= 5 || incidents >= 1) return 'degraded';
  return 'healthy';
});

const statusLabel = computed(() => {
  switch (status.value) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
});

const statusDescription = computed(() => {
  switch (status.value) {
    case 'healthy':
      return 'All systems operational';
    case 'degraded':
      return 'Elevated error rate detected';
    case 'critical':
      return 'High error rate - immediate attention needed';
    default:
      return 'Status unavailable';
  }
});

// Pulse animation speed based on status
const pulseClass = computed(() => `pulse-${status.value}`);
</script>

<template>
  <div class="health-pulse-container" :class="[`status-${status}`, { loading: isLoading }]">
    <!-- Animated rings -->
    <div class="pulse-rings">
      <div class="ring ring-outer" :class="pulseClass"></div>
      <div class="ring ring-middle" :class="pulseClass"></div>
      <div class="ring ring-inner" :class="pulseClass"></div>
      <div class="core" :class="pulseClass"></div>
    </div>

    <!-- Status text -->
    <div class="health-info">
      <div class="health-label">{{ statusLabel }}</div>
      <div class="health-description">{{ statusDescription }}</div>
    </div>
  </div>
</template>

<style scoped>
.health-pulse-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6);
}

.health-pulse-container.loading {
  opacity: 0.5;
}

/* Pulse rings container */
.pulse-rings {
  position: relative;
  width: 120px;
  height: 120px;
}

/* Base ring styles */
.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
}

.ring-outer {
  inset: 0;
}

.ring-middle {
  inset: 15px;
}

.ring-inner {
  inset: 30px;
}

.core {
  position: absolute;
  inset: 42px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 12px currentColor, 0 0 18px var(--pulse-glow);
}

/* Status colors - neon palette */
.status-healthy {
  color: var(--color-sg-success);
  --pulse-glow: rgba(46, 230, 166, 0.28);
}

.status-degraded {
  color: var(--color-sg-warn);
  --pulse-glow: rgba(240, 163, 67, 0.28);
}

.status-critical {
  color: var(--color-sg-error);
  --pulse-glow: rgba(255, 59, 48, 0.28);
}

/* Healthy pulse - slow, calm */
.pulse-healthy {
  animation: pulse-healthy 3s ease-in-out infinite;
}

.ring-outer.pulse-healthy {
  animation-delay: 0s;
}

.ring-middle.pulse-healthy {
  animation-delay: 0.4s;
}

.ring-inner.pulse-healthy {
  animation-delay: 0.8s;
}

.core.pulse-healthy {
  animation: glow-healthy 3s ease-in-out infinite;
}

@keyframes pulse-healthy {
  0%,
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 0.6;
  }
}

@keyframes glow-healthy {
  0%,
  100% {
    box-shadow: 0 0 8px currentColor, 0 0 16px var(--pulse-glow);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 14px currentColor, 0 0 24px var(--pulse-glow);
    transform: scale(1.03);
  }
}

/* Degraded pulse - moderate speed */
.pulse-degraded {
  animation: pulse-degraded 1.5s ease-in-out infinite;
}

.ring-outer.pulse-degraded {
  animation-delay: 0s;
}

.ring-middle.pulse-degraded {
  animation-delay: 0.2s;
}

.ring-inner.pulse-degraded {
  animation-delay: 0.4s;
}

.core.pulse-degraded {
  animation: glow-degraded 1.5s ease-in-out infinite;
}

@keyframes pulse-degraded {
  0%,
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 0.7;
  }
}

@keyframes glow-degraded {
  0%,
  100% {
    box-shadow: 0 0 10px currentColor, 0 0 18px var(--pulse-glow);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px currentColor, 0 0 26px var(--pulse-glow);
    transform: scale(1.05);
  }
}

/* Critical pulse - fast, urgent */
.pulse-critical {
  animation: pulse-critical 0.8s ease-in-out infinite;
}

.ring-outer.pulse-critical {
  animation-delay: 0s;
}

.ring-middle.pulse-critical {
  animation-delay: 0.1s;
}

.ring-inner.pulse-critical {
  animation-delay: 0.2s;
}

.core.pulse-critical {
  animation: glow-critical 0.8s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@keyframes glow-critical {
  0%,
  100% {
    box-shadow: 0 0 12px currentColor, 0 0 20px var(--pulse-glow);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px currentColor, 0 0 32px var(--pulse-glow);
    transform: scale(1.07);
  }
}

/* Health info text */
.health-info {
  text-align: center;
}

.health-label {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  margin-bottom: var(--space-1);
}

.status-healthy .health-label {
  color: var(--color-sg-success);
}

.status-degraded .health-label {
  color: var(--color-sg-warn);
}

.status-critical .health-label {
  color: var(--color-sg-error);
}

.health-description {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}
</style>
