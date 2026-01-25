// screens/SignupScreen.js - CONNECTED TO BACKEND
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { useGlobal } from '../contexts/GlobalContext';
import api from '../services/api';

const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6', '#a855f7'],
  success: '#10b981',
  successGradient: ['#10b981', '#059669'],
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
    title: 'إنشاء حساب جديد',
    subtitle: 'انضم إلينا وابدأ رحلتك',
    namePlaceholder: 'الاسم الكامل *',
    emailPlaceholder: 'البريد الإلكتروني *',
    passwordPlaceholder: 'كلمة المرور *',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور *',
    agePlaceholder: 'العمر *',
    signupButton: 'إنشاء الحساب',
    haveAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    error: 'خطأ',
    success: 'نجاح',
    signupSuccess: 'تم إنشاء حسابك بنجاح! 🎉',
    enterName: 'الرجاء إدخال الاسم',
    enterEmail: 'الرجاء إدخال البريد الإلكتروني',
    enterPassword: 'الرجاء إدخال كلمة المرور',
    enterAge: 'الرجاء إدخال العمر',
    invalidEmail: 'تنسيق البريد الإلكتروني غير صحيح',
    shortPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    emailInUse: 'البريد الإلكتروني مستخدم بالفعل',
    creating: 'جاري إنشاء الحساب...',
  },
  en: {
    title: 'Create New Account',
    subtitle: 'Join us and start your journey',
    namePlaceholder: 'Full Name *',
    emailPlaceholder: 'Email Address *',
    passwordPlaceholder: 'Password *',
    confirmPasswordPlaceholder: 'Confirm Password *',
    agePlaceholder: 'Age *',
    signupButton: 'Create Account',
    haveAccount: 'Already have an account?',
    login: 'Login',
    error: 'Error',
    success: 'Success',
    signupSuccess: 'Account created successfully! 🎉',
    enterName: 'Please enter name',
    enterEmail: 'Please enter email',
    enterPassword: 'Please enter password',
    enterAge: 'Please enter age',
    invalidEmail: 'Invalid email format',
    shortPassword: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    emailInUse: 'Email already in use',
    creating: 'Creating account...',
  },
};

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export default function SignupScreen({ navigation }) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanAge = age.trim();

    // Validation
    if (!cleanName) {
      Alert.alert(t.error, t.enterName);
      return;
    }

    if (!cleanEmail) {
      Alert.alert(t.error, t.enterEmail);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert(t.error, t.invalidEmail);
      return;
    }

    if (!cleanPassword) {
      Alert.alert(t.error, t.enterPassword);
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert(t.error, t.shortPassword);
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      Alert.alert(t.error, t.passwordMismatch);
      return;
    }

    if (!cleanAge) {
      Alert.alert(t.error, t.enterAge);
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting signup process...');
      console.log('📧 Email:', cleanEmail);
      console.log('👤 Name:', cleanName);
      console.log('🎂 Age:', cleanAge);

      // Call API register
      const response = await api.register(cleanName, cleanEmail, cleanAge, cleanPassword);

      if (response.success) {
        console.log('✅ Signup successful');
        console.log('👤 User created:', response.user);

        Alert.alert(
          t.success,
          t.signupSuccess,
          [
            {
              text: t.login,
              onPress: () => {
                // Clear fields
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setAge('');

                // Navigate to DefySelfIcons (already logged in via API)
                navigation.replace('DefySelfIcons');
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      Alert.alert(t.error, error.message || 'حدث خطأ غير متوقع');
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
          {/* Header Buttons */}
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

          {/* Logo */}
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

          {/* Title */}
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

          {/* Card */}
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
            {/* Name */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
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
                placeholder={t.namePlaceholder}
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Email */}
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

            {/* Age */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="calendar"
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
                placeholder={t.agePlaceholder}
                placeholderTextColor={placeholderColor}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            {/* Password */}
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-check-outline"
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
                placeholder={t.confirmPasswordPlaceholder}
                placeholderTextColor={placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={[styles.eyeIcon, { [isRTL ? 'left' : 'right']: 15 }]}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? [COLORS.gray, COLORS.gray] : [...COLORS.successGradient]}
                style={styles.signupButton}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={styles.signupButtonText}>{t.creating}</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-plus"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.signupButtonText}>{t.signupButton}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: secondaryTextColor }]}>
                {t.haveAccount}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: COLORS.primary }]}>
                  {t.login}
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
    marginBottom: hp('2%'),
  },
  logo: {
    width: wp('35%'),
    height: wp('35%'),
    maxWidth: 180,
    maxHeight: 180,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: hp('3%'),
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
    marginBottom: hp('1.5%'),
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
  signupButton: {
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
  signupButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});