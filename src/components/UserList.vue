<template>
  <div class="user-list-container">
    <header class="header">
      <h1>User List</h1>
      <div class="sync-status">
        <span :class="['status-indicator', { syncing: isSyncing }]">
          {{ syncStatusText }}
        </span>
        <span class="last-sync" v-if="lastSyncTime">
          Last sync: {{ formatDate(lastSyncTime) }}
        </span>
      </div>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </header>

    <div class="users-grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-info">
          <h3>{{ user.firstName }} {{ user.lastName }}</h3>
          <p class="email">{{ user.email }}</p>
          <p class="role">{{ user.role }}</p>
        </div>
        <div class="user-meta">
          <p>Created: {{ formatDate(user.createdAt) }}</p>
          <p>Updated: {{ formatDate(user.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Loading more users...</div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useIntersectionObserver } from "@vueuse/core";
import type { User } from "../types";
import { ApiService } from "../services/api.service";
import { StorageService } from "../services/storage.service";

const router = useRouter();
const apiService = new ApiService();
const storageService = new StorageService();

const users = ref<User[]>([]);
const isLoading = ref(false);
const error = ref("");
const isSyncing = ref(false);
const lastSyncTime = ref<string | null>(null);
const currentPage = ref(1);
const hasMore = ref(true);

const syncStatusText = computed(() => {
  if (isSyncing.value) return "Syncing...";
  if (error.value) return "Sync failed";
  return "Synced";
});

const loadMoreTrigger = ref<HTMLElement | null>(null);

useIntersectionObserver(loadMoreTrigger, async ([{ isIntersecting }]) => {
  if (isIntersecting && !isLoading.value && hasMore.value) {
    await loadMoreUsers();
  }
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const loadMoreUsers = async () => {
  if (isLoading.value || !hasMore.value) return;

  try {
    isLoading.value = true;
    const result = await apiService.syncUsers(currentPage.value);
    users.value = [...users.value, ...result.users];
    hasMore.value = result.hasMore;
    currentPage.value++;
  } catch (err) {
    error.value = "Failed to load more users";
  } finally {
    isLoading.value = false;
  }
};

const handleSync = async () => {
  try {
    isSyncing.value = true;
    error.value = "";
    const result = await apiService.syncUsers(1);
    users.value = result.users;
    hasMore.value = result.hasMore;
    currentPage.value = 2;
    lastSyncTime.value = new Date().toISOString();

    // Save fetched users to IndexedDB
    await storageService.saveUsers(users.value);
    console.log("Saved", users.value.length, "users to IndexedDB");

    await storageService.updateSyncStatus({
      lastSyncTime: lastSyncTime.value,
      totalRecords: users.value.length,
    });
  } catch (err) {
    error.value = "Sync failed";
  } finally {
    isSyncing.value = false;
  }
};

const handleLogout = () => {
  apiService.logout();
  router.push("/login");
};

onMounted(async () => {
  await storageService.init();

  console.log("Storage initialized, loading users...");

  await loadMoreUsers();

  // Load users from IndexedDB first for offline support
  try {
    const storedUsers = await storageService.getUsers();
    if (storedUsers && storedUsers.length > 0) {
      users.value = storedUsers;
      console.log("Loaded users from IndexedDB:", storedUsers.length);
    }
  } catch (err) {
    console.error("Failed to load users from IndexedDB:", err);
  }

  const status = await storageService.getSyncStatus();
  if (status) {
    lastSyncTime.value = status.lastSyncTime;
  }

  // Then, attempt to sync with the API
  await handleSync();

  // Start periodic sync only if initial sync was attempted (regardless of success)
  apiService.startPeriodicSync(async (newUsers) => {
    users.value = newUsers;
    lastSyncTime.value = new Date().toISOString();

    // Save fetched users from periodic sync to IndexedDB
    await storageService.saveUsers(newUsers);
    console.log(
      "Saved",
      newUsers.length,
      "users from periodic sync to IndexedDB"
    );

    await storageService.updateSyncStatus({
      lastSyncTime: lastSyncTime.value,
      totalRecords: newUsers.length,
    });
  });
});

onUnmounted(() => {
  apiService.stopPeriodicSync();
});
</script>

<style scoped>
.user-list-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background-color: #4caf50;
  color: white;
}

.status-indicator.syncing {
  background-color: #ff9800;
}

.last-sync {
  color: #666;
  font-size: 0.9rem;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.email {
  color: #666;
  margin: 0.5rem 0;
}

.role {
  color: #4a90e2;
  font-weight: 500;
  margin: 0.5rem 0;
}

.user-meta {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.error {
  text-align: center;
  padding: 1rem;
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>
