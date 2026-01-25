// screens/LanguageScreen.js - CONNECTED TO BACKEND
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  info: '#06b6d4',
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
    title: 'تعلم الإنجليزية',
    currentGroup: 'المجموعة الحالية',
    wordsLearned: 'كلمات متعلمة',
    totalWords: 'إجمالي الكلمات',
    currentStreak: 'السلسلة الحالية',
    learnedToday: 'تعلمت اليوم',
    markAsLearned: 'تعلمتها',
    loading: 'جاري التحميل...',
    noWords: 'لا توجد كلمات',
    startLearning: 'ابدأ التعلم',
    congratulations: 'مبروك!',
    groupCompleted: 'أكملت هذه المجموعة!',
    nextGroup: 'المجموعة التالية',
    error: 'خطأ',
    success: 'نجاح',
    wordLearned: 'تم تعلم الكلمة!',
    statistics: 'الإحصائيات',
  },
  en: {
    title: 'Learn English',
    currentGroup: 'Current Group',
    wordsLearned: 'Words Learned',
    totalWords: 'Total Words',
    currentStreak: 'Current Streak',
    learnedToday: 'Learned Today',
    markAsLearned: 'Mark as Learned',
    loading: 'Loading...',
    noWords: 'No words',
    startLearning: 'Start Learning',
    congratulations: 'Congratulations!',
    groupCompleted: 'You completed this group!',
    nextGroup: 'Next Group',
    error: 'Error',
    success: 'Success',
    wordLearned: 'Word learned!',
    statistics: 'Statistics',
  },
};

// ==================== COMPONENTS ====================

const StaticLogo = React.memo(({ isDark }) => (
  <View>
    <Image
      source={isDark ? require('../images/ENDark.png') : require('../images/ENLight.png')}
      style={{ width: wp('20%'), height: wp('20%') }}
      resizeMode="contain"
    />
  </View>
));

