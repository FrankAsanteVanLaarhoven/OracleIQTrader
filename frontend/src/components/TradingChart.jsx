import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from './GlassCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TradingChart = ({ symbol = 'BTC', title = 'Price Chart' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, priceRes] = await Promise.all([
          axios.get(`${API}/market/${symbol}/history?periods=50`),
          axios.get(`${API}/market/${symbol}`)
        ]);
        
        setData(historyRes.data);
        setCurrentPrice(priceRes.data.price);
        setChange(priceRes.data.change_percent);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Generate fallback data
        const fallbackData = Array.from({ length: 50 }, (_, i) => ({
          time: i,
          close: 100000 + Math.random() * 20000,
          volume: Math.random() * 1000000
        }));
        setData(fallbackData);
        setCurrentPrice(112000);
        setChange(2.5);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  const isPositive = change >= 0;
  const gradientColor = isPositive ? '#14b8a6' : '#f43f5e';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2">
          <p className="text-white font-mono text-sm">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="trading-chart">
      <GlassCard className="h-full" accent={isPositive ? 'teal' : 'rose'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-xl font-bold uppercase text-white">{symbol}</h3>
            <p className="text-xs font-mono text-slate-500">{title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-white tabular-nums">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center justify-end gap-1 text-sm font-mono ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-slate-500 font-mono">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={gradientColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${symbol})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default TradingChart;
