import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Wifi, WifiOff } from 'lucide-react';
import GlassCard from './GlassCard';
import useWebSocket from '../hooks/useWebSocket';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/prices';

const LiveMarketsRealtime = ({ onClose, symbols = ['BTC', 'ETH', 'SPY'] }) => {
  const [markets, setMarkets] = useState({});
  const [loading, setLoading] = useState(true);
  const [useWebSocketConnection, setUseWebSocketConnection] = useState(true);

  // WebSocket connection for real-time updates
  const { data: wsData, isConnected, error: wsError } = useWebSocket(WS_URL, {
    onMessage: (message) => {
      if (message.type === 'price_update' && message.data) {
        const newMarkets = {};
        message.data.forEach(item => {
          newMarkets[item.symbol] = item;
        });
        setMarkets(prev => ({ ...prev, ...newMarkets }));
        setLoading(false);
      }
    },
    onConnect: () => {
      console.log('WebSocket connected for live prices');
    },
    reconnect: true,
    maxReconnectAttempts: 3
  });

  // Fallback to REST API if WebSocket fails
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get(`${API}/market/prices`);
        const newMarkets = {};
        response.data.forEach(item => {
          newMarkets[item.symbol] = item;
        });
        setMarkets(prev => ({ ...prev, ...newMarkets }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching markets:', error);
      }
    };

    // Initial fetch
    fetchMarkets();

    // Fallback polling if WebSocket not connected
    if (!isConnected) {
      const interval = setInterval(fetchMarkets, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const displayedMarkets = useMemo(() => {
    return symbols.map(symbol => markets[symbol]).filter(Boolean);
  }, [markets, symbols]);

  const formatPrice = (price, symbol) => {
    if (!price) return '$0';
    if (symbol === 'BTC' || symbol === 'ETH' || symbol === 'SOL') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className="relative"
      data-testid="live-markets-realtime"
    >
      <GlassCard className="min-w-[320px]" accent="white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-semibold text-white/90 uppercase tracking-wider">
              Live Markets
            </h3>
            {/* Connection indicator */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${
              isConnected 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'LIVE' : 'REST'}
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
              data-testid="close-markets-btn"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex gap-6">
          {loading ? (
            <div className="flex gap-6">
              {symbols.map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-12 bg-white/10 rounded mb-2" />
                  <div className="h-6 w-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : (
            displayedMarkets.map((market) => (
              <motion.div 
                key={market.symbol} 
                className="text-center"
                data-testid={`market-${market.symbol.toLowerCase()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-mono text-slate-400 mb-1">{market.symbol}</p>
                <p className="text-lg font-mono font-semibold text-white tabular-nums">
                  {formatPrice(market.price, market.symbol)}
                </p>
                <div className={`flex items-center justify-center gap-1 text-xs font-mono ${
                  market.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {market.change_percent >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>{market.change_percent >= 0 ? '+' : ''}{market.change_percent?.toFixed(2)}%</span>
                </div>
                {/* Source indicator */}
                {market.source === 'coingecko' && (
                  <span className="text-[10px] text-teal-500/60 font-mono">CG</span>
                )}
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default LiveMarketsRealtime;
