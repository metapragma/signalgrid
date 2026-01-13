<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  List,
  LayoutGrid,
} from 'lucide-vue-next';
import { useIncidentsStore } from '@/stores/incidents';
import CreateIncidentModal from '@/components/CreateIncidentModal.vue';

const router = useRouter();
const incidentsStore = useIncidentsStore();

const showCreateModal = ref(false);
const statusFilter = ref('all');
const viewMode = ref<'list' | 'grid'>('list');

// Computed stats
const activeCount = computed(() => {
  return incidentsStore.incidents.filter((i) => i.status === 'OPEN').length;
});

// Filter incidents
const filteredIncidents = computed(() => {
  if (statusFilter.value === 'all') return incidentsStore.incidents;
  if (statusFilter.value === 'open')
    return incidentsStore.incidents.filter((i) => i.status === 'OPEN');
  if (statusFilter.value === 'resolved')
    return incidentsStore.incidents.filter((i) => i.status === 'CLOSED');
  return incidentsStore.incidents;
});

onMounted(() => {
  incidentsStore.fetchIncidents();
});

const openIncident = (id: string) => {
  router.push({ name: 'incident-detail', params: { id } });
};

const handleCreate = async (data: { title: string; description?: string }) => {
  try {
    await incidentsStore.createIncident(data.title, data.description);
    showCreateModal.value = false;
  } catch {
    // Error is handled in store
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OPEN':
      return AlertCircle;
    case 'CLOSED':
      return CheckCircle;
    default:
      return AlertTriangle;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'status-open';
    case 'CLOSED':
      return 'status-resolved';
    default:
      return 'status-open';
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
};

const getShortId = (id: string) => {
  return 'INC-' + id.slice(0, 4).toUpperCase();
};
</script>

<template>
  <div class="incidents-view">
    <!-- Page Header -->
    <header class="page-header enter-rise">
      <div class="header-content">
        <h1 class="page-title">Incidents</h1>
        <p class="page-subtitle">
          <span class="active-dot"></span>
          {{ activeCount }} Active Issues
        </p>
      </div>
      <button class="create-btn" @click="showCreateModal = true">
        <Plus class="btn-icon" />
        New Incident
      </button>
    </header>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-pills">
        <button
          class="filter-pill"
          :class="{ active: statusFilter === 'all' }"
          @click="statusFilter = 'all'"
        >
          All
        </button>
        <button
          class="filter-pill"
          :class="{ active: statusFilter === 'open' }"
          @click="statusFilter = 'open'"
        >
          Open
        </button>
        <button
          class="filter-pill"
          :class="{ active: statusFilter === 'resolved' }"
          @click="statusFilter = 'resolved'"
        >
          Resolved
        </button>
      </div>

      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <List class="toggle-icon" />
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="toggle-icon" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="incidents-content enter-rise delay-1">
      <!-- Error -->
      <div v-if="incidentsStore.error" class="error-banner">
        {{ incidentsStore.error }}
      </div>

      <!-- Loading -->
      <div v-if="incidentsStore.isLoading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredIncidents.length === 0" class="empty-state">
        <div class="empty-icon">
          <AlertTriangle />
        </div>
        <h2>No incidents yet</h2>
        <p>Create an incident to track issues</p>
        <button class="create-btn" @click="showCreateModal = true">
          <Plus class="btn-icon" />
          Create First Incident
        </button>
      </div>

      <!-- Incidents List/Grid -->
      <div v-else class="incidents-container" :class="{ 'view-grid': viewMode === 'grid' }">
        <div
          v-for="incident in filteredIncidents"
          :key="incident.id"
          class="incident-card"
          :class="{ 'card-grid': viewMode === 'grid' }"
          @click="openIncident(incident.id)"
        >
          <div class="card-left">
            <div class="status-icon" :class="getStatusClass(incident.status)">
              <component :is="getStatusIcon(incident.status)" />
            </div>
            <div class="card-info">
              <div class="card-meta">
                <span class="status-badge" :class="getStatusClass(incident.status)">
                  <span class="status-dot"></span>
                  {{ incident.status === 'OPEN' ? 'Open' : 'Resolved' }}
                </span>
                <span class="incident-id">{{ getShortId(incident.id) }}</span>
              </div>
              <h3 class="incident-title">{{ incident.title }}</h3>
              <p class="incident-details">
                {{ formatTimeAgo(incident.createdAt) }} • {{ incident.eventCount }} events •
                {{ incident.commentCount }} comments
              </p>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <button class="load-more-btn" :class="{ 'load-more-grid': viewMode === 'grid' }">
          Load older incidents
          <ChevronDown class="btn-icon" />
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateIncidentModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreate"
    />
  </div>
</template>

<style scoped>
.incidents-view {
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-sg-success);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 16px;
  background-color: var(--color-sg-accent);
  border: none;
  border-radius: 999px;
  color: white;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.create-btn .btn-icon {
  width: 16px;
  height: 16px;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .filters-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-8);
  }
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 4px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px;
  background-color: transparent;
  border: none;
  border-radius: 999px;
  color: var(--color-sg-text-muted);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-pill:hover {
  background-color: rgba(255, 255, 255, 0.7);
  color: var(--color-sg-text);
}

