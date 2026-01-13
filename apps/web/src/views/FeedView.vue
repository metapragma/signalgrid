<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Rss, RefreshCw, X, Download, ChevronUp, Search, MoreHorizontal } from 'lucide-vue-next';
import { useEventsStore, type EventFilters } from '@/stores/events';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

// Local filter state
const localSeverity = ref<EventFilters['severity']>(null);
const localType = ref('');
const payloadSearch = ref('');
const timeRange = ref<'live' | '1h' | '24h'>('live');

const timeRanges = [
  { value: 'live', label: 'Live' },
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
] as const;

const severityOptions = [
  { value: null, label: 'All' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
] as const;

// Connection status
const statusClass = computed(() => {
  switch (eventsStore.connectionStatus) {
    case 'connected':
      return 'status-connected';
    case 'connecting':
      return 'status-connecting';
    case 'error':
      return 'status-error';
    default:
      return 'status-disconnected';
  }
});

const statusText = computed(() => {
  switch (eventsStore.connectionStatus) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
});

// New events indicator
const hasNewEvents = ref(false);
const newEventsCount = ref(0);
const isScrolledDown = ref(false);
let lastEventCount = 0;

// Server time
const serverTime = ref(new Date());
const serverTimeInterval = ref<ReturnType<typeof setInterval> | null>(null);

const formattedServerTime = computed(() => {
  return serverTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
});

const timeRangeLabel = computed(() => {
  return timeRanges.find((range) => range.value === timeRange.value)?.label ?? 'Live';
});

// Initialize filters from URL
const initFiltersFromUrl = () => {
  const severity = route.query.severity as EventFilters['severity'] | undefined;
  const type = route.query.type as string | undefined;

  if (severity) localSeverity.value = severity;
  if (type) localType.value = type;

  if (severity || type) {
    eventsStore.setFilters({
      severity: severity ?? null,
      type: type ?? null,
    });
  }
};

// Apply filters
const applyFilters = () => {
  const filters: EventFilters = {
    severity: localSeverity.value,
    type: localType.value || null,
  };
  eventsStore.setFilters(filters);

  // Sync to URL
  const query: Record<string, string> = {};
  if (filters.severity) query.severity = filters.severity;
  if (filters.type) query.type = filters.type;
  router.replace({ query });
};

// Clear filters
const clearFilters = () => {
  localSeverity.value = null;
  localType.value = '';
  payloadSearch.value = '';
  eventsStore.setFilters({ severity: null, type: null });
  router.replace({ query: {} });
  closeActionMenu();
};

// Filter payload locally (client-side search)
const filteredEvents = computed(() => {
  let list = eventsStore.events;
  if (timeRange.value !== 'live') {
    const now = Date.now();
    const windowMs = timeRange.value === '1h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    list = list.filter((event) => new Date(event.ts).getTime() >= now - windowMs);
  }
  if (!payloadSearch.value.trim()) return list;
  const search = payloadSearch.value.toLowerCase();
  return list.filter((event) => {
    const payloadStr = JSON.stringify(event.payload).toLowerCase();
    return payloadStr.includes(search) || event.type.toLowerCase().includes(search);
  });
});

// Handle scroll for new events indicator
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  isScrolledDown.value = target.scrollTop > 100;

  // Load more when near bottom
  const { scrollTop, scrollHeight, clientHeight } = target;
  if (scrollHeight - scrollTop - clientHeight < 200) {
    if (eventsStore.hasMore && !eventsStore.isLoadingHistory) {
      eventsStore.loadHistory();
    }
  }
};

const scrollToTop = () => {
  const container = document.querySelector('.events-table-container');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
  hasNewEvents.value = false;
  newEventsCount.value = 0;
};

// Watch for new events
watch(
  () => eventsStore.events.length,
  (newCount) => {
    if (newCount > lastEventCount && isScrolledDown.value) {
      hasNewEvents.value = true;
      newEventsCount.value = newCount - lastEventCount;
    }
    lastEventCount = newCount;
  },
);

// Format timestamp with milliseconds
const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  return (
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) +
    '.' +
    date.getMilliseconds().toString().padStart(3, '0')
  );
};

// Get severity badge class
const getSeverityClass = (severity: string) => {
  return `severity-${severity}`;
};

// Reconnect
const reconnect = () => {
  eventsStore.connect();
};

const setSeverity = (value: EventFilters['severity']) => {
  localSeverity.value = value;
  applyFilters();
};

let typeTimeout: ReturnType<typeof setTimeout> | null = null;
const onTypeInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  localType.value = target.value;
  if (typeTimeout) clearTimeout(typeTimeout);
  typeTimeout = setTimeout(() => applyFilters(), 250);
};

const actionMenuOpen = ref(false);
const actionMenuRef = ref<HTMLElement | null>(null);
const demoEnabled = import.meta.env.DEV;

const toggleActionMenu = () => {
  actionMenuOpen.value = !actionMenuOpen.value;
};

