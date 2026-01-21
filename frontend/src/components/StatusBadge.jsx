import React from 'react';
import { cn } from '../lib/utils';

const StatusBadge = ({ 
  children, 
  variant = 'default', 
  pulse = false,
  icon,
  className 
}) => {
  const variants = {
    default: 'border-white/10 bg-white/5 text-slate-300',
    active: 'border-teal-500/50 bg-teal-500/10 text-teal-400',
    warning: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    danger: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
    success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    info: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'text-xs font-medium font-mono uppercase tracking-wider',
        'backdrop-blur-sm transition-all duration-300',
        variants[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {pulse && variant === 'active' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
        </span>
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
