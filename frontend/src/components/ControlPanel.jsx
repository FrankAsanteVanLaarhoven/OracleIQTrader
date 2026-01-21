import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Hand, Smile, Database, Sparkles, Activity } from 'lucide-react';
import NeonButton from './NeonButton';

const ControlPanel = ({ 
  onVoice, 
  onGesture, 
  onMood, 
  onOracle, 
  onMessage,
  voiceActive 
}) => {
  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
      data-testid="control-panel"
    >
      <div className="bg-black/60 backdrop-blur-2xl border-t border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Voice Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${voiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-mono text-slate-500">
              Voice: {voiceActive ? 'Active' : 'Standby'}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3">
            <NeonButton 
              onClick={onVoice} 
              variant="teal" 
              size="default"
              icon={<Mic size={16} />}
              data-testid="ctrl-voice-btn"
            >
              Start Listening
            </NeonButton>

            <NeonButton 
              onClick={onGesture} 
              variant="indigo" 
              size="default"
              icon={<Hand size={16} />}
              data-testid="ctrl-gesture-btn"
            >
              Hand Gesture
            </NeonButton>

            <NeonButton 
              onClick={onMood} 
              variant="white" 
              size="default"
              icon={<Smile size={16} />}
              data-testid="ctrl-mood-btn"
            >
              Toggle Mood
            </NeonButton>

            <NeonButton 
              onClick={onOracle} 
              variant="indigo" 
              size="default"
              icon={<Database size={16} />}
              data-testid="ctrl-oracle-btn"
            >
              Query Oracle
            </NeonButton>

            <NeonButton 
              onClick={onMessage} 
              variant="teal" 
              size="default"
              icon={<Sparkles size={16} />}
              data-testid="ctrl-message-btn"
            >
              New Message
            </NeonButton>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">System Online</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ControlPanel;
