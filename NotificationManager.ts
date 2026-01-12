// services/NotificationManager.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== NOTIFICATION CONFIGURATION ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== NOTIFICATION MANAGER ====================
class NotificationManager {
  
  /**
   * طلب الأذونات للإشعارات
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * جدولة تذكيرات شرب الماء الذكية (مرة واحدة يومياً)
   */
  async scheduleWaterReminders(
    userId: string,
    startHour: number = 8,
    endHour: number = 22,
    intervalHours: number = 2,
    isRamadan: boolean = false,
    iftarHour?: number,
    suhoorHour?: number
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // ✅ التحقق من آخر جدولة
      const key = `@water_notifications_${userId}`;
      const lastScheduled = await AsyncStorage.getItem(key);
      const today = new Date().toISOString().split('T')[0];

      if (lastScheduled === today) {
        console.log('✅ Water notifications already scheduled for today');
        return true;
      }

      // إلغاء الإشعارات السابقة
      await this.cancelWaterReminders();

      // تحديد أوقات البدء والانتهاء
      let start = startHour;
      let end = endHour;

      if (isRamadan && iftarHour !== undefined && suhoorHour !== undefined) {
        start = iftarHour;
        end = suhoorHour;
      }

      // حساب الأوقات
      const triggers: number[] = [];
      let current = start;
      let loops = 0;

      while (loops < 8) {
        triggers.push(current);

        if (start < end) {
          if (current + intervalHours >= end) break;
        } else {
          if (current < start && current + intervalHours >= end) break;
        }

        current = (current + intervalHours) % 24;
        loops++;
      }

      // ✅ جدولة الإشعارات (بدون repeats - DailyTrigger يتكرر تلقائياً)
      for (const hour of triggers) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: isRamadan ? '🌙 تذكير رمضان' : '💧 تذكير شرب الماء',
            body: 'حان وقت شرب كوب من الماء! حافظ على صحتك 🥤',
            sound: true,
            data: { type: 'water_reminder', userId },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hour,
            minute: 0,
          },
        });
      }

      // حفظ تاريخ الجدولة
      await AsyncStorage.setItem(key, today);
      console.log(`✅ Scheduled ${triggers.length} water notifications at: ${triggers.join(', ')}`);

      return true;
    } catch (error) {
      console.error('❌ Error scheduling water reminders:', error);
      return false;
    }
  }

  /**
   * إلغاء تذكيرات شرب الماء
   */
  async cancelWaterReminders(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const waterNotifications = scheduledNotifications.filter(
        n => n.content.data?.type === 'water_reminder'
      );

      for (const notification of waterNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`✅ Cancelled ${waterNotifications.length} water reminders`);
    } catch (error) {
      console.error('❌ Error cancelling water reminders:', error);
    }
  }

  /**
   * جدولة إشعار عادة مخصص
   */
  async scheduleHabitNotification(
    habitId: string,
    habitName: string,
    customMessage: string,
    hour: number,
    minute: number,
    repeatDaily: boolean = true
  ): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // إلغاء الإشعار السابق لنفس العادة
      await this.cancelHabitNotification(habitId);

      let trigger: any;

      if (repeatDaily) {
        // ✅ DailyTrigger بدون repeats
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: minute,
        };
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 60000),
        };
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `✅ ${habitName}`,
          body: customMessage || `حان وقت تنفيذ عادة: ${habitName}`,
          sound: true,
          data: { 
            type: 'habit_reminder',
            habitId: habitId,
          },
        },
        trigger: trigger,
      });

      console.log('✅ Habit notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling habit notification:', error);
      return null;
    }
  }

  /**
   * إلغاء إشعار عادة معينة
   */
  async cancelHabitNotification(habitId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const habitNotifications = scheduledNotifications.filter(
        n => n.content.data?.habitId === habitId
      );

      for (const notification of habitNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log('✅ Habit notification cancelled:', habitId);
    } catch (error) {
      console.error('❌ Error cancelling habit notification:', error);
    }
  }

  /**
   * إرسال إشعار فوري
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data,
        },
        trigger: null,
      });

      console.log('✅ Immediate notification sent:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
      return null;
    }
  }

  /**
   * الحصول على جميع الإشعارات المجدولة
   */
  async getAllScheduledNotifications() {
    try {
      if (Platform.OS === 'web') return [];

      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Scheduled notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * إلغاء جميع الإشعارات
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  /**
   * إعداد مستمع للإشعارات
   */
  setupNotificationListener(callback: (notification: Notifications.Notification) => void) {
    if (Platform.OS === 'web') return { remove: () => {} };
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * إعداد مستمع لاستجابة الإشعارات
   */
  setupNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    if (Platform.OS === 'web') return { remove: () => {} };
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

// ==================== SINGLETON ====================
const notificationManager = new NotificationManager();

export default notificationManager;
export { NotificationManager };