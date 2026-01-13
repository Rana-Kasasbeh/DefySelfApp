// screens/WaterTracker.js
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Platform,
  Dimensions,
  Easing,
  Switch,
  Modal,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Notifications from 'expo-notifications';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useGlobal } from '../contexts/GlobalContext';
import { AdUnits } from '../ads/AdConfig';
import { AdsController } from '../ads/AdsController';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== TRANSLATIONS ====================
const translations = {
  ar: {
    title: 'متتبع شرب الماء',
    selectWeight: 'اختر وزنك (كغ)',
    choose: 'اختر...',
    activityLevel: 'مستوى النشاط',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    veryHigh: 'مرتفع جدًا',
    climate: 'المناخ',
    normal: 'عادي',
    hot: 'حار',
    cold: 'بارد',
    next: 'ابدأ التتبع',
    tapToAdd: 'اضغط لإضافة كوب ماء',
    congratsMessage: '🎉 مبروك! وصلت لهدف شرب الماء اليومي! 💧',
    achievementUnlocked: 'عمل رائع!',
    achievement40: 'لقد أنجزت 40% من هدفك اليومي! 💧',
    waterReminder: '💧 تذكير بشرب الماء',
    drinkWaterNow: 'حان وقت شرب الماء! اهتم بصحتك 🥤',
    dataSaved: 'تم حفظ البيانات بنجاح!',
    consumed: 'تم الشرب',
    resetConfirm: 'هل تريد إعادة تعيين التقدم اليومي إلى الصفر؟',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    breakAndReset: 'تفريغ الكأس',
    ramadanMode: 'وضع شهر رمضان',
    iftarTime: 'وقت الإفطار',
    suhoorTime: 'وقت السحور',
    notificationsPaused: 'تم إيقاف التذكيرات!',
    settings: 'الإعدادات',
    save: 'حفظ',
    active: 'مفعّل',
    success: 'نجاح',
    ramadanGreeting: 'رمضان كريم',
    blessedMonth: 'اللهم بلغنا رمضان',
    progress: 'الإنجاز',
  },
  en: {
    title: 'Water Tracker',
    selectWeight: 'Select weight (kg)',
    choose: 'Choose...',
    activityLevel: 'Activity level',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    veryHigh: 'Very High',
    climate: 'Climate',
    normal: 'Normal',
    hot: 'Hot',
    cold: 'Cold',
    next: 'Start Tracking',
    tapToAdd: 'Tap to add glass',
    congratsMessage: '🎉 Goal reached!',
    achievementUnlocked: 'Great Work!',
    achievement40: 'You completed 40% of your daily goal! 💧',
    waterReminder: '💧 Water Reminder',
    drinkWaterNow: 'Time to drink water!',
    dataSaved: 'Data saved!',
    consumed: 'Consumed',
    resetConfirm: 'Reset progress?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    breakAndReset: 'Empty Glass',
    ramadanMode: 'Ramadan Mode',
    iftarTime: 'Iftar Time',
    suhoorTime: 'Suhoor Time',
    notificationsPaused: 'Notifications paused!',
    settings: 'Settings',
    save: 'Save',
    active: 'Active',
    success: 'Success',
    ramadanGreeting: 'Ramadan Kareem',
    blessedMonth: 'Blessed Month',
    progress: 'Progress',
  },
};

// ==================== COLORS ====================
const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  info: '#06b6d4',
  ramadan: '#FFD700',
  ramadanDark: '#8B4513',
  ramadanBg: '#1a0f3d',
  ramadanCard: '#2d1b5e',
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  darkText: '#f1f5f9',
  darkSecondary: '#94a3b8',
  lightBg: '#f8fafc',
  lightCard: '#ffffff',
  lightText: '#1e293b',
  lightSecondary: '#64748b',
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

