// ads/InterstitialManager.ts
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-4514668400858247/7160554694';

let interstitial: InterstitialAd | null = null;
let isLoaded = false;
let lastShownTime = 0;
const MIN_INTERVAL = 60000;

function createInterstitial(): void {
  interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  if (!interstitial) {
    console.error('❌ Failed to create Interstitial Ad');
    return;
  }

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
    console.log('✅ Interstitial loaded');
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    console.log('🔄 Interstitial closed, reloading...');
    createInterstitial();
    interstitial?.load();
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    console.error('❌ Interstitial error:', error);
    isLoaded = false;
  });

  interstitial.addAdEventListener(AdEventType.OPENED, () => {
    console.log('👁️ Interstitial opened');
  });
}

export function loadInterstitial(): void {
  console.log('⏳ Loading Interstitial...');
  
  if (!interstitial) {
    createInterstitial();
  }
  
  if (interstitial && !isLoaded) {
    interstitial.load();
  }
}

export function showInterstitialIfReady(): boolean {
  const now = Date.now();
  
  if (now - lastShownTime < MIN_INTERVAL) {
    console.log('⏸️ Too soon to show ad');
    return false;
  }

  if (isLoaded && interstitial) {
    console.log('🎬 Showing Interstitial');
    interstitial.show();
    lastShownTime = now;
    return true;
  } else {
    console.log('⏳ Interstitial not ready');
    loadInterstitial();
    return false;
  }
}

export function isInterstitialLoaded(): boolean {
  return isLoaded;
}

// ⭐⭐⭐ هذه الدالة المفقودة - تأكد من وجودها ⭐⭐⭐
export function resetInterstitial(): void {
  isLoaded = false;
  interstitial = null;
  lastShownTime = 0;
  console.log('🔄 Interstitial reset');
}

createInterstitial();