import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Medal, Crown, Flame, Users, Clock, Target,
  TrendingUp, TrendingDown, Award, Star, Zap, RefreshCw,
  Play, ChevronRight, Shield
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const TradingCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Fetch active competitions
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/competition/active`);
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data.competitions || []);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch competition leaderboard
  const fetchLeaderboard = async (compId) => {
    try {
      const response = await fetch(`${API}/competition/${compId}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API}/competition/user/stats`);
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch global leaderboard
  const fetchGlobalLeaderboard = async () => {
    try {
      const response = await fetch(`${API}/competition/global/leaderboard?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setGlobalLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Join competition
  const joinCompetition = async (compId) => {
    setJoining(true);
    try {
      const response = await fetch(`${API}/competition/${compId}/join`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchCompetitions();
        await fetchLeaderboard(compId);
      }
    } catch (error) {
      console.error('Error joining:', error);
    } finally {
      setJoining(false);
    }
  };

  // Create competitions
  const createDailyChallenge = async () => {
    try {
      await fetch(`${API}/competition/create/daily`, { method: 'POST' });
      await fetchCompetitions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createThemedEvent = async (theme) => {
    try {
      await fetch(`${API}/competition/create/themed?theme=${theme}`, { method: 'POST' });
      await fetchCompetitions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchCompetitions();
    fetchUserStats();
    fetchGlobalLeaderboard();
  }, [fetchCompetitions]);

  useEffect(() => {
    if (selectedComp) {
      fetchLeaderboard(selectedComp.id);
    }
  }, [selectedComp?.id]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'daily': return <Flame className="text-orange-400" size={20} />;
      case 'weekly': return <Trophy className="text-amber-400" size={20} />;
      case 'themed': return <Star className="text-purple-400" size={20} />;
      default: return <Award className="text-teal-400" size={20} />;
    }
  };

  const getTierStyle = (tier) => {
    switch (tier) {
      case 'diamond': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'platinum': return 'bg-slate-300/20 text-slate-300 border-slate-300/50';
      case 'gold': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'silver': return 'bg-slate-400/20 text-slate-400 border-slate-400/50';
      default: return 'bg-orange-700/20 text-orange-400 border-orange-700/50';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-amber-400" size={20} />;
    if (rank === 2) return <Medal className="text-slate-300" size={20} />;
    if (rank === 3) return <Medal className="text-orange-400" size={20} />;
    return <span className="text-slate-400 font-mono">{rank}</span>;
  };

  const formatTimeRemaining = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6" data-testid="trading-competitions">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" />
            Trading Competitions
          </h2>
          <p className="text-slate-400 text-sm">Compete with traders worldwide</p>
        </div>
        <div className="flex gap-2">
          <NeonButton onClick={createDailyChallenge} variant="white" size="sm">
            <Flame size={16} />
            New Daily
          </NeonButton>
          <NeonButton onClick={() => createThemedEvent('moon_mission')} variant="cyan" size="sm">
            <Zap size={16} />
            Moon Mission
          </NeonButton>
        </div>
      </div>

      {/* User Stats Card */}
      {userStats && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-lg border ${getTierStyle(userStats.tier)}`}>
                <span className="text-xs uppercase font-bold">{userStats.tier}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{userStats.tier_points} Points</p>
                <p className="text-xs text-slate-400">{userStats.competitions_won} wins • {userStats.total_podium_finishes} podiums</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{userStats.competitions_entered}</p>
                <p className="text-xs text-slate-500">Entered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{userStats.badges_earned?.length || 0}</p>
                <p className="text-xs text-slate-500">Badges</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'active', label: 'Active Competitions', icon: Play },
          { id: 'global', label: 'Global Leaderboard', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'active' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitions List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-teal-400" size={32} />
              </div>
            ) : competitions.length > 0 ? (
              competitions.map(comp => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedComp?.id === comp.id
                      ? 'bg-teal-500/10 border-teal-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedComp(comp)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(comp.type)}
                      <div>
                        <h3 className="text-white font-semibold">{comp.name}</h3>
                        <p className="text-slate-400 text-sm">{comp.description}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      comp.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {comp.status}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users size={14} />
                        {comp.participant_count} traders
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={14} />
                        {formatTimeRemaining(comp.end_time)}
                      </span>
                      <span className="text-green-400 flex items-center gap-1">
                        ${comp.starting_balance?.toLocaleString()}
                      </span>
                    </div>
                    <NeonButton
                      onClick={(e) => {
                        e.stopPropagation();
                        joinCompetition(comp.id);
                      }}
                      variant="cyan"
                      size="sm"
                      disabled={joining}
                    >
                      {joining ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                      Join
                    </NeonButton>
                  </div>

                  {/* Prizes */}
                  {comp.prizes?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex gap-3">
                      {comp.prizes.slice(0, 3).map((prize, i) => (
                        <span key={i} className="text-xs text-slate-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {prize.xp_reward} XP
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                <p>No active competitions</p>
                <p className="text-sm mt-1">Create a new challenge to get started!</p>
              </div>
            )}
          </div>

          {/* Selected Competition Leaderboard */}
          <GlassCard title="Leaderboard" icon="🏆" accent="amber">
            {selectedComp ? (
              <div className="space-y-2">
                {leaderboard.length > 0 ? leaderboard.slice(0, 10).map((entry, i) => (
                  <div key={entry.user_id} className={`flex items-center justify-between p-2 rounded-lg ${
                    i < 3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'bg-white/5'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <span className="text-white text-sm font-medium">{entry.username}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono ${entry.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.pnl_percent >= 0 ? '+' : ''}{entry.pnl_percent?.toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500">{entry.total_trades} trades</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8 text-slate-400 text-sm">No entries yet</p>
                )}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-400 text-sm">Select a competition</p>
            )}
          </GlassCard>
        </div>
      ) : (
        /* Global Leaderboard */
        <GlassCard title="Global Rankings" icon="🌍" accent="purple">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                  <th className="pb-3 w-12">Rank</th>
                  <th className="pb-3">Trader</th>
                  <th className="pb-3 text-center">Tier</th>
                  <th className="pb-3 text-right">Points</th>
                  <th className="pb-3 text-right">Wins</th>
                  <th className="pb-3 text-right">Podiums</th>
                </tr>
              </thead>
              <tbody>
                {globalLeaderboard.map((entry) => (
                  <tr key={entry.user_id} className="border-b border-white/5">
                    <td className="py-3">
                      <div className="flex justify-center">{getRankIcon(entry.rank)}</div>
                    </td>
                    <td className="py-3 text-white font-medium">Trader #{entry.user_id?.slice(-6)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs border ${getTierStyle(entry.tier)}`}>
                        {entry.tier?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-teal-400">{entry.tier_points}</td>
                    <td className="py-3 text-right font-mono text-amber-400">{entry.competitions_won}</td>
                    <td className="py-3 text-right font-mono text-slate-400">{entry.podium_finishes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Themed Events Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { theme: 'bear_market', icon: '🐻', name: 'Bear Market Survival', desc: 'Lowest drawdown wins' },
          { theme: 'moon_mission', icon: '🚀', name: 'Moon Mission', desc: 'Maximum returns' },
          { theme: 'steady_hands', icon: '✋', name: 'Steady Hands', desc: 'Best Sharpe ratio' },
          { theme: 'speed_trader', icon: '⚡', name: 'Speed Trader', desc: '4-hour blitz' }
        ].map(event => (
          <button
            key={event.theme}
            onClick={() => createThemedEvent(event.theme)}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all text-left group"
          >
            <span className="text-2xl">{event.icon}</span>
            <h4 className="text-white font-semibold mt-2 group-hover:text-purple-400 transition-colors">
              {event.name}
            </h4>
            <p className="text-xs text-slate-500">{event.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TradingCompetitions;
