import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const AppContext = createContext();

// Screens
import HabitsScreen from './screens/HabitsScreen';
import WaterTracker from './screens/WaterTracker';
import LanguageScreen from './screens/LanguageScreen';
import PuzzleScreen from './screens/PuzzleScreen';
import DefySelfIcons from './screens/DefySelfIcons' ;

const Stack = createNativeStackNavigator();
const { width, height } = Dimensions.get('window');

function SplashScreen({ navigation }) {
  const scheme = useColorScheme();

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Home'), 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View
      style={[
        styles.splash,
        { backgroundColor: scheme === 'dark' ? '#141d25' : '#ffffff' },
      ]}
    >
      <Image
        source={require('./images/LOGO.png')}
        style={[
          styles.splashLogo,
          scheme === 'dark'
            ? { alignSelf: 'center', marginTop: 'auto', marginBottom: 60 }
            : { alignSelf: 'center', marginTop: 60, marginBottom: 'auto' },
        ]}
      />
    </View>
  );
}


function HomeScreen ({ navigation }) {
  const { dark, setDark, lang, setLang } = useContext(AppContext);

  return (
    <View style={[styles.home, { backgroundColor: dark ? '#141d25' : '#ffffff' }]}>
      {/* اللوجو الكبير يناسب حجم الشاشة */}
      <Image
        source={dark ? require('./images/LOGO.png') : require('./images/LOGO.png')}
        style={[styles.homeLogo, { width: width * 0.45, height: width * 0.45 }]}
      />

      {/* أزرار تغيير اللغة والثيم */}
      <View style={styles.topButtons}>
        <TouchableOpacity onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          <Text style={{ color: dark ? '#fff' : '#000', fontWeight: '600' }}>
            {lang === 'ar' ? 'EN' : 'AR'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDark(!dark)}>
          <Text style={{ color: dark ? '#fff' : '#000', fontWeight: '600' }}>
            {dark ? 'Light' : 'Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* أيقونات الصفحات */}
      <View style={styles.menuGrid}>
        <TouchableOpacity onPress={() => navigation.navigate('Language')}>
          <Image
            source={dark ? require('./images/ENDark.png') : require('./images/ENLight.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Water')}>
          <Image source={require('./images/water.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Habits')}>
          <Image
            source={dark ? require('./images/HabitD.png') : require('./images/HabitL.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Puzzle')}>
          <Image
            source={dark ? require('./images/pazzilD.png') : require('./images/pazzilL.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// إضافة اللوجو أعلى كل صفحة
function withHeaderLogo(Component) {
  return function Wrapper(props) {
    const { dark , setDark, lang, setLang } = useContext(AppContext);
    return (
      <View style={{ flex: 1, backgroundColor: dark ? '#141d25' : '#fff' }}>
       
        <Component {...props} />
      </View>
    );
  };
}

export default function App() {
  const scheme = useColorScheme();
  const [dark, setDark] = useState(scheme === 'dark');
  const [lang, setLang] = useState('ar');

  return (
    <AppContext.Provider value={{ dark, setDark, lang, setLang }}>
      <NavigationContainer theme={dark ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={DefySelfIcons} />
          <Stack.Screen name="Habits" component={withHeaderLogo(HabitsScreen)} />
          <Stack.Screen name="Water" component={withHeaderLogo(WaterTracker)} />
          <Stack.Screen name="Language" component={withHeaderLogo(LanguageScreen)} />
          <Stack.Screen name="Puzzle" component={withHeaderLogo(PuzzleScreen)} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 720,
    height: 720,
    resizeMode: 'contain',
  },
  home: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLogo: {
    resizeMode: 'contain',
    marginBottom: 40,
  },
  topButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  menuIcon: {
    width: 140,
    height: 140,
    margin: 10,
    resizeMode: 'contain',
  },
  headerLogo: {
    width: 70,
    height: 70,
    alignSelf: 'center',
    marginVertical: 10,
    resizeMode: 'contain',
  },
});
