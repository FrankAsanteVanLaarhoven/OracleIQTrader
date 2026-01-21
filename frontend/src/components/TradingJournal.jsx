import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Calendar, TrendingUp, TrendingDown, 
  Award, AlertTriangle, Play, Pause, ChevronLeft, ChevronRight,
  FileText, Mic, Volume2, Target, Percent, DollarSign
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TradingJournal = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('daily'); // 'daily' or 'weekly'
  const [note, setNote] = useState('');
  const audioRef = React.useRef(null);

  // Fetch daily summary
  const fetchDailySummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/journal/daily-summary?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDailySummary(data);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch weekly summary
  const fetchWeeklySummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/journal/weekly-summary`);
      if (response.ok) {
        const data = await response.json();
        setWeeklySummary(data);
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'daily') {
      fetchDailySummary();
    } else {
      fetchWeeklySummary();
    }
  }, [view, fetchDailySummary, fetchWeeklySummary]);

  // Play audio summary
  const playAudioSummary = () => {
    if (dailySummary?.audio && audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${dailySummary.audio}`;
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  // Navigate dates
  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Add note
  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await fetch(`${API}/journal/add-note?date=${selectedDate}&note=${encodeURIComponent(note)}`, {
        method: 'POST'
      });
      setNote('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const emotionColors = {
    excited: 'text-emerald-400 bg-emerald-500/20',
    happy: 'text-emerald-400 bg-emerald-500/20',
    concerned: 'text-amber-400 bg-amber-500/20',
    neutral: 'text-slate-400 bg-slate-500/20'
  };

  return (
    <div className="space-y-6" data-testid="trading-journal">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-amber-400" />
            Trading Journal
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">Track your performance and learn from every trade</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              view === 'daily' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-white/5 text-slate-400'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              view === 'weekly' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-white/5 text-slate-400'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <>
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/10">
              <Calendar size={16} className="text-teal-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-sm outline-none"
              />
            </div>
            <button 
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-slate-400">Loading journal data...</span>
            </div>
          )}

          {!loading && dailySummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-teal-400" />
                    <span className="text-xs text-slate-500 font-mono">TRADES</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{dailySummary.trades_count}</p>
                  <p className="text-xs text-slate-500">{dailySummary.wins}W / {dailySummary.losses}L</p>
                </div>
                
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent size={16} className="text-blue-400" />
                    <span className="text-xs text-slate-500 font-mono">WIN RATE</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{dailySummary.win_rate}%</p>
                  <div className="w-full h-1 rounded-full bg-slate-700 mt-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                      style={{ width: `${dailySummary.win_rate}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className={dailySummary.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                    <span className="text-xs text-slate-500 font-mono">TOTAL P&L</span>
                  </div>
                  <p className={`text-3xl font-bold ${dailySummary.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dailySummary.total_pnl >= 0 ? '+' : ''}${dailySummary.total_pnl.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* AI Insights */}
              <GlassCard title="AI Insights" icon="🧠" accent="purple">
                <div className={`p-4 rounded-xl ${emotionColors[dailySummary.emotion]} mb-4`}>
                  <p className="text-sm">{dailySummary.ai_insights}</p>
                </div>
                
                {dailySummary.audio && (
                  <NeonButton 
                    onClick={playAudioSummary} 
                    variant="teal" 
                    className="w-full"
                    disabled={isPlaying}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? 'Playing...' : 'Play Audio Summary'}
                  </NeonButton>
                )}
              </GlassCard>

              {/* Best & Worst Trades */}
              <div className="space-y-4">
                {dailySummary.best_trade && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-emerald-400" size={18} />
                      <span className="text-sm font-semibold text-emerald-400">Best Trade</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono">
                        {dailySummary.best_trade.action?.toUpperCase()} {dailySummary.best_trade.symbol}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        +${dailySummary.best_trade.profit_loss?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                
                {dailySummary.worst_trade && dailySummary.worst_trade.profit_loss < 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="text-red-400" size={18} />
                      <span className="text-sm font-semibold text-red-400">Worst Trade</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono">
                        {dailySummary.worst_trade.action?.toUpperCase()} {dailySummary.worst_trade.symbol}
                      </span>
                      <span className="text-red-400 font-bold">
                        ${dailySummary.worst_trade.profit_loss?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Note */}
              <GlassCard title="Journal Note" icon="📝" accent="amber">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add your thoughts about today's trading..."
                  className="w-full h-24 p-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm resize-none outline-none focus:border-teal-500/50"
                />
                <NeonButton onClick={saveNote} variant="white" size="sm" className="mt-3">
                  <FileText size={14} />
                  Save Note
                </NeonButton>
              </GlassCard>
            </div>
          )}
        </>
      ) : (
        /* Weekly View */
        weeklySummary && (
          <div className="space-y-6">
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-500 font-mono mb-1">TOTAL P&L</p>
                <p className={`text-2xl font-bold ${weeklySummary.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {weeklySummary.total_pnl >= 0 ? '+' : ''}${weeklySummary.total_pnl.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-500 font-mono mb-1">TOTAL TRADES</p>
                <p className="text-2xl font-bold text-white">{weeklySummary.total_trades}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-500 font-mono mb-1">WIN RATE</p>
                <p className="text-2xl font-bold text-white">{weeklySummary.overall_win_rate}%</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-500 font-mono mb-1">AI INSIGHT</p>
                <p className="text-xs text-slate-300">{weeklySummary.ai_insights}</p>
              </div>
            </div>

            {/* Daily Breakdown Chart */}
            <GlassCard title="7-Day Performance" icon="📊" accent="blue">
              <div className="flex items-end justify-between h-40 gap-2">
                {weeklySummary.daily_summaries?.slice().reverse().map((day, i) => {
                  const maxPnl = Math.max(...weeklySummary.daily_summaries.map(d => Math.abs(d.pnl)));
                  const height = maxPnl > 0 ? (Math.abs(day.pnl) / maxPnl) * 100 : 0;
                  const isPositive = day.pnl >= 0;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-28">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, 5)}%` }}
                          className={`w-full rounded-t ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-xs font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}${day.pnl.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        )
      )}
    </div>
  );
};

export default TradingJournal;
