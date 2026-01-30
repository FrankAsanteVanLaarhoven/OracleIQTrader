import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, Bell, Moon, Sun, Globe, Shield, Key, 
  CreditCard, Smartphone, X, Check, ChevronRight,
  Volume2, VolumeX, Eye, EyeOff, Palette, Monitor,
  Zap, AlertTriangle, DollarSign, Percent
} from 'lucide-react';
import GlassCard from './GlassCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = ({ onClose }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General
    theme: theme || 'dark',
    language: 'en',
    timezone: 'America/New_York',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    priceAlerts: true,
    tradeExecutions: true,
    newsAlerts: false,
    weeklyReport: true,
    
    // Trading
    defaultOrderType: 'market',
    confirmOrders: true,
    soundEffects: true,
    showPnL: true,
    defaultLeverage: 1,
    
    // Risk Management
    maxPositionSize: 10, // percentage
    stopLossDefault: 5, // percentage
    takeProfitDefault: 10, // percentage
    dailyLossLimit: 5, // percentage
    
    // Privacy
    publicProfile: false,
    showInLeaderboard: true,
    shareTradeHistory: false,
  });

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trading', label: 'Trading', icon: Zap },
    { id: 'risk', label: 'Risk Management', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  const handleSave = async () => {
    try {
      // Save to backend
      await fetch(`${API}/notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id || 'demo_user',
          ...settings
        })
      });
      
      // Apply theme
      if (settings.theme !== theme) {
        setTheme(settings.theme);
      }
      
      onClose();
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-teal-500' : 'bg-slate-600'
      }`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ left: enabled ? 28 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-3">Theme</label>
              <div className="flex gap-3">
                {['dark', 'light', 'system'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSettings({...settings, theme: t})}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      settings.theme === t 
                        ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {t === 'dark' && <Moon size={18} />}
                    {t === 'light' && <Sun size={18} />}
                    {t === 'system' && <Monitor size={18} />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-3">Language</label>
              <select
                value={settings.language}
                onChange={e => setSettings({...settings, language: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-3">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
              </select>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile alerts' },
              { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when prices hit targets' },
              { key: 'tradeExecutions', label: 'Trade Executions', desc: 'Notifications for filled orders' },
              { key: 'newsAlerts', label: 'News Alerts', desc: 'Breaking news affecting your positions' },
              { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance summary' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <ToggleSwitch
                  enabled={settings[item.key]}
                  onChange={val => setSettings({...settings, [item.key]: val})}
                />
              </div>
            ))}
          </div>
        );

      case 'trading':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-3">Default Order Type</label>
              <div className="flex gap-3">
                {['market', 'limit', 'stop'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSettings({...settings, defaultOrderType: type})}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors capitalize ${
                      settings.defaultOrderType === type
                        ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {[
              { key: 'confirmOrders', label: 'Confirm Orders', desc: 'Show confirmation before placing orders' },
              { key: 'soundEffects', label: 'Sound Effects', desc: 'Play sounds for trade executions' },
              { key: 'showPnL', label: 'Show P&L', desc: 'Display profit/loss on positions' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <ToggleSwitch
                  enabled={settings[item.key]}
                  onChange={val => setSettings({...settings, [item.key]: val})}
                />
              </div>
            ))}
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle size={18} />
                <span className="font-medium">Risk Management</span>
              </div>
              <p className="text-sm text-slate-400">
                These settings help protect your capital. Adjust carefully.
              </p>
            </div>
            
            {[
              { key: 'maxPositionSize', label: 'Max Position Size', desc: 'Maximum % of portfolio per trade', suffix: '%' },
              { key: 'stopLossDefault', label: 'Default Stop Loss', desc: 'Automatic stop loss percentage', suffix: '%' },
              { key: 'takeProfitDefault', label: 'Default Take Profit', desc: 'Automatic take profit percentage', suffix: '%' },
              { key: 'dailyLossLimit', label: 'Daily Loss Limit', desc: 'Stop trading after this % loss', suffix: '%' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings[item.key]}
                    onChange={e => setSettings({...settings, [item.key]: parseInt(e.target.value) || 0})}
                    className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-right focus:outline-none focus:border-teal-500/50"
                    min="1"
                    max="100"
                  />
                  <span className="text-slate-400">{item.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            {[
              { key: 'publicProfile', label: 'Public Profile', desc: 'Allow others to view your profile' },
              { key: 'showInLeaderboard', label: 'Show in Leaderboard', desc: 'Appear in trading leaderboards' },
              { key: 'shareTradeHistory', label: 'Share Trade History', desc: 'Allow followers to see your trades' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <ToggleSwitch
                  enabled={settings[item.key]}
                  onChange={val => setSettings({...settings, [item.key]: val})}
                />
              </div>
            ))}
          </div>
        );

      case 'api':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-medium">Alpaca Trading</p>
                  <p className="text-sm text-slate-500">Paper & live trading</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                  Not Connected
                </span>
              </div>
              <button className="w-full px-4 py-3 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors">
                Connect Alpaca
              </button>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-medium">Alpha Vantage</p>
                  <p className="text-sm text-slate-500">Stock market data</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Key: ****FYXZ</p>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-medium">Binance</p>
                  <p className="text-sm text-slate-500">Crypto trading</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                  Not Connected
                </span>
              </div>
              <button className="w-full px-4 py-3 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
                Connect Binance
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex h-[80vh]">
            {/* Sidebar */}
            <div className="w-56 bg-black/30 border-r border-white/10 p-4">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="text-teal-400" size={24} />
                Settings
              </h2>
              
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <section.icon size={18} />
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">
                  {sections.find(s => s.id === activeSection)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {renderSection()}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg bg-teal-500 text-white hover:bg-teal-400 transition-colors flex items-center gap-2"
                >
                  <Check size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
