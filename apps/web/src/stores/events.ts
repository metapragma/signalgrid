import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAuthStore } from './auth';
import type { WsServerFrame, Event, EventsResponse } from '@signalgrid/sdk';

export interface EventFilters {
  severity: 'debug' | 'info' | 'warn' | 'error' | null;
  type: string | null;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useEventsStore = defineStore('events', () => {
  const authStore = useAuthStore();

  // State
  const events = ref<Event[]>([]);
  const filters = ref<EventFilters>({ severity: null, type: null });
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const error = ref<string | null>(null);
  const cursor = ref<string | null>(null);
  const hasMore = ref(true);
  const isLoadingHistory = ref(false);

  // Track cleanup functions
  let unsubscribeMessage: (() => void) | null = null;
  let unsubscribeError: (() => void) | null = null;
  let unsubscribeClose: (() => void) | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed
  const isConnected = computed(() => connectionStatus.value === 'connected');
  const eventCount = computed(() => events.value.length);

  // Subscribe with current filters
  const subscribe = () => {
    if (!authStore.client.ws.isConnected()) return;

    authStore.client.ws.subscribe(
      {
        severity: filters.value.severity,
        type: filters.value.type,
      },
      cursor.value,
    );
  };

  // Handle incoming WebSocket messages
  const handleMessage = (frame: WsServerFrame) => {
    switch (frame.type) {
      case 'event':
        // Prepend new event to the list
        events.value = [
          {
            id: frame.event.id,
            ts: frame.event.ts,
            type: frame.event.type,
            severity: frame.event.severity,
            fingerprint: frame.event.fingerprint,
            payload: frame.event.payload as Record<string, unknown>,
            cursor: frame.cursor,
          },
          ...events.value,
        ];
        // Update cursor
        cursor.value = frame.cursor;
        break;

      case 'subscribed':
        // Subscription confirmed
        break;

      case 'pong':
        // Pong received, connection is alive
        break;

      case 'resync_required':
        // Client fell too far behind, need to refetch
        events.value = [];
        cursor.value = null;
        hasMore.value = true;
        loadHistory();
        break;

      case 'error':
        error.value = frame.error.message;
        break;
    }
  };

  // Handle WebSocket errors
  const handleError = (err: Error) => {
    error.value = err.message;
    connectionStatus.value = 'error';
  };

  // Handle WebSocket close
  const handleClose = (code: number, reason: string) => {
    connectionStatus.value = 'disconnected';
    if (code !== 1000) {
      // Abnormal close, schedule reconnect
      error.value = reason || `Connection closed (code: ${code})`;
      scheduleReconnect();
    }
  };

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
      if (authStore.isAuthenticated && connectionStatus.value !== 'connected') {
        connect();
      }
    }, 5000);
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (unsubscribeMessage) {
      unsubscribeMessage();
      unsubscribeMessage = null;
    }
    if (unsubscribeError) {
      unsubscribeError();
      unsubscribeError = null;
    }
    if (unsubscribeClose) {
      unsubscribeClose();
      unsubscribeClose = null;
    }
    authStore.client.ws.disconnect();
    connectionStatus.value = 'disconnected';
  };

  // Connect to WebSocket
  const connect = async () => {
    if (!authStore.isAuthenticated) {
      error.value = 'Not authenticated';
      return;
    }

    // Clean up any existing connection
    disconnect();

    connectionStatus.value = 'connecting';
    error.value = null;

    try {
      await authStore.client.ws.connect();
      connectionStatus.value = 'connected';

      // Set up message handler
      unsubscribeMessage = authStore.client.ws.onMessage(handleMessage);
      unsubscribeError = authStore.client.ws.onError(handleError);
      unsubscribeClose = authStore.client.ws.onClose(handleClose);

      // Start ping interval (every 30 seconds)
      pingInterval = setInterval(() => {
        if (authStore.client.ws.isConnected()) {
          authStore.client.ws.ping();
        }
      }, 30000);

      // Subscribe with current filters
      subscribe();
    } catch (e) {
      connectionStatus.value = 'error';
      error.value = authStore.handleApiError(e);
      scheduleReconnect();
    }
  };

  // Load historical events via REST
  const loadHistory = async () => {
    if (isLoadingHistory.value || !hasMore.value) return;

    isLoadingHistory.value = true;
    try {
      // Get the oldest cursor from current events for pagination
      const lastEvent = events.value[events.value.length - 1];
      const oldestCursor = lastEvent?.cursor;

      const response: EventsResponse = await authStore.client.events.list({
        cursor: oldestCursor,
        limit: 50,
        severity: filters.value.severity ?? undefined,
        type: filters.value.type ?? undefined,
      });

      // Append to existing events (historical events are older)
      events.value = [...events.value, ...response.items];
      hasMore.value = response.nextCursor !== null;
    } catch (e) {
      error.value = authStore.handleApiError(e);
    } finally {
      isLoadingHistory.value = false;
    }
  };

  // Update filters and resubscribe
  const setFilters = (newFilters: Partial<EventFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    // Clear events and reload with new filters
    events.value = [];
    cursor.value = null;
    hasMore.value = true;

    if (isConnected.value) {
      subscribe();
    }
    loadHistory();
  };

  // Clear all events
  const clearEvents = () => {
    events.value = [];
    cursor.value = null;
    hasMore.value = true;
  };

  // Watch for auth changes
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        connect();
      } else {
        disconnect();
        clearEvents();
      }
    },
  );

  return {
    // State
    events,
    filters,
    connectionStatus,
    error,
    hasMore,
    isLoadingHistory,
    // Computed
    isConnected,
    eventCount,
    // Actions
    connect,
    disconnect,
    loadHistory,
    setFilters,
    clearEvents,
  };
});
