import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, Users, TrendingUp, TrendingDown, Star, 
  UserPlus, Eye, Copy, Award, Medal, Crown,
  ArrowUpRight, ArrowDownRight, Filter, Search
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PortfolioLeaderboard = () => {
  const { t } = useTranslation();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [sortBy, setSortBy] = useState('total_value');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPortfolios();
  }, [sortBy]);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/portfolios/public?sort_by=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPortfolio = async (portfolioId) => {
    try {
      const response = await fetch(`${API}/portfolios/${portfolioId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPortfolio(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const followPortfolio = async (portfolioId) => {
    try {
      await fetch(`${API}/portfolios/follow/${portfolioId}`, { method: 'POST' });
      // Update local state
      setPortfolios(prev => prev.map(p => 
        p.id === portfolioId ? { ...p, followers: p.followers + 1 } : p
      ));
    } catch (error) {
      console.error('Error following portfolio:', error);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={20} />;
    if (rank === 2) return <Medal className="text-slate-300" size={20} />;
    if (rank === 3) return <Medal className="text-amber-600" size={20} />;
    return <span className="text-slate-500 font-mono text-sm">#{rank}</span>;
  };

  const filteredPortfolios = portfolios.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="portfolio-leaderboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-yellow-400" />
            Leaderboard
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">Top traders and their portfolios</p>
        </div>
        
        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search traders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-teal-500/50"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white outline-none"
          >
            <option value="total_value">Total Value</option>
            <option value="daily_pnl">Daily P&L</option>
            <option value="win_rate">Win Rate</option>
            <option value="followers">Followers</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-slate-400">Loading leaderboard...</span>
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl bg-black/40 border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-mono text-slate-500">RANK</th>
                <th className="px-4 py-3 text-left text-xs font-mono text-slate-500">TRADER</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-slate-500">VALUE</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-slate-500">DAILY P&L</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-slate-500">WIN RATE</th>
                <th className="px-4 py-3 text-right text-xs font-mono text-slate-500">FOLLOWERS</th>
                <th className="px-4 py-3 text-center text-xs font-mono text-slate-500">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No traders found</p>
                  </td>
                </tr>
              ) : filteredPortfolios.map((portfolio, index) => (
                <motion.tr
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                      {getRankIcon(portfolio.rank)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                        {portfolio.username[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{portfolio.username}</span>
                          {portfolio.verified && (
                            <Star className="text-yellow-400 fill-yellow-400" size={14} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          {portfolio.top_holdings?.slice(0, 3).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-mono">${portfolio.total_value.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className={`flex items-center justify-end gap-1 ${
                      portfolio.daily_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {portfolio.daily_pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span className="font-mono">
                        {portfolio.daily_pnl >= 0 ? '+' : ''}${Math.abs(portfolio.daily_pnl).toLocaleString()}
                      </span>
                      <span className="text-xs">({portfolio.daily_pnl_percent}%)</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-white font-mono">{portfolio.win_rate}%</span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-700">
                        <div 
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${portfolio.win_rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-400">
                      <Users size={14} />
                      <span className="font-mono">{portfolio.followers.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewPortfolio(portfolio.id)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="View Portfolio"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => followPortfolio(portfolio.id)}
                        className="p-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                        title="Follow"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Portfolio Detail Modal */}
      <AnimatePresence>
        {selectedPortfolio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPortfolio(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-black/90 border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedPortfolio.username[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{selectedPortfolio.username}</h3>
                      {selectedPortfolio.verified && (
                        <Star className="text-yellow-400 fill-yellow-400" size={18} />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{selectedPortfolio.bio}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{selectedPortfolio.followers?.toLocaleString()} followers</span>
                      <span>{selectedPortfolio.following} following</span>
                      <span>Joined {selectedPortfolio.joined_date}</span>
                    </div>
                  </div>
                </div>
                <NeonButton onClick={() => followPortfolio(selectedPortfolio.id)} variant="teal" size="sm">
                  <UserPlus size={14} />
                  Follow
                </NeonButton>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Total Value</p>
                  <p className="text-lg font-bold text-white">${selectedPortfolio.total_value?.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">All-Time Return</p>
                  <p className="text-lg font-bold text-emerald-400">+{selectedPortfolio.all_time_return}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Win Rate</p>
                  <p className="text-lg font-bold text-white">{selectedPortfolio.win_rate}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Risk/Reward</p>
                  <p className="text-lg font-bold text-white">{selectedPortfolio.risk_reward_ratio}:1</p>
                </div>
              </div>

              {/* Holdings */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Holdings</h4>
                <div className="space-y-2">
                  {selectedPortfolio.holdings?.map((holding, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-teal-400">{holding.symbol}</span>
                        <span className="text-xs text-slate-500">{holding.allocation}%</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">${holding.value?.toLocaleString()}</p>
                        <p className={`text-xs ${holding.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {holding.pnl >= 0 ? '+' : ''}${holding.pnl?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Trading */}
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Copy className="text-teal-400" size={18} />
                  <span className="font-semibold text-teal-400">Copy Trading</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Automatically copy this trader&apos;s positions proportionally to your portfolio size.
                </p>
                <NeonButton variant="teal" className="w-full">
                  Enable Copy Trading
                </NeonButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioLeaderboard;
