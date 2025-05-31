<template>
  <transition name="fade" mode="out-in" :duration="300">
    <div v-show="isSyncing" class="sync-status-wrapper">
      <div class="sync-status">
        <p>⌛ Syncing in progress...</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSyncStore } from "../stores/sync.store";

const syncStore = useSyncStore();

const { isSyncing } = storeToRefs(syncStore);
</script>

<style scoped>
.sync-status-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  background: rgba(0, 0, 0, 0.3);
  margin: 0;
  pointer-events: all;
}

.sync-status {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  pointer-events: all;
  font-style: italic;
}
</style>
