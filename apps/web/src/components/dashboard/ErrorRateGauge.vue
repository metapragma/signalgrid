<script setup lang="ts">
import { computed, ref, onMounted, watch, shallowRef } from 'vue';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

// Register ECharts components
echarts.use([GaugeChart, CanvasRenderer]);

const props = defineProps<{
  value: number; // 0-1 range (e.g., 0.05 = 5%)
  isLoading?: boolean;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chart = shallowRef<echarts.ECharts | null>(null);

// Design system colors - refined palette
const colors = {
  healthy: '#34d399', // emerald-400
  degraded: '#fbbf24', // amber-400
  critical: '#fb7185', // rose-400
  bg: '#141417',
  text: '#71717a', // zinc-500
  textLight: '#ececf1',
};

const percentage = computed(() => Math.round(props.value * 100 * 100) / 100);
const maxValue = 15; // Max display is 15%

const status = computed(() => {
  if (percentage.value >= 10) return 'critical';
  if (percentage.value >= 5) return 'degraded';
  return 'healthy';
});

const statusColor = computed(() => colors[status.value]);

const chartOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1000,
  animationEasing: 'elasticOut',
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '70%'],
      radius: '100%',
      min: 0,
      max: maxValue,
      splitNumber: 3,
      axisLine: {
        lineStyle: {
          width: 20,
          color: [
            [0.33, colors.healthy],
            [0.66, colors.degraded],
            [1, colors.critical],
          ],
        },
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '60%',
        width: 8,
        offsetCenter: [0, '-15%'],
        itemStyle: {
          color: 'auto',
        },
      },
      axisTick: {
        length: 8,
        lineStyle: {
          color: 'auto',
          width: 1,
        },
      },
      splitLine: {
        length: 15,
        lineStyle: {
          color: 'auto',
          width: 2,
        },
      },
      axisLabel: {
        color: colors.text,
        fontSize: 10,
        distance: 25,
        formatter: (value: number) => `${value}%`,
      },
      title: {
        show: false,
      },
      detail: {
        fontSize: 28,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, SF Mono, monospace',
        offsetCenter: [0, '20%'],
        valueAnimation: true,
        formatter: (value: number) => `${value.toFixed(2)}%`,
        color: statusColor.value,
      },
      data: [
        {
          value: Math.min(percentage.value, maxValue),
        },
      ],
    },
  ],
}));

const initChart = () => {
  if (!chartRef.value) return;

  chart.value = echarts.init(chartRef.value, undefined, {
    renderer: 'canvas',
  });

  chart.value.setOption(chartOption.value);
};

const updateChart = () => {
  if (chart.value) {
    chart.value.setOption(chartOption.value, {
      notMerge: false,
      lazyUpdate: false,
    });
  }
};

const handleResize = () => {
  chart.value?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

watch(
  () => props.value,
  () => {
    updateChart();
  },
);
</script>

<template>
  <div class="gauge-container">
    <div v-if="isLoading" class="gauge-loading">
      <div class="spinner"></div>
    </div>
    <div ref="chartRef" class="gauge-chart"></div>
    <div class="gauge-status" :class="`status-${status}`">
      {{ status.toUpperCase() }}
    </div>
  </div>
</template>

<style scoped>
.gauge-container {
  position: relative;
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-chart {
  width: 100%;
  height: 160px;
}

.gauge-status {
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  padding: var(--space-1) var(--space-3);
  border-radius: 12px;
  margin-top: -20px;
}

.gauge-status.status-healthy {
  background-color: rgba(52, 211, 153, 0.12);
  color: #34d399;
}

.gauge-status.status-degraded {
  background-color: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.gauge-status.status-critical {
  background-color: rgba(251, 113, 133, 0.12);
  color: #fb7185;
}

.gauge-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(13, 17, 23, 0.8);
  z-index: 10;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-sg-bg-hover);
  border-top-color: var(--color-sg-text-muted);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
