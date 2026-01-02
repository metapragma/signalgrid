<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'SgCard' });

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
  }>(),
  {
    variant: 'default',
    padding: 'md',
    hover: false,
  },
);

const classes = computed(() => {
  const base = 'rounded-xl transition-colors';

  const variants = {
    default: 'bg-zinc-900 border border-zinc-800',
    elevated: 'bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 shadow-2xl shadow-black/50',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverClass = props.hover ? 'hover:border-zinc-700 cursor-pointer' : '';

  return [base, variants[props.variant], paddings[props.padding], hoverClass];
});
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