const closeActionMenu = () => {
  actionMenuOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (actionMenuRef.value && !actionMenuRef.value.contains(target)) {
    closeActionMenu();
  }
};

onMounted(() => {
  initFiltersFromUrl();
  if (demoEnabled) {
    eventsStore.startDemoStream();
  }
  eventsStore.connect();
  eventsStore.loadHistory();
  lastEventCount = eventsStore.events.length;
  document.addEventListener('click', handleClickOutside);

  // Update server time every second
  serverTimeInterval.value = setInterval(() => {
    serverTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  eventsStore.disconnect();
  if (demoEnabled) {
    eventsStore.stopDemoStream();
  }
  if (serverTimeInterval.value) {
    clearInterval(serverTimeInterval.value);
  }
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="feed-view">
    <!-- Page Header -->
    <header class="page-header enter-rise">
      <div class="page-title">
        <Rss class="title-icon" />
        <h1>Live Feed</h1>
      </div>

      <div class="connection-info">
        <div class="status-pill" :class="statusClass">
          <span class="status-dot"></span>
          <span class="status-label">Status: {{ statusText }}</span>
        </div>
        <button class="reconnect-btn" @click="reconnect">
          <RefreshCw class="btn-icon" />
          Reconnect
        </button>
      </div>
    </header>

    <!-- Filters Bar -->
    <div class="filters-bar enter-rise delay-1">
      <div class="filters-left">
        <div class="segmented">
          <button
            v-for="option in severityOptions"
            :key="option.label"
            type="button"
            class="segment"
            :class="{ active: localSeverity === option.value }"
            @click="setSeverity(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="filter-pill">
          <Search class="pill-icon" />
          <input
            v-model="localType"
            type="text"
            placeholder="Type filter"
            class="pill-input"
            @input="onTypeInput"
          />
        </div>

        <div class="filter-pill">
          <Search class="pill-icon" />
          <input
            v-model="payloadSearch"
            type="text"
            placeholder="Filter payload..."
            class="pill-input"
          />
        </div>

        <div class="segmented time-range">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            type="button"
            class="segment"
            :class="{ active: timeRange === range.value }"
            @click="timeRange = range.value"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <div ref="actionMenuRef" class="filters-right">
        <button class="menu-trigger" type="button" @click.stop="toggleActionMenu">
          <MoreHorizontal class="btn-icon" />
        </button>
        <div v-if="actionMenuOpen" class="action-menu" @click.stop>
          <button type="button" class="action-item" @click="clearFilters">
            <X class="btn-icon" />
            Clear filters
          </button>
          <button type="button" class="action-item">
            <Download class="btn-icon" />
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div class="events-table-wrapper">
      <!-- New Events Indicator -->
      <button v-if="hasNewEvents" class="new-events-btn" @click="scrollToTop">
        <RefreshCw class="btn-icon" />
        {{ newEventsCount }} New Events
        <ChevronUp class="btn-icon" />
      </button>

      <!-- Table Header -->
      <div class="table-header">
        <span class="col-timestamp">Timestamp</span>
        <span class="col-severity">Severity</span>
        <span class="col-type">Source Type</span>
        <span class="col-payload">Payload Data</span>
      </div>

      <!-- Table Body -->
      <div class="events-table-container" @scroll="handleScroll">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-row"
          :class="getSeverityClass(event.severity)"
        >
          <span class="col-timestamp">{{ formatTimestamp(event.ts) }}</span>
          <span class="col-severity">
            <span class="severity-badge" :class="getSeverityClass(event.severity)">
              {{ event.severity.charAt(0).toUpperCase() + event.severity.slice(1) }}
            </span>
          </span>
          <span class="col-type">{{ event.type }}</span>
          <span class="col-payload">{{ JSON.stringify(event.payload) }}</span>
        </div>

        <!-- Loading -->
        <div v-if="eventsStore.isLoadingHistory" class="loading-row">Loading more events...</div>

        <!-- Empty State -->
        <div
          v-if="filteredEvents.length === 0 && !eventsStore.isLoadingHistory"
          class="empty-state"
        >
          <div class="empty-icon">
            <Rss />
          </div>
          <p>No events to display</p>
          <p class="empty-hint">Events will appear here in real-time</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="page-footer">
      <span class="footer-left"
        >View: {{ timeRangeLabel }} • Buffer: {{ eventsStore.events.length }} lines</span
      >
      <span class="footer-right">Server Time: UTC {{ formattedServerTime }}</span>
    </footer>
  </div>
</template>

<style scoped>
.feed-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background-color: transparent;
}

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-6) var(--space-8);
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title-icon {
  width: 20px;
  height: 20px;
  color: var(--color-sg-text-subtle);
}

.page-title h1 {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-title);
  color: var(--color-sg-text);
}

.connection-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-sg-text-subtle);
}

.status-connected .status-dot {
  background-color: var(--color-sg-success);
}

.status-connecting .status-dot {
  background-color: var(--color-sg-warn);
  animation: pulse 1s infinite;
}

