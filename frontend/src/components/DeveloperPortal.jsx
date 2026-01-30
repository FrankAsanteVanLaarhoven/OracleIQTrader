import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Code, Webhook, BarChart3, Copy, Check, Eye, EyeOff, 
  Plus, Trash2, RefreshCw, ExternalLink, Play, Clock, 
  AlertCircle, CheckCircle, Terminal, BookOpen
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState('keys');
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [testResult, setTestResult] = useState(null);

  // New API Key form
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: 'read',
    rateLimit: 60
  });

  // New Webhook form
  const [newWebhookForm, setNewWebhookForm] = useState({
    url: '',
    events: ['trade_executed'],
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simulated API keys data
      setApiKeys([
        {
          id: 'key_1',
          name: 'Production Bot',
          key: 'oiq_live_k8j2m4n6p0q2r4t6v8x0z2b4d6f8h0j2',
          permissions: 'full',
          rateLimit: 300,
          created: '2026-01-15T10:00:00Z',
          lastUsed: '2026-01-30T14:23:00Z',
          requestsToday: 1247,
          status: 'active'
        },
        {
          id: 'key_2',
          name: 'Analytics Dashboard',
          key: 'oiq_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          permissions: 'read',
          rateLimit: 60,
          created: '2026-01-20T15:30:00Z',
          lastUsed: '2026-01-30T12:45:00Z',
          requestsToday: 342,
          status: 'active'
        }
      ]);

      setWebhooks([
        {
          id: 'wh_1',
          url: 'https://myapp.com/webhooks/oracleiq',
          events: ['trade_executed', 'order_filled'],
          active: true,
          lastDelivery: '2026-01-30T14:20:00Z',
          successRate: 98.5
        }
      ]);

      setUsageStats({
        totalRequests: {
          today: 1589,
          week: 8432,
          month: 34521
        },
        byEndpoint: [
          { endpoint: '/market/prices', calls: 12453, avgLatency: 45 },
          { endpoint: '/orders', calls: 3421, avgLatency: 120 },
          { endpoint: '/portfolio/positions', calls: 2341, avgLatency: 85 },
          { endpoint: '/agents', calls: 1234, avgLatency: 95 },
        ],
        errors: {
          rate: 0.3,
          common: [
            { code: 429, message: 'Rate Limited', count: 23 },
            { code: 400, message: 'Invalid Parameters', count: 12 },
          ]
        },
        rateLimitUsage: 45 // percentage
      });
    } catch (e) {
      console.error('Error loading developer data:', e);
    }
    setLoading(false);
  };

  const generateApiKey = () => {
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyForm.name || 'Untitled Key',
      key: `oiq_live_${Math.random().toString(36).substring(2, 34)}`,
      permissions: newKeyForm.permissions,
      rateLimit: newKeyForm.rateLimit,
      created: new Date().toISOString(),
      lastUsed: null,
      requestsToday: 0,
      status: 'active'
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyForm({ name: '', permissions: 'read', rateLimit: 60 });
  };

  const revokeApiKey = (keyId) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key) => {
    return key.substring(0, 12) + '••••••••••••••••••••';
  };

  const addWebhook = () => {
    const newWebhook = {
      id: `wh_${Date.now()}`,
      url: newWebhookForm.url,
      events: newWebhookForm.events,
      active: true,
      lastDelivery: null,
      successRate: 100
    };
    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookForm({ url: '', events: ['trade_executed'], active: true });
  };

  const deleteWebhook = (whId) => {
    setWebhooks(webhooks.filter(w => w.id !== whId));
  };

  const testEndpoint = async (endpoint) => {
    setTestResult({ loading: true, endpoint });
    try {
      const response = await fetch(`${API}${endpoint}`);
      const data = await response.json();
      setTestResult({
        endpoint,
        status: response.status,
        success: response.ok,
        data: JSON.stringify(data, null, 2),
        latency: Math.round(Math.random() * 100 + 50)
      });
    } catch (e) {
      setTestResult({
        endpoint,
        status: 500,
        success: false,
        error: e.message
      });
    }
  };

  const codeSnippets = {
    python: `from oracleiq import OracleIQClient

client = OracleIQClient(api_key="YOUR_API_KEY")

# Get market prices
prices = client.market.get_prices(["BTC", "ETH"])
print(prices)

# Place an order
order = client.orders.create(
    symbol="BTC",
    side="buy",
    type="limit",
    quantity=0.5,
    price=45000.00
)
print(f"Order ID: {order.id}")`,
    
    javascript: `import { OracleIQClient } from '@oracleiq/sdk';

const client = new OracleIQClient({ 
  apiKey: 'YOUR_API_KEY' 
});

// Get market prices
const prices = await client.market.getPrices(['BTC', 'ETH']);
console.log(prices);

// Place an order
const order = await client.orders.create({
  symbol: 'BTC',
  side: 'buy',
  type: 'limit',
  quantity: 0.5,
  price: 45000.00
});
console.log('Order ID:', order.id);`,

    curl: `# Get market prices
curl -X GET "https://api.oracleiqtrader.com/api/market/prices?symbols=BTC,ETH" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Place an order
curl -X POST "https://api.oracleiqtrader.com/api/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "symbol": "BTC",
    "side": "buy",
    "type": "limit",
    "quantity": 0.5,
    "price": 45000.00
  }'`
  };

  const [selectedLang, setSelectedLang] = useState('python');

  return (
    <div className="space-y-6" data-testid="developer-portal">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Code className="text-cyan-400" />
            Developer Portal
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            API Keys • Documentation • Webhooks • Usage Analytics
          </p>
        </div>
        <a 
          href="/docs/api" 
          target="_blank"
          className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center gap-2"
        >
          <BookOpen size={16} /> Full API Docs <ExternalLink size={14} />
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="keys" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Key size={14} className="mr-1" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <Terminal size={14} className="mr-1" /> Quick Start
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Webhook size={14} className="mr-1" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <BarChart3 size={14} className="mr-1" /> Usage
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Create New Key */}
            <GlassCard title="Create API Key" icon="🔑" accent="cyan">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKeyForm.name}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                    placeholder="My Trading Bot"
                    className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Permissions</label>
                  <select
                    value={newKeyForm.permissions}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, permissions: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="read">Read Only (market data, portfolio)</option>
                    <option value="trading">Trading (+ place orders)</option>
                    <option value="full">Full Access (+ withdrawals)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Rate Limit (requests/min)</label>
                  <select
                    value={newKeyForm.rateLimit}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, rateLimit: parseInt(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="60">60/min (Free)</option>
                    <option value="300">300/min (Pro)</option>
                    <option value="1000">1000/min (Enterprise)</option>
                  </select>
                </div>

                <Button onClick={generateApiKey} className="w-full bg-cyan-500 hover:bg-cyan-600">
                  <Plus size={16} className="mr-2" /> Generate Key
                </Button>
              </div>
            </GlassCard>

            {/* Existing Keys */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-400">Your API Keys</h3>
              {apiKeys.map((key) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Key className="text-cyan-400" size={18} />
                      <span className="text-white font-medium">{key.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        key.permissions === 'full' ? 'bg-red-500/20 text-red-400' :
                        key.permissions === 'trading' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {key.permissions}
                      </span>
                    </div>
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 font-mono text-sm mb-3">
                    <span className="text-slate-400 flex-1 overflow-hidden">
                      {showKeys[key.id] ? key.key : maskKey(key.key)}
                    </span>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      className="p-1.5 rounded hover:bg-white/10 transition-all"
                    >
                      {showKeys[key.id] ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.key, key.id)}
                      className="p-1.5 rounded hover:bg-white/10 transition-all"
                    >
                      {copiedKey === key.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Rate Limit</span>
                      <div className="text-white">{key.rateLimit}/min</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Requests Today</span>
                      <div className="text-white">{key.requestsToday.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Used</span>
                      <div className="text-white">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Quick Start / Docs Tab */}
        <TabsContent value="docs" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Code Snippets */}
            <GlassCard title="Quick Start" icon="💻" accent="blue">
              <div className="flex gap-2 mb-4">
                {['python', 'javascript', 'curl'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedLang === lang
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/50 text-sm overflow-x-auto font-mono text-slate-300 max-h-80">
                  {codeSnippets[selectedLang]}
                </pre>
                <button
                  onClick={() => copyToClipboard(codeSnippets[selectedLang], 'code')}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                  {copiedKey === 'code' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                </button>
              </div>
            </GlassCard>

            {/* Endpoint Tester */}
            <GlassCard title="Test Endpoints" icon="🧪" accent="purple">
              <div className="space-y-3">
                {[
                  { path: '/market/prices?symbols=BTC,ETH', method: 'GET' },
                  { path: '/pricing/fee-schedule', method: 'GET' },
                  { path: '/agents/templates', method: 'GET' },
                  { path: '/notifications/stats', method: 'GET' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">{endpoint.method}</span>
                      <span className="text-sm text-slate-300 font-mono">{endpoint.path}</span>
                    </div>
                    <button
                      onClick={() => testEndpoint(endpoint.path)}
                      className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                    >
                      <Play size={14} />
                    </button>
                  </div>
                ))}

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-slate-300">{testResult.endpoint}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${testResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {testResult.status}
                        </span>
                        {testResult.latency && (
                          <span className="text-xs text-slate-500">{testResult.latency}ms</span>
                        )}
                      </div>
                    </div>
                    {testResult.data && (
                      <pre className="text-xs text-slate-400 overflow-x-auto max-h-32">{testResult.data.substring(0, 500)}...</pre>
                    )}
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Add Webhook */}
            <GlassCard title="Add Webhook" icon="🔗" accent="purple">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Endpoint URL</label>
                  <input
                    type="url"
                    value={newWebhookForm.url}
                    onChange={(e) => setNewWebhookForm({ ...newWebhookForm, url: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                    className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Events</label>
                  <div className="space-y-2">
                    {['trade_executed', 'order_filled', 'order_cancelled', 'price_alert', 'copy_trade'].map((event) => (
                      <label key={event} className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={newWebhookForm.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookForm({ ...newWebhookForm, events: [...newWebhookForm.events, event] });
                            } else {
                              setNewWebhookForm({ ...newWebhookForm, events: newWebhookForm.events.filter(ev => ev !== event) });
                            }
                          }}
                          className="rounded border-white/20"
                        />
                        {event.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={addWebhook} className="w-full bg-purple-500 hover:bg-purple-600" disabled={!newWebhookForm.url}>
                  <Plus size={16} className="mr-2" /> Add Webhook
                </Button>
              </div>
            </GlassCard>

            {/* Webhook List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-400">Your Webhooks</h3>
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Webhook className="text-purple-400" size={18} />
                      <span className={`w-2 h-2 rounded-full ${wh.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span className="text-white font-mono text-sm truncate max-w-xs">{wh.url}</span>
                    </div>
                    <button
                      onClick={() => deleteWebhook(wh.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {wh.events.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                        {ev}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Success Rate</span>
                      <div className="text-emerald-400">{wh.successRate}%</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Delivery</span>
                      <div className="text-white">{wh.lastDelivery ? new Date(wh.lastDelivery).toLocaleString() : 'Never'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          {usageStats && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-500 mb-1">Today</div>
                  <div className="text-2xl font-bold text-white">{usageStats.totalRequests.today.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">requests</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-500 mb-1">This Week</div>
                  <div className="text-2xl font-bold text-white">{usageStats.totalRequests.week.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">requests</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-500 mb-1">This Month</div>
                  <div className="text-2xl font-bold text-white">{usageStats.totalRequests.month.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">requests</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-500 mb-1">Error Rate</div>
                  <div className="text-2xl font-bold text-emerald-400">{usageStats.errors.rate}%</div>
                  <div className="text-xs text-slate-500">last 24h</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Endpoint Usage */}
                <GlassCard title="Top Endpoints" icon="📊" accent="amber">
                  <div className="space-y-3">
                    {usageStats.byEndpoint.map((ep, i) => (
                      <div key={ep.endpoint} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <span className="text-white font-mono text-sm">{ep.endpoint}</span>
                          <div className="text-xs text-slate-500">{ep.calls.toLocaleString()} calls</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 text-sm">{ep.avgLatency}ms</div>
                          <div className="text-xs text-slate-500">avg latency</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Rate Limit Status */}
                <GlassCard title="Rate Limit Status" icon="⚡" accent="cyan">
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-white/10 relative mb-4">
                      <div
                        className="absolute inset-2 rounded-full"
                        style={{
                          background: `conic-gradient(#14b8a6 ${usageStats.rateLimitUsage * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                        }}
                      />
                      <div className="absolute inset-4 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold text-white">{usageStats.rateLimitUsage}%</span>
                        <span className="text-xs text-slate-500">used</span>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {Math.round(300 * usageStats.rateLimitUsage / 100)}/300 requests this minute
                    </div>
                  </div>

                  {/* Common Errors */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm font-medium text-white mb-3">Recent Errors</div>
                    {usageStats.errors.common.map((err) => (
                      <div key={err.code} className="flex items-center justify-between p-2 rounded bg-white/5 mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-red-400" />
                          <span className="text-sm text-slate-300">{err.code} - {err.message}</span>
                        </div>
                        <span className="text-xs text-slate-500">{err.count}x</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperPortal;
