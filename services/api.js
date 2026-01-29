// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'https://defyself-backend-043eac13f465.herokuapp.com/api';

// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  LAST_EMAIL: '@last_email',
};

// ============ AXIOS INSTANCE ============
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ REQUEST INTERCEPTOR ============
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============ RESPONSE INTERCEPTOR ============
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`❌ Response Error:`, error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      // You can trigger navigation to login here if needed
    }
    
    return Promise.reject(error);
  }
);

// ============ API SERVICE CLASS ============
class ApiService {
  
  // ==================== AUTHENTICATION ====================
  
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(name, email, age, password) {
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        age: parseInt(age),
        password,
      });
      
      if (response.data.success && response.data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyResetCode(email, code) {
    try {
      const response = await apiClient.post('/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email, code, newPassword) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async getAuthToken() {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async isLoggedIn() {
    const token = await this.getAuthToken();
    return !!token;
  }

  async getCurrentUser() {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  // ==================== USER MANAGEMENT ====================

  async getProfile() {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(name, age) {
    try {
      const response = await apiClient.put('/user/profile', { name, age });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateSettings(soundEnabled, notificationsEnabled) {
    try {
      const response = await apiClient.put('/user/settings', {
        soundEnabled,
        notificationsEnabled,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAccount() {
    try {
      const response = await apiClient.delete('/user/account');
      await this.logout();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== WATER TRACKING ====================

  async setupWaterTracking(weight, activityLevel, weatherCondition) {
    try {
      const response = await apiClient.post('/water/setup', {
        weight,
        activityLevel,
        weatherCondition,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTodayWater() {
    try {
      const response = await apiClient.get('/water/today');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addWaterGlass() {
    try {
      const response = await apiClient.post('/water/add-glass');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWaterHistory(days = 7) {
    try {
      const response = await apiClient.get(`/water/history?days=${days}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateNotificationTimes(times) {
    try {
      const response = await apiClient.put('/water/notification-times', {
        notificationTimes: times,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HABITS ====================

  async createHabit(habitData) {
    try {
      const response = await apiClient.post('/habits', habitData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getHabits(status = null) {
    try {
      const url = status ? `/habits?status=${status}` : '/habits';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getHabit(habitId) {
    try {
      const response = await apiClient.get(`/habits/${habitId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateHabit(habitId, updates) {
    try {
      const response = await apiClient.put(`/habits/${habitId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteHabit(habitId) {
    try {
      const response = await apiClient.delete(`/habits/${habitId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markHabitDay(habitId, date, notes = '') {
    try {
      const response = await apiClient.post(`/habits/${habitId}/mark-day`, {
        date,
        notes,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getHabitsStats() {
    try {
      const response = await apiClient.get('/habits/stats/overview');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== LEARNING ====================

  async getLearningProgress() {
    try {
      const response = await apiClient.get('/learning/progress');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentGroupWords() {
    try {
      const response = await apiClient.get('/learning/words/current-group');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async learnWord(wordId, word, translation) {
    try {
      const response = await apiClient.post('/learning/words/learn', {
        wordId,
        word,
        translation,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async reviewWord(wordId, correct) {
    try {
      const response = await apiClient.post('/learning/words/review', {
        wordId,
        correct,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getReviewWords() {
    try {
      const response = await apiClient.get('/learning/words/review-list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLearnedWords() {
    try {
      const response = await apiClient.get('/learning/learned-words');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLearningStats() {
    try {
      const response = await apiClient.get('/learning/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateDailyGoal(goal) {
    try {
      const response = await apiClient.post('/learning/daily-goal', { dailyGoal: goal });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== VOCABULARY ====================

  async getAllWords(page = 1, limit = 50, filters = {}) {
    try {
      let url = `/vocabulary/all-words?page=${page}&limit=${limit}`;
      
      if (filters.groupNumber) url += `&groupNumber=${filters.groupNumber}`;
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.search) url += `&search=${filters.search}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVocabularyGroups() {
    try {
      const response = await apiClient.get('/vocabulary/groups');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVocabularyStats() {
    try {
      const response = await apiClient.get('/vocabulary/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== ERROR HANDLING ====================

  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'حدث خطأ في الخادم';
      return {
        message,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'لا يمكن الاتصال بالخادم',
        status: 0,
        data: null,
      };
    } else {
      // Error in request configuration
      return {
        message: error.message || 'حدث خطأ غير متوقع',
        status: -1,
        data: null,
      };
    }
  }

  // ==================== HELPER METHODS ====================

  async testConnection() {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/`);
      console.log('✅ Server connection successful:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Server connection failed:', error.message);
      return false;
    }
  }

  getApiUrl() {
    return API_URL;
  }

  async clearAllData() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.LAST_EMAIL,
    ]);
  }
}

// ============ EXPORT SINGLETON INSTANCE ============
const api = new ApiService();

export default api;

// Export storage keys for direct access if needed
export { STORAGE_KEYS, API_URL };