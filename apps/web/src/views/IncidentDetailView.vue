<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Info,
  Activity,
  Send,
  Zap,
  Bell,
  AlertCircle,
  AlertTriangle,
} from 'lucide-vue-next';
import { useIncidentsStore } from '@/stores/incidents';

const route = useRoute();
const router = useRouter();
const incidentsStore = useIncidentsStore();

const newComment = ref('');
const isAddingComment = ref(false);

const incidentId = computed(() => route.params.id as string);
const incident = computed(() => incidentsStore.currentIncident);
const isOpen = computed(() => incident.value?.status === 'OPEN');

const shortId = computed(() => {
  if (!incident.value) return '';
  return 'INC-' + incident.value.id.slice(0, 3).toUpperCase();
});

const createdAtFormatted = computed(() => {
  if (!incident.value) return '';
  const date = new Date(incident.value.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `Created ${diffDays}d ago`;
  if (diffHours > 0) return `Created ${diffHours}h ago`;
  if (diffMins > 0) return `Created ${diffMins}m ago`;
  return 'Created just now';
});

const formatEventTime = (ts: string) => {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const formatCommentTime = (ts: string) => {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const closeIncident = async () => {
  if (!incident.value) return;
  await incidentsStore.updateIncident(incidentId.value, { status: 'CLOSED' });
};

const resolveIncident = async () => {
  if (!incident.value) return;
  await incidentsStore.updateIncident(incidentId.value, { status: 'CLOSED' });
};

const reopenIncident = async () => {
  if (!incident.value) return;
  await incidentsStore.updateIncident(incidentId.value, { status: 'OPEN' });
};

const addComment = async () => {
  if (!newComment.value.trim()) return;

  isAddingComment.value = true;
  try {
    await incidentsStore.addComment(incidentId.value, newComment.value.trim());
    newComment.value = '';
  } finally {
    isAddingComment.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'incidents' });
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error':
      return AlertCircle;
    case 'warn':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'error':
      return 'severity-error';
    case 'warn':
      return 'severity-warn';
    default:
      return 'severity-info';
  }
};

const getUserInitial = (email: string) => {
  return email.charAt(0).toUpperCase();
};

onMounted(() => {
  incidentsStore.fetchIncident(incidentId.value);
});

onUnmounted(() => {
  incidentsStore.clearCurrentIncident();
});
</script>

<template>
  <div class="incident-detail">
    <!-- Back Link -->
    <div class="back-section">
      <button class="back-link" @click="goBack">
        <ArrowLeft class="back-icon" />
        Back to Incidents
      </button>
    </div>

    <!-- Loading -->
    <div v-if="incidentsStore.isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="incidentsStore.error" class="error-banner">
      {{ incidentsStore.error }}
    </div>

    <!-- Content -->
    <div v-else-if="incident" class="content">
      <!-- Incident Header -->
      <header class="incident-header">
        <div class="header-top">
          <div class="header-left">
            <div class="status-row">
              <span class="status-badge" :class="{ open: isOpen, closed: !isOpen }">
                <span class="status-dot"></span>
                {{ isOpen ? 'OPEN' : 'CLOSED' }}
              </span>
              <span class="incident-id">{{ shortId }}</span>
            </div>

            <h1 class="incident-title">{{ incident.title }}</h1>

            <div class="meta-row">
              <span class="meta-item">
                <Clock class="meta-icon" />
                {{ createdAtFormatted }}
              </span>
              <span class="meta-separator">·</span>
              <span class="meta-item">
                <User class="meta-icon" />
                Reported by System
              </span>
              <span class="meta-separator">·</span>
              <span class="meta-item region">
                <MapPin class="meta-icon" />
                us-east-1
              </span>
            </div>
          </div>

          <div class="header-actions">
            <button v-if="isOpen" class="action-btn secondary" @click="closeIncident">
              Close Incident
            </button>
            <button v-if="isOpen" class="action-btn primary" @click="resolveIncident">
              Resolve
            </button>
            <button v-if="!isOpen" class="action-btn secondary" @click="reopenIncident">
              Reopen Incident
            </button>
          </div>
        </div>
      </header>

      <!-- Two Column Layout -->
      <div class="two-columns">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Description -->
          <section class="section">
            <h2 class="section-title">
              <Info class="section-icon" />
              DESCRIPTION
            </h2>
            <div class="description-card">
              <p v-if="incident.description" class="description-text">
                {{ incident.description }}
              </p>
              <p v-else class="description-empty">No description provided</p>
            </div>
          </section>

          <!-- Linked Events -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                <Activity class="section-icon" />
                LINKED EVENTS ({{ incident.events.length }})
              </h2>
              <button v-if="incident.events.length > 0" class="view-all-link">VIEW ALL LOGS</button>
            </div>

            <div v-if="incident.events.length > 0" class="events-table">
              <div class="table-header">
                <span class="col-timestamp">TIMESTAMP</span>
                <span class="col-source">SOURCE</span>
                <span class="col-message">MESSAGE</span>
              </div>
              <div class="table-body">
                <div v-for="event in incident.events" :key="event.id" class="table-row">
                  <span class="col-timestamp">{{ formatEventTime(event.ts) }}</span>
                  <span class="col-source">{{ event.type }}</span>
                  <span class="col-message">
                    <component
                      :is="getSeverityIcon(event.severity)"
                      class="severity-icon"
                      :class="getSeverityClass(event.severity)"
                    />
                    {{ JSON.stringify(event.payload) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="events-empty">
              <Activity class="empty-icon" />
              <p>No events linked to this incident</p>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <section class="section">
            <h2 class="section-title">
              <Clock class="section-icon" />
              TIMELINE
            </h2>

            <!-- Comment Input -->
            <div class="comment-input-wrapper">
              <input
                v-model="newComment"
                type="text"
                class="comment-input"
                placeholder="Add a comment or paste log..."
                :disabled="isAddingComment"
                @keyup.enter="addComment"
              />
              <button
                class="send-btn"
                :disabled="!newComment.trim() || isAddingComment"
                @click="addComment"
              >
                <Send class="send-icon" />
              </button>
            </div>

            <!-- Timeline Items -->
            <div class="timeline">
              <!-- Comments -->
              <div
                v-for="comment in incident.comments"
                :key="comment.id"
                class="timeline-item comment-item"
              >
                <div class="timeline-avatar">
                  {{ getUserInitial(comment.author.email) }}
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-author">{{ comment.author.email.split('@')[0] }}</span>
                    <span class="timeline-time">{{ formatCommentTime(comment.createdAt) }}</span>
                  </div>
                  <div class="timeline-message">
                    {{ comment.body }}
                  </div>
                </div>
              </div>

              <!-- System Event Example (would come from real data) -->
              <div class="timeline-item system-item">
                <div class="timeline-icon system-icon">
                  <Zap class="icon" />
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-label system">SYSTEM EVENT</span>
                    <span class="timeline-time">{{ formatCommentTime(incident.createdAt) }}</span>
                  </div>
                  <div class="timeline-system-text">
                    Status updated to <strong>Investigating</strong>
                  </div>
                </div>
              </div>

              <!-- Alert Triggered -->
              <div class="timeline-item alert-item">
                <div class="timeline-icon alert-icon">
                  <Bell class="icon" />
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-label alert">ALERT TRIGGERED</span>
                    <span class="timeline-time">{{ formatCommentTime(incident.createdAt) }}</span>
                  </div>
                  <div class="timeline-system-text">
                    Incident {{ shortId }} created via
                    <code>signalgrid-api</code>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="incident.comments.length === 0" class="timeline-empty">
                <p>Timeline will show activity as the incident progresses</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.incident-detail {
  min-height: calc(100vh - 56px);
  background-color: var(--color-sg-bg);
  padding-bottom: 40px;
}

/* Back Section */
.back-section {
  padding: 16px 16px 0;
}

@media (min-width: 768px) {
  .back-section {
    padding: 20px 24px 0;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--color-sg-text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--color-sg-text);
}

.back-icon {
  width: 16px;
  height: 16px;
}

/* Loading & Error */
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

.error-banner {
  margin: 16px;
  padding: 12px 16px;
  background-color: var(--color-sg-error-muted);
  border: 1px solid var(--color-sg-error);
  border-radius: 8px;
  color: var(--color-sg-error);
  font-size: 14px;
}

/* Content */
.content {
  padding: 0 16px;
}

@media (min-width: 768px) {
  .content {
    padding: 0 24px;
  }
}

/* Incident Header */
.incident-header {
  padding: 20px 0 24px;
  border-bottom: 1px solid var(--color-sg-border);
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 1024px) {
  .header-top {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.header-left {
  flex: 1;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.open {
  background-color: rgba(63, 185, 80, 0.15);
  color: var(--color-sg-open);
  border: 1px solid rgba(63, 185, 80, 0.3);
}

.status-badge.closed {
  background-color: var(--color-sg-bg-elevated);
  color: var(--color-sg-text-muted);
  border: 1px solid var(--color-sg-border);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.incident-id {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-sg-text-subtle);
}

.incident-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-sg-accent);
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 12px;
}

@media (min-width: 768px) {
  .incident-title {
    font-size: 40px;
  }
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-sg-text-muted);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.meta-item.region {
  color: var(--color-sg-accent);
}

.meta-separator {
  color: var(--color-sg-text-subtle);
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.secondary {
  background-color: transparent;
  border: 1px solid var(--color-sg-border-light);
  color: var(--color-sg-text);
}

.action-btn.secondary:hover {
  background-color: var(--color-sg-bg-hover);
  border-color: var(--color-sg-text-muted);
}

.action-btn.primary {
  background-color: var(--color-sg-accent);
  border: 1px solid var(--color-sg-accent);
  color: var(--color-sg-bg);
}

.action-btn.primary:hover {
  background-color: var(--color-sg-accent-hover);
}

/* Two Column Layout */
.two-columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .two-columns {
    grid-template-columns: 1fr 380px;
    gap: 32px;
  }
}

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-sg-text-muted);
}

.section-icon {
  width: 16px;
  height: 16px;
}

.view-all-link {
  background: none;
  border: none;
  color: var(--color-sg-accent);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: opacity 0.15s;
}

.view-all-link:hover {
  opacity: 0.8;
}

/* Description */
.description-card {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  padding: 20px;
}

.description-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-sg-text);
  white-space: pre-wrap;
}

