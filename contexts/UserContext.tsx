import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebaseConfig';
import { User as FirebaseUser } from 'firebase/auth';

// ==================== TYPES ====================
export interface User {
  uid: string;
  username: string;
  email?: string;
  age: number;
  weight: number;
  dailyWaterGoal: number;
  createdAt: string;
}

export interface UserProgress {
  water: ProgressData;
  habits: ProgressData;
  language: ProgressData;
}

export interface ProgressData {
  totalTime: number; // بالثواني
  lastAccessed: string;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  streakDays: number;
  lastStreakDate: string;
}

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  progress: UserProgress;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateProgress: (
    screen: keyof UserProgress,
    updates: Partial<ProgressData>
  ) => Promise<void>;
  getProgress: (screen: keyof UserProgress) => ProgressData;
  getTotalProgress: () => number;
  resetProgress: (screen?: keyof UserProgress) => Promise<void>;
  isLoading: boolean;
}

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

// ==================== CONTEXT ====================
const UserContext = createContext<UserContextType | undefined>(undefined);

// ==================== STORAGE KEYS ====================
const USER_DATA_KEY = '@user_data';
const USER_PROGRESS_KEY = '@user_progress';

// ==================== PROVIDER ====================
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [progress, setProgressState] = useState<UserProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== LOAD USER DATA ====================
  useEffect(() => {
    loadUserData();
    
    // الاستماع لتغييرات Firebase Auth
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        console.log('✅ Firebase User authenticated:', fbUser.email);
        loadUserDataForUid(fbUser.uid);
      } else {
        console.log('❌ No Firebase user');
        setUserState(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserState(parsedUser);
        console.log('✅ User data loaded:', parsedUser.username);
        
        // تحميل التقدم
        await loadProgress(parsedUser.uid);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setIsLoading(false);
    }
  };

  const loadUserDataForUid = async (uid: string) => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.uid === uid) {
          setUserState(parsedUser);
          await loadProgress(uid);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading user data for uid:', error);
      setIsLoading(false);
    }
  };

  // ==================== LOAD PROGRESS ====================
  const loadProgress = async (uid: string) => {
    try {
      const progressKey = `${USER_PROGRESS_KEY}_${uid}`;
      const progressData = await AsyncStorage.getItem(progressKey);
      
      if (progressData) {
        const parsedProgress = JSON.parse(progressData);
        setProgressState(parsedProgress);
        console.log('✅ Progress data loaded for user:', uid);
      } else {
        // تهيئة التقدم الافتراضي
        await AsyncStorage.setItem(progressKey, JSON.stringify(defaultProgress));
        setProgressState(defaultProgress);
        console.log('✅ Default progress initialized for user:', uid);
      }
    } catch (error) {
      console.error('❌ Error loading progress:', error);
    }
  };

  // ==================== SET USER ====================
  const setUser = async (newUser: User | null) => {
    try {
      if (newUser) {
        setUserState(newUser);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));
        await loadProgress(newUser.uid);
        console.log('✅ User data saved:', newUser.username);
      } else {
        setUserState(null);
        await AsyncStorage.removeItem(USER_DATA_KEY);
        console.log('✅ User data removed');
      }
    } catch (error) {
      console.error('❌ Error setting user:', error);
    }
  };

  // ==================== UPDATE USER ====================
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

  // ==================== UPDATE PROGRESS ====================
  const updateProgress = async (
    screen: keyof UserProgress,
    updates: Partial<ProgressData>
  ) => {
    try {
      if (!user) return;

      const updatedScreenProgress = {
        ...progress[screen],
        ...updates,
        lastAccessed: new Date().toISOString(),
      };

      // حساب النسبة المئوية
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
      
      console.log(`✅ Progress updated for ${screen}:`, updates);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
    }
  };

  // ==================== GET PROGRESS ====================
  const getProgress = (screen: keyof UserProgress): ProgressData => {
    return progress[screen] || defaultProgressData;
  };

  // ==================== GET TOTAL PROGRESS ====================
  const getTotalProgress = (): number => {
    const total =
      progress.water.percentage +
      progress.habits.percentage +
      progress.language.percentage;
    return Math.round(total / 4);
  };

  // ==================== RESET PROGRESS ====================
  const resetProgress = async (screen?: keyof UserProgress) => {
    try {
      if (!user) return;

      let updatedProgress: UserProgress;

      if (screen) {
        // إعادة تعيين شاشة واحدة
        updatedProgress = {
          ...progress,
          [screen]: { ...defaultProgressData },
        };
        console.log(`✅ Progress reset for ${screen}`);
      } else {
        // إعادة تعيين كل التقدم
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

  // ==================== LOGOUT ====================
  const logout = async () => {
    try {
      await auth.signOut();
      setUserState(null);
      setFirebaseUser(null);
      setProgressState(defaultProgress);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isLoggedIn');
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  };

  // ==================== CONTEXT VALUE ====================
  const value: UserContextType = {
    user,
    firebaseUser,
    progress,
    setUser,
    updateUser,
    logout,
    updateProgress,
    getProgress,
    getTotalProgress,
    resetProgress,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// ==================== HOOK ====================
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// ==================== EXPORTS ====================
export default UserContext;