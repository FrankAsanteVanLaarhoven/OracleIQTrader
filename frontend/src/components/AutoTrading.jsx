import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, Pause, Settings, TrendingUp, TrendingDown,
  AlertTriangle, Check, X, Activity, Zap, Shield, Target
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const AutoTrading = ({ currentPrices = {}, onTrade }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [strategies, setStrategies] = useState([
    {
      id: 'momentum',
      name: 'Momentum Strategy',
      description: 'Buy when RSI < 30, Sell when RSI > 70',
      enabled: false,
      symbols: ['BTC', 'ETH'],
      riskLevel: 'medium',
      maxPositionSize: 0.5,
      trades: 0,
      pnl: 0
    },
    {
      id: 'mean-reversion',
      name: 'Mean Reversion',
      description: 'Trade price deviations from moving average',
      enabled: false,
      symbols: ['AAPL', 'NVDA'],
      riskLevel: 'low',
      maxPositionSize: 1000,
      trades: 0,
      pnl: 0
    },
    {
      id: 'breakout',
      name: 'Breakout Trader',
      description: 'Enter on price breakouts from range',
      enabled: false,
      symbols: ['BTC', 'ETH', 'SOL'],
      riskLevel: 'high',
      maxPositionSize: 0.25,
      trades: 0,
      pnl: 0
    },
    {
      id: 'dca',
      name: 'Dollar Cost Average',
      description: 'Regular interval buying regardless of price',
      enabled: false,
      symbols: ['BTC'],
      riskLevel: 'low',
      maxPositionSize: 0.01,
      interval: '1h',
      trades: 0,
      pnl: 0
    }
  ]);
  const [autoTrades, setAutoTrades] = useState([]);
  const [settings, setSettings] = useState({
    maxDailyTrades: 10,
    maxDailyLoss: 500,
    paperMode: true,
    notifications: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    trades: 0,
    pnl: 0,
    wins: 0,
    losses: 0
  });

  // Simulate auto trading
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const enabledStrategies = strategies.filter(s => s.enabled);
      if (enabledStrategies.length === 0) return;
      if (dailyStats.trades >= settings.maxDailyTrades) return;
      if (dailyStats.pnl <= -settings.maxDailyLoss) {
        setIsEnabled(false);
        return;
      }

      // Random trade simulation
      if (Math.random() > 0.7) {
        const strategy = enabledStrategies[Math.floor(Math.random() * enabledStrategies.length)];
        const symbol = strategy.symbols[Math.floor(Math.random() * strategy.symbols.length)];
        const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const price = currentPrices[symbol] || 1000;
        const quantity = strategy.maxPositionSize;
        const pnl = (Math.random() - 0.4) * price * quantity * 0.02; // Slight positive bias

        const trade = {
          id: Date.now(),
          strategy: strategy.name,
          symbol,
          side,
          quantity,
          price,
          pnl: Math.round(pnl * 100) / 100,
          timestamp: new Date().toISOString()
        };

        setAutoTrades(prev => [trade, ...prev].slice(0, 20));
        setDailyStats(prev => ({
          trades: prev.trades + 1,
          pnl: prev.pnl + trade.pnl,
          wins: trade.pnl > 0 ? prev.wins + 1 : prev.wins,
          losses: trade.pnl < 0 ? prev.losses + 1 : prev.losses
        }));

        // Update strategy stats
        setStrategies(prev => prev.map(s => 
          s.id === strategy.id 
            ? { ...s, trades: s.trades + 1, pnl: s.pnl + trade.pnl }
            : s
        ));

        if (onTrade) onTrade(trade);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isEnabled, strategies, currentPrices, dailyStats, settings, onTrade]);

  const toggleStrategy = (id) => {
    setStrategies(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const getRiskColor = (level) => {
    if (level === 'low') return 'text-emerald-400';
    if (level === 'medium') return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-4" data-testid="auto-trading-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="text-indigo-400" size={20} />
          Auto Trading
          {settings.paperMode && (
            <StatusBadge variant="warning">PAPER</StatusBadge>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <NeonButton
            onClick={() => setShowSettings(true)}
            variant="ghost"
            size="sm"
          >
            <Settings size={14} />
          </NeonButton>
          <NeonButton
            onClick={() => setIsEnabled(!isEnabled)}
            variant={isEnabled ? 'rose' : 'teal'}
            size="sm"
            data-testid="toggle-auto-trading"
          >
            {isEnabled ? <Pause size={14} /> : <Play size={14} />}
            {isEnabled ? 'Stop' : 'Start'}
          </NeonButton>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-4 gap-3">
        <GlassCard accent="white" className="text-center py-3">
          <Activity size={16} className="text-indigo-400 mx-auto mb-1" />
          <p className="text-lg font-mono font-bold text-white">{dailyStats.trades}</p>
          <p className="text-xs text-slate-500">Trades</p>
        </GlassCard>
        <GlassCard accent={dailyStats.pnl >= 0 ? 'teal' : 'rose'} className="text-center py-3">
          <Zap size={16} className={dailyStats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          <p className={`text-lg font-mono font-bold ${dailyStats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dailyStats.pnl >= 0 ? '+' : ''}${dailyStats.pnl.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">P&L</p>
        </GlassCard>
        <GlassCard accent="white" className="text-center py-3">
          <TrendingUp size={16} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-mono font-bold text-emerald-400">{dailyStats.wins}</p>
          <p className="text-xs text-slate-500">Wins</p>
        </GlassCard>
        <GlassCard accent="white" className="text-center py-3">
          <TrendingDown size={16} className="text-rose-400 mx-auto mb-1" />
          <p className="text-lg font-mono font-bold text-rose-400">{dailyStats.losses}</p>
          <p className="text-xs text-slate-500">Losses</p>
        </GlassCard>
      </div>

      {/* Strategies */}
      <GlassCard accent="indigo">
        <h4 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
          <Target size={16} className="text-indigo-400" />
          Trading Strategies
        </h4>
        <div className="space-y-3">
          {strategies.map(strategy => (
            <div
              key={strategy.id}
              className={`p-3 rounded-lg transition-all ${
                strategy.enabled 
                  ? 'bg-indigo-500/10 border border-indigo-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStrategy(strategy.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      strategy.enabled
                        ? 'bg-indigo-500/30 text-indigo-400'
                        : 'bg-white/5 text-slate-600'
                    }`}
                    data-testid={`toggle-strategy-${strategy.id}`}
                  >
                    {strategy.enabled ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <div>
                    <p className="font-mono font-semibold text-white text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-500">{strategy.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm ${strategy.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">{strategy.trades} trades</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-1">
                  {strategy.symbols.map(sym => (
                    <span key={sym} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {sym}
                    </span>
                  ))}
                </div>
                <span className={`flex items-center gap-1 ${getRiskColor(strategy.riskLevel)}`}>
                  <Shield size={10} />
                  {strategy.riskLevel} risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Auto Trades */}
      {autoTrades.length > 0 && (
        <GlassCard accent="white">
          <h4 className="font-heading font-semibold text-white mb-3">Recent Auto Trades</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {autoTrades.slice(0, 5).map(trade => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge variant={trade.side === 'BUY' ? 'success' : 'danger'}>
                    {trade.side}
                  </StatusBadge>
                  <span className="font-mono text-white">{trade.symbol}</span>
                  <span className="text-xs text-slate-500">x{trade.quantity}</span>
                </div>
                <div className="text-right">
                  <p className={`font-mono ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600">{trade.strategy}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <GlassCard accent="indigo">
                <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="text-indigo-400" />
                  Auto Trading Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">Max Daily Trades</label>
                    <input
                      type="number"
                      value={settings.maxDailyTrades}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxDailyTrades: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                      min={1}
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">Max Daily Loss ($)</label>
                    <input
                      type="number"
                      value={settings.maxDailyLoss}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxDailyLoss: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                      min={0}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-white">Paper Trading Mode</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, paperMode: !prev.paperMode }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.paperMode ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        settings.paperMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <NeonButton onClick={() => setShowSettings(false)} variant="indigo" className="w-full">
                    <Check size={16} />
                    Save Settings
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      {!settings.paperMode && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
          <AlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-400">
            <strong>Live Trading Active</strong> - Real funds will be used. Enable Paper Mode for risk-free testing.
          </p>
        </div>
      )}
    </div>
  );
};

export default AutoTrading;
