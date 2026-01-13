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
  const base =
    'inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-full border border-transparent';

  const variants = {
    error: 'bg-[--color-sg-error-subtle] text-[--color-sg-error]',
    warn: 'bg-[--color-sg-warn-subtle] text-[--color-sg-warn]',
    info: 'bg-[--color-sg-info-subtle] text-[--color-sg-info]',
    debug: 'bg-[--color-sg-debug-muted] text-[--color-sg-text-muted]',
    success: 'bg-[--color-sg-success-subtle] text-[--color-sg-success]',
    neutral: 'bg-white text-[--color-sg-text-secondary] border-[--color-sg-border]',
  };

  return [base, variants[props.variant]];
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
