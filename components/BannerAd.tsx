// components/AppBannerAd.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { 
  BannerAd, 
  BannerAdSize, 
  TestIds,
  BannerAdProps 
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-4514668400858247/4315625856';

interface AppBannerAdProps {
  size?: keyof typeof BannerAdSize;
  style?: object;
}

const AppBannerAd: React.FC<AppBannerAdProps> = ({ 
  size = 'ANCHORED_ADAPTIVE_BANNER',
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize[size]}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('✅ Banner Ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.error('❌ Banner Ad failed:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
});

export default AppBannerAd;