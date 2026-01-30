// OracleIQTrader - Expo Push Notifications Service
// Real-time alerts for trades, price movements, and copy trading

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types
export const NOTIFICATION_TYPES = {
  PRICE_ALERT: 'price_alert',
  TRADE_EXECUTED: 'trade_executed',
  COPY_TRADE: 'copy_trade',
  AGENT_SIGNAL: 'agent_signal',
  PORTFOLIO_UPDATE: 'portfolio_update',
  MARKET_NEWS: 'market_news',
  RISK_WARNING: 'risk_warning',
  DEPOSIT_WITHDRAWAL: 'deposit_withdrawal',
};

// Notification channels for Android
const NOTIFICATION_CHANNELS = {
  trades: {
    id: 'trades',
    name: 'Trade Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'trade_alert.wav',
  },
  alerts: {
    id: 'alerts',
    name: 'Price Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'price_alert.wav',
  },
  copyTrading: {
    id: 'copy_trading',
    name: 'Copy Trading',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'copy_trade.wav',
  },
  agents: {
    id: 'agents',
    name: 'AI Agent Signals',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  general: {
    id: 'general',
    name: 'General Updates',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
};

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.preferences = {
      trades: true,
      alerts: true,
      copyTrading: true,
      agents: true,
      news: false,
      marketing: false,
    };
  }

  // Initialize push notifications
  async initialize() {
    try {
      // Load preferences
      await this.loadPreferences();

      // Setup Android channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      // Setup listeners
      this.setupListeners();

      return token;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return null;
    }
  }

  // Register for push notifications
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14B8A6',
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

      // Get Expo push token
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token?.data;
  }

  // Setup Android notification channels
  async setupAndroidChannels() {
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14B8A6',
        sound: channel.sound || undefined,
      });
    }
  }

  // Setup notification listeners
  setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        this.handleNotification(notification);
      }
    );

    // Handle user interaction with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  // Handle received notification
  handleNotification(notification) {
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case NOTIFICATION_TYPES.TRADE_EXECUTED:
        // Update local trade history
        break;
      case NOTIFICATION_TYPES.COPY_TRADE:
        // Show copy trade confirmation
        break;
      case NOTIFICATION_TYPES.PRICE_ALERT:
        // Update price in app
        break;
      case NOTIFICATION_TYPES.AGENT_SIGNAL:
        // Show agent signal
        break;
      default:
        break;
    }
  }

  // Handle notification tap
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    // This would be connected to React Navigation
    switch (data?.type) {
      case NOTIFICATION_TYPES.TRADE_EXECUTED:
        // Navigate to trade details
        return { screen: 'TradeDetail', params: { tradeId: data.tradeId } };
      case NOTIFICATION_TYPES.COPY_TRADE:
        // Navigate to copy trading
        return { screen: 'CopyTrading' };
      case NOTIFICATION_TYPES.PRICE_ALERT:
        // Navigate to asset
        return { screen: 'Asset', params: { symbol: data.symbol } };
      case NOTIFICATION_TYPES.PORTFOLIO_UPDATE:
        // Navigate to portfolio
        return { screen: 'Portfolio' };
      default:
        return { screen: 'Home' };
    }
  }

  // Register push token with backend
  async registerTokenWithBackend(token) {
    try {
      await api.post('/notifications/register', {
        token,
        platform: Platform.OS,
        device: Device.modelName,
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  // Load notification preferences
  async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  // Save notification preferences
  async savePreferences(preferences) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      
      // Update backend
      await api.post('/notifications/preferences', this.preferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  // Get notification preferences
  getPreferences() {
    return this.preferences;
  }

  // Schedule local notification
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger: trigger || null, // null = immediate
    });
    
    return notificationId;
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear all delivered notifications
  async clearAllDelivered() {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }

  // Cleanup listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Get push token
  getToken() {
    return this.expoPushToken;
  }
}

// Singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

// Helper functions for sending notifications from components
export const sendTradeNotification = async (trade) => {
  const title = trade.side === 'buy' ? '🟢 Buy Order Executed' : '🔴 Sell Order Executed';
  const body = `${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)}`;
  
  return pushNotificationService.scheduleLocalNotification(title, body, {
    type: NOTIFICATION_TYPES.TRADE_EXECUTED,
    tradeId: trade.id,
  });
};

export const sendCopyTradeNotification = async (trade, masterTrader) => {
  const title = '📋 Trade Copied';
  const body = `Copied ${masterTrader}: ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol}`;
  
  return pushNotificationService.scheduleLocalNotification(title, body, {
    type: NOTIFICATION_TYPES.COPY_TRADE,
    tradeId: trade.id,
    masterTraderId: masterTrader,
  });
};

export const sendPriceAlertNotification = async (symbol, price, alertType) => {
  const title = `🔔 Price Alert: ${symbol}`;
  const body = alertType === 'above' 
    ? `${symbol} is now above $${price.toFixed(2)}`
    : `${symbol} is now below $${price.toFixed(2)}`;
  
  return pushNotificationService.scheduleLocalNotification(title, body, {
    type: NOTIFICATION_TYPES.PRICE_ALERT,
    symbol,
    price,
  });
};

export const sendAgentSignalNotification = async (agent, signal) => {
  const title = `🤖 ${agent.name} Signal`;
  const body = `${signal.action.toUpperCase()} ${signal.symbol} - Confidence: ${signal.confidence}%`;
  
  return pushNotificationService.scheduleLocalNotification(title, body, {
    type: NOTIFICATION_TYPES.AGENT_SIGNAL,
    agentId: agent.id,
    signal,
  });
};

export const sendRiskWarningNotification = async (warning) => {
  const title = '⚠️ Risk Warning';
  const body = warning.message;
  
  return pushNotificationService.scheduleLocalNotification(title, body, {
    type: NOTIFICATION_TYPES.RISK_WARNING,
    warning,
  });
};
