// screens/DefySelfIcons.js - 100% JAVASCRIPT - NO TYPESCRIPT
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

import AdsController from '../ads/AdsController';
import { useGlobal } from '../contexts/GlobalContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const AD_UNITS = {
  BANNER: __DEV__
    ? TestIds.BANNER
    : 'ca-app-pub-4514668400858247/4315625856',
};

export default function DefySelfIcons() {
  const { isDark, theme, toggleTheme, language, toggleLanguage } = useGlobal();

  const [imageKey, setImageKey] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [navigationCount, setNavigationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const scaleAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(1))
  ).current;
  const slideAnim = useRef(
    new Animated.Value(-Math.min(width * 0.85, 400))
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  const CARD_SIZE = Math.min(width * 0.35, 150);
  const ICON_SIZE = CARD_SIZE * 0.45;

  const indicators = [
    {
      id: 1,
      screenName: 'Water',
      imageLight: require('../images/water.png'),
      imageDark: require('../images/water.png'),
      color: '#06b6d4',
      label: 'Water',
      labelAr: 'الماء',
      gradient: ['#06b6d4', '#0891b2'],
    },
    {
      id: 2,
      screenName: 'Habits',
      imageLight: require('../images/HabitL.png'),
      imageDark: require('../images/HabitD.png'),
      color: '#8b5cf6',
      label: 'Habits',
      labelAr: 'العادات',
      gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
      id: 3,
      screenName: 'Language',
      imageLight: require('../images/ENLight.png'),
      imageDark: require('../images/HabitD.png'),
      color: '#10b981',
      label: 'Language',
      labelAr: 'اللغة',
      gradient: ['#10b981', '#059669'],
    },
  ];

  const currentTheme = theme;
  const textColor = currentTheme.text;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      AdsController.loadInterstitial();
      await loadUserData();
      await loadSettings();
    } catch (error) {
      console.error('❌ App initialization error:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'خطأ',
        language === 'en'
          ? 'Failed to initialize app. Please restart.'
          : 'فشل تهيئة التطبيق. يرجى إعادة التشغيل.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('📥 Loading user data...');
      const response = await api.getProfile();
      if (response.success) {
        setUserEmail(response.user.email);
        setUserName(response.user.name);
        console.log('✅ User data loaded:', response.user.email);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      if (error.message && error.message.includes('401')) {
        await handleLogout();
      }
    }
  };

  useEffect(() => {
    saveSettings();
  }, [notificationsEnabled, soundEnabled]);

  const loadSettings = async () => {
    try {
      const [savedNotifications, savedSound] = await Promise.all([
        AsyncStorage.getItem('notifications'),
        AsyncStorage.getItem('sound'),
      ]);
      if (savedNotifications)
        setNotificationsEnabled(savedNotifications === 'true');
      if (savedSound) setSoundEnabled(savedSound === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('notifications', notificationsEnabled.toString()),
        AsyncStorage.setItem('sound', soundEnabled.toString()),
      ]);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setImageKey((prev) => prev + 1);
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const onToggleTheme = async () => {
    try {
      await toggleTheme();
    } catch (e) {
      console.error(e);
    }
  };

  const onToggleLanguage = async () => {
    try {
      await toggleLanguage();
    } catch (e) {
      console.error(e);
    }
  };

  const openSettings = () => {
    setSettingsVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -Math.min(width * 0.85, 400),
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSettingsVisible(false));
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      AdsController.showAfterTaskCompletion('Logout');
      await api.logout();
      closeSettings();
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 300);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'خطأ',
        language === 'en' ? 'Logout failed' : 'فشل تسجيل الخروج'
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      language === 'en' ? '⚠️ Delete Account' : '⚠️ حذف الحساب',
      language === 'en'
        ? 'Are you sure you want to permanently delete your account?\n\n⚠️ This will:\n• Delete all your data\n• Remove your habits and progress\n• Delete your water tracking history\n• Remove your language learning progress\n• Permanently delete your account\n\n❌ This action CANNOT be undone!'
        : 'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟\n\n⚠️ سيؤدي هذا إلى:\n• حذف جميع بياناتك\n• إزالة عاداتك وتقدمك\n• حذف سجل شرب الماء\n• إزالة تقدم تعلم اللغة\n• حذف حسابك نهائياً\n\n❌ لا يمكن التراجع عن هذا الإجراء!',
      [
        {
          text: language === 'en' ? 'Cancel' : 'إلغاء',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Delete Forever' : 'حذف نهائياً',
          style: 'destructive',
          onPress: performAccountDeletion,
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      closeSettings();
      console.log('🗑️ Deleting account...');
      AdsController.showAfterTaskCompletion('AccountDeletion');
      const response = await api.deleteAccount();
      if (response.success) {
        console.log('✅ Account deleted successfully');
        Alert.alert(
          language === 'en' ? '✅ Account Deleted' : '✅ تم حذف الحساب',
          language === 'en'
            ? 'Your account and all data have been successfully deleted.\n\nThank you for using DefySelf!'
            : 'تم حذف حسابك وجميع بياناتك بنجاح.\n\nشكراً لاستخدامك DefySelf!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('❌ Account deletion error:', error);
      setIsDeleting(false);
      Alert.alert(
        language === 'en' ? 'Error' : 'خطأ',
        language === 'en'
          ? 'Failed to delete account. Please try again or contact support.'
          : 'فشل حذف الحساب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
      );
    }
  };

  const handleNotificationsToggle = async (v) => {
    setNotificationsEnabled(v);
    try {
      await AsyncStorage.setItem('notifications', v.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSoundToggle = async (v) => {
    setSoundEnabled(v);
    try {
      await AsyncStorage.setItem('sound', v.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleIndicatorPress = (index, screenName) => {
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 0.92,
        tension: 200,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 200,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const newCount = navigationCount + 1;
    setNavigationCount(newCount);

    const adShown = AdsController.showOnNavigation(screenName);

    if (adShown) {
      setTimeout(() => navigation.navigate(screenName), 500);
    } else {
      setTimeout(() => navigation.navigate(screenName), 150);
    }
  };

  if (isLoading || isDeleting) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: currentTheme.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, { color: textColor, marginTop: 20 }]}>
          {isDeleting
            ? language === 'en'
              ? 'Deleting account...'
              : 'جاري حذف الحساب...'
            : language === 'en'
            ? 'Loading...'
            : 'جاري التحميل...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme.background}
        />

        <View style={styles.header}>
          <View style={styles.rowHeader}>
            <TouchableOpacity
              onPress={openSettings}
              style={[
                styles.headerButton,
                { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog" size={22} color={textColor} />
            </TouchableOpacity>

            <View style={styles.languageThemeContainer}>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
                onPress={onToggleLanguage}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerText, { color: textColor }]}>
                  {language === 'en' ? 'AR' : 'EN'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
                onPress={onToggleTheme}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerText, { color: textColor }]}>
                  {isDark ? '☀️' : '🌙'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.logoSection}>
            <Image
              key={'logo-' + isDark + '-' + imageKey}
              source={
                isDark
                  ? require('../assets/New.png')
                  : require('../images/Nam2.png')
              }
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.cardsGrid}>
            {indicators.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handleIndicatorPress(index, item.screenName)}
                style={styles.cardTouchable}
              >
                <Animated.View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: item.color,
                      transform: [{ scale: scaleAnims[index] }],
                      width: CARD_SIZE,
                      height: CARD_SIZE,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardGradient,
                      { backgroundColor: item.color + '15' },
                    ]}
                  />

                  <View
                    style={[
                      styles.cardIconContainer,
                      { width: ICON_SIZE, height: ICON_SIZE },
                    ]}
                  >
                    <Image
                      key={item.id + '-' + isDark + '-' + imageKey}
                      source={isDark ? item.imageDark : item.imageLight}
                      style={styles.cardIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={[styles.cardLabel, { color: textColor }]}>
                    {language === 'en' ? item.label : item.labelAr}
                  </Text>

                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: item.color },
                    ]}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.footerCard,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.7)'
                  : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'rgba(148, 163, 184, 0.3)',
              },
            ]}
          >
            <Text style={[styles.footerText, { color: textColor }]}>
              {language === 'en' 
                ? '🌟 Challenge yourself to be better every day' 
                : '🌟 تحدى نفسك لتكون أفضل كل يوم'}
            </Text>
          </View>
        </View>

        <View style={styles.adContainer}>
          <BannerAd
            unitId={AD_UNITS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => console.log('✅ Banner ad loaded')}
            onAdFailedToLoad={(error) =>
              console.log('❌ Banner ad failed:', error)
            }
          />
        </View>
      </SafeAreaView>

      {settingsVisible && (
        <Modal
          visible={settingsVisible}
          transparent
          animationType="none"
          onRequestClose={closeSettings}
          statusBarTranslucent
        >
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={closeSettings}>
              <Animated.View
                style={[styles.overlay, { opacity: overlayOpacity }]}
              />
            </TouchableWithoutFeedback>

            <Animated.View
              style={[
                styles.settingsSidebar,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View
                style={[
                  styles.settingsHeader,
                  { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <Text
                  style={[styles.settingsTitle, { color: currentTheme.text }]}
                >
                  {language === 'en' ? '⚙️ Settings' : '⚙️ الإعدادات'}
                </Text>
                <TouchableOpacity onPress={closeSettings} style={styles.closeButton}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={currentTheme.text}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.settingsContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userEmoji}>👤</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: currentTheme.text }]}>
                      {userName || (language === 'en' ? 'Welcome!' : 'مرحباً!')}
                    </Text>
                    <Text style={[styles.userEmail, { color: currentTheme.text }]}>
                      {userEmail || 'user@defyself.com'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  ]}
                  onPress={onToggleTheme}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: isDark ? '#f59e0b' : '#8b5cf6' },
                      ]}
                    >
                      <Text style={styles.optionEmoji}>{isDark ? '☀️' : '🌙'}</Text>
                    </View>
                    <Text style={[styles.optionText, { color: currentTheme.text }]}>
                      {language === 'en' ? 'Theme' : 'المظهر'}
                    </Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={onToggleTheme}
                    trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  ]}
                  onPress={onToggleLanguage}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[styles.optionIcon, { backgroundColor: '#10b981' }]}
                    >
                      <Text style={styles.optionEmoji}>🌐</Text>
                    </View>
                    <Text style={[styles.optionText, { color: currentTheme.text }]}>
                      {language === 'en' ? 'Language' : 'اللغة'}
                    </Text>
                  </View>
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>
                      {language === 'en' ? 'EN' : 'AR'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View
                  style={[
                    styles.optionCard,
                    { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[styles.optionIcon, { backgroundColor: '#f59e0b' }]}
                    >
                      <Text style={styles.optionEmoji}>🔔</Text>
                    </View>
                    <Text style={[styles.optionText, { color: currentTheme.text }]}>
                      {language === 'en' ? 'Notifications' : 'الإشعارات'}
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationsToggle}
                    trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </View>

                <View
                  style={[
                    styles.optionCard,
                    { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[styles.optionIcon, { backgroundColor: '#8b5cf6' }]}
                    >
                      <Text style={styles.optionEmoji}>🔊</Text>
                    </View>
                    <Text style={[styles.optionText, { color: currentTheme.text }]}>
                      {language === 'en' ? 'Sound' : 'الصوت'}
                    </Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={handleSoundToggle}
                    trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                    thumbColor="#fff"
                  />
                </View>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                  ]}
                />

                <TouchableOpacity
                  style={[
                    styles.deleteAccountButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(239, 68, 68, 0.1)',
                    },
                  ]}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <View style={styles.deleteAccountContent}>
                    <View style={styles.deleteIcon}>
                      <MaterialCommunityIcons
                        name="delete-forever"
                        size={24}
                        color="#ef4444"
                      />
                    </View>
                    <View style={styles.deleteTextContainer}>
                      <Text style={styles.deleteAccountText}>
                        {language === 'en' ? 'Delete My Account' : 'حذف حسابي'}
                      </Text>
                      <Text style={styles.deleteAccountSubtext}>
                        {language === 'en'
                          ? 'Permanently delete all data'
                          : 'حذف جميع البيانات نهائياً'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#ef4444"
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <View style={styles.logoutIcon}>
                    <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                  </View>
                  <Text style={styles.logoutText}>
                    {language === 'en' ? 'Log Out' : 'تسجيل الخروج'}
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={24}
                    color="#f59e0b"
                  />
                </TouchableOpacity>

                <View style={{ height: hp('5%') }} />
              </ScrollView>

              <View style={styles.settingsFooter}>
                <Text style={[styles.versionText, { color: currentTheme.text }]}>
                  DefySelf v1.0.0
                </Text>
                <Text
                  style={[styles.versionSubtext, { color: currentTheme.text }]}
                >
                  {language === 'en' ? 'Made with ❤️' : 'صُنع بـ ❤️'}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },
  loadingText: { fontSize: 16, fontWeight: '600' },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    paddingTop: hp('5%'),
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageThemeContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
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
  headerText: { fontSize: 16, fontWeight: '600' },
  mainContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  logoImage: {
    width: wp('50%'),
    height: wp('50%'),
    maxWidth: 200,
    maxHeight: 200,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: wp('4%'),
    paddingHorizontal: wp('2%'),
  },
  cardTouchable: { marginBottom: hp('2%') },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: '100%',
    height: '100%',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
  },
  footerCard: {
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('6%'),
    borderRadius: 18,
    borderWidth: 1.5,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 5,
  },
  modalContainer: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  settingsSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(width * 0.85, 400),
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    paddingTop: hp('6%'),
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3%'),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: wp('4%'),
    borderRadius: 20,
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  userEmoji: { fontSize: 32 },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 13, opacity: 0.7, fontWeight: '600' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4%'),
    borderRadius: 18,
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  optionEmoji: { fontSize: 26 },
  optionText: { fontSize: 18, fontWeight: '700' },
  langBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  langBadgeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  divider: {
    height: 1,
    marginVertical: hp('2%'),
    opacity: 0.3,
  },
  deleteAccountButton: {
    borderRadius: 18,
    marginBottom: hp('1.5%'),
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    overflow: 'hidden',
  },
  deleteAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
  },
  deleteIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  deleteTextContainer: {
    flex: 1,
  },
  deleteAccountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 2,
  },
  deleteAccountSubtext: {
    fontSize: 12,
    color: '#ef4444',
    opacity: 0.7,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: wp('4%'),
    borderRadius: 18,
    marginTop: hp('1%'),
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  logoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#f59e0b',
    marginLeft: wp('3%'),
  },
  settingsFooter: {
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  versionText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  versionSubtext: { fontSize: 12, opacity: 0.6, fontWeight: '600' },
});