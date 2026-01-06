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
  box-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
}

/* Status colors - refined palette */
.status-healthy {
  color: #34d399; /* emerald-400 */
}

.status-degraded {
  color: #fbbf24; /* amber-400 */
}

.status-critical {
  color: #fb7185; /* rose-400 */
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
    box-shadow: 0 0 10px currentColor, 0 0 20px rgba(52, 211, 153, 0.2);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 18px currentColor, 0 0 35px rgba(52, 211, 153, 0.35);
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
    box-shadow: 0 0 12px currentColor, 0 0 22px rgba(251, 191, 36, 0.2);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 22px currentColor, 0 0 40px rgba(251, 191, 36, 0.35);
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
    box-shadow: 0 0 15px currentColor, 0 0 30px rgba(251, 113, 133, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 28px currentColor, 0 0 50px rgba(251, 113, 133, 0.45);
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
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  margin-bottom: var(--space-1);
}

.status-healthy .health-label {
  color: #34d399;
}

.status-degraded .health-label {
  color: #fbbf24;
}

.status-critical .health-label {
  color: #fb7185;
}

.health-description {
  font-size: var(--text-micro);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-muted);
}
</style>
