import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Receipt, Clock, TrendingUp, TrendingDown, Download, Filter,
  CheckCircle, AlertCircle, Zap, BarChart2, DollarSign, Eye
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExecutionAuditTrail = () => {
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Generate sample execution receipts
    generateSampleReceipts();
  }, []);

  const generateSampleReceipts = async () => {
    setLoading(true);
    try {
      // Generate a few sample receipts
      const samples = [
        { asset: 'BTC', side: 'buy', quantity: 0.5, fill_price: 45123.45, nbbo_bid: 45100, nbbo_ask: 45150 },
        { asset: 'ETH', side: 'sell', quantity: 2.0, fill_price: 2456.78, nbbo_bid: 2450, nbbo_ask: 2465 },
        { asset: 'AAPL', side: 'buy', quantity: 100, fill_price: 189.23, nbbo_bid: 189.10, nbbo_ask: 189.35 },
        { asset: 'TSLA', side: 'buy', quantity: 50, fill_price: 245.67, nbbo_bid: 245.50, nbbo_ask: 246.00 },
        { asset: 'SOL', side: 'sell', quantity: 25, fill_price: 98.45, nbbo_bid: 98.30, nbbo_ask: 98.60 },
      ];

      const generatedReceipts = await Promise.all(
        samples.map(async (sample) => {
          const res = await fetch(`${API}/pricing/execution-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...sample,
              order_id: `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              asset_class: ['BTC', 'ETH', 'SOL'].includes(sample.asset) ? 'crypto' : 'equity',
              venue: ['Binance', 'Coinbase', 'NYSE', 'NASDAQ'][Math.floor(Math.random() * 4)],
              latency_ms: 5 + Math.random() * 20,
              tier: 'pro'
            })
          });
          return await res.json();
        })
      );

      setReceipts(generatedReceipts);
    } catch (e) {
      console.error('Error generating receipts:', e);
    }
    setLoading(false);
  };

  const formatPrice = (price) => `$${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBps = (bps) => bps !== undefined ? `${bps.toFixed(1)} bps` : 'N/A';

  const exportToCSV = () => {
    const headers = ['Receipt ID', 'Timestamp', 'Asset', 'Side', 'Quantity', 'Fill Price', 'NBBO Bid', 'NBBO Ask', 'Price Improvement', 'Venue', 'Latency (ms)', 'Total Fees (bps)', 'Total Fees ($)'];
    const rows = receipts.map(r => [
      r.receipt_id,
      r.timestamp,
      r.asset,
      r.side,
      r.quantity,
      r.fill_price,
      r.nbbo_bid,
      r.nbbo_ask,
      r.price_improvement?.toFixed(4),
      r.execution_venue,
      r.latency_ms?.toFixed(2),
      r.total_fees_bps?.toFixed(2),
      r.total_fees_usd?.toFixed(2)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution_receipts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredReceipts = filter === 'all' 
    ? receipts 
    : receipts.filter(r => r.side === filter);

  return (
    <div className="space-y-6" data-testid="execution-audit-trail">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="text-blue-400" />
            Execution Audit Trail
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Every trade, fully transparent • NBBO comparison • Latency metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="all">All Trades</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
          </select>
          <Button onClick={exportToCSV} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          <Button onClick={generateSampleReceipts} className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30" disabled={loading}>
            <Zap size={16} className="mr-2" /> {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trades', value: receipts.length, icon: BarChart2, color: 'text-blue-400' },
          { label: 'Avg Latency', value: `${(receipts.reduce((a, r) => a + (r.latency_ms || 0), 0) / (receipts.length || 1)).toFixed(1)}ms`, icon: Clock, color: 'text-amber-400' },
          { label: 'Avg Fees', value: formatBps(receipts.reduce((a, r) => a + (r.total_fees_bps || 0), 0) / (receipts.length || 1)), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Price Improvement', value: `${receipts.filter(r => r.price_improvement > 0).length}/${receipts.length}`, icon: TrendingUp, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Receipts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Receipt List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400">Recent Executions</h3>
          {filteredReceipts.map((receipt, i) => (
            <motion.div
              key={receipt.receipt_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedReceipt(receipt)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedReceipt?.receipt_id === receipt.receipt_id
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    receipt.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {receipt.side?.toUpperCase()}
                  </span>
                  <span className="text-white font-medium">{receipt.asset}</span>
                  <span className="text-slate-500 text-sm">×{receipt.quantity}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{receipt.receipt_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  Fill: <span className="text-white">{formatPrice(receipt.fill_price)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">{receipt.latency_ms?.toFixed(1)}ms</span>
                  {receipt.price_improvement > 0 ? (
                    <span className="text-emerald-400 flex items-center text-xs">
                      <TrendingUp size={12} className="mr-1" />
                      +{formatPrice(receipt.price_improvement)}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">No improvement</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Receipt Detail */}
        <div>
          {selectedReceipt ? (
            <GlassCard title={`Receipt ${selectedReceipt.receipt_id}`} icon="🧾" accent="blue">
              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-white/5">
                  <div>
                    <div className="text-xs text-slate-500">Asset</div>
                    <div className="text-white font-bold">{selectedReceipt.asset}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Side</div>
                    <div className={`font-bold ${selectedReceipt.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedReceipt.side?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Quantity</div>
                    <div className="text-white">{selectedReceipt.quantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Venue</div>
                    <div className="text-white">{selectedReceipt.execution_venue}</div>
                  </div>
                </div>

                {/* NBBO Comparison */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">NBBO Comparison</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-500">Best Bid</div>
                      <div className="text-white font-mono">{formatPrice(selectedReceipt.nbbo_bid)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Your Fill</div>
                      <div className="text-teal-400 font-mono font-bold">{formatPrice(selectedReceipt.fill_price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Best Ask</div>
                      <div className="text-white font-mono">{formatPrice(selectedReceipt.nbbo_ask)}</div>
                    </div>
                  </div>
                  {selectedReceipt.price_improvement > 0 && (
                    <div className="mt-3 text-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                        <CheckCircle size={12} className="inline mr-1" />
                        Price Improvement: {formatPrice(selectedReceipt.price_improvement)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fee Breakdown */}
                <div>
                  <div className="text-sm font-medium text-white mb-2">Fee Breakdown</div>
                  {selectedReceipt.fees?.map((fee, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm text-slate-400">{fee.description}</span>
                      <div className="text-right">
                        <div className="text-white font-mono text-sm">{formatBps(fee.amount_bps)}</div>
                        <div className="text-xs text-slate-500">{formatPrice(fee.amount_usd)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-white font-medium">Total Cost</span>
                    <div className="text-right">
                      <div className="text-teal-400 font-bold">{formatBps(selectedReceipt.total_fees_bps)}</div>
                      <div className="text-sm text-slate-400">{formatPrice(selectedReceipt.total_fees_usd)}</div>
                    </div>
                  </div>
                </div>

                {/* Execution Quality */}
                <div className="p-4 rounded-lg bg-white/5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Latency</div>
                    <div className="text-white font-mono">{selectedReceipt.latency_ms?.toFixed(2)}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Timestamp</div>
                    <div className="text-white text-xs font-mono">
                      {new Date(selectedReceipt.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Competitor Savings */}
                {selectedReceipt.savings_vs_competitors && (
                  <div>
                    <div className="text-sm font-medium text-white mb-2">You Saved vs Competitors</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedReceipt.savings_vs_competitors).map(([comp, savings]) => (
                        <div key={comp} className="flex justify-between items-center p-2 rounded bg-white/5">
                          <span className="text-xs text-slate-400">{comp}</span>
                          <span className={`text-xs font-mono ${savings > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {savings > 0 ? `+${formatBps(savings)}` : formatBps(savings)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-white/5 rounded-xl border border-white/10">
              <div className="text-center">
                <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a trade to view execution details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionAuditTrail;
