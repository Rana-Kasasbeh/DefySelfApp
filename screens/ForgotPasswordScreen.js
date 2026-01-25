// screens/ForgotPasswordScreen.js - COMPLETE & READY
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

// ==================== COLORS ====================
const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6', '#a855f7'],
  success: '#10b981',
  successGradient: ['#10b981', '#059669'],
  error: '#ef4444',
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

// ==================== TRANSLATIONS ====================
const translations = {
  ar: {
    title: 'استعادة كلمة المرور',
    subtitle: 'سنرسل لك كود التحقق',
    emailPlaceholder: 'البريد الإلكتروني',
    codePlaceholder: 'كود التحقق (6 أرقام)',
    newPasswordPlaceholder: 'كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    sendCodeButton: 'إرسال الكود',
    verifyCodeButton: 'التحقق من الكود',
    resetPasswordButton: 'تغيير كلمة المرور',
    backToLogin: 'العودة لتسجيل الدخول',
    error: 'خطأ',
    success: 'نجاح',
    enterEmail: 'الرجاء إدخال البريد الإلكتروني',
    invalidEmail: 'تنسيق البريد الإلكتروني غير صحيح',
    codeSent: 'تم إرسال الكود إلى بريدك الإلكتروني',
    enterCode: 'الرجاء إدخال الكود',
    invalidCode: 'الكود يجب أن يكون 6 أرقام',
    codeVerified: 'تم التحقق من الكود بنجاح',
    enterPassword: 'الرجاء إدخال كلمة المرور الجديدة',
    shortPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    sendingCode: 'جاري إرسال الكود...',
    verifying: 'جاري التحقق...',
    resetting: 'جاري التغيير...',
    resendCode: 'إعادة إرسال الكود',
    codeExpiresIn: 'الكود صالح لمدة دقيقتين',
    networkError: 'خطأ في الاتصال بالخادم',
    tryAgain: 'حاول مرة أخرى',
  },
  en: {
    title: 'Reset Password',
    subtitle: 'We will send you a verification code',
    emailPlaceholder: 'Email Address',
    codePlaceholder: 'Verification Code (6 digits)',
    newPasswordPlaceholder: 'New Password',
    confirmPasswordPlaceholder: 'Confirm Password',
    sendCodeButton: 'Send Code',
    verifyCodeButton: 'Verify Code',
    resetPasswordButton: 'Reset Password',
    backToLogin: 'Back to Login',
    error: 'Error',
    success: 'Success',
    enterEmail: 'Please enter email',
    invalidEmail: 'Invalid email format',
    codeSent: 'Code sent to your email',
    enterCode: 'Please enter code',
    invalidCode: 'Code must be 6 digits',
    codeVerified: 'Code verified successfully',
    enterPassword: 'Please enter new password',
    shortPassword: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    passwordChanged: 'Password changed successfully',
    sendingCode: 'Sending code...',
    verifying: 'Verifying...',
    resetting: 'Resetting...',
    resendCode: 'Resend Code',
    codeExpiresIn: 'Code valid for 2 minutes',
    networkError: 'Network connection error',
    tryAgain: 'Try again',
  },
};

