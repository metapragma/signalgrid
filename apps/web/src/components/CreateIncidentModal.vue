<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, AlertTriangle } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  create: [data: { title: string; description?: string }];
}>();

const title = ref('');
const description = ref('');
const isSubmitting = ref(false);

// Reset form when modal opens/closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      title.value = '';
      description.value = '';
    }
  },
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!title.value.trim()) return;

  isSubmitting.value = true;
  try {
    emit('create', {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleClose();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-icon">
              <AlertTriangle />
            </div>
            <div class="header-content">
              <h2 class="modal-title">Create Incident</h2>
              <p class="modal-subtitle">Track and resolve issues</p>
            </div>
            <button class="close-btn" @click="handleClose">
              <X />
            </button>
          </div>

          <!-- Body -->
          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="incident-title" class="form-label">Title</label>
              <input
                id="incident-title"
                v-model="title"
                type="text"
                class="form-input"
                placeholder="Brief description of the incident"
                :disabled="isSubmitting"
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="incident-description" class="form-label">
                Description
                <span class="optional">(optional)</span>
              </label>
              <textarea
                id="incident-description"
                v-model="description"
                class="form-textarea"
                placeholder="Additional details about the incident..."
                rows="4"
                :disabled="isSubmitting"
              ></textarea>
            </div>
          </form>

          <!-- Footer -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="isSubmitting"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!title.trim() || isSubmitting"
              @click="handleSubmit"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Incident' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(8px);
  z-index: 100;
}

.modal-container {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 20px;
  border: 1px solid var(--color-sg-border);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-6) 0;
}

.header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-sg-error-subtle);
  border-radius: 14px;
  color: var(--color-sg-error);
  flex-shrink: 0;
}

.header-icon svg {
  width: 22px;
  height: 22px;
}

.header-content {
  flex: 1;
}

.modal-title {
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-title);
  color: var(--color-sg-text);
  margin-bottom: var(--space-1);
}

.modal-subtitle {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-8);
  height: var(--space-8);
  background: none;
  border: none;
  border-radius: 999px;
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--color-sg-text);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

/* Body */
.modal-body {
  padding: var(--space-6);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-secondary);
  margin-bottom: var(--space-2);
}

.optional {
  font-weight: var(--weight-regular);
  text-transform: none;
  letter-spacing: var(--tracking-normal);
  color: var(--color-sg-text-subtle);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  background-color: white;
  border: 1px solid var(--color-sg-border);
  border-radius: 14px;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  transition: all 0.15s;
  font-family: inherit;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-sg-text-subtle);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
}

.form-input:disabled,
.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6) var(--space-6);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 10px 16px;
  border-radius: 999px;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  cursor: pointer;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  color: var(--color-sg-text-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-sg-bg-hover);
  color: var(--color-sg-text);
}

.btn-primary {
  background-color: var(--color-sg-accent);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-sg-accent-hover);
}
</style>
