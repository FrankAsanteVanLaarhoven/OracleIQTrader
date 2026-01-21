import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'default' }) => {
  const { theme, currentTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeIcons = {
    dark: Moon,
    light: Sun,
    matrix: Monitor
  };

  const CurrentIcon = themeIcons[theme] || Moon;

  if (variant === 'simple') {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        data-testid="theme-toggle-simple"
      >
        <CurrentIcon size={14} />
      </button>
    );
  }

  return (
    <div className="relative" data-testid="theme-toggle">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all"
      >
        <CurrentIcon size={14} />
        <span className="text-xs font-mono hidden sm:inline">{currentTheme.name}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[140px] py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl"
            >
              {Object.values(THEMES).map((t) => {
                const Icon = themeIcons[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      theme === t.id
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                    data-testid={`theme-${t.id}`}
                  >
                    <Icon size={14} />
                    <span className="text-sm font-mono flex-1">{t.name}</span>
                    {theme === t.id && (
                      <Check size={14} className="text-teal-400" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
