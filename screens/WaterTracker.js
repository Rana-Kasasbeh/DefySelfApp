import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WaterTracker = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [answers, setAnswers] = useState({
    weight: null,
    activity: null,
    climate: null,
  });

  // تحميل اللغة والثيم من AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      const savedLang = await AsyncStorage.getItem('lang');
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedLang) i18n.changeLanguage(savedLang);
      if (savedTheme) setIsDark(savedTheme === 'dark');
    };
    loadSettings();
  }, []);

  // تغيير اللغة
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('lang', newLang);
  };

  // تغيير الثيم
  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // حساب الهدف
  const calculateGoal = () => {
    let base = 30;
    let weightWater = (answers.weight || 60) * base;

    if (answers.activity === 'high') weightWater += 1000;
    if (answers.activity === 'medium') weightWater += 500;
    if (answers.climate === 'hot') weightWater += 500;

    setGoal(Math.round(weightWater / 100) * 100);
  };

  const addWater = () => {
    if (goal) setIntake(prev => Math.min(prev + 100, goal));
  };

  const backgroundColor = isDark ? '#141d25' : '#fff';
  const textColor = '#0bbcf9';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* أزرار التحكم */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('DefySelfIcons')}>
          <Text style={styles.topBarText}>{t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme}>
          <Text style={styles.topBarText}>{t('theme')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLanguage}>
          <Text style={styles.topBarText}>{t('language')}</Text>
        </TouchableOpacity>
      </View>

      {/* الشعار */}
      <View style={styles.logo}>
        <Image
          source={require('../images/logoL.png')}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>

      {/* أسئلة */}
      {!goal ? (
        <View>
          <Text style={[styles.question, { color: textColor }]}>{t('weightQuestion')}</Text>
          {['50', '60', '70', '80'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => setAnswers({ ...answers, weight: parseInt(opt) })}
            >
              <Text style={styles.optionText}>{t(`options.weight.w${opt}`)}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.question, { color: textColor }]}>{t('activityQuestion')}</Text>
          {['low', 'medium', 'high'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => setAnswers({ ...answers, activity: opt })}
            >
              <Text style={styles.optionText}>{t(`options.activity.${opt}`)}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.question, { color: textColor }]}>{t('climateQuestion')}</Text>
          {['normal', 'hot'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => setAnswers({ ...answers, climate: opt })}
            >
              <Text style={styles.optionText}>{t(`options.climate.${opt}`)}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.calcBtn} onPress={calculateGoal}>
            <Text style={styles.calcText}>{t('calculateGoal')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.circle} onPress={addWater}>
            <Text style={[styles.circleText, { color: '#013989' }]}>+ 100mL</Text>
          </TouchableOpacity>

          <Text style={[styles.infoText, { color: textColor }]}>{t('yourAchievement')}</Text>

          <Image source={require('../images/waterPage.png')} style={styles.image} resizeMode="cover" />

          <Text style={[styles.amount, { color: textColor }]}>{intake} mL / {goal} mL</Text>
        </>
      )}
    </View>
  );
};

export default WaterTracker;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  topBarText: { color: '#0bbcf9', fontWeight: 'bold' },
  logo: { marginVertical: 10, alignItems: 'center' },
  circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0bbcf9', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  circleText: { fontSize: 22, fontWeight: 'bold' },
  infoText: { fontSize: 14, textAlign: 'center', marginBottom: 10 },
  image: { width: '100%', height: 120 },
  amount: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  question: { fontSize: 16, marginVertical: 8, fontWeight: 'bold' },
  option: { backgroundColor: '#0bbcf9', borderRadius: 8, padding: 10, marginVertical: 4, alignItems: 'center' },
  optionText: { color: '#fff', fontWeight: 'bold' },
  calcBtn: { backgroundColor: '#013989', padding: 12, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  calcText: { color: '#fff', fontWeight: 'bold' },
});
