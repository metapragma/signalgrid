import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface FingerprintCount {
  fingerprint: string;
  count: number;
}

export interface OpsMetrics {
  latencyMs: LatencyPercentiles;
  errorRate: number;
  topFingerprints: FingerprintCount[];
}

export const useMetricsStore = defineStore('metrics', () => {
  const authStore = useAuthStore();

  const metrics = ref<OpsMetrics | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchMetrics = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authStore.client.metrics.getOps();
      metrics.value = response;
    } catch (e) {
      error.value = authStore.handleApiError(e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
  };
});
