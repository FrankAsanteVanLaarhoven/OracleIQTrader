import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const NeonButton = ({ 
  children, 
  variant = 'teal', 
  size = 'default',
  icon,
  className,
  disabled,
  ...props 
}) => {
  const variants = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/50 hover:bg-teal-500/20 hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/50 hover:bg-rose-500/20 hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/20 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]',
    white: 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]',
    ghost: 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'rounded-lg border font-mono font-medium',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default NeonButton;
