import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

// ==================== TYPES ====================
type Language = 'ar' | 'en';

interface Theme {
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

interface User {
  uid: string;
  username: string;
  email?: string;
  age: number;
  weight: number;
  dailyWaterGoal: number;
  createdAt: string;
}

interface ProgressData {
  totalTime: number;
  lastAccessed: string;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  streakDays: number;
  lastStreakDate: string;
}

interface UserProgress {
  water: ProgressData;
  habits: ProgressData;
  language: ProgressData;
}

interface GlobalContextType {
  // 👤 User
  user: User | null;
  firebaseUser: FirebaseUser | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;

  // 🎨 Theme
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (dark: boolean) => Promise<void>;

  // 🌍 Language
  language: Language;
  toggleLanguage: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;

  // 📊 Progress
  progress: UserProgress;
  updateProgress: (screen: keyof UserProgress, updates: Partial<ProgressData>) => Promise<void>;
  getProgress: (screen: keyof UserProgress) => ProgressData;
  getTotalProgress: () => number;
  resetProgress: (screen?: keyof UserProgress) => Promise<void>;

  // ⚡ Loading
  isLoading: boolean;
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

// ==================== DEFAULT VALUES ====================
const defaultProgressData: ProgressData = {
  totalTime: 0,
  lastAccessed: new Date().toISOString(),
  completedTasks: 0,
  totalTasks: 0,
  percentage: 0,
  streakDays: 0,
  lastStreakDate: '',
};

const defaultProgress: UserProgress = {
  water: { ...defaultProgressData },

  habits: { ...defaultProgressData },
  language: { ...defaultProgressData },
};

// ==================== STORAGE KEYS ====================
const THEME_KEY = '@app_theme';
const LANGUAGE_KEY = '@app_language';
const USER_DATA_KEY = '@user_data';
const USER_PROGRESS_KEY = '@user_progress';

// ==================== CONTEXT ====================
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ==================== PROVIDER ====================
export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { i18n } = useTranslation();

  // 👤 User State
  const [user, setUserState] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // 🎨 Theme State
  const [isDark, setIsDarkState] = useState(false);

  // 🌍 Language State
  const [language, setLanguageState] = useState<Language>('ar');

  // 📊 Progress State
  const [progress, setProgressState] = useState<UserProgress>(defaultProgress);

  // ⚡ Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // ==================== LOAD INITIAL PREFERENCES ====================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('📱 Initializing app preferences...');

        // تحميل الثيم
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        const themeValue = savedTheme === 'dark' || (savedTheme === null && systemColorScheme === 'dark');
        setIsDarkState(themeValue);
        if (!savedTheme) {
          await AsyncStorage.setItem(THEME_KEY, themeValue ? 'dark' : 'light');
        }

        // تحميل اللغة
        const savedLanguage = (await AsyncStorage.getItem(LANGUAGE_KEY)) as Language | null;
        const langValue = (savedLanguage || 'ar') as Language;
        setLanguageState(langValue);
        await i18n.changeLanguage(langValue);
        if (!savedLanguage) {
          await AsyncStorage.setItem(LANGUAGE_KEY, 'ar');
        }

