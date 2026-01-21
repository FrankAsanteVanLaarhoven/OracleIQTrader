import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ZoomIn, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';

const GestureRecognition = ({ onGesture }) => {
  const [lastGesture, setLastGesture] = useState(null);
  const [handDetected, setHandDetected] = useState('Left Hand');
  const [gestureTime, setGestureTime] = useState(2);
  const [isReady, setIsReady] = useState(true);

  const gestures = [
    { name: 'PINCH', icon: ZoomIn, action: 'Zoom In', color: 'teal' },
    { name: 'SWIPE_LEFT', icon: ArrowLeft, action: 'Previous', color: 'indigo' },
    { name: 'SWIPE_RIGHT', icon: ArrowRight, action: 'Next', color: 'indigo' },
    { name: 'THUMBS_UP', icon: ThumbsUp, action: 'Approve Trade', color: 'emerald' },
    { name: 'THUMBS_DOWN', icon: ThumbsDown, action: 'Reject Trade', color: 'rose' },
  ];

  const simulateGesture = () => {
    const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
    setLastGesture(randomGesture);
    setGestureTime(0);
    setHandDetected(Math.random() > 0.5 ? 'Right Hand' : 'Left Hand');
    
    if (onGesture) {
      onGesture(randomGesture);
    }

    // Ephemeral - gesture fades
    const interval = setInterval(() => {
      setGestureTime(prev => {
        if (prev >= 5) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  return (
    <div data-testid="gesture-recognition-panel">
      <GlassCard title="Gesture Recognition" icon="✋" accent="white">
        <div className="space-y-4">
          {/* Hand Detection Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Hand Detected:</span>
            <StatusBadge variant="active" pulse>
              {handDetected}
            </StatusBadge>
          </div>

          {/* Last Gesture */}
          <AnimatePresence mode="wait">
            {lastGesture && (
              <motion.div
                key={lastGesture.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Last Gesture:</span>
                  <span className={`font-mono text-sm ${
                    lastGesture.color === 'teal' ? 'text-teal-400' :
                    lastGesture.color === 'emerald' ? 'text-emerald-400' :
                    lastGesture.color === 'rose' ? 'text-rose-400' :
                    'text-indigo-400'
                  }`}>
                    {lastGesture.name.replace('_', ' ')} ({gestureTime}s ago)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ready for gestures */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Ready For:</span>
            <span className="font-mono text-sm text-slate-300">Swipe / Thumbs</span>
          </div>

          {/* Gesture Icons */}
          <div className="flex gap-2 pt-2 border-t border-white/5">
            {gestures.map((gesture) => {
              const Icon = gesture.icon;
              return (
                <motion.button
                  key={gesture.name}
                  onClick={() => {
                    setLastGesture(gesture);
                    setGestureTime(0);
                    if (onGesture) onGesture(gesture);
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    lastGesture?.name === gesture.name
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  data-testid={`gesture-btn-${gesture.name.toLowerCase()}`}
                >
                  <Icon size={18} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default GestureRecognition;
