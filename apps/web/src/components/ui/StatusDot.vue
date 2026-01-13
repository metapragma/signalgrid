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
    connected: 'bg-[--color-sg-success]',
    open: 'bg-[--color-sg-success]',
    pending: 'bg-[--color-sg-warn]',
    connecting: 'bg-[--color-sg-warn]',
    error: 'bg-[--color-sg-error]',
    closed: 'bg-[--color-sg-text-subtle]',
    inactive: 'bg-[--color-sg-text-subtle]',
  };
  return colors[props.status] || 'bg-[--color-sg-text-subtle]';
});
</script>

<template>
  <span class="w-1.5 h-1.5 rounded-full" :class="[colorClass, pulse ? 'animate-pulse' : '']"></span>
</template>
