import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

const DefySelfIcons: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const scaleAnims = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;
  const slideAnim = useRef(new Animated.Value(-Math.min(width * 0.80, 350))).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  // ✅ Icons Configuration
  const icons = [
    { id: 1, screenName: 'Water', image: require('../images/water.png') },
   
    { id: 2, screenName: 'Habits', image: require('../images/HabitL.png') },
    { id:3, screenName: 'Language', image: require('../images/ENLight.png') },
  ];

  const chunkIcons = (arr: any[], size: number) => {
    const chunks: any[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  const iconRows = chunkIcons(icons, 2);
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // إعادة تحميل الصور عند العودة للصفحة
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setImageKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  // فتح/إغلاق صفحة الإعدادات
  const openSettings = () => {
    setSettingsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -Math.min(width * 0.80, 350),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSettingsVisible(false));
  };

  const handleIconPress = (index: number, screenName: string) => {
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 1.15,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.navigate(screenName as never));
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme.backgroundColor}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.rowHeader}>
            {/* أيقونة الإعدادات */}
            <TouchableOpacity 
              style={[styles.settingsIcon, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}
              onPress={openSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsIconText}>⚙️</Text>
            </TouchableOpacity>

            {/* اللغة + الثيم */}
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}
                onPress={toggleLanguage}
              >
                <Text style={[styles.headerText, { color: currentTheme.textColor }]}>
                  {i18n.language === 'en' ? 'AR' : 'EN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}
                onPress={toggleTheme}
              >
                <Text style={[styles.headerText, { color: currentTheme.textColor }]}>
                  {isDarkMode ? '☀️' : '🌙'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/LOGO.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        {/* Icons */}
        <View style={styles.iconsContainer}>
          {iconRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((icon) => (
                <TouchableOpacity
                  key={icon.id}
                  onPress={() => handleIconPress(icon.id - 1, icon.screenName)}
                  activeOpacity={0.8}
                  style={styles.iconWrapper}
                >
                  <Animated.View
                    style={[
                      styles.iconAnimated,
                      {
                        transform: [{ scale: scaleAnims[icon.id - 1] }],
                      },
                    ]}
                  >
                    <Image 
                      source={icon.image} 
                      style={styles.iconImage} 
                      resizeMode="contain" 
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

    
      </SafeAreaView>

      {/* صفحة الإعدادات الجانبية */}
      {settingsVisible && (
        <Modal
          visible={settingsVisible}
          transparent
          animationType="none"
          onRequestClose={closeSettings}
          statusBarTranslucent
        >
          <View style={styles.modalContainer}>
            {/* Overlay للخلفية - بدون لون أبيض */}
            <TouchableWithoutFeedback onPress={closeSettings}>
              <Animated.View 
                style={[
                  styles.overlay,
                  { opacity: overlayOpacity }
                ]} 
              />
            </TouchableWithoutFeedback>

            {/* صفحة الإعدادات */}
            <Animated.View
              style={[
                styles.settingsSidebar,
                { 
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {/* رأس الإعدادات */}
              <View style={[
                styles.settingsHeader,
                { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
              ]}>
                <Text style={[styles.settingsTitle, { color: currentTheme.textColor }]}>
                  الإعدادات
                </Text>
                <TouchableOpacity onPress={closeSettings} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: currentTheme.textColor }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* عناصر الإعدادات */}
              <View style={styles.settingsContent}>
                {/* المظهر */}
                <View style={styles.settingSection}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                    المظهر
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
                    ]}
                    onPress={toggleTheme}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                      </Text>
                    </View>
                    <View style={[
                      styles.toggle,
                      { backgroundColor: isDarkMode ? '#3b82f6' : '#94a3b8' }
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* اللغة */}
                <View style={styles.settingSection}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                    اللغة
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
                    ]}
                    onPress={toggleLanguage}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>🌐</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        {i18n.language === 'en' ? 'العربية' : 'English'}
                      </Text>
                    </View>
                    <Text style={[styles.currentValue, { color: currentTheme.textColor }]}>
                      {i18n.language === 'en' ? 'EN' : 'AR'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* عام */}
                <View style={styles.settingSection}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                    عام
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
                    ]}
                    onPress={() => {
                      // وظيفة الإشعارات
                    }}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>🔔</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        الإشعارات
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
                    ]}
                    onPress={() => {
                      // وظيفة الصوت
                    }}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>🔊</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        الصوت
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      // وظيفة الخصوصية
                    }}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>🔒</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        الخصوصية والأمان
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* معلومات */}
                <View style={styles.settingSection}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                    معلومات
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }
                    ]}
                    onPress={() => {
                      // وظيفة حول التطبيق
                    }}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>ℹ️</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        حول التطبيق
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.settingItem, 
                      { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      // وظيفة المساعدة
                    }}
                  >
                    <View style={styles.settingItemLeft}>
                      <Text style={styles.settingIcon}>❓</Text>
                      <Text style={[styles.settingText, { color: currentTheme.textColor }]}>
                        المساعدة والدعم
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer الإعدادات */}
              <View style={[
                styles.settingsFooter,
                { borderTopColor: isDarkMode ? '#334155' : '#e2e8f0' }
              ]}>
                <Text style={[styles.versionText, { color: currentTheme.textColor }]}>
                  إصدار 1.0.0
                </Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const lightTheme = {
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
};