const WordCard = ({ word, onLearn, isDark, t, isRTL }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setIsFlipped(!isFlipped)}
      activeOpacity={0.9}
      style={{ marginBottom: hp('2%') }}
    >
      <LinearGradient
        colors={isDark ? ['#1e293b', '#334155'] : ['#ffffff', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.wordCard,
          word.isLearned && { borderWidth: 2, borderColor: COLORS.success },
        ]}
      >
        <View style={[styles.wordHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff' }]}>
            <MaterialCommunityIcons
              name={isFlipped ? 'translate' : 'book-alphabet'}
              size={wp('6%')}
              color={COLORS.primary}
            />
          </View>

          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.wordText, { color: isDark ? COLORS.white : COLORS.dark }]}>
              {isFlipped ? word.translation : word.word}
            </Text>
            {word.pronunciation && !isFlipped && (
              <Text style={[styles.pronunciation, { color: COLORS.gray }]}>
                /{word.pronunciation}/
              </Text>
            )}
          </View>

          {word.isLearned && (
            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
          )}
        </View>

        {!word.isLearned && (
          <TouchableOpacity
            onPress={onLearn}
            style={{ marginTop: hp('1%') }}
          >
            <LinearGradient
              colors={[...COLORS.successGradient]}
              style={styles.learnButton}
            >
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.learnButtonText}>{t.markAsLearned}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ==================== MAIN SCREEN ====================
export default function LanguageScreen({ navigation }) {
  const { isDark, language, toggleTheme, toggleLanguage } = useGlobal();

  const [currentWords, setCurrentWords] = useState([]);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const t = translations[language];
  const isRTL = language === 'ar';
  const textColor = isDark ? COLORS.darkText : COLORS.dark;
  const cardColor = isDark ? COLORS.darkCard : COLORS.white;
  const secondaryTextColor = COLORS.gray;

  // ==================== LOAD DATA ====================
  const fetchCurrentWords = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching current group words...');

      const response = await api.getCurrentGroupWords();

      if (response.success) {
        console.log('✅ Loaded', response.words.length, 'words');
        console.log('📊 Current group:', response.groupNumber);
        
        setCurrentWords(response.words);
        setProgress(response.progress);
      }
    } catch (error) {
      console.error('❌ Error fetching words:', error);
      Alert.alert(t.error, error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getLearningStats();

      if (response.success) {
        console.log('📈 Stats:', response.stats);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.getLearningProgress();

      if (response.success) {
        setProgress(response.progress);
      }
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
    }
  };

  useEffect(() => {
    fetchCurrentWords();
    fetchStats();
    fetchProgress();
  }, []);

  // Load Interstitial Ad
  useEffect(() => {
    AdsController.loadInterstitial();
  }, []);

  // Handle Back Button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // ==================== ACTIONS ====================
  const handleLearnWord = async (word) => {
    try {
      console.log('✅ Learning word:', word.word);

      const response = await api.learnWord(word.wordId, word.word, word.translation);

      if (response.success) {
        console.log('✅ Word learned successfully');

        // Update local state
        setCurrentWords((prev) =>
          prev.map((w) => (w.wordId === word.wordId ? { ...w, isLearned: true } : w))
        );

        // Refresh progress and stats
        await fetchProgress();
        await fetchStats();

        // Show ad every 5 words
        const learnedCount = currentWords.filter(w => w.isLearned).length;
        if (learnedCount % 5 === 0) {
          AdsController.showInterstitial();
        }
      }
    } catch (error) {
      console.error('❌ Learn word error:', error);
      Alert.alert(t.error, error.message);
    }
  };

  // ==================== RENDER ====================
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
                  name={isRTL ? 'arrow-right' : 'arrow-left'}
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
                    <Text style={[styles.statBoxValue, { color: COLORS.primary }]}>
                      {stats.totalWordsLearned || 0}
                    </Text>
                    <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>
                      {t.wordsLearned}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: COLORS.success }]}>
                      {stats.currentStreak || 0}
                    </Text>
                    <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>
                      🔥 {t.currentStreak}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: COLORS.warning }]}>
                      {progress?.currentGroup || 1}
                    </Text>
                    <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>
                      {t.currentGroup}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: COLORS.info }]}>
                      {stats.wordsReviewedToday || 0}
                    </Text>
                    <Text style={[styles.statBoxLabel, { color: secondaryTextColor }]}>
                      {t.learnedToday}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Progress Bar */}
            {progress && (
              <View style={[styles.progressCard, { backgroundColor: cardColor }]}>
                <View style={[styles.progressRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.progressLabel, { color: secondaryTextColor }]}>
                    {t.currentGroup} {progress.currentGroup}
                  </Text>
                  <Text style={[styles.progressPercent, { color: COLORS.primary }]}>
                    {progress.groupProgress?.learned || 0} / {progress.groupProgress?.total || 0}
                  </Text>
                </View>

                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={[...COLORS.primaryGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress.groupProgress?.percentage || 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Words List */}
            <Text style={[styles.sectionTitle, { color: textColor, marginTop: hp('3%'), marginBottom: hp('2%') }]}>
              {t.title}
            </Text>

            {currentWords.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <MaterialCommunityIcons name="book-open-variant" size={wp('15%')} color={COLORS.gray} />
                <Text style={[styles.emptyText, { color: textColor }]}>{t.noWords}</Text>
                <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
                  {t.startLearning}
                </Text>
              </View>
            ) : (
              currentWords.map((word) => (
                <WordCard
                  key={word.wordId}
                  word={word}
                  onLearn={() => handleLearnWord(word)}
                  isDark={isDark}
                  t={t}
                  isRTL={isRTL}
                />
              ))
            )}
          </View>
        </ScrollView>

        <View style={{ alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' }}>
          <BannerAd unitId={AdUnits.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
        </View>
      </View>
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
    gap: 10,
  },
  statsHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statBox: {
    width: '50%',
    padding: 15,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 32, fontWeight: 'bold' },
  statBoxLabel: { fontSize: 12, marginTop: 5 },

  progressCard: {
    padding: 15,
    borderRadius: 16,
    elevation: 3,
  },
  progressRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: { fontSize: 14, fontWeight: '600' },
  progressPercent: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },

  wordCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 3,
  },
  wordHeader: {
    alignItems: 'center',
    gap: 15,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordText: { fontSize: 24, fontWeight: 'bold' },
  pronunciation: { fontSize: 14, marginTop: 4 },

  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  learnButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
  },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { marginTop: 5 },
});