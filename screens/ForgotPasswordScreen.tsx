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
  Animated,
} from 'react-native';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useGlobal } from '../contexts/GlobalContext';
import { db } from '../services/firebaseConfig';
import { sendVerificationEmail } from '../services/EmailService';
import { AdUnits } from '../ads/AdConfig';

const STEP_EMAIL = 'email';
const STEP_CODE = 'code';
const STEP_RESET_PASSWORD = 'resetPassword';

type Step = typeof STEP_EMAIL | typeof STEP_CODE | typeof STEP_RESET_PASSWORD;

// ✅ إصلاح: تعريف الألوان بشكل صحيح
const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6', '#a855f7'] as const,
  success: '#10b981',
  successGradient: ['#10b981', '#059669'] as const,
  danger: '#ef4444',
  dark: '#1f2937',
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  darkText: '#f1f5f9',
  darkBorder: '#334155',
  light: '#f8fafc',
  white: '#ffffff',
  gray: '#64748b',
  lightGray: '#94a3b8',
} as const;

const translations = {
  ar: {
    title: 'استعادة كلمة المرور',
    subtitle: 'أدخل بريدك الإلكتروني',
    emailPlaceholder: 'البريد الإلكتروني',
    sendButton: 'إرسال الكود',
    codePlaceholder: 'أدخل الكود (6 أرقام)',
    verifyButton: 'تحقق',
    backToLogin: 'العودة',
    resendCode: 'إعادة إرسال',
    error: 'خطأ',
    success: 'نجاح',
    newPasswordPlaceholder: 'كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    savePasswordButton: 'حفظ',
    emailNotFound: 'البريد غير مسجل',
    codeSent: 'تم إرسال الكود',
    checkEmail: 'تحقق من بريدك',
    invalidCode: 'الكود غير صحيح',
    codeExpired: 'انتهت الصلاحية',
    enterEmail: 'أدخل البريد',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordUpdated: 'تم التحديث',
    timerLabel: 'ينتهي خلال:',
    networkError: 'تحقق من الإنترنت',
    shortPassword: 'كلمة المرور قصيرة',
    emailSentTo: 'تم الإرسال إلى:',
    changeEmail: 'تغيير البريد',
  },
  en: {
    title: 'Password Recovery',
    subtitle: 'Enter your email',
    emailPlaceholder: 'Email Address',
    sendButton: 'Send Code',
    codePlaceholder: 'Enter code (6 digits)',
    verifyButton: 'Verify',
    backToLogin: 'Back',
    resendCode: 'Resend',
    error: 'Error',
    success: 'Success',
    newPasswordPlaceholder: 'New Password',
    confirmPasswordPlaceholder: 'Confirm Password',
    savePasswordButton: 'Save',
    emailNotFound: 'Email not found',
    codeSent: 'Code sent',
    checkEmail: 'Check your email',
    invalidCode: 'Invalid code',
    codeExpired: 'Code expired',
    enterEmail: 'Enter email',
    passwordMismatch: 'Passwords do not match',
    passwordUpdated: 'Password updated',
    timerLabel: 'Expires in:',
    networkError: 'Check internet',
    shortPassword: 'Password too short',
    emailSentTo: 'Sent to:',
    changeEmail: 'Change Email',
  },
} as const;

