// ads/AdsController.ts
import { 
    loadInterstitial, 
    showInterstitialIfReady, 
    isInterstitialLoaded,
    resetInterstitial 
  } from './InterstitialManager';
  import { canShowAds, AdConfig } from './AdConfig';
  
  class AdsController {
    private navigationCount: number = 0;
    private taskCompletionCount: number = 0;
    private lastAdTime: number = 0;
  
    showInterstitial(): boolean {
      if (!canShowAds()) {
        console.log('🚫 Ads disabled in current mode');
        return false;
      }
  
      return showInterstitialIfReady();
    }
  
    // ✅ إصلاح: return void بدلاً من boolean
    loadInterstitial(): void {
      loadInterstitial();
    }
  
    isInterstitialReady(): boolean {
      return isInterstitialLoaded();
    }
  
    showAfterTaskCompletion(taskName: string = 'Unknown Task'): boolean {
      this.taskCompletionCount++;
      console.log(`✅ Task completed: ${taskName} (Count: ${this.taskCompletionCount})`);
  
      if (this.taskCompletionCount >= AdConfig.TASKS_BEFORE_AD) {
        console.log('🎯 Task threshold reached, showing ad...');
        const shown = this.showInterstitial();
        
        if (shown) {
          this.taskCompletionCount = 0;
        }
        
        return shown;
      }
  
      return false;
    }
  
    showOnNavigation(screenName: string): boolean {
      this.navigationCount++;
      console.log(`🔄 Navigated to: ${screenName} (Count: ${this.navigationCount})`);
  
      if (this.navigationCount >= AdConfig.NAV_COUNT_BEFORE_AD) {
        console.log('🎯 Navigation threshold reached, showing ad...');
        const shown = this.showInterstitial();
        
        if (shown) {
          this.navigationCount = 0;
        }
        
        return shown;
      }
  
      return false;
    }
  
    showAfterTimeSpent(seconds: number): boolean {
      console.log(`⏱️ Time spent: ${seconds}s, attempting to show ad...`);
      return this.showInterstitial();
    }
  
    resetCounters(): void {
      this.navigationCount = 0;
      this.taskCompletionCount = 0;
      this.lastAdTime = 0;
      console.log('🔄 All counters reset');
    }
  
    reset(): void {
      this.resetCounters();
      resetInterstitial();
    }
  
    logStatus(): void {
      console.log('📊 AdsController Status:');
      console.log(`  Navigation Count: ${this.navigationCount}/${AdConfig.NAV_COUNT_BEFORE_AD}`);
      console.log(`  Task Count: ${this.taskCompletionCount}/${AdConfig.TASKS_BEFORE_AD}`);
      console.log(`  Interstitial Ready: ${this.isInterstitialReady()}`);
      console.log(`  Can Show Ads: ${canShowAds()}`);
    }
  
    getNavigationCount(): number {
      return this.navigationCount;
    }
  
    getTaskCount(): number {
      return this.taskCompletionCount;
    }
  }
  
  const adsController = new AdsController();
  export default adsController;