const darkTheme = {
  backgroundColor: '#0f172a',
  textColor: '#f1f5f9',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeContainer: { flex: 1 },

  // Header - نفس مقاسات PuzzleSolverApp
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
  headerRight: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
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
    elevation: 3,
  },
  headerText: { 
    fontSize: Math.min(wp('4%'), 16),
    fontWeight: '600',
  },

  // أيقونة الإعدادات - متطابقة مع الأزرار
  settingsIcon: {
    width: Math.min(wp('10%'), 45),
    height: Math.min(wp('10%'), 45),
    borderRadius: Math.min(wp('2.5%'), 12),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIconText: {
    fontSize: Math.min(wp('5%'), 20),
  },

  // Logo - ديناميكي
  logoContainer: { 
    alignItems: 'center', 
    marginVertical: hp('2%'),
  },
  logo: { 
    width: Math.min(wp('35%'), 150),
    height: Math.min(hp('15%'), 150),
  },

  // Icons - ديناميكية
  iconsContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: wp('4%'),
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    marginVertical: hp('1.5%'),
  },
  iconWrapper: {
    width: Math.min(wp('38%'), 160),
    height: Math.min(wp('38%'), 160),
  },
  iconAnimated: {
    width: '100%',
    height: '100%',
  },
  iconImage: { 
    width: '100%',
    height: '100%',
  },

  // Footer - ديناميكي
  footer: { 
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },

  // Modal & Overlay
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  // صفحة الإعدادات - ديناميكية
  settingsSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(width * 0.80, 350),
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    paddingTop: hp('5%'),
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontSize: Math.min(wp('5.5%'), 22),
    fontWeight: 'bold',
  },
  closeButton: {
    width: Math.min(wp('8%'), 35),
    height: Math.min(wp('8%'), 35),
    borderRadius: Math.min(wp('4%'), 17.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Math.min(wp('5.5%'), 22),
    fontWeight: '300',
  },

  // محتوى الإعدادات
  settingsContent: {
    flex: 1,
    paddingTop: hp('1%'),
  },
  settingSection: {
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: Math.min(wp('3.2%'), 12),
    fontWeight: '600',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: Math.min(wp('5%'), 20),
    marginRight: wp('3%'),
  },
  settingText: {
    fontSize: Math.min(wp('3.8%'), 16),
    fontWeight: '500',
  },
  currentValue: {
    fontSize: Math.min(wp('3.5%'), 14),
    opacity: 0.6,
  },
  toggle: {
    width: Math.min(wp('11%'), 44),
    height: Math.min(hp('2.5%'), 24),
    borderRadius: Math.min(wp('5.5%'), 22),
  },

  // Footer الإعدادات
  settingsFooter: {
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderTopWidth: 1,
    alignItems: 'center',
  },
  versionText: {
    fontSize: Math.min(wp('3.2%'), 12),
    opacity: 0.6,
  },
});

export default DefySelfIcons;