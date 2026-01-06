import { ref, computed, watch, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useEventsStore } from '@/stores/events';
import type { TimeSeriesResponse } from '@signalgrid/sdk';

export interface TimeSeriesOptions {
  interval: '1m' | '5m' | '15m';
  duration: '15m' | '1h' | '6h' | '24h';
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export interface TimeSeriesBucket {
  ts: string;
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export const useTimeSeries = (options: TimeSeriesOptions) => {
  const authStore = useAuthStore();
  const eventsStore = useEventsStore();

  const buckets = ref<TimeSeriesBucket[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);

  // For real-time updates: track events received since last fetch
  const pendingUpdates = ref<Map<string, TimeSeriesBucket>>(new Map());

  // Interval for bucketing based on interval option
  const bucketIntervalMs = computed(() => {
    switch (options.interval) {
      case '1m':
        return 60 * 1000;
      case '5m':
        return 5 * 60 * 1000;
      case '15m':
        return 15 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  });

  // Get bucket key for a timestamp
  const getBucketKey = (timestamp: Date | string): string => {
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const bucketStart = Math.floor(ts.getTime() / bucketIntervalMs.value) * bucketIntervalMs.value;
    return new Date(bucketStart).toISOString();
  };

  // Merge pending updates into buckets
  const mergedBuckets = computed(() => {
    if (pendingUpdates.value.size === 0) return buckets.value;

    const merged = new Map<string, TimeSeriesBucket>();

    // Add existing buckets
    for (const bucket of buckets.value) {
      merged.set(bucket.ts, { ...bucket });
    }

    // Merge pending updates
    for (const [key, update] of pendingUpdates.value) {
      const existing = merged.get(key);
      if (existing) {
        merged.set(key, {
          ts: key,
          total: existing.total + update.total,
          error: existing.error + update.error,
          warn: existing.warn + update.warn,
          info: existing.info + update.info,
          debug: existing.debug + update.debug,
        });
      } else {
        merged.set(key, update);
      }
    }

    // Sort by timestamp and return
    return Array.from(merged.values()).sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );
  });

  // Fetch from API
  const fetch = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response: TimeSeriesResponse = await authStore.client.metrics.getTimeSeries({
        interval: options.interval,
        duration: options.duration,
      });

      buckets.value = response.buckets;
      pendingUpdates.value.clear();
      lastFetch.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch time series';
    } finally {
      isLoading.value = false;
    }
  };

  // Handle incoming WebSocket events
  const handleNewEvent = (event: { ts: string; severity: string }) => {
    const bucketKey = getBucketKey(event.ts);
    const existing = pendingUpdates.value.get(bucketKey) || {
      ts: bucketKey,
      total: 0,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
    };

    existing.total += 1;
    if (event.severity === 'error') existing.error += 1;
    else if (event.severity === 'warn') existing.warn += 1;
    else if (event.severity === 'info') existing.info += 1;
    else if (event.severity === 'debug') existing.debug += 1;

    pendingUpdates.value.set(bucketKey, existing);
  };

  // Watch for new events from WebSocket
  watch(
    () => eventsStore.events[0],
    (newEvent) => {
      if (newEvent && lastFetch.value) {
        handleNewEvent({ ts: newEvent.ts, severity: newEvent.severity });
      }
    },
  );

  // Auto-refresh interval
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  if (options.autoRefresh !== false) {
    const interval = options.refreshInterval || 30000; // Default 30s
    refreshTimer = setInterval(() => {
      fetch();
    }, interval);
  }

  // Cleanup
  onUnmounted(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
  });

  return {
    buckets: mergedBuckets,
    isLoading,
    error,
    lastFetch,
    fetch,
    refresh: fetch,
  };
};
