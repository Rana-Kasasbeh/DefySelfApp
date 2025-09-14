import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  I18nManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
//import { LinearGradient } from 'expo-linear-gradient';

type Language = 'ar' | 'en';

type Habit = {
  id: string;
  name: string;
  type: 'good' | 'bad';
  createdAt: Date;
};

type DailyProgress = {
  date: string;
  completedGoodHabits: string[];
  completedBadHabits: string[];
  score: number;
};

type Challenge = {
  id: string;
  name: string;
  duration: number;
  startDate: Date;
  habits: Habit[];
  dailyProgress: DailyProgress[];
  isActive: boolean;
};

const translations = {
  ar: {
    appTitle: 'تحدي العادات الذكي',
    newChallenge: 'تحدٍ جديد',
    challengeName: 'اسم التحدي',
    challengeDuration: 'مدة التحدي (أيام)',
    addHabit: 'إضافة عادة',
    goodHabits: 'العادات الجيدة',
    badHabits: 'العادات السيئة',
    habitPlaceholder: 'اكتب عادة جديدة...',
    startChallenge: 'ابدأ التحدي',
    dailyProgress: 'التقدم اليومي',
    todayScore: 'نقاط اليوم',
    overallProgress: 'التقدم العام',
    daysCompleted: 'الأيام المنجزة',
    averageScore: 'المتوسط العام',
    markAsDone: 'تم الإنجاز',
    achievements: 'الإنجازات',
    streakDays: 'أيام متتالية',
    perfectDays: 'أيام مثالية',
    backToSetup: 'العودة للإعداد',
    day: 'يوم',
    of: 'من',
    saveProgress: 'حفظ التقدم',
  },
  en: {
    appTitle: 'Smart Habits Challenge',
    newChallenge: 'New Challenge',
    challengeName: 'Challenge Name',
    challengeDuration: 'Challenge Duration (days)',
    addHabit: 'Add Habit',
    goodHabits: 'Good Habits',
    badHabits: 'Bad Habits',
    habitPlaceholder: 'Write a new habit...',
    startChallenge: 'Start Challenge',
    dailyProgress: 'Daily Progress',
    todayScore: 'Today Score',
    overallProgress: 'Overall Progress',
    daysCompleted: 'Days Completed',
    averageScore: 'Average Score',
    markAsDone: 'Mark as Done',
    achievements: 'Achievements',
    streakDays: 'Streak Days',
    perfectDays: 'Perfect Days',
    backToSetup: 'Back to Setup',
    day: 'Day',
    of: 'of',
    saveProgress: 'Save Progress',
  },
};

