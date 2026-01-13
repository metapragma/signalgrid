<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, MessageSquare, Activity } from 'lucide-vue-next';
import { Card, StatusDot } from './ui';
import type { IncidentSummary } from '@/stores/incidents';

const props = defineProps<{
  incident: IncidentSummary;
}>();

const emit = defineEmits<{
  click: [];
}>();

const isOpen = computed(() => props.incident.status === 'OPEN');

const timeAgo = computed(() => {
  const date = new Date(props.incident.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
});

const shortId = computed(() => {
  return props.incident.id.slice(0, 8).toUpperCase();
});
</script>

<template>
  <Card hover class="group" @click="emit('click')">
    <!-- Header row -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <StatusDot :status="isOpen ? 'open' : 'closed'" />
        <span
          class="text-xs font-medium"
          :class="isOpen ? 'text-[--color-sg-success]' : 'text-[--color-sg-text-muted]'"
        >
          {{ incident.status }}
        </span>
        <span class="font-mono text-xs text-[--color-sg-text-subtle]">{{ shortId }}</span>
      </div>
      <span class="text-xs text-[--color-sg-text-subtle]">{{ timeAgo }}</span>
    </div>

    <!-- Title -->
    <h3 class="text-sm font-medium text-[--color-sg-text] mb-3 line-clamp-2">
      {{ incident.title }}
    </h3>

    <!-- Footer row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4 text-xs text-[--color-sg-text-muted]">
        <span class="inline-flex items-center gap-1">
          <Activity class="w-3.5 h-3.5" />
          {{ incident.eventCount }} events
        </span>
        <span class="inline-flex items-center gap-1">
          <MessageSquare class="w-3.5 h-3.5" />
          {{ incident.commentCount }} comments
        </span>
      </div>
      <span
        class="inline-flex items-center gap-1 text-xs text-[--color-sg-text-subtle] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        View
        <ChevronRight class="w-3.5 h-3.5" />
      </span>
    </div>
  </Card>
</template>
