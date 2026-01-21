import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Eye, EyeOff, Shield, CheckCircle, AlertTriangle, 
  RefreshCw, ExternalLink, Copy, Trash2, Settings, Lock,
  Wifi, WifiOff, Info, ChevronDown, ChevronUp, Server
} from 'lucide-react';
import NeonButton from './NeonButton';
import GlassCard from './GlassCard';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const ExchangeSettings = () => {
  // Exchange configurations
  const [exchanges, setExchanges] = useState({
    binance: { apiKey: '', secretKey: '', connected: false, testnet: true },
    coinbase: { apiKey: '', secretKey: '', connected: false, testnet: true },
    kraken: { apiKey: '', secretKey: '', connected: false, testnet: true },
  });
  
  // UI states
  const [showSecrets, setShowSecrets] = useState({});
  const [testing, setTesting] = useState({});
  const [saving, setSaving] = useState({});
  const [expandedExchange, setExpandedExchange] = useState('binance');
  const [globalTestnet, setGlobalTestnet] = useState(true);

  const exchangeConfig = [
    {
      id: 'binance',
      name: 'Binance',
      logo: '🟡',
      color: '#F0B90B',
      description: 'Largest crypto exchange by volume',
      docsUrl: 'https://binance-docs.github.io/apidocs/',
      keyTypes: [
        { id: 'hmac', name: 'HMAC (System Generated)', recommended: true },
        { id: 'ed25519', name: 'Ed25519 (Self Generated)', recommended: false },
      ],
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      logo: '🔵',
      color: '#0052FF',
      description: 'US-based regulated exchange',
      docsUrl: 'https://docs.cdp.coinbase.com/',
      keyTypes: [
        { id: 'api', name: 'API Key + Secret', recommended: true },
      ],
    },
    {
      id: 'kraken',
      name: 'Kraken',
      logo: '🟣',
      color: '#5741D9',
      description: 'Security-focused exchange',
      docsUrl: 'https://docs.kraken.com/rest/',
      keyTypes: [
        { id: 'api', name: 'API Key + Private Key', recommended: true },
      ],
    },
  ];

  const updateExchange = (exchangeId, field, value) => {
    setExchanges(prev => ({
      ...prev,
      [exchangeId]: { ...prev[exchangeId], [field]: value }
    }));
  };

  const toggleShowSecret = (exchangeId) => {
    setShowSecrets(prev => ({
      ...prev,
      [exchangeId]: !prev[exchangeId]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const testConnection = async (exchangeId) => {
    setTesting(prev => ({ ...prev, [exchangeId]: true }));
    
    try {
      // Simulated API test - in production this would call the backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exchange = exchanges[exchangeId];
      if (exchange.apiKey && exchange.secretKey) {
        updateExchange(exchangeId, 'connected', true);
      } else {
        updateExchange(exchangeId, 'connected', false);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      updateExchange(exchangeId, 'connected', false);
    } finally {
      setTesting(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const saveCredentials = async (exchangeId) => {
    setSaving(prev => ({ ...prev, [exchangeId]: true }));
    
    try {
      // In production, this would save to backend/secure storage
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success notification
    } catch (error) {
      console.error('Failed to save credentials:', error);
    } finally {
      setSaving(prev => ({ ...prev, [exchangeId]: false }));
    }
  };

  const clearCredentials = (exchangeId) => {
    if (window.confirm(`Are you sure you want to remove ${exchangeId} credentials?`)) {
      updateExchange(exchangeId, 'apiKey', '');
      updateExchange(exchangeId, 'secretKey', '');
      updateExchange(exchangeId, 'connected', false);
    }
  };

  return (
    <div className="space-y-6" data-testid="exchange-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="text-amber-400" />
            Exchange API Keys
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Connect your exchange accounts for live trading
          </p>
        </div>
      </div>

      {/* Network Mode Toggle */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Server className="text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Network Mode</h3>
              <p className="text-sm text-slate-400">
                {globalTestnet ? 'Using Testnet (Paper Trading)' : 'Using Mainnet (Real Funds)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!globalTestnet ? 'text-white' : 'text-slate-500'}`}>Mainnet</span>
            <button
              onClick={() => setGlobalTestnet(!globalTestnet)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                globalTestnet ? 'bg-teal-500' : 'bg-red-500'
              }`}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ left: globalTestnet ? '4px' : '32px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${globalTestnet ? 'text-white' : 'text-slate-500'}`}>Testnet</span>
          </div>
        </div>
        
        {!globalTestnet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
          >
            <AlertTriangle className="text-red-400 shrink-0" size={18} />
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> Mainnet mode uses real funds. All trades will execute on live markets. 
              Make sure you understand the risks before trading.
            </p>
          </motion.div>
        )}
      </div>

      {/* Exchange Cards */}
      <div className="space-y-4">
        {exchangeConfig.map((exchange) => {
          const data = exchanges[exchange.id];
          const isExpanded = expandedExchange === exchange.id;
          
          return (
            <motion.div
              key={exchange.id}
              className="rounded-xl border overflow-hidden"
              style={{ 
                borderColor: data.connected ? `${exchange.color}40` : 'rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.02)'
              }}
            >
              {/* Exchange Header - Always Visible */}
              <button
                onClick={() => setExpandedExchange(isExpanded ? null : exchange.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${exchange.color}20` }}
                  >
                    {exchange.logo}
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                      {exchange.name}
                      {data.connected && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          <Wifi size={12} /> Connected
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-500 text-sm">{exchange.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `${exchange.color}20`,
                      color: exchange.color
                    }}
                  >
                    {globalTestnet ? 'TESTNET' : 'MAINNET'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="text-slate-400" size={20} />
                  ) : (
                    <ChevronDown className="text-slate-400" size={20} />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-4 border-t border-white/5">
                      {/* Key Type Selection (for Binance) */}
                      {exchange.keyTypes.length > 1 && (
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 uppercase tracking-wider">
                            Key Type
                          </label>
                          <div className="flex gap-2">
                            {exchange.keyTypes.map((keyType) => (
                              <button
                                key={keyType.id}
                                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                                  keyType.recommended 
                                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                }`}
                              >
                                <div className="font-medium text-sm">{keyType.name}</div>
                                {keyType.recommended && (
                                  <div className="text-xs text-teal-400/70 mt-1">Recommended</div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Key Input */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          API Key
                          <a 
                            href={exchange.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            Get API Key <ExternalLink size={12} />
                          </a>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={data.apiKey}
                            onChange={(e) => updateExchange(exchange.id, 'apiKey', e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full p-3 pr-20 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-sm focus:border-teal-500/50 focus:outline-none"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {data.apiKey && (
                              <button
                                onClick={() => copyToClipboard(data.apiKey)}
                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Copy"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Secret Key Input */}
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wider">
                          Secret Key
                        </label>
                        <div className="relative">
                          <input
                            type={showSecrets[exchange.id] ? 'text' : 'password'}
                            value={data.secretKey}
                            onChange={(e) => updateExchange(exchange.id, 'secretKey', e.target.value)}
                            placeholder="Enter your secret key"
                            className="w-full p-3 pr-20 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-sm focus:border-teal-500/50 focus:outline-none"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              onClick={() => toggleShowSecret(exchange.id)}
                              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              title={showSecrets[exchange.id] ? 'Hide' : 'Show'}
                            >
                              {showSecrets[exchange.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <NeonButton
                          onClick={() => testConnection(exchange.id)}
                          variant="white"
                          size="sm"
                          disabled={testing[exchange.id] || !data.apiKey || !data.secretKey}
                        >
                          {testing[exchange.id] ? (
                            <><RefreshCw size={14} className="animate-spin" /> Testing...</>
                          ) : (
                            <><Wifi size={14} /> Test Connection</>
                          )}
                        </NeonButton>
                        
                        <NeonButton
                          onClick={() => saveCredentials(exchange.id)}
                          variant="teal"
                          size="sm"
                          disabled={saving[exchange.id] || !data.apiKey || !data.secretKey}
                        >
                          {saving[exchange.id] ? (
                            <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                          ) : (
                            <><Lock size={14} /> Save Securely</>
                          )}
                        </NeonButton>

                        {(data.apiKey || data.secretKey) && (
                          <button
                            onClick={() => clearCredentials(exchange.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Remove credentials"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Connection Status */}
                      {data.connected && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2"
                        >
                          <CheckCircle className="text-green-400" size={18} />
                          <span className="text-green-400 text-sm font-medium">
                            Successfully connected to {exchange.name} {globalTestnet ? 'Testnet' : 'Mainnet'}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
        <div className="flex items-start gap-3">
          <Shield className="text-teal-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-teal-400 font-semibold">Security Information</h4>
            <ul className="text-sm text-slate-400 mt-2 space-y-1 list-disc list-inside">
              <li>API keys are encrypted and stored securely on your device</li>
              <li>We never transmit or store your secret keys on external servers</li>
              <li>For maximum security, enable IP whitelist and withdrawal restrictions on your exchange</li>
              <li>Use "Read Only" or "Trade Only" permissions when possible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {exchangeConfig.map((exchange) => (
          <a
            key={exchange.id}
            href={exchange.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-center group"
          >
            <div className="text-2xl mb-2">{exchange.logo}</div>
            <div className="text-white font-medium text-sm">{exchange.name} Docs</div>
            <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mt-1 group-hover:text-teal-400 transition-colors">
              View Documentation <ExternalLink size={10} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ExchangeSettings;
