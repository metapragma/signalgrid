<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, Bell, LayoutGrid, LogOut, Settings, User, X } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const showUserMenu = ref(false);
const showNotifications = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
const notificationsRef = ref<HTMLElement | null>(null);

const navItems = [
  { name: 'Dashboard', to: '/dashboard' },
  { name: 'Feed', to: '/feed' },
  { name: 'Incidents', to: '/incidents' },
];

// Mock notifications for now
const notifications = ref([
  {
    id: '1',
    title: 'New incident created',
    message: 'API Gateway 5xx Spike',
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    title: 'Incident resolved',
    message: 'Database connection timeout',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    title: 'New comment',
    message: 'Marcus Reed commented on INC-001',
    time: '3h ago',
    unread: true,
  },
]);

const unreadCount = computed(() => notifications.value.filter((n) => n.unread).length);

const currentRoute = computed(() => route.path);

const isActive = (path: string) => {
  return currentRoute.value.startsWith(path);
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  showNotifications.value = false;
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  showUserMenu.value = false;
};

const handleLogout = async () => {
  showUserMenu.value = false;
  await auth.logout();
  router.replace('/login');
};

const markAsRead = (id: string) => {
  const notification = notifications.value.find((n) => n.id === id);
  if (notification) {
    notification.unread = false;
  }
};

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.unread = false));
};

const clearNotification = (id: string) => {
  notifications.value = notifications.value.filter((n) => n.id !== id);
};

// Get user initials for avatar
const userInitials = computed(() => {
  if (!auth.user?.user.email) return '?';
  return auth.user.user.email.charAt(0).toUpperCase();
});

const userEmail = computed(() => auth.user?.user.email || '');

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    showUserMenu.value = false;
  }
  if (notificationsRef.value && !notificationsRef.value.contains(target)) {
    showNotifications.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="app-layout">
    <!-- Global Navigation -->
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="logo">
          <LayoutGrid class="logo-icon" :stroke-width="1" />
          <span class="logo-text">SignalGrid</span>
        </router-link>

        <!-- Search (desktop) -->
        <div class="search-bar">
          <Search class="search-icon" />
          <input type="text" placeholder="Search..." class="search-input" />
        </div>
      </div>

      <nav class="header-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <div class="header-right">
        <!-- Notifications -->
        <div ref="notificationsRef" class="dropdown-wrapper">
          <button
            class="icon-btn notifications-btn"
            :class="{ active: showNotifications }"
            @click.stop="toggleNotifications"
          >
            <Bell class="icon" />
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </button>

          <!-- Notifications Dropdown -->
          <Transition name="dropdown">
            <div v-if="showNotifications" class="dropdown notifications-dropdown">
              <div class="dropdown-header">
                <h3>Notifications</h3>
                <button v-if="unreadCount > 0" class="mark-read-btn" @click="markAllAsRead">
                  Mark all read
                </button>
              </div>

              <div v-if="notifications.length === 0" class="empty-notifications">
                <Bell class="empty-icon" />
                <p>No notifications</p>
              </div>

              <div v-else class="notifications-list">
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: notification.unread }"
                  @click="markAsRead(notification.id)"
                >
                  <div class="notification-content">
                    <p class="notification-title">{{ notification.title }}</p>
                    <p class="notification-message">{{ notification.message }}</p>
                    <span class="notification-time">{{ notification.time }}</span>
                  </div>
                  <button
                    class="notification-close"
                    @click.stop="clearNotification(notification.id)"
                  >
                    <X class="close-icon" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- User Menu -->
        <div ref="userMenuRef" class="dropdown-wrapper">
          <button
            class="avatar-btn"
            :class="{ active: showUserMenu }"
            @click.stop="toggleUserMenu"
            title="Account menu"
          >
            {{ userInitials }}
          </button>

          <!-- User Dropdown -->
          <Transition name="dropdown">
            <div v-if="showUserMenu" class="dropdown user-dropdown">
              <div class="dropdown-user-info">
                <div class="user-avatar">{{ userInitials }}</div>
                <div class="user-details">
                  <p class="user-name">{{ userEmail.split('@')[0] }}</p>
                  <p class="user-email">{{ userEmail }}</p>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <button class="dropdown-item" @click="showUserMenu = false">
                <User class="item-icon" />
                Profile
              </button>
              <button class="dropdown-item" @click="showUserMenu = false">
                <Settings class="item-icon" />
                Settings
              </button>

              <div class="dropdown-divider"></div>

              <button class="dropdown-item logout" @click="handleLogout">
                <LogOut class="item-icon" />
                Sign out
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 var(--space-4);
  background-color: var(--color-sg-bg-elevated);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--color-sg-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 50;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-sg-accent);
  opacity: 0.7;
}

