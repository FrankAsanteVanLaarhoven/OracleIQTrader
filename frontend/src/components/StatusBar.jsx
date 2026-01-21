import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Hand, Brain, Shield, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';

const StatusBar = ({ voiceActive, gestureReady, mood, riskLevel = 'LOW' }) => {
  return (
    <motion.div 
      className="flex items-center justify-center gap-4 flex-wrap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="status-bar"
    >
      {/* Voice Status */}
      <StatusBadge 
        variant={voiceActive ? 'active' : 'default'} 
        pulse={voiceActive}
        data-testid="voice-status"
      >
        <Mic size={14} />
        Voice: {voiceActive ? 'Active' : 'Inactive'}
      </StatusBadge>

      {/* Gesture Status */}
      <StatusBadge 
        variant={gestureReady ? 'active' : 'default'}
        data-testid="gesture-status"
      >
        <Hand size={14} />
        Gesture Ready
      </StatusBadge>

      {/* Mood Status */}
      <StatusBadge 
        variant={
          mood === 'FOCUSED' || mood === 'CONFIDENT' ? 'active' :
          mood === 'STRESSED' ? 'danger' :
          mood === 'FATIGUED' ? 'warning' : 'default'
        }
        data-testid="mood-status"
      >
        <Brain size={14} />
        Mood: {mood || 'FOCUSED'}
      </StatusBadge>

      {/* Risk Level */}
      <StatusBadge 
        variant={
          riskLevel === 'LOW' ? 'success' :
          riskLevel === 'MODERATE' ? 'warning' : 'danger'
        }
        data-testid="risk-status"
      >
        <Shield size={14} />
        Risk: {riskLevel}
      </StatusBadge>
    </motion.div>
  );
};

export default StatusBar;
