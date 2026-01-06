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
  const base = 'rounded-2xl transition-all';

  const variants = {
    default: 'bg-[--color-sg-bg-card]',
    elevated: 'bg-[--color-sg-bg-card] shadow-[--shadow-md]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = props.hover ? 'hover:bg-[--color-sg-bg-hover] hover:shadow-[--shadow-md] cursor-pointer' : '';

  return [base, variants[props.variant], paddings[props.padding], hoverClass];
});
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
