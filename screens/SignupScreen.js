// services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://defyself-backend-043eac13f465.herokuapp.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw { success: false, message: 'لا يوجد اتصال بالإنترنت' };
    } else {
      throw { success: false, message: 'حدث خطأ غير متوقع' };
    }
  }
};

export const register = async (name, email, age, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, age, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else if (error.request) {
      throw { success: false, message: 'لا يوجد اتصال بالإنترنت' };
    } else {
      throw { success: false, message: 'حدث خطأ غير متوقع' };
    }
  }
};

export default {
  login,
  register,
};