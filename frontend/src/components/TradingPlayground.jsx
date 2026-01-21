import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Wallet, TrendingUp, TrendingDown, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, Target, Shield,
  DollarSign, PieChart, History, RotateCcw
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL;

const TradingPlayground = () => {
  const { t } = useTranslation();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTC',
    side: 'buy',
    quantity: 0.01,
    orderType: 'market',
    stopLoss: '',
    takeProfit: ''
  });
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);

  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK'];

  // Fetch or create account
  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      // Try to get existing account or create new one
      const response = await fetch(`${API}/playground/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAccount(data);
      }
    } catch (error) {
      console.error('Error fetching account:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh account data
  const refreshAccount = async () => {
    if (!account?.id) return;
    try {
      const response = await fetch(`${API}/playground/account/${account.id}`);
      if (response.ok) {
        const data = await response.json();
        setAccount(data);
      }
    } catch (error) {
      console.error('Error refreshing account:', error);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!account?.id) return;
    setPlacing(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        account_id: account.id,
        symbol: orderForm.symbol,
        side: orderForm.side,
        order_type: orderForm.orderType,
        quantity: orderForm.quantity.toString()
      });

      if (orderForm.stopLoss) params.append('stop_loss', orderForm.stopLoss);
      if (orderForm.takeProfit) params.append('take_profit', orderForm.takeProfit);

      const response = await fetch(`${API}/playground/order?${params}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Order ${data.order?.status || 'placed'}!` });
        await refreshAccount();
      } else {
        setMessage({ type: 'error', text: data.error || 'Order failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to place order' });
    } finally {
      setPlacing(false);
    }
  };

  // Reset account
  const resetAccount = async () => {
    if (!account?.id) return;
    if (!window.confirm('Reset account to $100,000? All positions will be closed.')) return;

    try {
      const response = await fetch(`${API}/playground/reset/${account.id}?initial_balance=100000`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
        setMessage({ type: 'success', text: 'Account reset successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset account' });
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [account?.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value || 0).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-teal-400" size={32} />
        <span className="ml-3 text-slate-400">Loading playground...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="trading-playground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trading Playground</h2>
          <p className="text-slate-400 text-sm">Practice trading with $100,000 virtual money</p>
        </div>
        <div className="flex items-center gap-2">
          <NeonButton onClick={refreshAccount} variant="white" size="sm">
            <RefreshCw size={16} />
            Refresh
          </NeonButton>
          <NeonButton onClick={resetAccount} variant="danger" size="sm">
            <RotateCcw size={16} />
            Reset Account
          </NeonButton>
        </div>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Wallet size={20} className="text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Cash Balance</p>
              <p className="text-lg font-mono font-bold text-white">
                {formatCurrency(account?.current_balance)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <PieChart size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Equity</p>
              <p className="text-lg font-mono font-bold text-white">
                {formatCurrency(account?.total_equity)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${account?.total_pnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {account?.total_pnl >= 0 ? (
                <TrendingUp size={20} className="text-green-400" />
              ) : (
                <TrendingDown size={20} className="text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Total P&L</p>
              <p className={`text-lg font-mono font-bold ${account?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(account?.total_pnl)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${account?.total_pnl_percent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <DollarSign size={20} className={account?.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Return</p>
              <p className={`text-lg font-mono font-bold ${account?.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(account?.total_pnl_percent)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <GlassCard title="Place Order" icon="📊" accent="cyan" className="lg:col-span-1">
          <div className="space-y-4">
            {/* Symbol Selection */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Symbol</label>
              <div className="flex flex-wrap gap-2">
                {symbols.map(sym => (
                  <button
                    key={sym}
                    onClick={() => setOrderForm(prev => ({ ...prev, symbol: sym }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                      orderForm.symbol === sym
                        ? 'bg-teal-500/30 text-teal-400 border border-teal-500/50'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Side</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    orderForm.side === 'buy'
                      ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <ArrowUpCircle size={18} />
                  BUY
                </button>
                <button
                  onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    orderForm.side === 'sell'
                      ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <ArrowDownCircle size={18} />
                  SELL
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
              <input
                type="number"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white font-mono outline-none focus:border-teal-500/50"
                step="0.01"
                min="0.001"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <Shield size={12} />
                Stop Loss (optional)
              </label>
              <input
                type="number"
                value={orderForm.stopLoss}
                onChange={(e) => setOrderForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                placeholder="Price to cut losses"
                className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-sm outline-none focus:border-red-500/50"
              />
            </div>

            {/* Take Profit */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <Target size={12} />
                Take Profit (optional)
              </label>
              <input
                type="number"
                value={orderForm.takeProfit}
                onChange={(e) => setOrderForm(prev => ({ ...prev, takeProfit: e.target.value }))}
                placeholder="Price to take profit"
                className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-sm outline-none focus:border-green-500/50"
              />
            </div>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <NeonButton 
              onClick={placeOrder} 
              variant={orderForm.side === 'buy' ? 'cyan' : 'danger'}
              size="lg"
              className="w-full"
              disabled={placing}
            >
              {placing ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  {orderForm.side === 'buy' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  {orderForm.side.toUpperCase()} {orderForm.quantity} {orderForm.symbol}
                </>
              )}
            </NeonButton>
          </div>
        </GlassCard>

        {/* Open Positions */}
        <GlassCard title="Open Positions" icon="📈" accent="green" className="lg:col-span-2">
          {account?.positions?.length > 0 ? (
            <div className="space-y-3">
              {account.positions.map((pos, index) => (
                <motion.div
                  key={pos.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-black/40 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {pos.side?.toUpperCase()}
                      </span>
                      <span className="text-white font-bold">{pos.symbol}</span>
                      <span className="text-slate-400 text-sm font-mono">{pos.quantity}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${pos.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(pos.unrealized_pnl)}
                      </p>
                      <p className={`text-xs font-mono ${pos.unrealized_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(pos.unrealized_pnl_percent)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span>Entry: ${pos.entry_price?.toFixed(2)}</span>
                    <span>Current: ${pos.current_price?.toFixed(2)}</span>
                    {pos.stop_loss && <span className="text-red-400">SL: ${pos.stop_loss}</span>}
                    {pos.take_profit && <span className="text-green-400">TP: ${pos.take_profit}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <PieChart size={48} className="mb-4 opacity-50" />
              <p>No open positions</p>
              <p className="text-sm mt-1">Place your first trade!</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Trade History */}
      <GlassCard title="Recent Trades" icon="📜" accent="purple">
        {account?.trade_history?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2 text-right">Quantity</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Value</th>
                  <th className="pb-2 text-right">Fees</th>
                  <th className="pb-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {account.trade_history.slice(-10).reverse().map((trade, index) => (
                  <tr key={trade.id || index} className="border-b border-white/5">
                    <td className="py-2 font-mono text-white">{trade.symbol}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        trade.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono text-slate-300">{trade.quantity}</td>
                    <td className="py-2 text-right font-mono text-slate-300">${trade.price?.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-slate-300">${trade.value?.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-slate-500">${trade.fees?.toFixed(4)}</td>
                    <td className="py-2 text-right text-xs text-slate-500">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <History size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No trades yet</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default TradingPlayground;
