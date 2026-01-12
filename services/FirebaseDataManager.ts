// services/FirebaseDataManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore as db } from './firebaseConfig';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  collection, 
  addDoc,
  getDocs, 
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  USER_DATA: '@user_data',
  USER_PROGRESS: '@user_progress',
  THEME: '@app_theme',
  LANGUAGE: '@app_language',
  WATER_DATA: '@water_tracker_data',

  HABITS_DATA: '@habits_tracker_data',
  LANGUAGE_LEARNING_DATA: '@language_learning_data',
  CHALLENGES_DATA: '@challenges_data',
} as const;

// ==================== TYPES ====================
export interface WaterData {
  dailyGoal: number;
  consumed: number;
  history: Array<{ date: string; amount: number; goal: number }>;
  streak: number;
  lastUpdate: string;
}

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  history: string[];
  notificationEnabled: boolean;
  notificationTime: string;
  notificationMessage: string;
  createdAt?: any;
}

export interface HabitsData {
  habits: Habit[];
  totalHabits: number;
  completedToday: number;
  lastUpdate: string;
}

export interface VocabularyWord {
  word: string;
  translation: string;
  learned: boolean;
  reviewCount: number;
  lastReviewed: string;
}

export interface LanguageLearningData {
  wordsLearned: number;
  currentLesson: number;
  quizzesPassed: number;
  vocabulary: VocabularyWord[];
  lastStudyDate: string;
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt?: any;
  completedAt?: any;
}

// ==================== DATA MANAGER CLASS ====================
class FirebaseDataManager {
  
  /**
   * تسجيل مستخدم جديد - الهيكل الأساسي فقط
   */
  async registerNewUser(uid: string, userData: {
    email: string;
    username: string;
    age?: number;
    weight?: number;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      
      const newUserData = {
        uid,
        email: userData.email,
        username: userData.username,
        age: userData.age || 0,
        weight: userData.weight || 0,
        dailyWaterGoal: 2000,
        accountCreatedAt: serverTimestamp(),
        lastLoginDate: serverTimestamp(),
        loginCount: 1,
        
        // ملخص التقدم فقط (يظهر في الشاشة الرئيسية)
        progress: {
          water: { totalTime: 0, completedTasks: 0, totalTasks: 2000, percentage: 0, streakDays: 0 },
          habits: { totalTime: 0, completedTasks: 0, totalTasks: 0, percentage: 0, streakDays: 0 },
          language: { totalTime: 0, completedTasks: 0, totalTasks: 20, percentage: 0, streakDays: 0 },
          challenges: { totalTime: 0, completedTasks: 0, totalTasks: 0, percentage: 0, streakDays: 0 },
        },
      };

      await setDoc(userRef, newUserData);
      await AsyncStorage.setItem(`${STORAGE_KEYS.USER_DATA}_${uid}`, JSON.stringify(newUserData));
      
      // إنشاء بيانات أولية في Sub-collections
      await this.saveWaterData(uid, {
        dailyGoal: 2000, 
        consumed: 0, 
        history: [], 
        streak: 0, 
        lastUpdate: new Date().toISOString()
      });
      
      await this.saveLanguageData(uid, {
        wordsLearned: 0, 
        currentLesson: 1, 
        quizzesPassed: 0, 
        vocabulary: this.getInitialVocabulary(), 
        lastStudyDate: new Date().toISOString()
      });

      await this.saveHabitsData(uid, {
        habits: [],
        totalHabits: 0,
        completedToday: 0,
        lastUpdate: new Date().toISOString()
      });

      console.log('✅ New user registered with sub-collections');
    } catch (error) {
      console.error('❌ Error registering new user:', error);
      throw error;
    }
  }

