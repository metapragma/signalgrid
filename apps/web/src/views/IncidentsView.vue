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
    <header class="page-header">
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
          All Status
          <ChevronDown class="pill-icon" />
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
    <div class="incidents-content">
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
                  {{ incident.status === 'OPEN' ? 'OPEN' : 'RESOLVED' }}
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
  min-height: calc(100vh - 56px);
  background-color: var(--color-sg-bg);
}

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 16px;
  border-bottom: 1px solid var(--color-sg-border);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 32px 24px;
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-sg-text);
  letter-spacing: -0.03em;
}

@media (min-width: 768px) {
  .page-title {
    font-size: 40px;
  }
}

.page-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

.active-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-sg-open);
  box-shadow: 0 0 8px var(--color-sg-open);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: transparent;
  border: 1px solid var(--color-sg-accent);
  border-radius: 8px;
  color: var(--color-sg-accent);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.create-btn:hover {
  background-color: var(--color-sg-accent);
  color: var(--color-sg-bg);
}

.create-btn .btn-icon {
  width: 16px;
  height: 16px;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--color-sg-border);
}

@media (min-width: 768px) {
  .filters-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
  }
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 20px;
  color: var(--color-sg-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-pill:hover {
  border-color: var(--color-sg-border-light);
  color: var(--color-sg-text);
}

.filter-pill.active {
  background-color: var(--color-sg-bg-card);
  border-color: var(--color-sg-accent);
  color: var(--color-sg-text);
}

.pill-icon {
  width: 14px;
  height: 14px;
}

.view-toggle {
  display: flex;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 6px;
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
  background-color: var(--color-sg-bg-card);
  color: var(--color-sg-text);
}

.toggle-icon {
  width: 18px;
  height: 18px;
}

/* Content */
.incidents-content {
  padding: 24px 16px;
}

@media (min-width: 768px) {
  .incidents-content {
    padding: 24px;
  }
}

.error-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: var(--color-sg-error-muted);
  border: 1px solid var(--color-sg-error);
  border-radius: 8px;
  color: var(--color-sg-error);
  font-size: 14px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-sg-border);
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
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-sg-bg-elevated);
  border-radius: 12px;
  margin-bottom: 16px;
  color: var(--color-sg-text-muted);
}

.empty-icon svg {
  width: 28px;
  height: 28px;
}

.empty-state h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-sg-text);
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 14px;
  color: var(--color-sg-text-muted);
  margin-bottom: 20px;
}

/* Incidents List/Grid */
.incidents-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 900px;
}

.incidents-container.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  max-width: none;
}

.incident-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.incident-card:hover {
  background-color: var(--color-sg-bg-hover);
  border-color: var(--color-sg-border-light);
  transform: translateY(-1px);
}

/* Grid card variant */
.incident-card.card-grid {
  flex-direction: column;
  align-items: stretch;
}

.incident-card.card-grid .card-left {
  flex-direction: column;
  align-items: flex-start;
}

.incident-card.card-grid .status-icon {
  margin-bottom: 12px;
}

.card-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.status-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.status-icon svg {
  width: 20px;
  height: 20px;
}

.status-icon.status-open {
  background-color: var(--color-sg-open);
  background: linear-gradient(135deg, #3fb950 0%, #2ea043 100%);
  color: white;
}

.status-icon.status-resolved {
  background-color: var(--color-sg-bg-card);
  color: var(--color-sg-text-muted);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.status-open {
  color: var(--color-sg-open);
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
  font-size: 12px;
  color: var(--color-sg-text-subtle);
}

.incident-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-sg-text);
  line-height: 1.3;
}

.incident-details {
  font-size: 13px;
  color: var(--color-sg-text-muted);
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--color-sg-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s;
}

.load-more-btn:hover {
  color: var(--color-sg-text);
}

.load-more-btn .btn-icon {
  width: 14px;
  height: 14px;
}

.load-more-btn.load-more-grid {
  grid-column: 1 / -1;
}
</style>
