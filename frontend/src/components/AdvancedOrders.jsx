import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, TrendingUp, TrendingDown, DollarSign, Target,
  AlertTriangle, Check, X, Clock, Percent
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const AdvancedOrders = ({ currentPrices = {}, onExecuteOrder }) => {
  const [orderType, setOrderType] = useState('limit'); // limit, stop-loss, take-profit, trailing-stop
  const [side, setSide] = useState('BUY');
  const [symbol, setSymbol] = useState('BTC');
  const [quantity, setQuantity] = useState(0.1);
  const [limitPrice, setLimitPrice] = useState(0);
  const [stopPrice, setStopPrice] = useState(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState(0);
  const [trailingPercent, setTrailingPercent] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);

  const currentPrice = currentPrices[symbol] || 0;
  const symbols = ['BTC', 'ETH', 'AAPL', 'NVDA', 'SPY'];

  const orderTypes = [
    { id: 'limit', label: 'Limit', icon: Target, desc: 'Execute at specific price' },
    { id: 'stop-loss', label: 'Stop Loss', icon: AlertTriangle, desc: 'Sell when price drops to' },
    { id: 'take-profit', label: 'Take Profit', icon: TrendingUp, desc: 'Sell when price rises to' },
    { id: 'trailing-stop', label: 'Trailing Stop', icon: Percent, desc: 'Dynamic stop loss' },
  ];

  // Auto-set reasonable defaults when symbol changes
  React.useEffect(() => {
    if (currentPrice > 0) {
      setLimitPrice(Math.round(currentPrice * (side === 'BUY' ? 0.98 : 1.02)));
      setStopPrice(Math.round(currentPrice * 0.95));
      setTakeProfitPrice(Math.round(currentPrice * 1.10));
    }
  }, [currentPrice, symbol, side]);

  const createOrder = () => {
    const order = {
      id: Date.now(),
      type: orderType,
      side,
      symbol,
      quantity,
      limitPrice: orderType === 'limit' ? limitPrice : null,
      stopPrice: ['stop-loss', 'trailing-stop'].includes(orderType) ? stopPrice : null,
      takeProfitPrice: orderType === 'take-profit' ? takeProfitPrice : null,
      trailingPercent: orderType === 'trailing-stop' ? trailingPercent : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      currentPrice
    };

    setPendingOrders(prev => [...prev, order]);
    setShowConfirm(false);

    if (onExecuteOrder) {
      onExecuteOrder(order);
    }
  };

  const cancelOrder = (id) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id));
  };

  const getOrderValue = () => {
    const price = orderType === 'limit' ? limitPrice : currentPrice;
    return quantity * price;
  };

  return (
    <div className="space-y-4" data-testid="advanced-orders-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="text-indigo-400" size={20} />
          Advanced Orders
        </h3>
        <StatusBadge variant="info">
          <Clock size={10} />
          {pendingOrders.length} pending
        </StatusBadge>
      </div>

      {/* Order Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {orderTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setOrderType(type.id)}
            className={`p-3 rounded-xl text-left transition-all ${
              orderType === type.id
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
            }`}
            data-testid={`order-type-${type.id}`}
          >
            <type.icon size={18} className="mb-1" />
            <p className="font-mono text-sm font-semibold">{type.label}</p>
            <p className="text-xs opacity-60">{type.desc}</p>
          </button>
        ))}
      </div>

      {/* Order Form */}
      <GlassCard accent="indigo">
        <div className="space-y-4">
          {/* Side Selection */}
          <div className="flex gap-2">
            <NeonButton
              onClick={() => setSide('BUY')}
              variant={side === 'BUY' ? 'teal' : 'ghost'}
              className="flex-1"
            >
              <TrendingUp size={16} />
              BUY
            </NeonButton>
            <NeonButton
              onClick={() => setSide('SELL')}
              variant={side === 'SELL' ? 'rose' : 'ghost'}
              className="flex-1"
            >
              <TrendingDown size={16} />
              SELL
            </NeonButton>
          </div>

          {/* Symbol Selection */}
          <div>
            <label className="text-xs font-mono text-slate-500 block mb-2">Symbol</label>
            <div className="flex gap-2 flex-wrap">
              {symbols.map(sym => (
                <button
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                    symbol === sym
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            {currentPrice > 0 && (
              <p className="text-xs font-mono text-slate-500 mt-1">
                Current: ${currentPrice.toLocaleString()}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-mono text-slate-500 block mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-indigo-500/50 focus:outline-none"
              step={symbol === 'BTC' ? 0.01 : symbol === 'ETH' ? 0.1 : 1}
              min={0}
            />
          </div>

          {/* Limit Price (for limit orders) */}
          {orderType === 'limit' && (
            <div>
              <label className="text-xs font-mono text-slate-500 block mb-2">
                Limit Price (USD)
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                min={0}
              />
              <p className="text-xs font-mono text-slate-600 mt-1">
                {side === 'BUY' ? 'Order executes when price drops to' : 'Order executes when price rises to'} this level
              </p>
            </div>
          )}

          {/* Stop Price (for stop-loss) */}
          {orderType === 'stop-loss' && (
            <div>
              <label className="text-xs font-mono text-slate-500 block mb-2">
                Stop Price (USD)
              </label>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                min={0}
              />
              <p className="text-xs font-mono text-rose-400/60 mt-1">
                ⚠️ Position will be sold if price drops to ${stopPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Take Profit Price */}
          {orderType === 'take-profit' && (
            <div>
              <label className="text-xs font-mono text-slate-500 block mb-2">
                Take Profit Price (USD)
              </label>
              <input
                type="number"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-indigo-500/50 focus:outline-none"
                min={0}
              />
              <p className="text-xs font-mono text-emerald-400/60 mt-1">
                ✓ Position will be sold if price rises to ${takeProfitPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Trailing Stop Percent */}
          {orderType === 'trailing-stop' && (
            <div>
              <label className="text-xs font-mono text-slate-500 block mb-2">
                Trailing Stop (%)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  value={trailingPercent}
                  onChange={(e) => setTrailingPercent(Number(e.target.value))}
                  className="flex-1"
                  min={1}
                  max={20}
                  step={0.5}
                />
                <span className="font-mono text-white w-16 text-right">{trailingPercent}%</span>
              </div>
              <p className="text-xs font-mono text-amber-400/60 mt-1">
                Stop price will trail {trailingPercent}% below highest price
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Order Value:</span>
              <span className="font-mono font-semibold text-white">
                ${getOrderValue().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <NeonButton
            onClick={() => setShowConfirm(true)}
            variant={side === 'BUY' ? 'teal' : 'rose'}
            className="w-full"
            data-testid="place-order-btn"
          >
            <Layers size={16} />
            Place {orderType.replace('-', ' ').toUpperCase()} Order
          </NeonButton>
        </div>
      </GlassCard>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <GlassCard accent="white">
          <h4 className="font-heading font-semibold text-white mb-3">Pending Orders</h4>
          <div className="space-y-2">
            {pendingOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={order.side === 'BUY' ? 'success' : 'danger'}>
                      {order.side}
                    </StatusBadge>
                    <span className="font-mono font-semibold text-white">{order.symbol}</span>
                    <span className="text-xs text-slate-500">x{order.quantity}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    {order.type}: {order.limitPrice && `@ $${order.limitPrice.toLocaleString()}`}
                    {order.stopPrice && `Stop @ $${order.stopPrice.toLocaleString()}`}
                    {order.takeProfitPrice && `TP @ $${order.takeProfitPrice.toLocaleString()}`}
                    {order.trailingPercent && `Trailing ${order.trailingPercent}%`}
                  </p>
                </div>
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <GlassCard accent={side === 'BUY' ? 'teal' : 'rose'}>
                <h3 className="font-heading text-lg font-bold text-white mb-4">
                  Confirm {orderType.replace('-', ' ')} Order
                </h3>
                
                <div className="space-y-2 mb-4 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Side:</span>
                    <span className={side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{side}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Symbol:</span>
                    <span className="text-white">{symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity:</span>
                    <span className="text-white">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-white">{orderType}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Est. Value:</span>
                    <span className="text-white">${getOrderValue().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NeonButton onClick={() => setShowConfirm(false)} variant="ghost" className="flex-1">
                    Cancel
                  </NeonButton>
                  <NeonButton onClick={createOrder} variant={side === 'BUY' ? 'teal' : 'rose'} className="flex-1">
                    <Check size={16} />
                    Confirm
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedOrders;
