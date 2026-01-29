import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Trophy, Users, Zap, Target,
  Activity, DollarSign, Clock, ChevronRight, Search,
  Award, BarChart3, Percent, AlertTriangle, Check, X,
  Globe, Building2, Coins, Gamepad2, Vote
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PredictionHub = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [markets, setMarkets] = useState([]);
  const [sportsMarkets, setSportsMarkets] = useState([]);
  const [politicalMarkets, setPoliticalMarkets] = useState([]);
  const [cryptoMarkets, setCryptoMarkets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userPositions, setUserPositions] = useState([]);
  const [userBalance, setUserBalance] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeSide, setTradeSide] = useState('yes');

  const userId = 'demo_user';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trendingRes, sportsRes, politicalRes, cryptoRes, leaderRes, positionsRes, balanceRes] = await Promise.all([
          fetch(`${API}/predictions/trending`).then(r => r.json()),
          fetch(`${API}/predictions/sports`).then(r => r.json()),
          fetch(`${API}/predictions/politics`).then(r => r.json()),
          fetch(`${API}/predictions/crypto`).then(r => r.json()),
          fetch(`${API}/predictions/leaderboard`).then(r => r.json()),
          fetch(`${API}/predictions/positions/${userId}`).then(r => r.json()),
          fetch(`${API}/predictions/balance/${userId}`).then(r => r.json()),
        ]);
        
        setMarkets(trendingRes || []);
        setSportsMarkets(sportsRes || []);
        setPoliticalMarkets(politicalRes || []);
        setCryptoMarkets(cryptoRes || []);
        setLeaderboard(leaderRes || []);
        setUserPositions(positionsRes || []);
        setUserBalance(balanceRes?.balance || 10000);
      } catch (error) {
        console.error('Error fetching prediction data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [trendingRes, sportsRes, politicalRes, cryptoRes, leaderRes, positionsRes, balanceRes] = await Promise.all([
        fetch(`${API}/predictions/trending`).then(r => r.json()),
        fetch(`${API}/predictions/sports`).then(r => r.json()),
        fetch(`${API}/predictions/politics`).then(r => r.json()),
        fetch(`${API}/predictions/crypto`).then(r => r.json()),
        fetch(`${API}/predictions/leaderboard`).then(r => r.json()),
        fetch(`${API}/predictions/positions/${userId}`).then(r => r.json()),
        fetch(`${API}/predictions/balance/${userId}`).then(r => r.json()),
      ]);
      
      setMarkets(trendingRes || []);
      setSportsMarkets(sportsRes || []);
      setPoliticalMarkets(politicalRes || []);
      setCryptoMarkets(cryptoRes || []);
      setLeaderboard(leaderRes || []);
      setUserPositions(positionsRes || []);
      setUserBalance(balanceRes?.balance || 10000);
    } catch (error) {
      console.error('Error fetching prediction data:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${API}/predictions/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrade = async () => {
    if (!selectedMarket || !tradeAmount) return;
    
    try {
      const res = await fetch(`${API}/predictions/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          market_id: selectedMarket.market_id,
          side: tradeSide,
          amount: parseFloat(tradeAmount)
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setUserBalance(data.new_balance);
        setTradeAmount('');
        setSelectedMarket(null);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      sports: Gamepad2,
      politics: Vote,
      crypto: Coins,
      economics: Building2,
      default: Globe
    };
    return icons[category] || icons.default;
  };

  const getCategoryColor = (category) => {
    const colors = {
      sports: 'text-emerald-400 bg-emerald-500/20',
      politics: 'text-blue-400 bg-blue-500/20',
      crypto: 'text-amber-400 bg-amber-500/20',
      economics: 'text-purple-400 bg-purple-500/20',
      default: 'text-slate-400 bg-slate-500/20'
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="prediction-loading">
        <motion.div
          className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="prediction-hub">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Target className="text-teal-400" />
            Prediction Markets
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Sports • Politics • Crypto • Events
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-lg font-bold text-teal-400">${userBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search markets (e.g., 'Bitcoin', 'Super Bowl', 'Fed')"
          className="bg-white/5 border-white/10 text-white"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          data-testid="search-input"
        />
        <Button onClick={handleSearch} variant="outline" className="border-teal-500/30 text-teal-400">
          <Search size={18} />
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <GlassCard title="Search Results" icon="🔍" accent="blue">
          <div className="space-y-2">
            {searchResults.map((market) => (
              <MarketCard 
                key={market.market_id} 
                market={market} 
                onSelect={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="trending" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400" data-testid="tab-trending">
            <Zap size={14} className="mr-1" /> Trending
          </TabsTrigger>
          <TabsTrigger value="sports" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400" data-testid="tab-sports">
            <Gamepad2 size={14} className="mr-1" /> Sports
          </TabsTrigger>
          <TabsTrigger value="politics" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400" data-testid="tab-politics">
            <Vote size={14} className="mr-1" /> Politics
          </TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="tab-crypto">
            <Coins size={14} className="mr-1" /> Crypto
          </TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400" data-testid="tab-positions">
            <BarChart3 size={14} className="mr-1" /> My Positions
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="tab-leaderboard">
            <Trophy size={14} className="mr-1" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Trending Markets */}
        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {markets.map((market) => (
              <MarketCard 
                key={market.market_id} 
                market={market} 
                onSelect={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Sports Markets */}
        <TabsContent value="sports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sportsMarkets.map((market) => (
              <MarketCard 
                key={market.market_id} 
                market={market} 
                onSelect={() => setSelectedMarket(market)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
                showLeague
              />
            ))}
          </div>
        </TabsContent>

        {/* Political Markets */}
        <TabsContent value="politics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {politicalMarkets.map((market) => (
              <MarketCard 
                key={market.market_id} 
                market={market} 
                onSelect={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Crypto Markets */}
        <TabsContent value="crypto" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cryptoMarkets.map((market) => (
              <MarketCard 
                key={market.market_id} 
                market={market} 
                onSelect={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </TabsContent>

        {/* User Positions */}
        <TabsContent value="positions" className="mt-6">
          <PositionsPanel positions={userPositions} />
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-6">
          <LeaderboardPanel leaderboard={leaderboard} />
        </TabsContent>
      </Tabs>

      {/* Trade Modal */}
      <AnimatePresence>
        {selectedMarket && (
          <TradeModal
            market={selectedMarket}
            tradeSide={tradeSide}
            setTradeSide={setTradeSide}
            tradeAmount={tradeAmount}
            setTradeAmount={setTradeAmount}
            userBalance={userBalance}
            onTrade={handleTrade}
            onClose={() => setSelectedMarket(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Market Card Component
const MarketCard = ({ market, onSelect, showLeague }) => {
  const yesPrice = market.yes_price || 0.5;
  const noPrice = market.no_price || 0.5;
  
  const getCategoryStyle = (category) => {
    const styles = {
      sports: { icon: Gamepad2, color: 'text-emerald-400 bg-emerald-500/20' },
      politics: { icon: Vote, color: 'text-blue-400 bg-blue-500/20' },
      crypto: { icon: Coins, color: 'text-amber-400 bg-amber-500/20' },
      economics: { icon: Building2, color: 'text-purple-400 bg-purple-500/20' },
    };
    return styles[category] || { icon: Globe, color: 'text-slate-400 bg-slate-500/20' };
  };
  
  const style = getCategoryStyle(market.category);
  const IconComponent = style.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 cursor-pointer transition-all"
      onClick={onSelect}
      data-testid={`market-${market.market_id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${style.color}`}>
            <IconComponent size={16} />
          </div>
          {showLeague && market.league && (
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-400">{market.league}</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Volume</p>
          <p className="text-sm font-mono text-white">${(market.total_volume || 0).toLocaleString()}</p>
        </div>
      </div>
      
      <h3 className="text-white font-medium mb-3 line-clamp-2">{market.title}</h3>
      
      {/* Probability Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-400">YES {(yesPrice * 100).toFixed(0)}¢</span>
          <span className="text-red-400">NO {(noPrice * 100).toFixed(0)}¢</span>
        </div>
        <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${yesPrice * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          {market.implied_probability} implied probability
        </p>
      </div>
      
      {/* Resolution Date */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {market.time_to_resolution || 'TBD'}
        </span>
        <ChevronRight size={14} />
      </div>
    </motion.div>
  );
};

// Trade Modal Component
const TradeModal = ({ market, tradeSide, setTradeSide, tradeAmount, setTradeAmount, userBalance, onTrade, onClose }) => {
  const price = tradeSide === 'yes' ? market.yes_price : market.no_price;
  const shares = tradeAmount ? parseFloat(tradeAmount) / price : 0;
  const maxPayout = shares * 1;
  const potentialProfit = maxPayout - parseFloat(tradeAmount || 0);

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
        data-testid="trade-modal"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Trade</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-400 mb-4">{market.title}</p>
        
        {/* YES/NO Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTradeSide('yes')}
            className={`p-3 rounded-lg border transition-all ${
              tradeSide === 'yes' 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            data-testid="trade-yes"
          >
            <Check size={16} className="mx-auto mb-1" />
            <p className="text-sm font-medium">YES</p>
            <p className="text-xs">{(market.yes_price * 100).toFixed(0)}¢</p>
          </button>
          <button
            onClick={() => setTradeSide('no')}
            className={`p-3 rounded-lg border transition-all ${
              tradeSide === 'no' 
                ? 'bg-red-500/20 border-red-500 text-red-400' 
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            data-testid="trade-no"
          >
            <X size={16} className="mx-auto mb-1" />
            <p className="text-sm font-medium">NO</p>
            <p className="text-xs">{(market.no_price * 100).toFixed(0)}¢</p>
          </button>
        </div>
        
        {/* Amount Input */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Amount ($)</label>
          <Input
            type="number"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
            placeholder="Enter amount"
            className="bg-white/5 border-white/10 text-white"
            data-testid="trade-amount"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Balance: ${userBalance.toFixed(2)}</span>
            <button 
              onClick={() => setTradeAmount(userBalance.toString())}
              className="text-teal-400 hover:underline"
            >
              Max
            </button>
          </div>
        </div>
        
        {/* Trade Summary */}
        {tradeAmount && parseFloat(tradeAmount) > 0 && (
          <div className="p-3 rounded-lg bg-white/5 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Shares</span>
              <span className="text-white">{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Max Payout</span>
              <span className="text-white">${maxPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Potential Profit</span>
              <span className="text-emerald-400">+${potentialProfit.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {/* Trade Button */}
        <Button
          onClick={onTrade}
          disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || parseFloat(tradeAmount) > userBalance}
          className={`w-full ${
            tradeSide === 'yes' 
              ? 'bg-emerald-500 hover:bg-emerald-600' 
              : 'bg-red-500 hover:bg-red-600'
          }`}
          data-testid="confirm-trade"
        >
          Buy {tradeSide.toUpperCase()} @ {(price * 100).toFixed(0)}¢
        </Button>
      </motion.div>
    </motion.div>
  );
};

// Positions Panel Component
const PositionsPanel = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>No positions yet. Start trading to see your portfolio here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position, idx) => (
        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-white font-medium mb-2">{position.market_title}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">YES Shares</p>
              <p className="text-emerald-400">{position.yes_shares?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-slate-500">NO Shares</p>
              <p className="text-red-400">{position.no_shares?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Value</p>
              <p className="text-white">${position.total_value?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-slate-500">Unrealized P&L</p>
              <p className={position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl?.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Leaderboard Panel Component
const LeaderboardPanel = ({ leaderboard }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <GlassCard title="Top Predictors" icon="🏆" accent="amber">
      <div className="space-y-2">
        {leaderboard.slice(0, 20).map((entry, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between p-3 rounded-lg ${
              idx < 3 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl w-8">{getRankIcon(entry.rank)}</span>
              <div>
                <p className="text-white font-medium">{entry.user_id}</p>
                <p className="text-xs text-slate-500">{entry.positions_count} positions</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${entry.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {entry.total_pnl >= 0 ? '+' : ''}${entry.total_pnl.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">
                Win rate: {(entry.win_rate * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default PredictionHub;
