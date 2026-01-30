import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, TrendingDown, Activity, 
  Gauge, BarChart2, PieChart, Zap, RefreshCw
} from 'lucide-react';
import GlassCard from './GlassCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RiskDashboard = () => {
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/risk/portfolio/demo_user`);
      const data = await response.json();
      
      setPortfolioRisk({
        totalValue: data.total_value,
        dailyVaR: data.daily_var95,
        weeklyVaR: data.weekly_var95,
        monthlyVaR: data.monthly_var95,
        currentDrawdown: data.current_drawdown,
        maxDrawdown: data.max_drawdown,
        sharpeRatio: data.sharpe_ratio,
        sortinoRatio: data.sortino_ratio,
        beta: data.beta,
        correlation: data.correlation_to_market,
        volatility: data.volatility_annual,
        riskScore: data.risk_score,
        stressScenarios: data.stress_scenarios,
      });
      
      setPositions(data.positions.map(p => ({
        symbol: p.symbol,
        allocation: p.allocation,
        value: p.value,
        var95: p.var95,
        heat: p.heat,
        beta: p.beta,
        drawdown: p.drawdown,
        volatility: p.volatility,
      })));
    } catch (error) {
      console.error('Error fetching risk data:', error);
      // Fallback to mock data
      setPortfolioRisk({
        totalValue: 127432.50,
        dailyVaR: 2548.65,
        weeklyVaR: 5697.89,
        monthlyVaR: 12743.25,
        currentDrawdown: -3.2,
        maxDrawdown: -12.5,
        sharpeRatio: 1.85,
        sortinoRatio: 2.12,
        beta: 1.15,
        correlation: 0.78,
        volatility: 18.5,
      });
      setPositions([
        { symbol: 'BTC', allocation: 35, value: 44601.38, var95: 1784.06, heat: 85, beta: 1.4, drawdown: -5.2 },
        { symbol: 'ETH', allocation: 25, value: 31858.13, var95: 1274.33, heat: 72, beta: 1.3, drawdown: -4.1 },
      ]);
    }
    setLoading(false);
  };

  const getHeatColor = (heat) => {
    if (heat >= 80) return 'text-red-400 bg-red-500/20';
    if (heat >= 60) return 'text-amber-400 bg-amber-500/20';
    if (heat >= 40) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-emerald-400 bg-emerald-500/20';
  };

  const getVaRColor = (varPercent) => {
    if (varPercent >= 5) return 'text-red-400';
    if (varPercent >= 3) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const formatCurrency = (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="risk-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-purple-400" />
            Risk Dashboard
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Visual VaR • Portfolio Heat • Drawdown Projections
          </p>
        </div>
        <button 
          onClick={generateRiskData}
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-500 mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(portfolioRisk.totalValue)}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-500 mb-1">Daily VaR (95%)</div>
          <div className={`text-2xl font-bold ${getVaRColor((portfolioRisk.dailyVaR / portfolioRisk.totalValue) * 100)}`}>
            {formatCurrency(portfolioRisk.dailyVaR)}
          </div>
          <div className="text-xs text-slate-500">{((portfolioRisk.dailyVaR / portfolioRisk.totalValue) * 100).toFixed(2)}% of portfolio</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-500 mb-1">Current Drawdown</div>
          <div className="text-2xl font-bold text-amber-400">{formatPercent(portfolioRisk.currentDrawdown)}</div>
          <div className="text-xs text-slate-500">Max: {formatPercent(portfolioRisk.maxDrawdown)}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs text-slate-500 mb-1">Sharpe Ratio</div>
          <div className="text-2xl font-bold text-teal-400">{portfolioRisk.sharpeRatio.toFixed(2)}</div>
          <div className="text-xs text-slate-500">Sortino: {portfolioRisk.sortinoRatio.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* VaR Visualization */}
        <GlassCard title="Value at Risk Bands" icon="📊" accent="purple">
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              Potential loss over different time horizons at 95% confidence
            </div>
            
            {/* VaR Timeline */}
            <div className="space-y-4">
              {[
                { label: 'Daily', value: portfolioRisk.dailyVaR, percent: (portfolioRisk.dailyVaR / portfolioRisk.totalValue) * 100 },
                { label: 'Weekly', value: portfolioRisk.weeklyVaR, percent: (portfolioRisk.weeklyVaR / portfolioRisk.totalValue) * 100 },
                { label: 'Monthly', value: portfolioRisk.monthlyVaR, percent: (portfolioRisk.monthlyVaR / portfolioRisk.totalValue) * 100 },
              ].map((period, i) => (
                <div key={period.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{period.label}</span>
                    <span className={getVaRColor(period.percent)}>
                      {formatCurrency(period.value)} ({period.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(period.percent * 5, 100)}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        period.percent >= 5 ? 'bg-red-500' : period.percent >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* VaR Gauge */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-white/10 relative">
                <motion.div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: `conic-gradient(
                      ${portfolioRisk.volatility > 25 ? '#ef4444' : portfolioRisk.volatility > 15 ? '#f59e0b' : '#10b981'} ${portfolioRisk.volatility * 3.6}deg,
                      rgba(255,255,255,0.1) 0deg
                    )`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <div className="absolute inset-6 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">{portfolioRisk.volatility.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500">Volatility</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Portfolio Heat Map */}
        <GlassCard title="Position Heat Map" icon="🔥" accent="amber">
          <div className="text-sm text-slate-400 mb-4">
            Risk concentration by position (higher = more risk contribution)
          </div>
          
          <div className="space-y-3">
            {positions.map((pos, i) => (
              <motion.div
                key={pos.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{pos.symbol}</span>
                    <span className="text-xs text-slate-500">{pos.allocation}%</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getHeatColor(pos.heat)}`}>
                    Heat: {pos.heat}
                  </span>
                </div>
                
                {/* Heat Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pos.heat}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      pos.heat >= 80 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                      pos.heat >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      pos.heat >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                      'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">
                    VaR: <span className="text-white">{formatCurrency(pos.var95)}</span>
                  </span>
                  <span className="text-slate-500">
                    β: <span className="text-white">{pos.beta.toFixed(1)}</span>
                  </span>
                  <span className="text-slate-500">
                    DD: <span className={pos.drawdown < -5 ? 'text-red-400' : 'text-amber-400'}>{formatPercent(pos.drawdown)}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Drawdown Projection */}
      <GlassCard title="Drawdown Projections" icon="📉" accent="red">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Current State */}
          <div className="text-center p-6 rounded-xl bg-white/5">
            <TrendingDown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-amber-400">{formatPercent(portfolioRisk.currentDrawdown)}</div>
            <div className="text-sm text-slate-500">Current Drawdown</div>
          </div>
          
          {/* Max Historical */}
          <div className="text-center p-6 rounded-xl bg-white/5">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400">{formatPercent(portfolioRisk.maxDrawdown)}</div>
            <div className="text-sm text-slate-500">Max Historical Drawdown</div>
          </div>
          
          {/* Projected Recovery */}
          <div className="text-center p-6 rounded-xl bg-white/5">
            <Activity className="w-8 h-8 text-teal-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-teal-400">~14 days</div>
            <div className="text-sm text-slate-500">Est. Recovery Time</div>
          </div>
        </div>

        {/* Drawdown Chart */}
        <div className="mt-6 h-32 flex items-end gap-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const drawdown = Math.sin(i * 0.3) * 8 - 3;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.abs(drawdown) * 5 + 10}%` }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                className={`flex-1 rounded-t ${drawdown < -5 ? 'bg-red-500/60' : drawdown < -2 ? 'bg-amber-500/60' : 'bg-teal-500/60'}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </GlassCard>
    </div>
  );
};

export default RiskDashboard;
