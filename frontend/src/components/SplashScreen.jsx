import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatrixBackground from './MatrixBackground';

const SplashScreen = ({ onComplete }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MatrixBackground />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="relative w-24 h-24 mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 backdrop-blur-xl" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <motion.path
                d="M 50 15 C 70 15, 85 30, 85 50 C 85 70, 70 85, 50 85 C 30 85, 15 70, 15 50 C 15 30, 30 15, 50 15"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M 30 50 L 45 50 L 55 35 L 70 50"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </svg>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-xl animate-pulse" />
        </motion.div>

        {/* Title */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-slate-500">💡</span>
          <h1 className="font-heading text-xl md:text-2xl font-medium text-slate-300 tracking-wide">
            Next-Gen Algorithmic Trading Platform
          </h1>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-teal-500/20 text-teal-400 border border-teal-500/30">
            PRO
          </span>
        </motion.div>

        {/* Enter Button */}
        <AnimatePresence>
          {showButton && (
            <motion.button
              onClick={onComplete}
              className="mt-12 px-8 py-4 rounded-xl bg-slate-800/80 backdrop-blur-xl border border-white/10 
                         text-white font-medium text-lg
                         hover:bg-slate-700/80 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]
                         transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="enter-platform-btn"
            >
              Launch OracleIQ
            </motion.button>
          )}
        </AnimatePresence>

        {/* Subtitle */}
        <motion.p
          className="mt-6 text-sm text-slate-600 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          OracleIQTrader.com - AI Trading Platform v1.0
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
