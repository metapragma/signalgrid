<script setup lang="ts">
import { computed, ref, onMounted, watch, shallowRef } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

// Register ECharts components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface TimeSeriesBucket {
  ts: string;
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

const props = defineProps<{
  buckets: TimeSeriesBucket[];
  isLoading?: boolean;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chart = shallowRef<echarts.ECharts | null>(null);

// Design system colors - refined palette
const colors = {
  error: '#fb7185', // rose-400
  warn: '#fbbf24', // amber-400
  info: '#38bdf8', // sky-400
  debug: '#94a3b8', // slate-400
  bg: '#09090b',
  grid: '#1e1e22',
  text: '#71717a', // zinc-500
  textLight: '#ececf1',
};

const chartOption = computed<EChartsOption>(() => {
  const times = props.buckets.map((b) => b.ts);
  const errorData = props.buckets.map((b) => b.error);
  const warnData = props.buckets.map((b) => b.warn);
  const infoData = props.buckets.map((b) => b.info);
  const debugData = props.buckets.map((b) => b.debug);

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(22, 22, 24, 0.95)',
      borderColor: 'transparent',
      borderWidth: 0,
      textStyle: {
        color: colors.textLight,
        fontSize: 12,
      },
      formatter: (params: unknown) => {
        const items = params as Array<{
          seriesName: string;
          value: number;
          color: string;
          axisValue: string;
        }>;
        if (!items || !items.length || !items[0]) return '';

        const date = new Date(items[0].axisValue);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let html = `<div style="font-weight: 600; margin-bottom: 8px;">${timeStr}</div>`;
        let total = 0;

        items.forEach((item) => {
          total += item.value;
          html += `
            <div style="display: flex; justify-content: space-between; gap: 16px; margin: 4px 0;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color};"></span>
                ${item.seriesName}
              </span>
              <span style="font-variant-numeric: tabular-nums; font-weight: 500;">${item.value}</span>
            </div>
          `;
        });

        html += `
          <div style="border-top: 1px solid ${colors.grid}; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">Total</span>
            <span style="font-variant-numeric: tabular-nums; font-weight: 600;">${total}</span>
          </div>
        `;

        return html;
      },
    },
    legend: {
      show: true,
      bottom: 0,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: {
        color: colors.text,
        fontSize: 11,
      },
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 50,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: {
        lineStyle: { color: colors.grid },
      },
      axisTick: { show: false },
      axisLabel: {
        color: colors.text,
        fontSize: 10,
        formatter: (value: string) => {
          const date = new Date(value);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.text,
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: colors.grid,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Error',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 113, 133, 0.8)' },
            { offset: 1, color: 'rgba(251, 113, 133, 0.1)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: errorData,
      },
      {
        name: 'Warn',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 191, 36, 0.8)' },
            { offset: 1, color: 'rgba(251, 191, 36, 0.1)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: warnData,
      },
      {
        name: 'Info',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.8)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.1)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: infoData,
      },
      {
        name: 'Debug',
        type: 'line',
        stack: 'total',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(148, 163, 184, 0.6)' },
            { offset: 1, color: 'rgba(148, 163, 184, 0.05)' },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: debugData,
      },
    ],
  };
});

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
      lazyUpdate: true,
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
  () => props.buckets,
  () => {
    updateChart();
  },
  { deep: true },
);
</script>

<template>
  <div class="chart-container">
    <div v-if="isLoading && buckets.length === 0" class="chart-loading">
      <div class="spinner"></div>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 280px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-loading {
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
