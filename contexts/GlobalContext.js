// contexts/GlobalContext.js - COMPLETE WITH BACKEND SYNC
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, I18nManager } from 'react-native';
import api from '../services/api';

// ==================== THEME DEFINITIONS ====================
const lightTheme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#06b6d4',
  border: '#e2e8f0',
  card: '#ffffff',
  notification: '#ef4444',
  shadow: '#000000',
};

const darkTheme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#06b6d4',
  border: '#334155',
  card: '#1e293b',
  notification: '#ef4444',
  shadow: '#ffffff',
};

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  THEME: '@app_theme',
  LANGUAGE: '@app_language',
  THEME_BACKEND_SYNCED: '@theme_backend_synced',
  LANGUAGE_BACKEND_SYNCED: '@language_backend_synced',
};

// ==================== CONTEXT ====================
const GlobalContext = createContext(undefined);

// ==================== PROVIDER ====================
export const GlobalProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();

  // States
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguageState] = useState('ar');
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ==================== INITIALIZE APP ====================
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('📱 Initializing GlobalContext...');

      // Check if user is logged in
      const loggedIn = await api.isLoggedIn();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        // Load from backend first
        await loadSettingsFromBackend();
      } else {
        // Load from local storage
        await loadLocalSettings();
      }

      setIsReady(true);
      console.log('✅ GlobalContext initialized');
    } catch (error) {
      console.error('❌ Error initializing GlobalContext:', error);
      // Fallback to local settings
      await loadLocalSettings();
      setIsReady(true);
    }
  };

  // ==================== LOAD SETTINGS FROM BACKEND ====================
  const loadSettingsFromBackend = async () => {
    try {
      console.log('🔄 Loading settings from backend...');
      
      const response = await api.getProfile();
      
      if (response.success && response.user.settings) {
        const { theme, language: userLang } = response.user.settings;

        // Apply theme
        if (theme) {
          const isDarkMode = theme === 'dark';
          setIsDark(isDarkMode);
          await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
          console.log(`✅ Theme loaded from backend: ${theme}`);
        }

        // Apply language
        if (userLang) {
          setLanguageState(userLang);
          await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, userLang);
          console.log(`✅ Language loaded from backend: ${userLang}`);
        }

        // Mark as synced
        await AsyncStorage.setItem(STORAGE_KEYS.THEME_BACKEND_SYNCED, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE_BACKEND_SYNCED, 'true');
      } else {
        // Fallback to local
        await loadLocalSettings();
      }
    } catch (error) {
      console.error('❌ Error loading backend settings:', error);
      await loadLocalSettings();
    }
  };

  // ==================== LOAD LOCAL SETTINGS ====================
  const loadLocalSettings = async () => {
    try {
      // Load theme
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const themeValue = savedTheme === 'dark' || (savedTheme === null && systemColorScheme === 'dark');
      setIsDark(themeValue);

      if (!savedTheme) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeValue ? 'dark' : 'light');
      }

      // Load language
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      const langValue = savedLanguage || 'ar';
      setLanguageState(langValue);

      if (!savedLanguage) {
        await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, 'ar');
      }

      console.log('✅ Settings loaded from local storage:', {
        theme: themeValue ? 'dark' : 'light',
        language: langValue,
      });
    } catch (error) {
      console.error('❌ Error loading local settings:', error);
    }
  };

  // ==================== SYNC SETTINGS TO BACKEND ====================
  const syncSettingsToBackend = async (settingType, value) => {
    try {
      // Check if user is logged in
      const loggedIn = await api.isLoggedIn();
      if (!loggedIn) {
        console.log('ℹ️ Not logged in, skipping backend sync');
        return;
      }

      console.log(`🔄 Syncing ${settingType} to backend:`, value);

      const settings = {};
      
      if (settingType === 'theme') {
        settings.theme = value;
      } else if (settingType === 'language') {
        settings.language = value;
      }

      const response = await api.updateSettings(settings);

      if (response.success) {
        console.log(`✅ ${settingType} synced to backend successfully`);
        
        // Mark as synced
        const syncKey = settingType === 'theme' 
          ? STORAGE_KEYS.THEME_BACKEND_SYNCED 
          : STORAGE_KEYS.LANGUAGE_BACKEND_SYNCED;
        await AsyncStorage.setItem(syncKey, 'true');
      }
    } catch (error) {
      console.error(`❌ Error syncing ${settingType} to backend:`, error);
      // Continue - local setting is still applied
    }
  };

  // ==================== THEME FUNCTIONS ====================
  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      const themeValue = newTheme ? 'dark' : 'light';
      
      // 1. Update state immediately (for instant UI update)
      setIsDark(newTheme);
      
      // 2. Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeValue);
      
      // 3. Sync to backend (async, non-blocking)
      syncSettingsToBackend('theme', themeValue);
      
      console.log('🎨 Theme toggled:', themeValue);
    } catch (error) {
      console.error('❌ Error toggling theme:', error);
    }
  };

  const setTheme = async (dark) => {
    try {
      const themeValue = dark ? 'dark' : 'light';
      
      // 1. Update state
      setIsDark(dark);
      
      // 2. Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeValue);
      
      // 3. Sync to backend
      syncSettingsToBackend('theme', themeValue);
      
      console.log('🎨 Theme set:', themeValue);
    } catch (error) {
      console.error('❌ Error setting theme:', error);
    }
  };

  // ==================== LANGUAGE FUNCTIONS ====================
  const toggleLanguage = async () => {
    try {
      const newLang = language === 'ar' ? 'en' : 'ar';
      
      // 1. Update state immediately
      setLanguageState(newLang);
      
      // 2. Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
      
      // 3. Sync to backend
      syncSettingsToBackend('language', newLang);
      
      console.log('🌍 Language toggled:', newLang);
    } catch (error) {
      console.error('❌ Error toggling language:', error);
    }
  };

  const setLanguage = async (lang) => {
    try {
      // 1. Update state
      setLanguageState(lang);
      
      // 2. Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      
      // 3. Sync to backend
      syncSettingsToBackend('language', lang);
      
      console.log('🌍 Language set:', lang);
    } catch (error) {
      console.error('❌ Error setting language:', error);
    }
  };

  // ==================== REFRESH SETTINGS (للتحديث بعد Login) ====================
  const refreshSettings = async () => {
    try {
      console.log('🔄 Refreshing settings from backend...');
      const loggedIn = await api.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        await loadSettingsFromBackend();
      }
    } catch (error) {
      console.error('❌ Error refreshing settings:', error);
    }
  };

  // ==================== CLEAR SETTINGS (للتنظيف بعد Logout) ====================
  const clearSettings = async () => {
    try {
      console.log('🧹 Clearing settings...');
      
      // Reset to defaults
      setIsDark(systemColorScheme === 'dark');
      setLanguageState('ar');
      setIsLoggedIn(false);
      
      // Clear sync flags
      await AsyncStorage.removeItem(STORAGE_KEYS.THEME_BACKEND_SYNCED);
      await AsyncStorage.removeItem(STORAGE_KEYS.LANGUAGE_BACKEND_SYNCED);
      
      console.log('✅ Settings cleared');
    } catch (error) {
      console.error('❌ Error clearing settings:', error);
    }
  };

  // ==================== CONTEXT VALUE ====================
  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    // Theme
    isDark,
    theme,
    toggleTheme,
    setTheme,
    
    // Language
    language,
    toggleLanguage,
    setLanguage,
    
    // Utilities
    isReady,
    isLoggedIn,
    refreshSettings,
    clearSettings,
  };

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

// ==================== HOOK ====================
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export default GlobalContext;