@media (min-width: 768px) {
  .app-header {
    padding: 0 var(--space-6);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 0 0 auto;
}

@media (min-width: 768px) {
  .header-left {
    gap: var(--space-6);
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  color: var(--color-sg-text);
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: var(--color-sg-text);
  stroke-width: 1;
}

.logo-text {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
}

@media (max-width: 640px) {
  .logo-text {
    display: none;
  }
}

.search-bar {
  display: none;
  align-items: center;
  background-color: var(--color-sg-bg-elevated);
  border-radius: 999px;
  padding: 6px 12px;
  width: 240px;
  border: 1px solid var(--color-sg-border);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
}

@media (min-width: 768px) {
  .search-bar {
    display: flex;
  }
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-sg-text-subtle);
  flex-shrink: 0;
}

.search-input {
  background: none;
  border: none;
  color: var(--color-sg-text);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  padding: 0 var(--space-2);
  width: 100%;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-sg-text-subtle);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  justify-content: center;
}

@media (min-width: 768px) {
  .header-nav {
    gap: var(--space-2);
  }
}

.nav-link {
  padding: 6px 8px;
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition:
    color 0.15s,
    border-color 0.15s;
}

@media (max-width: 640px) {
  .nav-link {
    padding: var(--space-2);
  }
}

.nav-link:hover {
  color: var(--color-sg-text);
}

.nav-link.active {
  color: var(--color-sg-accent);
  border-color: var(--color-sg-accent);
  font-weight: var(--weight-semibold);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

@media (min-width: 768px) {
  .header-right {
    gap: var(--space-3);
  }
}

.dropdown-wrapper {
  position: relative;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 999px;
  color: var(--color-sg-text-secondary);
  cursor: pointer;
  transition:
    color 0.15s,
    background-color 0.15s;
  position: relative;
}

.icon-btn:hover,
.icon-btn.active {
  color: var(--color-sg-text);
  background-color: var(--color-sg-bg-hover);
}

.icon-btn .icon {
  width: 20px;
  height: 20px;
}

.notifications-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: var(--weight-semibold);
  color: white;
  background-color: var(--color-sg-error);
  border: 2px solid var(--color-sg-bg-elevated);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-sg-accent-subtle);
  border: 1px solid var(--color-sg-accent-muted);
  color: var(--color-sg-text);
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.avatar-btn:hover,
.avatar-btn.active {
  transform: scale(1.04);
  box-shadow: 0 0 0 3px rgba(0, 203, 179, 0.18);
}

/* Dropdowns */
.dropdown {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  background-color: var(--color-sg-bg-elevated);
  border: 1px solid var(--color-sg-border);
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(18px);
  z-index: 100;
  overflow: hidden;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Notifications Dropdown */
.notifications-dropdown {
  width: 340px;
  max-width: calc(100vw - var(--space-8));
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
}

.dropdown-header h3 {
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
}

.mark-read-btn {
  background: none;
  border: none;
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: color 0.15s;
}

.mark-read-btn:hover {
  color: var(--color-sg-text);
}

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--color-sg-text-subtle);
  margin-bottom: var(--space-2);
}

.empty-notifications p {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
}

.notifications-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;
}

.notification-item:hover {
  background-color: var(--color-sg-bg-hover);
}

.notification-item.unread {
  background-color: var(--color-sg-accent-subtle);
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-sg-accent);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  margin-bottom: 2px;
}

.notification-message {
  font-size: var(--text-body);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: var(--text-micro);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-subtle);
}

.notification-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--color-sg-text-subtle);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.notification-item:hover .notification-close {
  opacity: 1;
}

.notification-close:hover {
  background-color: var(--color-sg-bg-hover);
  color: var(--color-sg-text);
}

.close-icon {
  width: 14px;
  height: 14px;
}

/* User Dropdown */
.user-dropdown {
  width: 240px;
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-sg-accent-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-body);
  font-weight: var(--weight-semibold);
  color: var(--color-sg-text);
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: var(--text-body);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
  color: var(--color-sg-text);
  margin-bottom: 2px;
}

.user-email {
  font-size: var(--text-micro);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-sg-border);
  margin: var(--space-2) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  font-size: var(--text-body);
  font-weight: var(--weight-regular);
  line-height: var(--leading-body);
  color: var(--color-sg-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--color-sg-bg-hover);
  color: var(--color-sg-text);
}

.dropdown-item.logout {
  color: var(--color-sg-error);
}

.dropdown-item.logout:hover {
  background-color: var(--color-sg-error-muted);
  color: var(--color-sg-error);
}

.item-icon {
  width: 16px;
  height: 16px;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
