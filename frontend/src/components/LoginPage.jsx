import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MatrixBackground from './MatrixBackground';
import NeonButton from './NeonButton';
import { LogIn, Zap, Shield, Brain, TrendingUp } from 'lucide-react';

const LoginPage = () => {
  const { loginWithGoogle, isLoading } = useAuth();

  const features = [
    { icon: Brain, title: 'AI-Powered Analysis', desc: 'Multi-agent consensus system' },
    { icon: TrendingUp, title: 'Real-Time Markets', desc: 'Live crypto & stock prices' },
    { icon: Shield, title: 'Secure Trading', desc: 'Enterprise-grade security' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      <MatrixBackground />
      
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Zap className="text-teal-400" size={36} />
          </motion.div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-white mb-2">
            Cognitive Oracle
          </h1>
          <p className="text-slate-500 font-mono text-sm">
            AI-Powered Trading Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-heading font-semibold text-white mb-6 text-center">
            Sign in to continue
          </h2>

          {/* Google Sign In Button */}
          <NeonButton
            onClick={loginWithGoogle}
            variant="white"
            className="w-full py-4 text-base"
            disabled={isLoading}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </NeonButton>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-600 text-xs font-mono">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Continue as Guest */}
          <NeonButton
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="w-full"
            data-testid="guest-continue-btn"
          >
            <LogIn size={16} />
            Continue as Guest
          </NeonButton>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="grid grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <feature.icon size={20} className="text-teal-400 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-500">{feature.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs font-mono mt-6">
          Powered by Emergent AI • Enterprise Grade Security
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
