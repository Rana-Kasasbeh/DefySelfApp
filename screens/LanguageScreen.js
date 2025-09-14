import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function LanguageScreen() {
  const [word, setWord] = useState<{ en: string , ar: string } | null>(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { t, i18n } = useTranslation();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1️⃣ API للكلمة
      const wordRes = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/apple');
      const enWord = wordRes.data[0].word;
      const arTranslation = 'تفاحة'; // مؤقت

      // 2️⃣ API للجملة التحفيزية
      const quoteRes = await axios.get('https://api.quotable.io/random');
      const randomQuote = quoteRes.data.content;

      setWord({ en: enWord, ar: arTranslation });
      setQuote(randomQuote);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

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

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#29B6F6" />
          ) : (
            <>
              <Text style={[styles.title, { color: currentTheme.textColor }]}>
                📚 {t('learnWord', { defaultValue: 'تعلم كلمة جديدة' })}
              </Text>
              <Text style={[styles.word, { color: '#29B6F6' }]}>{word?.en}</Text>
              <Text style={[styles.translation, { color: currentTheme.textColor }]}>
                {word?.ar}
              </Text>

              <Text style={[styles.quoteTitle, { color: currentTheme.textColor }]}>
                💡 {t('dailyQuote', { defaultValue: 'جملة تحفيزية' })}
              </Text>
              <Text style={[styles.quote, { color: currentTheme.textColor }]}>{quote}</Text>

              <Button title="🔄 كلمة/جملة جديدة" onPress={fetchData} />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

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
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  logo: { width: 150, height: 150 },

  // Content
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  word: { fontSize: 32 },
  translation: { fontSize: 24, marginVertical: 10 },
  quoteTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 30 },
  quote: { fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
});
