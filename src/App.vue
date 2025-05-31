<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth.store';
import { useSyncStore } from './stores/sync.store';
import { storeToRefs } from 'pinia';

console.log('App.vue setup starting...');

const router = useRouter();
const authStore = useAuthStore();
const syncStore = useSyncStore();
const { isAuthenticated } = storeToRefs(authStore);

console.log('Initial authentication state:', isAuthenticated.value);

onMounted(async () => {
  console.log('App.vue mounted, initializing...');
  try {
    await syncStore.initialize();
    console.log('Sync store initialized');
    
    if (isAuthenticated.value) {
      console.log('User is authenticated, starting sync...');
      await syncStore.startSync();
      console.log('Sync started successfully');
    } else {
      console.log('User is not authenticated');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

async function handleLogout() {
  console.log('Logout initiated');
  authStore.logout();
  router.push('/login');
  console.log('Redirected to login page');
}
</script>

<template>
  <div class="app">
    <nav v-if="isAuthenticated" class="nav">
      <router-link to="/dashboard">Dashboard</router-link>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </nav>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.nav {
  background: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

.nav a.router-link-active {
  color: #4CAF50;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #c82333;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
