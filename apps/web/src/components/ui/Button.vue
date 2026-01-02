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
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  const variants = {
    primary: 'text-zinc-950 bg-cyan-400 hover:bg-cyan-300 focus:ring-cyan-400/50',
    secondary:
      'text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 focus:ring-cyan-400/50',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus:ring-cyan-400/50',
    danger:
      'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 focus:ring-red-400/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
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
