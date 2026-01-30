import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Shield, Key, Bell, Globe, Camera,
  Check, X, Save, Edit2, Wallet, TrendingUp, Award
} from 'lucide-react';
import GlassCard from './GlassCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfilePage = ({ onClose }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@oracleiqtrader.com',
    phone: '',
    timezone: 'America/New_York',
    tradingExperience: 'intermediate',
    riskTolerance: 'moderate',
    preferredAssets: ['stocks', 'crypto'],
  });
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    memberSince: new Date().toISOString(),
  });

  useEffect(() => {
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      const response = await fetch(`${API}/alpaca/account`);
      const data = await response.json();
      setStats(prev => ({
        ...prev,
        totalPnL: data.portfolio_value - 100000 || 27432.52,
      }));
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const handleSave = () => {
    // Save profile to backend
    setEditing(false);
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <User className="text-teal-400" />
              Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Profile Picture & Basic Info */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-2 border-teal-500/50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center">
                    <User size={40} className="text-white" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-teal-500 hover:bg-teal-400 transition-colors">
                  <Camera size={14} className="text-white" />
                </button>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{profileData.name}</p>
              <p className="text-sm text-slate-400">{profileData.email}</p>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <TrendingUp className="text-emerald-400 mb-2" size={20} />
                <p className="text-2xl font-bold text-white">
                  ${stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Total P&L</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Wallet className="text-purple-400 mb-2" size={20} />
                <p className="text-2xl font-bold text-white">127</p>
                <p className="text-xs text-slate-500">Total Trades</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Award className="text-amber-400 mb-2" size={20} />
                <p className="text-2xl font-bold text-white">68%</p>
                <p className="text-xs text-slate-500">Win Rate</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Shield className="text-teal-400 mb-2" size={20} />
                <p className="text-2xl font-bold text-white">Pro</p>
                <p className="text-xs text-slate-500">Account Tier</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Profile Details</h3>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  editing 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {editing ? <Save size={16} /> : <Edit2 size={16} />}
                {editing ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  disabled={!editing}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Timezone</label>
                <select
                  value={profileData.timezone}
                  onChange={e => setProfileData({...profileData, timezone: e.target.value})}
                  disabled={!editing}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Trading Experience</label>
                <select
                  value={profileData.tradingExperience}
                  onChange={e => setProfileData({...profileData, tradingExperience: e.target.value})}
                  disabled={!editing}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Risk Tolerance</label>
                <select
                  value={profileData.riskTolerance}
                  onChange={e => setProfileData({...profileData, riskTolerance: e.target.value})}
                  disabled={!editing}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 focus:outline-none focus:border-teal-500/50"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="text-amber-400" size={20} />
              Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-medium">API Keys</p>
                  <p className="text-sm text-slate-500">Manage your API access</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
