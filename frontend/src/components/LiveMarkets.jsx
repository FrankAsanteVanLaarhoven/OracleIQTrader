import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import GlassCard from './GlassCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LiveMarkets = ({ onClose }) => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get(`${API}/market/prices`);
        setMarkets(response.data);
      } catch (error) {
        console.error('Error fetching markets:', error);
        // Fallback data
        setMarkets([
          { symbol: 'BTC', price: 112011, change_percent: 2.5 },
          { symbol: 'ETH', price: 4159, change_percent: -1.2 },
          { symbol: 'SPY', price: 598.65, change_percent: 0.8 },
        ]);
      }
      setLoading(false);
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price, symbol) => {
    if (symbol === 'BTC' || symbol === 'ETH') {
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
      data-testid="live-markets-panel"
    >
      <GlassCard className="min-w-[320px]" accent="white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-white/90 uppercase tracking-wider">
            Live Markets
          </h3>
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-12 bg-white/10 rounded mb-2" />
                  <div className="h-6 w-20 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : (
            markets.slice(0, 3).map((market) => (
              <div key={market.symbol} className="text-center" data-testid={`market-${market.symbol.toLowerCase()}`}>
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
                  <span>{market.change_percent >= 0 ? '+' : ''}{market.change_percent.toFixed(1)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default LiveMarkets;
