<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';

const route = useRoute();

// Show app layout for authenticated routes (not login, register, or home)
const showAppLayout = computed(() => {
  return route.meta.requiresAuth === true;
});
</script>

<template>
  <AppLayout v-if="showAppLayout">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
