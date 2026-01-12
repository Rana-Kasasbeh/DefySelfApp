import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  I18nManager,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ✅ إصلاح قاعدة البيانات
import { auth, firestore as db } from '../services/firebaseConfig';

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// استيراد Global Context
import { useGlobal } from '../contexts/GlobalContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdUnits } from '../ads/AdConfig';

// ==================== TYPES ====================
type Language = 'ar' | 'en';
type ViewMode = 'list' | 'details' | 'create';

interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  createdAt: string;
  order: number;
}

interface DailyProgress {
  date: string;
  completedGoodHabits: string[];
  completedBadHabits: string[];
  score: number;
  timestamp: string;
  isLocked: boolean;
  userEmail: string;
}

interface Challenge {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  duration: number;
  startDate: string;
  endDate: string;
  habits: Habit[];
  dailyProgress: Record<string, DailyProgress>;
  status: 'active' | 'completed' | 'failed';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// ==================== CONSTANTS ====================
const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6'] as const,
  success: '#10b981',
  successGradient: ['#10b981', '#059669'] as const,
  danger: '#ef4444',
  dangerGradient: ['#ef4444', '#dc2626'] as const,
  warning: '#f59e0b',
  warningGradient: ['#f59e0b', '#d97706'] as const,
  dark: '#1f2937',
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  darkText: '#f1f5f9',
  darkBorder: '#334155',
  darkGradient: ['#0f172a', '#1e293b'] as const,
  light: '#f8fafc',
  white: '#ffffff',
  gray: '#64748b',
};

const translations = {
  ar: {
    myChallenges: 'تحدياتي',
    noChallenges: 'لا توجد تحديات نشطة',
    startNewJourney: 'ابدأ رحلة جديدة الآن!',
    createButton: 'إنشاء تحدي',
    newChallenge: 'تحدي جديد',
    challengeName: 'اسم التحدي',
    challengeDuration: 'مدة التحدي (أيام):',
    addHabit: 'إضافة عادة',
    habitPlaceholder: 'اكتب عادة جديدة',
    goodHabits: 'عادات جيدة',
    badHabits: 'عادات سيئة',
    startChallenge: 'حفظ وبدء',
    day: 'اليوم',
    of: 'من',
    days: 'أيام',
    active: 'نشط',
    markToday: 'تسجيل اليوم',
    todayMarked: 'تم التسجيل',
    todayScore: 'نتيجة اليوم',
    congratulations: 'مبروك!',
    deleteChallenge: 'حذف',
    error: 'خطأ',
    success: 'نجح',
    enterChallengeName: 'الرجاء إدخال اسم التحدي',
    addOneHabit: 'الرجاء إضافة عادة واحدة على الأقل',
    resetTitle: 'حذف التحدي',
    resetMessage: 'هل أنت متأكد؟ سيتم حذف جميع البيانات.',
    loading: 'جاري التحميل...',
    timeLeft: 'متبقي',
    dayLeft: 'يوم',
    progress: 'التقدم',
  },
  en: {
    myChallenges: 'My Challenges',
    noChallenges: 'No active challenges',
    startNewJourney: 'Start a new journey now!',
    createButton: 'Create Challenge',
    newChallenge: 'New Challenge',
    challengeName: 'Challenge Name',
    challengeDuration: 'Duration (days):',
    addHabit: 'Add Habit',
    habitPlaceholder: 'Enter a new habit',
    goodHabits: 'Good Habits',
    badHabits: 'Bad Habits',
    startChallenge: 'Save & Start',
    day: 'Day',
    of: 'of',
    days: 'days',
    active: 'Active',
    markToday: 'Mark Today',
    todayMarked: 'Marked',
    todayScore: "Today's Score",
    congratulations: 'Congratulations!',
    deleteChallenge: 'Delete',
    error: 'Error',
    success: 'Success',
    enterChallengeName: 'Please enter challenge name',
    addOneHabit: 'Please add at least one habit',
    resetTitle: 'Delete Challenge',
    resetMessage: 'Are you sure? All data will be lost.',
    loading: 'Loading...',
    timeLeft: 'Time Left',
    dayLeft: 'days',
    progress: 'Progress',
  },
};

// ==================== COMPONENTS ====================

const StaticLogo = React.memo(({ isDark }: { isDark: boolean }) => (
  <View>
    <Image
      source={isDark ? require('../images/HabitD.png') : require('../images/HabitL.png')}
      style={{ width: wp('20%'), height: wp('20%') }}
      resizeMode="contain"
    />
  </View>
));

