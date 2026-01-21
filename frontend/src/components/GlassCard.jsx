import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const GlassCard = ({ 
  children, 
  className, 
  title, 
  icon,
  accent = 'teal',
  animate = true,
  glowOnHover = true,
  ...props 
}) => {
  const accentColors = {
    teal: 'border-teal-500/30 hover:border-teal-500/50',
    rose: 'border-rose-500/30 hover:border-rose-500/50',
    indigo: 'border-indigo-500/30 hover:border-indigo-500/50',
    white: 'border-white/10 hover:border-white/20',
  };

  const glowColors = {
    teal: 'hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]',
    rose: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]',
    indigo: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]',
    white: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]',
  };

  const Wrapper = animate ? motion.div : 'div';
  const animateProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  } : {};

  return (
    <Wrapper
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-black/40 backdrop-blur-xl',
        'border transition-all duration-300',
        accentColors[accent],
        glowOnHover && glowColors[accent],
        className
      )}
      {...animateProps}
      {...props}
    >
      {title && (
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          {icon && <span className="text-xl">{icon}</span>}
          <h3 className="font-heading text-lg font-semibold uppercase tracking-wider text-white/90">
            {title}
          </h3>
        </div>
      )}
      <div className={title ? 'p-5' : 'p-5'}>
        {children}
      </div>
    </Wrapper>
  );
};

export default GlassCard;
