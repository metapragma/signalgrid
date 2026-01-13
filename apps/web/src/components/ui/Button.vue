<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'SgButton' });

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
);

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-full border border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[--shadow-sm]';

  const variants = {
    primary:
      'text-white bg-[--color-sg-accent] hover:bg-[--color-sg-accent-hover] shadow-[0_12px_24px_rgba(11,95,255,0.2)]',
    secondary:
      'text-[--color-sg-text] bg-white border-[--color-sg-border] hover:bg-[--color-sg-bg-hover]',
    ghost:
      'text-[--color-sg-text-secondary] hover:text-[--color-sg-text] hover:bg-[--color-sg-accent-subtle]',
    danger:
      'text-[--color-sg-error] bg-[--color-sg-error-subtle] border-[--color-sg-error-muted] hover:bg-[--color-sg-error-muted]',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return [base, variants[props.variant], sizes[props.size]];
});
</script>

<template>
  <button :class="classes" :disabled="disabled || loading">
    <span
      v-if="loading"
      class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
    ></span>
    <slot />
  </button>
</template>
