import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Eye, PieChart, TrendingUp, Users, 
  Shield, Check, AlertCircle, Calendar, Download
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HowWeMakeMoney = () => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('January 2026');

  useEffect(() => {
    // Simulated transparency report data
    setMonthlyData({
      month: 'January 2026',
      totalRevenue: 2847500,
      breakdown: [
        { 
          source: 'Platform Fees',
          amount: 1423750,
          percentage: 50,
          description: 'Commissions on trades (5-25 bps depending on tier)',
          icon: DollarSign,
          color: 'text-emerald-400'
        },
        { 
          source: 'Pro Subscriptions',
          amount: 854250,
          percentage: 30,
          description: '$29.99/month for reduced fees and advanced features',
          icon: Users,
          color: 'text-blue-400'
        },
        { 
          source: 'API Access',
          amount: 284750,
          percentage: 10,
          description: 'Enterprise API subscriptions and data feeds',
          icon: TrendingUp,
          color: 'text-purple-400'
        },
        { 
          source: 'Spread Capture',
          amount: 199325,
          percentage: 7,
          description: 'Market making on internal matching (transparent)',
          icon: PieChart,
          color: 'text-amber-400'
        },
        { 
          source: 'Interest on Deposits',
          amount: 85425,
          percentage: 3,
          description: 'Interest earned on customer deposits (shared with users)',
          icon: Shield,
          color: 'text-cyan-400'
        },
      ],
      ethicalCommitments: [
        { commitment: 'Zero Payment for Order Flow (PFOF)', status: true },
        { commitment: 'No Proprietary Trading Against Customers', status: true },
        { commitment: 'No Hidden Spread Markups', status: true },
        { commitment: 'All Fees Disclosed Pre-Trade', status: true },
        { commitment: 'Best Execution Guarantee', status: true },
        { commitment: 'No Data Selling to Third Parties', status: true },
      ],
      metrics: {
        activeUsers: 52847,
        totalTradesProcessed: 1847293,
        avgCostPerTrade: 12.5, // bps
        rebatesIssued: 42580,
        customerSatisfaction: 4.8,
      },
      previousMonths: [
        { month: 'December 2025', revenue: 2654000 },
        { month: 'November 2025', revenue: 2423000 },
        { month: 'October 2025', revenue: 2187000 },
      ]
    });
  }, []);

  const formatCurrency = (val) => `$${val.toLocaleString()}`;
  const formatNumber = (val) => val.toLocaleString();

  if (!monthlyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="how-we-make-money">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Eye className="text-amber-400" />
            How We Make Money
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            100% Transparent • Updated Monthly • No Secrets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="January 2026">January 2026</option>
            <option value="December 2025">December 2025</option>
            <option value="November 2025">November 2025</option>
          </select>
          <Button className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
            <Download size={16} className="mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Ethical Commitments Banner */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="text-emerald-400" />
          <span className="text-white font-medium">Our Ethical Commitments</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {monthlyData.ethicalCommitments.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.status ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <AlertCircle size={14} className="text-red-400" />
              )}
              <span className="text-slate-300">{item.commitment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 text-center">
        <div className="text-sm text-slate-400 mb-2">{monthlyData.month} Total Revenue</div>
        <div className="text-5xl font-bold text-white mb-2">{formatCurrency(monthlyData.totalRevenue)}</div>
        <div className="text-emerald-400 text-sm">+7.3% from previous month</div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard title="Revenue Breakdown" icon="📊" accent="amber">
          <div className="space-y-4">
            {monthlyData.breakdown.map((source, i) => (
              <motion.div
                key={source.source}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <source.icon className={`w-5 h-5 ${source.color}`} />
                    <span className="text-white font-medium">{source.source}</span>
                  </div>
                  <span className={`font-bold ${source.color}`}>{source.percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{source.description}</span>
                  <span className="text-sm text-slate-300">{formatCurrency(source.amount)}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      source.color.includes('emerald') ? 'bg-emerald-500' :
                      source.color.includes('blue') ? 'bg-blue-500' :
                      source.color.includes('purple') ? 'bg-purple-500' :
                      source.color.includes('amber') ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Platform Metrics */}
        <div className="space-y-4">
          <GlassCard title="Platform Metrics" icon="📈" accent="blue">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <div className="text-3xl font-bold text-white">{formatNumber(monthlyData.metrics.activeUsers)}</div>
                <div className="text-xs text-slate-500">Active Users</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <div className="text-3xl font-bold text-white">{formatNumber(monthlyData.metrics.totalTradesProcessed)}</div>
                <div className="text-xs text-slate-500">Trades Processed</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <div className="text-3xl font-bold text-emerald-400">{monthlyData.metrics.avgCostPerTrade} bps</div>
                <div className="text-xs text-slate-500">Avg Cost/Trade</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <div className="text-3xl font-bold text-amber-400">{formatCurrency(monthlyData.metrics.rebatesIssued)}</div>
                <div className="text-xs text-slate-500">Rebates Issued</div>
              </div>
            </div>
          </GlassCard>

          {/* Customer Satisfaction */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">Customer Satisfaction</span>
              <span className="text-amber-400 font-bold">{monthlyData.metrics.customerSatisfaction}/5.0</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-8 h-8 rounded flex items-center justify-center ${
                    star <= Math.floor(monthlyData.metrics.customerSatisfaction)
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-slate-600'
                  }`}
                >
                  ★
                </div>
              ))}
            </div>
          </div>

          {/* Historical Trend */}
          <GlassCard title="Revenue Trend" icon="📉" accent="purple">
            <div className="space-y-3">
              {[{ month: monthlyData.month, revenue: monthlyData.totalRevenue }, ...monthlyData.previousMonths].map((item, i) => (
                <div key={item.month} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className={`text-sm ${i === 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {item.month}
                  </span>
                  <span className={`font-mono ${i === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* What We DON'T Do */}
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="text-red-400" />
          What We DON'T Do (Unlike Others)
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Sell your order flow to market makers (PFOF)',
            'Trade against your positions with our own capital',
            'Add hidden markups to spreads',
            'Sell your data to hedge funds or advertisers',
            'Use "gamification" to encourage overtrading',
            'Hide fees until after you trade',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="text-red-400">✗</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Audit & Compliance */}
      <div className="text-center text-sm text-slate-500">
        <p>This transparency report is independently audited monthly.</p>
        <p className="mt-1">
          Questions? Contact <span className="text-teal-400">transparency@oracleiqtrader.com</span>
        </p>
      </div>
    </div>
  );
};

export default HowWeMakeMoney;
