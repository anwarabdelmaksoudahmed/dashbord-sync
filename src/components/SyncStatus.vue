<template>
  <div class="sync-status" :class="{ 'is-syncing': isSyncing, 'is-offline': !isOnline }">
    <div class="sync-info">
      <span class="status-indicator" :class="{ 'syncing': isSyncing, 'offline': !isOnline }"></span>
      <span class="status-text">
        {{ statusText }}
      </span>
    </div>
    
    <div v-if="lastSyncTime" class="sync-details">
      <p>Last sync: {{ formatDate(lastSyncTime) }}</p>
      <p>Total records: {{ totalRecords }}</p>
      <p class="connection-status" :class="{ 'offline': !isOnline }">
        {{ isOnline ? 'Online' : 'Offline' }}
      </p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSyncStore } from '../stores/sync.store';
import { storeToRefs } from 'pinia';

const syncStore = useSyncStore();
const { isSyncing, lastSyncTime, totalRecords, error } = storeToRefs(syncStore);

const isOnline = computed(() => navigator.onLine);

const statusText = computed(() => {
  if (!isOnline.value) return 'Offline Mode';
  if (isSyncing.value) return 'Syncing...';
  return 'Sync Status';
});

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
</script>

<style scoped>
.sync-status {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 1rem;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #4CAF50;
}

.status-indicator.syncing {
  background-color: #ffc107;
  animation: pulse 1.5s infinite;
}

.status-indicator.offline {
  background-color: #dc3545;
}

.sync-details {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.connection-status {
  margin-top: 0.5rem;
  font-weight: 500;
  color: #4CAF50;
}

.connection-status.offline {
  color: #dc3545;
}

.error-message {
  margin-top: 0.5rem;
  color: #dc3545;
  font-size: 0.875rem;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style> 