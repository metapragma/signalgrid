<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'SgStatusDot' });

const props = withDefaults(
  defineProps<{
    status: 'connected' | 'open' | 'pending' | 'connecting' | 'error' | 'closed' | 'inactive';
    pulse?: boolean;
  }>(),
  {
    pulse: false,
  },
);

const colorClass = computed(() => {
  const colors: Record<string, string> = {
    connected: 'bg-emerald-400',
    open: 'bg-emerald-400',
    pending: 'bg-amber-400',
    connecting: 'bg-amber-400',
    error: 'bg-red-400',
    closed: 'bg-zinc-500',
    inactive: 'bg-zinc-500',
  };
  return colors[props.status] || 'bg-zinc-500';
});
</script>

<template>
  <span class="w-1.5 h-1.5 rounded-full" :class="[colorClass, pulse ? 'animate-pulse' : '']"></span>
</template>
