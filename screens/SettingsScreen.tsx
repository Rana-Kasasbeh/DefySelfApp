import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const SettingsScreen = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user } = useUser();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const clearAllData = () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('تم', 'تم حذف جميع البيانات بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف البيانات');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 30,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    settingText: {
      fontSize: 16,
      color: theme.text,
    },
    settingSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    userInfo: {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    userInfoText: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 4,
    },
    dangerButton: {
      backgroundColor: theme.error,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    dangerButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    appInfo: {
      alignItems: 'center',
      marginTop: 30,
      padding: 20,
    },
    appName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
    },
    appVersion: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    appDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الإعدادات</Text>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المستخدم</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>العمر: {user.age} سنة</Text>
            <Text style={styles.userInfoText}>الوزن: {user.weight} كغ</Text>
            <Text style={styles.userInfoText}>
              هدف الماء اليومي: {user.dailyWaterGoal} مل
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المظهر واللغة</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>الوضع الليلي</Text>
            <Text style={styles.settingSubtext}>
              {isDark ? 'مفعل' : 'غير مفعل'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.surface, true: theme.primary }}
            thumbColor={isDark ? '#FFFFFF' : theme.textSecondary}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={toggleLanguage}>
          <View>
            <Text style={styles.settingText}>اللغة</Text>
            <Text style={styles.settingSubtext}>
              {i18n.language === 'ar' ? 'العربية' : 'English'}
            </Text>
          </View>
          <Text style={{ color: theme.primary }}>تغيير</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>البيانات</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>نسخ احتياطي</Text>
            <Text style={styles.settingSubtext}>حفظ البيانات في السحابة</Text>
          </View>
          <Text style={{ color: theme.primary }}>قريباً</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>استيراد البيانات</Text>
            <Text style={styles.settingSubtext}>استرداد البيانات من السحابة</Text>
          </View>
          <Text style={{ color: theme.primary }}>قريباً</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
        <Text style={styles.dangerButtonText}>حذف جميع البيانات</Text>
      </TouchableOpacity>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>تحدي نفسك</Text>
        <Text style={styles.appName}>Defy Self</Text>
        <Text style={styles.appVersion}>الإصدار 1.0.0</Text>
        <Text style={styles.appDescription}>
          تطبيق شامل لتطوير العادات الإيجابية وتعلم اللغة الإنجليزية
        </Text>
      </View>
    </View>
  );
};

export default SettingsScreen;
