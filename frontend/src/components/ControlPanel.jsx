import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Hand, Smile, Database, Sparkles, Activity, 
  ChevronUp, ChevronDown, Settings
} from 'lucide-react';
import NeonButton from './NeonButton';

const ControlPanel = ({ 
  onVoice, 
  onGesture, 
  onMood, 
  onOracle, 
  onMessage,
  voiceActive 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const controls = [
    { id: 'voice', icon: Mic, label: 'Voice', onClick: onVoice, variant: 'teal' },
    { id: 'gesture', icon: Hand, label: 'Gesture', onClick: onGesture, variant: 'indigo' },
    { id: 'mood', icon: Smile, label: 'Mood', onClick: onMood, variant: 'white' },
    { id: 'oracle', icon: Database, label: 'Oracle', onClick: onOracle, variant: 'indigo' },
    { id: 'message', icon: Sparkles, label: 'Message', onClick: onMessage, variant: 'teal' },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      data-testid="control-panel"
    >
      {/* Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-1 rounded-t-lg bg-black/60 backdrop-blur-xl border border-b-0 border-white/10 text-slate-400 hover:text-white transition-colors"
          data-testid="control-panel-toggle"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Control Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-black/80 backdrop-blur-2xl border-t border-white/10"
          >
            <div className="max-w-4xl mx-auto px-4 py-3">
              {/* Mobile: Horizontal scroll */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {/* Voice Status */}
                <div className="flex items-center gap-2 flex-shrink-0 pr-3 border-r border-white/10">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${voiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    {voiceActive ? 'Active' : 'Standby'}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {controls.map((ctrl) => (
                    <button
                      key={ctrl.id}
                      onClick={ctrl.onClick}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                        ctrl.variant === 'teal' 
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20' 
                          : ctrl.variant === 'indigo'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      data-testid={`ctrl-${ctrl.id}-btn`}
                    >
                      <ctrl.icon size={14} />
                      <span className="hidden sm:inline">{ctrl.label}</span>
                    </button>
                  ))}
                </div>

                {/* System Status */}
                <div className="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-white/10">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-xs font-mono text-emerald-400 whitespace-nowrap">Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed indicator */}
      {!isExpanded && (
        <div className="h-1 bg-gradient-to-r from-teal-500/50 via-indigo-500/50 to-teal-500/50" />
      )}
    </motion.div>
  );
};

export default ControlPanel;