.description-empty {
  font-size: 14px;
  color: var(--color-sg-text-subtle);
  font-style: italic;
}

/* Events Table */
.events-table {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 90px 140px 1fr;
  gap: 16px;
  padding: 12px 16px;
  background-color: var(--color-sg-bg-card);
  border-bottom: 1px solid var(--color-sg-border);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-sg-text-subtle);
}

.table-body {
  max-height: 300px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 90px 140px 1fr;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-sg-border);
  font-size: 13px;
  transition: background-color 0.15s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: var(--color-sg-bg-hover);
}

.col-timestamp {
  font-family: var(--font-mono);
  color: var(--color-sg-text-muted);
}

.col-source {
  font-family: var(--font-mono);
  color: var(--color-sg-accent);
}

.col-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--color-sg-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.severity-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.severity-icon.severity-error {
  color: var(--color-sg-error);
}

.severity-icon.severity-warn {
  color: var(--color-sg-warn);
}

.severity-icon.severity-info {
  color: var(--color-sg-info);
}

.events-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--color-sg-text-subtle);
  margin-bottom: 12px;
}

.events-empty p {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

/* Timeline */
.comment-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 8px;
  padding: 4px 4px 4px 16px;
  margin-bottom: 20px;
}

.comment-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--color-sg-text);
  font-size: 14px;
  outline: none;
}

