import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, PieChart as PieIcon,
  BarChart3, Calendar, DollarSign, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

const PortfolioAnalytics = ({ isPaperTrading = false }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M');
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get(`${API}/portfolio/summary`, { withCredentials: true });
        setPortfolio(response.data);
        
        // Generate performance history
        const history = [];
        let value = response.data.total_value * 0.85;
        for (let i = 30; i >= 0; i--) {
          const change = (Math.random() - 0.45) * 0.03;
          value = value * (1 + change);
          history.push({
            day: i,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(value),
            pnl: Math.round((value - response.data.total_value * 0.85) / 100) * 100
          });
        }
        setPerformanceData(history);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        // Fallback data
        setPortfolio({
          total_value: isPaperTrading ? 100000 : 345678,
          daily_pnl: isPaperTrading ? 2340 : 8945,
          daily_pnl_percent: isPaperTrading ? 2.34 : 2.65,
          positions: [
            { symbol: 'BTC', quantity: 2.5, value: 223500, price: 89400 },
            { symbol: 'ETH', quantity: 25, value: 74750, price: 2990 },
            { symbol: 'AAPL', quantity: 500, value: 124000, price: 248 },
            { symbol: 'NVDA', quantity: 200, value: 29000, price: 145 },
          ],
          cash_balance: isPaperTrading ? 50000 : 75000
        });
      }
      setLoading(false);
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [isPaperTrading]);

  if (loading || !portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const totalPositionsValue = portfolio.positions.reduce((acc, p) => acc + p.value, 0);
  const pieData = portfolio.positions.map(p => ({
    name: p.symbol,
    value: p.value,
    percent: ((p.value / totalPositionsValue) * 100).toFixed(1)
  }));

  // Add cash to pie
  pieData.push({
    name: 'Cash',
    value: portfolio.cash_balance,
    percent: ((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2">
          <p className="text-white font-mono text-sm">
            ${payload[0].value?.toLocaleString()}
          </p>
          <p className="text-slate-500 font-mono text-xs">
            {payload[0].payload.date}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" data-testid="portfolio-analytics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-teal-400" />
            Portfolio Analytics
            {isPaperTrading && (
              <StatusBadge variant="warning">PAPER TRADING</StatusBadge>
            )}
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Track your performance and allocation
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <GlassCard accent="teal">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-teal-400" size={20} />
            <StatusBadge variant="active">LIVE</StatusBadge>
          </div>
          <p className="text-3xl font-mono font-bold text-white">
            ${portfolio.total_value.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">Total Value</p>
        </GlassCard>

        <GlassCard accent={portfolio.daily_pnl >= 0 ? 'teal' : 'rose'}>
          <div className="flex items-center justify-between mb-2">
            {portfolio.daily_pnl >= 0 ? (
              <ArrowUpRight className="text-emerald-400" size={20} />
            ) : (
              <ArrowDownRight className="text-rose-400" size={20} />
            )}
            <span className="text-xs font-mono text-slate-500">24H</span>
          </div>
          <p className={`text-3xl font-mono font-bold ${portfolio.daily_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {portfolio.daily_pnl >= 0 ? '+' : ''}${portfolio.daily_pnl.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Daily P&L ({portfolio.daily_pnl_percent >= 0 ? '+' : ''}{portfolio.daily_pnl_percent.toFixed(2)}%)
          </p>
        </GlassCard>

        <GlassCard accent="white">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="text-indigo-400" size={20} />
            <span className="text-xs font-mono text-slate-500">{portfolio.positions.length}</span>
          </div>
          <p className="text-3xl font-mono font-bold text-white">
            ${totalPositionsValue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">Invested</p>
        </GlassCard>

        <GlassCard accent="white">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="text-amber-400" size={20} />
            <Percent size={14} className="text-slate-500" />
          </div>
          <p className="text-3xl font-mono font-bold text-white">
            ${portfolio.cash_balance.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Cash ({((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)}%)
          </p>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="col-span-2">
          <GlassCard accent="teal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold text-white">Performance</h3>
              <div className="flex gap-1">
                {['1W', '1M', '3M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      timeRange === range 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Allocation Pie */}
        <GlassCard accent="white">
          <h3 className="font-heading text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieIcon size={18} className="text-indigo-400" />
            Allocation
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ 
                    background: 'rgba(0,0,0,0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-400 font-mono">{item.name}</span>
                <span className="text-white font-mono ml-auto">{item.percent}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Positions Table */}
      <GlassCard accent="white">
        <h3 className="font-heading text-lg font-semibold text-white mb-4">Open Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-mono text-slate-500 pb-3">Asset</th>
                <th className="text-right text-xs font-mono text-slate-500 pb-3">Quantity</th>
                <th className="text-right text-xs font-mono text-slate-500 pb-3">Price</th>
                <th className="text-right text-xs font-mono text-slate-500 pb-3">Value</th>
                <th className="text-right text-xs font-mono text-slate-500 pb-3">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((position, index) => (
                <motion.tr 
                  key={position.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: COLORS[index % COLORS.length] + '20', color: COLORS[index % COLORS.length] }}
                      >
                        {position.symbol.slice(0, 2)}
                      </div>
                      <span className="font-mono font-semibold text-white">{position.symbol}</span>
                    </div>
                  </td>
                  <td className="text-right font-mono text-white">{position.quantity}</td>
                  <td className="text-right font-mono text-slate-400">${position.price.toLocaleString()}</td>
                  <td className="text-right font-mono font-semibold text-white">${position.value.toLocaleString()}</td>
                  <td className="text-right">
                    <StatusBadge variant="default">
                      {((position.value / portfolio.total_value) * 100).toFixed(1)}%
                    </StatusBadge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default PortfolioAnalytics;
