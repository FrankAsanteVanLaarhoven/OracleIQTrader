import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Zap, Brain, TrendingUp, TrendingDown, Shield, Target,
  Sliders, Play, Pause, Trash2, Plus, MessageCircle, BarChart3,
  Settings, Sparkles, RefreshCw, ChevronRight, Check, X, Send
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AgentBuilder = () => {
  const [activeTab, setActiveTab] = useState('my-agents');
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // New agent form state
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    avatar_emoji: '🤖',
    strategy: 'momentum',
    custom_prompt: '',
    risk_tolerance: 50,
    position_size_pct: 10,
    stop_loss_pct: 5,
    take_profit_pct: 15,
    entry_confidence_threshold: 70,
    max_daily_trades: 10,
    allowed_assets: ['BTC', 'ETH', 'SOL'],
    auto_trade: false,
    paper_trading: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsRes, templatesRes] = await Promise.all([
        fetch(`${API}/agents?user_id=demo_user`).then(r => r.json()),
        fetch(`${API}/agents/templates`).then(r => r.json())
      ]);
      setAgents(agentsRes || []);
      setTemplates(templatesRes || {});
    } catch (e) {
      console.error('Error loading agents:', e);
    }
    setLoading(false);
  };

  const createAgent = async () => {
    try {
      const res = await fetch(`${API}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAgent, user_id: 'demo_user' })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setShowBuilder(false);
        setNewAgent({
          name: '',
          description: '',
          avatar_emoji: '🤖',
          strategy: 'momentum',
          custom_prompt: '',
          risk_tolerance: 50,
          position_size_pct: 10,
          stop_loss_pct: 5,
          take_profit_pct: 15,
          entry_confidence_threshold: 70,
          max_daily_trades: 10,
          allowed_assets: ['BTC', 'ETH', 'SOL'],
          auto_trade: false,
          paper_trading: true
        });
      }
    } catch (e) {
      console.error('Error creating agent:', e);
    }
  };

  const createFromTemplate = async (templateId) => {
    try {
      const res = await fetch(`${API}/agents/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo_user', template_id: templateId })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setActiveTab('my-agents');
      }
    } catch (e) {
      console.error('Error creating from template:', e);
    }
  };

  const toggleAgent = async (agentId, currentStatus) => {
    const endpoint = currentStatus === 'active' ? 'pause' : 'activate';
    try {
      await fetch(`${API}/agents/${agentId}/${endpoint}`, { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error('Error toggling agent:', e);
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('Delete this agent?')) return;
    try {
      await fetch(`${API}/agents/${agentId}`, { method: 'DELETE' });
      await loadData();
      if (selectedAgent?.agent_id === agentId) setSelectedAgent(null);
    } catch (e) {
      console.error('Error deleting agent:', e);
    }
  };

  const analyzeMarket = async (agentId) => {
    try {
      // Get current market data
      const pricesRes = await fetch(`${API}/market/prices`).then(r => r.json());
      const btcData = pricesRes.find(p => p.symbol === 'BTC') || {};
      
      const res = await fetch(`${API}/agents/${agentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTC',
          price: btcData.price,
          change_percent: btcData.change_percent,
          volume: btcData.volume,
          rsi: 45 + Math.random() * 20 // Simulated RSI
        })
      });
      const data = await res.json();
      if (data.success && data.decision) {
        // Add decision to chat
        setChatMessages(prev => [...prev, {
          type: 'decision',
          ...data.decision
        }]);
      }
    } catch (e) {
      console.error('Error analyzing market:', e);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedAgent) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    
    try {
      const res = await fetch(`${API}/agents/${selectedAgent.agent_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { type: 'agent', ...data }]);
    } catch (e) {
      console.error('Error chatting:', e);
    }
  };

  const getStrategyColor = (strategy) => {
    const colors = {
      momentum: 'text-orange-400 bg-orange-500/20',
      mean_reversion: 'text-blue-400 bg-blue-500/20',
      trend_following: 'text-green-400 bg-green-500/20',
      contrarian: 'text-red-400 bg-red-500/20',
      sentiment_based: 'text-purple-400 bg-purple-500/20',
      technical_analysis: 'text-cyan-400 bg-cyan-500/20',
      hybrid: 'text-amber-400 bg-amber-500/20',
      custom: 'text-teal-400 bg-teal-500/20'
    };
    return colors[strategy] || colors.custom;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-emerald-400 bg-emerald-500/20',
      idle: 'text-slate-400 bg-slate-500/20',
      paused: 'text-amber-400 bg-amber-500/20',
      error: 'text-red-400 bg-red-500/20'
    };
    return colors[status] || colors.idle;
  };

  return (
    <div className="space-y-6" data-testid="agent-builder">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="text-purple-400" />
            AI Trading Agents
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Create • Customize • Deploy Autonomous Trading Agents
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="bg-purple-500 hover:bg-purple-600">
          <Plus size={16} className="mr-2" /> Create Agent
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="my-agents" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Bot size={14} className="mr-1" /> My Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Sparkles size={14} className="mr-1" /> Templates
          </TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <MessageCircle size={14} className="mr-1" /> Agent Chat
          </TabsTrigger>
        </TabsList>

        {/* My Agents Tab */}
        <TabsContent value="my-agents" className="mt-6">
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Bot size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No agents yet. Create one or use a template!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.div
                  key={agent.agent_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{agent.avatar_emoji}</span>
                      <div>
                        <h3 className="font-bold text-white">{agent.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStrategyColor(agent.strategy)}`}>
                          {agent.strategy?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{agent.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                    <div className="p-2 rounded bg-white/5">
                      <div className="text-slate-500">Risk</div>
                      <div className="text-white font-bold">{agent.risk_tolerance}%</div>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <div className="text-slate-500">Position</div>
                      <div className="text-white font-bold">{agent.position_size_pct}%</div>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <div className="text-slate-500">Confidence</div>
                      <div className="text-white font-bold">{agent.entry_confidence_threshold}%</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => toggleAgent(agent.agent_id, agent.status)}
                      className={agent.status === 'active' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}
                    >
                      {agent.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setSelectedAgent(agent); setActiveTab('chat'); }}
                      className="bg-purple-500/20 text-purple-400"
                    >
                      <MessageCircle size={14} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => analyzeMarket(agent.agent_id)}
                      className="bg-teal-500/20 text-teal-400"
                    >
                      <BarChart3 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => deleteAgent(agent.agent_id)}
                      className="bg-red-500/20 text-red-400 ml-auto"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(templates).map(([id, template]) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{template.avatar_emoji}</span>
                  <div>
                    <h3 className="font-bold text-white">{template.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStrategyColor(template.strategy)}`}>
                      {template.strategy?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4">{template.description}</p>
                <div className="text-xs text-slate-500 mb-4 p-3 rounded bg-white/5 italic">
                  "{template.custom_prompt?.substring(0, 100)}..."
                </div>
                <Button onClick={() => createFromTemplate(id)} className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                  <Plus size={14} className="mr-2" /> Use Template
                </Button>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Agent Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400">Select Agent</h3>
              {agents.map((agent) => (
                <button
                  key={agent.agent_id}
                  onClick={() => { setSelectedAgent(agent); setChatMessages([]); }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedAgent?.agent_id === agent.agent_id
                      ? 'bg-purple-500/20 border-purple-500/30 border'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.avatar_emoji}</span>
                    <div>
                      <div className="text-white text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.strategy?.replace('_', ' ')}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <GlassCard title={selectedAgent ? `Chat with ${selectedAgent.name}` : "Select an Agent"} icon={selectedAgent?.avatar_emoji || "💬"} accent="purple">
                <div className="h-80 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      msg.type === 'user' ? 'bg-teal-500/20 ml-12' :
                      msg.type === 'decision' ? 'bg-amber-500/20' :
                      'bg-white/5 mr-12'
                    }`}>
                      {msg.type === 'user' && (
                        <p className="text-sm text-white">{msg.message}</p>
                      )}
                      {msg.type === 'agent' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{msg.avatar}</span>
                            <span className="text-xs text-slate-400">{msg.agent_name}</span>
                          </div>
                          <p className="text-sm text-white">{msg.response}</p>
                        </>
                      )}
                      {msg.type === 'decision' && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold ${
                              msg.action === 'buy' ? 'text-emerald-400' :
                              msg.action === 'sell' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {msg.action?.toUpperCase()} Signal
                            </span>
                            <span className="text-xs text-amber-400">Confidence: {msg.confidence}%</span>
                          </div>
                          <p className="text-sm text-white">{msg.reasoning}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {chatMessages.length === 0 && selectedAgent && (
                    <p className="text-slate-500 text-center py-8">Start chatting with {selectedAgent.name}!</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Ask about strategy, market analysis..."
                    className="bg-white/5 border-white/10"
                    disabled={!selectedAgent}
                  />
                  <Button onClick={sendChat} disabled={!selectedAgent} className="bg-purple-500">
                    <Send size={16} />
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Builder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBuilder(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-purple-400" /> Create AI Agent
                </h2>
                <button onClick={() => setShowBuilder(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Agent Name</label>
                    <Input
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      placeholder="My Trading Agent"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Avatar</label>
                    <div className="flex gap-2">
                      {['🤖', '🧠', '🚀', '🦊', '📊', '⚡'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewAgent({ ...newAgent, avatar_emoji: emoji })}
                          className={`text-2xl p-2 rounded-lg ${
                            newAgent.avatar_emoji === emoji ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Description</label>
                  <Input
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    placeholder="What does this agent do?"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Strategy */}
                <div>
                  <label className="text-xs text-slate-500 block mb-2">Strategy</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['momentum', 'mean_reversion', 'trend_following', 'contrarian', 'sentiment_based', 'technical_analysis'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setNewAgent({ ...newAgent, strategy: s })}
                        className={`p-2 rounded-lg text-xs transition-all ${
                          newAgent.strategy === s
                            ? getStrategyColor(s) + ' border border-current'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Custom Strategy Prompt</label>
                  <textarea
                    value={newAgent.custom_prompt}
                    onChange={(e) => setNewAgent({ ...newAgent, custom_prompt: e.target.value })}
                    placeholder="Describe how you want the agent to trade in natural language..."
                    className="w-full h-20 p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm resize-none"
                  />
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500">Risk Tolerance</span>
                      <span className="text-white font-bold">{newAgent.risk_tolerance}%</span>
                    </div>
                    <Slider
                      value={[newAgent.risk_tolerance]}
                      onValueChange={([v]) => setNewAgent({ ...newAgent, risk_tolerance: v })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>Conservative</span>
                      <span>Aggressive</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500">Position Size</span>
                      <span className="text-white font-bold">{newAgent.position_size_pct}% per trade</span>
                    </div>
                    <Slider
                      value={[newAgent.position_size_pct]}
                      onValueChange={([v]) => setNewAgent({ ...newAgent, position_size_pct: v })}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500">Entry Confidence Threshold</span>
                      <span className="text-white font-bold">{newAgent.entry_confidence_threshold}%</span>
                    </div>
                    <Slider
                      value={[newAgent.entry_confidence_threshold]}
                      onValueChange={([v]) => setNewAgent({ ...newAgent, entry_confidence_threshold: v })}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Stop Loss</span>
                        <span className="text-red-400 font-bold">{newAgent.stop_loss_pct}%</span>
                      </div>
                      <Slider
                        value={[newAgent.stop_loss_pct]}
                        onValueChange={([v]) => setNewAgent({ ...newAgent, stop_loss_pct: v })}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Take Profit</span>
                        <span className="text-emerald-400 font-bold">{newAgent.take_profit_pct}%</span>
                      </div>
                      <Slider
                        value={[newAgent.take_profit_pct]}
                        onValueChange={([v]) => setNewAgent({ ...newAgent, take_profit_pct: v })}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Assets */}
                <div>
                  <label className="text-xs text-slate-500 block mb-2">Allowed Assets</label>
                  <div className="flex flex-wrap gap-2">
                    {['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK'].map((asset) => (
                      <button
                        key={asset}
                        onClick={() => {
                          const assets = newAgent.allowed_assets.includes(asset)
                            ? newAgent.allowed_assets.filter(a => a !== asset)
                            : [...newAgent.allowed_assets, asset];
                          setNewAgent({ ...newAgent, allowed_assets: assets });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-all ${
                          newAgent.allowed_assets.includes(asset)
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {asset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.paper_trading}
                      onChange={(e) => setNewAgent({ ...newAgent, paper_trading: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-400">Paper Trading (Simulated)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.auto_trade}
                      onChange={(e) => setNewAgent({ ...newAgent, auto_trade: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-400">Auto Trade</span>
                  </label>
                </div>

                <Button onClick={createAgent} className="w-full bg-purple-500 hover:bg-purple-600" disabled={!newAgent.name}>
                  <Sparkles size={16} className="mr-2" /> Create Agent
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentBuilder;
