import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, AdaptedUser } from '../types';

interface SyncAppDB extends DBSchema {
  users: {
    key: number;
    value: AdaptedUser;
    indexes: { 'by-username': string };
  };
  syncStatus: {
    key: string;
    value: {
      lastSync: number;
      totalRecords: number;
      isOnline: boolean;
    };
  };
  offlineQueue: {
    key: string;
    value: {
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
}

class DatabaseService {
  private db: IDBPDatabase<SyncAppDB> | null = null;
  private readonly DB_NAME = 'sync-app-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<SyncAppDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create users store
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-username', 'username', { unique: true });

        // Create sync status store
        db.createObjectStore('syncStatus', { keyPath: 'id' });

        // Create offline queue store
        db.createObjectStore('offlineQueue', { keyPath: 'id' });
      },
    });

    // Initialize sync status
    await this.updateSyncStatus(0, navigator.onLine);
  }

  async saveUsers(users: AdaptedUser[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');

    for (const user of users) {
      await store.put(user);
    }

    await tx.done;
  }

  async getUser(id: number): Promise<AdaptedUser | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('users', id);
  }

  async getUserByUsername(username: string): Promise<AdaptedUser | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    const index = this.db.transaction('users').store.index('by-username');
    return index.get(username);
  }

  async getAllUsers(): Promise<AdaptedUser[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('users');
  }

  async updateSyncStatus(totalRecords: number, isOnline: boolean = navigator.onLine): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const store = this.db.transaction('syncStatus', 'readwrite').store;
    await store.put({
      id: 'lastSync',
      lastSync: Date.now(),
      totalRecords,
      isOnline
    });
  }

  async getSyncStatus(): Promise<{ lastSync: number; totalRecords: number; isOnline: boolean } | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('syncStatus', 'lastSync');
  }

  async addToOfflineQueue(action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const store = this.db.transaction('offlineQueue', 'readwrite').store;
    await store.put({
      id: `${action}-${Date.now()}`,
      action,
      data,
      timestamp: Date.now()
    });
  }

  async getOfflineQueue(): Promise<Array<{ action: string; data: any; timestamp: number }>> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('offlineQueue');
  }

  async clearOfflineQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const store = this.db.transaction('offlineQueue', 'readwrite').store;
    await store.clear();
  }
}

export const dbService = new DatabaseService(); 