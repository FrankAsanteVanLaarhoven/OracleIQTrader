import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Play, Pause, Settings, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, XCircle, Brain, Activity,
  Zap, Shield, Target, BarChart3, RefreshCw
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL;

const AutonomousBot = ({ accountId }) => {
  const [bot, setBot] = useState(null);
  const [bots, setBots] = useState([]);
  const [signals, setSignals] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [newBotConfig, setNewBotConfig] = useState({
    strategy: 'moderate',
    tradingPairs: ['BTC', 'ETH', 'SOL']
  });

  // Fetch user's bots
  const fetchBots = useCallback(async () => {
    try {
      const response = await fetch(`${API}/bot/user/bots`);
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
        if (data.bots?.length > 0 && !bot) {
          setBot(data.bots[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  }, [bot]);

  // Fetch bot performance
  const fetchPerformance = async (botId) => {
    try {
      const response = await fetch(`${API}/bot/${botId}/performance`);
      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  // Fetch pending signals
  const fetchSignals = async (botId) => {
    try {
      const response = await fetch(`${API}/bot/${botId}/signals`);
      if (response.ok) {
        const data = await response.json();
        setSignals(data.signals || []);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  // Create new bot
  const createBot = async () => {
    if (!accountId) {
      alert('Please create a playground account first');
      return;
    }
    
    setCreating(true);
    try {
      const params = new URLSearchParams({
        account_id: accountId,
        strategy: newBotConfig.strategy
      });
      newBotConfig.tradingPairs.forEach(p => params.append('trading_pairs', p));

      const response = await fetch(`${API}/bot/create?${params}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setBot(data);
        setBots(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error creating bot:', error);
    } finally {
      setCreating(false);
    }
  };

  // Set bot mode
  const setBotMode = async (botId, mode) => {
    try {
      const response = await fetch(`${API}/bot/${botId}/mode?mode=${mode}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setBot(prev => prev ? { ...prev, mode, is_active: mode !== 'paused' } : null);
      }
    } catch (error) {
      console.error('Error setting bot mode:', error);
    }
  };

  // Approve signal
  const approveSignal = async (signalId) => {
    try {
      const response = await fetch(`${API}/bot/signal/${signalId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        setSignals(prev => prev.filter(s => s.id !== signalId));
        if (bot) fetchPerformance(bot.id);
      }
    } catch (error) {
      console.error('Error approving signal:', error);
    }
  };

  // Reject signal
  const rejectSignal = async (signalId) => {
    try {
      const response = await fetch(`${API}/bot/signal/${signalId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        setSignals(prev => prev.filter(s => s.id !== signalId));
      }
    } catch (error) {
      console.error('Error rejecting signal:', error);
    }
  };

  // Trigger manual analysis
  const triggerAnalysis = async () => {
    if (!bot) return;
    try {
      const response = await fetch(`${API}/bot/${bot.id}/analyze?symbol=BTC`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.signal) {
          setSignals(prev => [data.signal, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (bot) {
      fetchPerformance(bot.id);
      fetchSignals(bot.id);
      
      // Poll for updates
      const interval = setInterval(() => {
        fetchPerformance(bot.id);
        fetchSignals(bot.id);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [bot?.id]);

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'strong_buy': return 'text-green-400 bg-green-500/20';
      case 'buy': return 'text-green-300 bg-green-500/10';
      case 'strong_sell': return 'text-red-400 bg-red-500/20';
      case 'sell': return 'text-red-300 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'full_auto': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'semi_auto': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-teal-400" size={32} />
        <span className="ml-3 text-slate-400">Loading bot...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="autonomous-bot">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-teal-400" />
            AI Trading Bot
          </h2>
          <p className="text-slate-400 text-sm">Autonomous trading with AI-powered analysis</p>
        </div>
      </div>

      {!bot ? (
        /* Create Bot Form */
        <GlassCard title="Create Trading Bot" icon="🤖" accent="cyan">
          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Trading Strategy</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'conservative', name: 'Conservative', icon: Shield, desc: 'Low risk, steady gains' },
                  { id: 'moderate', name: 'Moderate', icon: BarChart3, desc: 'Balanced approach' },
                  { id: 'aggressive', name: 'Aggressive', icon: Zap, desc: 'Higher risk/reward' }
                ].map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setNewBotConfig(prev => ({ ...prev, strategy: strategy.id }))}
                    className={`p-4 rounded-xl border transition-all ${
                      newBotConfig.strategy === strategy.id
                        ? 'border-teal-500/50 bg-teal-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <strategy.icon className={`mx-auto mb-2 ${
                      newBotConfig.strategy === strategy.id ? 'text-teal-400' : 'text-slate-400'
                    }`} size={24} />
                    <p className={`font-semibold ${
                      newBotConfig.strategy === strategy.id ? 'text-white' : 'text-slate-300'
                    }`}>{strategy.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{strategy.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Trading Pairs</label>
              <div className="flex flex-wrap gap-2">
                {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK'].map(pair => (
                  <button
                    key={pair}
                    onClick={() => {
                      setNewBotConfig(prev => ({
                        ...prev,
                        tradingPairs: prev.tradingPairs.includes(pair)
                          ? prev.tradingPairs.filter(p => p !== pair)
                          : [...prev.tradingPairs, pair]
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                      newBotConfig.tradingPairs.includes(pair)
                        ? 'bg-teal-500/30 text-teal-400 border border-teal-500/50'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
            </div>

            <NeonButton onClick={createBot} variant="cyan" size="lg" className="w-full" disabled={creating}>
              {creating ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <>
                  <Bot size={18} />
                  Create Trading Bot
                </>
              )}
            </NeonButton>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Bot Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`font-semibold ${bot.is_active ? 'text-green-400' : 'text-slate-400'}`}>
                    {bot.is_active ? 'Active' : 'Paused'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${bot.is_active ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs text-slate-500">Mode</p>
              <p className={`px-2 py-0.5 rounded text-sm inline-block mt-1 ${getModeColor(bot.mode)}`}>
                {bot.mode?.replace('_', ' ').toUpperCase()}
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs text-slate-500">Total Trades</p>
              <p className="text-xl font-mono font-bold text-white">{performance?.total_trades || 0}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs text-slate-500">Win Rate</p>
              <p className="text-xl font-mono font-bold text-teal-400">
                {(performance?.win_rate || 0).toFixed(1)}%
              </p>
            </GlassCard>
          </div>

          {/* Bot Controls */}
          <GlassCard title="Bot Controls" icon="⚙️" accent="purple">
            <div className="flex flex-wrap gap-3">
              <NeonButton
                onClick={() => setBotMode(bot.id, 'full_auto')}
                variant={bot.mode === 'full_auto' ? 'cyan' : 'white'}
                size="sm"
              >
                <Zap size={16} />
                Full Auto
              </NeonButton>
              <NeonButton
                onClick={() => setBotMode(bot.id, 'semi_auto')}
                variant={bot.mode === 'semi_auto' ? 'cyan' : 'white'}
                size="sm"
              >
                <Brain size={16} />
                Semi-Auto
              </NeonButton>
              <NeonButton
                onClick={() => setBotMode(bot.id, 'paused')}
                variant={bot.mode === 'paused' ? 'danger' : 'white'}
                size="sm"
              >
                <Pause size={16} />
                Pause
              </NeonButton>
              <div className="flex-1" />
              <NeonButton onClick={triggerAnalysis} variant="white" size="sm">
                <Activity size={16} />
                Analyze Now
              </NeonButton>
            </div>

            {/* Risk Settings Display */}
            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Shield size={14} className="text-amber-400" />
                Risk Settings
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Max Trade Size</p>
                  <p className="text-white font-mono">{bot.risk_settings?.max_trade_size_percent}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Daily Loss Limit</p>
                  <p className="text-white font-mono">{bot.risk_settings?.daily_loss_limit_percent}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Stop Loss</p>
                  <p className="text-red-400 font-mono">{bot.risk_settings?.stop_loss_percent}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Take Profit</p>
                  <p className="text-green-400 font-mono">{bot.risk_settings?.take_profit_percent}%</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Pending Signals (Semi-Auto) */}
          {bot.mode === 'semi_auto' && (
            <GlassCard title="Pending Signals" icon="📡" accent="amber">
              {signals.length > 0 ? (
                <div className="space-y-3">
                  {signals.map(signal => (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-black/40 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold">{signal.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSignalColor(signal.signal)}`}>
                            {signal.signal?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {(signal.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveSignal(signal.id)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => rejectSignal(signal.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Reasoning */}
                      <div className="space-y-1">
                        {signal.reasoning?.slice(0, 3).map((reason, i) => (
                          <p key={i} className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="text-teal-400">•</span> {reason}
                          </p>
                        ))}
                      </div>

                      {/* Trade Details */}
                      {signal.action !== 'hold' && (
                        <div className="mt-3 flex gap-4 text-xs">
                          <span className="text-slate-500">
                            Action: <span className={signal.action === 'buy' ? 'text-green-400' : 'text-red-400'}>
                              {signal.action?.toUpperCase()}
                            </span>
                          </span>
                          <span className="text-slate-500">
                            Qty: <span className="text-white">{signal.quantity?.toFixed(4)}</span>
                          </span>
                          {signal.stop_loss && (
                            <span className="text-slate-500">
                              SL: <span className="text-red-400">${signal.stop_loss?.toFixed(0)}</span>
                            </span>
                          )}
                          {signal.take_profit && (
                            <span className="text-slate-500">
                              TP: <span className="text-green-400">${signal.take_profit?.toFixed(0)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No pending signals</p>
                  <p className="text-sm mt-1">Bot is analyzing the market...</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Recent Signals */}
          <GlassCard title="Recent Analysis" icon="📊" accent="blue">
            {performance?.recent_signals?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Signal</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Confidence</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.recent_signals.map(signal => (
                      <tr key={signal.id} className="border-b border-white/5">
                        <td className="py-2 font-mono text-white">{signal.symbol}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${getSignalColor(signal.signal)}`}>
                            {signal.signal?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 capitalize text-slate-300">{signal.action}</td>
                        <td className="py-2 font-mono text-teal-400">{(signal.confidence * 100).toFixed(0)}%</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            signal.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                            signal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {signal.status}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-slate-500">
                          {new Date(signal.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-slate-400">No recent signals</p>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default AutonomousBot;
