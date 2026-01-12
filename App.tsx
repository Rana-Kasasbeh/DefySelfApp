import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import './i18n/i18n';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';

// 1. استيراد مكتبات الإعلانات
import mobileAds, { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import { AdUnits } from './ads/AdConfig'; // الملف الذي أنشأناه سابقاً

// Import Screens (نفس شاشاتك بالضبط)
import DefySelfIcons from './screens/DefySelfIcons';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SettingsScreen from './screens/SettingsScreen';
import HabitsScreen from './screens/HabitsScreen';
import WaterTracker from './screens/WaterTracker';
import LanguageScreen from './screens/LanguageScreen';

export type RootParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Settings: undefined;
  Habits: undefined;
  Water: undefined;
  Language: undefined;
};

const Stack = createNativeStackNavigator<RootParamList>();

// متغير للإعلان (خارج المكون لعدم إعادة إنشائه)
let appOpenAd: AppOpenAd | null = null;

// ====================== SPLASH SCREEN ======================
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { isDark } = useGlobal();
  const [isAdShown, setIsAdShown] = useState(false);

  useEffect(() => {
    // محاولة تحميل الإعلان
    const loadAd = () => {
       appOpenAd = AppOpenAd.createForAdRequest(AdUnits.APP_OPEN, {
        requestNonPersonalizedAdsOnly: true,
      });

      appOpenAd.load();

      // إذا تحمل الإعلان بنجاح
      const unsubscribeLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        appOpenAd?.show();
        setIsAdShown(true);
      });

      // عند إغلاق الإعلان (بواسطة المستخدم) -> نذهب للتطبيق
      const unsubscribeClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        onFinish();
      });

      // إذا حدث خطأ في التحميل -> نذهب للتطبيق فوراً
      const unsubscribeError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Ad Error:', error);
        // لا نستدعي onFinish هنا لأن التايمر بالأسفل سيتكفل بالأمر لتجنب التضارب
      });

      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
      };
    };

    loadAd();

    // =================================================================
    // صمام الأمان (Safety Timer):
    // هذا التايمر يضمن أنه مهما حدث (نت بطيء، لا يوجد إعلانات)
    // التطبيق سيدخل بعد 3.5 ثانية كحد أقصى.
    // =================================================================
    const timer = setTimeout(() => {
      if (!isAdShown) {
        onFinish();
      }
    }, 3500); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.splash, { backgroundColor: isDark ? '#141d25' : '#fff' }]}>
      <Image source={require('./assets/LOGO.png')} style={styles.splashLogo} />
      <Text style={[styles.splashText, { color: isDark ? '#fff' : '#141d25' }]}>
        DefySelf
      </Text>
      <Text style={[styles.splashSubtext, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        تحدى نفسك
      </Text>
      <ActivityIndicator size="large" color={isDark ? '#fff' : '#3b82f6'} />
    </View>
  );
}

// ====================== APP CONTENT ======================
function AppContent() {
  const { isDark, user, isLoading, isReady } = useGlobal();
  const [showSplash, setShowSplash] = useState(true);

  // عرض السبلاش سكرين أولاً (التي تحتوي على منطق الإعلان)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // إذا كان التطبيق يجهز البيانات أو يتحقق من المستخدم
  if (!isReady || isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: isDark ? '#141d25' : '#fff' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // التنقل الأساسي (كما هو بدون تغيير)
  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={DefySelfIcons} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Habits" component={HabitsScreen} />
            <Stack.Screen name="Water" component={WaterTracker} />
            <Stack.Screen name="Language" component={LanguageScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ====================== MAIN APP ======================
export default function App() {
  
  // تهيئة الإعلانات عند بدء التطبيق
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        // Initialization complete!
      });
  }, []);

  return (
    <GlobalProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GlobalProvider>
  );
}

// ====================== STYLES ======================
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashLogo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  splashText: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  splashSubtext: {
    fontSize: 22,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
  },
});