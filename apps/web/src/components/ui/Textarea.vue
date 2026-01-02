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
  'w-full px-3 py-2 text-sm text-zinc-100 bg-zinc-900',
  'border border-zinc-700 rounded-lg',
  'placeholder:text-zinc-500',
  'focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors resize-none',
];

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
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