  async updateLoginStats(uid: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginDate: serverTimestamp(),
        loginCount: increment(1),
      });
    } catch (error) {
      console.error('❌ Error updating login stats:', error);
    }
  }

  async loadUserDataFromCloud(uid: string): Promise<any> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) return userSnap.data();
      return null;
    } catch (error) {
      return null;
    }
  }

  // ==================== 💧 WATER (SUB-COLLECTION) ====================
  // Path: users/{uid}/water/tracker
  
  async saveWaterData(uid: string, data: WaterData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.WATER_DATA}_${uid}`, JSON.stringify(data));

      // 1. حفظ التفاصيل الكاملة في sub-collection
      const waterRef = doc(db, 'users', uid, 'water', 'tracker');
      await setDoc(waterRef, { ...data, updatedAt: serverTimestamp() });

      // 2. تحديث الملخص في المستند الرئيسي
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'progress.water.completedTasks': data.consumed,
        'progress.water.totalTasks': data.dailyGoal,
        'progress.water.percentage': data.dailyGoal > 0 ? Math.round((data.consumed / data.dailyGoal) * 100) : 0,
        'progress.water.streakDays': data.streak,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Water data saved to sub-collection');
    } catch (error) {
      console.error('❌ Error saving water data:', error);
    }
  }

  async loadWaterData(uid: string): Promise<WaterData> {
    const defaultData: WaterData = {
      dailyGoal: 2000, consumed: 0, history: [], streak: 0, lastUpdate: new Date().toISOString(),
    };

    try {
      const waterRef = doc(db, 'users', uid, 'water', 'tracker');
      const waterSnap = await getDoc(waterRef);

      if (waterSnap.exists()) {
        return waterSnap.data() as WaterData;
      }

      const localData = await AsyncStorage.getItem(`${STORAGE_KEYS.WATER_DATA}_${uid}`);
      if (localData) return JSON.parse(localData);

      return defaultData;
    } catch (error) {
      return defaultData;
    }
  }

  // ==================== 🗣️ LANGUAGE (SUB-COLLECTION) ====================
  // Path: users/{uid}/language/tracker

  async saveLanguageData(uid: string, data: LanguageLearningData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.LANGUAGE_LEARNING_DATA}_${uid}`, JSON.stringify(data));

      // 1. حفظ التفاصيل الكاملة
      const langRef = doc(db, 'users', uid, 'language', 'tracker');
      await setDoc(langRef, { ...data, updatedAt: serverTimestamp() });

      // 2. تحديث الملخص
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'progress.language.completedTasks': data.wordsLearned,
        'progress.language.totalTasks': data.vocabulary.length,
        'progress.language.percentage': data.vocabulary.length > 0 ? Math.round((data.wordsLearned / data.vocabulary.length) * 100) : 0,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Language data saved to sub-collection');
    } catch (error) {
      console.error('❌ Error saving language data:', error);
    }
  }

  async loadLanguageData(uid: string): Promise<LanguageLearningData> {
    const defaultData: LanguageLearningData = {
      wordsLearned: 0, 
      currentLesson: 1, 
      quizzesPassed: 0, 
      vocabulary: this.getInitialVocabulary(), 
      lastStudyDate: new Date().toISOString(),
    };

    try {
      const langRef = doc(db, 'users', uid, 'language', 'tracker');
      const langSnap = await getDoc(langRef);

      if (langSnap.exists()) {
        return langSnap.data() as LanguageLearningData;
      }

      const localData = await AsyncStorage.getItem(`${STORAGE_KEYS.LANGUAGE_LEARNING_DATA}_${uid}`);
      if (localData) return JSON.parse(localData);

      return defaultData;
    } catch (error) {
      return defaultData;
    }
  }

  // ==================== ✅ HABITS (SUB-COLLECTION) ====================
  // Path: users/{uid}/habits/{habitId}

  async saveHabitsData(uid: string, data: HabitsData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.HABITS_DATA}_${uid}`, JSON.stringify(data));

      // 1. حفظ كل عادة كـ document منفصل
      const batch = writeBatch(db);
      const habitsCollectionRef = collection(db, 'users', uid, 'habits');

      // حذف العادات القديمة أولاً (optional - يمكنك تحسينه لاحقاً)
      const oldHabitsSnapshot = await getDocs(habitsCollectionRef);
      oldHabitsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // إضافة العادات الجديدة
      data.habits.forEach(habit => {
        const habitRef = doc(habitsCollectionRef, habit.id);
        batch.set(habitRef, {
          ...habit,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();

      // 2. تحديث الملخص
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'progress.habits.completedTasks': data.completedToday,
        'progress.habits.totalTasks': data.totalHabits,
        'progress.habits.percentage': data.totalHabits > 0 ? Math.round((data.completedToday / data.totalHabits) * 100) : 0,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Habits data saved to sub-collection');
    } catch (error) {
      console.error('❌ Error saving habits data:', error);
    }
  }

  async loadHabitsData(uid: string): Promise<HabitsData> {
    const defaultData: HabitsData = {
      habits: [], 
      totalHabits: 0, 
      completedToday: 0, 
      lastUpdate: new Date().toISOString()
    };

    try {
      const habitsCollectionRef = collection(db, 'users', uid, 'habits');
      const habitsSnapshot = await getDocs(habitsCollectionRef);

      if (!habitsSnapshot.empty) {
        const habits = habitsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Habit[];

        const completedToday = habits.filter(h => h.completed).length;

        return {
          habits,
          totalHabits: habits.length,
          completedToday,
          lastUpdate: new Date().toISOString()
        };
      }

      const localData = await AsyncStorage.getItem(`${STORAGE_KEYS.HABITS_DATA}_${uid}`);
      if (localData) return JSON.parse(localData);

      return defaultData;
    } catch (error) {
      console.error('❌ Error loading habits data:', error);
      return defaultData;
    }
  }

  // ==================== 🏆 CHALLENGES (SUB-COLLECTION) ====================
  // Path: users/{uid}/challenges/{challengeId}

  async addChallenge(uid: string, challenge: Omit<Challenge, 'id' | 'createdAt'>): Promise<string> {
    try {
      const challengesRef = collection(db, 'users', uid, 'challenges');
      const docRef = await addDoc(challengesRef, {
        ...challenge,
        isCompleted: false,
        createdAt: serverTimestamp()
      });

      // تحديث عداد التحديات
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'progress.challenges.totalTasks': increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Challenge added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding challenge:', error);
      throw error;
    }
  }

  async getUserChallenges(uid: string): Promise<Challenge[]> {
    try {
      const challengesRef = collection(db, 'users', uid, 'challenges');
      const q = query(challengesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Challenge[];
    } catch (error) {
      console.error('❌ Error fetching challenges:', error);
      return [];
    }
  }

  async updateChallenge(uid: string, challengeId: string, updates: Partial<Challenge>): Promise<void> {
    try {
      const challengeRef = doc(db, 'users', uid, 'challenges', challengeId);
      await updateDoc(challengeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // إذا تم إكمال التحدي، حدّث العداد
      if (updates.isCompleted) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          'progress.challenges.completedTasks': increment(1),
          updatedAt: serverTimestamp()
        });
      }

      console.log('✅ Challenge updated');
    } catch (error) {
      console.error('❌ Error updating challenge:', error);
    }
  }

  async deleteChallenge(uid: string, challengeId: string): Promise<void> {
    try {
      const challengeRef = doc(db, 'users', uid, 'challenges', challengeId);
      await deleteDoc(challengeRef);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'progress.challenges.totalTasks': increment(-1),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Challenge deleted');
    } catch (error) {
      console.error('❌ Error deleting challenge:', error);
    }
  }

  // ==================== HELPER ====================
  
  getInitialVocabulary(): VocabularyWord[] {
    return [
      { word: 'Hello', translation: 'مرحبا', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Goodbye', translation: 'وداعا', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Thank you', translation: 'شكراً', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Please', translation: 'من فضلك', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Water', translation: 'ماء', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Food', translation: 'طعام', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'House', translation: 'منزل', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Car', translation: 'سيارة', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Book', translation: 'كتاب', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Phone', translation: 'هاتف', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Computer', translation: 'حاسوب', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'School', translation: 'مدرسة', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Friend', translation: 'صديق', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Family', translation: 'عائلة', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Love', translation: 'حب', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Happy', translation: 'سعيد', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Sad', translation: 'حزين', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Beautiful', translation: 'جميل', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Good', translation: 'جيد', learned: false, reviewCount: 0, lastReviewed: '' },
      { word: 'Bad', translation: 'سيء', learned: false, reviewCount: 0, lastReviewed: '' },
    ];
  }

  async deleteUserAccount(uid: string): Promise<void> {
    try {
      // حذف جميع sub-collections
      const collections = ['water', 'language', 'habits', 'challenges'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, 'users', uid, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // حذف المستند الرئيسي
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);

      // حذف من AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes(uid));
      await AsyncStorage.multiRemove(userKeys);

      console.log('✅ User account and all data deleted');
    } catch (error) {
      console.error('❌ Error deleting user account:', error);
      throw error;
    }
  }
}

const dataManager = new FirebaseDataManager();
export default dataManager;
export { FirebaseDataManager };