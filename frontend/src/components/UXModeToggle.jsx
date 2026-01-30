import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, ChevronRight, Check } from 'lucide-react';
import { useUXMode, UX_MODES, MODE_FEATURES } from '../contexts/UXModeContext';

const UXModeToggle = ({ compact = false }) => {
  const { mode, setMode, isSimpleMode, isProMode } = useUXMode();

  if (compact) {
    return (
      <button
        onClick={() => setMode(isSimpleMode ? UX_MODES.PRO : UX_MODES.SIMPLE)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
          isProMode
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
        }`}
        data-testid="ux-mode-toggle"
      >
        {isProMode ? <Zap size={12} /> : <Shield size={12} />}
        {isProMode ? 'Pro' : 'Simple'}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10" data-testid="ux-mode-selector">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white">Trading Mode</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          isProMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
        }`}>
          {isProMode ? 'PRO' : 'SIMPLE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Simple Mode */}
        <button
          onClick={() => setMode(UX_MODES.SIMPLE)}
          className={`p-4 rounded-xl transition-all text-left ${
            isSimpleMode
              ? 'bg-teal-500/20 border-2 border-teal-500/50'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-5 h-5 ${isSimpleMode ? 'text-teal-400' : 'text-slate-400'}`} />
            <span className={`font-bold ${isSimpleMode ? 'text-white' : 'text-slate-300'}`}>Simple</span>
            {isSimpleMode && <Check size={14} className="text-teal-400 ml-auto" />}
          </div>
          <p className="text-xs text-slate-500">
            Streamlined for beginners. Basic trading, no leverage.
          </p>
        </button>

        {/* Pro Mode */}
        <button
          onClick={() => setMode(UX_MODES.PRO)}
          className={`p-4 rounded-xl transition-all text-left ${
            isProMode
              ? 'bg-amber-500/20 border-2 border-amber-500/50'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-5 h-5 ${isProMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className={`font-bold ${isProMode ? 'text-white' : 'text-slate-300'}`}>Pro</span>
            {isProMode && <Check size={14} className="text-amber-400 ml-auto" />}
          </div>
          <p className="text-xs text-slate-500">
            Full depth. Options, futures, API access.
          </p>
        </button>
      </div>
    </div>
  );
};

// Full page mode selector shown on first visit
export const UXModeOnboarding = ({ onComplete }) => {
  const { setMode } = useUXMode();

  const handleSelect = (selectedMode) => {
    setMode(selectedMode);
    localStorage.setItem('uxModeOnboarded', 'true');
    onComplete?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Choose Your Experience</h2>
          <p className="text-slate-400">You can change this anytime in settings</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Simple Mode Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(UX_MODES.SIMPLE)}
            className="p-8 rounded-2xl bg-gradient-to-br from-teal-500/20 to-transparent border-2 border-teal-500/30 hover:border-teal-500/50 transition-all text-left"
          >
            <Shield className="w-12 h-12 text-teal-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Simple Mode</h3>
            <p className="text-slate-400 mb-6">Perfect for beginners. Clean interface with essential features.</p>
            
            <div className="space-y-2 text-sm">
              {['Basic Trading', 'Price Alerts', 'Portfolio Tracking', 'Copy Trading', 'News Feed'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className="text-teal-400" />
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-teal-400 font-medium">
              Get Started <ChevronRight size={16} />
            </div>
          </motion.button>

          {/* Pro Mode Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(UX_MODES.PRO)}
            className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border-2 border-amber-500/30 hover:border-amber-500/50 transition-all text-left"
          >
            <Zap className="w-12 h-12 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Pro Mode</h3>
            <p className="text-slate-400 mb-6">Full institutional depth. Every tool at your fingertips.</p>
            
            <div className="space-y-2 text-sm">
              {['All Asset Classes', 'Options & Futures', 'Risk Dashboard', 'AI Agents', 'API Access'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className="text-amber-400" />
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-amber-400 font-medium">
              Go Pro <ChevronRight size={16} />
            </div>
          </motion.button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Both modes are free. Pro mode simply shows more features.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default UXModeToggle;
