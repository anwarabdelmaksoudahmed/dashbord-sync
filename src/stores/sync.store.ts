import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '../services/api.service';
import { dbService } from '../services/db.service';
import type { AdaptedUser } from '../types';

export const useSyncStore = defineStore('sync', () => {
  const isSyncing = ref(false);
  const lastSyncTime = ref<number | null>(null);
  const totalRecords = ref(0);
  const error = ref<string | null>(null);

  async function initialize() {
    await dbService.init();
    const status = await dbService.getSyncStatus();
    if (status) {
      lastSyncTime.value = status.lastSync;
      totalRecords.value = status.totalRecords;
    }
  }

  async function startSync() {
    try {
      isSyncing.value = true;
      error.value = null;
      await apiService.startPeriodicSync();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sync failed';
      throw err;
    } finally {
      isSyncing.value = false;
    }
  }

  async function getUsers(): Promise<AdaptedUser[]> {
    return dbService.getAllUsers();
  }

  return {
    isSyncing,
    lastSyncTime,
    totalRecords,
    error,
    initialize,
    startSync,
    getUsers
  };
}); 