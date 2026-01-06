import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface IncidentSummary {
  id: string;
  status: 'OPEN' | 'CLOSED';
  title: string;
  createdAt: string;
  commentCount: number;
  eventCount: number;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
}

export interface IncidentDetail {
  id: string;
  status: 'OPEN' | 'CLOSED';
  title: string;
  description: string | null;
  createdAt: string;
  comments: Comment[];
  events: Array<{
    id: string;
    ts: string;
    type: string;
    severity: string;
    fingerprint: string;
    payload: unknown;
    cursor: string;
  }>;
}

export const useIncidentsStore = defineStore('incidents', () => {
  const authStore = useAuthStore();

  const incidents = ref<IncidentSummary[]>([]);
  const currentIncident = ref<IncidentDetail | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchIncidents = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authStore.client.incidents.list();
      incidents.value = response.items as IncidentSummary[];
    } catch (e) {
      error.value = authStore.handleApiError(e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchIncident = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authStore.client.incidents.get(id);
      currentIncident.value = response.incident as IncidentDetail;
    } catch (e) {
      error.value = authStore.handleApiError(e);
      currentIncident.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  const createIncident = async (title: string, description?: string, eventIds?: string[]) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authStore.client.incidents.create({
        title,
        description,
        relatedEventIds: eventIds ?? [],
      });
      await fetchIncidents();
      return response;
    } catch (e) {
      error.value = authStore.handleApiError(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateIncident = async (
    id: string,
    data: { title?: string; description?: string; status?: 'OPEN' | 'CLOSED' },
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Direct fetch since SDK might not have update method
      const token = authStore.token;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/incidents/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error('Failed to update incident');
      await fetchIncident(id);
      await fetchIncidents();
    } catch (e) {
      error.value = authStore.handleApiError(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const addComment = async (incidentId: string, body: string) => {
    error.value = null;
    try {
      await authStore.client.incidents.addComment(incidentId, { body });
      await fetchIncident(incidentId);
    } catch (e) {
      error.value = authStore.handleApiError(e);
      throw e;
    }
  };

  const clearCurrentIncident = () => {
    currentIncident.value = null;
  };

  return {
    incidents,
    currentIncident,
    isLoading,
    error,
    fetchIncidents,
    fetchIncident,
    createIncident,
    updateIncident,
    addComment,
    clearCurrentIncident,
  };
});
