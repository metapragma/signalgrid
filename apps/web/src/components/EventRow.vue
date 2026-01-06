<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from '@signalgrid/sdk';

const props = defineProps<{
  event: Event;
}>();

const formattedTime = computed(() => {
  const date = new Date(props.event.ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
});

const severityClass = computed(() => {
  return `severity-${props.event.severity}`;
});

const payloadPreview = computed(() => {
  const payload = props.event.payload;
  if (!payload || typeof payload !== 'object') return '';

  // Show a brief preview of the payload
  const preview = JSON.stringify(payload);
  return preview.length > 100 ? preview.slice(0, 100) + '...' : preview;
});
</script>

<template>
  <div class="event-row" :class="severityClass">
    <span class="event-time">{{ formattedTime }}</span>
    <span class="event-severity">{{ event.severity.charAt(0).toUpperCase() + event.severity.slice(1) }}</span>
    <span class="event-type">{{ event.type }}</span>
    <span class="event-payload">{{ payloadPreview }}</span>
  </div>
</template>

<style scoped>
.event-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  align-items: center;
  transition: background-color 0.15s ease;
  border-left: 2px solid transparent;
}

@media (min-width: 640px) {
  .event-row {
    display: grid;
    grid-template-columns: 80px 60px minmax(120px, 200px) 1fr;
    gap: var(--space-3);
    flex-wrap: nowrap;
  }
}

.event-row:hover {
  background-color: var(--color-sg-bg-hover);
}

.event-time {
  color: var(--color-sg-text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.event-severity {
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  padding: 2px var(--space-2);
  border-radius: 3px;
  text-align: center;
  flex-shrink: 0;
}

.event-type {
  color: var(--color-sg-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.event-payload {
  color: var(--color-sg-text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .event-payload {
    width: auto;
    flex-shrink: 1;
  }
}

/* Severity colors */
.severity-debug .event-severity {
  background-color: var(--color-sg-debug-muted);
  color: var(--color-sg-text-subtle);
}

.severity-info .event-severity {
  background-color: var(--color-sg-info-muted);
  color: var(--color-sg-info);
}

.severity-warn .event-severity {
  background-color: var(--color-sg-warn-muted);
  color: var(--color-sg-warn);
}

.severity-error .event-severity {
  background-color: var(--color-sg-error-muted);
  color: var(--color-sg-error);
}

/* Row highlight based on severity */
.severity-error {
  background-color: var(--color-sg-error-subtle);
  border-left-color: var(--color-sg-error);
}

.severity-warn {
  background-color: var(--color-sg-warn-subtle);
  border-left-color: var(--color-sg-warn);
}
</style>
