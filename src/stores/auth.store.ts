import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '../types';
import { apiService } from '../services/api.service';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function login(username: string, password: string) {
    try {
      isLoading.value = true;
      error.value = null;
      
      const userData = await apiService.login({ username, password });
      const isValid = await apiService.verifyPassword(password, userData.password);
      
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      user.value = userData;
      isAuthenticated.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    user.value = null;
    isAuthenticated.value = false;
    error.value = null;
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout
  };
}); 