.comment-input::placeholder {
  color: var(--color-sg-text-subtle);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-sg-bg-card);
  border: none;
  border-radius: 6px;
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-sg-accent);
  color: var(--color-sg-bg);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-icon {
  width: 16px;
  height: 16px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.timeline-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-icon .icon {
  width: 16px;
  height: 16px;
}

.timeline-icon.system-icon {
  background-color: rgba(34, 211, 238, 0.15);
  color: var(--color-sg-accent);
}

.timeline-icon.alert-icon {
  background-color: rgba(248, 81, 73, 0.15);
  color: var(--color-sg-error);
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.timeline-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-sg-text);
}

.timeline-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-label.system {
  color: var(--color-sg-accent);
}

.timeline-label.alert {
  color: var(--color-sg-error);
}

.timeline-time {
  font-size: 12px;
  color: var(--color-sg-text-subtle);
}

.timeline-message {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: var(--color-sg-text-muted);
  line-height: 1.5;
}

.timeline-system-text {
  font-size: 14px;
  color: var(--color-sg-text-muted);
}

.timeline-system-text strong {
  color: var(--color-sg-text);
}

.timeline-system-text code {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-sg-accent);
  background-color: var(--color-sg-bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.timeline-empty {
  text-align: center;
  padding: 20px;
}

.timeline-empty p {
  font-size: 13px;
  color: var(--color-sg-text-subtle);
}
</style>
