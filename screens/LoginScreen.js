// screens/LoginScreen.js - CONNECTED TO BACKEND
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';

import { useGlobal } from '../contexts/GlobalContext';

const API_URL = 'https://defyself-backend-043eac13f465.herokuapp.com/api';

const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6', '#a855f7'],
  dark: '#1f2937',
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  darkText: '#f1f5f9',
  darkBorder: '#334155',
  light: '#f8fafc',
  white: '#ffffff',
  gray: '#64748b',
  lightGray: '#94a3b8',
};

const translations = {
  ar: {
    title: 'مرحباً بعودتك',
    subtitle: 'سجّل الدخول للمتابعة',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    signup: 'إنشاء حساب',
    error: 'خطأ',
    success: 'نجاح',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    enterEmail: 'الرجاء إدخال البريد الإلكتروني',
    enterPassword: 'الرجاء إدخال كلمة المرور',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    loggingIn: 'جاري تسجيل الدخول...',
  },
  en: {
    title: 'Welcome Back',
    subtitle: 'Login to continue',
    emailPlaceholder: 'Email Address',
    passwordPlaceholder: 'Password',
    loginButton: 'Login',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    signup: 'Sign Up',
    error: 'Error',
    success: 'Success',
    loginSuccess: 'Login successful',
    enterEmail: 'Please enter email',
    enterPassword: 'Please enter password',
    invalidCredentials: 'Invalid email or password',
    loggingIn: 'Logging in...',
  },
};

export default function LoginScreen({ navigation }) {
  const { isDark, language, toggleTheme, toggleLanguage, setUser } = useGlobal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const t = translations[language];
  const isRTL = language === 'ar';

  const backgroundColor = isDark ? COLORS.darkBg : COLORS.light;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const secondaryTextColor = isDark ? COLORS.lightGray : COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';
  const placeholderColor = isDark ? COLORS.lightGray : COLORS.gray;

  useEffect(() => {
    loadSavedEmail();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('@last_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved email:', error);
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      Alert.alert(t.error, t.enterEmail);
      return;
    }

    if (!cleanPassword) {
      Alert.alert(t.error, t.enterPassword);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login...');
      console.log('📧 Email:', cleanEmail);

      const response = await axios.post(`${API_URL}/login`, {
        email: cleanEmail,
        password: cleanPassword,
      });

      if (response.data.success) {
        console.log('✅ Login successful');
        console.log('👤 User:', response.data.user);
        console.log('🔑 Token:', response.data.token);

        await AsyncStorage.setItem('@auth_token', response.data.token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));

        if (setUser) {
          setUser(response.data.user);
        }

        if (rememberMe) {
          await AsyncStorage.setItem('@last_email', cleanEmail);
        } else {
          await AsyncStorage.removeItem('@last_email');
        }

        Alert.alert(t.success, t.loginSuccess);
        navigation.replace('DefySelfIcons');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = t.invalidCredentials;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: isDark ? COLORS.darkBorder : '#e2e8f0' }]}
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerButtonText, { color: textColor }]}>
                {language === 'en' ? 'AR' : 'EN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: isDark ? COLORS.darkBorder : '#e2e8f0' }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerButtonText, { color: textColor }]}>
                {isDark ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require('../assets/LOGO.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.title, { color: textColor }]}>
              {t.title}
            </Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              {t.subtitle}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="at"
                size={20}
                color={secondaryTextColor}
                style={[styles.inputIcon, { [isRTL ? 'right' : 'left']: 15 }]}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                    [isRTL ? 'paddingRight' : 'paddingLeft']: 45,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                placeholder={t.emailPlaceholder}
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={secondaryTextColor}
                style={[styles.inputIcon, { [isRTL ? 'right' : 'left']: 15 }]}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                    [isRTL ? 'paddingRight' : 'paddingLeft']: 45,
                    paddingRight: 45,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                placeholder={t.passwordPlaceholder}
                placeholderTextColor={placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={[styles.eyeIcon, { [isRTL ? 'left' : 'right']: 15 }]}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <MaterialCommunityIcons
                  name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={[styles.rememberMeText, { color: secondaryTextColor }]}>
                  {isRTL ? 'تذكرني' : 'Remember me'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotPassword, { color: COLORS.primary }]}>
                  {t.forgotPassword}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? [COLORS.gray, COLORS.gray] : COLORS.primaryGradient}
                style={styles.loginButton}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={styles.loginButtonText}>{t.loggingIn}</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="login"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.loginButtonText}>{t.loginButton}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: secondaryTextColor }]}>
                {t.noAccount}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.signupLink, { color: COLORS.primary }]}>
                  {t.signup}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: wp('5%'),
    paddingTop: hp('8%'),
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: hp('2%'),
  },
  headerButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  logo: {
    width: wp('40%'),
    height: wp('40%'),
    maxWidth: 200,
    maxHeight: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: hp('4%'),
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    padding: wp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignSelf: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  inputIcon: {
    position: 'absolute',
    top: 15,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    top: 15,
    zIndex: 1,
  },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});