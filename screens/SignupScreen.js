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
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import dataManager from '../services/FirebaseDataManager'; // ✅ هذا هو الجزء المهم جداً
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

  // ✅ أضفنا متغير لاسم المستخدم
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // ✅ التحقق من الاسم أيضاً
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول بما فيها اسم المستخدم');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      // 1. إنشاء الحساب (Auth)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. ✅ حفظ البيانات في قاعدة البيانات (Firestore)
      // هذه الخطوة هي التي كانت ناقصة في كودك
      await dataManager.registerNewUser(user.uid, {
        email: user.email,
        username: username,
        age: 0,
        weight: 0
      });

      Alert.alert('تم بنجاح', 'تم إنشاء الحساب وحفظ البيانات!', [
        { text: 'ابدأ الرحلة', onPress: () => navigation.replace('Login') } // أو التوجيه لـ App مباشرة
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  // تنسيقات الألوان
  const inputStyle = [
    styles.input,
    {
      backgroundColor: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#1e293b',
      borderColor: dark ? '#334155' : '#e2e8f0',
    },
  ];
  const placeholderColor = dark ? '#94a3b8' : '#64748b';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: dark ? '#0f172a' : '#f8fafc' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={require('../assets/LOGO.png')} style={styles.logo} />

        <Text style={[styles.title, { color: dark ? '#f1f5f9' : '#1e293b' }]}>إنشاء حساب جديد</Text>
        <Text style={[styles.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>انضم إلينا وابدأ رحلتك</Text>

        <View style={styles.inputContainer}>
          {/* حقل اسم المستخدم */}
          <TextInput
            style={inputStyle}
            placeholder="اسم المستخدم"
            placeholderTextColor={placeholderColor}
            value={username}
            onChangeText={setUsername}
            textAlign="right"
          />

          <TextInput
            style={inputStyle}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={inputStyle}
            placeholder="كلمة المرور"
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TextInput
            style={inputStyle}
            placeholder="تأكيد كلمة المرور"
            placeholderTextColor={placeholderColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>إنشاء الحساب</Text>}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: dark ? '#60a5fa' : '#3b82f6' }]}>تسجيل الدخول</Text>
             </TouchableOpacity>
             <Text style={[styles.loginText, { color: dark ? '#94a3b8' : '#64748b' }]}> لديك حساب بالفعل؟ </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  inputContainer: { width: '100%', maxWidth: 400 },
  input: { width: '100%', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1 },
  signupButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 15 },
  disabledButton: { opacity: 0.6 },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  linkText: { fontSize: 16, fontWeight: '600' },
  loginText: { fontSize: 16 },
});