export default function SmartHabitsChallenge() {
  const [language, setLanguage] = useState<Language>('ar');
  const [isDark, setIsDark] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeName, setChallengeName] = useState('');
  const [challengeDuration, setChallengeDuration] = useState(30);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [habitType, setHabitType] = useState<'good' | 'bad'>('good');
  const [currentDay, setCurrentDay] = useState(1);
  const [dailyHabitsState, setDailyHabitsState] = useState<{ [key: string]: boolean }>({});

  const t = translations[language];

  // Handle RTL for Arabic
  useEffect(() => {
    I18nManager.forceRTL(language === 'ar');
  }, [language]);

  useEffect(() => {
    if (activeChallenge) {
      const today = new Date();
      const startDate = new Date(activeChallenge.startDate);
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setCurrentDay(Math.max(1, Math.min(daysDiff, activeChallenge.duration)));
    }
  }, [activeChallenge]);

  const addHabit = () => {
    if (newHabit.trim()) {
      const habit: Habit = {
        id: Date.now().toString(),
        name: newHabit.trim(),
        type: habitType,
        createdAt: new Date(),
      };
      setHabits([...habits, habit]);
      setNewHabit('');
    }
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const startChallenge = () => {
    if (challengeName.trim() && habits.length > 0) {
      const challenge: Challenge = {
        id: Date.now().toString(),
        name: challengeName.trim(),
        duration: challengeDuration,
        startDate: new Date(),
        habits: habits,
        dailyProgress: [],
        isActive: true,
      };
      setActiveChallenge(challenge);
      setDailyHabitsState({});
    }
  };

  const toggleHabit = (habitId: string) => {
    setDailyHabitsState(prev => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  const saveDailyProgress = () => {
    if (!activeChallenge) return;

    const today = new Date().toISOString().split('T')[0];
    const completedGoodHabits = habits
      .filter(h => h.type === 'good' && dailyHabitsState[h.id])
      .map(h => h.id);
    const completedBadHabits = habits
      .filter(h => h.type === 'bad' && !dailyHabitsState[h.id])
      .map(h => h.id);

    const goodHabitsCount = habits.filter(h => h.type === 'good').length;
    const badHabitsCount = habits.filter(h => h.type === 'bad').length;
    const totalHabits = goodHabitsCount + badHabitsCount;

    const score =
      totalHabits > 0
        ? Math.round(((completedGoodHabits.length + completedBadHabits.length) / totalHabits) * 100)
        : 0;

    const todayProgress: DailyProgress = {
      date: today,
      completedGoodHabits,
      completedBadHabits,
      score,
    };

    const updatedProgress = activeChallenge.dailyProgress.filter(p => p.date !== today);
    updatedProgress.push(todayProgress);

    setActiveChallenge({
      ...activeChallenge,
      dailyProgress: updatedProgress,
    });
  };

  const getOverallStats = () => {
    if (!activeChallenge) return { daysCompleted: 0, averageScore: 0, streakDays: 0, perfectDays: 0 };

    const progress = activeChallenge.dailyProgress;
    const daysCompleted = progress.length;
    const averageScore =
      daysCompleted > 0 ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / daysCompleted) : 0;

    const perfectDays = progress.filter(p => p.score === 100).length;

    let streakDays = 0;
    const sortedProgress = progress.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    for (const p of sortedProgress) {
      if (p.score >= 80) streakDays++;
      else break;
    }

    return { daysCompleted, averageScore, streakDays, perfectDays };
  };

  const resetChallenge = () => {
    setActiveChallenge(null);
    setChallengeName('');
    setHabits([]);
    setDailyHabitsState({});
    setCurrentDay(1);
  };

  const stats = getOverallStats();
  const todayScore =
    activeChallenge?.dailyProgress.find(
      p => p.date === new Date().toISOString().split('T')[0],
    )?.score || 0;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? '#1a202c' : '#f0f4f8' },
        language === 'ar' && { flexDirection: 'row-reverse' },
      ]}
    >
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#2d3748', '#4c51bf'] : ['#c3dafe', '#ebf4ff']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Feather name="target" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: isDark ? '#e2e8f0' : '#4c51bf' }]}>{t.appTitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            style={[styles.iconButton, { backgroundColor: '#6b46c1' }]}
          >
            <Feather name="globe" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsDark(!isDark)}
            style={[styles.iconButton, { backgroundColor: '#6b46c1' }]}
          >
            {isDark ? (
              <Feather name="sun" size={20} color="#fff" />
            ) : (
              <Feather name="moon" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!activeChallenge ? (
        <>
          {/* Challenge Setup */}
          <View style={[styles.card, { backgroundColor: isDark ? '#2d3748' : '#fff' }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color="#ecc94b" />
              <Text style={[styles.cardTitle, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                {t.newChallenge}
              </Text>
            </View>
            <TextInput
              placeholder={t.challengeName}
              placeholderTextColor={isDark ? '#a0aec0' : '#718096'}
              value={challengeName}
              onChangeText={setChallengeName}
              style={[
                styles.input,
                { backgroundColor: isDark ? '#4a5568' : '#edf2f7', color: isDark ? '#e2e8f0' : '#2d3748' },
              ]}
            />
            <View style={styles.row}>
              <Text style={[styles.label, { color: isDark ? '#a0aec0' : '#4a5568' }]}>
                {t.challengeDuration}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={challengeDuration.toString()}
                onChangeText={text => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num)) setChallengeDuration(num);
                }}
                style={[
                  styles.durationInput,
                  { backgroundColor: isDark ? '#4a5568' : '#edf2f7', color: isDark ? '#e2e8f0' : '#2d3748' },
                ]}
              />
            </View>
          </View>

          {/* Habits Section */}
          <View style={[styles.card, { backgroundColor: isDark ? '#2d3748' : '#fff' }]}>
            <Text style={[styles.cardTitle, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>{t.addHabit}</Text>
            <View style={styles.row}>
              <TextInput
                placeholder={t.habitPlaceholder}
                placeholderTextColor={isDark ? '#a0aec0' : '#718096'}
                value={newHabit}
                onChangeText={setNewHabit}
                onSubmitEditing={addHabit}
                style={[
                  styles.input,
                  { flex: 1, backgroundColor: isDark ? '#4a5568' : '#edf2f7', color: isDark ? '#e2e8f0' : '#2d3748' },
                ]}
              />
              <TouchableOpacity
                onPress={() => setHabitType(habitType === 'good' ? 'bad' : 'good')}
                style={[
                  styles.habitTypeButton,
                  { backgroundColor: habitType === 'good' ? '#38a169' : '#e53e3e' },
                ]}
              >
                <Text style={styles.habitTypeButtonText}>{habitType === 'good' ? '✅' : '❌'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addHabit} style={[styles.addButton, { backgroundColor: '#6b46c1' }]}>
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Habits List */}
            <View style={styles.habitsContainer}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.habitsHeader}>
                  <Feather name="check-circle" size={18} color="#38a169" />
                  <Text style={[styles.habitsTitle, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                    {t.goodHabits}
                  </Text>
                </View>
                {habits.filter(h => h.type === 'good').map(habit => (
                  <View
                    key={habit.id}
                    style={[
                      styles.habitItem,
                      { backgroundColor: isDark ? '#4a5568' : '#edf2f7', borderColor: isDark ? '#718096' : '#cbd5e0' },
                    ]}
                  >
                    <Text style={{ color: isDark ? '#e2e8f0' : '#2d3748' }}>{habit.name}</Text>
                    <TouchableOpacity onPress={() => removeHabit(habit.id)}>
                      <Feather name="x" size={16} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={styles.habitsHeader}>
                  <Feather name="x" size={18} color="#e53e3e" />
                  <Text style={[styles.habitsTitle, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                    {t.badHabits}
                  </Text>
                </View>
                {habits.filter(h => h.type === 'bad').map(habit => (
                  <View
                    key={habit.id}
                    style={[
                      styles.habitItem,
                      { backgroundColor: isDark ? '#4a5568' : '#edf2f7', borderColor: isDark ? '#718096' : '#cbd5e0' },
                    ]}
                  >
                    <Text style={{ color: isDark ? '#e2e8f0' : '#2d3748' }}>{habit.name}</Text>
                    <TouchableOpacity onPress={() => removeHabit(habit.id)}>
                      <Feather name="x" size={16} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {challengeName && habits.length > 0 && (
              <TouchableOpacity onPress={startChallenge} style={[styles.startButton, { backgroundColor: '#6b46c1' }]}>
                <MaterialCommunityIcons name="fire" size={20} color="#fff" />
                <Text style={styles.startButtonText}>{t.startChallenge}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          {/* Active Challenge */}
          <View style={[styles.card, { backgroundColor: isDark ? '#2d3748' : '#fff' }]}>
            <View style={styles.activeHeader}>
              <Text style={[styles.activeTitle, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                {activeChallenge.name}
              </Text>
              <TouchableOpacity onPress={resetChallenge} style={[styles.resetButton, { backgroundColor: '#e53e3e' }]}>
                <Text style={styles.resetButtonText}>{t.backToSetup}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>{currentDay}</Text>
                <Text style={[styles.progressLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.day} {t.of} {activeChallenge.duration}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(currentDay / activeChallenge.duration) * 100}%`,
                      backgroundColor: '#6b46c1',
                    },
                  ]}
                />
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {Math.round((currentDay / activeChallenge.duration) * 100)}%
                </Text>
                <Text style={[styles.progressLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.overallProgress}
                </Text>
              </View>
            </View>

            {/* Daily Habits */}
            <View style={styles.habitsContainer}>
              {habits.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => toggleHabit(habit.id)}
                  style={[
                    styles.habitItem,
                    {
                      backgroundColor: dailyHabitsState[habit.id]
                        ? '#38a169'
                        : isDark
                        ? '#4a5568'
                        : '#edf2f7',
                      borderColor: isDark ? '#718096' : '#cbd5e0',
                    },
                  ]}
                >
                  <Text style={{ color: dailyHabitsState[habit.id] ? '#fff' : isDark ? '#e2e8f0' : '#2d3748' }}>
                    {habit.name}
                  </Text>
                  {dailyHabitsState[habit.id] && (
                    <Feather name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={saveDailyProgress}
              style={[styles.startButton, { backgroundColor: '#6b46c1' }]}
            >
              <Text style={styles.startButtonText}>{t.saveProgress}</Text>
            </TouchableOpacity>

            {/* Daily Score & Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {todayScore}%
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.todayScore}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {stats.daysCompleted}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.daysCompleted}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {stats.averageScore}%
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.averageScore}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {stats.streakDays}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.streakDays}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#e2e8f0' : '#2d3748' }]}>
                  {stats.perfectDays}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#a0aec0' : '#718096' }]}>
                  {t.perfectDays}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6b46c1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row' },
  iconButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  input: { padding: 12, borderRadius: 8, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14 },
  durationInput: { width: 60, padding: 8, borderRadius: 8, textAlign: 'center' },
  habitTypeButton: { padding: 12, borderRadius: 8, marginLeft: 8 },
  habitTypeButtonText: { fontSize: 16, fontWeight: 'bold' },
  addButton: { padding: 12, borderRadius: 8, marginLeft: 8 },
  habitsContainer: { flexDirection: 'row', marginTop: 8 },
  habitsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  habitsTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  habitItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeTitle: { fontSize: 18, fontWeight: 'bold' },
  resetButton: { padding: 8, borderRadius: 8 },
  resetButtonText: { color: '#fff', fontWeight: 'bold' },
  progressContainer: { marginTop: 16 },
  progressItem: { alignItems: 'center', marginBottom: 8 },
  progressNumber: { fontSize: 20, fontWeight: 'bold' },
  progressLabel: { fontSize: 12 },
  progressBarBackground: {
    height: 12,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: { height: '100%' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'space-between' },
  statItem: { width: '30%', marginBottom: 12, alignItems: 'center' },
  statNumber: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
});
