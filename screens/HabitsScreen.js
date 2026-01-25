// screens/HabitsScreen.js - CONNECTED TO BACKEND API
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
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useGlobal } from '../contexts/GlobalContext';
import { AdUnits } from '../ads/AdConfig';
import AdsController from '../ads/AdsController';
import api from '../services/api';

// ==================== CONSTANTS ====================
const COLORS = {
  primary: '#6366f1',
  primaryGradient: ['#6366f1', '#8b5cf6'],
  success: '#10b981',
  successGradient: ['#10b981', '#059669'],
  danger: '#ef4444',
  dangerGradient: ['#ef4444', '#dc2626'],
  warning: '#f59e0b',
  dark: '#1f2937',
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  darkText: '#f1f5f9',
  darkBorder: '#334155',
  darkGradient: ['#0f172a', '#1e293b'],
  light: '#f8fafc',
  white: '#ffffff',
  gray: '#64748b',
};

const translations = {
  ar: {
    myHabits: 'عاداتي',
    noHabits: 'لا توجد عادات نشطة',
    startNewJourney: 'ابدأ رحلة جديدة الآن!',
    createButton: 'إنشاء عادة',
    newHabit: 'عادة جديدة',
    habitName: 'اسم العادة',
    description: 'الوصف (اختياري)',
    duration: 'المدة',
    durationUnit: 'الوحدة',
    category: 'التصنيف',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'شهور',
    health: 'صحة',
    productivity: 'إنتاجية',
    learning: 'تعلم',
    fitness: 'رياضة',
    social: 'اجتماعي',
    other: 'أخرى',
    saveHabit: 'حفظ العادة',
    markDay: 'تسجيل اليوم',
    dayMarked: 'تم التسجيل',
    deleteHabit: 'حذف',
    error: 'خطأ',
    success: 'نجاح',
    enterHabitName: 'الرجاء إدخال اسم العادة',
    habitCreated: 'تم إنشاء العادة بنجاح!',
    habitDeleted: 'تم حذف العادة',
    deleteConfirm: 'هل تريد حذف هذه العادة؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    loading: 'جاري التحميل...',
    currentStreak: 'السلسلة الحالية',
    longestStreak: 'أطول سلسلة',
    completedDays: 'أيام مكتملة',
    active: 'نشط',
    completed: 'مكتمل',
    failed: 'فشل',
    statistics: 'الإحصائيات',
    totalHabits: 'إجمالي العادات',
  },
  en: {
    myHabits: 'My Habits',
    noHabits: 'No active habits',
    startNewJourney: 'Start a new journey now!',
    createButton: 'Create Habit',
    newHabit: 'New Habit',
    habitName: 'Habit Name',
    description: 'Description (optional)',
    duration: 'Duration',
    durationUnit: 'Unit',
    category: 'Category',
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
    health: 'Health',
    productivity: 'Productivity',
    learning: 'Learning',
    fitness: 'Fitness',
    social: 'Social',
    other: 'Other',
    saveHabit: 'Save Habit',
    markDay: 'Mark Day',
    dayMarked: 'Marked',
    deleteHabit: 'Delete',
    error: 'Error',
    success: 'Success',
    enterHabitName: 'Please enter habit name',
    habitCreated: 'Habit created successfully!',
    habitDeleted: 'Habit deleted',
    deleteConfirm: 'Do you want to delete this habit?',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    completedDays: 'Completed Days',
    active: 'Active',
    completed: 'Completed',
    failed: 'Failed',
    statistics: 'Statistics',
    totalHabits: 'Total Habits',
  },
};

// ==================== COMPONENTS ====================

const StaticLogo = React.memo(({ isDark }) => (
  <View>
    <Image
      source={isDark ? require('../images/HabitD.png') : require('../images/HabitL.png')}
      style={{ width: wp('20%'), height: wp('20%') }}
      resizeMode="contain"
    />
  </View>
));

