<template>
  <div
    class="sync-status"
    :class="{ 'is-syncing': isSyncing, 'is-offline': !props.isOnline }"
  >
    <div class="sync-info">
      <span
        class="status-indicator"
        :class="{ syncing: isSyncing, offline: !props.isOnline }"
      ></span>
      <span class="connection-status" :class="{ offline: !props.isOnline }">
        {{ props.isOnline ? "Online" : "Offline" }}
      </span>
    </div>

    <div v-if="lastSyncTime" class="sync-details">
      <p><b>Last sync:</b> {{ formatDate(lastSyncTime) }}</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { useSyncStore } from "../stores/sync.store";
import { storeToRefs } from "pinia";

const props = defineProps(["isOnline"]);
const syncStore = useSyncStore();
const { isSyncing, lastSyncTime, error } = storeToRefs(syncStore);

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
  background-color: #4caf50;
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
  font-weight: 500;
  color: #4caf50;
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
