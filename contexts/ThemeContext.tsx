import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

// ==================== TYPES ====================
export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  border: string;
  card: string;
  notification: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (isDark: boolean) => Promise<void>;
  language: string;
  toggleLanguage: () => Promise<void>;
  setLanguage: (lang: 'ar' | 'en') => Promise<void>;
  isReady: boolean;
}

// ==================== THEME DEFINITIONS ====================
const lightTheme: Theme = {
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
};

const darkTheme: Theme = {
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
};

// ==================== STORAGE KEYS ====================
const THEME_KEY = '@app_theme';
const LANGUAGE_KEY = '@app_language';

// ==================== CONTEXT ====================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ==================== GLOBAL STATE MANAGER ====================
// هذا سيضمن المزامنة الفورية بين جميع الصفحات
class ThemeStateManager {
  private static instance: ThemeStateManager;
  private listeners: Set<() => void> = new Set();
  private _isDark: boolean = false;
  private _language: string = 'ar';

  static getInstance(): ThemeStateManager {
    if (!ThemeStateManager.instance) {
      ThemeStateManager.instance = new ThemeStateManager();
    }
    return ThemeStateManager.instance;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach(listener => listener());
  }

  get isDark(): boolean {
    return this._isDark;
  }

  set isDark(value: boolean) {
    if (this._isDark !== value) {
      this._isDark = value;
      this.notify();
    }
  }

  get language(): string {
    return this._language;
  }

  set language(value: string) {
    if (this._language !== value) {
      this._language = value;
      this.notify();
    }
  }
}

const stateManager = ThemeStateManager.getInstance();

// ==================== PROVIDER ====================
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { i18n } = useTranslation();
  
  const [isDark, setIsDarkState] = useState(stateManager.isDark);
  const [language, setLanguageState] = useState(stateManager.language);
  const [isReady, setIsReady] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // ==================== SUBSCRIBE TO GLOBAL STATE ====================
  useEffect(() => {
    console.log('🎨 ThemeProvider: Subscribing to global state');
    
    const unsubscribe = stateManager.subscribe(() => {
      console.log('🔄 Theme state changed globally!');
      setIsDarkState(stateManager.isDark);
      setLanguageState(stateManager.language);
      setForceUpdate(prev => prev + 1); // Force re-render
    });

    return () => {
      console.log('🎨 ThemeProvider: Unsubscribing');
      unsubscribe();
    };
  }, []);

  // ==================== LOAD PREFERENCES ====================
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('📥 Loading theme preferences...');
      
      // تحميل الثيم
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      let themeValue = systemColorScheme === 'dark';
      
      if (savedTheme !== null) {
        themeValue = savedTheme === 'dark';
        console.log('✅ Theme loaded from storage:', savedTheme);
      } else {
        console.log('ℹ️ No saved theme, using system:', systemColorScheme);
        await AsyncStorage.setItem(THEME_KEY, systemColorScheme === 'dark' ? 'dark' : 'light');
      }

      // تحميل اللغة
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      let langValue = 'ar';
      
      if (savedLanguage !== null) {
        langValue = savedLanguage;
        console.log('✅ Language loaded from storage:', savedLanguage);
      } else {
        console.log('ℹ️ No saved language, using default: ar');
        await AsyncStorage.setItem(LANGUAGE_KEY, 'ar');
      }

      // تحديث الحالة العامة
      stateManager.isDark = themeValue;
      stateManager.language = langValue;

      // تحديث الحالة المحلية
      setIsDarkState(themeValue);
      setLanguageState(langValue);

      // تطبيق اللغة
      await i18n.changeLanguage(langValue);

      setIsReady(true);
      console.log('✅ Theme preferences loaded successfully');
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      setIsReady(true);
    }
  };

  // ==================== TOGGLE THEME ====================
  const toggleTheme = async () => {
    try {
      const newTheme = !stateManager.isDark;
      console.log('🎨 Toggling theme to:', newTheme ? 'dark' : 'light');
      
      // تحديث الحالة العامة (سيؤدي إلى إشعار جميع المستمعين)
      stateManager.isDark = newTheme;
      
      // حفظ في AsyncStorage
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
      console.log('✅ Theme saved to storage');
    } catch (error) {
      console.error('❌ Error toggling theme:', error);
    }
  };

  // ==================== SET THEME ====================
  const setTheme = async (dark: boolean) => {
    try {
      console.log('🎨 Setting theme to:', dark ? 'dark' : 'light');
      
      stateManager.isDark = dark;
      await AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      console.log('✅ Theme set successfully');
    } catch (error) {
      console.error('❌ Error setting theme:', error);
    }
  };

  // ==================== TOGGLE LANGUAGE ====================
  const toggleLanguage = async () => {
    try {
      const newLang = stateManager.language === 'ar' ? 'en' : 'ar';
      console.log('🌍 Toggling language to:', newLang);
      
      // تحديث الحالة العامة
      stateManager.language = newLang;
      
      // تطبيق اللغة في i18n
      await i18n.changeLanguage(newLang);
      
      // حفظ في AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
      console.log('✅ Language saved to storage');
    } catch (error) {
      console.error('❌ Error toggling language:', error);
    }
  };

  // ==================== SET LANGUAGE ====================
  const setLanguage = async (lang: 'ar' | 'en') => {
    try {
      console.log('🌍 Setting language to:', lang);
      
      stateManager.language = lang;
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      console.log('✅ Language set successfully');
    } catch (error) {
      console.error('❌ Error setting language:', error);
    }
  };

  // ==================== THEME VALUE ====================
  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    language,
    toggleLanguage,
    setLanguage,
    isReady,
  };

  // لا تعرض الأطفال حتى يتم التحميل
  if (!isReady) {
    return null;
  }

  console.log('🎨 ThemeProvider rendering with:', { isDark, language, forceUpdate });

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ==================== HOOK ====================
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ==================== EXPORTS ====================
export default ThemeContext;
