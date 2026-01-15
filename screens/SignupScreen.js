// screens/SignupScreen.js
import React, { useState, useContext } from 'react';
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
  Image,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { auth, db } from '../services/firebaseConfig';
import { ref, set } from 'firebase/database';
import { AppContext } from '../App';

export default function SignupScreen({ navigation }) {
  const scheme = useColorScheme();
  let dark = scheme === 'dark';
  
  try {
    const context = useContext(AppContext);
    if (context) dark = context.dark;
  } catch (e) {
    console.log('Using system theme');
  }

  // ✅ State Management
  const [name, setName] = useState(''); // ✅ إضافة حقل الاسم
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ التحقق من صحة البريد الإلكتروني
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ Handle Signup
  const handleSignup = async () => {
    console.log('🔐 Starting signup process...');

    // Validation
    if (!name.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الكامل');
      return;
    }

    if (!email.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('خطأ', 'تنسيق البريد الإلكتروني غير صحيح');
      return;
    }

    if (!password) {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      console.log('📧 Creating user with email:', cleanEmail);

      // 1️⃣ إنشاء حساب في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        cleanEmail, 
        password
      );
      const user = userCredential.user;
      console.log('✅ User created in Auth:', user.uid);

      // 2️⃣ حفظ بيانات المستخدم في Realtime Database
      // تشفير البريد الإلكتروني لاستخدامه كـ key
      const encodedEmail = cleanEmail
        .replace(/\./g, '_')
        .replace(/@/g, '_at_');

      const userRef = ref(db, `users/${encodedEmail}`);
      
      const userData = {
        uid: user.uid,
        name: cleanName, // ✅ حفظ الاسم
        email: cleanEmail,
        password: password, // ⚠️ في الإنتاج، لا تحفظ كلمة المرور هنا
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        // بيانات إضافية
        age: 0,
        weight: 0,
        height: 0,
        waterIntake: 0,
        habits: [],
      };

      await set(userRef, userData);
      console.log('✅ User data saved to database');

      Alert.alert(
        'تم بنجاح! 🎉',
        'تم إنشاء حسابك بنجاح',
        [
          {
            text: 'تسجيل الدخول',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'تنسيق البريد الإلكتروني غير صحيح';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور ضعيفة جداً';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'تحقق من اتصالك بالإنترنت';
      }

      Alert.alert('خطأ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Colors
  const bgColor = dark ? '#0f172a' : '#f8fafc';
  const cardColor = dark ? '#1e293b' : '#ffffff';
  const textColor = dark ? '#f1f5f9' : '#1e293b';
  const secondaryTextColor = dark ? '#94a3b8' : '#64748b';
  const inputColor = dark ? '#1e293b' : '#ffffff';
  const borderColor = dark ? '#334155' : '#e2e8f0';
  const placeholderColor = dark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/LOGO.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>
            إنشاء حساب جديد
          </Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            انضم إلينا وابدأ رحلتك
          </Text>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardColor,
                shadowColor: dark ? '#000' : '#64748b',
              },
            ]}
          >
            {/* ✅ Name Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
                size={wp('5%')}
                color={secondaryTextColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                  },
                ]}
                placeholder="الاسم الكامل"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textAlign="right"
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="at"
                size={wp('5%')}
                color={secondaryTextColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                  },
                ]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={wp('5%')}
                color={secondaryTextColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                  },
                ]}
                placeholder="كلمة المرور"
                placeholderTextColor={placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textAlign="right"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={wp('5%')}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={wp('5%')}
                color={secondaryTextColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputColor,
                    color: textColor,
                    borderColor,
                  },
                ]}
                placeholder="تأكيد كلمة المرور"
                placeholderTextColor={placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textAlign="right"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={wp('5%')}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={styles.signupButtonContainer}
            >
              <LinearGradient
                colors={
                  loading
                    ? ['#64748b', '#64748b']
                    : ['#10b981', '#059669']
                }
                style={styles.signupButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="account-plus"
                      size={wp('5%')}
                      color="#fff"
                    />
                    <Text style={styles.signupButtonText}>إنشاء الحساب</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
              >
                <Text
                  style={[
                    styles.linkText,
                    { color: dark ? '#60a5fa' : '#3b82f6' },
                  ]}
                >
                  تسجيل الدخول
                </Text>
              </TouchableOpacity>
              <Text style={[styles.loginText, { color: secondaryTextColor }]}>
                لديك حساب بالفعل؟
              </Text>
            </View>
          </View>
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
    alignItems: 'center',
    padding: wp('5%'),
    paddingTop: hp('8%'),
  },
  logoContainer: {
    marginBottom: hp('3%'),
  },
  logo: {
    width: wp('35%'),
    height: wp('35%'),
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: '900',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp('4%'),
    marginBottom: hp('4%'),
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 450,
    borderRadius: wp('4%'),
    padding: wp('6%'),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: hp('2%'),
  },
  inputIcon: {
    position: 'absolute',
    top: hp('2%'),
    right: wp('4%'),
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('4%'),
    zIndex: 1,
  },
  input: {
    width: '100%',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('13%'),
    borderRadius: wp('3%'),
    fontSize: wp('4%'),
    fontWeight: '600',
    borderWidth: 2,
  },
  signupButtonContainer: {
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    borderRadius: wp('3%'),
    gap: wp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: '900',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: hp('1%'),
  },
  linkText: {
    fontSize: wp('4%'),
    fontWeight: '800',
  },
  loginText: {
    fontSize: wp('4%'),
  },
});