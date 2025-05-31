import type { User } from '../types';

export class StorageService {
  private static readonly DB_NAME = 'sync-app-db';
  private static readonly DB_VERSION = 1;
  private static readonly USERS_STORE = 'users';
  private static readonly SYNC_TIME_STORE = 'sync-time';

  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(StorageService.DB_NAME, StorageService.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create users store
        if (!db.objectStoreNames.contains(StorageService.USERS_STORE)) {
          const userStore = db.createObjectStore(StorageService.USERS_STORE, { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Create sync time store
        if (!db.objectStoreNames.contains(StorageService.SYNC_TIME_STORE)) {
          db.createObjectStore(StorageService.SYNC_TIME_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async saveUsers(users: User[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StorageService.USERS_STORE], 'readwrite');
      const store = transaction.objectStore(StorageService.USERS_STORE);

      // Clear existing users
      store.clear();

      // Add new users
      users.forEach(user => {
        store.add(this.adaptUserData(user));
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StorageService.USERS_STORE], 'readonly');
      const store = transaction.objectStore(StorageService.USERS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncTime(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StorageService.SYNC_TIME_STORE], 'readwrite');
      const store = transaction.objectStore(StorageService.SYNC_TIME_STORE);
      
      store.put({ id: 'lastSync', timestamp: new Date().toISOString() });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StorageService.SYNC_TIME_STORE], 'readonly');
      const store = transaction.objectStore(StorageService.SYNC_TIME_STORE);
      const request = store.get('lastSync');

      request.onsuccess = () => resolve(request.result?.timestamp || null);
      request.onerror = () => reject(request.error);
    });
  }

  private adaptUserData(user: User): User {
    // Split name into firstName and lastName
    const [firstName, ...lastNameParts] = user.name.split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      ...user,
      firstName,
      lastName
    };
  }
} 