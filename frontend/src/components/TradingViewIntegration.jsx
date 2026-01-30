import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, BarChart2, Settings, 
  Maximize2, Minimize2, RefreshCw, Clock
} from 'lucide-react';
import GlassCard from './GlassCard';

// TradingView Widget Integration
const TradingViewChart = ({ 
  symbol = 'BINANCE:BTCUSDT', 
  theme = 'dark',
  height = 500,
  interval = '1H',
  showToolbar = true 
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0a',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          hide_side_toolbar: false,
          studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
        });
        setIsLoaded(true);
      }
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval, theme]);

  const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;

  return (
    <div className="relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-xl">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      )}
      <div 
        id={containerId}
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
};

// Advanced Chart Component with Controls
const TradingViewIntegration = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');
  const [interval, setInterval] = useState('1H');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(500);

  const popularSymbols = [
    { symbol: 'BINANCE:BTCUSDT', name: 'BTC/USDT', change: '+2.34%', positive: true },
    { symbol: 'BINANCE:ETHUSDT', name: 'ETH/USDT', change: '+1.89%', positive: true },
    { symbol: 'BINANCE:SOLUSDT', name: 'SOL/USDT', change: '-0.45%', positive: false },
    { symbol: 'NASDAQ:AAPL', name: 'AAPL', change: '+0.67%', positive: true },
    { symbol: 'NASDAQ:TSLA', name: 'TSLA', change: '-1.23%', positive: false },
    { symbol: 'FX:EURUSD', name: 'EUR/USD', change: '+0.12%', positive: true },
  ];

  const intervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
  ];

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0a0a] p-6' : ''}`} data-testid="tradingview-integration">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-blue-400" />
            Advanced Charts
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">TradingView</span>
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Professional charting • 100+ indicators • Real-time data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            {isFullscreen ? <Minimize2 size={18} className="text-slate-400" /> : <Maximize2 size={18} className="text-slate-400" />}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Symbol List */}
        <div className="lg:col-span-1 space-y-3">
          <GlassCard title="Watchlist" icon="👁️" accent="blue">
            <div className="space-y-2">
              {popularSymbols.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedSymbol === item.symbol
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className={`text-sm font-mono ${item.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.change}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Symbol Input */}
            <div className="mt-4">
              <label className="text-xs text-slate-500 block mb-1">Custom Symbol</label>
              <input
                type="text"
                placeholder="BINANCE:BTCUSDT"
                className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedSymbol(e.target.value);
                  }
                }}
              />
            </div>
          </GlassCard>

          {/* Interval Selection */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400">Timeframe</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {intervals.map((int) => (
                <button
                  key={int.value}
                  onClick={() => setInterval(int.value)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    interval === int.value
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {int.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <TradingViewChart 
              symbol={selectedSymbol}
              interval={interval}
              height={isFullscreen ? window.innerHeight - 200 : chartHeight}
              theme="dark"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!isFullscreen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RSI (14)', value: '58.3', status: 'neutral' },
            { label: 'MACD', value: 'Bullish', status: 'positive' },
            { label: 'MA(50) Cross', value: 'Above', status: 'positive' },
            { label: 'Volume', value: '+23%', status: 'positive' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
              <div className={`text-lg font-bold ${
                stat.status === 'positive' ? 'text-emerald-400' : 
                stat.status === 'negative' ? 'text-red-400' : 'text-slate-300'
              }`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { TradingViewChart };
export default TradingViewIntegration;
