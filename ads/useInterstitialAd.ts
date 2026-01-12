// ads/useInterstitialAd.ts
import { useEffect, useState } from 'react';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AdUnits, canShowAds } from './AdConfig';

let interstitialAd: InterstitialAd | null = null;
let isAdLoaded = false;

export function useInterstitialAd() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canShowAds()) {
      console.log('📢 Ads disabled in current environment');
      return;
    }

    // إنشاء الإعلان
    interstitialAd = InterstitialAd.createForAdRequest(AdUnits.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    // الاستماع للأحداث
    const loadedListener = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('✅ Interstitial ad loaded');
        isAdLoaded = true;
        setIsReady(true);
      }
    );

    const closedListener = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('👋 Interstitial ad closed');
        isAdLoaded = false;
        setIsReady(false);
        // إعادة تحميل إعلان جديد
        interstitialAd?.load();
      }
    );

    const errorListener = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('❌ Interstitial ad error:', error);
        isAdLoaded = false;
        setIsReady(false);
      }
    );

    // تحميل الإعلان
    interstitialAd.load();

    // التنظيف
    return () => {
      loadedListener();
      closedListener();
      errorListener();
    };
  }, []);

  const showAd = async (): Promise<void> => {
    if (!canShowAds()) {
      console.log('📢 Ads disabled');
      return;
    }

    if (isAdLoaded && interstitialAd) {
      try {
        await interstitialAd.show();
        console.log('📺 Interstitial ad shown');
      } catch (error) {
        console.log('⚠️ Error showing ad:', error);
      }
    } else {
      console.log('⏳ Ad not ready yet');
    }
  };

  return {
    isReady,
    showAd,
  };
}