        setIsReady(true);
        console.log('✅ App preferences loaded:', { theme: themeValue ? 'dark' : 'light', language: langValue });
      } catch (error) {
        console.error('❌ Error initializing preferences:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, [i18n]);

  // ==================== FIREBASE AUTH LISTENER ====================
  useEffect(() => {
    console.log('🔐 Setting up Firebase auth listener...');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setFirebaseUser(fbUser);

        if (fbUser) {
          console.log('✅ Firebase user authenticated:', fbUser.email);

          // تحميل بيانات المستخدم
          const userData = await AsyncStorage.getItem(USER_DATA_KEY);
          if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.uid === fbUser.uid) {
              setUserState(parsedUser);
              await loadProgress(fbUser.uid);
            }
          }
        } else {
          console.log('❌ No Firebase user');
          setUserState(null);
          setProgressState(defaultProgress);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ==================== LOAD PROGRESS ====================
  const loadProgress = async (uid: string) => {
    try {
      const progressKey = `${USER_PROGRESS_KEY}_${uid}`;
      const progressData = await AsyncStorage.getItem(progressKey);

      if (progressData) {
        const parsedProgress = JSON.parse(progressData);
        setProgressState(parsedProgress);
        console.log('✅ Progress loaded for user:', uid);
      } else {
        await AsyncStorage.setItem(progressKey, JSON.stringify(defaultProgress));
        setProgressState(defaultProgress);
        console.log('✅ Default progress initialized for user:', uid);
      }
    } catch (error) {
      console.error('❌ Error loading progress:', error);
    }
  };

  // ==================== USER FUNCTIONS ====================
  const setUser = async (newUser: User | null) => {
    try {
      if (newUser) {
        setUserState(newUser);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));
        await loadProgress(newUser.uid);
        console.log('✅ User saved:', newUser.username);
      } else {
        setUserState(null);
        await AsyncStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      console.error('❌ Error setting user:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      setUserState(updatedUser);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      console.log('✅ User updated:', updates);
    } catch (error) {
      console.error('❌ Error updating user:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserState(null);
      setFirebaseUser(null);
      setProgressState(defaultProgress);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isLoggedIn');
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  };

  // ==================== THEME FUNCTIONS ====================
  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDarkState(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
      console.log('🎨 Theme toggled:', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('❌ Error toggling theme:', error);
    }
  };

  const setTheme = async (dark: boolean) => {
    try {
      setIsDarkState(dark);
      await AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      console.log('🎨 Theme set:', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('❌ Error setting theme:', error);
    }
  };

  // ==================== LANGUAGE FUNCTIONS ====================
  const toggleLanguage = async () => {
    try {
      const newLang: Language = language === 'ar' ? 'en' : 'ar';
      setLanguageState(newLang);
      await i18n.changeLanguage(newLang);
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
      console.log('🌍 Language toggled:', newLang);
    } catch (error) {
      console.error('❌ Error toggling language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      console.log('🌍 Language set:', lang);
    } catch (error) {
      console.error('❌ Error setting language:', error);
    }
  };

  // ==================== PROGRESS FUNCTIONS ====================
  const updateProgress = async (screen: keyof UserProgress, updates: Partial<ProgressData>) => {
    try {
      if (!user) return;

      const updatedScreenProgress = {
        ...progress[screen],
        ...updates,
        lastAccessed: new Date().toISOString(),
      };

      if (updates.completedTasks !== undefined || updates.totalTasks !== undefined) {
        const completed = updates.completedTasks ?? updatedScreenProgress.completedTasks;
        const total = updates.totalTasks ?? updatedScreenProgress.totalTasks;
        updatedScreenProgress.percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      const updatedProgress = {
        ...progress,
        [screen]: updatedScreenProgress,
      };

      setProgressState(updatedProgress);

      const progressKey = `${USER_PROGRESS_KEY}_${user.uid}`;
      await AsyncStorage.setItem(progressKey, JSON.stringify(updatedProgress));
      console.log(`✅ Progress updated for ${screen}`);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
    }
  };

  const getProgress = (screen: keyof UserProgress): ProgressData => {
    return progress[screen] || defaultProgressData;
  };

  const getTotalProgress = (): number => {
    const total =
      progress.water.percentage +
      progress.habits.percentage +
      progress.language.percentage;
    return Math.round(total / 4);
  };

  const resetProgress = async (screen?: keyof UserProgress) => {
    try {
      if (!user) return;

      let updatedProgress: UserProgress;

      if (screen) {
        updatedProgress = {
          ...progress,
          [screen]: { ...defaultProgressData },
        };
        console.log(`✅ Progress reset for ${screen}`);
      } else {
        updatedProgress = { ...defaultProgress };
        console.log('✅ All progress reset');
      }

      setProgressState(updatedProgress);

      const progressKey = `${USER_PROGRESS_KEY}_${user.uid}`;
      await AsyncStorage.setItem(progressKey, JSON.stringify(updatedProgress));
    } catch (error) {
      console.error('❌ Error resetting progress:', error);
    }
  };

  // ==================== CONTEXT VALUE ====================
  const theme = isDark ? darkTheme : lightTheme;

  const value: GlobalContextType = {
    user,
    firebaseUser,
    setUser,
    updateUser,
    logout,
    isDark,
    theme,
    toggleTheme,
    setTheme,
    language,
    toggleLanguage,
    setLanguage,
    progress,
    updateProgress,
    getProgress,
    getTotalProgress,
    resetProgress,
    isLoading,
    isReady,
  };

  if (!isReady) {
    return null;
  }

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

// ==================== HOOK ====================
export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

export default GlobalContext;