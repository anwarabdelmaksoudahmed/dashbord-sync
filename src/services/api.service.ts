import type { ApiResponse, EncryptedData, LoginCredentials, User, AdaptedUser, SyncConfig } from '../types';
import { EncryptionService } from './encryption.service';
import { dbService } from './db.service';
import bcrypt from 'bcryptjs';

export class ApiService {
  private readonly BASE_URL = 'https://calls.trolley.systems/api';
  private readonly defaultConfig: SyncConfig = {
    maxPages: 10,
    maxRecords: 1000,
    syncInterval: 60000 // 1 minute
  };

  constructor(private config: Partial<SyncConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  private async fetchWithDecryption<T>(url: string): Promise<T> {
    try {
      if (!navigator.onLine) {
        // Try to get data from cache
        const cachedData = await this.getCachedData<T>(url);
        if (cachedData) {
          return cachedData;
        }
        throw new Error('No internet connection and no cached data available');
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<EncryptedData> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      console.log('API Response:', data);
      console.log('Encrypted data:', data.data);
      
      const decryptedData = await EncryptionService.decryptResponse<T>(data.data);
      console.log('Decrypted data:', decryptedData);
      
      // Cache the data for offline use
      await this.cacheData(url, decryptedData);
      
      return decryptedData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async getCachedData<T>(url: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  private async cacheData<T>(url: string, data: T): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(url);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  private getCacheKey(url: string): string {
    return `cache_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Always try to authenticate using cached credentials first
      const cachedUser = await dbService.getUserByUsername(credentials.username);
      if (cachedUser && await this.verifyPassword(credentials.password, cachedUser.password)) {
        return {
          id: cachedUser.id,
          username: cachedUser.username,
          password: cachedUser.password,
          name: `${cachedUser.firstName} ${cachedUser.lastName}`,
          email: cachedUser.email
        };
      }

      if (!navigator.onLine) {
        throw new Error('No internet connection and no valid cached credentials found');
      }

      const response = await fetch(`${this.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<User> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Cache the user data for offline use
      const adaptedUser = this.adaptUser(data.data);
      await dbService.saveUsers([adaptedUser]);

      return data.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  private adaptUser(user: User): AdaptedUser {
    const [firstName, ...lastNameParts] = user.name.split(' ');
    const lastName = lastNameParts.join(' ');

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      firstName,
      lastName,
      email: user.email
    };
  }

  async syncUsers(): Promise<void> {
    let currentPage = 1;
    let totalRecords = 0;
    const allUsers: User[] = [];

    try {
      if (!navigator.onLine) {
        // Use cached data when offline
        const cachedUsers = await dbService.getAllUsers();
        await dbService.updateSyncStatus(cachedUsers.length, false);
        return;
      }

      while (currentPage <= this.config.maxPages! && totalRecords < this.config.maxRecords!) {
        console.log(`Fetching users page ${currentPage}...`);
        const users = await this.fetchWithDecryption<User[]>(`${this.BASE_URL}/users?page=${currentPage}`);
        console.log(`Received ${users.length} users from page ${currentPage}`);
        
        if (!users.length) break;

        allUsers.push(...users);
        totalRecords += users.length;
        currentPage++;
      }

      console.log(`Total users fetched: ${allUsers.length}`);
      const adaptedUsers = allUsers.map(user => this.adaptUser(user));
      await dbService.saveUsers(adaptedUsers);
      await dbService.updateSyncStatus(totalRecords, true);

      // Process offline queue
      await this.processOfflineQueue();
    } catch (error) {
      console.error('Sync failed:', error);
      // If sync fails, try to use cached data
      const cachedUsers = await dbService.getAllUsers();
      await dbService.updateSyncStatus(cachedUsers.length, false);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const queue = await dbService.getOfflineQueue();
      for (const item of queue) {
        try {
          switch (item.action) {
            case 'create':
              await this.createUser(item.data);
              break;
            case 'update':
              await this.updateUser(item.data);
              break;
            case 'delete':
              await this.deleteUser(item.data.id);
              break;
          }
        } catch (error) {
          console.error(`Failed to process offline action ${item.action}:`, error);
        }
      }
      await dbService.clearOfflineQueue();
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  async createUser(user: User): Promise<void> {
    if (!navigator.onLine) {
      await dbService.addToOfflineQueue('create', user);
      return;
    }

    // Implement API call for creating user
  }

  async updateUser(user: User): Promise<void> {
    if (!navigator.onLine) {
      await dbService.addToOfflineQueue('update', user);
      return;
    }

    // Implement API call for updating user
  }

  async deleteUser(userId: number): Promise<void> {
    if (!navigator.onLine) {
      await dbService.addToOfflineQueue('delete', { id: userId });
      return;
    }

    // Implement API call for deleting user
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async startPeriodicSync(): Promise<void> {
    try {
      // Initial sync
      await this.syncUsers();

      // Set up periodic sync
      setInterval(async () => {
        if (navigator.onLine) {
          await this.syncUsers();
        }
      }, this.config.syncInterval);

      // Listen for online status changes
      window.addEventListener('online', async () => {
        await this.syncUsers();
      });

      window.addEventListener('offline', async () => {
        await dbService.updateSyncStatus(0, false);
      });
    } catch (error) {
      console.error('Periodic sync setup failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();