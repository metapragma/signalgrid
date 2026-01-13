<script setup lang="ts">
defineOptions({ name: 'SgTextarea' });

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    rows?: number;
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    rows: 3,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const textareaClasses = [
  'w-full px-4 py-2.5 text-sm text-[--color-sg-text] bg-white',
  'border border-[--color-sg-border] rounded-xl',
  'placeholder:text-[--color-sg-text-subtle]',
  'focus:outline-none',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-all resize-none',
];

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-xs font-medium text-[--color-sg-text-muted]">
      {{ label }}
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :class="textareaClasses"
      @input="onInput"
    ></textarea>
  </div>
</template>
