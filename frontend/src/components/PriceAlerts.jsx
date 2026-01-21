import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellRing, Plus, Trash2, TrendingUp, TrendingDown, 
  Volume2, VolumeX, Check, X, AlertTriangle
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const PriceAlerts = ({ currentPrices = {} }) => {
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // New alert form
  const [newAlert, setNewAlert] = useState({
    symbol: 'BTC',
    condition: 'above',
    price: 100000,
    enabled: true
  });

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('priceAlerts');
    if (saved) {
      setAlerts(JSON.parse(saved));
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts against current prices
  useEffect(() => {
    alerts.forEach(alert => {
      if (!alert.enabled) return;
      
      const currentPrice = currentPrices[alert.symbol];
      if (!currentPrice) return;

      const isTriggered = alert.condition === 'above' 
        ? currentPrice >= alert.price
        : currentPrice <= alert.price;

      if (isTriggered && !triggeredAlerts.includes(alert.id)) {
        // Trigger alert
        setTriggeredAlerts(prev => [...prev, alert.id]);
        
        // Play sound
        if (soundEnabled) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWwsLGOb5+vhSwoOTIzf');
          audio.play().catch(() => {});
        }

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Price Alert: ${alert.symbol}`, {
            body: `${alert.symbol} is now ${alert.condition} $${alert.price.toLocaleString()}`,
            icon: '/favicon.ico'
          });
        }
      }
    });
  }, [currentPrices, alerts, triggeredAlerts, soundEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addAlert = () => {
    const alert = {
      ...newAlert,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [...prev, alert]);
    setShowAddAlert(false);
    setNewAlert({ symbol: 'BTC', condition: 'above', price: 100000, enabled: true });
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setTriggeredAlerts(prev => prev.filter(aid => aid !== id));
  };

  const toggleAlert = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const dismissTriggered = (id) => {
    setTriggeredAlerts(prev => prev.filter(aid => aid !== id));
  };

  const symbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA', 'SPY'];

  return (
    <div className="space-y-4" data-testid="price-alerts-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="text-amber-400" size={20} />
          Price Alerts
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'text-teal-400 bg-teal-500/10' : 'text-slate-500 bg-white/5'
            }`}
            data-testid="toggle-alert-sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <NeonButton
            onClick={() => setShowAddAlert(true)}
            variant="teal"
            size="sm"
            data-testid="add-alert-btn"
          >
            <Plus size={14} />
            Add Alert
          </NeonButton>
        </div>
      </div>

      {/* Triggered Alerts */}
      <AnimatePresence>
        {alerts.filter(a => triggeredAlerts.includes(a.id)).map(alert => (
          <motion.div
            key={`triggered-${alert.id}`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="text-amber-400 animate-pulse" size={20} />
                <div>
                  <p className="font-mono font-semibold text-amber-400">
                    {alert.symbol} Alert Triggered!
                  </p>
                  <p className="text-xs text-slate-400">
                    Price {alert.condition} ${alert.price.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissTriggered(alert.id)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Active Alerts List */}
      <GlassCard accent="white">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-mono">No alerts set</p>
            <p className="text-xs">Click "Add Alert" to create one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  alert.enabled ? 'bg-white/5' : 'bg-white/2 opacity-50'
                } ${triggeredAlerts.includes(alert.id) ? 'ring-1 ring-amber-500/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      alert.enabled 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'bg-white/5 text-slate-600'
                    }`}
                  >
                    {alert.enabled ? <Check size={14} /> : <X size={14} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white">{alert.symbol}</span>
                      <StatusBadge variant={alert.condition === 'above' ? 'success' : 'danger'}>
                        {alert.condition === 'above' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {alert.condition}
                      </StatusBadge>
                    </div>
                    <p className="text-xs font-mono text-slate-500">
                      ${alert.price.toLocaleString()}
                      {currentPrices[alert.symbol] && (
                        <span className="ml-2 text-slate-600">
                          (now: ${currentPrices[alert.symbol].toLocaleString()})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  data-testid={`delete-alert-${alert.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Add Alert Modal */}
      <AnimatePresence>
        {showAddAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <GlassCard accent="teal">
                <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="text-teal-400" />
                  New Price Alert
                </h3>

                <div className="space-y-4">
                  {/* Symbol */}
                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">Symbol</label>
                    <div className="flex gap-2 flex-wrap">
                      {symbols.map(sym => (
                        <button
                          key={sym}
                          onClick={() => setNewAlert(prev => ({ ...prev, symbol: sym }))}
                          className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                            newAlert.symbol === sym
                              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">Condition</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewAlert(prev => ({ ...prev, condition: 'above' }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                          newAlert.condition === 'above'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        <TrendingUp size={14} />
                        Above
                      </button>
                      <button
                        onClick={() => setNewAlert(prev => ({ ...prev, condition: 'below' }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                          newAlert.condition === 'below'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        <TrendingDown size={14} />
                        Below
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-xs font-mono text-slate-500 block mb-2">Target Price (USD)</label>
                    <input
                      type="number"
                      value={newAlert.price}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-teal-500/50 focus:outline-none"
                      min={0}
                      step={newAlert.symbol === 'BTC' ? 1000 : newAlert.symbol === 'ETH' ? 100 : 1}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <NeonButton onClick={() => setShowAddAlert(false)} variant="ghost" className="flex-1">
                      Cancel
                    </NeonButton>
                    <NeonButton onClick={addAlert} variant="teal" className="flex-1" data-testid="confirm-add-alert">
                      <Check size={16} />
                      Create Alert
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceAlerts;
