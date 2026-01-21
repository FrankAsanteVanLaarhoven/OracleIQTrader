import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Bell, BellOff, Check, X, AlertTriangle, 
  Smartphone, Settings, Volume2
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const NotificationManager = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [settings, setSettings] = useState({
    priceAlerts: true,
    whaleAlerts: true,
    newsAlerts: false,
    soundEnabled: true
  });

  // Check support and current permission
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          setSwRegistration(registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Show test notification
        new Notification('Cognitive Oracle', {
          body: 'Push notifications enabled! You will receive trading alerts.',
          icon: '/logo192.png',
          tag: 'welcome'
        });
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }, [isSupported]);

  // Send local notification
  const sendNotification = useCallback((title, body, options = {}) => {
    if (permission !== 'granted') return;
    
    const notification = new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: options.tag || 'alert',
      requireInteraction: options.requireInteraction || false,
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }, [permission]);

  // Test notification
  const testNotification = () => {
    sendNotification(
      '🚀 BTC Alert!',
      'Bitcoin just crossed $95,000! Your target price was hit.',
      { tag: 'test-alert', requireInteraction: true }
    );
  };

  // Toggle setting
  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const permissionStatus = {
    granted: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Check, label: 'Enabled' },
    denied: { color: 'text-red-400', bg: 'bg-red-500/20', icon: X, label: 'Blocked' },
    default: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle, label: 'Not Set' }
  }[permission];

  if (!isSupported) {
    return (
      <GlassCard title="Push Notifications" icon="🔔" accent="amber">
        <div className="text-center py-6 text-slate-500">
          <BellOff className="mx-auto mb-2 opacity-50" size={32} />
          <p className="text-sm">Push notifications are not supported in this browser.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4" data-testid="notification-manager">
      {/* Permission Status */}
      <div className="p-4 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${permissionStatus.bg}`}>
              <Bell className={permissionStatus.color} size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Push Notifications</h4>
              <div className="flex items-center gap-2 mt-1">
                <permissionStatus.icon size={12} className={permissionStatus.color} />
                <span className={`text-xs font-mono ${permissionStatus.color}`}>
                  {permissionStatus.label}
                </span>
              </div>
            </div>
          </div>
          
          {permission !== 'granted' && (
            <NeonButton
              onClick={requestPermission}
              variant="teal"
              size="sm"
              disabled={permission === 'denied'}
              data-testid="enable-notifications-btn"
            >
              {permission === 'denied' ? 'Blocked in Browser' : 'Enable'}
            </NeonButton>
          )}
        </div>
        
        {permission === 'denied' && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <p>Notifications are blocked. To enable, click the lock icon in your browser's address bar and allow notifications.</p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      {permission === 'granted' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings size={14} />
            Notification Preferences
          </h4>
          
          {[
            { key: 'priceAlerts', label: 'Price Alerts', desc: 'When target prices are hit', icon: '💰' },
            { key: 'whaleAlerts', label: 'Whale Alerts', desc: 'Large transactions detected', icon: '🐋' },
            { key: 'newsAlerts', label: 'Breaking News', desc: 'High-impact market news', icon: '📰' },
            { key: 'soundEnabled', label: 'Sound', desc: 'Play sound with alerts', icon: '🔊' },
          ].map((item) => (
            <div 
              key={item.key}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting(item.key)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  settings[item.key] ? 'bg-teal-500' : 'bg-slate-600'
                }`}
                data-testid={`toggle-${item.key}`}
              >
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                  animate={{ left: settings[item.key] ? '22px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
          
          {/* Test Button */}
          <div className="pt-3">
            <NeonButton
              onClick={testNotification}
              variant="white"
              size="sm"
              className="w-full"
              data-testid="test-notification-btn"
            >
              <Smartphone size={14} />
              Send Test Notification
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;

// Export utility function for sending notifications from other components
export const sendPushNotification = (title, body, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      body,
      icon: '/logo192.png',
      ...options
    });
  }
  return null;
};
