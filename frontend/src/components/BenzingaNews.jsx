import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Bell, TrendingUp, TrendingDown, AlertTriangle,
  Clock, ExternalLink, RefreshCw, Filter, Zap, Volume2
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Simulated Benzinga-style news data (placeholder until API key provided)
const generateMockNews = () => {
  const templates = [
    { title: 'Breaking: Bitcoin ETF Sees Record Inflows', symbol: 'BTC', sentiment: 'bullish', impact: 'high', category: 'ETF' },
    { title: 'Federal Reserve Signals Potential Rate Pause', symbol: 'MARKET', sentiment: 'bullish', impact: 'high', category: 'Macro' },
    { title: 'Ethereum Staking Reaches New Milestone', symbol: 'ETH', sentiment: 'bullish', impact: 'medium', category: 'Network' },
    { title: 'SEC Announces New Crypto Compliance Guidelines', symbol: 'CRYPTO', sentiment: 'bearish', impact: 'high', category: 'Regulatory' },
    { title: 'Major Tech Company Adds Bitcoin to Balance Sheet', symbol: 'BTC', sentiment: 'bullish', impact: 'high', category: 'Adoption' },
    { title: 'Solana Network Processes Record Transactions', symbol: 'SOL', sentiment: 'bullish', impact: 'medium', category: 'Network' },
    { title: 'Crypto Exchange Reports Quarterly Earnings Beat', symbol: 'MARKET', sentiment: 'bullish', impact: 'medium', category: 'Earnings' },
    { title: 'DeFi Protocol Suffers Flash Loan Attack', symbol: 'ETH', sentiment: 'bearish', impact: 'medium', category: 'Security' },
    { title: 'Central Bank Digital Currency Pilot Launches', symbol: 'MARKET', sentiment: 'neutral', impact: 'medium', category: 'CBDC' },
    { title: 'Mining Difficulty Hits All-Time High', symbol: 'BTC', sentiment: 'bullish', impact: 'low', category: 'Mining' },
    { title: 'Layer 2 Solutions See Surge in Adoption', symbol: 'ETH', sentiment: 'bullish', impact: 'medium', category: 'Technology' },
    { title: 'Whale Alert: Large BTC Transfer to Exchange', symbol: 'BTC', sentiment: 'bearish', impact: 'medium', category: 'Whale' },
  ];

  return templates.map((t, i) => ({
    id: `news-${Date.now()}-${i}`,
    ...t,
    timestamp: new Date(Date.now() - i * 1000 * 60 * Math.floor(Math.random() * 60)).toISOString(),
    source: 'Benzinga',
    url: '#',
    summary: `This is a developing story affecting ${t.symbol} markets. Stay tuned for updates.`
  }));
};

