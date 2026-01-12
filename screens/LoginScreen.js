import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { useGlobal } from '../contexts/GlobalContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function LoginScreen({ navigation }) {
  const { isDark, toggleTheme, language, toggleLanguage, setUser } = useGlobal(); // أضفنا setUser
  const dark = isDark; 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // التحقق من المدخلات
    if (!email.trim() || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      console.log('🔑 جارٍ تسجيل الدخول للمستخدم:', email);
      
      // التحقق من التطابق مع Firebase Authentication
      // بمجرد نجاح هذه الخطوة، يعني أن الإيميل والباسورد صحيحين
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      console.log('✅ تم تسجيل الدخول بنجاح للمستخدم:', user.uid);
      console.log('📧 البريد الإلكتروني:', user.email);

      // جلب بيانات المستخدم من Firestore وحفظها في GlobalContext
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ بيانات المستخدم من Firestore:', userData);
          
          // حفظ بيانات المستخدم في GlobalContext
          await setUser({
            uid: user.uid,
            username: userData.username || userData.name || 'User',
            email: user.email || '',
            age: userData.age || 0,
            weight: userData.weight || 0,
            dailyWaterGoal: userData.dailyWaterGoal || 2000,
            createdAt: userData.createdAt || new Date().toISOString(),
          });
          
          console.log('✅ تم حفظ بيانات المستخدم في GlobalContext');
        } else {
          // إذا لم توجد بيانات في Firestore، أنشئ بيانات افتراضية
          console.log('⚠️ لا توجد بيانات في Firestore، إنشاء بيانات افتراضية');
          
          await setUser({
            uid: user.uid,
            username: user.email?.split('@')[0] || 'User',
            email: user.email || '',
            age: 0,
            weight: 0,
            dailyWaterGoal: 2000,
            createdAt: new Date().toISOString(),
          });
        }

        // الانتقال للصفحة الرئيسية
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        
      } catch (dbError) {
        console.error('⚠️ خطأ في جلب بيانات المستخدم:', dbError);
        
        // حتى لو فشل جلب البيانات، أنشئ بيانات افتراضية
        await setUser({
          uid: user.uid,
          username: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          age: 0,
          weight: 0,
          dailyWaterGoal: 2000,
          createdAt: new Date().toISOString(),
        });
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }

    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error.code);
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      
      // رسائل خطأ مخصصة حسب نوع المشكلة
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'البريد الإلكتروني غير صحيح';
          break;
        case 'auth/user-not-found':
          errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
          break;
        case 'auth/wrong-password':
          errorMessage = 'كلمة المرور غير صحيحة';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'فشل الاتصال بالشبكة، تحقق من الإنترنت';
          break;
        case 'auth/user-disabled':
          errorMessage = 'هذا الحساب معطل، يرجى التواصل مع الدعم';
          break;
        default:
          errorMessage = `حدث خطأ: ${error.message}`;
      }
      
      Alert.alert('خطأ في تسجيل الدخول', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: dark ? '#0f172a' : '#f8fafc' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../assets/LOGO.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: dark ? '#f1f5f9' : '#1e293b' }]}>
          مرحباً بعودتك
        </Text>
        
        <Text style={[styles.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>
          سجل دخولك للمتابعة
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: dark ? '#1e293b' : '#ffffff',
                color: dark ? '#f1f5f9' : '#1e293b',
                borderColor: dark ? '#334155' : '#e2e8f0',
              },
            ]}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={dark ? '#94a3b8' : '#64748b'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
            editable={!loading}
          />

          <View style={{ position: 'relative' }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: dark ? '#1e293b' : '#ffffff',
                  color: dark ? '#f1f5f9' : '#1e293b',
                  borderColor: dark ? '#334155' : '#e2e8f0',
                },
              ]}
              placeholder="كلمة المرور"
              placeholderTextColor={dark ? '#94a3b8' : '#64748b'}
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
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color={dark ? '#94a3b8' : '#64748b'} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={loading}>
              <Text style={[styles.linkText, { color: dark ? '#60a5fa' : '#3b82f6', fontSize: 14 }]}>
                نسيت كلمة المرور؟
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Signup')}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: dark ? '#60a5fa' : '#3b82f6' }]}>
                إنشاء حساب
              </Text>
            </TouchableOpacity>
            <Text style={[styles.signupText, { color: dark ? '#94a3b8' : '#64748b' }]}>
              ليس لديك حساب؟
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  signupText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});