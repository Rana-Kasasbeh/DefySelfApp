// App.tsx - Enhanced with centralized data management
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import './i18n/i18n';

// ==================== CONTEXTS ====================
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';

// ==================== SCREENS ====================
import DefySelfIcons from './screens/DefySelfIcons';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SettingsScreen from './screens/SettingsScreen';
import HabitsScreen from './screens/HabitsScreen';
import WaterTracker from './screens/WaterTracker';
import LanguageScreen from './screens/LanguageScreen';

const Stack = createNativeStackNavigator();

// ==================== SPLASH SCREEN ====================
interface SplashScreenProps {
  onFinish: () => void;
}

function SplashScreen({ onFinish }: SplashScreenProps) {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    console.log('🎬 Splash Screen: Started');
    const timer = setTimeout(() => {
      console.log('✅ Splash Screen: Completed');
      onFinish();
    }, 3000); // 3 seconds instead of 8
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={[styles.splash, { backgroundColor: theme.background }]}>
      <Image
        source={require('./assets/LOGO.png')}
        style={styles.splashLogo}
      />
      <Text style={[styles.splashText, { color: theme.text }]}>
        DefySelf
      </Text>
      <Text style={[styles.splashSubtext, { color: theme.textSecondary }]}>
        تحدى نفسك
      </Text>
      <ActivityIndicator 
        size="large" 
        color={theme.primary} 
        style={{ marginTop: 30 }}
      />
    </View>
  );
}

// ==================== NAVIGATION CONTAINER ====================
function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { firebaseUser, isLoading: userLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);

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

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (userLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          جاري التحميل...
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
          contentStyle: { backgroundColor: theme.background }
        }}
      >
        {!firebaseUser ? (
          // ==================== AUTH SCREENS ====================
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ 
                gestureEnabled: false,
                animation: 'fade'
              }} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ 
                animation: 'slide_from_right' 
              }} 
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ 
                animation: 'slide_from_right' 
              }} 
            />
          </>
        ) : (
          // ==================== APP SCREENS ====================
          <>
            <Stack.Screen 
              name="Home" 
              component={DefySelfIcons} 
              options={{ 
                gestureEnabled: false,
                animation: 'fade'
              }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                animation: 'slide_from_right',
                presentation: 'card'
              }}
            />
            <Stack.Screen 
              name="Habits" 
              component={HabitsScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card'
              }}
            />
            <Stack.Screen 
              name="Water" 
              component={WaterTracker}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card'
              }}
            />
            <Stack.Screen 
              name="Language" 
              component={LanguageScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card'
              }}
            />
         
      
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== MAIN APP COMPONENT ====================
function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <AppNavigator />
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;

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