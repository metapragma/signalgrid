import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/feed',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/incidents',
    name: 'incidents',
    component: () => import('@/views/IncidentsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/incidents/:id',
    name: 'incident-detail',
    component: () => import('@/views/IncidentDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard - uses auth store which is initialized before router
router.beforeEach(async (to, _from, next) => {
  // Dynamically import to avoid circular dependency
  const { useAuthStore } = await import('@/stores/auth');
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Redirect to login if trying to access protected route
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && auth.isAuthenticated) {
    // Redirect to feed if trying to access guest-only route while logged in
    next({ name: 'feed' });
  } else {
    next();
  }
});

export default router;