// ==================== WATER GLASS ====================
const RealisticWaterGlass = forwardRef(({ percentage, onPress, isDark, isRamadan }, ref) => {
  const waterLevelAnim = useRef(new Animated.Value(0)).current;
  const shatterAnim = useRef(new Animated.Value(0)).current;
  const [bubbles, setBubbles] = useState([]);
  const isShattering = useRef(false);

  useImperativeHandle(ref, () => ({
    triggerBubbles: () => {
      if (isShattering.current) return;
      const newBubbles = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 70 + 15 + '%',
        size: Math.random() * 8 + 4,
        anim: new Animated.Value(0),
      }));
      setBubbles(prev => [...prev, ...newBubbles]);
      newBubbles.forEach(bubble => {
        Animated.timing(bubble.anim, {
          toValue: 1,
          duration: 1000 + Math.random() * 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          setBubbles(prev => prev.filter(b => b.id !== bubble.id));
        });
      });
    },
    triggerShatter: () => {
      isShattering.current = true;
      Animated.timing(waterLevelAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start();
      Animated.sequence([
        Animated.loop(
          Animated.sequence([
            Animated.timing(shatterAnim, { toValue: 0.1, duration: 40, useNativeDriver: true }),
            Animated.timing(shatterAnim, { toValue: -0.1, duration: 40, useNativeDriver: true }),
          ]),
          { iterations: 6 }
        ),
        Animated.timing(shatterAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          shatterAnim.setValue(0);
          isShattering.current = false;
        }, 300);
      });
    },
  }));

  useEffect(() => {
    if (percentage === 0) {
      if (!isShattering.current) {
        Animated.timing(waterLevelAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    } else if (!isShattering.current) {
      Animated.timing(waterLevelAnim, {
        toValue: percentage > 1 ? 1 : percentage,
        duration: 1000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [percentage]);

  const waterHeight = waterLevelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const waterColor = isRamadan 
    ? ['#FFD700', '#FFA500']
    : isDark 
      ? ['#1e3a8a', '#3b82f6'] 
      : ['#0ea5e9', '#bae6fd'];
      
  const glassShake = shatterAnim.interpolate({
    inputRange: [-0.1, 0, 0.1, 1],
    outputRange: ['-8deg', '0deg', '8deg', '0deg'],
  });
  const glassOpacity = shatterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });
  const glassScale = shatterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Animated.View
        style={[
          styles.glassWrapper,
          {
            transform: [{ rotate: glassShake }, { scale: glassScale }],
            opacity: glassOpacity,
          },
        ]}
      >
        <View style={[styles.glassContainer, { borderColor: isRamadan ? COLORS.ramadan : isDark ? '#94a3b8' : '#cbd5e1' }]}>
          <View style={styles.waterContainer}>
            <Animated.View style={[styles.waterFill, { height: waterHeight }]}>
              <LinearGradient colors={waterColor} style={{ flex: 1 }} />
              {bubbles.map(bubble => (
                <Animated.View
                  key={bubble.id}
                  style={[
                    styles.bubble,
                    {
                      left: bubble.left,
                      width: bubble.size,
                      height: bubble.size,
                      bottom: bubble.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-10%', '150%'],
                      }),
                      opacity: bubble.anim.interpolate({
                        inputRange: [0, 0.2, 0.8, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                    },
                  ]}
                />
              ))}
            </Animated.View>
          </View>
          <View style={styles.glassShine} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ==================== STAT CARD ====================
const PremiumStatCard = ({ icon, value, label, color, isDarkTheme, isRamadan }) => (
  <View style={[
    styles.statCard, 
    { backgroundColor: isRamadan ? COLORS.ramadanCard : isDarkTheme ? COLORS.darkCard : COLORS.lightCard }
  ]}>
    <MaterialCommunityIcons name={icon} size={wp('7%')} color={isRamadan ? COLORS.ramadan : color} />
    <Text style={[
      styles.statValue, 
      { color: isRamadan ? COLORS.ramadan : isDarkTheme ? COLORS.darkText : COLORS.lightText }
    ]}>
      {value}
    </Text>
    <Text style={[
      styles.statLabel, 
      { color: isRamadan ? '#fff' : isDarkTheme ? COLORS.darkSecondary : COLORS.lightSecondary }
    ]}>
      {label}
    </Text>
  </View>
);

// ==================== FLOATING RAMADAN BUTTON ====================
const FloatingRamadanButton = ({ isRamadanMode, onPress, isDark }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.floatingButton}>
      <Animated.View
        style={[
          styles.floatingButtonGlow,
          {
            opacity: glowOpacity,
            backgroundColor: isRamadanMode ? COLORS.ramadan : isDark ? '#334155' : '#e2e8f0',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.floatingButtonInner,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: isRamadanMode ? COLORS.ramadan : isDark ? '#1e293b' : '#ffffff',
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: isRamadanMode ? rotate : '0deg' }] }}>
          <MaterialCommunityIcons
            name={isRamadanMode ? "moon-waning-crescent" : "moon-waxing-crescent"}
            size={wp('8%')}
            color={isRamadanMode ? COLORS.ramadanDark : isDark ? COLORS.darkText : COLORS.lightText}
          />
        </Animated.View>
        
        {isRamadanMode && (
          <>
            <View style={styles.activeIndicator}>
              <View style={styles.activeIndicatorDot} />
            </View>
            
            <MaterialCommunityIcons
              name="star-four-points"
              size={wp('3%')}
              color={COLORS.ramadanDark}
              style={{ position: 'absolute', top: wp('2%'), left: wp('2%') }}
            />
            <MaterialCommunityIcons
              name="star-four-points"
              size={wp('2.5%')}
              color={COLORS.ramadanDark}
              style={{ position: 'absolute', bottom: wp('2%'), right: wp('2%') }}
            />
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ==================== MAIN COMPONENT ====================
const WaterTracker = ({ navigation }) => {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();
  
  const auth = getAuth();
  const database = getDatabase();
  const glassRef = useRef(null);

  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('');
  const [climate, setClimate] = useState('');
  const [goal, setGoal] = useState(0);
  const [intake, setIntake] = useState(0);
  const [showTracker, setShowTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [iftarHour, setIftarHour] = useState(19);
  const [suhoorHour, setSuhoorHour] = useState(4);
  const [showRamadanModal, setShowRamadanModal] = useState(false);

  const today = getTodayDate();
  const t = translations[language];
  const isRTL = language === 'ar';
  const userEmail = auth.currentUser?.email;
  const userId = userEmail ? userEmail.replace(/\./g, '_') : null;

  const backgroundColor = isRamadanMode ? COLORS.ramadanBg : isDark ? COLORS.darkBg : COLORS.lightBg;
  const cardColor = isRamadanMode ? COLORS.ramadanCard : isDark ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isRamadanMode ? COLORS.ramadan : isDark ? COLORS.darkText : COLORS.lightText;
  const secondaryTextColor = isRamadanMode ? '#fff' : isDark ? COLORS.darkSecondary : COLORS.lightSecondary;

  // ==================== BACK HANDLER ====================
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // ==================== ADS CONTROLLER ====================
  useEffect(() => {
    AdsController.loadInterstitial();
  }, []);

  // ==================== NOTIFICATIONS ====================
  const scheduleSmartReminders = async () => {
    if (Platform.OS === 'web' || !userId) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (goal > 0 && intake >= goal) return;

      let startHour = isRamadanMode ? iftarHour : 8;
      let endHour = isRamadanMode ? suhoorHour : 22;
      const triggers = [];
      let current = startHour;
      let loops = 0;

      while (loops < 7) {
        triggers.push(current);
        if (startHour < endHour) {
          if (current + 2 >= endHour) break;
        } else {
          if (current < startHour && current + 2 >= endHour) break;
        }
        current = (current + 2) % 24;
        loops++;
      }

      for (const hour of triggers) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isRamadanMode ? '🌙 تذكير رمضان' : t.waterReminder,
            body: t.drinkWaterNow,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hour,
            minute: 0,
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const setup = async () => {
      if (!userId || Platform.OS === 'web') return;
      const key = `@water_notifications_${userId}`;
      const lastScheduled = await AsyncStorage.getItem(key);
      const today = getTodayDate();
      if (lastScheduled === today) return;
      await scheduleSmartReminders();
      await AsyncStorage.setItem(key, today);
    };
    setup();
  }, [userId]);

  // ==================== DATA ====================
  const loadUserData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const userDataRef = ref(database, `users/${userId}/waterTracker`);
      const snapshot = await get(userDataRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setWeight(data.weight || '');
        setActivity(data.activity || '');
        setClimate(data.climate || '');
        if (data.isRamadanMode !== undefined) setIsRamadanMode(data.isRamadanMode);
        if (data.iftarHour) setIftarHour(data.iftarHour);
        if (data.suhoorHour) setSuhoorHour(data.suhoorHour);
        if (data.weight && data.activity && data.climate) {
          calculateGoal(data.weight, data.activity, data.climate);
          setShowTracker(true);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    if (!userId) return;
    try {
      const userDataRef = ref(database, `users/${userId}/waterTracker`);
      await update(userDataRef, {
        weight,
        activity,
        climate,
        goal,
        isRamadanMode,
        iftarHour,
        suhoorHour,
        lastUpdated: new Date().toISOString(),
      });
      await scheduleSmartReminders();
      await AsyncStorage.setItem(`@water_notifications_${userId}`, getTodayDate());
      setShowTracker(true);
      setShowRamadanModal(false);
      Alert.alert(t.success, t.dataSaved);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDailyIntake = async () => {
    if (!userId) return;
    try {
      const intakeRef = ref(database, `users/${userId}/waterIntake/${today}`);
      const snapshot = await get(intakeRef);
      if (snapshot.exists()) {
        setIntake(snapshot.val().amount || 0);
      } else {
        setIntake(0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveDailyIntake = async amount => {
    if (!userId) return;
    try {
      const intakeRef = ref(database, `users/${userId}/waterIntake/${today}`);
      await set(intakeRef, {
        amount,
        glasses: Math.floor(amount / 100),
        goal,
        achieved: amount >= goal,
        date: today,
        percentage: Math.min((amount / goal) * 100, 100),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadDailyIntake();
    }
  }, [userId]);

  useEffect(() => {
    const requestPerms = async () => {
      await Notifications.requestPermissionsAsync();
    };
    requestPerms();
  }, []);

  const calculateGoal = (w, act, cli) => {
    if (!w) {
      setGoal(0);
      return;
    }
    const base = 30;
    let waterNeed = Number(w) * base;
    if (act === 'medium') waterNeed += 500;
    if (act === 'high') waterNeed += 1000;
    if (act === 'very_high') waterNeed += 1500;
    if (cli === 'hot') waterNeed += 500;
    if (cli === 'cold') waterNeed -= 200;
    setGoal(Math.round(waterNeed / 100) * 100);
  };

  // ==================== ADD WATER WITH ADS ====================
  const addWater = async () => {
    if (!goal) return;
    if (glassRef.current) glassRef.current.triggerBubbles();

    const oldPercentage = (intake / goal) * 100;
    const newIntake = intake + 100;
    const newPercentage = (newIntake / goal) * 100;

    setIntake(newIntake);
    await saveDailyIntake(newIntake);

    if (oldPercentage < 40 && newPercentage >= 40) {
      AdsController.showInterstitial();
      Alert.alert(t.achievementUnlocked, t.achievement40);
    }

    if (newPercentage >= 100 && oldPercentage < 100) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '🎉', body: t.congratsMessage, sound: true },
        trigger: null,
      });
      Alert.alert(t.success, t.notificationsPaused);
      await Notifications.cancelAllScheduledNotificationsAsync();
      AdsController.showInterstitial();
    }
  };

  const resetWater = async () => {
    Alert.alert(t.resetConfirm, '', [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        onPress: async () => {
          if (glassRef.current) glassRef.current.triggerShatter();
          setIntake(0);
          if (userId) {
            await set(ref(database, `users/${userId}/waterIntake/${today}`), {
              amount: 0,
              glasses: 0,
              goal,
              achieved: false,
              date: today,
              percentage: 0,
              lastUpdated: new Date().toISOString(),
            });
            await scheduleSmartReminders();
          }
        },
      },
    ]);
  };

  const progressPercentage = goal > 0 ? Math.min((intake / goal) * 100, 100) : 0;

  const renderRamadanSettings = () => (
    <Modal
      visible={showRamadanModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRamadanModal(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={isRamadanMode ? ['#1a0f3d', '#2d1b5e', '#4a2d80'] : [cardColor, cardColor]}
          style={styles.modalContent}
        >
          <View style={styles.ramadanHeader}>
            <MaterialCommunityIcons
              name="mosque"
              size={wp('18%')}
              color={isRamadanMode ? COLORS.ramadan : COLORS.primary}
            />
            <Text style={[styles.modalTitle, { color: isRamadanMode ? COLORS.ramadan : textColor }]}>
              {t.ramadanMode}
            </Text>
            {isRamadanMode && (
              <Text style={[styles.ramadanGreeting, { color: COLORS.ramadan }]}>
                ✨ {t.ramadanGreeting} ✨
              </Text>
            )}
          </View>

          <View style={styles.settingRow}>
            <Text style={{ color: isRamadanMode ? '#fff' : textColor, fontSize: wp('4%'), fontWeight: '600' }}>
              {t.active}
            </Text>
            <Switch
              value={isRamadanMode}
              onValueChange={setIsRamadanMode}
              trackColor={{ true: COLORS.ramadan, false: '#ccc' }}
              thumbColor="#fff"
            />
          </View>

          {isRamadanMode && (
            <>
              <Text style={[styles.label, { marginTop: hp('2%'), color: '#fff', fontWeight: '600' }]}>
                {t.iftarTime}
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: COLORS.ramadan }]}>
                <Picker selectedValue={iftarHour} onValueChange={setIftarHour} style={{ color: '#fff' }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={`${i}:00`} value={i} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { marginTop: hp('2%'), color: '#fff', fontWeight: '600' }]}>
                {t.suhoorTime}
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: COLORS.ramadan }]}>
                <Picker selectedValue={suhoorHour} onValueChange={setSuhoorHour} style={{ color: '#fff' }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={`${i}:00`} value={i} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: isRamadanMode ? COLORS.ramadan : COLORS.primary }]}
            onPress={saveUserData}
          >
            <MaterialCommunityIcons name="check-circle" size={28} color={isRamadanMode ? COLORS.ramadanDark : '#fff'} />
            <Text style={[styles.saveButtonText, { color: isRamadanMode ? COLORS.ramadanDark : '#fff' }]}>
              {t.save}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={isRamadanMode ? COLORS.ramadan : COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor }]}>
      <StatusBar barStyle={isRamadanMode || isDark ? 'light-content' : 'dark-content'} />
      
      {/* ==================== HEADER ==================== */}
      <View style={styles.header}>
        <View style={styles.rowHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.headerButton, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.2)' : isDark ? '#1e293b' : '#e2e8f0' }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={22}
              color={textColor}
            />
          </TouchableOpacity>

          <View style={styles.languageThemeContainer}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.2)' : isDark ? '#1e293b' : '#e2e8f0' }]} 
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerText, { color: textColor }]}>
                {language === 'en' ? 'AR' : 'EN'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.2)' : isDark ? '#1e293b' : '#e2e8f0' }]} 
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerText, { color: textColor }]}>
                {isDark ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isRamadanMode && (
        <LinearGradient
          colors={['rgba(255,215,0,0.3)', 'transparent']}
          style={styles.topRamadanBanner}
        >
          <MaterialCommunityIcons name="star-four-points" size={wp('4%')} color={COLORS.ramadan} />
          <Text style={styles.topBannerText}>{t.blessedMonth}</Text>
          <MaterialCommunityIcons name="star-four-points" size={wp('4%')} color={COLORS.ramadan} />
        </LinearGradient>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        {!showTracker ? (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{t.title}</Text>

            <Text style={[styles.label, { color: textColor }]}>{t.selectWeight}</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.1)' : isDark ? '#334155' : '#f1f5f9' }]}>
              <Picker selectedValue={weight} onValueChange={setWeight} style={{ color: textColor }}>
                <Picker.Item label={t.choose} value="" />
                {Array.from({ length: 31 }, (_, i) => 30 + i * 5).map(w => (
                  <Picker.Item key={w} label={`${w}`} value={`${w}`} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.label, { color: textColor, marginTop: hp('2%') }]}>{t.activityLevel}</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.1)' : isDark ? '#334155' : '#f1f5f9' }]}>
              <Picker selectedValue={activity} onValueChange={setActivity} style={{ color: textColor }}>
                <Picker.Item label={t.choose} value="" />
                <Picker.Item label={t.low} value="low" />
                <Picker.Item label={t.medium} value="medium" />
                <Picker.Item label={t.high} value="high" />
                <Picker.Item label={t.veryHigh} value="very_high" />
              </Picker>
            </View>

            <Text style={[styles.label, { color: textColor, marginTop: hp('2%') }]}>{t.climate}</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.1)' : isDark ? '#334155' : '#f1f5f9' }]}>
              <Picker selectedValue={climate} onValueChange={setClimate} style={{ color: textColor }}>
                <Picker.Item label={t.choose} value="" />
                <Picker.Item label={t.normal} value="normal" />
                <Picker.Item label={t.hot} value="hot" />
                <Picker.Item label={t.cold} value="cold" />
              </Picker>
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: isRamadanMode ? COLORS.ramadan : COLORS.primary }]}
              onPress={saveUserData}
            >
              <Text style={[styles.nextButtonText, { color: isRamadanMode ? COLORS.ramadanDark : '#fff' }]}>
                {t.next}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.trackerCard, { backgroundColor: cardColor }]}>
            {isRamadanMode && (
              <View style={styles.ramadanBanner}>
                <MaterialCommunityIcons name="star-crescent" size={wp('10%')} color={COLORS.ramadan} />
                <Text style={[styles.ramadanBannerText, { color: COLORS.ramadan }]}>
                  {t.ramadanGreeting}
                </Text>
                <MaterialCommunityIcons name="star-crescent" size={wp('10%')} color={COLORS.ramadan} />
              </View>
            )}

            <RealisticWaterGlass
              ref={glassRef}
              percentage={goal > 0 ? intake / goal : 0}
              onPress={addWater}
              isDark={isDark}
              isRamadan={isRamadanMode}
            />

            <Text style={{ color: secondaryTextColor, marginTop: hp('1%'), fontSize: wp('3.5%') }}>
              {t.tapToAdd}
            </Text>

            <View style={styles.statsContainer}>
              <PremiumStatCard
                icon="cup"
                value={Math.floor(intake / 100)}
                label={t.consumed}
                color={COLORS.success}
                isDarkTheme={isDark}
                isRamadan={isRamadanMode}
              />
              <PremiumStatCard
                icon="target"
                value={`${Math.round(progressPercentage)}%`}
                label={t.progress}
                color={COLORS.info}
                isDarkTheme={isDark}
                isRamadan={isRamadanMode}
              />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.3)' : COLORS.danger }]}
                onPress={resetWater}
              >
                <MaterialCommunityIcons name="delete-restore" size={wp('5%')} color={isRamadanMode ? COLORS.ramadan : '#fff'} />
                <Text style={[styles.actionButtonText, { color: isRamadanMode ? COLORS.ramadan : '#fff' }]}>
                  {t.breakAndReset}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isRamadanMode ? 'rgba(255,215,0,0.3)' : COLORS.info }]}
                onPress={() => setShowTracker(false)}
              >
                <MaterialCommunityIcons name="cog" size={wp('5%')} color={isRamadanMode ? COLORS.ramadan : '#fff'} />
                <Text style={[styles.actionButtonText, { color: isRamadanMode ? COLORS.ramadan : '#fff' }]}>
                  {t.settings}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {renderRamadanSettings()}
      </ScrollView>

      <FloatingRamadanButton
        isRamadanMode={isRamadanMode}
        onPress={() => setShowRamadanModal(true)}
        isDark={isDark}
      />

      <View style={{ alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
        <BannerAd unitId={AdUnits.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    </View>
  );
};

export default WaterTracker;

// ==================== STYLES ====================
const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingHorizontal: wp('4%'), paddingVertical: hp('1.5%'), paddingTop: hp('5%') },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  languageThemeContainer: { flexDirection: 'row', gap: wp('2%') },
  headerButton: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerText: { fontSize: 16, fontWeight: '600' },

  topRamadanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    gap: wp('2%'),
  },
  topBannerText: {
    color: COLORS.ramadan,
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
  },

  scrollView: { flex: 1 },
  container: { paddingBottom: hp('15%') },
  
  card: {
    margin: wp('4%'),
    padding: wp('5%'),
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  label: {
    fontSize: wp('4%'),
    fontWeight: '600',
    marginTop: hp('1%'),
    marginBottom: hp('0.5%'),
  },
  pickerContainer: {
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    marginTop: hp('0.5%'),
  },
  nextButton: {
    padding: hp('2%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  nextButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },

  trackerCard: {
    margin: wp('4%'),
    padding: wp('5%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
    elevation: 4,
  },
  
  ramadanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
    gap: wp('3%'),
  },
  ramadanBannerText: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
  },

  glassWrapper: {
    width: wp('35%'),
    height: wp('50%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassContainer: {
    width: '100%',
    height: '100%',
    borderWidth: 5,
    borderTopWidth: 0,
    borderBottomLeftRadius: wp('10%'),
    borderBottomRightRadius: wp('10%'),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  waterContainer: { flex: 1, justifyContent: 'flex-end' },
  waterFill: { width: '100%' },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: wp('3%'),
    width: wp('3%'),
    height: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: wp('1.5%'),
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: hp('2%'),
    gap: wp('2%'),
  },
  statCard: {
    flex: 1,
    padding: hp('2%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
  },
  statLabel: {
    fontSize: wp('3%'),
    marginTop: hp('0.3%'),
  },

  actionsRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginTop: hp('2%'),
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: hp('1.5%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('1%'),
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: wp('3.5%'),
  },

  floatingButton: {
    position: 'absolute',
    bottom: hp('12%'),
    right: wp('5%'),
    width: wp('18%'),
    height: wp('18%'),
    zIndex: 1000,
  },
  floatingButtonGlow: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    borderRadius: wp('12%'),
    top: '-20%',
    left: '-20%',
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: wp('1.5%'),
    right: wp('1.5%'),
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicatorDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: COLORS.ramadanDark,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: wp('5%'),
  },
  modalContent: {
    padding: wp('6%'),
    borderRadius: wp('5%'),
    elevation: 15,
  },
  ramadanHeader: {
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  modalTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginTop: hp('1.5%'),
    textAlign: 'center',
  },
  ramadanGreeting: {
    fontSize: wp('4.5%'),
    fontStyle: 'italic',
    marginTop: hp('1%'),
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    paddingVertical: hp('1%'),
  },
  saveButton: {
    padding: hp('2%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    marginTop: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('2%'),
    elevation: 4,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: wp('4.5%'),
  },
});