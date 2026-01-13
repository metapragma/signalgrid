<script setup lang="ts">
import { X } from 'lucide-vue-next';

defineOptions({ name: 'SgModal' });

defineProps<{
  title: string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const handleBackdropClick = () => {
  emit('close');
};

const handleContentClick = (event: Event) => {
  event.stopPropagation();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-40" @click="handleBackdropClick">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6">
          <div
            class="w-full max-w-lg bg-[--color-sg-bg-card] border border-[--color-sg-border] rounded-2xl shadow-[--shadow-xl] backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
            @click="handleContentClick"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6">
              <h2 class="text-lg sm:text-xl font-medium text-[--color-sg-text]">{{ title }}</h2>
              <button
                class="text-[--color-sg-text-subtle] hover:text-[--color-sg-text] transition-colors p-1.5 rounded-full hover:bg-white/60"
                @click="emit('close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 sm:px-8 pb-6">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 sm:px-8 py-5 sm:py-6 bg-white"
            >
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
