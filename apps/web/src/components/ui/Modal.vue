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
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            class="w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            @click="handleContentClick"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800"
            >
              <h2 class="text-base sm:text-lg font-medium text-zinc-100">{{ title }}</h2>
              <button
                class="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-lg hover:bg-zinc-800"
                @click="emit('close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <div class="px-4 sm:px-6 py-4">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-950/50"
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
