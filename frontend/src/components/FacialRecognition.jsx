import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';

const FacialRecognition = ({ mood, onMoodChange }) => {
  const [currentMood, setCurrentMood] = useState(mood || 'FOCUSED');
  const [confidence, setConfidence] = useState(98.2);
  const [faceDetected, setFaceDetected] = useState(true);

  const moods = [
    { state: 'FOCUSED', recommendation: 'Use detailed analysis view. Execute trades with standard confirmation.', color: 'teal' },
    { state: 'STRESSED', recommendation: 'Reduce position sizes. Enable additional confirmations.', color: 'rose' },
    { state: 'FATIGUED', recommendation: 'Consider taking a break. Auto-pilot mode recommended.', color: 'amber' },
    { state: 'CONFIDENT', recommendation: 'Optimal conditions for complex strategies.', color: 'emerald' },
  ];

  const cycleMood = () => {
    const currentIndex = moods.findIndex(m => m.state === currentMood);
    const nextIndex = (currentIndex + 1) % moods.length;
    const newMood = moods[nextIndex].state;
    setCurrentMood(newMood);
    setConfidence(85 + Math.random() * 13);
    if (onMoodChange) {
      onMoodChange(newMood);
    }
  };

  const currentMoodData = moods.find(m => m.state === currentMood) || moods[0];

  return (
    <div className="space-y-4" data-testid="facial-recognition-panel">
      {/* Face Detection Box */}
      <motion.div
        className="relative aspect-square max-w-[160px] rounded-xl overflow-hidden border-2 border-teal-500/50 bg-black/60"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={cycleMood}
        whileHover={{ scale: 1.02 }}
        data-testid="face-detection-box"
      >
        {/* Scanning grid overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 via-transparent to-teal-500/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(20, 184, 166, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(20, 184, 166, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        {/* Simulated face */}
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="relative">
            <User size={80} className="text-teal-500/60" />
            {/* Face mesh overlay effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-teal-400/30">
                <ellipse cx="50" cy="45" rx="35" ry="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <ellipse cx="35" cy="38" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <ellipse cx="65" cy="38" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 40 60 Q 50 68 60 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50" y1="45" x2="50" y2="55" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Confidence score */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
          <span className="font-mono text-xs text-teal-400">{confidence.toFixed(0)}</span>
        </div>

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-teal-500" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-500" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-teal-500" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-teal-500" />
      </motion.div>

      {/* Mood Analysis Card */}
      <GlassCard accent="teal" className="max-w-[300px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Expression:</span>
            <span className={`font-mono font-semibold ${
              currentMoodData.color === 'teal' ? 'text-teal-400' :
              currentMoodData.color === 'rose' ? 'text-rose-400' :
              currentMoodData.color === 'amber' ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {currentMood}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Confidence:</span>
            <span className="font-mono text-white">{confidence.toFixed(1)}%</span>
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Recommended Action:</p>
            <p className="text-sm text-slate-300">{currentMoodData.recommendation}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default FacialRecognition;
