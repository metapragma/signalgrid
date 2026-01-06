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
    'inline-flex items-center justify-center gap-2 font-medium tracking-wide rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all';

  const variants = {
    primary: 'text-zinc-950 bg-cyan-400 hover:bg-cyan-300',
    secondary: 'text-zinc-300 bg-[--color-sg-bg-hover] hover:bg-zinc-700 hover:text-zinc-100',
    ghost: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
    danger: 'text-red-400 bg-red-500/10 hover:bg-red-500/20',
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