// ==================== VALIDATION ====================
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// ==================== COMPONENT ====================
export default function ForgotPasswordScreen({ navigation }) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();

  // States
  const [step, setStep] = useState(1); // 1: email, 2: verify code, 3: new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const t = translations[language];
  const isRTL = language === 'ar';

  // Theme colors
  const backgroundColor = isDark ? COLORS.darkBg : COLORS.light;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const secondaryTextColor = isDark ? COLORS.lightGray : COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';
  const placeholderColor = isDark ? COLORS.lightGray : COLORS.gray;

  // ==================== ANIMATIONS ====================
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

  // ==================== STEP 1: SEND CODE ====================
  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    // Validation
    if (!cleanEmail) {
      Alert.alert(t.error, t.enterEmail);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert(t.error, t.invalidEmail);
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Sending reset code to:', cleanEmail);

      const response = await api.forgotPassword(cleanEmail);

      console.log('✅ Response:', response);

      if (response.success) {
        Alert.alert(t.success, t.codeSent, [
          {
            text: 'OK',
            onPress: () => setStep(2),
          },
        ]);
      } else {
        Alert.alert(t.error, response.message || t.tryAgain);
      }
    } catch (error) {
      console.error('❌ Send code error:', error);
      
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          t.networkError;
      
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 2: VERIFY CODE ====================
  const handleVerifyCode = async () => {
    const cleanCode = code.trim();

    // Validation
    if (!cleanCode) {
      Alert.alert(t.error, t.enterCode);
      return;
    }

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      Alert.alert(t.error, t.invalidCode);
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Verifying code:', cleanCode);

      const response = await api.verifyResetCode(email, cleanCode);

      console.log('✅ Response:', response);

      if (response.success) {
        Alert.alert(t.success, t.codeVerified, [
          {
            text: 'OK',
            onPress: () => setStep(3),
          },
        ]);
      } else {
        Alert.alert(t.error, response.message || t.tryAgain);
      }
    } catch (error) {
      console.error('❌ Verify code error:', error);
      
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          t.networkError;
      
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 3: RESET PASSWORD ====================
  const handleResetPassword = async () => {
    const cleanPassword = newPassword.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    // Validation
    if (!cleanPassword) {
      Alert.alert(t.error, t.enterPassword);
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert(t.error, t.shortPassword);
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      Alert.alert(t.error, t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Resetting password...');

      const response = await api.resetPassword(email, code, cleanPassword);

      console.log('✅ Response:', response);

      if (response.success) {
        Alert.alert(
          t.success,
          t.passwordChanged,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setEmail('');
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
                setStep(1);
                // Navigate to login
                navigation.navigate('Login');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(t.error, response.message || t.tryAgain);
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);
      
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          t.networkError;
      
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER STEP 1: EMAIL ====================
  const renderStep1 = () => (
    <>
      <Text style={[styles.stepTitle, { color: secondaryTextColor }]}>
        {t.subtitle}
      </Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="email-outline"
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
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        onPress={handleSendCode}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? [COLORS.gray, COLORS.gray] : COLORS.primaryGradient}
          style={styles.actionButton}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.actionButtonText}>{t.sendingCode}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="email-send" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{t.sendCodeButton}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  // ==================== RENDER STEP 2: VERIFY CODE ====================
  const renderStep2 = () => (
    <>
      <Text style={[styles.stepTitle, { color: secondaryTextColor }]}>
        {t.codeExpiresIn}
      </Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="shield-key"
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
              paddingHorizontal: 45,
              textAlign: 'center',
              fontSize: 24,
              letterSpacing: 8,
              fontWeight: 'bold',
            },
          ]}
          placeholder="000000"
          placeholderTextColor={placeholderColor}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        onPress={handleVerifyCode}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? [COLORS.gray, COLORS.gray] : COLORS.primaryGradient}
          style={styles.actionButton}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.actionButtonText}>{t.verifying}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{t.verifyCodeButton}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setCode('');
          handleSendCode();
        }}
        disabled={loading}
        style={styles.resendButton}
      >
        <Text style={[styles.resendText, { color: COLORS.primary }]}>
          {t.resendCode}
        </Text>
      </TouchableOpacity>
    </>
  );

  // ==================== RENDER STEP 3: NEW PASSWORD ====================
  const renderStep3 = () => (
    <>
      <Text style={[styles.stepTitle, { color: secondaryTextColor }]}>
        {t.enterPassword}
      </Text>

      {/* New Password */}
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
          placeholder={t.newPasswordPlaceholder}
          placeholderTextColor={placeholderColor}
          value={newPassword}
          onChangeText={setNewPassword}
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

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? [COLORS.gray, COLORS.gray] : COLORS.successGradient}
          style={styles.actionButton}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.actionButtonText}>{t.resetting}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="lock-reset" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{t.resetPasswordButton}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  // ==================== MAIN RENDER ====================
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

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: step >= s ? COLORS.primary : borderColor,
                    },
                  ]}
                />
              ))}
            </View>
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
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Back to Login */}
            <View style={styles.backContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.backText, { color: COLORS.primary }]}>
                  {t.backToLogin}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ==================== STYLES ====================
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
    width: wp('35%'),
    height: wp('35%'),
    maxWidth: 180,
    maxHeight: 180,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: hp('3%'),
  },
  progressDot: {
    width: 40,
    height: 6,
    borderRadius: 3,
  },
  stepTitle: {
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
  actionButton: {
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
  actionButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
  },
});