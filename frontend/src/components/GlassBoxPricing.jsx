import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, Shield, Info, 
  CheckCircle, AlertCircle, BarChart2, Percent, Receipt,
  ArrowRight, Users, Zap
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GlassBoxPricing = () => {
  const [activeTab, setActiveTab] = useState('estimate');
  const [feeSchedule, setFeeSchedule] = useState(null);
  const [competitors, setCompetitors] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    asset: 'BTC',
    asset_class: 'crypto',
    side: 'buy',
    quantity: 1,
    current_price: 45000,
    tier: 'free'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scheduleRes, compRes] = await Promise.all([
        fetch(`${API}/pricing/fee-schedule`).then(r => r.json()),
        fetch(`${API}/pricing/competitor-comparison`).then(r => r.json())
      ]);
      setFeeSchedule(scheduleRes);
      setCompetitors(compRes);
    } catch (e) {
      console.error('Error loading pricing data:', e);
    }
  };

  const getEstimate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pricing/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      });
      const data = await res.json();
      setEstimate(data);
    } catch (e) {
      console.error('Error getting estimate:', e);
    }
    setLoading(false);
  };

  const formatBps = (bps) => {
    if (bps === null || bps === undefined) return 'N/A';
    return `${bps.toFixed(1)} bps`;
  };

  const formatPercent = (bps) => {
    if (bps === null || bps === undefined) return 'N/A';
    return `${(bps / 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6" data-testid="glass-box-pricing">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="text-emerald-400" />
            Glass-Box Pricing
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            100% Transparent • No Hidden Fees • Real-time Competitor Comparison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Shield size={12} className="inline mr-1" />
            Execution Cost Cap Guarantee
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="estimate" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <Receipt size={14} className="mr-1" /> Cost Estimate
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <BarChart2 size={14} className="mr-1" /> Fee Schedule
          </TabsTrigger>
          <TabsTrigger value="compare" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Users size={14} className="mr-1" /> vs Competitors
          </TabsTrigger>
        </TabsList>

        {/* Cost Estimate Tab */}
        <TabsContent value="estimate" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order Form */}
            <GlassCard title="Order Parameters" icon="📝" accent="teal">
              <div className="space-y-4">
                {/* Asset Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Asset</label>
                    <select
                      value={orderForm.asset}
                      onChange={(e) => setOrderForm({ ...orderForm, asset: e.target.value })}
                      className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                    >
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="AAPL">Apple (AAPL)</option>
                      <option value="TSLA">Tesla (TSLA)</option>
                      <option value="EUR/USD">EUR/USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Asset Class</label>
                    <select
                      value={orderForm.asset_class}
                      onChange={(e) => setOrderForm({ ...orderForm, asset_class: e.target.value })}
                      className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                    >
                      <option value="crypto">Crypto</option>
                      <option value="equity">Equity</option>
                      <option value="forex">Forex</option>
                      <option value="options">Options</option>
                      <option value="prediction">Prediction</option>
                    </select>
                  </div>
                </div>

                {/* Side */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Side</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderForm({ ...orderForm, side: 'buy' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        orderForm.side === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <TrendingUp size={14} className="inline mr-1" /> Buy
                    </button>
                    <button
                      onClick={() => setOrderForm({ ...orderForm, side: 'sell' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        orderForm.side === 'sell'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <TrendingDown size={14} className="inline mr-1" /> Sell
                    </button>
                  </div>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Quantity</label>
                    <Input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Price ($)</label>
                    <Input
                      type="number"
                      value={orderForm.current_price}
                      onChange={(e) => setOrderForm({ ...orderForm, current_price: parseFloat(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Account Tier</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderForm({ ...orderForm, tier: 'free' })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
                        orderForm.tier === 'free'
                          ? 'bg-slate-500/20 text-white border border-slate-500/30'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      Free ($0/mo)
                    </button>
                    <button
                      onClick={() => setOrderForm({ ...orderForm, tier: 'pro' })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
                        orderForm.tier === 'pro'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Zap size={12} className="inline mr-1" /> Pro ($29.99/mo)
                    </button>
                  </div>
                </div>

                <Button onClick={getEstimate} className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate Costs'}
                </Button>
              </div>
            </GlassCard>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              {estimate ? (
                <>
                  <GlassCard title="Cost Breakdown" icon="💰" accent="emerald">
                    <div className="space-y-4">
                      {/* Notional Value */}
                      <div className="p-3 rounded-lg bg-white/5 flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Notional Value</span>
                        <span className="text-white font-bold">${estimate.notional_value?.toLocaleString()}</span>
                      </div>

                      {/* Fee Items */}
                      {estimate.estimated_fees?.map((fee, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-sm">{fee.description}</span>
                            <span className="text-amber-400 font-mono">{formatBps(fee.amount_bps)}</span>
                          </div>
                          <div className="text-xs text-slate-500 text-right">
                            ${fee.amount_usd?.toFixed(2)}
                          </div>
                        </div>
                      ))}

                      {/* Total */}
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total Estimated Cost</span>
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-lg">
                              {formatBps(estimate.total_estimated_cost_bps)} ({formatPercent(estimate.total_estimated_cost_bps)})
                            </div>
                            <div className="text-slate-400 text-sm">
                              ${estimate.total_estimated_cost_usd?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Cap Guarantee */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                        <Shield className="text-blue-400" size={20} />
                        <div>
                          <div className="text-blue-400 text-sm font-medium">Cost Cap: {formatBps(estimate.max_cost_cap_bps)}</div>
                          <div className="text-xs text-slate-400">If exceeded, we rebate the difference</div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Competitor Comparison */}
                  <GlassCard title="vs Competitors" icon="⚔️" accent="purple">
                    <div className="space-y-2">
                      {Object.entries(estimate.competitor_costs || {}).map(([comp, bps]) => {
                        const savings = bps - estimate.total_estimated_cost_bps;
                        const isBetter = savings > 0;
                        return (
                          <div key={comp} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                            <span className="text-slate-400 text-sm">{comp}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300 font-mono">{formatBps(bps)}</span>
                              {isBetter ? (
                                <span className="text-emerald-400 text-xs flex items-center">
                                  <CheckCircle size={12} className="mr-1" />
                                  Save {formatBps(savings)}
                                </span>
                              ) : (
                                <span className="text-red-400 text-xs flex items-center">
                                  <AlertCircle size={12} className="mr-1" />
                                  +{formatBps(Math.abs(savings))}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Enter order details and click "Calculate Costs"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Fee Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          {feeSchedule && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tiers */}
              <GlassCard title="Account Tiers" icon="👑" accent="amber">
                <div className="space-y-4">
                  {Object.entries(feeSchedule.tiers || {}).map(([id, tier]) => (
                    <div key={id} className={`p-4 rounded-lg ${id === 'pro' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold">{tier.name}</span>
                        <span className={`font-mono ${id === 'pro' ? 'text-amber-400' : 'text-slate-400'}`}>
                          ${tier.monthly_cost}/mo
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{tier.description}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Cost Caps */}
              <GlassCard title="Execution Cost Caps" icon="🛡️" accent="blue">
                <p className="text-slate-400 text-sm mb-4">
                  Maximum all-in cost per trade. We rebate any amount above these caps.
                </p>
                <div className="space-y-3">
                  {Object.entries(feeSchedule.cost_caps || {}).map(([asset, caps]) => (
                    <div key={asset} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-white capitalize">{asset}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-400">Free: {caps.free} bps</span>
                        <span className="text-amber-400">Pro: {caps.pro} bps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Asset Class Fees */}
              <div className="md:col-span-2">
                <GlassCard title="Fee Schedule by Asset Class" icon="📊" accent="teal">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 text-slate-400 font-normal">Asset Class</th>
                          <th className="text-right py-2 text-slate-400 font-normal">Free Tier</th>
                          <th className="text-right py-2 text-amber-400 font-normal">Pro Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(feeSchedule.asset_classes || {}).map(([ac, tiers]) => (
                          <tr key={ac} className="border-b border-white/5">
                            <td className="py-3 text-white capitalize">{ac}</td>
                            <td className="py-3 text-right text-slate-300 font-mono">
                              {tiers.free?.platform_bps ? `${tiers.free.platform_bps} bps` : 
                               tiers.free?.platform_per_contract ? `$${tiers.free.platform_per_contract}/contract` : 'N/A'}
                            </td>
                            <td className="py-3 text-right text-amber-400 font-mono">
                              {tiers.pro?.platform_bps !== undefined ? `${tiers.pro.platform_bps} bps` : 
                               tiers.pro?.platform_per_contract ? `$${tiers.pro.platform_per_contract}/contract` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Competitor Comparison Tab */}
        <TabsContent value="compare" className="mt-6">
          {competitors && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-emerald-400" />
                  <span className="text-white font-medium">OracleIQ: Transparent by Design</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Unlike competitors who hide costs in spreads or PFOF, we show you exactly what you pay.
                  Our cost cap guarantee ensures you never pay more than expected.
                </p>
              </div>

              <GlassCard title="Fee Comparison (basis points)" icon="📈" accent="purple">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-slate-400 font-normal">Broker</th>
                        <th className="text-right py-2 text-slate-400 font-normal">Equity</th>
                        <th className="text-right py-2 text-slate-400 font-normal">Crypto</th>
                        <th className="text-right py-2 text-slate-400 font-normal">Forex</th>
                        <th className="text-right py-2 text-slate-400 font-normal">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* OracleIQ Row */}
                      <tr className="border-b border-emerald-500/20 bg-emerald-500/5">
                        <td className="py-3 text-emerald-400 font-medium">OracleIQ (Pro)</td>
                        <td className="py-3 text-right text-emerald-400 font-mono">5 bps</td>
                        <td className="py-3 text-right text-emerald-400 font-mono">8 bps</td>
                        <td className="py-3 text-right text-emerald-400 font-mono">0 bps</td>
                        <td className="py-3 text-right text-emerald-400 font-mono">$0.35</td>
                      </tr>
                      {/* Competitors */}
                      {Object.entries(competitors.competitors || {}).map(([name, fees]) => (
                        <tr key={name} className="border-b border-white/5">
                          <td className="py-3 text-white">{name}</td>
                          <td className="py-3 text-right text-slate-300 font-mono">
                            {fees.equity !== null ? `${fees.equity} bps` : '—'}
                          </td>
                          <td className="py-3 text-right text-slate-300 font-mono">
                            {fees.crypto !== null ? `${fees.crypto} bps` : '—'}
                          </td>
                          <td className="py-3 text-right text-slate-300 font-mono">
                            {fees.forex !== null ? `${fees.forex} bps` : '—'}
                          </td>
                          <td className="py-3 text-right text-slate-300 font-mono">
                            {fees.options !== null ? `${fees.options} bps` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Note: 100 bps = 1%. Competitor figures are estimates based on public fee schedules.
                  "Free" brokers often have hidden costs via spreads or payment for order flow (PFOF).
                </p>
              </GlassCard>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">No PFOF</div>
                  <div className="text-slate-400 text-sm">We don't sell your order flow</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">Cost Cap</div>
                  <div className="text-slate-400 text-sm">Guaranteed max execution cost</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">Rebates</div>
                  <div className="text-slate-400 text-sm">Auto-refund if cap exceeded</div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlassBoxPricing;
