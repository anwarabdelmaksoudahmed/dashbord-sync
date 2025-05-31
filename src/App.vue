<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth.store";
import { useSyncStore } from "./stores/sync.store";
import { storeToRefs } from "pinia";
import { ref, Ref, onMounted, onUnmounted } from "vue";
import SyncProgress from "./components/SyncProgress.vue";

const router = useRouter();
const authStore = useAuthStore();
const syncStore = useSyncStore();
const isOnline = ref(navigator.onLine);
const syncIntervalRef: Ref<number | null> = ref(null);
const { isAuthenticated } = storeToRefs(authStore);

const syncInterval: number = 60000; // 1 minute

function updateOnlineStatus() {
  isOnline.value = navigator.onLine;

  // When entering offline mode, clear the sync interval
  if (!isOnline.value) {
    resetSyncInterval();
  }

  if (isOnline.value) {
    syncStore.startSync();

    resetSyncInterval();

    registerSyncInterval();
  }
}

console.log("Initial authentication state:", isAuthenticated.value);

onMounted(async () => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  try {
    await syncStore.initialize();

    if (isOnline.value) {
      syncStore.startSync();
      registerSyncInterval();
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});

function resetSyncInterval() {
  if (syncIntervalRef.value) {
    clearInterval(syncIntervalRef.value);
    syncIntervalRef.value = null;
  }
}

function registerSyncInterval() {
  if (syncIntervalRef.value) return;

  syncIntervalRef.value = setInterval(() => {
    if (isOnline.value) {
      syncStore.startSync();
    }
  }, syncInterval);
}

async function handleLogout() {
  authStore.logout();

  router.push("/login");
}
</script>

<template>
  <div class="app">
    <nav v-if="isAuthenticated" class="nav">
      <router-link to="/dashboard">Dashboard</router-link>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </nav>

    <SyncProgress />

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :isOnline="isOnline" />
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
  color: #4caf50;
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
