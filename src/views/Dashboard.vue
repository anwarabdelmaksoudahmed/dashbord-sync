<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <SyncStatus :isOnline="props.isOnline" />

    <div class="users-section">
      <div class="section-header">
        <h2>Users</h2>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search users..."
            @input="filterUsers"
          />
        </div>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="filteredUsers.length === 0" class="no-results">
        No users found
      </div>

      <div v-else class="users-grid">
       
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div class="user-avatar">
            {{ getUserInitials(user) }}
           
          </div>
          <div class="user-info">
            {{ user.username }}
          </div>
          <div class="user-actions">
            <button class="action-btn edit" title="Edit user">
              <span class="icon">✏️</span>
            </button>
            <button class="action-btn delete" title="Delete user">
              <span class="icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredUsers.length > 0" class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info"
          >Page {{ currentPage }} of {{ totalPages }}</span
        >
        <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps } from "vue";
import { useSyncStore } from "../stores/sync.store";
import SyncStatus from "../components/SyncStatus.vue";
import type { AdaptedUser } from "../types";

const props = defineProps(["isOnline"]);

const syncStore = useSyncStore();
const users = ref<AdaptedUser[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 12;

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (user: AdaptedUser) =>
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
  );
});

const totalPages = computed(() =>
  Math.ceil(filteredUsers.value.length / itemsPerPage)
);

function getUserInitials(user: AdaptedUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
}

function filterUsers() {
  currentPage.value = 1;
}

function changePage(page: number) {
  currentPage.value = page;
}

async function loadUsers() {
  try {
    error.value = null;
    isLoading.value = true;

    users.value = await syncStore.getUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load users";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-box input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 250px;
}

.users-section {
  margin-top: 2rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.user-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0;
  color: #333;
}

.email {
  color: #666;
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.username {
  color: #4caf50;
  margin: 0;
  font-size: 0.875rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.action-btn.edit:hover {
  color: #2196f3;
}

.action-btn.delete:hover {
  color: #dc3545;
}

.loading {
  text-align: center;
  color: #666;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  color: #dc3545;
  text-align: center;
  padding: 2rem;
}

.no-results {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.page-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}
</style>
