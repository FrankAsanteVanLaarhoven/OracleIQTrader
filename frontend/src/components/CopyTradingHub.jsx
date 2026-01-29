import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, TrendingDown, Shield, Zap, Award,
  DollarSign, Percent, BarChart3, Play, Pause, X, Plus,
  ChevronRight, Star, Check, AlertTriangle, Copy, Settings, Wifi, WifiOff, Activity
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const CopyTradingHub = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [traders, setTraders] = useState([]);
  const [topTraders, setTopTraders] = useState([]);
  const [userCopies, setUserCopies] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [copyAmount, setCopyAmount] = useState('');
  const [sortBy, setSortBy] = useState('total_return');
  
  // Real-time state
  const [wsConnected, setWsConnected] = useState(false);
  const [liveTradeEvents, setLiveTradeEvents] = useState([]);
  const [copiedTrades, setCopiedTrades] = useState([]);
  const wsRef = useRef(null);

  const userId = 'demo_user';

  // WebSocket connection for real-time trades
  useEffect(() => {
    const connectWs = () => {
      if (!WS_URL) return;
      
      const ws = new WebSocket(`${WS_URL}/ws/copy-trading/${userId}`);
      
      ws.onopen = () => {
        console.log('Copy trading WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'trade_copied') {
            // Add to live events
            setLiveTradeEvents(prev => [data, ...prev.slice(0, 49)]);
            setCopiedTrades(prev => [data.your_trade, ...prev.slice(0, 99)]);
            
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Trade Copied!', {
                body: data.message,
                icon: '/logo192.png'
              });
            }
          } else if (data.type === 'master_activity') {
            setLiveTradeEvents(prev => [data, ...prev.slice(0, 49)]);
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('Copy trading WebSocket disconnected');
        setWsConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWs, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
      
      wsRef.current = ws;
    };
    
    connectWs();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Subscribe to trader when starting to copy
  const subscribeToTrader = useCallback((traderId, settings = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        trader_id: traderId,
        settings
      }));
    }
  }, []);

  // Unsubscribe when stopping copy
  const unsubscribeFromTrader = useCallback((traderId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        trader_id: traderId
      }));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tradersRes, topRes, copiesRes, portfolioRes] = await Promise.all([
          fetch(`${API}/copy/traders?sort_by=${sortBy}`).then(r => r.json()),
          fetch(`${API}/copy/traders/top`).then(r => r.json()),
          fetch(`${API}/copy/relationships/${userId}`).then(r => r.json()),
          fetch(`${API}/copy/portfolio/${userId}`).then(r => r.json()),
        ]);
        
        setTraders(tradersRes || []);
        setTopTraders(topRes || []);
        setUserCopies(copiesRes || []);
        setPortfolio(portfolioRes);
      } catch (error) {
        console.error('Error fetching copy trading data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, [sortBy]);

  const handleStartCopy = async () => {
    if (!selectedTrader || !copyAmount) return;
    
    try {
      const res = await fetch(`${API}/copy/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_id: userId,
          master_trader_id: selectedTrader.trader_id,
          amount: parseFloat(copyAmount)
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Subscribe to real-time trades from this trader
        subscribeToTrader(selectedTrader.trader_id, {
          copy_ratio: 1.0,
          max_trade_size: parseFloat(copyAmount) * 0.1 // Max 10% per trade
        });
        
        setCopyAmount('');
        setSelectedTrader(null);
        // Refresh data
        const [copiesRes, portfolioRes] = await Promise.all([
          fetch(`${API}/copy/relationships/${userId}`).then(r => r.json()),
          fetch(`${API}/copy/portfolio/${userId}`).then(r => r.json()),
        ]);
        setUserCopies(copiesRes || []);
        setPortfolio(portfolioRes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopCopy = async (relationshipId, traderId) => {
    try {
      await fetch(`${API}/copy/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: userId, relationship_id: relationshipId })
      });
      
      // Unsubscribe from real-time trades
      if (traderId) {
        unsubscribeFromTrader(traderId);
      }
      
      // Refresh
      const copiesRes = await fetch(`${API}/copy/relationships/${userId}`).then(r => r.json());
      setUserCopies(copiesRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const getVerificationBadge = (verification) => {
    const badges = {
      institutional: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Institutional' },
      professional: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Professional' },
      verified: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Verified' },
      unverified: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Unverified' }
    };
    return badges[verification] || badges.unverified;
  };

  const getRiskBadge = (risk) => {
    const badges = {
      conservative: { color: 'bg-emerald-500/20 text-emerald-400', icon: Shield },
      moderate: { color: 'bg-amber-500/20 text-amber-400', icon: BarChart3 },
      aggressive: { color: 'bg-orange-500/20 text-orange-400', icon: Zap },
      ultra_aggressive: { color: 'bg-red-500/20 text-red-400', icon: AlertTriangle }
    };
    return badges[risk] || badges.moderate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="copy-loading">
        <motion.div
          className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="copy-trading-hub">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Copy className="text-teal-400" />
            Copy Trading
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Mirror Institutional Strategies • One-Click Follow
          </p>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && portfolio.total_invested > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Invested" value={`$${portfolio.total_invested.toLocaleString()}`} />
          <StatCard label="Current Value" value={`$${portfolio.current_value.toLocaleString()}`} />
          <StatCard 
            label="Total P&L" 
            value={`${portfolio.total_pnl >= 0 ? '+' : ''}$${portfolio.total_pnl.toLocaleString()}`}
            color={portfolio.total_pnl >= 0 ? 'emerald' : 'red'}
          />
          <StatCard label="Net Return" value={`${portfolio.total_pnl_pct}%`} color={portfolio.total_pnl_pct >= 0 ? 'emerald' : 'red'} />
          <StatCard label="Active Copies" value={portfolio.active_copies} />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="discover" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400" data-testid="tab-discover">
            <Users size={14} className="mr-1" /> Discover Traders
          </TabsTrigger>
          <TabsTrigger value="top" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="tab-top">
            <Award size={14} className="mr-1" /> Top Performers
          </TabsTrigger>
          <TabsTrigger value="my-copies" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400" data-testid="tab-copies">
            <Copy size={14} className="mr-1" /> My Copies ({userCopies.length})
          </TabsTrigger>
        </TabsList>

        {/* Discover Traders */}
        <TabsContent value="discover" className="mt-6">
          {/* Sort Controls */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['total_return', 'monthly_return', 'sharpe', 'win_rate', 'followers'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  sortBy === sort 
                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {sort.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {traders.map((trader) => (
              <TraderCard 
                key={trader.trader_id}
                trader={trader}
                onCopy={() => setSelectedTrader(trader)}
                getVerificationBadge={getVerificationBadge}
                getRiskBadge={getRiskBadge}
              />
            ))}
          </div>
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="top" className="mt-6">
          <div className="space-y-4">
            {topTraders.map((trader, idx) => (
              <TopTraderRow
                key={trader.trader_id}
                trader={trader}
                rank={idx + 1}
                onCopy={() => setSelectedTrader(trader)}
                getVerificationBadge={getVerificationBadge}
              />
            ))}
          </div>
        </TabsContent>

        {/* My Copies */}
        <TabsContent value="my-copies" className="mt-6">
          {userCopies.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Copy size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active copies. Start copying a trader to see your positions here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userCopies.map((copy) => (
                <CopyCard 
                  key={copy.relationship_id}
                  copy={copy}
                  onStop={() => handleStopCopy(copy.relationship_id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Copy Modal */}
      <AnimatePresence>
        {selectedTrader && (
          <CopyModal
            trader={selectedTrader}
            copyAmount={copyAmount}
            setCopyAmount={setCopyAmount}
            onCopy={handleStartCopy}
            onClose={() => setSelectedTrader(null)}
            getVerificationBadge={getVerificationBadge}
            getRiskBadge={getRiskBadge}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color = 'white' }) => {
  const colors = {
    white: 'text-white',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400'
  };
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
};

// Trader Card Component
const TraderCard = ({ trader, onCopy, getVerificationBadge, getRiskBadge }) => {
  const verification = getVerificationBadge(trader.verification);
  const risk = getRiskBadge(trader.strategy?.risk_level);
  const RiskIcon = risk.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all"
      data-testid={`trader-${trader.trader_id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold">{trader.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${verification.color}`}>
              {verification.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${risk.color} flex items-center gap-1`}>
              <RiskIcon size={10} />
              {trader.strategy?.risk_level?.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">{trader.strategy?.type?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Followers</p>
          <p className="text-white font-semibold">{trader.social?.followers_count?.toLocaleString()}</p>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500">Total Return</p>
          <p className={`text-sm font-bold ${trader.performance?.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trader.performance?.total_return >= 0 ? '+' : ''}{trader.performance?.total_return}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Monthly</p>
          <p className={`text-sm font-bold ${trader.performance?.monthly_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trader.performance?.monthly_return >= 0 ? '+' : ''}{trader.performance?.monthly_return}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Win Rate</p>
          <p className="text-sm font-bold text-white">{trader.performance?.win_rate}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Sharpe</p>
          <p className="text-sm font-bold text-blue-400">{trader.performance?.sharpe_ratio}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-4 line-clamp-2">{trader.strategy?.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Min: ${trader.fees?.min_investment} • {trader.fees?.performance_fee}% perf fee
        </div>
        <Button onClick={onCopy} size="sm" className="bg-teal-500 hover:bg-teal-600">
          <Copy size={14} className="mr-1" /> Copy
        </Button>
      </div>
    </motion.div>
  );
};

// Top Trader Row Component
const TopTraderRow = ({ trader, rank, onCopy, getVerificationBadge }) => {
  const verification = getVerificationBadge(trader.verification);
  
  const getRankIcon = (r) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return r;
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl ${
      rank <= 3 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'
    }`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl w-10 text-center">{getRankIcon(rank)}</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium">{trader.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded border ${verification.color}`}>
              {verification.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {trader.social?.followers_count?.toLocaleString()} followers • ${(trader.social?.total_aum / 1000000).toFixed(1)}M AUM
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-slate-500">Total Return</p>
          <p className={`text-lg font-bold ${trader.performance?.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            +{trader.performance?.total_return}%
          </p>
        </div>
        <Button onClick={onCopy} size="sm" variant="outline" className="border-teal-500/30 text-teal-400">
          Copy
        </Button>
      </div>
    </div>
  );
};

// Copy Card Component
const CopyCard = ({ copy, onStop }) => {
  const pnlColor = copy.performance?.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-white font-medium">{copy.trader_name}</h4>
          <p className="text-xs text-slate-500">
            Started: {new Date(copy.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {copy.paused && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">Paused</span>
          )}
          {copy.is_active ? (
            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">Active</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded bg-slate-500/20 text-slate-400">Stopped</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500">Allocated</p>
          <p className="text-white">${copy.allocated_amount?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Current Value</p>
          <p className="text-white">${copy.performance?.current_value?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">P&L</p>
          <p className={pnlColor}>
            {copy.performance?.total_pnl >= 0 ? '+' : ''}${copy.performance?.total_pnl?.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Return</p>
          <p className={pnlColor}>{copy.performance?.pnl_pct}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Trades Copied</p>
          <p className="text-white">{copy.performance?.trades_copied}</p>
        </div>
      </div>

      {copy.is_active && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="border-white/10">
            <Settings size={14} className="mr-1" /> Settings
          </Button>
          <Button variant="outline" size="sm" className="border-red-500/30 text-red-400" onClick={onStop}>
            <X size={14} className="mr-1" /> Stop
          </Button>
        </div>
      )}
    </div>
  );
};

// Copy Modal Component
const CopyModal = ({ trader, copyAmount, setCopyAmount, onCopy, onClose, getVerificationBadge, getRiskBadge }) => {
  const verification = getVerificationBadge(trader.verification);
  const minInvestment = trader.fees?.min_investment || 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        data-testid="copy-modal"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Start Copying</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Trader Info */}
        <div className="p-4 rounded-lg bg-white/5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-white font-medium">{trader.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded border ${verification.color}`}>
              {verification.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Return</p>
              <p className="text-emerald-400">+{trader.performance?.total_return}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Win Rate</p>
              <p className="text-white">{trader.performance?.win_rate}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Sharpe</p>
              <p className="text-blue-400">{trader.performance?.sharpe_ratio}</p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Investment Amount ($)</label>
          <Input
            type="number"
            value={copyAmount}
            onChange={(e) => setCopyAmount(e.target.value)}
            placeholder={`Min: $${minInvestment}`}
            className="bg-white/5 border-white/10 text-white"
            data-testid="copy-amount-input"
          />
        </div>

        {/* Fee Info */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <p className="text-xs text-amber-400 mb-1">Fee Structure</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Performance Fee</span>
            <span className="text-white">{trader.fees?.performance_fee}% of profits</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Management Fee</span>
            <span className="text-white">{trader.fees?.management_fee}% annual</span>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          onClick={onCopy}
          disabled={!copyAmount || parseFloat(copyAmount) < minInvestment}
          className="w-full bg-teal-500 hover:bg-teal-600"
          data-testid="confirm-copy-btn"
        >
          <Copy size={16} className="mr-2" />
          Start Copying {trader.name?.split(' ')[0]}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CopyTradingHub;
