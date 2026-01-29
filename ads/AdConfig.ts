// ads/AdConfig.ts
import { TestIds } from 'react-native-google-mobile-ads';
import mobileAds from 'react-native-google-mobile-ads';

//import { InterstitialAd, RewardedAd, ... } from './MockAds';

declare const __DEV__: boolean;

const IS_TEST_MODE = __DEV__;

/**
 * Ad Unit IDs
 */
export const AdUnits = {
  BANNER: IS_TEST_MODE 
    ? TestIds.BANNER 
    : 'ca-app-pub-4514668400858247/4315625856',
    
  INTERSTITIAL: IS_TEST_MODE 
    ? TestIds.INTERSTITIAL 
    : 'ca-app-pub-4514668400858247/7160554694',
    
  APP_OPEN: IS_TEST_MODE 
    ? TestIds.APP_OPEN 
    : 'ca-app-pub-4514668400858247/3002544181',
    
  NATIVE: IS_TEST_MODE 
    ? TestIds.NATIVE 
    : 'ca-app-pub-4514668400858247/7986551206',
} as const;

/**
 * Ad Configuration
 */
export const AdConfig = {
  SHOW_IN_DEV: true,
  MIN_INTERVAL_SECONDS: 60,
  NAV_COUNT_BEFORE_AD: 3,
  TASKS_BEFORE_AD: 7,
} as const;

/**
 * Initialize AdMob
 */
export async function initializeAdMob(): Promise<void> {
  try {
    await mobileAds().initialize();
    console.log('✅ AdMob initialized');
  } catch (error) {
    console.error('❌ AdMob initialization failed:', error);
  }
}

/**
 * Check if ads can be shown
 */
export function canShowAds(): boolean {
  if (__DEV__ && !AdConfig.SHOW_IN_DEV) {
    return false;
  }
  return true;
}

/**
 * Log ad configuration
 */
export function logAdInfo(): void {
  console.log('📢 AdMob Configuration:');
  console.log(`  Mode: ${IS_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`  Banner: ${AdUnits.BANNER}`);
  console.log(`  Interstitial: ${AdUnits.INTERSTITIAL}`);
  console.log(`  App Open: ${AdUnits.APP_OPEN}`);
  console.log(`  Native: ${AdUnits.NATIVE}`);
  console.log(`  Can Show Ads: ${canShowAds()}`);
}