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
  'w-full px-3 py-2 text-sm text-zinc-100 bg-zinc-900',
  'border border-zinc-700 rounded-lg',
  'placeholder:text-zinc-500',
  'focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors',
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
