// screens/ForgotPasswordScreen.tsx
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

// ==================== TYPES ====================
const STEP_EMAIL = 'email';
const STEP_CODE = 'code';
const STEP_RESET_PASSWORD = 'resetPassword';

type Step = typeof STEP_EMAIL | typeof STEP_CODE | typeof STEP_RESET_PASSWORD;

// ==================== COLORS ====================
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

// ==================== TRANSLATIONS ====================
const translations = {
  ar: {
    title: 'استعادة كلمة المرور',
    subtitle: 'أدخل بياناتك للتحقق',
    namePlaceholder: 'الاسم الكامل',
    emailPlaceholder: 'البريد الإلكتروني',
    sendButton: 'إرسال الكود',
    codePlaceholder: 'أدخل الكود (6 أرقام)',
    verifyButton: 'تحقق',
    backToLogin: 'العودة لتسجيل الدخول',
    resendCode: 'إعادة إرسال الكود',
    error: 'خطأ',
    success: 'نجاح',
    newPasswordPlaceholder: 'كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    savePasswordButton: 'حفظ كلمة المرور',
    emailNotFound: 'البريد الإلكتروني غير مسجل',
    nameEmailMismatch: 'الاسم والبريد غير متطابقين',
    codeSent: 'تم إرسال الكود بنجاح',
    checkEmail: 'تحقق من بريدك الإلكتروني',
    invalidCode: 'الكود غير صحيح',
    codeExpired: 'انتهت صلاحية الكود',
    enterName: 'الرجاء إدخال الاسم',
    enterEmail: 'الرجاء إدخال البريد الإلكتروني',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordUpdated: 'تم تحديث كلمة المرور بنجاح',
    timerLabel: 'ينتهي خلال:',
    networkError: 'تحقق من اتصالك بالإنترنت',
    shortPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    emailSentTo: 'تم الإرسال إلى:',
    changeEmail: 'تغيير البيانات',
    invalidEmail: 'تنسيق البريد الإلكتروني غير صحيح',
    codeVerified: 'تم التحقق من الكود بنجاح!',
    passwordResetSuccess: 'تم تغيير كلمة المرور',
    returnToLogin: 'العودة لتسجيل الدخول',
  },
  en: {
    title: 'Password Recovery',
    subtitle: 'Enter your details to verify',
    namePlaceholder: 'Full Name',
    emailPlaceholder: 'Email Address',
    sendButton: 'Send Code',
    codePlaceholder: 'Enter code (6 digits)',
    verifyButton: 'Verify Code',
    backToLogin: 'Back to Login',
    resendCode: 'Resend Code',
    error: 'Error',
    success: 'Success',
    newPasswordPlaceholder: 'New Password',
    confirmPasswordPlaceholder: 'Confirm Password',
    savePasswordButton: 'Save Password',
    emailNotFound: 'Email not registered',
    nameEmailMismatch: 'Name and email do not match',
    codeSent: 'Code sent successfully',
    checkEmail: 'Check your email',
    invalidCode: 'Invalid code',
    codeExpired: 'Code expired',
    enterName: 'Please enter your name',
    enterEmail: 'Please enter email',
    passwordMismatch: 'Passwords do not match',
    passwordUpdated: 'Password updated successfully',
    timerLabel: 'Expires in:',
    networkError: 'Check your internet connection',
    shortPassword: 'Password must be at least 6 characters',
    emailSentTo: 'Sent to:',
    changeEmail: 'Change Details',
    invalidEmail: 'Invalid email format',
    codeVerified: 'Code verified successfully!',
    passwordResetSuccess: 'Password changed successfully',
    returnToLogin: 'Return to Login',
  },
} as const;

// ==================== MAIN COMPONENT ====================
export default function ForgotPasswordScreen({ navigation }: any) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();
  
  // State Management
  const [step, setStep] = useState<Step>(STEP_EMAIL);
  const [name, setName] = useState(''); // ✅ إضافة حقل الاسم
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userKey, setUserKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Translation & Theme
  const t = translations[language as keyof typeof translations];
  const isRTL = language === 'ar';

  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const secondaryTextColor = isDark ? COLORS.lightGray : COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;

  // ==================== EFFECTS ====================
  
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
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && step === STEP_CODE && generatedCode) {
      setIsCodeExpired(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer, step, generatedCode]);

  // ==================== HELPER FUNCTIONS ====================
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ==================== HANDLERS ====================
  
  /**
   * ✅ إرسال كود التحقق بعد التحقق من الاسم والبريد معاً
   */
  const handleSendCode = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ✅ Validation: التحقق من الاسم
    if (!cleanName) {
      Alert.alert(t.error, t.enterName);
      return;
    }

    // ✅ Validation: التحقق من البريد
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
      console.log('🔍 Searching for user with email:', cleanEmail);
      
      // ✅ البحث عن المستخدم بالبريد الإلكتروني
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, orderByChild('email'), equalTo(cleanEmail));
      const snapshot = await get(userQuery);

      if (!snapshot.exists()) {
        console.log('❌ Email not found');
        Alert.alert(t.error, t.emailNotFound);
        setLoading(false);
        return;
      }