const HabitCard = ({ habit, onPress, onDelete, onMarkDay, isDark, t, isRTL }) => {
  const progress = habit.progress || {};
  const completedDays = progress.completedDays || 0;
  const totalDays = habit.duration || 30;
  const currentStreak = habit.streak?.current || 0;
  const progressPercent = Math.min(100, Math.round((completedDays / totalDays) * 100));
  
  const today = new Date().toISOString().split('T')[0];
  const isTodayMarked = habit.completedDates?.includes(today);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginBottom: hp('2%') }}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#334155'] : ['#ffffff', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.habitCard}
      >
        <View style={[styles.habitHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff' }]}>
            <MaterialCommunityIcons 
              name={getCategoryIcon(habit.category)} 
              size={wp('6%')} 
              color={COLORS.primary} 
            />
          </View>
          
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.habitTitle, { color: isDark ? COLORS.white : COLORS.dark }]}>
              {habit.habitName}
            </Text>
            {habit.description && (
              <Text style={[styles.habitSubtitle, { color: COLORS.gray }]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.habitStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { color: COLORS.gray }]}>🔥 {t.currentStreak}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{completedDays}</Text>
            <Text style={[styles.statLabel, { color: COLORS.gray }]}>{t.completedDays}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {habit.streak?.longest || 0}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.gray }]}>{t.longestStreak}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.progressLabel, { color: COLORS.gray }]}>
              {completedDays} / {totalDays} {t.days}
            </Text>
            <Text style={[styles.progressPercent, { color: COLORS.primary }]}>{progressPercent}%</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[...COLORS.primaryGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={onMarkDay} 
          disabled={isTodayMarked}
          style={{ marginTop: hp('1%') }}
        >
          <LinearGradient
            colors={isTodayMarked ? [COLORS.gray, COLORS.gray] : [...COLORS.successGradient]}
            style={styles.markDayButton}
          >
            <MaterialCommunityIcons 
              name={isTodayMarked ? "check-circle" : "calendar-check"} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.markDayText}>
              {isTodayMarked ? t.dayMarked : t.markDay}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getCategoryIcon = (category) => {
  const icons = {
    health: 'heart-pulse',
    productivity: 'briefcase',
    learning: 'book-open-variant',
    fitness: 'dumbbell',
    social: 'account-group',
    other: 'star',
  };
  return icons[category] || 'star';
};

