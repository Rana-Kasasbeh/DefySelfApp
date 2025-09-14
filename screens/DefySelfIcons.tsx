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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DefySelfIcons: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scaleAnims = useRef(Array.from({ length: 4 }, () => new Animated.Value(1))).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleIconPress = (index: number, screenName: string) => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnims[index], {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 20,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => navigation.navigate(screenName as never));
  };

  const icons = [
    { id: 1, screenName: 'Water', image: require('../images/water.png') },
    { id: 2, screenName: 'Puzzle', image: require('../images/pazzilL.png') },
    { id: 3, screenName: 'Habits', image: require('../images/HabitL.png') },
    { id: 4, screenName: 'Gallery', image: require('../images/ENLight.png') },
  ];

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const chunkIcons = (arr: any[], size: number) => {
    const chunks: any[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  const iconRows = chunkIcons(icons, 2);

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
            {/* اللغة + الثيم */}
            <TouchableOpacity onPress={toggleLanguage}>
              <Text style={[styles.headerText, { color: currentTheme.textColor }]}>
                {i18n.language === 'en' ? 'AR' : 'EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Text style={[styles.headerText, { color: currentTheme.textColor }]}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../images/LOGO.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Icons */}
        <View style={styles.iconsContainer}>
          {iconRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((icon, i) => (
                <TouchableOpacity
                  key={icon.id}
                  onPress={() => handleIconPress(icon.id - 1, icon.screenName)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      {
                        transform: [{ scale: scaleAnims[icon.id - 1] }],
                      },
                    ]}
                  >
                    <Image source={icon.image} style={styles.iconImage} resizeMode="contain" />
                    <Animated.View
                      style={[
                        styles.flashOverlay,
                        { opacity: flashAnim },
                      ]}
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.textColor }]}>
            {t('footerMessage')}
          </Text>
        </View>
      </SafeAreaView>
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

  // Header
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  rowHeader: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  headerText: { fontSize: 18, fontWeight: '600' },

  // Logo
  logoContainer: { alignItems: 'center', marginVertical: 30 },
  logo: { width: 200, height: 200 },

  // Icons
  iconsContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 25 },
  iconImage: { width: 180, height: 180 },

  // Flash Overlay
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    borderRadius: 20,
  },

  // Footer
  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 16, fontWeight: '500' },
});

export default DefySelfIcons;
