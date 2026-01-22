// Push Notification Service for Oracle Trading Mobile App
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PUSH_TOKEN_KEY = 'push_notification_token';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Default notification settings
const DEFAULT_SETTINGS = {
  priceAlerts: true,
  tradeExecutions: true,
  competitionUpdates: true,
  marketNews: true,
  whaleAlerts: true,
  dailyDigest: false,
};

export const NotificationService = {
  // Register for push notifications
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14B8A6',
      });

      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        description: 'Notifications for price target alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500],
        lightColor: '#22C55E',
      });

      await Notifications.setNotificationChannelAsync('trades', {
        name: 'Trade Executions',
        description: 'Notifications for trade executions',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        lightColor: '#14B8A6',
      });

      await Notifications.setNotificationChannelAsync('competitions', {
        name: 'Competitions',
        description: 'Competition updates and results',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#F59E0B',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token - permission not granted');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'YOUR_EAS_PROJECT_ID', // Replace with actual project ID
      })).data;

      // Store token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    } else {
      console.log('Push notifications require a physical device');
    }

    return token;
  },

  // Get stored push token
  async getPushToken() {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  },

  // Get notification settings
  async getSettings() {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  // Update notification settings
  async updateSettings(newSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },

  // Schedule a local notification
  async scheduleLocalNotification({ title, body, data, channelId = 'default', delay = 0 }) {
    const trigger = delay > 0 ? { seconds: delay } : null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger,
    });
  },

  // Send price alert notification
  async sendPriceAlert(symbol, currentPrice, targetPrice, direction) {
    const settings = await this.getSettings();
    if (!settings.priceAlerts) return;

    const emoji = direction === 'above' ? '🚀' : '📉';
    const action = direction === 'above' ? 'reached' : 'dropped to';

    await this.scheduleLocalNotification({
      title: `${emoji} ${symbol} Price Alert`,
      body: `${symbol} has ${action} $${currentPrice.toLocaleString()}! Target: $${targetPrice.toLocaleString()}`,
      data: { type: 'price_alert', symbol, currentPrice, targetPrice },
      channelId: 'price-alerts',
    });
  },

  // Send trade execution notification
  async sendTradeNotification(trade) {
    const settings = await this.getSettings();
    if (!settings.tradeExecutions) return;

    const emoji = trade.side === 'BUY' ? '🟢' : '🔴';
    const action = trade.side === 'BUY' ? 'Bought' : 'Sold';

    await this.scheduleLocalNotification({
      title: `${emoji} Trade Executed`,
      body: `${action} ${trade.quantity} ${trade.symbol} at $${trade.price.toLocaleString()}`,
      data: { type: 'trade', ...trade },
      channelId: 'trades',
    });
  },

  // Send competition notification
  async sendCompetitionNotification(type, data) {
    const settings = await this.getSettings();
    if (!settings.competitionUpdates) return;

    let title, body;

    switch (type) {
      case 'started':
        title = '🏆 Competition Started!';
        body = `${data.name} has begun. Join now to compete!`;
        break;
      case 'ending_soon':
        title = '⏰ Competition Ending Soon';
        body = `${data.name} ends in ${data.timeLeft}. Make your final trades!`;
        break;
      case 'ended':
        title = '🎉 Competition Ended';
        body = `${data.name} has finished. Check your ranking!`;
        break;
      case 'rank_change':
        title = '📊 Rank Update';
        body = `You're now #${data.rank} in ${data.name}!`;
        break;
      default:
        title = '🏆 Competition Update';
        body = data.message || 'Check the competition tab for updates.';
    }

    await this.scheduleLocalNotification({
      title,
      body,
      data: { type: 'competition', competitionType: type, ...data },
      channelId: 'competitions',
    });
  },

  // Send whale alert notification
  async sendWhaleAlert(transaction) {
    const settings = await this.getSettings();
    if (!settings.whaleAlerts) return;

    await this.scheduleLocalNotification({
      title: '🐋 Whale Alert!',
      body: `Large ${transaction.symbol} transfer: ${transaction.amount.toLocaleString()} ${transaction.symbol} ($${transaction.valueUsd.toLocaleString()})`,
      data: { type: 'whale_alert', ...transaction },
      channelId: 'default',
    });
  },

  // Send market news notification
  async sendNewsAlert(news) {
    const settings = await this.getSettings();
    if (!settings.marketNews) return;

    const impactEmoji = news.impact === 'high' ? '🔴' : news.impact === 'medium' ? '🟡' : '🟢';

    await this.scheduleLocalNotification({
      title: `${impactEmoji} ${news.category || 'Market'} News`,
      body: news.title,
      data: { type: 'news', ...news },
      channelId: 'default',
    });
  },

  // Cancel all notifications
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Get pending notifications
  async getPending() {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  // Add notification listeners
  addNotificationListeners(onReceive, onResponse) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(onReceive);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};

export default NotificationService;