.status-error .status-dot {
  background-color: var(--color-sg-error);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-label {
  color: var(--color-sg-text);
}

.reconnect-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--color-sg-border);
  border-radius: 999px;
  color: var(--color-sg-text-secondary);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
}

.reconnect-btn:hover {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--color-sg-text);
}

.reconnect-btn .btn-icon {
  width: 14px;
  height: 14px;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: transparent;
  position: relative;
  z-index: 20;
}

@media (min-width: 1024px) {
  .filters-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-8);
  }
}

.filters-left {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}

.segmented {
  display: inline-flex;
  padding: 4px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  gap: 4px;
}

.segment {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.segment.active {
  background-color: white;
  color: var(--color-sg-text);
  box-shadow: var(--shadow-sm);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 14px;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  min-width: 200px;
}

.pill-icon {
  width: 14px;
  height: 14px;
  color: var(--color-sg-text-subtle);
}

.pill-input {
  border: none;
  background: transparent;
  color: var(--color-sg-text);
  width: 100%;
  font-size: var(--text-body);
}

.filters-right {
  position: relative;
}

.menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--color-sg-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.menu-trigger:hover {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--color-sg-text);
}

.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-2));
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-2);
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-sg-border);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(16px);
  min-width: 160px;
  z-index: 40;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--color-sg-text-secondary);
  font-size: var(--text-body);
  cursor: pointer;
  transition: all 0.15s;
}

.action-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--color-sg-text);
}

/* Events Table */
.events-table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  margin: 0 var(--space-4) var(--space-6);
  border-radius: 18px;
  border: 1px solid var(--color-sg-border);
  background: var(--color-sg-bg-card);
  box-shadow: var(--shadow-md);
}

@media (min-width: 768px) {
  .events-table-wrapper {
    margin: 0 var(--space-8) var(--space-6);
  }
}

.new-events-btn {
  position: absolute;
  top: var(--space-12);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-sg-accent);
  border: none;
  border-radius: 999px;
  color: white;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 203, 179, 0.28);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.new-events-btn:hover {
  transform: translateX(-50%) scale(1.02);
  box-shadow: 0 10px 24px rgba(0, 203, 179, 0.35);
}

.new-events-btn .btn-icon {
  width: 14px;
  height: 14px;
}

.table-header {
  display: grid;
  grid-template-columns: 120px 90px 180px 1fr;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background-color: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--color-sg-border);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-secondary);
  position: sticky;
  top: 0;
  z-index: 5;
  backdrop-filter: blur(18px);
}

@media (min-width: 768px) {
  .table-header {
    padding: var(--space-3) var(--space-8);
  }
}

.events-table-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

.event-row {
  display: grid;
  grid-template-columns: 120px 90px 180px 1fr;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  transition: background-color 0.15s;
  min-width: 600px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

@media (min-width: 768px) {
  .event-row {
    padding: var(--space-3) var(--space-8);
  }
}

.event-row:hover {
  background-color: rgba(255, 255, 255, 0.85);
}

.event-row:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.7);
}

.event-row.severity-error {
  border-left-color: var(--color-sg-error);
  background-color: var(--color-sg-error-subtle);
}

.event-row.severity-warn {
  border-left-color: var(--color-sg-warn);
  background-color: var(--color-sg-warn-subtle);
}

.col-timestamp {
  font-family: var(--font-mono);
  color: var(--color-sg-text-muted);
  font-variant-numeric: tabular-nums;
}

.col-severity {
  display: flex;
  align-items: center;
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px var(--space-2);
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
  border-radius: 999px;
}

.severity-badge.severity-error {
  background-color: var(--color-sg-error-subtle);
  color: var(--color-sg-error);
}

.severity-badge.severity-warn {
  background-color: var(--color-sg-warn-subtle);
  color: var(--color-sg-warn);
}

.severity-badge.severity-info {
  background-color: var(--color-sg-info-muted);
  color: var(--color-sg-info);
}

.severity-badge.severity-debug {
  background-color: var(--color-sg-debug-muted);
  color: var(--color-sg-text-subtle);
}

.col-type {
  font-family: var(--font-mono);
  color: var(--color-sg-text);
  font-weight: var(--weight-medium);
}

.col-payload {
  font-family: var(--font-mono);
  color: var(--color-sg-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-row,
.empty-state {
  padding: var(--space-10);
  text-align: center;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.empty-icon {
  width: 36px;
  height: 36px;
  margin: 0 auto var(--space-3);
  color: var(--color-sg-text-subtle);
}

.empty-hint {
  margin-top: var(--space-2);
  font-size: var(--text-body);
  color: var(--color-sg-text-subtle);
}

/* Footer */
.page-footer {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background-color: transparent;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-subtle);
}

@media (min-width: 768px) {
  .page-footer {
    padding: var(--space-3) var(--space-8);
  }
}

.footer-left,
.footer-right {
  font-family: var(--font-mono);
}
</style>
