import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Radar, AlertTriangle, TrendingUp, TrendingDown, 
  MessageSquare, BookOpen, RefreshCw, Volume2, VolumeX,
  ExternalLink, Clock, Zap, Filter
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TradeCrawler = () => {
  const { t } = useTranslation();
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWCKmJuXh3FXRkJKTmp+jZqek4d3aF5XTklKUVximqe2ta6fj4V9d3NwbmppamtsbnR8g46XoKetr7Cwra2sqKeimpeWlJSTk5WXmaGnrbK3u77Awb+9u7m4t7a2tbW0tbW2t7m7vcDDxsjKy8rJyMbEwb67ubm5urq7vL2+wMLDxcbHyMnJycnJyMjHxsTCwL68uri3tre3t7i5ury+wcPFx8nKy8zMzMvLycjGxMLAvry6ubm4uLi4uLm6u73AwsPGx8rLzM3Nzc3MzMrJx8XDwb+9u7q5ubm5ubi5uru9v8LFx8nLzc7Oz8/OzcvJx8XDwb+9u7q5uLi4uLi5uru9wMPGycvNz9DR0dDPzsrIxsTCwL68uri4uLi4uLm6u73Aw8bJy83Pz9DQ0M/OzMrIxcPBv727ubm5ubm5uru9wMPGysvOz9HQ0dDQz87MysfFw8C+u7m4uLi4uLq7vb/Cxcj');
  }, []);

  // WebSocket connection for real-time signals
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      wsRef.current = new WebSocket(`${wsUrl}/ws/crawler`);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Crawler WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'crawler_signal') {
          setSignals(prev => [data.data, ...prev].slice(0, 50));
          
          // Play sound for critical/high signals
          if (soundEnabled && (data.data.urgency === 'critical' || data.data.urgency === 'high')) {
            audioRef.current?.play().catch(() => {});
          }
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = () => {
        setIsConnected(false);
      };
    };

    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [soundEnabled]);

  // Fetch initial signals
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch(`${API}/crawler/signals?limit=30`);
        if (response.ok) {
          const data = await response.json();
          setSignals(data);
        }
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };
    fetchSignals();
  }, []);

  const filteredSignals = signals.filter(signal => 
    filter === 'all' || signal.signal_type === filter
  );

  const getSignalIcon = (type) => {
    switch (type) {
      case 'whale': return '🐋';
      case 'news': return '📰';
      case 'social': return '📱';
      case 'orderbook': return '📊';
      default: return '📡';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4" data-testid="trade-crawler-panel">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
            <Radar className="text-teal-400" size={20} />
            {t('crawler.title')}
          </h3>
          <StatusBadge 
            variant={isConnected ? 'active' : 'danger'} 
            pulse={isConnected}
          >
            {isConnected ? t('status.live') : t('status.offline')}
          </StatusBadge>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
            data-testid="crawler-sound-toggle"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <NeonButton 
            onClick={() => window.location.reload()} 
            variant="white" 
            size="sm"
          >
            <RefreshCw size={14} />
          </NeonButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All', icon: Filter },
          { id: 'whale', label: t('crawler.whales'), icon: null, emoji: '🐋' },
          { id: 'news', label: t('crawler.news'), icon: null, emoji: '📰' },
          { id: 'social', label: t('crawler.social'), icon: MessageSquare },
          { id: 'orderbook', label: t('crawler.orderbook'), icon: BookOpen },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              filter === item.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
            data-testid={`filter-${item.id}`}
          >
            {item.emoji ? <span>{item.emoji}</span> : item.icon && <item.icon size={12} />}
            {item.label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Radar className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">{t('crawler.noSignals')}</p>
            </div>
          ) : (
            filteredSignals.map((signal, index) => (
              <motion.div
                key={signal.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Signal Type Icon */}
                  <div className="text-2xl">{getSignalIcon(signal.signal_type)}</div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${getUrgencyColor(signal.urgency)}`}>
                        {signal.urgency}
                      </span>
                      <span className="text-xs font-mono text-teal-400">{signal.symbol}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(signal.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-white/90 break-words">{signal.message}</p>
                    
                    {signal.action_suggested && (
                      <div className="mt-2 flex items-center gap-2">
                        <Zap size={12} className="text-yellow-400" />
                        <span className="text-xs font-mono text-yellow-400">{signal.action_suggested}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Trend Indicator */}
                  <div className="flex-shrink-0">
                    {signal.data?.sentiment === 'bullish' || signal.action_suggested?.includes('LONG') || signal.action_suggested?.includes('ACCUMULATION') ? (
                      <TrendingUp className="text-emerald-400" size={18} />
                    ) : signal.data?.sentiment === 'bearish' || signal.action_suggested?.includes('SHORT') || signal.action_suggested?.includes('SELL') ? (
                      <TrendingDown className="text-red-400" size={18} />
                    ) : (
                      <AlertTriangle className="text-yellow-400" size={18} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeCrawler;
