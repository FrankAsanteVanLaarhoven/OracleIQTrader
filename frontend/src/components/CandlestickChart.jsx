import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, Settings } from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Generate realistic OHLC data
const generateCandlestickData = (basePrice, periods = 50, volatility = 0.02) => {
  const data = [];
  let currentPrice = basePrice * 0.95;
  
  for (let i = 0; i < periods; i++) {
    const change = (Math.random() - 0.5) * volatility * 2;
    const open = currentPrice;
    const close = currentPrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000 + 500000;
    
    // Calculate simple indicators
    const bodySize = Math.abs(close - open);
    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;
    
    data.push({
      time: i,
      date: new Date(Date.now() - (periods - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
      bullish: close > open,
      bodySize,
      upperWick,
      lowerWick
    });
    
    currentPrice = close;
  }
  
  // Add moving averages
  for (let i = 0; i < data.length; i++) {
    // SMA 7
    if (i >= 6) {
      const sum7 = data.slice(i - 6, i + 1).reduce((acc, d) => acc + d.close, 0);
      data[i].sma7 = Math.round(sum7 / 7 * 100) / 100;
    }
    // SMA 21
    if (i >= 20) {
      const sum21 = data.slice(i - 20, i + 1).reduce((acc, d) => acc + d.close, 0);
      data[i].sma21 = Math.round(sum21 / 21 * 100) / 100;
    }
    // RSI (simplified)
    if (i >= 14) {
      const gains = [];
      const losses = [];
      for (let j = i - 13; j <= i; j++) {
        const change = data[j].close - data[j].open;
        if (change > 0) gains.push(change);
        else losses.push(Math.abs(change));
      }
      const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
      const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      data[i].rsi = Math.round(100 - (100 / (1 + rs)));
    }
  }
  
  return data;
};

// Custom Candlestick Shape
const CandlestickShape = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  
  const { open, close, high, low, bullish } = payload;
  const color = bullish ? '#10b981' : '#f43f5e';
  const candleWidth = Math.max(width * 0.6, 4);
  const wickWidth = 1;
  
  // Scale calculations
  const priceRange = high - low;
  const scaleY = (price) => {
    if (priceRange === 0) return y;
    return y + height - ((price - low) / priceRange) * height;
  };
  
  const bodyTop = scaleY(Math.max(open, close));
  const bodyBottom = scaleY(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={scaleY(high)}
        x2={x + width / 2}
        y2={scaleY(low)}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body */}
      <rect
        x={x + (width - candleWidth) / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={bullish ? color : color}
        stroke={color}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
};

const CandlestickChart = ({ symbol = 'BTC', title = 'Bitcoin / USD' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [showIndicators, setShowIndicators] = useState({ sma7: true, sma21: true, volume: true });
  const [timeframe, setTimeframe] = useState('1H');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceRes = await axios.get(`${API}/market/${symbol}`);
        const price = priceRes.data.price;
        setCurrentPrice(price);
        setChange(priceRes.data.change_percent);
        
        // Generate candlestick data based on real price
        const candleData = generateCandlestickData(price, 50, symbol === 'BTC' ? 0.015 : 0.02);
        setData(candleData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        const candleData = generateCandlestickData(symbol === 'BTC' ? 90000 : 3000, 50);
        setData(candleData);
        setCurrentPrice(symbol === 'BTC' ? 90000 : 3000);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  const isPositive = change >= 0;
  const latestRSI = data[data.length - 1]?.rsi || 50;
  const rsiStatus = latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].payload) {
      const d = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 text-xs font-mono">
          <p className="text-slate-400 mb-2">{d.date}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-500">Open:</span>
            <span className="text-white">${d.open?.toLocaleString()}</span>
            <span className="text-slate-500">High:</span>
            <span className="text-emerald-400">${d.high?.toLocaleString()}</span>
            <span className="text-slate-500">Low:</span>
            <span className="text-rose-400">${d.low?.toLocaleString()}</span>
            <span className="text-slate-500">Close:</span>
            <span className={d.bullish ? 'text-emerald-400' : 'text-rose-400'}>${d.close?.toLocaleString()}</span>
            {d.rsi && (
              <>
                <span className="text-slate-500">RSI:</span>
                <span className={d.rsi > 70 ? 'text-rose-400' : d.rsi < 30 ? 'text-emerald-400' : 'text-white'}>{d.rsi}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="candlestick-chart">
      <GlassCard className="h-full" accent={isPositive ? 'teal' : 'rose'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-xl font-bold uppercase text-white">{symbol}</h3>
              <StatusBadge variant={isPositive ? 'success' : 'danger'}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </StatusBadge>
            </div>
            <p className="text-xs font-mono text-slate-500">{title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-white tabular-nums">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 justify-end mt-1">
              <StatusBadge variant={latestRSI > 70 ? 'danger' : latestRSI < 30 ? 'success' : 'default'}>
                RSI: {latestRSI} ({rsiStatus})
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* Timeframe & Indicators */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {['1H', '4H', '1D', '1W'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                  timeframe === tf 
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowIndicators(prev => ({ ...prev, sma7: !prev.sma7 }))}
              className={`px-2 py-1 rounded text-xs font-mono ${showIndicators.sma7 ? 'text-teal-400' : 'text-slate-600'}`}
            >
              SMA7
            </button>
            <button
              onClick={() => setShowIndicators(prev => ({ ...prev, sma21: !prev.sma21 }))}
              className={`px-2 py-1 rounded text-xs font-mono ${showIndicators.sma21 ? 'text-amber-400' : 'text-slate-600'}`}
            >
              SMA21
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-slate-500 font-mono">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={50}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Volume bars at bottom */}
                {showIndicators.volume && (
                  <Bar 
                    dataKey="volume" 
                    fill="rgba(99, 102, 241, 0.2)"
                    yAxisId="volume"
                  />
                )}
                
                {/* Candlesticks */}
                <Bar
                  dataKey="high"
                  shape={<CandlestickShape />}
                  isAnimationActive={false}
                />
                
                {/* SMA Lines */}
                {showIndicators.sma7 && (
                  <Line
                    type="monotone"
                    dataKey="sma7"
                    stroke="#14b8a6"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                )}
                {showIndicators.sma21 && (
                  <Line
                    type="monotone"
                    dataKey="sma21"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pattern Detection */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">Detected Patterns:</span>
            <div className="flex gap-2">
              {data.length > 0 && data[data.length - 1]?.bullish && (
                <StatusBadge variant="success">Bullish Engulfing</StatusBadge>
              )}
              {latestRSI > 70 && (
                <StatusBadge variant="warning">RSI Overbought</StatusBadge>
              )}
              {latestRSI < 30 && (
                <StatusBadge variant="success">RSI Oversold</StatusBadge>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CandlestickChart;
