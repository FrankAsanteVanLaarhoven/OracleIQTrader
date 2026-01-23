import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Users, Clock, TrendingUp, TrendingDown, Medal,
  ChevronRight, Zap, Target, Award, Crown, Star,
  ArrowUp, ArrowDown, DollarSign, BarChart3, Activity, Eye, Radio
} from 'lucide-react';
import GlassCard from './GlassCard';
import SpectatorMode from './SpectatorMode';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TournamentCenter = () => {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRegistered, setUserRegistered] = useState(false);
  const [showSpectator, setShowSpectator] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API}/tournament/active`);
      const data = await response.json();
      setTournaments(data);
      
      if (data.length > 0) {
        setActiveTournament(data[0]);
        fetchLeaderboard(data[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (tournamentId) => {
    try {
      const response = await fetch(`${API}/tournament/${tournamentId}/leaderboard?limit=50`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (rank === 2) return { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/20' };
    if (rank === 3) return { icon: Award, color: 'text-amber-700', bg: 'bg-amber-700/20' };
    return { icon: null, color: 'text-slate-500', bg: 'bg-slate-700/50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tournament-center">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-amber-400" size={28} />
            Trading Tournament
          </h1>
          <p className="text-slate-400 mt-1">Compete with traders worldwide for prizes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Spectator Mode Button */}
          {activeTournament && (
            <button
              onClick={() => setShowSpectator(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 font-semibold hover:bg-purple-500/30 transition-all flex items-center gap-2"
              data-testid="spectator-mode-btn"
            >
              <Eye size={18} />
              <span className="hidden sm:inline">Watch Live</span>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
          )}
          {!userRegistered && activeTournament && (
            <button
              onClick={() => setUserRegistered(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2"
              data-testid="join-tournament-btn"
            >
              <Zap size={18} />
              Join Tournament
            </button>
          )}
        </div>
      </div>

      {/* Tournament Info Cards */}
      {activeTournament && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard accent="amber" className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-amber-400" size={20} />
              <span className="text-sm text-slate-400">Prize Pool</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(activeTournament.total_prize_pool || 175)}</p>
            <p className="text-xs text-amber-400 mt-1">Pro Credits</p>
          </GlassCard>
          
          <GlassCard accent="blue" className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-400" size={20} />
              <span className="text-sm text-slate-400">Participants</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeTournament.participant_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">/ {activeTournament.max_participants || 1000} max</p>
          </GlassCard>
          
          <GlassCard accent="teal" className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-teal-400" size={20} />
              <span className="text-sm text-slate-400">Starting Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(activeTournament.starting_balance || 100000)}</p>
            <p className="text-xs text-slate-500 mt-1">Virtual money</p>
          </GlassCard>
          
          <GlassCard accent="purple" className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-purple-400" size={20} />
              <span className="text-sm text-slate-400">Status</span>
            </div>
            <p className="text-2xl font-bold text-white capitalize">{activeTournament.status}</p>
            <p className="text-xs text-purple-400 mt-1">Weekly challenge</p>
          </GlassCard>
        </div>
      )}

      {/* Prizes Section */}
      <GlassCard title="🏆 Prizes" accent="amber">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1st Place */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="text-black" size={20} />
              </div>
              <span className="font-bold text-amber-400">1st Place</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white">
                <Star size={14} className="text-amber-400" /> 100 Pro Credits
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Award size={14} className="text-amber-400" /> Champion Badge
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Trophy size={14} className="text-amber-400" /> "Weekly Champion" Title
              </li>
            </ul>
          </div>
          
          {/* 2nd Place */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-400/20 to-slate-400/5 border border-slate-400/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-400 flex items-center justify-center">
                <Medal className="text-black" size={20} />
              </div>
              <span className="font-bold text-slate-300">2nd Place</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white">
                <Star size={14} className="text-slate-400" /> 50 Pro Credits
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Award size={14} className="text-slate-400" /> Runner Up Badge
              </li>
            </ul>
          </div>
          
          {/* 3rd Place */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-700/20 to-amber-700/5 border border-amber-700/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center">
                <Award className="text-white" size={20} />
              </div>
              <span className="font-bold text-amber-600">3rd Place</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white">
                <Star size={14} className="text-amber-700" /> 25 Pro Credits
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Award size={14} className="text-amber-700" /> Third Place Badge
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Leaderboard */}
      <GlassCard title="📊 Leaderboard" icon={<BarChart3 className="text-teal-400" />} accent="teal">
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-mono text-slate-500 border-b border-white/5">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Trader</div>
            <div className="col-span-2 text-right">P&L %</div>
            <div className="col-span-2 text-right">Balance</div>
            <div className="col-span-2 text-right">Trades</div>
            <div className="col-span-1 text-right">Win %</div>
          </div>
          
          {/* Rows */}
          {leaderboard.map((trader, idx) => {
            const badge = getRankBadge(trader.rank);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-lg ${
                  trader.rank <= 3 ? badge.bg : 'bg-white/5 hover:bg-white/10'
                } transition-colors`}
              >
                <div className="col-span-1 flex items-center gap-2">
                  {badge.icon ? (
                    <badge.icon size={16} className={badge.color} />
                  ) : (
                    <span className="text-slate-500 font-mono text-sm">{trader.rank}</span>
                  )}
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <span className="font-semibold text-white">{trader.username}</span>
                  {trader.rank_change > 0 && (
                    <span className="flex items-center text-xs text-emerald-400">
                      <ArrowUp size={12} /> {trader.rank_change}
                    </span>
                  )}
                  {trader.rank_change < 0 && (
                    <span className="flex items-center text-xs text-red-400">
                      <ArrowDown size={12} /> {Math.abs(trader.rank_change)}
                    </span>
                  )}
                </div>
                <div className={`col-span-2 text-right font-mono font-semibold ${
                  trader.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatPercent(trader.pnl_percent)}
                </div>
                <div className="col-span-2 text-right font-mono text-white">
                  {formatCurrency(trader.current_balance)}
                </div>
                <div className="col-span-2 text-right text-slate-400">
                  {trader.total_trades}
                </div>
                <div className="col-span-1 text-right text-slate-400">
                  {trader.win_rate?.toFixed(0)}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Rules */}
      <GlassCard title="📋 Rules" accent="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Trading Rules</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Start with $100,000 virtual balance</li>
              <li>• Trade BTC, ETH, SOL, XRP, ADA, DOGE</li>
              <li>• Maximum 25% of portfolio in single position</li>
              <li>• Minimum 3 trades required to qualify</li>
              <li>• No leverage (1x only)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Scoring</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Ranked by total return percentage</li>
              <li>• Ties broken by number of winning trades</li>
              <li>• Results finalized 1 hour after end</li>
              <li>• Prizes distributed within 24 hours</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default TournamentCenter;