const ChallengeSummaryCard = ({ challenge, onPress, isDark, t, isRTL }: any) => {
  const today = new Date();
  const startDate = new Date(challenge.startDate);
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const progressPercent = Math.min(100, Math.round((currentDay / challenge.duration) * 100));
  const daysLeft = Math.max(0, challenge.duration - currentDay);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginBottom: hp('2%') }}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#334155'] : ['#ffffff', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.challengeSummaryCard}
      >
        <View style={[styles.summaryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff' }]}>
            <MaterialCommunityIcons name="trophy-variant" size={wp('6%')} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.summaryTitle, { color: isDark ? COLORS.white : COLORS.dark }]}>{challenge.name}</Text>
            <Text style={[styles.summarySubtitle, { color: COLORS.gray }]}>
              {challenge.habits.length} {t.goodHabits} • {challenge.duration} {t.days}
            </Text>
          </View>
          <View style={styles.daysLeftBadge}>
             <Text style={styles.daysLeftText}>{daysLeft} {t.dayLeft}</Text>
          </View>
        </View>

        <View style={styles.summaryProgress}>
          <View style={[styles.progressRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.progressLabel, { color: COLORS.gray }]}>{t.progress}</Text>
            <Text style={[styles.progressPercent, { color: COLORS.primary }]}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={COLORS.primaryGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ==================== MAIN SCREEN ====================
export default function HabitsScreen({ navigation }: any) {
  const { isDark, language, updateProgress } = useGlobal();
  
  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Creation State
  const [challengeName, setChallengeName] = useState('');
  const [challengeDuration, setChallengeDuration] = useState(30);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [habitType, setHabitType] = useState<'good' | 'bad'>('good');

  // Tracking State
  const [dailyHabitsState, setDailyHabitsState] = useState<Record<string, boolean>>({});
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const t = translations[language as Language];
  const isRTL = language === 'ar';
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const secondaryTextColor = COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';

  // ==================== HELPERS ====================
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const getEncodedEmail = () => {
    const user = auth.currentUser;
    if (!user?.email) return '';
    return user.email.replace(/\./g, '_').replace(/@/g, '_at_');
  };

  useEffect(() => {
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);

  // Handle Back Button
  useEffect(() => {
    const backAction = () => {
      if (viewMode !== 'list') {
        setViewMode('list');
        setSelectedChallenge(null);
        return true; 
      }
      return false; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [viewMode]);

  // ==================== DATA FETCHING ====================
  const fetchChallenges = useCallback(async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      setInitialLoading(false);
      return;
    }

    try {
      setLoading(true);
      const encodedEmail = getEncodedEmail();
      const challengesRef = collection(db, `users/${encodedEmail}/challenges`);
      
      const q = query(challengesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const loadedChallenges: Challenge[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Challenge;
        const endDate = new Date(data.endDate);
        if (endDate >= today) {
           loadedChallenges.push({ ...data, id: docSnap.id });
        }
      });

      setChallenges(loadedChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const loadChallengeDetails = async (challenge: Challenge) => {
    setLoading(true);
    try {
        const encodedEmail = getEncodedEmail();
        const activitiesRef = collection(db, `users/${encodedEmail}/challenges/${challenge.id}/activities`);
        const activitiesSnap = await getDocs(activitiesRef);
        
        const dailyProgress: Record<string, DailyProgress> = {};
        activitiesSnap.forEach((doc) => {
            dailyProgress[doc.data().date] = doc.data() as DailyProgress;
        });

        setSelectedChallenge({ ...challenge, dailyProgress });
        setDailyHabitsState({}); 
        setViewMode('details');
    } catch (error) {
        console.error("Error details", error);
    } finally {
        setLoading(false);
    }
  };

  // ==================== ACTIONS ====================
  const handleCreateChallenge = async () => {
    if (!challengeName.trim() || habits.length === 0) return;

    const user = auth.currentUser;
    if (!user?.email) return;

    try {
      setLoading(true);
      const encodedEmail = getEncodedEmail();
      const today = getTodayDate();
      
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + challengeDuration - 1);
      const endDate = endDateObj.toISOString().split('T')[0];

      const newChallengeRef = doc(collection(db, `users/${encodedEmail}/challenges`));
      
      const newChallenge: Challenge = {
        id: newChallengeRef.id,
        userId: user.uid,
        userEmail: user.email,
        name: challengeName.trim(),
        duration: challengeDuration,
        startDate: today,
        endDate: endDate,
        habits: habits,
        dailyProgress: {},
        status: 'active',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(newChallengeRef, newChallenge);
      await fetchChallenges();
      setViewMode('list');
      setChallengeName('');
      setHabits([]);
      
      Alert.alert(t.success, language === 'ar' ? 'تم إنشاء التحدي!' : 'Challenge Created!');

    } catch (error) {
      console.error(error);
      Alert.alert(t.error, 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!selectedChallenge) return;
    
    Alert.alert(t.resetTitle, t.resetMessage, [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
                try {
                    setLoading(true);
                    const encodedEmail = getEncodedEmail();
                    await deleteDoc(doc(db, `users/${encodedEmail}/challenges/${selectedChallenge.id}`));
                    
                    setChallenges(prev => prev.filter(c => c.id !== selectedChallenge.id));
                    setViewMode('list');
                    setSelectedChallenge(null);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
        }
    ]);
  };

  const markDay = async () => {
    if (!selectedChallenge) return;
    const today = getTodayDate();
    
    const goodHabits = selectedChallenge.habits.filter(h => h.type === 'good');
    const badHabits = selectedChallenge.habits.filter(h => h.type === 'bad');
    const completedGood = goodHabits.filter(h => dailyHabitsState[h.id]);
    const completedBad = badHabits.filter(h => !dailyHabitsState[h.id]); 
    
    const score = Math.round(((completedGood.length + completedBad.length) / selectedChallenge.habits.length) * 100);

    const progress: DailyProgress = {
        date: today,
        completedGoodHabits: completedGood.map(h => h.id),
        completedBadHabits: completedBad.map(h => h.id),
        score,
        timestamp: new Date().toISOString(),
        isLocked: true,
        userEmail: auth.currentUser?.email || '',
    };

    try {
        setLoading(true);
        const encodedEmail = getEncodedEmail();
        const activityRef = doc(db, `users/${encodedEmail}/challenges/${selectedChallenge.id}/activities/${today}`);
        await setDoc(activityRef, progress, { merge: true });

        const updatedChallenge = {
            ...selectedChallenge,
            dailyProgress: {
                ...selectedChallenge.dailyProgress,
                [today]: progress
            }
        };
        setSelectedChallenge(updatedChallenge);

        if(updateProgress) {
             const allDays = Object.values(updatedChallenge.dailyProgress);
             const daysCompleted = allDays.filter(p => p.score > 0).length;
             await updateProgress('habits', {
                completedTasks: daysCompleted,
                totalTasks: updatedChallenge.duration
             });
        }

        Alert.alert(t.success, `${t.todayScore}: ${score}%`);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  // ==================== VIEWS RENDERERS ====================
  
  // ✅ قمنا بوضع الإعلان هنا داخل العرض الخاص بالقائمة فقط
  // هذا يمنع أي تضارب في الشروط ويحل مشكلة النص
  const renderListView = () => (
    <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.header}>
                <View style={styles.rowHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <MaterialCommunityIcons name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { fontSize: 18, color: textColor }]}>{t.myChallenges}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <View style={styles.logoSection}><StaticLogo isDark={isDark} /></View>

            <View style={{ paddingHorizontal: wp('4%') }}>
                {challenges.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                        <MaterialCommunityIcons name="trophy-broken" size={wp('15%')} color={COLORS.gray} />
                        <Text style={[styles.emptyText, { color: textColor }]}>{t.noChallenges}</Text>
                        <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>{t.startNewJourney}</Text>
                    </View>
                ) : (
                    challenges.map(item => (
                        <ChallengeSummaryCard 
                            key={item.id} 
                            challenge={item} 
                            isDark={isDark} 
                            t={t} 
                            isRTL={isRTL}
                            onPress={() => loadChallengeDetails(item)}
                        />
                    ))
                )}

                <TouchableOpacity onPress={() => setViewMode('create')} style={{ marginTop: hp('2%') }}>
                    <LinearGradient colors={COLORS.primaryGradient as any} style={styles.createButtonMain}>
                        <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
                        <Text style={styles.createButtonText}>{t.createButton}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>

        {/* ✅ مكان الإعلان الجديد: داخل الـ View الخاص بالقائمة */}
        <View style={{ alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
            <BannerAd
                unitId={AdUnits.BANNER}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            />
        </View>
    </View>
  );

  const renderCreateView = () => (
    <ScrollView>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <MaterialCommunityIcons name="close" size={22} color={textColor} />
            </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, marginTop: 10 }]}>
            <LinearGradient colors={COLORS.primaryGradient as any} style={styles.cardHeader}>
                <MaterialCommunityIcons name="flag-checkered" size={24} color={COLORS.white} />
                <Text style={styles.cardHeaderText}>{t.newChallenge}</Text>
            </LinearGradient>
            
            <View style={styles.cardBody}>
                <TextInput 
                    style={[styles.input, { color: textColor, borderColor, backgroundColor: inputColor, textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder={t.challengeName}
                    placeholderTextColor={secondaryTextColor}
                    value={challengeName}
                    onChangeText={setChallengeName}
                />
                
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', marginVertical: 10 }]}>
                    <Text style={[styles.label, { color: textColor }]}>{t.challengeDuration}</Text>
                    <TextInput 
                        style={[styles.durationInput, { color: textColor, borderColor, backgroundColor: inputColor }]}
                        value={challengeDuration.toString()}
                        onChangeText={v => setChallengeDuration(Number(v))}
                        keyboardType="numeric"
                    />
                </View>

                <View style={[styles.addHabitRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 15 }]}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0, color: textColor, borderColor, backgroundColor: inputColor, textAlign: isRTL ? 'right' : 'left' }]}
                        placeholder={t.habitPlaceholder}
                        placeholderTextColor={secondaryTextColor}
                        value={newHabit}
                        onChangeText={setNewHabit}
                    />
                    <TouchableOpacity onPress={() => setHabitType(prev => prev === 'good' ? 'bad' : 'good')}>
                        <MaterialCommunityIcons 
                            name={habitType === 'good' ? "check-circle" : "close-circle"} 
                            size={35} 
                            color={habitType === 'good' ? COLORS.success : COLORS.danger} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        if(newHabit.trim()) {
                            setHabits([...habits, { id: Date.now().toString(), name: newHabit, type: habitType, createdAt: '', order: 0 }]);
                            setNewHabit('');
                        }
                    }}>
                        <View style={[styles.addButton, { backgroundColor: COLORS.primary }]}>
                            <Feather name="plus" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 20 }}>
                    {habits.map(h => (
                        <View key={h.id} style={[styles.habitListItem, { borderColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <MaterialCommunityIcons name={h.type === 'good' ? "check" : "close"} size={20} color={h.type === 'good' ? COLORS.success : COLORS.danger} />
                            <Text style={{ color: textColor, flex: 1, marginHorizontal: 10, textAlign: isRTL ? 'right' : 'left' }}>{h.name}</Text>
                            <TouchableOpacity onPress={() => setHabits(habits.filter(i => i.id !== h.id))}>
                                <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <TouchableOpacity 
                    onPress={handleCreateChallenge} 
                    disabled={loading || !challengeName || habits.length === 0}
                    style={{ marginTop: 30 }}
                >
                    <LinearGradient colors={COLORS.successGradient as any} style={styles.startButton}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startButtonText}>{t.startChallenge}</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    </ScrollView>
  );

  const renderDetailsView = () => {
    if (!selectedChallenge) return null;
    
    const today = new Date();
    const start = new Date(selectedChallenge.startDate);
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(1, diff), selectedChallenge.duration);
    const isTodayMarked = !!selectedChallenge.dailyProgress[getTodayDate()];

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.header}>
                <View style={[styles.rowHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <MaterialCommunityIcons name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { flex: 1, textAlign: 'center', color: textColor }]}>{selectedChallenge.name}</Text>
                    <TouchableOpacity onPress={handleDeleteChallenge} style={[styles.headerButton, { backgroundColor: COLORS.danger + '20' }]}>
                        <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingHorizontal: wp('4%') }}>
                <View style={[styles.challengeMeta, { justifyContent: 'center', marginBottom: 20 }]}>
                    <Text style={{ color: secondaryTextColor }}>{t.day} {currentDay} {t.of} {selectedChallenge.duration}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardColor, padding: 15 }]}>
                    {selectedChallenge.habits.map(h => (
                        <TouchableOpacity 
                            key={h.id} 
                            onPress={() => !isTodayMarked && setDailyHabitsState(prev => ({...prev, [h.id]: !prev[h.id]}))}
                            disabled={isTodayMarked}
                            style={{ marginBottom: 10 }}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1e293b', '#334155'] : ['#f8fafc', '#ffffff']}
                                style={[styles.habitCard, { 
                                    borderColor: dailyHabitsState[h.id] ? COLORS.success : borderColor,
                                    borderWidth: dailyHabitsState[h.id] ? 2 : 1 
                                }]}
                            >
                                <View style={[styles.habitContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <MaterialCommunityIcons 
                                        name={h.type === 'good' ? "check-circle-outline" : "close-circle-outline"} 
                                        size={24} 
                                        color={h.type === 'good' ? COLORS.success : COLORS.danger} 
                                    />
                                    <Text style={[styles.habitText, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>{h.name}</Text>
                                    {dailyHabitsState[h.id] && <MaterialCommunityIcons name="check" size={20} color={COLORS.success} />}
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity 
                        onPress={markDay} 
                        disabled={isTodayMarked || loading}
                        style={{ marginTop: 20 }}
                    >
                        <LinearGradient 
                            colors={isTodayMarked ? [COLORS.gray, COLORS.gray] : COLORS.primaryGradient as any}
                            style={styles.markButton}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.markButtonText}>
                                    {isTodayMarked ? t.todayMarked : t.markToday}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                
                {isTodayMarked && (
                    <View style={[styles.todayResultCard, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff' }]}>
                        <Text style={[styles.todayResultTitle, { color: textColor }]}>{t.todayScore}</Text>
                        <Text style={[styles.todayResultScore, { color: COLORS.primary }]}>
                            {selectedChallenge.dailyProgress[getTodayDate()]?.score || 0}%
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list': return renderListView();
      case 'create': return renderCreateView();
      case 'details': return renderDetailsView();
      default: return null;
    }
  };

  // ==================== MAIN RENDER ====================
  if (initialLoading) {
    return (
        <LinearGradient colors={isDark ? COLORS.darkGradient as any : [COLORS.light, COLORS.white]} style={styles.container}>
            <View style={styles.loadingContainer}>
                <StaticLogo isDark={isDark} />
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            </View>
        </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={isDark ? COLORS.darkGradient as any : [COLORS.light, COLORS.white]} style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {/* ✅ استدعاء دالة المحتوى فقط (لا شروط ولا إعلانات في هذا المستوى) */}
        {renderContent()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: wp('4%'), paddingVertical: hp('1.5%'), paddingTop: hp('5%') },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  headerButton: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 16, fontWeight: '700' },
  logoSection: { alignItems: 'center', marginBottom: hp('2%') },
  
  card: { borderRadius: 16, overflow: 'hidden', elevation: 4, marginHorizontal: wp('4%'), marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  cardHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardBody: { padding: 15 },
  
  input: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15, fontSize: 16 },
  durationInput: { padding: 10, borderRadius: 10, borderWidth: 1, width: 80, textAlign: 'center', fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600', flex: 1 },
  
  row: { alignItems: 'center', justifyContent: 'space-between' },
  addHabitRow: { alignItems: 'center', gap: 10 },
  
  addButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  startButton: { padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  markButton: { padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  markButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  createButtonMain: { padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  challengeSummaryCard: { borderRadius: 16, padding: 15, elevation: 3 },
  summaryHeader: { alignItems: 'center', gap: 15, marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  summarySubtitle: { fontSize: 12 },
  daysLeftBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  daysLeftText: { color: COLORS.warning, fontWeight: 'bold', fontSize: 12 },
  summaryProgress: { marginTop: 5 },
  progressRow: { justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 12 },
  progressPercent: { fontWeight: 'bold', fontSize: 12 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  emptyState: { alignItems: 'center', padding: 40, borderRadius: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { marginTop: 5 },

  habitListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 8 },
  habitCard: { borderRadius: 12, borderWidth: 1, padding: 0 },
  habitContent: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitText: { flex: 1, fontSize: 16, fontWeight: '600' },

  challengeMeta: { alignItems: 'center' },
  todayResultCard: { marginTop: 20, padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '30' },
  todayResultTitle: { fontSize: 16, fontWeight: 'bold' },
  todayResultScore: { fontSize: 32, fontWeight: '900', marginTop: 10 },
});