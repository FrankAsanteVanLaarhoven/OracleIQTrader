import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, TrendingUp, TrendingDown, Hash, 
  Twitter, Users, Activity, Flame, BarChart2,
  ThumbsUp, ThumbsDown, ExternalLink, RefreshCw
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SocialSignals = () => {
  const { t } = useTranslation();
  const [trending, setTrending] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [symbolSentiment, setSymbolSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
    fetchSymbolSentiment(selectedSymbol);
  }, [selectedSymbol]);

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API}/social/trending`);
      if (response.ok) {
        const data = await response.json();
        setTrending(data);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbolSentiment = async (symbol) => {
    try {
      const response = await fetch(`${API}/social/sentiment/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setSymbolSentiment(data);
      }
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 0.7) return 'text-emerald-400';
    if (score >= 0.55) return 'text-teal-400';
    if (score >= 0.45) return 'text-slate-400';
    if (score >= 0.3) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSentimentBg = (score) => {
    if (score >= 0.7) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 0.55) return 'bg-teal-500/20 border-teal-500/30';
    if (score >= 0.45) return 'bg-slate-500/20 border-slate-500/30';
    if (score >= 0.3) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getFearGreedColor = (index) => {
    if (index >= 75) return 'text-emerald-400';
    if (index >= 55) return 'text-teal-400';
    if (index >= 45) return 'text-slate-400';
    if (index >= 25) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6" data-testid="social-signals">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="text-blue-400" />
            Social Signals
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">Real-time social media sentiment analysis</p>
        </div>
        
        <NeonButton onClick={fetchTrending} variant="white" size="sm">
          <RefreshCw size={14} />
          Refresh
        </NeonButton>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-slate-400">Loading social signals...</span>
        </div>
      )}

      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fear & Greed Index */}
        {trending && (
          <GlassCard title="Fear & Greed Index" icon="🎭" accent="purple">
            <div className="flex flex-col items-center py-4">
              <div className="relative w-32 h-32">
                {/* Gauge background */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="url(#fearGreedGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${trending.fear_greed_index * 2.51} 251`}
                  />
                  <defs>
                    <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getFearGreedColor(trending.fear_greed_index)}`}>
                    {trending.fear_greed_index}
                  </span>
                </div>
              </div>
              <span className={`mt-2 text-lg font-semibold ${getFearGreedColor(trending.fear_greed_index)}`}>
                {trending.fear_greed_label}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Updated {new Date(trending.updated_at).toLocaleTimeString()}
              </span>
            </div>
          </GlassCard>
        )}

        {/* Trending Topics */}
        <div className="lg:col-span-2">
          <GlassCard title="Trending Topics" icon="🔥" accent="orange">
            <div className="space-y-3">
              {trending?.trending?.map((topic, i) => (
                <motion.div
                  key={topic.topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-xl border ${getSentimentBg(topic.sentiment_score)} cursor-pointer hover:scale-[1.02] transition-transform`}
                  onClick={() => {
                    const symbol = topic.topic.replace('#', '').toUpperCase();
                    if (['BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'SOL', 'SOLANA'].includes(symbol)) {
                      setSelectedSymbol(symbol === 'BITCOIN' ? 'BTC' : symbol === 'ETHEREUM' ? 'ETH' : symbol === 'SOLANA' ? 'SOL' : symbol);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-slate-500" />
                      <span className="font-semibold text-white">{topic.topic}</span>
                      {topic.sentiment === 'bullish' ? (
                        <TrendingUp size={14} className="text-emerald-400" />
                      ) : topic.sentiment === 'bearish' ? (
                        <TrendingDown size={14} className="text-red-400" />
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono ${topic.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {topic.change_24h >= 0 ? '+' : ''}{topic.change_24h}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{topic.mentions.toLocaleString()} mentions</span>
                    <div className="flex items-center gap-1">
                      <span className={getSentimentColor(topic.sentiment_score)}>
                        {(topic.sentiment_score * 100).toFixed(0)}% sentiment
                      </span>
                    </div>
                  </div>
                  {/* Sample tweets */}
                  <div className="mt-2 space-y-1">
                    {topic.sample_tweets?.slice(0, 1).map((tweet, j) => (
                      <p key={j} className="text-xs text-slate-400 truncate">"{tweet}"</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      )}

      {/* Symbol Sentiment Detail */}
      {symbolSentiment && (
        <GlassCard title={`${symbolSentiment.symbol} Sentiment Analysis`} icon="📊" accent="blue">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sentiment Score */}
            <div className="flex flex-col items-center p-4 rounded-xl bg-white/5">
              <div className={`text-4xl font-bold ${getSentimentColor(symbolSentiment.sentiment_score)}`}>
                {(symbolSentiment.sentiment_score * 100).toFixed(0)}%
              </div>
              <span className={`text-sm font-semibold mt-1 ${getSentimentColor(symbolSentiment.sentiment_score)}`}>
                {symbolSentiment.sentiment_label}
              </span>
              <div className="w-full h-2 rounded-full bg-slate-700 mt-3">
                <div 
                  className={`h-full rounded-full transition-all ${
                    symbolSentiment.sentiment_score >= 0.5 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${symbolSentiment.sentiment_score * 100}%` }}
                />
              </div>
            </div>

            {/* Mentions */}
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-teal-400" />
                <span className="text-sm text-slate-500">24h Mentions</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {symbolSentiment.mentions_24h?.toLocaleString()}
              </div>
              <div className={`text-xs ${symbolSentiment.mentions_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {symbolSentiment.mentions_change >= 0 ? '+' : ''}{symbolSentiment.mentions_change}% from yesterday
              </div>
              {/* Source breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Twitter size={12} /> Twitter
                  </span>
                  <span className="text-white">{symbolSentiment.sources?.twitter?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <MessageCircle size={12} /> Reddit
                  </span>
                  <span className="text-white">{symbolSentiment.sources?.reddit?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Users size={12} /> Telegram
                  </span>
                  <span className="text-white">{symbolSentiment.sources?.telegram?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Key Influencers */}
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-purple-400" />
                <span className="text-sm text-slate-500">Key Influencers</span>
              </div>
              <div className="space-y-3">
                {symbolSentiment.key_influencers?.map((influencer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">{influencer.name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {(influencer.followers / 1000).toFixed(0)}K
                      </span>
                    </div>
                    {influencer.sentiment === 'bullish' ? (
                      <ThumbsUp size={14} className="text-emerald-400" />
                    ) : influencer.sentiment === 'bearish' ? (
                      <ThumbsDown size={14} className="text-red-400" />
                    ) : (
                      <span className="text-xs text-slate-500">Neutral</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Symbol Selector */}
          <div className="mt-4 flex items-center gap-2 justify-center">
            {['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA'].map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                  selectedSymbol === symbol
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default SocialSignals;
