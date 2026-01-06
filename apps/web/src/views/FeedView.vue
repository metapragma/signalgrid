<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Rss, RefreshCw, X, Download, ChevronUp } from 'lucide-vue-next';
import { useEventsStore, type EventFilters } from '@/stores/events';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

// Local filter state
const localSeverity = ref<EventFilters['severity']>(null);
const localType = ref('');
const payloadSearch = ref('');

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
};

// Filter payload locally (client-side search)
const filteredEvents = computed(() => {
  if (!payloadSearch.value.trim()) return eventsStore.events;
  const search = payloadSearch.value.toLowerCase();
  return eventsStore.events.filter((event) => {
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

onMounted(() => {
  initFiltersFromUrl();
  eventsStore.connect();
  eventsStore.loadHistory();
  lastEventCount = eventsStore.events.length;

  // Update server time every second
  serverTimeInterval.value = setInterval(() => {
    serverTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  eventsStore.disconnect();
  if (serverTimeInterval.value) {
    clearInterval(serverTimeInterval.value);
  }
});
</script>

<template>
  <div class="feed-view">
    <!-- Page Header -->
    <header class="page-header">
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
    <div class="filters-bar">
      <div class="filters-left">
        <div class="filter-group">
          <label>Severity</label>
          <select v-model="localSeverity" @change="applyFilters">
            <option :value="null">All</option>
            <option value="error">Error</option>
            <option value="warn">Warn</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Type</label>
          <select v-model="localType" @change="applyFilters">
            <option value="">All Types</option>
          </select>
        </div>

        <div class="filter-group search-group">
          <input
            v-model="payloadSearch"
            type="text"
            placeholder="Filter payload..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filters-right">
        <button class="filter-btn" @click="clearFilters">
          <X class="btn-icon" />
          Clear Filters
        </button>
        <button class="filter-btn">
          <Download class="btn-icon" />
          Export
        </button>
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
          <p>No events to display</p>
          <p class="empty-hint">Events will appear here in real-time</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="page-footer">
      <span class="footer-left"
        >View: Live Stream • Buffer: {{ eventsStore.events.length }} lines</span
      >
      <span class="footer-right">Server Time: UTC {{ formattedServerTime }}</span>
    </footer>
  </div>
</template>

<style scoped>
.feed-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  background-color: var(--color-sg-bg);
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
  color: var(--color-sg-text-muted);
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
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-sg-bg-elevated);
  border-radius: 20px;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-sg-text-subtle);
}

.status-connected .status-dot {
  background-color: var(--color-sg-success);
  box-shadow: 0 0 8px var(--color-sg-success);
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
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-sg-bg-hover);
  border: none;
  border-radius: 6px;
  color: var(--color-sg-text-muted);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
}

.reconnect-btn:hover {
  background-color: var(--color-sg-bg-card);
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
  background-color: var(--color-sg-bg);
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

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
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
  padding: var(--space-3) var(--space-3);
  background-color: var(--color-sg-bg-elevated);
  border: none;
  border-radius: 8px;
  color: var(--color-sg-text);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  min-width: 120px;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
}

.filters-right {
  display: flex;
  gap: var(--space-2);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-sg-bg-elevated);
  border: none;
  border-radius: 8px;
  color: var(--color-sg-text-muted);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  background-color: var(--color-sg-bg-hover);
  color: var(--color-sg-text);
}

.filter-btn .btn-icon {
  width: 14px;
  height: 14px;
}

/* Events Table */
.events-table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
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
  border-radius: 20px;
  color: var(--color-sg-bg);
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.new-events-btn:hover {
  transform: translateX(-50%) scale(1.02);
  box-shadow: 0 6px 16px rgba(34, 211, 238, 0.4);
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
  background-color: var(--color-sg-bg);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-sg-text-subtle);
  position: sticky;
  top: 0;
  z-index: 5;
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
}

@media (min-width: 768px) {
  .event-row {
    padding: var(--space-3) var(--space-8);
  }
}

.event-row:hover {
  background-color: var(--color-sg-bg-hover);
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
  border-radius: 4px;
  letter-spacing: var(--tracking-wide);
}

.severity-badge.severity-error {
  background-color: var(--color-sg-error);
  color: white;
}

.severity-badge.severity-warn {
  background-color: var(--color-sg-warn);
  color: var(--color-sg-bg);
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
  background-color: var(--color-sg-bg);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
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