// ==================== MAIN SCREEN ====================
export default function HabitsScreen({ navigation }) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Create form state
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [durationUnit, setDurationUnit] = useState('days');
  const [category, setCategory] = useState('other');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const t = translations[language];
  const isRTL = language === 'ar';
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const secondaryTextColor = COLORS.gray;
  const inputColor = isDark ? COLORS.darkCard : COLORS.white;
  const borderColor = isDark ? COLORS.darkBorder : '#e2e8f0';

  // ==================== LOAD DATA ====================
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching habits...');
      
      const response = await api.getHabits('active');
      
      if (response.success) {
        console.log('✅ Loaded', response.habits.length, 'habits');
        setHabits(response.habits);
      }
    } catch (error) {
      console.error('❌ Error fetching habits:', error);
      Alert.alert(t.error, error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [t]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getHabitsStats();
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
    fetchStats();
  }, [fetchHabits, fetchStats]);

  // Load Interstitial Ad
  useEffect(() => {
    AdsController.loadInterstitial();
  }, []);

  // Handle Back Button
  useEffect(() => {
    const backAction = () => {
      if (viewMode !== 'list') {
        setViewMode('list');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [viewMode]);

  // ==================== ACTIONS ====================
  const handleCreateHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert(t.error, t.enterHabitName);
      return;
    }

    try {
      setLoading(true);
      console.log('🆕 Creating habit...');

      const habitData = {
        habitName: habitName.trim(),
        description: description.trim() || undefined,
        duration: parseInt(duration),
        durationUnit,
        category,
      };

      const response = await api.createHabit(habitData);

      if (response.success) {
        console.log('✅ Habit created:', response.habit);
        
        Alert.alert(t.success, t.habitCreated);
        
        // Reset form
        setHabitName('');
        setDescription('');
        setDuration('30');
        setDurationUnit('days');
        setCategory('other');
        
        // Refresh list
        await fetchHabits();
        await fetchStats();
        
        setViewMode('list');
        
        // Show ad
        AdsController.showInterstitial();
      }
    } catch (error) {
      console.error('❌ Create habit error:', error);
      Alert.alert(t.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    Alert.alert(
      t.deleteHabit,
      t.deleteConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🗑️ Deleting habit:', habitId);

              const response = await api.deleteHabit(habitId);

              if (response.success) {
                console.log('✅ Habit deleted');
                Alert.alert(t.success, t.habitDeleted);
                
                await fetchHabits();
                await fetchStats();
              }
            } catch (error) {
              console.error('❌ Delete habit error:', error);
              Alert.alert(t.error, error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkDay = async (habitId) => {
    try {
      console.log('✅ Marking day for habit:', habitId);
      
      const today = new Date().toISOString().split('T')[0];
      const response = await api.markHabitDay(habitId, today, 'تم بنجاح');

      if (response.success) {
        console.log('✅ Day marked successfully');
        
        // Update local state
        setHabits(prev => prev.map(h => 
          h._id === habitId ? response.habit : h
        ));
        
        await fetchStats();
        
        // Show ad
        AdsController.showInterstitial();
      }
    } catch (error) {
      console.error('❌ Mark day error:', error);
      Alert.alert(t.error, error.message);
    }
  };

  // ==================== VIEWS ====================
  const renderListView = () => (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.rowHeader}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
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
                style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} 
                onPress={toggleLanguage}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerText, { color: textColor }]}>
                  {language === 'en' ? 'AR' : 'EN'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} 
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

        <View style={styles.logoSection}>
          <StaticLogo isDark={isDark} />
        </View>

        <View style={{ paddingHorizontal: wp('4%') }}>
          {/* Statistics Card */}
          {stats && (
            <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
              <LinearGradient
                colors={[...COLORS.primaryGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsHeader}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.white} />
                <Text style={styles.statsHeaderText}>{t.statistics}</Text>
              </LinearGradient>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: COLORS.primary }]}>{stats.total}</Text>
                  <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>{t.totalHabits}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: COLORS.success }]}>{stats.active}</Text>
                  <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>{t.active}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: COLORS.warning }]}>{stats.completed}</Text>
                  <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>{t.completed}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: COLORS.danger }]}>{stats.failed}</Text>
                  <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>{t.failed}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Habits List */}
          <Text style={[styles.sectionTitle, { color: textColor, marginTop: hp('3%'), marginBottom: hp('2%') }]}>
            {t.myHabits}
          </Text>

          {habits.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
              <MaterialCommunityIcons name="trophy-broken" size={wp('15%')} color={COLORS.gray} />
              <Text style={[styles.emptyText, { color: textColor }]}>{t.noHabits}</Text>
              <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>{t.startNewJourney}</Text>
            </View>
          ) : (
            habits.map(habit => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onPress={() => {}}
                onDelete={() => handleDeleteHabit(habit._id)}
                onMarkDay={() => handleMarkDay(habit._id)}
                isDark={isDark}
                t={t}
                isRTL={isRTL}
              />
            ))
          )}

          <TouchableOpacity onPress={() => setViewMode('create')} style={{ marginTop: hp('2%') }}>
            <LinearGradient colors={[...COLORS.primaryGradient]} style={styles.createButtonMain}>
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
              <Text style={styles.createButtonText}>{t.createButton}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={{ alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
        <BannerAd unitId={AdUnits.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    </View>
  );

  const renderCreateView = () => (
    <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.rowHeader}>
          <TouchableOpacity 
            onPress={() => setViewMode('list')} 
            style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
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
              style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} 
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerText, { color: textColor }]}>
                {language === 'en' ? 'AR' : 'EN'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} 
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

      <View style={[styles.card, { backgroundColor: cardColor, marginTop: 10 }]}>
        <LinearGradient colors={[...COLORS.primaryGradient]} style={styles.cardHeader}>
          <MaterialCommunityIcons name="flag-checkered" size={24} color={COLORS.white} />
          <Text style={styles.cardHeaderText}>{t.newHabit}</Text>
        </LinearGradient>
        
        <View style={styles.cardBody}>
          {/* Habit Name */}
          <Text style={[styles.label, { color: textColor }]}>{t.habitName}</Text>
          <TextInput 
            style={[styles.input, { 
              color: textColor, 
              borderColor, 
              backgroundColor: inputColor, 
              textAlign: isRTL ? 'right' : 'left' 
            }]}
            placeholder={t.habitName}
            placeholderTextColor={secondaryTextColor}
            value={habitName}
            onChangeText={setHabitName}
          />

          {/* Description */}
          <Text style={[styles.label, { color: textColor }]}>{t.description}</Text>
          <TextInput 
            style={[styles.input, styles.textArea, { 
              color: textColor, 
              borderColor, 
              backgroundColor: inputColor, 
              textAlign: isRTL ? 'right' : 'left' 
            }]}
            placeholder={t.description}
            placeholderTextColor={secondaryTextColor}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Duration */}
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}>
              <Text style={[styles.label, { color: textColor }]}>{t.duration}</Text>
              <TextInput 
                style={[styles.input, { 
                  color: textColor, 
                  borderColor, 
                  backgroundColor: inputColor,
                  textAlign: 'center'
                }]}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: textColor }]}>{t.durationUnit}</Text>
              <View style={[styles.pickerContainer, { borderColor, backgroundColor: inputColor }]}>
                {['days', 'weeks', 'months'].map(unit => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setDurationUnit(unit)}
                    style={[
                      styles.pickerOption,
                      durationUnit === unit && styles.pickerOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: durationUnit === unit ? COLORS.white : textColor }
                    ]}>
                      {t[unit]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: textColor }]}>{t.category}</Text>
          <View style={styles.categoryGrid}>
            {['health', 'productivity', 'learning', 'fitness', 'social', 'other'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryButton,
                  { 
                    borderColor, 
                    backgroundColor: category === cat ? COLORS.primary : inputColor 
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name={getCategoryIcon(cat)} 
                  size={24} 
                  color={category === cat ? COLORS.white : textColor} 
                />
                <Text style={[
                  styles.categoryText,
                  { color: category === cat ? COLORS.white : textColor }
                ]}>
                  {t[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            onPress={handleCreateHabit} 
            disabled={loading || !habitName.trim()}
            style={{ marginTop: 30 }}
          >
            <LinearGradient colors={[...COLORS.successGradient]} style={styles.saveButton}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={24} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>{t.saveHabit}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // ==================== MAIN RENDER ====================
  if (initialLoading) {
    return (
      <LinearGradient 
        colors={isDark ? [...COLORS.darkGradient] : [COLORS.light, COLORS.white]} 
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <StaticLogo isDark={isDark} />
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={isDark ? [...COLORS.darkGradient] : [COLORS.light, COLORS.white]} 
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {viewMode === 'list' ? renderListView() : renderCreateView()}
    </LinearGradient>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingHorizontal: wp('4%'), paddingVertical: hp('1.5%'), paddingTop: hp('5%') },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  languageThemeContainer: { flexDirection: 'row', gap: wp('2%') },
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
  
  logoSection: { alignItems: 'center', marginBottom: hp('2%') },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  
  statsCard: { borderRadius: 16, overflow: 'hidden', elevation: 4, marginBottom: hp('2%') },
  statsHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    gap: 10 
  },
  statsHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 10 
  },
  statBox: { 
    width: '50%', 
    padding: 15, 
    alignItems: 'center' 
  },
  statBoxValue: { fontSize: 32, fontWeight: 'bold' },
  statBoxLabel: { fontSize: 12, marginTop: 5 },
  
  habitCard: { 
    borderRadius: 16, 
    padding: 15, 
    elevation: 3 
  },
  habitHeader: { 
    alignItems: 'center', 
    gap: 15, 
    marginBottom: 15 
  },
  iconBox: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  habitTitle: { fontSize: 18, fontWeight: 'bold' },
  habitSubtitle: { fontSize: 12, marginTop: 2 },
  deleteButton: { 
    padding: 8, 
    borderRadius: 8 
  },
  
  habitStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 15, 
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, marginTop: 4 },
  
  progressSection: {},
  progressRow: { 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  progressLabel: { fontSize: 12 },
  progressPercent: { fontWeight: 'bold', fontSize: 12 },
  progressBarBg: { 
    height: 6, 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  
  markDayButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    borderRadius: 10, 
    gap: 8 
  },
  markDayText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  emptyState: { 
    alignItems: 'center', 
    padding: 40, 
    borderRadius: 20 
  },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { marginTop: 5 },
  
  createButtonMain: { 
    padding: 15, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  card: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    elevation: 4, 
    marginHorizontal: wp('4%'), 
    marginBottom: 20 
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    gap: 10 
  },
  cardHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardBody: { padding: 15 },
  
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 16 
  },
  textArea: { 
    height: 80, 
    textAlignVertical: 'top' 
  },
  
  row: { alignItems: 'flex-end', marginTop: 15 },
  
  pickerContainer: { 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden',
    flexDirection: 'row'
  },
  pickerOption: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center' 
  },
  pickerOptionSelected: { 
    backgroundColor: COLORS.primary 
  },
  pickerOptionText: { fontSize: 14, fontWeight: '600' },
  
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginTop: 10 
  },
  categoryButton: { 
    width: '30%', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: 'center', 
    gap: 8 
  },
  categoryText: { fontSize: 12, fontWeight: '600' },
  
  saveButton: { 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});