export default function ForgotPasswordScreen({ navigation }: any) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();
  
  const [step, setStep] = useState<Step>(STEP_EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userKey, setUserKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const t = translations[language as keyof typeof translations] || translations.en;
  const isRTL = language === 'ar';

  const backgroundColor = isDark ? COLORS.darkBg : COLORS.light;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const secondaryTextColor = isDark ? COLORS.lightGray : COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [step, isDark]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === STEP_CODE && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && step === STEP_CODE) {
      setIsCodeExpired(true);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(t.error, t.enterEmail);
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      Alert.alert(t.error, isRTL ? 'تنسيق البريد غير صحيح' : 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, orderByChild('email'), equalTo(cleanEmail));
      const snapshot = await get(userQuery);

      if (!snapshot.exists()) {
        Alert.alert(t.error, t.emailNotFound);
        setLoading(false);
        return;
      }

      const userData = snapshot.val();
      const key = Object.keys(userData)[0];
      setUserKey(key);

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);

      const result = await sendVerificationEmail(cleanEmail, newCode);

      if (result.success) {
        Alert.alert(t.success, `${t.codeSent}\n${t.checkEmail}`);
        setStep(STEP_CODE);
        setTimer(120);
        setIsCodeExpired(false);
      } else {
        Alert.alert(t.error, result.error || t.networkError);
      }
    } catch (error) {
      Alert.alert(t.error, t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (isCodeExpired) {
      Alert.alert(t.error, t.codeExpired);
      return;
    }
    if (code.trim() === generatedCode) {
      Alert.alert(t.success, isRTL ? 'تم التحقق!' : 'Verified!');
      setStep(STEP_RESET_PASSWORD);
    } else {
      Alert.alert(t.error, t.invalidCode);
    }
  };

  const handleSaveNewPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(t.error, t.shortPassword);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.error, t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${userKey}`);
      await update(userRef, { password: newPassword });
      Alert.alert(t.success, t.passwordUpdated, [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert(t.error, t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep(STEP_EMAIL);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    navigation.goBack();
  };

  return (
    <LinearGradient 
      colors={isDark ? [COLORS.darkBg, COLORS.darkCard] : [COLORS.light, COLORS.white]} 
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBackToLogin} 
              style={[styles.headerButton, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}
            >
              <MaterialCommunityIcons 
                name={isRTL ? "arrow-right" : "arrow-left"} 
                size={wp('5%')} 
                color={textColor} 
              />
            </TouchableOpacity>

            <View style={styles.languageThemeContainer}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} 
                onPress={toggleLanguage}
              >
                <Text style={[styles.headerText, { color: textColor }]}>
                  {language === 'en' ? 'AR' : 'EN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} 
                onPress={toggleTheme}
              >
                <MaterialCommunityIcons 
                  name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} 
                  size={wp('5%')} 
                  color={textColor} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Card */}
          <Animated.View 
            style={[
              styles.card, 
              { backgroundColor: cardColor, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* ✅ إصلاح: استخدام spread operator للـ gradient */}
            <LinearGradient colors={[...COLORS.primaryGradient]} style={styles.cardHeader}>
              <MaterialCommunityIcons name="lock-reset" size={wp('7%')} color={COLORS.white} />
              <Text style={styles.cardHeaderText}>{t.title}</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              {/* STEP 1: EMAIL */}
              {step === STEP_EMAIL && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor }]}>{t.subtitle}</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons 
                      name="at" 
                      size={wp('5%')} 
                      color={secondaryTextColor} 
                      style={[styles.inputIcon, { [isRTL ? 'right' : 'left']: wp('4%') }]} 
                    />
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: inputColor, 
                          color: textColor, 
                          borderColor, 
                          [isRTL ? 'paddingRight' : 'paddingLeft']: wp('13%'),
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      ]}
                      placeholder={t.emailPlaceholder}
                      placeholderTextColor={secondaryTextColor}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                  <TouchableOpacity onPress={handleSendCode} disabled={loading}>
                    {/* ✅ إصلاح */}
                    <LinearGradient 
                      colors={loading ? [COLORS.gray, COLORS.gray] : [...COLORS.primaryGradient]} 
                      style={styles.actionButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="send" size={wp('5%')} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>{t.sendButton}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: VERIFY CODE */}
              {step === STEP_CODE && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor }]}>{t.emailSentTo}</Text>
                  <Text style={[styles.emailDisplay, { color: textColor }]}>{email}</Text>
                  
                  <View style={styles.timerContainer}>
                    <MaterialCommunityIcons 
                      name="clock-outline" 
                      size={wp('5%')} 
                      color={isCodeExpired ? COLORS.danger : COLORS.primary} 
                    />
                    <Text style={[styles.timerText, { color: isCodeExpired ? COLORS.danger : textColor }]}>
                      {isCodeExpired ? t.codeExpired : `${t.timerLabel} ${formatTime(timer)}`}
                    </Text>
                  </View>

                  <TextInput
                    style={[
                      styles.codeInput, 
                      { 
                        backgroundColor: inputColor, 
                        color: textColor, 
                        borderColor: isCodeExpired ? COLORS.danger : borderColor 
                      }
                    ]}
                    placeholder={t.codePlaceholder}
                    placeholderTextColor={secondaryTextColor}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                    editable={!isCodeExpired}
                  />

                  <TouchableOpacity onPress={handleVerifyCode} disabled={isCodeExpired}>
                    {/* ✅ إصلاح */}
                    <LinearGradient 
                      colors={isCodeExpired ? [COLORS.gray, COLORS.gray] : [...COLORS.successGradient]} 
                      style={styles.actionButton}
                    >
                      <MaterialCommunityIcons name="check-circle" size={wp('5%')} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>{t.verifyButton}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSendCode} style={styles.resendButton}>
                    <Text style={[styles.linkText, { color: COLORS.primary }]}>{t.resendCode}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => setStep(STEP_EMAIL)} style={styles.changeEmailButton}>
                    <Text style={[styles.linkText, { color: secondaryTextColor }]}>{t.changeEmail}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: RESET PASSWORD */}
              {step === STEP_RESET_PASSWORD && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor, marginBottom: hp('1%') }]}>
                    {isRTL ? 'كلمة المرور الجديدة' : 'New password'}
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons 
                      name="lock-outline" 
                      size={wp('5%')} 
                      color={secondaryTextColor} 
                      style={[styles.inputIcon, { [isRTL ? 'right' : 'left']: wp('4%') }]} 
                    />
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: inputColor, 
                          color: textColor, 
                          borderColor, 
                          [isRTL ? 'paddingRight' : 'paddingLeft']: wp('13%'),
                          paddingRight: wp('13%'),
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      ]}
                      placeholder={t.newPasswordPlaceholder}
                      placeholderTextColor={secondaryTextColor}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)} 
                      style={[styles.eyeIcon, { [isRTL ? 'left' : 'right']: wp('4%') }]}
                    >
                      <MaterialCommunityIcons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={wp('5%')} 
                        color={secondaryTextColor} 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons 
                      name="lock-check-outline" 
                      size={wp('5%')} 
                      color={secondaryTextColor} 
                      style={[styles.inputIcon, { [isRTL ? 'right' : 'left']: wp('4%') }]} 
                    />
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: inputColor, 
                          color: textColor, 
                          borderColor, 
                          [isRTL ? 'paddingRight' : 'paddingLeft']: wp('13%'),
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      ]}
                      placeholder={t.confirmPasswordPlaceholder}
                      placeholderTextColor={secondaryTextColor}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                  
                  <TouchableOpacity onPress={handleSaveNewPassword} disabled={loading}>
                    {/* ✅ إصلاح */}
                    <LinearGradient colors={[...COLORS.primaryGradient]} style={styles.actionButton}>
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.actionButtonText}>{t.savePasswordButton}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleBackToLogin} style={styles.resendButton}>
                    <Text style={[styles.linkText, { color: secondaryTextColor }]}>{t.backToLogin}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
        
        {/* Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAd
            unitId={AdUnits.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: hp('2%') },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: wp('4%'), 
    paddingTop: hp('6%'), 
    marginBottom: hp('2%') 
  },
  languageThemeContainer: { flexDirection: 'row', gap: wp('2.5%') },
  headerButton: { 
    width: wp('10%'), 
    height: wp('10%'), 
    borderRadius: wp('3%'), 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerText: { fontSize: wp('3.8%'), fontWeight: '800' },
  card: { 
    marginHorizontal: wp('4%'), 
    borderRadius: wp('5%'), 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    elevation: 8 
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: hp('2.5%'), 
    paddingHorizontal: wp('5%'), 
    gap: wp('3%') 
  },
  cardHeaderText: { 
    fontSize: wp('5%'), 
    fontWeight: '900', 
    color: COLORS.white, 
    flex: 1 
  },
  cardBody: { padding: wp('6%') },
  subtitle: { 
    fontSize: wp('3.8%'), 
    marginBottom: hp('2.5%'), 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  emailDisplay: { 
    fontSize: wp('4%'), 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: hp('1.5%') 
  },
  inputContainer: { position: 'relative', marginBottom: hp('2%') },
  inputIcon: { position: 'absolute', top: hp('2%'), zIndex: 1 },
  eyeIcon: { position: 'absolute', top: hp('2%'), zIndex: 1 },
  input: { 
    paddingVertical: hp('2%'), 
    paddingHorizontal: wp('4%'), 
    borderRadius: wp('3%'), 
    borderWidth: 2, 
    fontSize: wp('4%'), 
    fontWeight: '600' 
  },
  codeInput: { 
    paddingVertical: hp('2.5%'), 
    paddingHorizontal: wp('4%'), 
    borderRadius: wp('3%'), 
    borderWidth: 2, 
    fontSize: wp('7%'), 
    fontWeight: '900', 
    letterSpacing: wp('2%'), 
    marginBottom: hp('2.5%') 
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: hp('2%'), 
    borderRadius: wp('3%'), 
    gap: wp('2.5%'), 
    marginTop: hp('1%') 
  },
  actionButtonText: { 
    color: COLORS.white, 
    fontSize: wp('4.2%'), 
    fontWeight: '900' 
  },
  resendButton: { marginTop: hp('2%'), alignItems: 'center' },
  changeEmailButton: { marginTop: hp('1.5%'), alignItems: 'center' },
  linkText: { fontSize: wp('4%'), fontWeight: '800' },
  timerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: hp('2%'), 
    gap: 5 
  },
  timerText: { fontSize: wp('4%'), fontWeight: 'bold' },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    backgroundColor: 'transparent',
  }
});