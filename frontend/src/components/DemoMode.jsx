import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RefreshCw, TrendingUp, TrendingDown, 
  Bot, Brain, Trophy, MessageCircle, Wallet, Bell,
  BarChart3, Activity, Zap, ChevronRight, X, Sparkles,
  LineChart, PieChart, Clock, DollarSign, Target
} from 'lucide-react';
import GlassCard from './GlassCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DemoMode = ({ onClose, onSignUp }) => {
  const [demoData, setDemoData] = useState({
    portfolio: null,
    bot: null,
    prediction: null,
    sentiment: null,
    competition: null,
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    fetchDemoData();
    
    // Auto-refresh demo data every 5 seconds
    const interval = setInterval(() => {
      if (isSimulating) fetchDemoData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isSimulating]);

  const fetchDemoData = async () => {
    try {
      const [portfolio, bot, prediction, sentiment, competition, stats] = await Promise.all([
        fetch(`${API}/demo/portfolio`).then(r => r.json()),
        fetch(`${API}/demo/bot`).then(r => r.json()),
        fetch(`${API}/demo/prediction/BTC`).then(r => r.json()),
        fetch(`${API}/demo/sentiment/BTC`).then(r => r.json()),
        fetch(`${API}/demo/competition`).then(r => r.json()),
        fetch(`${API}/demo/status`).then(r => r.json()),
      ]);
      
      setDemoData({ portfolio, bot, prediction, sentiment, competition, stats });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching demo data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const tabs = [
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'bot', label: 'AI Bot', icon: Bot },
    { id: 'predictions', label: 'ML Predict', icon: Brain },
    { id: 'sentiment', label: 'Sentiment', icon: MessageCircle },
    { id: 'competition', label: 'Compete', icon: Trophy },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 border-4 border-teal-500/30 border-t-teal-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-400 font-mono">Loading Demo Mode...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Play size={14} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-400">DEMO MODE</span>
            </div>
            <span className="text-sm text-slate-400">Experience the full platform with simulated data</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                isSimulating 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}
            >
              {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              {isSimulating ? 'Live' : 'Paused'}
            </button>
            
            <button
              onClick={onSignUp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all"
            >
              <Sparkles size={14} />
              Sign Up Free
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && demoData.portfolio && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard accent="teal" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="text-teal-400" size={20} />
                    <span className="text-sm text-slate-400">Total Value</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCurrency(demoData.portfolio.total_value)}</p>
                  <p className="text-sm text-emerald-400 mt-1">
                    {formatPercent(((demoData.portfolio.total_value - 100000) / 100000) * 100)} all time
                  </p>
                </GlassCard>
                
                <GlassCard accent="blue" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="text-blue-400" size={20} />
                    <span className="text-sm text-slate-400">Cash Available</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCurrency(demoData.portfolio.cash_balance)}</p>
                  <p className="text-sm text-slate-500 mt-1">Ready to trade</p>
                </GlassCard>
                
                <GlassCard accent="purple" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-purple-400" size={20} />
                    <span className="text-sm text-slate-400">Positions</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{demoData.portfolio.positions?.length || 0}</p>
                  <p className="text-sm text-slate-500 mt-1">Active holdings</p>
                </GlassCard>
              </div>
              
              {/* Positions */}
              <GlassCard title="Holdings" icon="📊" accent="teal">
                <div className="space-y-3">
                  {demoData.portfolio.positions?.map((pos, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-transparent flex items-center justify-center">
                          <span className="font-bold text-teal-400">{pos.symbol}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{pos.symbol}</p>
                          <p className="text-xs text-slate-500">{pos.quantity} units @ {formatCurrency(pos.avg_price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatCurrency(pos.value)}</p>
                        <p className={`text-sm ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(pos.pnl)} ({formatPercent(pos.pnl_percent)})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* AI Bot Tab */}
          {activeTab === 'bot' && demoData.bot && (
            <motion.div
              key="bot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard title="Bot Status" icon="🤖" accent="teal">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="flex items-center gap-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {demoData.bot.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Strategy</span>
                      <span className="text-white capitalize">{demoData.bot.strategy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Capital Allocated</span>
                      <span className="text-white">{formatCurrency(demoData.bot.capital_allocated)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Win Rate</span>
                      <span className="text-teal-400">{demoData.bot.win_rate}%</span>
                    </div>
                  </div>
                </GlassCard>
                
                <GlassCard title="Performance" icon="📈" accent="blue">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Today's Trades</span>
                      <span className="text-white">{demoData.bot.trades_today}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Today's P&L</span>
                      <span className={demoData.bot.pnl_today >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatCurrency(demoData.bot.pnl_today)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total P&L</span>
                      <span className={demoData.bot.pnl_total >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatCurrency(demoData.bot.pnl_total)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
              
              {/* Active Positions */}
              <GlassCard title="Bot Positions" icon="📊" accent="purple">
                <div className="space-y-3">
                  {demoData.bot.active_positions?.map((pos, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          pos.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {pos.side}
                        </span>
                        <span className="font-semibold text-white">{pos.symbol}</span>
                        <span className="text-slate-500 text-sm">Size: {pos.size}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Entry: {formatCurrency(pos.entry)}</p>
                        <p className={pos.current_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(pos.current_pnl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ML Predictions Tab */}
          {activeTab === 'predictions' && demoData.prediction && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GlassCard title="BTC Price Prediction (24h)" icon="🧠" accent="purple">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Direction</p>
                    <p className={`text-xl font-bold capitalize ${
                      demoData.prediction.direction?.includes('bullish') ? 'text-emerald-400' : 
                      demoData.prediction.direction?.includes('bearish') ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {demoData.prediction.direction}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <p className="text-xl font-bold text-teal-400">{(demoData.prediction.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">24h Target</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(demoData.prediction.target_24h)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Volatility</p>
                    <p className="text-xl font-bold text-amber-400 capitalize">{demoData.prediction.volatility}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-slate-500 mb-1">Support Level</p>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(demoData.prediction.support)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-slate-500 mb-1">Resistance Level</p>
                    <p className="text-lg font-bold text-red-400">{formatCurrency(demoData.prediction.resistance)}</p>
                  </div>
                </div>
              </GlassCard>
              
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <Brain className="text-amber-400" size={24} />
                <div>
                  <p className="font-semibold text-amber-400">Demo Prediction</p>
                  <p className="text-sm text-slate-400">Sign up to access real ML models trained on live market data</p>
                </div>
                <button
                  onClick={onSignUp}
                  className="ml-auto px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors"
                >
                  Unlock Full Access
                </button>
              </div>
            </motion.div>
          )}

          {/* Sentiment Tab */}
          {activeTab === 'sentiment' && demoData.sentiment && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GlassCard title="Social Sentiment Analysis" icon="💬" accent="blue">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Overall</p>
                    <p className={`text-xl font-bold capitalize ${
                      demoData.sentiment.overall === 'bullish' ? 'text-emerald-400' : 
                      demoData.sentiment.overall === 'bearish' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {demoData.sentiment.overall}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Score</p>
                    <p className="text-xl font-bold text-teal-400">{(demoData.sentiment.score * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Total Mentions</p>
                    <p className="text-xl font-bold text-white">{demoData.sentiment.total_mentions?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Fear & Greed</p>
                    <p className="text-xl font-bold text-amber-400">{demoData.sentiment.fear_greed_index}</p>
                  </div>
                </div>
                
                {/* Trending Hashtags */}
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">Trending</p>
                  <div className="flex flex-wrap gap-2">
                    {demoData.sentiment.trending_hashtags?.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Whale Activity */}
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm text-slate-400 mb-1">Whale Activity</p>
                  <p className="text-lg font-bold text-purple-400 capitalize">{demoData.sentiment.whale_activity}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Competition Tab */}
          {activeTab === 'competition' && demoData.competition && (
            <motion.div
              key="competition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GlassCard title={demoData.competition.name} icon="🏆" accent="amber">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Your Rank</p>
                    <p className="text-xl font-bold text-amber-400">#{demoData.competition.user_rank}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Your P&L</p>
                    <p className="text-xl font-bold text-emerald-400">+{demoData.competition.user_pnl?.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Prize Pool</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(demoData.competition.prize_pool)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-xs text-slate-500 mb-1">Time Left</p>
                    <p className="text-xl font-bold text-teal-400">{demoData.competition.time_remaining}</p>
                  </div>
                </div>
                
                {/* Leaderboard */}
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 mb-3">Leaderboard</p>
                  {demoData.competition.leaderboard?.map((entry, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                      idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-amber-500 text-black' :
                          idx === 1 ? 'bg-slate-400 text-black' :
                          idx === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-700 text-white'
                        }`}>
                          {entry.rank}
                        </span>
                        <span className="font-semibold text-white">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">+{entry.pnl_percent}%</p>
                        <p className="text-xs text-slate-500">{entry.trades} trades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-purple-500/10 border border-white/10">
            <div>
              <p className="font-semibold text-white">Ready to trade for real?</p>
              <p className="text-sm text-slate-400">Sign up now and get $100 bonus on your first $500 deposit</p>
            </div>
            <button
              onClick={onSignUp}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
            >
              Start Trading
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoMode;
