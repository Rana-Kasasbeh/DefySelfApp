import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import AsyncStorageLib from '@react-native-async-storage/async-storage';

// ✅ AsyncStorage متوافق مع الويب + تصحيح TypeScript
const AsyncStorage = Platform.OS === 'web'
  ? {
      getItem: async (key) => null,
      setItem: async (key, value) => {},
    }
  : AsyncStorageLib;

// 🌍 الترجمات
const resources = {
  en: {
    translation: {
      appTitle: 'Answer Detection System',
      score: 'Score',
      attempts: 'Attempts',
      startNewPuzzle: 'Start New Puzzle',
      checkAnswer: 'Check Answer',
      hint: 'Hint',
      newPuzzle: 'New Puzzle',
      correctAnswer: 'Correct Answer! Well done 🎉',
      wrongAnswer: 'Wrong answer. Correct answer: ',
      successRate: 'Success Rate',
      loading: 'Loading data...',
      enterAnswer: 'Enter your answer here...',
      lessons_db: 'Database Lessons',
      puzzles: 'Puzzles',
      wisdom_lessons: 'Wisdom Lessons',
      noQuestion: 'Question not available',

      // --- Navigation ---
      habits: 'Habits',
      water: 'Water Challenge',
      english: 'Learn English',
      settings: 'Settings',

      // --- Habits ---
      'habits.title': 'Habits Challenge',
      'habits.todayScore': "Today's Score",
      'habits.goodHabit': 'Good Habit',
      'habits.badHabit': 'Bad Habit',
      myHabits: "✨ My Daily Habits ✨",
      enterHabit: "Enter a new habit",
      addHabit: "Add Habit",
      todayScore: "Today's Score",
      appTitleHabits: 'Smart Habits Challenge',
      newChallenge: 'New Challenge',
      challengeName: 'Challenge Name',
      challengeDuration: 'Challenge Duration (days)',
      targetPercentage: 'Target Percentage',
      goodHabits: 'Good Habits',
      badHabits: 'Bad Habits',
      habitPlaceholder: 'Write a new habit...',
      startChallenge: 'Start Challenge',
      dailyProgress: 'Daily Progress',
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

      // --- Water Challenge ---
      defySelf: "DefySelf",
      calculateGoal: "Calculate Goal",
      yourAchievement: "Your achievement in today's water challenge.",
      weightQuestion: "What is your approximate weight (kg)?",
      activityQuestion: "What is your daily activity level?",
      climateQuestion: "What is the weather like?",
      options: {
        weight: { w50: "50 kg", w60: "60 kg", w70: "70 kg", w80: "80 kg" },
        activity: { low: "Low", medium: "Medium", high: "High" },
        climate: { normal: "Moderate", hot: "Hot" },
      },
      back: "Back",
      theme: "Change Theme",
      language: "Change Language",

      // --- English Learning ---
      'english.title': 'Learn English',
      'english.learned': 'Learned {count} of {total} words',
      'english.categories.all': 'All',
      'english.categories.verbs': 'Verbs',
      'english.categories.nouns': 'Nouns',
      'english.categories.objects': 'Objects',
      'english.testYourself': 'Test Yourself',

      // --- Settings ---
      'settings.title': 'Settings',
      'settings.userInfo': 'User Information',
      'settings.appearance': 'Appearance & Language',
      'settings.darkMode': 'Dark Mode',
      'settings.language': 'Language',
      'settings.data': 'Data',
      'settings.backup': 'Backup',
      'settings.import': 'Import Data',
      'settings.clearAll': 'Clear All Data',
      'settings.comingSoon': 'Coming Soon',
      
      // --- Settings Screen (إضافة جديدة) ---
      logout: 'Logout',
      logout_confirm: 'Are you sure you want to logout?',
      logout_success: 'Logged out successfully',
      cancel: 'Cancel',
      error: 'Error',
      success: 'Success',
      ok: 'OK',
      logout_error: 'An error occurred while logging out',
      active_user: 'Active User',
      appearance: 'Appearance',
      dark_mode: 'Dark Mode',
      light_mode: 'Light Mode',
      arabic: 'العربية',
      english_lang: 'English',
      language_changed: 'Language changed to',
      language_error: 'An error occurred while changing language',
      account: 'Account',
      edit_profile: 'Edit Profile',
      change_password: 'Change Password',
      about: 'About',
      about_app: 'About App',
      app_description: 'DefySelf App - Challenge Yourself',
      version: 'Version',
      rights_reserved: 'All Rights Reserved',
      privacy_policy: 'Privacy & Terms',
      coming_soon: 'Coming Soon',
      feature_development: 'This feature is under development',
      privacy_development: 'Privacy policy and terms are being prepared',
    },
  },
  ar: {
    translation: {
      appTitle: 'نظام كشف الأجوبة',
      score: 'النقاط',
      attempts: 'المحاولات',
      startNewPuzzle: 'ابدأ لغز جديد',
      checkAnswer: 'تحقق من الإجابة',
      hint: 'تلميح',
      newPuzzle: 'لغز جديد',
      correctAnswer: 'إجابة صحيحة! أحسنت 🎉',
      wrongAnswer: 'إجابة خاطئة. الإجابة الصحيحة: ',
      successRate: 'معدل النجاح',
      loading: 'جاري تحميل البيانات...',
      enterAnswer: 'اكتب إجابتك هنا...',
      lessons_db: 'دروس قاعدة البيانات',
      puzzles: 'الألغاز',
      wisdom_lessons: 'دروس الحكمة',
      noQuestion: 'السؤال غير متوفر',

      // --- Navigation ---
      habits: 'العادات',
      water: 'تحدي الماء',
      english: 'تعلم الإنجليزية',
      settings: 'الإعدادات',

      // --- Habits ---
      'habits.title': 'تحدي العادات',
      'habits.todayScore': 'نتيجة اليوم',
      'habits.goodHabit': 'عادة جيدة',
      'habits.badHabit': 'عادة سيئة',
      myHabits: "✨ عاداتي اليومية ✨",
      enterHabit: "أدخل عادة جديدة",
      addHabit: "إضافة عادة",
      todayScore: "تقييم اليوم",
      appTitleHabits: 'تحدي العادات الذكي',
      newChallenge: 'تحدٍ جديد',
      challengeName: 'اسم التحدي',
      challengeDuration: 'مدة التحدي (أيام)',
      targetPercentage: 'النسبة المرجوة',
      goodHabits: 'العادات الجيدة',
      badHabits: 'العادات السيئة',
      habitPlaceholder: 'اكتب عادة جديدة...',
      startChallenge: 'ابدأ التحدي',
      dailyProgress: 'التقدم اليومي',
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

      // --- Water Challenge ---
      defySelf: "تحدى نفسك",
      calculateGoal: "احسب الهدف",
      yourAchievement: "إنجازك في تحدي الماء لليوم.",
      weightQuestion: "ما هو وزنك (كجم) تقريبًا؟",
      activityQuestion: "ما مستوى نشاطك اليومي؟",
      climateQuestion: "ما طبيعة الطقس؟",
      options: {
        weight: { w50: "50 كجم", w60: "60 كجم", w70: "70 كجم", w80: "80 كجم" },
        activity: { low: "منخفض", medium: "متوسط", high: "عالي" },
        climate: { normal: "معتدل", hot: "حار" },
      },
      back: "رجوع",
      theme: "تغيير الثيم",
      language: "تغيير اللغة",

      // --- English Learning ---
      'english.title': 'تعلم الإنجليزية',
      'english.learned': 'تعلمت {count} من {total} كلمة',
      'english.categories.all': 'الكل',
      'english.categories.verbs': 'أفعال',
      'english.categories.nouns': 'أسماء',
      'english.categories.objects': 'أشياء',
      'english.testYourself': 'اختبر نفسك',

      // --- Settings ---
      'settings.title': 'الإعدادات',
      'settings.userInfo': 'معلومات المستخدم',
      'settings.appearance': 'المظهر واللغة',
      'settings.darkMode': 'الوضع الليلي',
      'settings.language': 'اللغة',
      'settings.data': 'البيانات',
      'settings.backup': 'نسخ احتياطي',
      'settings.import': 'استيراد البيانات',
      'settings.clearAll': 'حذف جميع البيانات',
      'settings.comingSoon': 'قريباً',
      
      // --- Settings Screen (إضافة جديدة) ---
      logout: 'تسجيل الخروج',
      logout_confirm: 'هل أنت متأكد من تسجيل الخروج من حسابك؟',
      logout_success: 'تم تسجيل الخروج بنجاح',
      cancel: 'إلغاء',
      error: 'خطأ',
      success: 'نجح',
      ok: 'حسناً',
      logout_error: 'حدث خطأ أثناء تسجيل الخروج',
      active_user: 'مستخدم نشط',
      appearance: 'المظهر',
      dark_mode: 'الوضع الداكن',
      light_mode: 'الوضع الفاتح',
      arabic: 'العربية',
      english_lang: 'English',
      language_changed: 'تم تغيير اللغة إلى',
      language_error: 'حدث خطأ أثناء تغيير اللغة',
      account: 'الحساب',
      edit_profile: 'تعديل الملف الشخصي',
      change_password: 'تغيير كلمة المرور',
      about: 'حول التطبيق',
      about_app: 'عن التطبيق',
      app_description: 'تطبيق DefySelf - تحدى نفسك',
      version: 'الإصدار',
      rights_reserved: 'جميع الحقوق محفوظة',
      privacy_policy: 'الخصوصية والشروط',
      coming_soon: 'قريباً',
      feature_development: 'هذه الميزة قيد التطوير',
      privacy_development: 'سياسة الخصوصية والشروط قيد الإعداد',
    },
  },
};

// ✅ تهيئة فورية مع تحميل اللغة المحفوظة لاحقًا
i18n.use(initReactI18next).init({
  resources,
  lng: 'ar', // اللغة الافتراضية
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// تحميل اللغة المحفوظة بعد التهيئة
(async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.log('Error loading language preference:', error);
  }
})();

// حفظ اللغة عند التغيير
i18n.on('languageChanged', async (lng) => {
  try {
    await AsyncStorage.setItem('language', lng);
  } catch (error) {
    console.log('Error saving language preference:', error);
  }
});

export default i18n;