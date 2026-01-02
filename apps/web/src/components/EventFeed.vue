<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useVirtualList } from '@vueuse/core';
import type { Event } from '@signalgrid/sdk';
import EventRow from './EventRow.vue';

const props = defineProps<{
  events: Event[];
  hasMore: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  'load-more': [];
}>();

// Virtual list configuration
const ROW_HEIGHT = 37; // Height of each row in pixels
const OVERSCAN = 5; // Extra rows to render above/below viewport

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  computed(() => props.events),
  {
    itemHeight: ROW_HEIGHT,
    overscan: OVERSCAN,
  },
);

// Infinite scroll: load more when near bottom
const handleScroll = (event: globalThis.Event) => {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  // Load more when within 200px of bottom
  if (scrollHeight - scrollTop - clientHeight < 200) {
    if (props.hasMore && !props.isLoading) {
      emit('load-more');
    }
  }
};

// Track scroll position for auto-scroll behavior
const isAtTop = ref(true);
const hasNewEvents = ref(false);
let lastEventCount = 0;

watch(
  () => props.events.length,
  (newCount) => {
    if (newCount > lastEventCount && !isAtTop.value) {
      hasNewEvents.value = true;
    }
    lastEventCount = newCount;
  },
);

const scrollToTop = () => {
  scrollTo(0);
  isAtTop.value = true;
  hasNewEvents.value = false;
};

const updateScrollPosition = (event: globalThis.Event) => {
  const target = event.target as HTMLElement;
  isAtTop.value = target.scrollTop < 50;
  if (isAtTop.value) {
    hasNewEvents.value = false;
  }
  handleScroll(event);
};

onMounted(() => {
  lastEventCount = props.events.length;
});
</script>

<template>
  <div class="event-feed">
    <!-- Header -->
    <div class="feed-header">
      <span class="event-count">{{ events.length }} events</span>
    </div>

    <!-- New events indicator -->
    <button v-if="hasNewEvents" class="new-events-btn" @click="scrollToTop">
      New events available
    </button>

    <!-- Virtual list container -->
    <div v-bind="containerProps" class="feed-container" @scroll="updateScrollPosition">
      <div v-bind="wrapperProps">
        <EventRow
          v-for="{ data: event } in list"
          :key="event.id"
          :event="event"
          :style="{ height: `${ROW_HEIGHT}px` }"
        />
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-indicator">Loading more events...</div>

      <!-- End of list -->
      <div v-else-if="!hasMore && events.length > 0" class="end-indicator">No more events</div>

      <!-- Empty state -->
      <div v-if="events.length === 0 && !isLoading" class="empty-state">
        <p>No events yet</p>
        <p class="empty-hint">Events will appear here in real-time</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-feed {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #121212;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
}

.event-count {
  font-size: 12px;
  color: #666;
}

.new-events-btn {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background-color: #5eaeff;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: background-color 0.15s ease;
}

.new-events-btn:hover {
  background-color: #7ec8ff;
}

.feed-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-indicator,
.end-indicator {
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #666;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #444;
}
</style>
