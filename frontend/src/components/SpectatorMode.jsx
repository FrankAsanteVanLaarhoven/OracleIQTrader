import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Users, TrendingUp, TrendingDown, Activity,
  Play, Pause, Volume2, VolumeX, Zap, Crown,
  ArrowUp, ArrowDown, Radio
} from 'lucide-react';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API.replace('https://', 'wss://').replace('http://', 'ws://');

const SpectatorMode = ({ tournamentId, onClose }) => {
  const [connected, setConnected] = useState(false);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [liveTrades, setLiveTrades] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const wsRef = useRef(null);
  const tradesEndRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tournamentId]);

  useEffect(() => {
    // Auto-scroll to latest trade
    if (tradesEndRef.current && !paused) {
      tradesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTrades, paused]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/tournament/${tournamentId}`);
      
      ws.onopen = () => {
        setConnected(true);
        console.log('Spectator WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
      };
      
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  const handleMessage = (data) => {
    switch (data.type) {
      case 'welcome':
        setSpectatorCount(data.spectators);
        if (data.recent_trades) {
          setLiveTrades(data.recent_trades);
        }
        break;
      
      case 'spectator_update':
        setSpectatorCount(data.count);
        break;
      
      case 'trade':
        if (!paused) {
          setLiveTrades(prev => [...prev.slice(-49), data.data]);
          if (soundEnabled) {
            playTradeSound(data.data.side);
          }
        }
        break;
      
      case 'leaderboard_update':
        // Update leaderboard with animations
        break;
      
      default:
        break;
    }
  };

  const playTradeSound = (side) => {
    // Simple audio feedback (can be enhanced)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = side === 'buy' ? 800 : 400;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <Radio size={14} className="text-red-400 animate-pulse" />
              <span className="text-xs font-mono text-red-400">LIVE</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye size={20} className="text-teal-400" />
              Spectator Mode
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Users size={16} />
              <span className="text-sm">{spectatorCount} watching</span>
            </div>
            
            <button
              onClick={() => setPaused(!paused)}
              className={`p-2 rounded-lg transition-colors ${
                paused ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white'
              }`}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 h-full overflow-hidden flex">
        {/* Live Trade Feed */}
        <div className="flex-1 p-4 overflow-hidden">
          <GlassCard title="Live Trades" icon={<Activity className="text-teal-400" />} accent="teal" className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <AnimatePresence initial={false}>
                {liveTrades.map((trade, idx) => (
                  <motion.div
                    key={trade.id || idx}
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`p-3 rounded-lg border ${
                      trade.side === 'buy' 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Side indicator */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          trade.side === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {trade.side === 'buy' ? (
                            <TrendingUp className="text-emerald-400" size={20} />
                          ) : (
                            <TrendingDown className="text-red-400" size={20} />
                          )}
                        </div>
                        
                        {/* Trade details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{trade.trader_name}</span>
                            {trade.trader_rank <= 3 && (
                              <Crown size={14} className="text-amber-400" />
                            )}
                            <span className="text-xs text-slate-500">#{trade.trader_rank}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            <span className={trade.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                              {trade.side.toUpperCase()}
                            </span>
                            {' '}{trade.quantity} {trade.symbol} @ {formatCurrency(trade.price)}
                          </p>
                        </div>
                      </div>
                      
                      {/* P&L */}
                      <div className="text-right">
                        <p className={`font-mono font-semibold ${
                          trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                        <p className={`text-xs ${
                          trade.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={tradesEndRef} />
            </div>
            
            {/* Paused indicator */}
            {paused && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold">
                  Feed Paused
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Stats Sidebar */}
        <div className="w-80 p-4 space-y-4 overflow-y-auto">
          {/* Connection Status */}
          <GlassCard accent={connected ? 'teal' : 'red'} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connected ? 'bg-teal-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className="text-sm text-slate-400">
                {connected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard title="Session Stats" accent="purple" className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Trades Seen</span>
                <span className="text-white font-mono">{liveTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buy Orders</span>
                <span className="text-emerald-400 font-mono">
                  {liveTrades.filter(t => t.side === 'buy').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sell Orders</span>
                <span className="text-red-400 font-mono">
                  {liveTrades.filter(t => t.side === 'sell').length}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Top Traders */}
          <GlassCard title="Most Active" accent="amber" className="p-4">
            <div className="space-y-2">
              {Object.entries(
                liveTrades.reduce((acc, t) => {
                  acc[t.trader_name] = (acc[t.trader_name] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count], idx) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{idx + 1}</span>
                      <span className="text-white text-sm">{name}</span>
                    </div>
                    <span className="text-amber-400 text-sm">{count} trades</span>
                  </div>
                ))}
            </div>
          </GlassCard>

          {/* Legend */}
          <div className="p-3 rounded-lg bg-white/5 text-xs text-slate-500">
            <p className="mb-2 font-semibold text-slate-400">Legend</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded bg-emerald-500/50" />
              <span>Buy Order</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              <span>Sell Order</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SpectatorMode;
