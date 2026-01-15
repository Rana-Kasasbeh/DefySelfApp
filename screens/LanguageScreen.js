import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// ✅ استيراد Global Context
import { useGlobal } from '../contexts/GlobalContext';

// ✅ استيراد نظام الإعلانات
import { AdUnits } from '../ads/AdConfig';
import { useInterstitialAd } from '../ads/useInterstitialAd';
import AdsController from '../ads/AdsController'; // تأكد من استيراد المتحكم

// ==================== ANIMATED LOGO COMPONENT ====================
const AnimatedLogo = ({ isDarkTheme, size = 100 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnim.start();
    pulseAnim.start();

    return () => {
      scaleAnim.stop();
      pulseAnim.stop();
    };
  }, []);

  const logoSource = isDarkTheme 
    ? require('../images/ENDark.png')
    : require('../images/ENLight.png');

  return (
    <Animated.View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      transform: [{ scale }]
    }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: (size * 0.9) / 2,
          backgroundColor: isDarkTheme ? '#3b82f620' : '#3b82f610',
          transform: [{ scale: pulse }],
          opacity: 0.5,
        }}
      />
      <Image 
        source={logoSource}
        style={{
          width: 110,
          height: 110
        }}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const LanguageScreen = ({ navigation }) => {
  // ✅ استخدام المتغيرات من السياق العام
  const { 
    isDark, 
    language, 
    toggleTheme, 
    toggleLanguage, 
    updateProgress 
  } = useGlobal();

  const auth = getAuth();
  const database = getDatabase();
  
  // ✅ نظام الإعلانات البينية
  const { showAd: showInterstitialAd, isReady: isInterstitialReady } = useInterstitialAd();
  
  // States للمنطق الداخلي للصفحة
  const [currentBatchWords, setCurrentBatchWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [activeTab, setActiveTab] = useState('words');
  const [isLoading, setIsLoading] = useState(true);
  const [allWordsFromDB, setAllWordsFromDB] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalWordsCount, setTotalWordsCount] = useState(0);
  
  // ✅ عداد الكلمات المكتملة للإعلانات
  const [wordsCompletedCount, setWordsCompletedCount] = useState(0);
  const WORDS_BEFORE_AD = 5; // إظهار إعلان بعد كل 5 كلمات

  const isRTL = language === 'ar';
  const BATCH_SIZE = 10;

  // Theme colors based on Global Context
  const backgroundColor = isDark ? '#0f172a' : '#f8fafc';
  const cardColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#475569' : '#e2e8f0';
  const accentColor = '#3b82f6';
  const successColor = '#10B981';

  const userEmail = auth.currentUser?.email;
  const userId = userEmail ? userEmail.replace(/\./g, '_') : null;

  // ==================== FIREBASE FUNCTIONS ====================
  
  const loadAllWordsFromFirebase = async () => {
    try {
      const wordsRef = ref(database, 'words');
      const snapshot = await get(wordsRef);
      
      if (snapshot.exists()) {
        const wordsData = snapshot.val();
        const wordsArray = Object.entries(wordsData).map(([id, data]) => {
          let english = '';
          let arabic = '';
          
          if (typeof data === 'object') {
            english = data.english || data.en || data.English || data.word || '';
            arabic = data.arabic || data.ar || data.Arabic || data.translation || '';
          } else if (typeof data === 'string') {
            english = data;
          }
          
          return {
            id,
            english: String(english).trim(),
            arabic: String(arabic).trim()
          };
        }).filter(word => word.english && word.arabic);
        
        console.log(`✅ تم جلب ${wordsArray.length} كلمة من Firebase`);
        return wordsArray;
      } else {
        console.warn('⚠️ لا توجد كلمات في قاعدة البيانات');
        return [];
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الكلمات من Firebase:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' 
          ? 'حدث خطأ أثناء جلب الكلمات من قاعدة البيانات' 
          : 'Error loading words from database'
      );
      return [];
    }
  };

  const loadUserProgress = async () => {
    if (!userId) return { learnedIds: [], currentBatchIndex: 0 };
    
    try {
      const userProgressRef = ref(database, `users/${userId}/wordProgress`);
      const snapshot = await get(userProgressRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const learnedIds = data.learnedWordIds || [];
        const batchIndex = data.currentBatchIndex || 0;
        
        return { learnedIds, currentBatchIndex: batchIndex };
      } else {
        return { learnedIds: [], currentBatchIndex: 0 };
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقدم المستخدم:', error);
      return { learnedIds: [], currentBatchIndex: 0 };
    }
  };

  const saveUserProgress = async (learnedIds, batchIndex) => {
    if (!userId) return;
    
    try {
      // 1. حفظ في Firebase Database
      const userProgressRef = ref(database, `users/${userId}/wordProgress`);
      await set(userProgressRef, {
        learnedWordIds: learnedIds,
        currentBatchIndex: batchIndex,
        lastUpdated: new Date().toISOString(),
        totalLearned: learnedIds.length
      });
      
      // 2. ✅ تحديث الـ Global Context (لينعكس في الصفحة الرئيسية)
      if (updateProgress) {
        await updateProgress('language', {
          completedTasks: learnedIds.length,
          totalTasks: totalWordsCount > 0 ? totalWordsCount : allWordsFromDB.length,
        });
      }
      
      console.log(`💾 تم حفظ التقدم: ${learnedIds.length} كلمة`);
    } catch (error) {
      console.error('❌ خطأ في حفظ التقدم:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'حدث خطأ أثناء حفظ التقدم' : 'Error saving progress'
      );
    }
  };

  const loadBatch = (allWords, learnedIds, batchIndex) => {
    const unlearnedWords = allWords.filter(word => !learnedIds.includes(word.id));
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = startIndex + BATCH_SIZE;
    return unlearnedWords.slice(startIndex, endIndex);
  };

  useEffect(() => {
    const initializeData = async () => {
      if (!userId) {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Alert',
          language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first',
          [{ 
            text: language === 'ar' ? 'حسناً' : 'OK',
            onPress: () => navigation?.navigate?.('Login') || navigation?.goBack?.()
          }]
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const allWords = await loadAllWordsFromFirebase();
        
        if (allWords.length === 0) {
          Alert.alert(
            language === 'ar' ? 'تنبيه' : 'Notice',
            language === 'ar' 
              ? 'لا توجد كلمات في قاعدة البيانات.' 
              : 'No words in database.'
          );
          setIsLoading(false);
          return;
        }
        
        setAllWordsFromDB(allWords);
        setTotalWordsCount(allWords.length);
        
        const userProgress = await loadUserProgress();
        const { learnedIds, currentBatchIndex: savedBatchIndex } = userProgress;
        
        const learnedWordsData = allWords.filter(word => learnedIds.includes(word.id));
        setLearnedWords(learnedWordsData);
        
        const currentBatch = loadBatch(allWords, learnedIds, savedBatchIndex);
        setCurrentBatchWords(currentBatch);
        setCurrentBatchIndex(savedBatchIndex);
        
      } catch (error) {
        console.error('❌ خطأ في التهيئة:', error);
        Alert.alert(
          language === 'ar' ? 'خطأ' : 'Error',
          language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [userId]);

  const speakWord = (text, lang) => {
    try {
      if (Speech && Speech.speak) {
        Speech.speak(text, {
          language: lang === 'ar' ? 'ar-SA' : 'en-US',
          pitch: 1.0,
          rate: 0.8
        });
      }
    } catch (e) {
      console.log('Speech not available:', e);
    }
  };

  // ✅ دالة لإظهار الإعلان البيني
  const tryShowInterstitialAd = async () => {
    if (isInterstitialReady) {
      try {
        await showInterstitialAd();
        console.log('✅ تم عرض الإعلان البيني');
      } catch (error) {
        console.log('⚠️ لم يتم عرض الإعلان:', error);
      }
    }
  };

  const markAsLearned = async (wordId) => {
    try {
      const wordToLearn = currentBatchWords.find(w => w.id === wordId);
      if (!wordToLearn) return;
      
      const updatedCurrentBatch = currentBatchWords.filter(w => w.id !== wordId);
      const updatedLearnedWords = [...learnedWords, wordToLearn];
      
      setCurrentBatchWords(updatedCurrentBatch);
      setLearnedWords(updatedLearnedWords);
      
      const learnedIds = updatedLearnedWords.map(w => w.id);
      let newBatchIndex = currentBatchIndex;
      
      // ✅ زيادة عداد الكلمات المكتملة
      const newWordsCount = wordsCompletedCount + 1;
      setWordsCompletedCount(newWordsCount);
      
      // ✅ عرض إعلان بعد كل 5 كلمات
      if (newWordsCount >= WORDS_BEFORE_AD) {
        setWordsCompletedCount(0); // إعادة العداد
        await tryShowInterstitialAd();
      }
      
      if (updatedCurrentBatch.length === 0) {
        newBatchIndex = currentBatchIndex + 1;
        const newBatch = loadBatch(allWordsFromDB, learnedIds, newBatchIndex);
        
        if (newBatch.length > 0) {
          setCurrentBatchWords(newBatch);
          setCurrentBatchIndex(newBatchIndex);
          
          Alert.alert(
            language === 'ar' ? '🎉 رائع' : '🎉 Great',
            language === 'ar' 
              ? `أكملت المجموعة ${currentBatchIndex + 1}!` 
              : `Completed batch ${currentBatchIndex + 1}!`,
            [{ text: language === 'ar' ? 'حسناً' : 'OK' }]
          );
        } else {
          Alert.alert(
            language === 'ar' ? '🎊 مبروك' : '🎊 Congratulations',
            language === 'ar' ? 'أكملت جميع الكلمات!' : 'You completed all words!',
            [{ text: language === 'ar' ? 'حسناً' : 'OK' }]
          );
        }
      }
      
      await saveUserProgress(learnedIds, newBatchIndex);
      
    } catch (error) {
      console.error('❌ خطأ في تعليم الكلمة:', error);
    }
  };

  const unmarkAsLearned = async (wordId) => {
    try {
      const wordToUnlearn = learnedWords.find(w => w.id === wordId);
      if (!wordToUnlearn) return;
      
      const updatedLearnedWords = learnedWords.filter(w => w.id !== wordId);
      const updatedCurrentBatch = [...currentBatchWords, wordToUnlearn];
      
      setLearnedWords(updatedLearnedWords);
      setCurrentBatchWords(updatedCurrentBatch);
      
      const learnedIds = updatedLearnedWords.map(w => w.id);
      await saveUserProgress(learnedIds, currentBatchIndex);
      
      Alert.alert(
        language === 'ar' ? '↩️ تم' : '↩️ Done',
        language === 'ar' ? 'تم إرجاع الكلمة' : 'Word returned',
        [{ text: language === 'ar' ? 'حسناً' : 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ خطأ في إلغاء تعلم الكلمة:', error);
    }
  };

  const renderWordItem = ({ item, isAchievement = false }) => {
    return (
      <View style={[styles.wordCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
        <View style={[styles.wordCardContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            {/* English */}
            <View style={[styles.wordRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.languageIcon, { backgroundColor: `${accentColor}20` }]}>
                <Text style={{ color: accentColor, fontSize: wp('3%'), fontWeight: 'bold' }}>EN</Text>
              </View>
              <Text style={[styles.wordEnglish, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                {item.english}
              </Text>
              <TouchableOpacity 
                onPress={() => speakWord(item.english, 'en')}
                style={[styles.miniSpeakButton, { backgroundColor: `${accentColor}30` }]}
              >
                <MaterialCommunityIcons name="volume-high" size={16} color={accentColor} />
              </TouchableOpacity>
            </View>

            {/* Arabic */}
            <View style={[styles.wordRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: hp('1%') }]}>
              <View style={[styles.languageIcon, { backgroundColor: `${successColor}20` }]}>
                <Text style={{ color: successColor, fontSize: wp('3%'), fontWeight: 'bold' }}>AR</Text>
              </View>
              <Text style={[styles.wordArabic, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                {item.arabic}
              </Text>
              <TouchableOpacity 
                onPress={() => speakWord(item.arabic, 'ar')}
                style={[styles.miniSpeakButton, { backgroundColor: `${successColor}30` }]}
              >
                <MaterialCommunityIcons name="volume-high" size={16} color={successColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Done Button or Unmark Button */}
          {!isAchievement ? (
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: accentColor }]}
              onPress={() => markAsLearned(item.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="check-bold" size={20} color="#fff" />
              <Text style={styles.doneButtonText}>
                {language === 'ar' ? 'تم' : 'Done'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: 'center', gap: hp('0.5%') }}>
              <View style={[styles.achievementBadge, { backgroundColor: successColor }]}>
                <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
              </View>
              <TouchableOpacity 
                onPress={() => unmarkAsLearned(item.id)}
                style={[styles.unmarkButton]}
              >
                <MaterialCommunityIcons name="undo-variant" size={16} color={secondaryTextColor} />
                <Text style={[styles.unmarkButtonText, { color: secondaryTextColor }]}>
                  {language === 'ar' ? 'إلغاء' : 'Undo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <AnimatedLogo isDarkTheme={isDark} size={wp('30%')} />
        <Text style={[styles.loadingText, { color: textColor, marginTop: hp('3%') }]}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor }]}>
      {/* ✅ ScrollView يأخذ المساحة المتبقية فقط (flex: 1)
         الإعلان أصبح خارجه في الأسفل
      */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.rowHeader}>
            <TouchableOpacity 
              onPress={() => navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate?.("DefySelfIcons")}
              style={[styles.headerButton, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={Math.min(wp('5.5%'), 22)} color={textColor} />
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

        {/* Logo */}
        <View style={styles.logoContainer}>
          <AnimatedLogo isDarkTheme={isDark} size={wp('25%')} />
          <Text style={[styles.appTitle, { color: textColor, textAlign: 'center', marginTop: hp('2%') }]}>
            {language === 'ar' ? 'تعلم الكلمات' : 'Learn Words'}
          </Text>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: cardColor, borderColor: `${accentColor}50` }]}>
          <View style={[styles.statItem, { borderRightWidth: isRTL ? 0 : 1, borderLeftWidth: isRTL ? 1 : 0, borderColor: borderColor }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${accentColor}20` }]}>
              <MaterialCommunityIcons name="trophy" size={30} color={accentColor} />
            </View>
            <Text style={[styles.statNumber, { color: accentColor }]}>{learnedWords.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
              {language === 'ar' ? 'تعلمتها' : 'Learned'}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${successColor}20` }]}>
              <MaterialCommunityIcons name="book-open-variant" size={30} color={successColor} />
            </View>
            <Text style={[styles.statNumber, { color: successColor }]}>{currentBatchWords.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
              {language === 'ar' ? 'متبقية' : 'Remaining'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'words' && styles.activeTab,
              { 
                backgroundColor: activeTab === 'words' ? accentColor : 'transparent',
                borderColor: activeTab === 'words' ? accentColor : borderColor
              }
            ]}
            onPress={() => setActiveTab('words')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="book-open-page-variant" 
              size={22} 
              color={activeTab === 'words' ? '#fff' : textColor} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'words' ? '#fff' : textColor }
            ]}>
              {language === 'ar' ? 'الكلمات' : 'Words'}
            </Text>
            <View style={[styles.badge, { backgroundColor: activeTab === 'words' ? '#fff' : accentColor }]}>
              <Text style={[styles.badgeText, { color: activeTab === 'words' ? accentColor : '#fff' }]}>
                {currentBatchWords.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'achievements' && styles.activeTab,
              { 
                backgroundColor: activeTab === 'achievements' ? successColor : 'transparent',
                borderColor: activeTab === 'achievements' ? successColor : borderColor
              }
            ]}
            onPress={() => setActiveTab('achievements')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="trophy-variant" 
              size={22} 
              color={activeTab === 'achievements' ? '#fff' : textColor} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'achievements' ? '#fff' : textColor }
            ]}>
              {language === 'ar' ? 'الإنجازات' : 'Achievements'}
            </Text>
            <View style={[styles.badge, { backgroundColor: activeTab === 'achievements' ? '#fff' : successColor }]}>
              <Text style={[styles.badgeText, { color: activeTab === 'achievements' ? successColor : '#fff' }]}>
                {learnedWords.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'words' ? (
            currentBatchWords.length > 0 ? (
              <FlatList
                data={currentBatchWords}
                renderItem={({ item }) => renderWordItem({ item, isAchievement: false })}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: hp('1.5%') }} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="check-all" size={60} color={accentColor} />
                <Text style={[styles.emptyText, { color: textColor }]}>
                  {language === 'ar' ? 'رائع! أكملت جميع الكلمات 🎉' : 'Great! All words completed 🎉'}
                </Text>
                <Text style={[styles.emptySubText, { color: secondaryTextColor, marginTop: hp('1%') }]}>
                  {language === 'ar' 
                    ? `تعلمت ${learnedWords.length} من ${totalWordsCount} كلمة`
                    : `Learned ${learnedWords.length} of ${totalWordsCount} words`
                  }
                </Text>
              </View>
            )
          ) : (
            learnedWords.length > 0 ? (
              <FlatList
                data={learnedWords}
                renderItem={({ item }) => renderWordItem({ item, isAchievement: true })}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: hp('1.5%') }} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={60} color={secondaryTextColor} />
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                  {language === 'ar' ? 'لم تتعلم أي كلمة بعد' : 'No achievements yet'}
                </Text>
                <Text style={[styles.emptySubText, { color: secondaryTextColor, marginTop: hp('1%') }]}>
                  {language === 'ar' 
                    ? 'ابدأ بتعلم الكلمات لتراها هنا!'
                    : 'Start learning words to see them here!'
                  }
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* ✅ إعلان بانر في نهاية الشاشة (ثابت) */}
      {AdsController.shouldShowBannerOrNative() && (
        <View style={[styles.bannerAdContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
          <BannerAd
            unitId={AdUnits.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollView: { flex: 1 },
  container: { flexGrow: 1, padding: wp('4%'), paddingBottom: hp('4%') },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.min(wp('4.5%'), 18),
    fontWeight: '600',
  },
  
  header: { paddingHorizontal: wp('4%'), paddingVertical: hp('1.5%'), paddingTop: hp('5%') },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  languageThemeContainer: { flexDirection: 'row', gap: wp('2%') },
  headerButton: { 
    width: Math.min(wp('10%'), 45), 
    height: Math.min(wp('10%'), 45), 
    borderRadius: Math.min(wp('2.5%'), 12), 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  headerText: { fontSize: Math.min(wp('4%'), 16), fontWeight: '600' },
  
  logoContainer: { alignItems: 'center', marginVertical: hp('2%') },
  appTitle: { fontSize: Math.min(wp('6.5%'), 26), fontWeight: 'bold' },
  
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    padding: wp('5%'),
    borderRadius: Math.min(wp('4%'), 16),
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
  },
  statIconContainer: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1%'),
  },
  statNumber: {
    fontSize: Math.min(wp('8%'), 32),
    fontWeight: 'bold',
    marginBottom: hp('0.5%'),
  },
  statLabel: {
    fontSize: Math.min(wp('3.5%'), 14),
    fontWeight: '600',
  },
  
  tabsContainer: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    gap: wp('3%'),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    borderRadius: Math.min(wp('3%'), 12),
    borderWidth: 2,
    gap: wp('2%'),
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: Math.min(wp('4%'), 16),
    fontWeight: 'bold',
  },
  badge: {
    minWidth: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1.5%'),
  },
  badgeText: {
    fontSize: Math.min(wp('3%'), 12),
    fontWeight: 'bold',
  },
  
  content: {
    marginHorizontal: wp('4%'),
  },
  
  wordCard: {
    padding: wp('4%'),
    borderRadius: Math.min(wp('4%'), 16),
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardContent: {
    alignItems: 'center',
    gap: wp('3%'),
  },
  wordRow: {
    alignItems: 'center',
    gap: wp('2%'),
  },
  languageIcon: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordEnglish: {
    flex: 1,
    fontSize: Math.min(wp('4.5%'), 18),
    fontWeight: 'bold',
  },
  wordArabic: {
    flex: 1,
    fontSize: Math.min(wp('4.5%'), 18),
    fontWeight: '600',
  },
  miniSpeakButton: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: Math.min(wp('2.5%'), 10),
    gap: wp('1.5%'),
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: Math.min(wp('4%'), 16),
    fontWeight: 'bold',
  },
  achievementBadge: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    paddingVertical: hp('0.5%'),
    paddingHorizontal: wp('2%'),
  },
  unmarkButtonText: {
    fontSize: Math.min(wp('3%'), 12),
    fontWeight: '600',
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
  },
  emptyText: {
    fontSize: Math.min(wp('4.5%'), 18),
    fontWeight: '600',
    marginTop: hp('2%'),
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: Math.min(wp('3.5%'), 14),
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // ✅ Banner Ad Container (تم تحديثه ليكون ثابتاً)
  bannerAdContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5, // مسافة إضافية للآيفون في الأسفل
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});

export default LanguageScreen;