// services/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// منع إعادة التهيئة
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth - للمصادقة
export const auth = getAuth(app);

// ✅ Firestore - لبيانات المستخدمين
export const firestore = getFirestore(app);

// ✅ Realtime Database - للكلمات والتحديات
export const realtimeDb = getDatabase(app);
export const db = getDatabase(app); // alias للتوافق مع الكود القديم

export default app;