// Oracle Trading Mobile App - Main Entry Point
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/NotificationService';
import OfflineCacheService from './src/services/OfflineCacheService';
import { colors } from './src/theme';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize offline cache service
        await OfflineCacheService.init();
        setIsOffline(!OfflineCacheService.isOnline);

        // Register for push notifications
        await NotificationService.registerForPushNotifications();

        // Listen for notifications
        const removeListeners = NotificationService.addNotificationListeners(
          (notification) => {
            console.log('Notification received:', notification);
          },
          (response) => {
            console.log('Notification tapped:', response);
            // Handle notification navigation here
            const data = response.notification.request.content.data;
            if (data?.type === 'price_alert') {
              // Navigate to price screen
            } else if (data?.type === 'trade') {
              // Navigate to trade history
            } else if (data?.type === 'competition') {
              // Navigate to competitions
            }
          }
        );

        // Listen for network changes
        const unsubNetwork = OfflineCacheService.onNetworkChange(({ isOnline }) => {
          setIsOffline(!isOnline);
        });

        setIsReady(true);

        return () => {
          removeListeners();
          unsubNetwork();
        };
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
      }
    }

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#050505" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 Offline Mode - Using cached data</Text>
        </View>
      )}
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
});
