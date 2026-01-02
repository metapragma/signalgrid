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
  gap: 12px;
  padding: 12px 16px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
}

@media (min-width: 480px) {
  .event-filters {
    flex-direction: row;
    gap: 16px;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

@media (min-width: 480px) {
  .filter-group {
    flex: 0 0 auto;
  }
}

.filter-group label {
  font-size: 11px;
  text-transform: uppercase;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.filter-group select,
.filter-group input {
  background-color: #252525;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px 10px;
  color: #e0e0e0;
  font-size: 14px;
  width: 100%;
}

@media (min-width: 480px) {
  .filter-group select,
  .filter-group input {
    min-width: 150px;
    width: auto;
    font-size: 13px;
    padding: 6px 10px;
  }
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #5eaeff;
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
  padding-right: 28px;
}

.clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
  line-height: 1;
}

.clear-btn:hover {
  color: #fff;
}
</style>
