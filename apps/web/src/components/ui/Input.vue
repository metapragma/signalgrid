<script setup lang="ts">
defineOptions({ name: 'SgInput' });

withDefaults(
  defineProps<{
    modelValue?: string;
    type?: 'text' | 'email' | 'password' | 'search';
    placeholder?: string;
    disabled?: boolean;
    label?: string;
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputClasses = [
  'w-full px-4 py-3 text-sm text-zinc-100 bg-[--color-sg-bg-elevated]',
  'border-0 rounded-lg',
  'placeholder:text-zinc-500',
  'focus:outline-none focus:ring-1 focus:ring-white/10',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-all',
];

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
      {{ label }}
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClasses"
      @input="onInput"
    />
  </div>
</template>
