import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, TrendingUp, TrendingDown, RefreshCw, 
  AlertTriangle, Check, X, DollarSign, BarChart3
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

// Paper Trading Context
const PaperTradingContext = createContext(null);

export const usePaperTrading = () => {
  const context = useContext(PaperTradingContext);
  if (!context) {
    throw new Error('usePaperTrading must be used within PaperTradingProvider');
  }
  return context;
};

export const PaperTradingProvider = ({ children, initialBalance = 100000 }) => {
  const [isPaperMode, setIsPaperMode] = useState(true);
  const [balance, setBalance] = useState(initialBalance);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [totalPnL, setTotalPnL] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paperTrading');
    if (saved) {
      const data = JSON.parse(saved);
      setBalance(data.balance || initialBalance);
      setPositions(data.positions || []);
      setTrades(data.trades || []);
      setTotalPnL(data.totalPnL || 0);
    }
  }, [initialBalance]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('paperTrading', JSON.stringify({
      balance,
      positions,
      trades,
      totalPnL
    }));
  }, [balance, positions, trades, totalPnL]);

  const executeTrade = (action, symbol, quantity, price) => {
    const cost = quantity * price;
    const trade = {
      id: Date.now(),
      action,
      symbol,
      quantity,
      price,
      cost,
      timestamp: new Date().toISOString()
    };

    if (action === 'BUY') {
      if (cost > balance) {
        return { success: false, error: 'Insufficient funds' };
      }
      setBalance(prev => prev - cost);
      
      // Update or add position
      setPositions(prev => {
        const existing = prev.find(p => p.symbol === symbol);
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvgPrice = (existing.avgPrice * existing.quantity + price * quantity) / newQty;
          return prev.map(p => p.symbol === symbol 
            ? { ...p, quantity: newQty, avgPrice: newAvgPrice, value: newQty * price }
            : p
          );
        }
        return [...prev, { symbol, quantity, avgPrice: price, value: cost }];
      });
    } else if (action === 'SELL') {
      const position = positions.find(p => p.symbol === symbol);
      if (!position || position.quantity < quantity) {
        return { success: false, error: 'Insufficient position' };
      }
      
      const pnl = (price - position.avgPrice) * quantity;
      setBalance(prev => prev + cost);
      setTotalPnL(prev => prev + pnl);
      
      setPositions(prev => {
        const newQty = position.quantity - quantity;
        if (newQty === 0) {
          return prev.filter(p => p.symbol !== symbol);
        }
        return prev.map(p => p.symbol === symbol 
          ? { ...p, quantity: newQty, value: newQty * price }
          : p
        );
      });
      
      trade.pnl = pnl;
    }

    setTrades(prev => [trade, ...prev].slice(0, 50));
    return { success: true, trade };
  };

  const resetAccount = () => {
    setBalance(initialBalance);
    setPositions([]);
    setTrades([]);
    setTotalPnL(0);
    localStorage.removeItem('paperTrading');
  };

  const value = {
    isPaperMode,
    setIsPaperMode,
    balance,
    positions,
    trades,
    totalPnL,
    executeTrade,
    resetAccount
  };

  return (
    <PaperTradingContext.Provider value={value}>
      {children}
    </PaperTradingContext.Provider>
  );
};

