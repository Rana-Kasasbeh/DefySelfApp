import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      habits: 'Habits',
      water: 'Water Challenge',
      english: 'Learn English',
      puzzles: 'Puzzles',
      settings: 'Settings',

      // Habits
      'habits.title': 'Habits Challenge',
      'habits.todayScore': "Today's Score",
      'habits.goodHabit': 'Good Habit',
      'habits.badHabit': 'Bad Habit',
      "myHabits": "✨ My Daily Habits ✨",
      "enterHabit": "Enter a new habit",
      "addHabit": "Add Habit",
      "todayScore": "Today's Score",
      

      // Water
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

      // English Learning
      'english.title': 'Learn English',
      'english.learned': 'Learned {count} of {total} words',
      'english.categories.all': 'All',
      'english.categories.verbs': 'Verbs',
      'english.categories.nouns': 'Nouns',
      'english.categories.objects': 'Objects',
      'english.testYourself': 'Test Yourself',

      // Settings
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
    },
  },
  ar: {
    translation: {
      // Navigation
      habits: 'العادات',
      water: 'تحدي الماء',
      english: 'تعلم الإنجليزية',
      puzzles: 'الألغاز',
      settings: 'الإعدادات',

      // Habits
      'habits.title': 'تحدي العادات',
      'habits.todayScore': 'نتيجة اليوم',
      'habits.goodHabit': 'عادة جيدة',
      'habits.badHabit': 'عادة سيئة',
     myHabits: "✨ عاداتي اليومية ✨",
      enterHabit: "أدخل عادة جديدة",
      addHabit: "إضافة عادة",
     todayScore: "تقييم اليوم" ,
     appTitle: 'تحدي العادات الذكي',
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

      // Water
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

      // English Learning
      'english.title': 'تعلم الإنجليزية',
      'english.learned': 'تعلمت {count} من {total} كلمة',
      'english.categories.all': 'الكل',
      'english.categories.verbs': 'أفعال',
      'english.categories.nouns': 'أسماء',
      'english.categories.objects': 'أشياء',
      'english.testYourself': 'اختبر نفسك',

      // Settings
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
    },
  },
};

// Initialize i18n
const initI18n = async (): Promise<void> => {
  let savedLanguage = 'ar';

  try {
    const language = await AsyncStorage.getItem('language');
    if (language) savedLanguage = language;
  } catch (error) {
    console.log('Error loading language preference:', error);
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'ar',
      interpolation: { escapeValue: false },
    });
};

initI18n();

// Listen for language change and save preference
i18n.on('languageChanged', async (lng: string) => {
  try {
    await AsyncStorage.setItem('language', lng);
  } catch (error) {
    console.log('Error saving language preference:', error);
  }
});

export default i18n;
