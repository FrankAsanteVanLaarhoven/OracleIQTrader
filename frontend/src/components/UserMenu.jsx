import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings, CreditCard } from 'lucide-react';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';

const UserMenu = ({ onNavigate }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <div className="relative group">
        {/* User Avatar Button */}
        <motion.button
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid="user-menu-btn"
        >
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-8 h-8 rounded-full border border-white/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <User size={16} className="text-teal-400" />
            </div>
          )}
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-white truncate max-w-[120px]">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate max-w-[120px]">
              {user.email}
            </p>
          </div>
        </motion.button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-500 font-mono">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button 
                onClick={() => setShowProfile(true)}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="profile-btn"
              >
                <User size={16} />
                <span className="text-sm">Profile</span>
              </button>
              <button 
                onClick={() => onNavigate?.('portfolio')}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="portfolio-btn"
              >
                <CreditCard size={16} />
                <span className="text-sm">Portfolio</span>
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                data-testid="settings-btn"
              >
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-white/5 py-2">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut size={16} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfilePage onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserMenu;
