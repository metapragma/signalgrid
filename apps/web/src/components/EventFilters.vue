<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EventFilters } from '../stores/events';

const props = defineProps<{
  modelValue: EventFilters;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: EventFilters];
}>();

const severityOptions = [
  { value: null, label: 'All Severities' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
] as const;

const localSeverity = ref(props.modelValue.severity);
const localType = ref(props.modelValue.type ?? '');

// Debounce type input
let typeTimeout: ReturnType<typeof setTimeout> | null = null;

const onSeverityChange = (event: globalThis.Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value === '' ? null : (target.value as EventFilters['severity']);
  localSeverity.value = value;
  emit('update:modelValue', {
    severity: value,
    type: localType.value || null,
  });
};

const onTypeInput = (event: globalThis.Event) => {
  const target = event.target as HTMLInputElement;
  localType.value = target.value;

  // Debounce the emit
  if (typeTimeout) {
    clearTimeout(typeTimeout);
  }
  typeTimeout = setTimeout(() => {
    emit('update:modelValue', {
      severity: localSeverity.value,
      type: localType.value || null,
    });
  }, 300);
};

const clearType = () => {
  localType.value = '';
  emit('update:modelValue', {
    severity: localSeverity.value,
    type: null,
  });
};

// Sync with external changes
watch(
  () => props.modelValue,
  (newValue) => {
    localSeverity.value = newValue.severity;
    localType.value = newValue.type ?? '';
  },
);
</script>

<template>
  <div class="event-filters">
    <div class="filter-group">
      <label for="severity-filter">Severity</label>
      <select id="severity-filter" :value="localSeverity ?? ''" @change="onSeverityChange">
        <option v-for="option in severityOptions" :key="option.label" :value="option.value ?? ''">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="type-filter">Event Type</label>
      <div class="input-wrapper">
        <input
          id="type-filter"
          type="text"
          :value="localType"
          placeholder="e.g. error.logged"
          @input="onTypeInput"
        />
        <button
          v-if="localType"
          class="clear-btn"
          type="button"
          @click="clearType"
          aria-label="Clear type filter"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-sg-bg-elevated);
}

@media (min-width: 480px) {
  .event-filters {
    flex-direction: row;
    gap: var(--space-4);
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

@media (min-width: 480px) {
  .filter-group {
    flex: 0 0 auto;
  }
}

.filter-group label {
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-sg-text-muted);
}

.filter-group select,
.filter-group input {
  background-color: var(--color-sg-bg-card);
  border: none;
  border-radius: 6px;
  padding: var(--space-2) var(--space-3);
  color: var(--color-sg-text);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  width: 100%;
}

@media (min-width: 480px) {
  .filter-group select,
  .filter-group input {
    min-width: 150px;
    width: auto;
  }
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.filter-group select {
  cursor: pointer;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  padding-right: var(--space-8);
}

.clear-btn {
  position: absolute;
  right: var(--space-2);
  background: none;
  border: none;
  color: var(--color-sg-text-subtle);
  cursor: pointer;
  font-size: var(--text-body);
  padding: 2px var(--space-2);
  line-height: 1;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: var(--color-sg-text);
}
</style>