// Paper Trading Panel Component
const PaperTradingPanel = ({ currentPrices = {} }) => {
  const { 
    isPaperMode, setIsPaperMode, balance, positions, trades, 
    totalPnL, executeTrade, resetAccount 
  } = usePaperTrading();

  const [orderSymbol, setOrderSymbol] = useState('BTC');
  const [orderQuantity, setOrderQuantity] = useState(0.1);
  const [orderAction, setOrderAction] = useState('BUY');
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const currentPrice = currentPrices[orderSymbol] || 0;
  const orderValue = orderQuantity * currentPrice;

  const handleTrade = () => {
    const result = executeTrade(orderAction, orderSymbol, orderQuantity, currentPrice);
    setLastResult(result);
    setShowConfirm(false);
    
    // Clear result after 3 seconds
    setTimeout(() => setLastResult(null), 3000);
  };

  const portfolioValue = positions.reduce((acc, p) => {
    const price = currentPrices[p.symbol] || p.avgPrice;
    return acc + (p.quantity * price);
  }, 0);

  const totalValue = balance + portfolioValue;
  const unrealizedPnL = positions.reduce((acc, p) => {
    const price = currentPrices[p.symbol] || p.avgPrice;
    return acc + (price - p.avgPrice) * p.quantity;
  }, 0);

  return (
    <div className="space-y-4" data-testid="paper-trading-panel">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="text-amber-400" size={20} />
          <span className="font-heading font-semibold text-white">Paper Trading</span>
        </div>
        <NeonButton
          onClick={() => setIsPaperMode(!isPaperMode)}
          variant={isPaperMode ? 'teal' : 'ghost'}
          size="sm"
          data-testid="paper-mode-toggle"
        >
          {isPaperMode ? 'Enabled' : 'Disabled'}
        </NeonButton>
      </div>

      {isPaperMode && (
        <>
          {/* Account Summary */}
          <GlassCard accent="teal">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-mono text-slate-500">Cash Balance</p>
                <p className="text-lg font-mono font-bold text-white">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500">Portfolio Value</p>
                <p className="text-lg font-mono font-bold text-white">
                  ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500">Total P&L</p>
                <p className={`text-lg font-mono font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Trade */}
          <GlassCard accent="white">
            <h4 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-teal-400" />
              Quick Trade
            </h4>
            
            <div className="space-y-3">
              {/* Action Toggle */}
              <div className="flex gap-2">
                <NeonButton
                  onClick={() => setOrderAction('BUY')}
                  variant={orderAction === 'BUY' ? 'teal' : 'ghost'}
                  size="sm"
                  className="flex-1"
                >
                  <TrendingUp size={14} />
                  BUY
                </NeonButton>
                <NeonButton
                  onClick={() => setOrderAction('SELL')}
                  variant={orderAction === 'SELL' ? 'rose' : 'ghost'}
                  size="sm"
                  className="flex-1"
                >
                  <TrendingDown size={14} />
                  SELL
                </NeonButton>
              </div>

              {/* Symbol Select */}
              <div className="flex gap-2">
                {['BTC', 'ETH', 'AAPL', 'NVDA'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => setOrderSymbol(sym)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${
                      orderSymbol === sym
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-mono text-slate-500 block mb-1">Quantity</label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-500/50 focus:outline-none"
                  step={orderSymbol === 'BTC' ? 0.01 : orderSymbol === 'ETH' ? 0.1 : 1}
                  min={0}
                />
              </div>

              {/* Order Summary */}
              <div className="p-3 rounded-lg bg-white/5 flex justify-between items-center">
                <span className="text-xs font-mono text-slate-500">Order Value:</span>
                <span className="font-mono font-semibold text-white">
                  ${orderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Execute Button */}
              <NeonButton
                onClick={() => setShowConfirm(true)}
                variant={orderAction === 'BUY' ? 'teal' : 'rose'}
                className="w-full"
                disabled={orderQuantity <= 0 || (orderAction === 'BUY' && orderValue > balance)}
                data-testid="paper-trade-btn"
              >
                {orderAction === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {orderAction} {orderQuantity} {orderSymbol}
              </NeonButton>

              {/* Result Message */}
              <AnimatePresence>
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      lastResult.success 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {lastResult.success ? <Check size={16} /> : <X size={16} />}
                    <span className="text-sm font-mono">
                      {lastResult.success ? 'Trade executed!' : lastResult.error}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          {/* Positions */}
          {positions.length > 0 && (
            <GlassCard accent="white">
              <h4 className="font-heading font-semibold text-white mb-3">Open Positions</h4>
              <div className="space-y-2">
                {positions.map(pos => {
                  const currentP = currentPrices[pos.symbol] || pos.avgPrice;
                  const pnl = (currentP - pos.avgPrice) * pos.quantity;
                  const pnlPercent = ((currentP - pos.avgPrice) / pos.avgPrice) * 100;
                  
                  return (
                    <div key={pos.symbol} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div>
                        <span className="font-mono font-semibold text-white">{pos.symbol}</span>
                        <span className="text-xs text-slate-500 ml-2">x{pos.quantity}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-white text-sm">
                          ${(pos.quantity * currentP).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Reset Button */}
          <NeonButton
            onClick={resetAccount}
            variant="ghost"
            size="sm"
            className="w-full"
            data-testid="reset-paper-account"
          >
            <RefreshCw size={14} />
            Reset Paper Account
          </NeonButton>
        </>
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
              <GlassCard accent={orderAction === 'BUY' ? 'teal' : 'rose'}>
                <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-400" />
                  Confirm Paper Trade
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Action:</span>
                    <span className={orderAction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{orderAction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Symbol:</span>
                    <span className="text-white">{orderSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity:</span>
                    <span className="text-white">{orderQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Price:</span>
                    <span className="text-white">${currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Total:</span>
                    <span className="text-white">${orderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NeonButton onClick={() => setShowConfirm(false)} variant="ghost" className="flex-1">
                    Cancel
                  </NeonButton>
                  <NeonButton onClick={handleTrade} variant={orderAction === 'BUY' ? 'teal' : 'rose'} className="flex-1">
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

export default PaperTradingPanel;
