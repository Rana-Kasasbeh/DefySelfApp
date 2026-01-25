// App.js - Enhanced with Backend API Integration
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Contexts
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';

// API
import api from './services/api';

// Screens
import DefySelfIcons from './screens/DefySelfIcons';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HabitsScreen from './screens/HabitsScreen';
import WaterTracker from './screens/WaterTracker';
import LanguageScreen from './screens/LanguageScreen';
import VocabularyManagementScreen from './screens/VocabularyManagementScreen';

const Stack = createNativeStackNavigator();

// ==================== SPLASH SCREEN ====================
function SplashScreen({ onFinish }) {
  const { isDark, theme } = useGlobal();

  useEffect(() => {
    console.log('🎬 Splash Screen: Started');
    const timer = setTimeout(() => {
      console.log('✅ Splash Screen: Completed');
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={[styles.splash, { backgroundColor: theme.background }]}>
      <Image source={require('./assets/LOGO.png')} style={styles.splashLogo} />
      <Text style={[styles.splashText, { color: theme.text }]}>DefySelf</Text>
      <Text style={[styles.splashSubtext, { color: theme.textSecondary }]}>تحدى نفسك</Text>
      <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
    </View>
  );
}

// ==================== NAVIGATION CONTAINER ====================
function AppNavigator() {
  const { isDark, theme, language } = useGlobal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      console.log('🔍 Checking login status...');
      const loggedIn = await api.isLoggedIn();
      setIsLoggedIn(loggedIn);
      console.log(loggedIn ? '✅ User is logged in' : '❌ User not logged in');
    } catch (error) {
      console.error('❌ Login check error:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom navigation theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.notification,
    },
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading
  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          {language === 'en' ? 'Loading...' : 'جاري التحميل...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {!isLoggedIn ? (
          // ==================== AUTH SCREENS ====================
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : (
          // ==================== APP SCREENS ====================
          <>
            <Stack.Screen
              name="DefySelfIcons"
              component={DefySelfIcons}
              options={{
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="Habits"
              component={HabitsScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="Water"
              component={WaterTracker}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="Language"
              component={LanguageScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="VocabManagement"
              component={VocabularyManagementScreen}
              options={{
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== MAIN APP COMPONENT ====================
export default function App() {
  return (
    <SafeAreaProvider>
      <GlobalProvider>
        <AppNavigator />
      </GlobalProvider>
    </SafeAreaProvider>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashLogo: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  splashText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashSubtext: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});