interface UserData {
  uid: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin?: string;
  age?: number;
  weight?: number;
  height?: number;
  waterIntake?: number;
  habits?: any[];
}
      // ✅ التحقق من تطابق الاسم
      const userData = snapshot.val();
      const userKeys = Object.keys(userData);
      
       let matchedUserKey: string | null = null;
      let matchedUserData: any = null;

      for (const key of userKeys) {
        const user = userData[key];
        console.log('Checking user:', {
          key,
          userName: user.name,
          inputName: cleanName,
          userEmail: user.email
        });

        // ✅ التحقق من تطابق الاسم (case insensitive)
        if (user.name && user.name.toLowerCase().trim() === cleanName.toLowerCase()) {
          matchedUserKey = key;
          matchedUserData = user;
          break;
        }
      }

      if (!matchedUserKey || !matchedUserData) {
        console.log('❌ Name and email do not match');
        Alert.alert(
          t.error, 
          t.nameEmailMismatch,
          [
            { text: 'OK' },
            {
              text: isRTL ? 'مساعدة' : 'Help',
              onPress: () => {
                Alert.alert(
                  isRTL ? 'نصيحة' : 'Hint',
                  isRTL 
                    ? 'تأكد من إدخال الاسم الكامل كما هو مسجل في حسابك'
                    : 'Make sure to enter your full name exactly as registered'
                );
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      console.log('✅ User found and verified, key:', matchedUserKey);
      setUserKey(matchedUserKey);

      // ✅ توليد كود عشوائي من 6 أرقام
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      console.log('🔐 Generated verification code:', newCode);

      // ✅ إرسال البريد الإلكتروني
      console.log('📧 Sending email to:', cleanEmail);
      const result = await sendVerificationEmail(cleanEmail, newCode);

      if (result.success) {
        console.log('✅ Email sent successfully');
        
        // في وضع التطوير
        if (result.devMode) {
          Alert.alert(
            t.success, 
            `${t.codeSent}\n\n⚠️ وضع التطوير\nالكود: ${newCode}\n\n${t.checkEmail}`,
            [{ 
              text: 'OK', 
              onPress: () => {
                setStep(STEP_CODE);
                setTimer(120);
                setIsCodeExpired(false);
              }
            }]
          );
        } else {
          // الوضع الحقيقي
          Alert.alert(
            t.success, 
            `${t.codeSent}\n${t.checkEmail}`,
            [{ 
              text: 'OK', 
              onPress: () => {
                setStep(STEP_CODE);
                setTimer(120);
                setIsCodeExpired(false);
              }
            }]
          );
        }
      } else {
        console.log('❌ Email send failed:', result.error);
        Alert.alert(t.error, result.error || t.networkError);
      }
    } catch (error) {
      console.error('❌ Error in handleSendCode:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(t.error, `${t.networkError}\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * التحقق من الكود المدخل
   */
  const handleVerifyCode = () => {
    console.log('🔍 Verifying code...');
    
    if (isCodeExpired) {
      Alert.alert(t.error, t.codeExpired);
      return;
    }

    if (!code.trim()) {
      Alert.alert(t.error, isRTL ? 'الرجاء إدخال الكود' : 'Please enter the code');
      return;
    }

    if (code.trim() === generatedCode) {
      console.log('✅ Code verified successfully');
      Alert.alert(
        t.success, 
        t.codeVerified,
        [{ 
          text: 'OK', 
          onPress: () => setStep(STEP_RESET_PASSWORD)
        }]
      );
    } else {
      console.log('❌ Invalid code');
      Alert.alert(t.error, t.invalidCode);
    }
  };

  /**
   * حفظ كلمة المرور الجديدة في Firebase
   */
  const handleSaveNewPassword = async () => {
    console.log('💾 Saving new password...');
    
    if (newPassword.length < 6) {
      Alert.alert(t.error, t.shortPassword);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert(t.error, t.passwordMismatch);
      return;
    }

    if (!userKey) {
      Alert.alert(t.error, 'User key not found');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Updating password for user:', userKey);
      const userRef = ref(db, `users/${userKey}`);
      await update(userRef, { 
        password: newPassword 
      });
      
      console.log('✅ Password updated successfully');
      
      Alert.alert(
        t.success, 
        t.passwordResetSuccess,
        [{ 
          text: t.returnToLogin, 
          onPress: () => {
            // Reset all fields
            setStep(STEP_EMAIL);
            setName('');
            setEmail('');
            setCode('');
            setGeneratedCode('');
            setNewPassword('');
            setConfirmPassword('');
            setUserKey('');
            setTimer(0);
            setIsCodeExpired(false);
            
            navigation.navigate('Login');
          }
        }]
      );
    } catch (error) {
      console.error('❌ Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(t.error, `${t.networkError}\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * العودة لشاشة تسجيل الدخول
   */
  const handleBackToLogin = () => {
    setStep(STEP_EMAIL);
    setName('');
    setEmail('');
    setCode('');
    setGeneratedCode('');
    setNewPassword('');
    setConfirmPassword('');
    setUserKey('');
    setTimer(0);
    setIsCodeExpired(false);
    navigation.goBack();
  };

  /**
   * تغيير البيانات (العودة للخطوة الأولى)
   */
  const handleChangeData = () => {
    setStep(STEP_EMAIL);
    setCode('');
    setGeneratedCode('');
    setTimer(0);
    setIsCodeExpired(false);
  };

  // ==================== RENDER ====================
  
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
          {/* ==================== HEADER ==================== */}
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

          {/* ==================== MAIN CARD ==================== */}
          <Animated.View 
            style={[
              styles.card, 
              { 
                backgroundColor: cardColor, 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <LinearGradient colors={[...COLORS.primaryGradient]} style={styles.cardHeader}>
              <MaterialCommunityIcons name="lock-reset" size={wp('7%')} color={COLORS.white} />
              <Text style={styles.cardHeaderText}>{t.title}</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              
              {/* ==================== STEP 1: NAME & EMAIL ==================== */}
              {step === STEP_EMAIL && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                    {t.subtitle}
                  </Text>
                  
                  {/* ✅ Name Input */}
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons 
                      name="account" 
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
                      placeholder={t.namePlaceholder}
                      placeholderTextColor={secondaryTextColor}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!loading}
                    />
                  </View>

                  {/* ✅ Email Input */}
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

              {/* ==================== STEP 2: VERIFY CODE ==================== */}
              {step === STEP_CODE && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                    {t.emailSentTo}
                  </Text>
                  <Text style={[styles.emailDisplay, { color: textColor }]}>
                    {name}
                  </Text>
                  <Text style={[styles.emailDisplay, { color: COLORS.primary, fontSize: wp('3.5%') }]}>
                    {email}
                  </Text>
                  
                  {/* Timer */}
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

                  {/* Code Input */}
                  <TextInput
                    style={[
                      styles.codeInput, 
                      { 
                        backgroundColor: inputColor, 
                        color: textColor, 
                        borderColor: isCodeExpired ? COLORS.danger : COLORS.primary,
                        borderWidth: 2
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

                  {/* Verify Button */}
                  <TouchableOpacity onPress={handleVerifyCode} disabled={isCodeExpired}>
                    <LinearGradient 
                      colors={isCodeExpired ? [COLORS.gray, COLORS.gray] : [...COLORS.successGradient]} 
                      style={styles.actionButton}
                    >
                      <MaterialCommunityIcons name="check-circle" size={wp('5%')} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>{t.verifyButton}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend & Change Data */}
                  <TouchableOpacity onPress={handleSendCode} style={styles.resendButton}>
                    <Text style={[styles.linkText, { color: COLORS.primary }]}>
                      {t.resendCode}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={handleChangeData} style={styles.changeEmailButton}>
                    <Text style={[styles.linkText, { color: secondaryTextColor }]}>
                      {t.changeEmail}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ==================== STEP 3: RESET PASSWORD ==================== */}
              {step === STEP_RESET_PASSWORD && (
                <View>
                  <Text style={[styles.subtitle, { color: secondaryTextColor, marginBottom: hp('2%') }]}>
                    {isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                  </Text>
                  
                  {/* New Password */}
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

                  {/* Confirm Password */}
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
                          paddingRight: wp('13%'),
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      ]}
                      placeholder={t.confirmPasswordPlaceholder}
                      placeholderTextColor={secondaryTextColor}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                      style={[styles.eyeIcon, { [isRTL ? 'left' : 'right']: wp('4%') }]}
                    >
                      <MaterialCommunityIcons 
                        name={showConfirmPassword ? "eye-off" : "eye"} 
                        size={wp('5%')} 
                        color={secondaryTextColor} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Save Button */}
                  <TouchableOpacity onPress={handleSaveNewPassword} disabled={loading}>
                    <LinearGradient 
                      colors={loading ? [COLORS.gray, COLORS.gray] : [...COLORS.primaryGradient]} 
                      style={styles.actionButton}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="content-save" size={wp('5%')} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>{t.savePasswordButton}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleBackToLogin} style={styles.resendButton}>
                    <Text style={[styles.linkText, { color: secondaryTextColor }]}>
                      {t.backToLogin}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
            </View>
          </Animated.View>
        </ScrollView>
        
        {/* ==================== BANNER AD ==================== */}
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

// ==================== STYLES ====================
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
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
    marginBottom: hp('0.5%') 
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
    fontSize: wp('7%'), 
    fontWeight: '900', 
    letterSpacing: wp('2%'), 
    marginBottom: hp('2.5%'),
    textAlign: 'center'
  },
  
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: hp('2%'), 
    borderRadius: wp('3%'), 
    gap: wp('2.5%'), 
    marginTop: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
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
    marginTop: hp('1%'),
    gap: 5,
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: 'rgba(99, 102, 241, 0.1)'
  },
  timerText: { fontSize: wp('4%'), fontWeight: 'bold' },
  
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    backgroundColor: 'transparent',
  }
});