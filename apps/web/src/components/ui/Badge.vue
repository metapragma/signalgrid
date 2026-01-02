<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'SgBadge' });

const props = withDefaults(
  defineProps<{
    variant?: 'error' | 'warn' | 'info' | 'debug' | 'success' | 'neutral';
  }>(),
  {
    variant: 'neutral',
  },
);

const classes = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded';

  const variants = {
    error: 'bg-red-500/20 text-red-400',
    warn: 'bg-amber-500/20 text-amber-400',
    info: 'bg-blue-500/20 text-blue-400',
    debug: 'bg-zinc-500/20 text-zinc-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    neutral: 'bg-zinc-500/20 text-zinc-400',
  };

  return [base, variants[props.variant]];
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
