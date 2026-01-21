import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Send, ArrowDownLeft, ArrowUpRight, Copy, 
  Check, RefreshCw, QrCode, History, Plus, X
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const UserWallet = ({ currentPrices = {} }) => {
  const [walletData, setWalletData] = useState({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD08',
    totalBalance: 0,
    holdings: [
      { symbol: 'BTC', balance: 2.5, network: 'Bitcoin' },
      { symbol: 'ETH', balance: 15.75, network: 'Ethereum' },
      { symbol: 'SOL', balance: 100, network: 'Solana' },
      { symbol: 'USDT', balance: 25000, network: 'Ethereum', isStable: true },
    ],
    transactions: [
      { id: 1, type: 'receive', symbol: 'ETH', amount: 2.5, from: '0x1234...5678', timestamp: '2 hours ago' },
      { id: 2, type: 'send', symbol: 'BTC', amount: 0.5, to: '0x8765...4321', timestamp: '1 day ago' },
      { id: 3, type: 'receive', symbol: 'USDT', amount: 5000, from: '0xabcd...efgh', timestamp: '3 days ago' },
    ]
  });
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendForm, setSendForm] = useState({
    symbol: 'ETH',
    amount: 0,
    address: ''
  });

  // Calculate total balance
  useEffect(() => {
    const total = walletData.holdings.reduce((acc, holding) => {
      const price = holding.isStable ? 1 : (currentPrices[holding.symbol] || 0);
      return acc + (holding.balance * price);
    }, 0);
    setWalletData(prev => ({ ...prev, totalBalance: total }));
  }, [currentPrices, walletData.holdings]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    // Simulate transaction
    setWalletData(prev => ({
      ...prev,
      holdings: prev.holdings.map(h => 
        h.symbol === sendForm.symbol 
          ? { ...h, balance: h.balance - sendForm.amount }
          : h
      ),
      transactions: [{
        id: Date.now(),
        type: 'send',
        symbol: sendForm.symbol,
        amount: sendForm.amount,
        to: sendForm.address.slice(0, 6) + '...' + sendForm.address.slice(-4),
        timestamp: 'Just now'
      }, ...prev.transactions]
    }));
    setShowSend(false);
    setSendForm({ symbol: 'ETH', amount: 0, address: '' });
  };

  return (
    <div className="space-y-4" data-testid="user-wallet-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
          <Wallet className="text-teal-400" size={20} />
          My Wallet
        </h3>
        <StatusBadge variant="active" pulse>Connected</StatusBadge>
      </div>

      {/* Total Balance */}
      <GlassCard accent="teal">
        <div className="text-center">
          <p className="text-xs font-mono text-slate-500 mb-1">Total Balance</p>
          <p className="text-4xl font-mono font-bold text-white">
            ${walletData.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <div 
            className="flex items-center justify-center gap-2 mt-3 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={copyAddress}
          >
            <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
              {walletData.address}
            </span>
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} className="text-slate-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <NeonButton
            onClick={() => setShowSend(true)}
            variant="white"
            className="flex-1"
            data-testid="send-btn"
          >
            <ArrowUpRight size={16} />
            Send
          </NeonButton>
          <NeonButton
            onClick={() => setShowReceive(true)}
            variant="teal"
            className="flex-1"
            data-testid="receive-btn"
          >
            <ArrowDownLeft size={16} />
            Receive
          </NeonButton>
        </div>
      </GlassCard>

      {/* Holdings */}
      <GlassCard accent="white">
        <h4 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
          <Plus size={16} className="text-indigo-400" />
          Holdings
        </h4>
        <div className="space-y-2">
          {walletData.holdings.map(holding => {
            const price = holding.isStable ? 1 : (currentPrices[holding.symbol] || 0);
            const value = holding.balance * price;
            return (
              <div
                key={holding.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 flex items-center justify-center font-mono font-bold text-teal-400">
                    {holding.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-white">{holding.symbol}</p>
                    <p className="text-xs text-slate-500">{holding.network}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-white">{holding.balance}</p>
                  <p className="text-xs text-slate-500">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Transactions */}
      <GlassCard accent="white">
        <h4 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
          <History size={16} className="text-amber-400" />
          Recent Transactions
        </h4>
        <div className="space-y-2">
          {walletData.transactions.map(tx => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'receive' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {tx.type === 'receive' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <p className="text-sm text-white">
                    {tx.type === 'receive' ? 'Received' : 'Sent'} {tx.symbol}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tx.type === 'receive' ? `From: ${tx.from}` : `To: ${tx.to}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono ${tx.type === 'receive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                </p>
                <p className="text-xs text-slate-500">{tx.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Send Modal */}
      {showSend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSend(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <GlassCard accent="rose">
              <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowUpRight className="text-rose-400" />
                Send Crypto
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-2">Asset</label>
                  <div className="flex gap-2 flex-wrap">
                    {walletData.holdings.map(h => (
                      <button
                        key={h.symbol}
                        onClick={() => setSendForm(prev => ({ ...prev, symbol: h.symbol }))}
                        className={`px-3 py-2 rounded-lg text-xs font-mono ${
                          sendForm.symbol === h.symbol
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        {h.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-2">Amount</label>
                  <input
                    type="number"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                    placeholder="0.00"
                    min={0}
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={sendForm.address}
                    onChange={(e) => setSendForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                <div className="flex gap-3">
                  <NeonButton onClick={() => setShowSend(false)} variant="ghost" className="flex-1">
                    Cancel
                  </NeonButton>
                  <NeonButton onClick={handleSend} variant="rose" className="flex-1" data-testid="confirm-send-btn">
                    <Send size={16} />
                    Send
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Receive Modal */}
      {showReceive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowReceive(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <GlassCard accent="teal">
              <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowDownLeft className="text-teal-400" />
                Receive Crypto
              </h3>

              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-xl p-3">
                  <div className="w-full h-full bg-black/90 rounded-lg flex items-center justify-center">
                    <QrCode size={80} className="text-white" />
                  </div>
                </div>

                <div 
                  className="p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={copyAddress}
                >
                  <p className="text-xs text-slate-500 mb-1">Your Address</p>
                  <p className="text-sm font-mono text-white break-all">{walletData.address}</p>
                </div>

                <NeonButton onClick={copyAddress} variant="teal" className="w-full">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserWallet;
