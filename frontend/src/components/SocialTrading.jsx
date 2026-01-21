import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Copy, TrendingUp, TrendingDown, Star, 
  Award, Shield, Eye, UserPlus, Check, X 
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Top Traders Data (would come from API in production)
const TOP_TRADERS = [
  {
    id: 'trader_1',
    name: 'CryptoWhale',
    avatar: '🐋',
    winRate: 78.5,
    totalPnL: 145230,
    followers: 12543,
    riskLevel: 'MODERATE',
    monthlyReturn: 24.5,
    trades: 156,
    speciality: 'Crypto Swing Trading',
    verified: true
  },
  {
    id: 'trader_2',
    name: 'TechBull',
    avatar: '🐂',
    winRate: 72.3,
    totalPnL: 89450,
    followers: 8921,
    riskLevel: 'LOW',
    monthlyReturn: 18.2,
    trades: 243,
    speciality: 'Tech Stocks',
    verified: true
  },
  {
    id: 'trader_3',
    name: 'QuantMaster',
    avatar: '🤖',
    winRate: 81.2,
    totalPnL: 234500,
    followers: 15678,
    riskLevel: 'HIGH',
    monthlyReturn: 32.8,
    trades: 89,
    speciality: 'Algorithmic Trading',
    verified: true
  },
  {
    id: 'trader_4',
    name: 'SteadyEddie',
    avatar: '🎯',
    winRate: 68.9,
    totalPnL: 56780,
    followers: 5432,
    riskLevel: 'LOW',
    monthlyReturn: 12.4,
    trades: 312,
    speciality: 'Value Investing',
    verified: false
  }
];

const TraderCard = ({ trader, onCopy, isCopying }) => {
  const riskColors = {
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    MODERATE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    HIGH: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <GlassCard accent="white" className="hover:border-teal-500/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center text-2xl border border-white/10">
              {trader.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-semibold text-white">{trader.name}</h4>
                {trader.verified && (
                  <Shield size={14} className="text-teal-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{trader.speciality}</p>
            </div>
          </div>
          <StatusBadge variant={trader.riskLevel === 'LOW' ? 'success' : trader.riskLevel === 'HIGH' ? 'danger' : 'warning'}>
            {trader.riskLevel}
          </StatusBadge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-xs font-mono text-slate-500">Win Rate</p>
            <p className="text-lg font-mono font-bold text-emerald-400">{trader.winRate}%</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-xs font-mono text-slate-500">Monthly</p>
            <p className={`text-lg font-mono font-bold ${trader.monthlyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              +{trader.monthlyReturn}%
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-xs font-mono text-slate-500">Total P&L</p>
            <p className="text-lg font-mono font-bold text-white">
              ${(trader.totalPnL / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-4 text-slate-500 text-xs font-mono">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {trader.followers.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={12} />
              {trader.trades} trades
            </span>
          </div>
          <NeonButton
            onClick={() => onCopy(trader)}
            variant={isCopying ? 'teal' : 'white'}
            size="sm"
            data-testid={`copy-trader-${trader.id}`}
          >
            {isCopying ? <Check size={14} /> : <Copy size={14} />}
            {isCopying ? 'Copying' : 'Copy'}
          </NeonButton>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const SocialTrading = ({ onClose }) => {
  const [topTraders, setTopTraders] = useState(TOP_TRADERS);
  const [copiedTraders, setCopiedTraders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showCopyModal, setShowCopyModal] = useState(null);
  const [copyAmount, setCopyAmount] = useState(1000);

  const handleCopyTrader = (trader) => {
    if (copiedTraders.includes(trader.id)) {
      setCopiedTraders(prev => prev.filter(id => id !== trader.id));
    } else {
      setShowCopyModal(trader);
    }
  };

  const confirmCopy = () => {
    if (showCopyModal) {
      setCopiedTraders(prev => [...prev, showCopyModal.id]);
      setShowCopyModal(null);
    }
  };

  const filteredTraders = topTraders.filter(trader => {
    if (filter === 'all') return true;
    if (filter === 'low-risk') return trader.riskLevel === 'LOW';
    if (filter === 'high-return') return trader.monthlyReturn > 20;
    if (filter === 'verified') return trader.verified;
    return true;
  });

  return (
    <div className="space-y-6" data-testid="social-trading-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-teal-400" />
            Social Trading
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Copy top traders and mirror their strategies
          </p>
        </div>
        {onClose && (
          <NeonButton onClick={onClose} variant="ghost" size="sm">
            <X size={16} />
          </NeonButton>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <GlassCard accent="teal" className="text-center">
          <Award className="text-teal-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-mono font-bold text-white">{topTraders.length}</p>
          <p className="text-xs text-slate-500 font-mono">Top Traders</p>
        </GlassCard>
        <GlassCard accent="white" className="text-center">
          <Users className="text-indigo-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-mono font-bold text-white">
            {topTraders.reduce((acc, t) => acc + t.followers, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-mono">Total Followers</p>
        </GlassCard>
        <GlassCard accent="white" className="text-center">
          <TrendingUp className="text-emerald-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {(topTraders.reduce((acc, t) => acc + t.monthlyReturn, 0) / topTraders.length).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 font-mono">Avg Monthly Return</p>
        </GlassCard>
        <GlassCard accent="white" className="text-center">
          <Copy className="text-amber-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-mono font-bold text-white">{copiedTraders.length}</p>
          <p className="text-xs text-slate-500 font-mono">Traders Copied</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'low-risk', 'high-return', 'verified'].map((f) => (
          <NeonButton
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'teal' : 'ghost'}
            size="sm"
          >
            {f === 'all' ? 'All Traders' : 
             f === 'low-risk' ? 'Low Risk' : 
             f === 'high-return' ? 'High Return' : 'Verified'}
          </NeonButton>
        ))}
      </div>

      {/* Traders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTraders.map((trader) => (
          <TraderCard
            key={trader.id}
            trader={trader}
            onCopy={handleCopyTrader}
            isCopying={copiedTraders.includes(trader.id)}
          />
        ))}
      </div>

      {/* Copy Modal */}
      <AnimatePresence>
        {showCopyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCopyModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <GlassCard accent="teal">
                <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="text-teal-400" />
                  Copy {showCopyModal.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">
                      Amount to Allocate (USD)
                    </label>
                    <input
                      type="number"
                      value={copyAmount}
                      onChange={(e) => setCopyAmount(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-teal-500/50 focus:outline-none"
                      min={100}
                      step={100}
                    />
                  </div>
                  
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-mono">
                      ⚠️ Copy trading involves risk. Past performance is not indicative of future results.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <NeonButton onClick={() => setShowCopyModal(null)} variant="ghost" className="flex-1">
                      Cancel
                    </NeonButton>
                    <NeonButton onClick={confirmCopy} variant="teal" className="flex-1" data-testid="confirm-copy-btn">
                      <Check size={16} />
                      Start Copying
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialTrading;
