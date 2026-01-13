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

// Design system colors - glacial tide palette
const colors = {
  error: '#ff3b30',
  warn: '#f0a343',
  info: '#00c7ff',
  debug: '#7b9b8f',
  bg: '#fbfaf7',
  grid: 'rgba(28, 32, 30, 0.18)',
  text: '#46534f',
  textLight: '#101b18',
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
      backgroundColor: 'rgba(251, 250, 247, 0.96)',
      borderColor: 'rgba(28, 32, 30, 0.18)',
      borderWidth: 1,
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
          color: 'rgba(255, 59, 48, 0.32)',
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
          color: 'rgba(240, 163, 67, 0.3)',
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
          color: 'rgba(0, 199, 255, 0.28)',
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
          color: 'rgba(123, 155, 143, 0.22)',
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
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
}

.spinner {
  width: 24px;
  height: 24px;
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
</style>
