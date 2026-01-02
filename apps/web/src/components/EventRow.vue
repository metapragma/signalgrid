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
    <span class="event-severity">{{ event.severity }}</span>
    <span class="event-type">{{ event.type }}</span>
    <span class="event-payload">{{ payloadPreview }}</span>
  </div>
</template>

<style scoped>
.event-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a2a;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
  align-items: center;
  transition: background-color 0.15s ease;
}

@media (min-width: 640px) {
  .event-row {
    display: grid;
    grid-template-columns: 80px 60px minmax(120px, 200px) 1fr;
    gap: 12px;
    flex-wrap: nowrap;
  }
}

.event-row:hover {
  background-color: #1a1a2e;
}

.event-time {
  color: #888;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.event-severity {
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;
  flex-shrink: 0;
}

.event-type {
  color: #7eb8da;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.event-payload {
  color: #666;
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
  background-color: #2d2d44;
  color: #8888aa;
}

.severity-info .event-severity {
  background-color: #1e3a5f;
  color: #5eaeff;
}

.severity-warn .event-severity {
  background-color: #4a3f00;
  color: #ffc107;
}

.severity-error .event-severity {
  background-color: #4a1515;
  color: #ff5252;
}

/* Row highlight based on severity */
.severity-error {
  background-color: rgba(255, 82, 82, 0.05);
}

.severity-warn {
  background-color: rgba(255, 193, 7, 0.03);
}
</style>
