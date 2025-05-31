export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface AdaptedUser {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface EncryptedData {
  d: string;
  n: string;
  t: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SyncConfig {
  maxPages: number;
  maxRecords: number;
  syncInterval: number;
}

export interface SyncStatus {
  lastSyncTime: string;
  totalRecords: number;
}

export interface DataAdapter<T, R> {
  adapt(data: T): R;
} 