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
  'w-full px-4 py-2.5 text-sm text-[--color-sg-text] bg-white',
  'border border-[--color-sg-border] rounded-xl',
  'placeholder:text-[--color-sg-text-subtle]',
  'focus:outline-none',
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
    <label v-if="label" class="block text-xs font-medium text-[--color-sg-text-muted]">
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
