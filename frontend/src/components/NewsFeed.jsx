import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown,
  Flame, AlertTriangle, Globe, RefreshCw
} from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import NeonButton from './NeonButton';

// Simulated news data (in production, use a real news API)
const SAMPLE_NEWS = [
  {
    id: 1,
    title: 'Bitcoin Surges Past $90,000 Amid Institutional Buying',
    source: 'CryptoNews',
    time: '2 min ago',
    sentiment: 'bullish',
    category: 'crypto',
    impact: 'high',
    symbols: ['BTC']
  },
  {
    id: 2,
    title: 'Federal Reserve Signals Potential Rate Cut in Q1 2025',
    source: 'MarketWatch',
    time: '15 min ago',
    sentiment: 'bullish',
    category: 'macro',
    impact: 'high',
    symbols: ['SPY', 'BTC', 'ETH']
  },
  {
    id: 3,
    title: 'Ethereum 2.0 Staking Reaches New All-Time High',
    source: 'DeFi Pulse',
    time: '32 min ago',
    sentiment: 'bullish',
    category: 'crypto',
    impact: 'medium',
    symbols: ['ETH']
  },
  {
    id: 4,
    title: 'Apple Reports Record Q4 Revenue, Stock Up 3%',
    source: 'CNBC',
    time: '1 hour ago',
    sentiment: 'bullish',
    category: 'stocks',
    impact: 'medium',
    symbols: ['AAPL']
  },
  {
    id: 5,
    title: 'SEC Delays Decision on Spot ETF Applications',
    source: 'Reuters',
    time: '2 hours ago',
    sentiment: 'bearish',
    category: 'regulatory',
    impact: 'medium',
    symbols: ['BTC', 'ETH']
  },
  {
    id: 6,
    title: 'NVIDIA Unveils Next-Gen AI Chips, Shares Rally',
    source: 'TechCrunch',
    time: '3 hours ago',
    sentiment: 'bullish',
    category: 'stocks',
    impact: 'high',
    symbols: ['NVDA']
  },
  {
    id: 7,
    title: 'DeFi Protocol Reports Security Vulnerability',
    source: 'The Block',
    time: '4 hours ago',
    sentiment: 'bearish',
    category: 'crypto',
    impact: 'low',
    symbols: ['ETH']
  },
  {
    id: 8,
    title: 'Global Markets Rally on Positive Economic Data',
    source: 'Bloomberg',
    time: '5 hours ago',
    sentiment: 'bullish',
    category: 'macro',
    impact: 'medium',
    symbols: ['SPY']
  }
];

const NewsFeed = ({ filterSymbol = null }) => {
  const [news, setNews] = useState(SAMPLE_NEWS);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const refreshNews = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Shuffle and update times
      const shuffled = [...SAMPLE_NEWS].sort(() => Math.random() - 0.5).map((item, i) => ({
        ...item,
        id: Date.now() + i,
        time: i === 0 ? 'Just now' : `${(i + 1) * 5} min ago`
      }));
      setNews(shuffled);
      setLoading(false);
    }, 1000);
  };

  const filteredNews = news.filter(item => {
    if (filterSymbol && !item.symbols.includes(filterSymbol)) return false;
    if (filter === 'all') return true;
    if (filter === 'bullish') return item.sentiment === 'bullish';
    if (filter === 'bearish') return item.sentiment === 'bearish';
    if (filter === 'high-impact') return item.impact === 'high';
    return true;
  });

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'bullish') return <TrendingUp size={12} className="text-emerald-400" />;
    if (sentiment === 'bearish') return <TrendingDown size={12} className="text-rose-400" />;
    return null;
  };

  const getImpactBadge = (impact) => {
    if (impact === 'high') return <StatusBadge variant="danger"><Flame size={10} />High</StatusBadge>;
    if (impact === 'medium') return <StatusBadge variant="warning">Medium</StatusBadge>;
    return <StatusBadge variant="default">Low</StatusBadge>;
  };

  return (
    <div className="space-y-4" data-testid="news-feed-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
          <Newspaper className="text-amber-400" size={20} />
          Live News Feed
        </h3>
        <NeonButton
          onClick={refreshNews}
          variant="ghost"
          size="sm"
          disabled={loading}
          data-testid="refresh-news-btn"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </NeonButton>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'bullish', 'bearish', 'high-impact'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-slate-500 border border-white/10 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All News' : 
             f === 'bullish' ? '📈 Bullish' : 
             f === 'bearish' ? '📉 Bearish' : '🔥 High Impact'}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence>
          {filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard 
                accent={item.sentiment === 'bullish' ? 'teal' : item.sentiment === 'bearish' ? 'rose' : 'white'}
                className="hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="space-y-2">
                  {/* Title */}
                  <h4 className="font-medium text-white group-hover:text-teal-400 transition-colors flex items-start gap-2">
                    {getSentimentIcon(item.sentiment)}
                    <span className="flex-1">{item.title}</span>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-teal-400 flex-shrink-0 mt-1" />
                  </h4>

                  {/* Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe size={10} />
                        {item.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {item.time}
                      </span>
                    </div>
                    {getImpactBadge(item.impact)}
                  </div>

                  {/* Symbols */}
                  <div className="flex gap-1">
                    {item.symbols.map(sym => (
                      <span
                        key={sym}
                        className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-slate-400"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Newspaper size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-mono">No news matching filters</p>
          </div>
        )}
      </div>

      {/* Market Sentiment Summary */}
      <GlassCard accent="white">
        <h4 className="font-heading font-semibold text-white mb-3 text-sm">Market Sentiment</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-full bg-white/10 rounded-full h-2 w-32">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                style={{ 
                  width: `${(news.filter(n => n.sentiment === 'bullish').length / news.length) * 100}%` 
                }}
              />
            </div>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-emerald-400">
              {Math.round((news.filter(n => n.sentiment === 'bullish').length / news.length) * 100)}% Bullish
            </span>
            <span className="text-rose-400">
              {Math.round((news.filter(n => n.sentiment === 'bearish').length / news.length) * 100)}% Bearish
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default NewsFeed;
