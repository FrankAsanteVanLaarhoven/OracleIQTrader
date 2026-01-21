import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, Activity, Target,
  AlertTriangle, Clock, Zap, ChevronRight, RefreshCw
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const MLPredictions = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [horizon, setHorizon] = useState('24h');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'];
  const horizons = [
    { id: '1h', label: '1 Hour' },
    { id: '4h', label: '4 Hours' },
    { id: '24h', label: '24 Hours' },
    { id: '1w', label: '1 Week' }
  ];

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/ml/predict/comprehensive/${symbol}?horizon=${horizon}`);
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, horizon]);

  const fetchAccuracy = async () => {
    try {
      const response = await fetch(`${API}/ml/accuracy`);
      if (response.ok) {
        const data = await response.json();
        setAccuracy(data);
      }
    } catch (error) {
      console.error('Error fetching accuracy:', error);
    }
  };

  useEffect(() => {
    fetchPrediction();
    fetchAccuracy();
  }, [fetchPrediction]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getRecommendationStyle = (rec) => {
    switch (rec) {
      case 'strong_buy': return 'bg-green-500/30 text-green-400 border-green-500/50';
      case 'buy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'strong_sell': return 'bg-red-500/30 text-red-400 border-red-500/50';
      case 'sell': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-amber-400';
      case 'high': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6" data-testid="ml-predictions">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-purple-400" />
            AI Market Predictions
          </h2>
          <p className="text-slate-400 text-sm">ML-powered price, volatility, and trend analysis</p>
        </div>
        <NeonButton onClick={fetchPrediction} variant="white" size="sm" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </NeonButton>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Symbol</label>
          <div className="flex gap-2">
            {symbols.map(sym => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                  symbol === sym
                    ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Time Horizon</label>
          <div className="flex gap-2">
            {horizons.map(h => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  horizon === h.id
                    ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Brain className="animate-pulse text-purple-400" size={48} />
          <span className="ml-3 text-slate-400">Analyzing market data...</span>
        </div>
      ) : prediction ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Prediction Card */}
          <GlassCard className="lg:col-span-2 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white">{symbol}</h3>
                <p className="text-slate-400">{horizon} Forecast</p>
              </div>
              <div className={`px-4 py-2 rounded-xl border ${getRecommendationStyle(prediction.recommendation)}`}>
                <p className="text-xs opacity-70">Recommendation</p>
                <p className="text-lg font-bold capitalize">{prediction.recommendation?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Sentiment & Confidence */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-black/40">
                <p className="text-xs text-slate-500 mb-1">Sentiment</p>
                <p className={`text-xl font-bold capitalize ${getSentimentColor(prediction.overall_sentiment)}`}>
                  {prediction.overall_sentiment}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40">
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <p className="text-xl font-bold text-white">
                  {(prediction.overall_confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40">
                <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                <p className={`text-xl font-bold capitalize ${getRiskColor(prediction.risk_level)}`}>
                  {prediction.risk_level}
                </p>
              </div>
            </div>

            {/* Trade Setup */}
            {prediction.entry_price && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target size={16} className="text-teal-400" />
                  Suggested Trade Setup
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Entry</p>
                    <p className="text-white font-mono">${prediction.entry_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Stop Loss</p>
                    <p className="text-red-400 font-mono">${prediction.stop_loss?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Take Profit</p>
                    <p className="text-green-400 font-mono">${prediction.take_profit?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Position Size</p>
                    <p className="text-white font-mono">{prediction.position_size_suggestion}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Brain size={16} />
                AI Analysis
              </h4>
              <p className="text-slate-300 text-sm">{prediction.ai_analysis}</p>
            </div>

            {/* Key Factors */}
            {prediction.key_factors?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs text-slate-500 mb-2">Key Factors</h4>
                <div className="space-y-1">
                  {prediction.key_factors.map((factor, i) => (
                    <p key={i} className="text-sm text-slate-400 flex items-center gap-2">
                      <ChevronRight size={14} className="text-teal-400" />
                      {factor}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {prediction.risks?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-400" />
                  Risks
                </h4>
                <div className="space-y-1">
                  {prediction.risks.map((risk, i) => (
                    <p key={i} className="text-sm text-amber-400/80 flex items-center gap-2">
                      <span>•</span> {risk}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Price Direction */}
            <GlassCard title="Price Direction" icon="📈" accent="green" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl font-bold capitalize ${
                  prediction.price_direction?.direction === 'up' ? 'text-green-400' :
                  prediction.price_direction?.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {prediction.price_direction?.direction === 'up' ? <TrendingUp size={32} /> :
                   prediction.price_direction?.direction === 'down' ? <TrendingDown size={32} /> :
                   <Activity size={32} />}
                </span>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Expected Change</p>
                  <p className={`text-xl font-mono ${
                    prediction.price_direction?.predicted_change_percent > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.price_direction?.predicted_change_percent > 0 ? '+' : ''}
                    {prediction.price_direction?.predicted_change_percent?.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div 
                  className={`h-full rounded-full ${
                    prediction.price_direction?.direction === 'up' ? 'bg-green-500' :
                    prediction.price_direction?.direction === 'down' ? 'bg-red-500' : 'bg-slate-500'
                  }`}
                  style={{ width: `${(prediction.price_direction?.confidence || 0) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {((prediction.price_direction?.confidence || 0) * 100).toFixed(0)}% confidence
              </p>
            </GlassCard>

            {/* Volatility */}
            <GlassCard title="Volatility Forecast" icon="📊" accent="amber" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-lg font-bold capitalize ${
                  prediction.volatility?.level === 'extreme' || prediction.volatility?.level === 'high' ? 'text-red-400' :
                  prediction.volatility?.level === 'moderate' ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {prediction.volatility?.level?.replace('_', ' ')}
                </span>
                <span className="text-sm text-slate-400">
                  ±{prediction.volatility?.expected_range_percent?.toFixed(1)}%
                </span>
              </div>
              {prediction.volatility?.factors?.map((factor, i) => (
                <p key={i} className="text-xs text-slate-400 mt-1">• {factor}</p>
              ))}
            </GlassCard>

            {/* Trend */}
            <GlassCard title="Trend Analysis" icon="📉" accent="blue" className="p-4">
              <p className={`text-lg font-bold capitalize ${
                prediction.trend?.direction?.includes('bullish') ? 'text-green-400' :
                prediction.trend?.direction?.includes('bearish') ? 'text-red-400' : 'text-slate-400'
              }`}>
                {prediction.trend?.direction?.replace('_', ' ')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">Strength:</span>
                <div className="flex-1 h-2 rounded-full bg-white/10">
                  <div 
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(prediction.trend?.strength || 0) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {((prediction.trend?.strength || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </GlassCard>

            {/* Model Accuracy */}
            {accuracy && (
              <GlassCard title="Model Accuracy" icon="🎯" accent="purple" className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Price Direction</span>
                    <span className="text-white font-mono">{accuracy.price_direction?.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Volatility</span>
                    <span className="text-white font-mono">{accuracy.volatility?.accuracy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Trend</span>
                    <span className="text-white font-mono">{accuracy.trend?.accuracy}%</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-slate-400 font-semibold">Overall</span>
                    <span className="text-teal-400 font-mono font-bold">{accuracy.overall?.accuracy}%</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      ) : null}

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400/80">
        <AlertTriangle size={16} className="inline mr-2" />
        <strong>Disclaimer:</strong> AI predictions are for informational purposes only and should not be considered financial advice. Past performance does not guarantee future results. Always do your own research.
      </div>
    </div>
  );
};

export default MLPredictions;