.filter-pill.active {
  background-color: white;
  box-shadow: var(--shadow-sm);
  color: var(--color-sg-text);
}

.pill-icon {
  width: 14px;
  height: 14px;
}

.view-toggle {
  display: flex;
  padding: 4px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  border: 1px solid var(--color-sg-border);
  overflow: hidden;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover {
  color: var(--color-sg-text);
}

.toggle-btn.active {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--color-sg-text);
  box-shadow: var(--shadow-sm);
}

.toggle-icon {
  width: 18px;
  height: 18px;
}

/* Content */
.incidents-content {
  padding: var(--space-6) var(--space-4);
}

@media (min-width: 768px) {
  .incidents-content {
    padding: var(--space-6);
  }
}

.error-banner {
  margin-bottom: var(--space-4);
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
  border: 2px solid rgba(15, 23, 42, 0.16);
  border-top-color: var(--color-sg-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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
  margin-bottom: var(--space-4);
}

/* Incidents List/Grid */
.incidents-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}

.incidents-container.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
  gap: var(--space-4);
  max-width: none;
  justify-content: center;
  justify-items: center;
}

.incident-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background-color: white;
  border-radius: 18px;
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 0.15s;
}

.incident-card:hover {
  background-color: var(--color-sg-bg-hover);
  box-shadow: var(--shadow-md);
}

/* Grid card variant */
.incident-card.card-grid {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.incident-card.card-grid .card-left {
  flex-direction: column;
  align-items: center;
}

.incident-card.card-grid .status-icon {
  margin-bottom: var(--space-3);
}

.incident-card.card-grid .card-meta {
  justify-content: center;
}

.incident-card.card-grid .incident-details {
  text-align: center;
}

.card-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.status-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon svg {
  width: 14px;
  height: 14px;
}

.status-icon.status-open {
  background: rgba(18, 183, 106, 0.12);
  color: var(--color-sg-success);
}

.status-icon.status-resolved {
  background-color: rgba(15, 23, 42, 0.08);
  color: var(--color-sg-text-muted);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
}

.status-badge.status-open {
  color: var(--color-sg-success);
}

.status-badge.status-resolved {
  color: var(--color-sg-text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.incident-id {
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-subtle);
}

.incident-title {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
}

.incident-details {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px 16px;
  margin-top: var(--space-3);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--color-sg-border);
  color: var(--color-sg-text-secondary);
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 999px;
}

.load-more-btn:hover {
  color: var(--color-sg-text);
  background-color: rgba(255, 255, 255, 0.95);
}

.load-more-btn .btn-icon {
  width: 14px;
  height: 14px;
}

.load-more-btn.load-more-grid {
  grid-column: 1 / -1;
}
</style>
