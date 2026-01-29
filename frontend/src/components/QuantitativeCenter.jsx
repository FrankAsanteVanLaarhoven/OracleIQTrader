import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, 
  Shield, AlertTriangle, Brain, Briefcase, Building2, Globe,
  DollarSign, Target, Percent, ArrowUpRight, ArrowDownRight,
  Layers, Zap, RefreshCw, ChevronRight, FileText, Scale
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QuantitativeCenter = () => {
  const [activeModule, setActiveModule] = useState('macro');
  const [loading, setLoading] = useState(true);
  const [macroData, setMacroData] = useState(null);
  const [inefficiencyData, setInefficiencyData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [institutionalData, setInstitutionalData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [macro, inefficiency, portfolio, ai, institutional] = await Promise.all([
        fetch(`${API}/quant/macro/dalio-principles`).then(r => r.json()).catch(() => null),
        fetch(`${API}/quant/inefficiency/summary`).then(r => r.json()).catch(() => null),
        fetch(`${API}/quant/portfolio/all-weather`).then(r => r.json()).catch(() => null),
        fetch(`${API}/quant/ai/status`).then(r => r.json()).catch(() => null),
        fetch(`${API}/quant/institutional/systemic-risk`).then(r => r.json()).catch(() => null),
      ]);
      
      setMacroData(macro);
      setInefficiencyData(inefficiency);
      setPortfolioData(portfolio);
      setAiStatus(ai);
      setInstitutionalData(institutional);
    } catch (error) {
      console.error('Error fetching quant data:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null) return '0.00%';
    return `${value >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'text-emerald-400',
      moderate: 'text-amber-400',
      elevated: 'text-orange-400',
      high: 'text-red-400',
      critical: 'text-red-600'
    };
    return colors[level] || 'text-slate-400';
  };

  const getRiskBg = (level) => {
    const colors = {
      low: 'bg-emerald-500/20 border-emerald-500/30',
      moderate: 'bg-amber-500/20 border-amber-500/30',
      elevated: 'bg-orange-500/20 border-orange-500/30',
      high: 'bg-red-500/20 border-red-500/30',
      critical: 'bg-red-600/30 border-red-600/40'
    };
    return colors[level] || 'bg-slate-500/20 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="quant-loading">
        <motion.div
          className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quantitative-center">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Scale className="text-teal-400" />
            Bridgewater Quantitative Research
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Ray Dalio's Principles-based Institutional Analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 transition-all disabled:opacity-50"
          data-testid="refresh-quant-btn"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* AI Status Banner */}
      {aiStatus && (
        <div className={`p-3 rounded-lg border ${aiStatus.ai_enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className="flex items-center gap-3">
            <Brain size={20} className={aiStatus.ai_enabled ? 'text-emerald-400' : 'text-amber-400'} />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">
                AI Research Analyst: <span className={aiStatus.ai_enabled ? 'text-emerald-400' : 'text-amber-400'}>{aiStatus.status?.toUpperCase()}</span>
              </p>
              <p className="text-xs text-slate-500">Provider: {aiStatus.provider}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Module Tabs */}
      <Tabs value={activeModule} onValueChange={setActiveModule} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="macro" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400" data-testid="tab-macro">
            <Globe size={14} className="mr-1" /> Macro Engine
          </TabsTrigger>
          <TabsTrigger value="inefficiency" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400" data-testid="tab-inefficiency">
            <Target size={14} className="mr-1" /> Inefficiencies
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400" data-testid="tab-portfolio">
            <PieChart size={14} className="mr-1" /> Portfolio
          </TabsTrigger>
          <TabsTrigger value="institutional" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="tab-institutional">
            <Building2 size={14} className="mr-1" /> Institutional
          </TabsTrigger>
        </TabsList>

        {/* Macro Engine Tab */}
        <TabsContent value="macro" className="mt-6">
          <MacroEnginePanel data={macroData} />
        </TabsContent>

        {/* Inefficiency Detector Tab */}
        <TabsContent value="inefficiency" className="mt-6">
          <InefficiencyPanel data={inefficiencyData} />
        </TabsContent>

        {/* Portfolio Optimizer Tab */}
        <TabsContent value="portfolio" className="mt-6">
          <PortfolioPanel data={portfolioData} />
        </TabsContent>

        {/* Institutional Dashboard Tab */}
        <TabsContent value="institutional" className="mt-6">
          <InstitutionalPanel data={institutionalData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Macro Engine Panel Component
const MacroEnginePanel = ({ data }) => {
  if (!data) return <EmptyState message="Macro data unavailable" />;

  const phase = data.economic_machine_position || {};
  const debtCycle = data.debt_cycle || {};
  const liquidity = data.liquidity_conditions || {};
  const principles = data.principles_applied || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="macro-panel">
      {/* Economic Phase */}
      <GlassCard title="Economic Machine Position" icon="🌍" accent="teal">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <p className="text-xs text-slate-500 mb-1">Current Phase</p>
            <p className="text-lg font-bold text-teal-400 uppercase">{phase.current_phase?.replace(/_/g, ' ') || 'N/A'}</p>
          </div>
          <p className="text-sm text-slate-400">{phase.phase_description}</p>
          
          {phase.recommended_allocation && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Recommended Allocation</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(phase.recommended_allocation).map(([asset, weight]) => (
                  <div key={asset} className="flex items-center justify-between p-2 rounded bg-white/5">
                    <span className="text-xs text-slate-400 capitalize">{asset}</span>
                    <span className="text-sm font-mono text-white">{weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Debt Cycle Analysis */}
      <GlassCard title="Debt Cycle Analysis" icon="📊" accent="amber">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Debt/GDP</p>
              <p className="text-xl font-bold text-amber-400">{debtCycle.debt_to_gdp}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Credit Growth</p>
              <p className="text-xl font-bold text-blue-400">{debtCycle.credit_growth}%</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Deleveraging Risk</span>
              <span className="text-amber-400">{(debtCycle.deleveraging_risk * 100).toFixed(0)}%</span>
            </div>
            <Progress value={debtCycle.deleveraging_risk * 100} className="h-2 bg-white/10" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bubble Indicator</span>
              <span className="text-red-400">{(debtCycle.bubble_indicator * 100).toFixed(0)}%</span>
            </div>
            <Progress value={debtCycle.bubble_indicator * 100} className="h-2 bg-white/10" />
          </div>

          <p className="text-xs text-slate-500 mt-2">{debtCycle.projection}</p>
        </div>
      </GlassCard>

      {/* Global Liquidity */}
      <GlassCard title="Global Liquidity Conditions" icon="💧" accent="blue">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Score</p>
              <p className="text-xl font-bold text-blue-400">{liquidity.liquidity_score}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Trend</p>
              <p className="text-sm font-medium text-white capitalize">{liquidity.trend}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Risk Appetite</p>
              <p className={`text-sm font-medium capitalize ${
                liquidity.risk_appetite === 'risk-on' ? 'text-emerald-400' : 
                liquidity.risk_appetite === 'risk-off' ? 'text-red-400' : 'text-slate-400'
              }`}>{liquidity.risk_appetite?.replace('-', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded bg-white/5">
              <p className="text-xs text-slate-500">CB Assets</p>
              <p className="font-mono text-white">${liquidity.total_central_bank_assets}T</p>
            </div>
            <div className="p-2 rounded bg-white/5">
              <p className="text-xs text-slate-500">M2 Growth</p>
              <p className="font-mono text-white">{liquidity.m2_growth_global}%</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Dalio Principles Applied */}
      <GlassCard title="Ray Dalio's Principles Applied" icon="📖" accent="purple">
        <div className="space-y-3">
          {principles.map((p, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white/5 border-l-2 border-purple-500">
              <p className="text-sm font-medium text-purple-400">{p.principle}</p>
              <p className="text-xs text-slate-400 mt-1">{p.application}</p>
            </div>
          ))}
        </div>
        
        {data.overall_assessment && (
          <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-slate-500 mb-1">Overall Assessment</p>
            <p className="text-sm text-white">{data.overall_assessment}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// Inefficiency Detector Panel Component  
const InefficiencyPanel = ({ data }) => {
  const [signals, setSignals] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const [signalsRes, pairsRes] = await Promise.all([
        fetch(`${API}/quant/inefficiency/signals`).then(r => r.json()),
        fetch(`${API}/quant/inefficiency/pairs`).then(r => r.json()),
      ]);
      setSignals(signalsRes || []);
      setPairs(pairsRes || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!data) return <EmptyState message="Inefficiency data unavailable" />;

  const getStrengthColor = (strength) => {
    if (strength === 'strong') return 'text-emerald-400 bg-emerald-500/20';
    if (strength === 'moderate') return 'text-amber-400 bg-amber-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  return (
    <div className="space-y-6" data-testid="inefficiency-panel">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Signals" value={data.total_signals} icon={Target} color="purple" />
        <StatCard label="Strong Signals" value={data.strong_signals} icon={Zap} color="emerald" />
        <StatCard label="Avg Confidence" value={`${(data.average_confidence * 100).toFixed(0)}%`} icon={BarChart3} color="blue" />
        <StatCard label="Avg Expected Return" value={`${data.average_expected_return?.toFixed(1)}%`} icon={TrendingUp} color="teal" />
      </div>

      {/* Best Opportunity */}
      {data.best_opportunity && (
        <GlassCard title="Best Opportunity" icon="⭐" accent="amber">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${getStrengthColor(data.best_opportunity.strength)}`}>
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-white">{data.best_opportunity.assets?.join(' / ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getStrengthColor(data.best_opportunity.strength)}`}>
                  {data.best_opportunity.strength}
                </span>
              </div>
              <p className="text-sm text-slate-400">{data.best_opportunity.rationale}</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-slate-500">Direction</p>
                  <p className={`text-sm font-medium ${data.best_opportunity.direction?.includes('long') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.best_opportunity.direction?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expected Return</p>
                  <p className="text-sm font-medium text-teal-400">{data.best_opportunity.expected_return}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Risk/Reward</p>
                  <p className="text-sm font-medium text-blue-400">{data.best_opportunity.risk_reward}x</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* All Signals */}
      <GlassCard title="Active Signals" icon="📡" accent="purple">
        {loading ? (
          <div className="text-center py-4 text-slate-500">Loading signals...</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signals.map((signal, idx) => (
              <div key={signal.id || idx} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{signal.assets?.join(' / ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStrengthColor(signal.strength)}`}>
                      {signal.strength}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{signal.signal_type?.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{signal.rationale}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className={signal.direction?.includes('long') ? 'text-emerald-400' : 'text-red-400'}>
                    {signal.direction?.toUpperCase()}
                  </span>
                  <span className="text-slate-500">Conf: {(signal.confidence * 100).toFixed(0)}%</span>
                  <span className="text-teal-400">+{signal.expected_return}%</span>
                  <span className="text-slate-500">{signal.holding_period}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Pairs Trading */}
      {pairs.length > 0 && (
        <GlassCard title="Pairs Trading Opportunities" icon="🔄" accent="blue">
          <div className="space-y-3">
            {pairs.map((pair, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-sm">Long {pair.asset_long}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-red-400 text-sm">Short {pair.asset_short}</span>
                  </div>
                  <span className="text-xs text-slate-500 ml-auto">Correlation: {(pair.correlation * 100).toFixed(0)}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Z-Score</p>
                    <p className="text-white">{pair.spread_zscore}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Half-Life</p>
                    <p className="text-white">{pair.half_life}d</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Confidence</p>
                    <p className="text-teal-400">{(pair.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Cointegration</p>
                    <p className={pair.cointegration_pvalue < 0.05 ? 'text-emerald-400' : 'text-amber-400'}>
                      p={pair.cointegration_pvalue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// Portfolio Optimizer Panel Component
const PortfolioPanel = ({ data }) => {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('all_weather');
  const [riskParity, setRiskParity] = useState(null);
  const [pureAlpha, setPureAlpha] = useState(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const [strategiesRes, riskParityRes, pureAlphaRes] = await Promise.all([
        fetch(`${API}/quant/portfolio/strategies`).then(r => r.json()),
        fetch(`${API}/quant/portfolio/risk-parity`).then(r => r.json()),
        fetch(`${API}/quant/portfolio/pure-alpha`).then(r => r.json()),
      ]);
      setStrategies(strategiesRes?.strategies || []);
      setRiskParity(riskParityRes);
      setPureAlpha(pureAlphaRes);
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return <EmptyState message="Portfolio data unavailable" />;

  const weights = data.weights || {};

  return (
    <div className="space-y-6" data-testid="portfolio-panel">
      {/* All Weather Overview */}
      <GlassCard title={data.strategy || 'All Weather Portfolio'} icon="🌤️" accent="blue">
        <p className="text-sm text-slate-400 mb-4">{data.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Expected Return</p>
            <p className="text-xl font-bold text-emerald-400">{data.expected_annual_return}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Volatility</p>
            <p className="text-xl font-bold text-amber-400">{data.expected_volatility}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Sharpe Ratio</p>
            <p className="text-xl font-bold text-blue-400">{data.sharpe_ratio}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Max Drawdown</p>
            <p className="text-xl font-bold text-red-400">{data.max_historical_drawdown}%</p>
          </div>
        </div>

        {/* Allocation Pie Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-3">Asset Allocation</p>
            <div className="space-y-2">
              {Object.entries(weights).map(([asset, weight]) => (
                <div key={asset} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-slate-400 capitalize">{asset.replace(/_/g, ' ')}</div>
                  <div className="flex-1">
                    <Progress value={weight * 100} className="h-3 bg-white/10" />
                  </div>
                  <div className="w-12 text-right text-sm font-mono text-white">{(weight * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
          
          {data.assets_mapping && (
            <div>
              <p className="text-xs text-slate-500 mb-3">ETF Mapping</p>
              <div className="space-y-2">
                {Object.entries(data.assets_mapping).map(([asset, etfs]) => (
                  <div key={asset} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 capitalize w-24">{asset.replace(/_/g, ' ')}</span>
                    <span className="text-teal-400">{etfs.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Strategy Comparison */}
      {strategies.length > 0 && (
        <GlassCard title="Strategy Comparison" icon="📈" accent="purple">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategies.map((strat) => (
              <div key={strat.type} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                <h4 className="text-white font-medium mb-2">{strat.name}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Level</span>
                    <span className={`capitalize ${
                      strat.risk_level === 'low' ? 'text-emerald-400' : 
                      strat.risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>{strat.risk_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Return</span>
                    <span className="text-teal-400">{strat.expected_return}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volatility</span>
                    <span className="text-amber-400">{strat.expected_volatility}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sharpe</span>
                    <span className="text-blue-400">{strat.sharpe}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">{strat.suitable_for}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Pure Alpha Strategy */}
      {pureAlpha && (
        <GlassCard title="Pure Alpha Strategy" icon="⚡" accent="amber">
          <p className="text-sm text-slate-400 mb-4">{pureAlpha.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Gross Exposure</p>
              <p className="text-lg font-bold text-white">{(pureAlpha.exposure?.gross * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Net Exposure</p>
              <p className="text-lg font-bold text-emerald-400">{(pureAlpha.exposure?.net * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Long</p>
              <p className="text-lg font-bold text-emerald-400">{(pureAlpha.exposure?.long * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500">Short</p>
              <p className="text-lg font-bold text-red-400">{(pureAlpha.exposure?.short * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* Active Signals */}
          <p className="text-xs text-slate-500 mb-2">Current Positions</p>
          <div className="space-y-2">
            {pureAlpha.signals?.map((sig, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <span className={sig.signal === 'long' ? 'text-emerald-400' : 'text-red-400'}>
                    {sig.signal === 'long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </span>
                  <span className="text-white text-sm">{sig.asset}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{sig.alpha_source}</span>
                  <span className={sig.weight >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {sig.weight >= 0 ? '+' : ''}{(sig.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// Institutional Dashboard Panel Component
const InstitutionalPanel = ({ data }) => {
  const [advisory, setAdvisory] = useState(null);
  const [selectedClient, setSelectedClient] = useState('hedge_fund');
  const [loading, setLoading] = useState(false);

  const clientTypes = [
    { id: 'central_bank', label: 'Central Bank', icon: Building2 },
    { id: 'hedge_fund', label: 'Hedge Fund', icon: BarChart3 },
    { id: 'sovereign_wealth', label: 'Sovereign Wealth', icon: Globe },
    { id: 'government', label: 'Government', icon: Briefcase },
    { id: 'bank', label: 'Commercial Bank', icon: DollarSign },
  ];

  useEffect(() => {
    fetchAdvisory(selectedClient);
  }, [selectedClient]);

  const fetchAdvisory = async (clientType) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/quant/institutional/advisory/${clientType}`);
      const data = await res.json();
      setAdvisory(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!data) return <EmptyState message="Institutional data unavailable" />;

  const getRiskIndicatorColor = (status) => {
    const colors = {
      low: 'border-emerald-500 bg-emerald-500/10',
      moderate: 'border-amber-500 bg-amber-500/10',
      elevated: 'border-orange-500 bg-orange-500/10',
      high: 'border-red-500 bg-red-500/10',
      critical: 'border-red-600 bg-red-600/20'
    };
    return colors[status] || 'border-slate-500 bg-slate-500/10';
  };

  return (
    <div className="space-y-6" data-testid="institutional-panel">
      {/* Systemic Risk Dashboard */}
      <GlassCard title="Systemic Risk Dashboard" icon="🛡️" accent="amber">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${getRiskIndicatorColor(data.overall_risk_level)} border-2`}>
              <Shield size={32} className={
                data.overall_risk_level === 'low' ? 'text-emerald-400' :
                data.overall_risk_level === 'moderate' ? 'text-amber-400' :
                data.overall_risk_level === 'elevated' ? 'text-orange-400' : 'text-red-400'
              } />
            </div>
            <div>
              <p className="text-xs text-slate-500">Overall Risk Level</p>
              <p className={`text-2xl font-bold uppercase ${
                data.overall_risk_level === 'low' ? 'text-emerald-400' :
                data.overall_risk_level === 'moderate' ? 'text-amber-400' :
                data.overall_risk_level === 'elevated' ? 'text-orange-400' : 'text-red-400'
              }`}>{data.overall_risk_level}</p>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Aggregate Risk Score</p>
            <p className="text-3xl font-bold text-white">{data.aggregate_risk_score}</p>
            <p className="text-xs text-slate-500">out of 100</p>
          </div>
        </div>

        {/* Risk Indicators Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {data.indicators?.slice(0, 8).map((ind, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${getRiskIndicatorColor(ind.status)}`}>
              <p className="text-xs text-slate-500 truncate">{ind.name}</p>
              <p className="text-lg font-bold text-white">{ind.current_value}</p>
              <div className="flex items-center gap-1 text-xs">
                {ind.trend === 'rising' && <ArrowUpRight size={12} className="text-red-400" />}
                {ind.trend === 'falling' && <ArrowDownRight size={12} className="text-emerald-400" />}
                {ind.trend === 'stable' && <Activity size={12} className="text-slate-400" />}
                <span className="text-slate-500 capitalize">{ind.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Key Concerns */}
        {data.key_concerns?.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle size={14} /> Key Concerns
            </p>
            <ul className="space-y-1">
              {data.key_concerns.map((concern, idx) => (
                <li key={idx} className="text-sm text-slate-400">• {concern}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-white">{data.recommendation}</p>
        </div>
      </GlassCard>

      {/* Client-Specific Advisory */}
      <GlassCard title="Institutional Advisory" icon="📋" accent="purple">
        {/* Client Type Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {clientTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setSelectedClient(ct.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                selectedClient === ct.id
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
              data-testid={`client-type-${ct.id}`}
            >
              <ct.icon size={16} />
              {ct.label}
            </button>
          ))}
        </div>

        {/* Advisory Content */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading advisory...</div>
        ) : advisory ? (
          <AdvisoryContent data={advisory} clientType={selectedClient} />
        ) : (
          <div className="text-center py-8 text-slate-500">Select a client type</div>
        )}
      </GlassCard>
    </div>
  );
};

// Advisory Content Component
const AdvisoryContent = ({ data, clientType }) => {
  if (!data || data.error) {
    return <div className="text-slate-500">Advisory unavailable</div>;
  }

  // Render different content based on client type
  if (clientType === 'hedge_fund' && data.market_regime) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5">
          <p className="text-xs text-slate-500 mb-2">Market Regime</p>
          <p className="text-lg font-medium text-white">{data.market_regime.current}</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {Object.entries(data.market_regime.regime_indicators || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {data.alpha_opportunities && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Alpha Opportunities</p>
            <div className="space-y-2">
              {data.alpha_opportunities.map((opp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5">
                  <span className="text-white text-sm">{opp.opportunity}</span>
                  <span className="text-teal-400 text-xs">Sharpe: {opp.expected_sharpe}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (clientType === 'central_bank' && data.executive_briefing) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5">
          <h4 className="text-white font-medium mb-2">{data.executive_briefing.title}</h4>
          <p className="text-sm text-slate-400">{data.executive_briefing.summary}</p>
        </div>
        
        {data.policy_recommendations && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Policy Recommendations</p>
            <div className="space-y-2">
              {data.policy_recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded bg-white/5 border-l-2 border-teal-500">
                  <p className="text-sm text-white">{rec.recommendation}</p>
                  <p className="text-xs text-slate-500 mt-1">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic fallback for other client types
  return (
    <div className="space-y-4">
      <pre className="text-xs text-slate-400 overflow-auto max-h-96 p-4 rounded bg-white/5">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    teal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.teal}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} />}
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
    <AlertTriangle size={32} className="mb-4" />
    <p>{message}</p>
  </div>
);

export default QuantitativeCenter;
