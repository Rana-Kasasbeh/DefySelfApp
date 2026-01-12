// services/firebaseService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Query,
  DocumentData
} from 'firebase/firestore';
import { 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  query as rtQuery, 
  orderByChild, 
  equalTo 
} from 'firebase/database';
import { firestore, realtimeDb } from './firebaseConfig';

// ==================== FIRESTORE SERVICES (للمستخدمين) ====================

export const firestoreService = {
  // إنشاء مستخدم جديد
  async createUser(userId: string, userData: any) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على بيانات مستخدم
  async getUser(userId: string) {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error: any) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // تحديث بيانات مستخدم
  async updateUser(userId: string, updates: any) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // البحث عن مستخدم بالإيميل
  async findUserByEmail(email: string) {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { 
          success: true, 
          data: { 
            id: userDoc.id, 
            ...userDoc.data() 
          } 
        };
      }
      return { success: false, error: 'User not found' };
    } catch (error: any) {
      console.error('Error finding user by email:', error);
      return { success: false, error: error.message };
    }
  },

  // حذف مستخدم
  async deleteUser(userId: string) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await deleteDoc(userRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== REALTIME DATABASE SERVICES (للكلمات والتحديات) ====================

export const realtimeService = {
  // الحصول على جميع الكلمات
  async getAllWords() {
    try {
      const wordsRef = ref(realtimeDb, 'words');
      const snapshot = await get(wordsRef);
      
      if (snapshot.exists()) {
        const wordsData = snapshot.val();
        const wordsArray = Object.entries(wordsData).map(([id, data]: [string, any]) => ({
          id,
          english: data.english || data.en || '',
          arabic: data.arabic || data.ar || ''
        }));
        return { success: true, data: wordsArray };
      }
      return { success: true, data: [] };
    } catch (error: any) {
      console.error('Error getting words:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على جميع التحديات
  async getAllChallenges() {
    try {
      const challengesRef = ref(realtimeDb, 'challenges');
      const snapshot = await get(challengesRef);
      
      if (snapshot.exists()) {
        const challengesData = snapshot.val();
        const challengesArray = Object.entries(challengesData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));
        return { success: true, data: challengesArray };
      }
      return { success: true, data: [] };
    } catch (error: any) {
      console.error('Error getting challenges:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على تقدم المستخدم (من Realtime Database)
  async getUserProgress(userId: string, type: 'wordProgress' | 'challengeProgress') {
    try {
      const progressRef = ref(realtimeDb, `users/${userId}/${type}`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      }
      return { success: true, data: null };
    } catch (error: any) {
      console.error('Error getting user progress:', error);
      return { success: false, error: error.message };
    }
  },

  // حفظ تقدم المستخدم
  async saveUserProgress(userId: string, type: 'wordProgress' | 'challengeProgress', data: any) {
    try {
      const progressRef = ref(realtimeDb, `users/${userId}/${type}`);
      await set(progressRef, {
        ...data,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error saving user progress:', error);
      return { success: false, error: error.message };
    }
  },

  // تحديث تقدم المستخدم
  async updateUserProgress(userId: string, type: 'wordProgress' | 'challengeProgress', updates: any) {
    try {
      const progressRef = ref(realtimeDb, `users/${userId}/${type}`);
      await update(progressRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user progress:', error);
      return { success: false, error: error.message };
    }
  },

  // قراءة أي بيانات من Realtime Database
  async getData(path: string) {
    try {
      const dataRef = ref(realtimeDb, path);
      const snapshot = await get(dataRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      }
      return { success: true, data: null };
    } catch (error: any) {
      console.error('Error getting data:', error);
      return { success: false, error: error.message };
    }
  },

  // كتابة أي بيانات إلى Realtime Database
  async setData(path: string, data: any) {
    try {
      const dataRef = ref(realtimeDb, path);
      await set(dataRef, data);
      return { success: true };
    } catch (error: any) {
      console.error('Error setting data:', error);
      return { success: false, error: error.message };
    }
  },

  // تحديث أي بيانات في Realtime Database
  async updateData(path: string, updates: any) {
    try {
      const dataRef = ref(realtimeDb, path);
      await update(dataRef, updates);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating data:', error);
      return { success: false, error: error.message };
    }
  },

  // حذف بيانات من Realtime Database
  async deleteData(path: string) {
    try {
      const dataRef = ref(realtimeDb, path);
      await remove(dataRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting data:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==================== UNIFIED SERVICE (خدمة موحدة) ====================

export const firebaseService = {
  // Firestore services
  users: firestoreService,
  
  // Realtime Database services
  data: realtimeService,
  
  // Aliases للتوافق
  createUser: firestoreService.createUser,
  getUser: firestoreService.getUser,
  updateUser: firestoreService.updateUser,
  findUserByEmail: firestoreService.findUserByEmail,
  
  getAllWords: realtimeService.getAllWords,
  getAllChallenges: realtimeService.getAllChallenges,
  getUserProgress: realtimeService.getUserProgress,
  saveUserProgress: realtimeService.saveUserProgress,
  updateUserProgress: realtimeService.updateUserProgress
};

export default firebaseService;