const BenzingaNews = () => {
  const [news, setNews] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      // In production, this would call the Benzinga API
      // For now, use simulated data
      const mockNews = generateMockNews();
      setNews(mockNews);
      
      // Check for high-impact news to add to alerts
      const highImpact = mockNews.filter(n => n.impact === 'high' && alertsEnabled);
      if (highImpact.length > alerts.length) {
        const newAlerts = highImpact.slice(0, 3);
        setAlerts(newAlerts);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [alertsEnabled, alerts.length]);

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getImpactStyle = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  const getCategoryStyle = (category) => {
    const styles = {
      'ETF': 'bg-blue-500/20 text-blue-400',
      'Macro': 'bg-purple-500/20 text-purple-400',
      'Regulatory': 'bg-red-500/20 text-red-400',
      'Network': 'bg-teal-500/20 text-teal-400',
      'Adoption': 'bg-green-500/20 text-green-400',
      'Security': 'bg-orange-500/20 text-orange-400',
      'CBDC': 'bg-cyan-500/20 text-cyan-400',
      'Mining': 'bg-amber-500/20 text-amber-400',
      'Technology': 'bg-indigo-500/20 text-indigo-400',
      'Whale': 'bg-pink-500/20 text-pink-400',
      'Earnings': 'bg-emerald-500/20 text-emerald-400',
    };
    return styles[category] || 'bg-slate-500/20 text-slate-400';
  };

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(n => n.sentiment === filter || n.impact === filter);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6" data-testid="benzinga-news">
      {/* Breaking News Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && alertsEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            {alerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className={`p-4 rounded-xl border backdrop-blur-xl ${
                  alert.sentiment === 'bullish' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : alert.sentiment === 'bearish'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/30">
                      <Bell className={`${
                        alert.sentiment === 'bullish' ? 'text-green-400' :
                        alert.sentiment === 'bearish' ? 'text-red-400' : 'text-amber-400'
                      } animate-pulse`} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-400 font-semibold">
                          BREAKING
                        </span>
                        <span className="text-xs text-slate-400">{alert.symbol}</span>
                      </div>
                      <h4 className="text-white font-semibold">{alert.title}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="text-orange-400" />
            Market News & Alerts
          </h2>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            Real-time news powered by Benzinga
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
              PLACEHOLDER
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              alertsEnabled 
                ? 'bg-teal-500/20 text-teal-400' 
                : 'bg-white/5 text-slate-400'
            }`}
            title={alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            <Volume2 size={20} />
          </button>
          <NeonButton onClick={fetchNews} variant="white" size="sm" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </NeonButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-green-400" size={16} />
            <span className="text-xs text-green-400">Bullish</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {news.filter(n => n.sentiment === 'bullish').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="text-red-400" size={16} />
            <span className="text-xs text-red-400">Bearish</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {news.filter(n => n.sentiment === 'bearish').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="text-amber-400" size={16} />
            <span className="text-xs text-amber-400">High Impact</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {news.filter(n => n.impact === 'high').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-500/10 to-transparent border border-slate-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-slate-400" size={16} />
            <span className="text-xs text-slate-400">Last Update</span>
          </div>
          <p className="text-lg font-mono text-white">
            {lastUpdate ? formatTime(lastUpdate.toISOString()) : '-'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' ? 'bg-teal-500/30 text-teal-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('bullish')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'bullish' ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <TrendingUp size={14} className="inline mr-1" /> Bullish
        </button>
        <button
          onClick={() => setFilter('bearish')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'bearish' ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <TrendingDown size={14} className="inline mr-1" /> Bearish
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'high' ? 'bg-amber-500/30 text-amber-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Zap size={14} className="inline mr-1" /> High Impact
        </button>
      </div>

      {/* News Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-orange-400" size={32} />
            <span className="ml-3 text-slate-400">Loading news...</span>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getCategoryStyle(item.category)}`}>
                      {item.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${getSentimentStyle(item.sentiment)}`}>
                      {item.sentiment === 'bullish' && <TrendingUp size={12} className="inline mr-1" />}
                      {item.sentiment === 'bearish' && <TrendingDown size={12} className="inline mr-1" />}
                      {item.sentiment}
                    </span>
                    <span className="text-xs text-slate-500">{item.symbol}</span>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1 hover:text-teal-400 cursor-pointer transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-2">{item.summary}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Newspaper size={12} />
                      {item.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(item.timestamp)}
                    </span>
                    <span className={`flex items-center gap-1 ${getImpactStyle(item.impact)}`}>
                      <AlertTriangle size={12} />
                      {item.impact} impact
                    </span>
                  </div>
                </div>
                
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
            <p>No news matching filters</p>
          </div>
        )}
      </div>

      {/* API Integration Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0" size={20} />
          <div>
            <h4 className="text-amber-400 font-semibold">Benzinga API Integration Pending</h4>
            <p className="text-sm text-slate-400 mt-1">
              This component displays simulated news data. To enable real Benzinga news feeds, 
              please provide your Benzinga API key. The integration structure is ready for 
              immediate activation once credentials are configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenzingaNews;
