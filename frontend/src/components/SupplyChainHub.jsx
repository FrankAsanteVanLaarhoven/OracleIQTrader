import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ship, Factory, AlertTriangle, Globe, TrendingUp, TrendingDown,
  Package, Truck, MapPin, BarChart3, Shield, Zap, Clock,
  DollarSign, Activity, ChevronRight, Search, RefreshCw, Bell, Plus, Trash2, Check, X
} from 'lucide-react';
import GlassCard from './GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SupplyChainHub = () => {
  const [activeTab, setActiveTab] = useState('control-tower');
  const [controlTower, setControlTower] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ports, setPorts] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [geoRisk, setGeoRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Alert state
  const [alerts, setAlerts] = useState([]);
  const [alertPresets, setAlertPresets] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alert_type: 'port_congestion',
    target_entity: '',
    entity_name: '',
    condition: 'above',
    threshold: 80,
    priority: 'medium'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [towerRes, marketsRes, suppliersRes, portsRes, instrumentsRes, geoRes] = await Promise.all([
          fetch(`${API}/supply-chain/control-tower`).then(r => r.json()),
          fetch(`${API}/supply-chain/markets`).then(r => r.json()),
          fetch(`${API}/supply-chain/suppliers`).then(r => r.json()),
          fetch(`${API}/supply-chain/ports`).then(r => r.json()),
          fetch(`${API}/supply-chain/instruments`).then(r => r.json()),
          fetch(`${API}/supply-chain/geopolitical-risk`).then(r => r.json()),
        ]);
        
        setControlTower(towerRes);
        setMarkets(marketsRes || []);
        setSuppliers(suppliersRes || []);
        setPorts(portsRes || []);
        setInstruments(instrumentsRes || []);
        setGeoRisk(geoRes);
        
        // Load alert data
        await loadAlertData();
      } catch (error) {
        console.error('Error fetching supply chain data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const loadAlertData = async () => {
    try {
      const [alertsRes, presetsRes, historyRes, statsRes] = await Promise.all([
        fetch(`${API}/supply-chain/alerts?user_id=demo_user`).then(r => r.json()),
        fetch(`${API}/supply-chain/alerts/presets`).then(r => r.json()),
        fetch(`${API}/supply-chain/alerts/history?user_id=demo_user`).then(r => r.json()),
        fetch(`${API}/supply-chain/alerts/stats`).then(r => r.json()),
      ]);
      setAlerts(alertsRes || []);
      setAlertPresets(presetsRes || []);
      setAlertHistory(historyRes || []);
      setAlertStats(statsRes);
    } catch (error) {
      console.error('Error loading alert data:', error);
    }
  };

  const handleCreateAlert = async () => {
    try {
      const res = await fetch(`${API}/supply-chain/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAlert, user_id: 'demo_user' })
      });
      const data = await res.json();
      if (data.success) {
        await loadAlertData();
        setShowCreateAlert(false);
        setNewAlert({
          alert_type: 'port_congestion',
          target_entity: '',
          entity_name: '',
          condition: 'above',
          threshold: 80,
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await fetch(`${API}/supply-chain/alerts/${alertId}`, { method: 'DELETE' });
      await loadAlertData();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alertId, enabled) => {
    try {
      await fetch(`${API}/supply-chain/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      await loadAlertData();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleQuickSetup = async (preset) => {
    // Find a relevant entity based on alert type
    let targetEntity = '';
    let entityName = '';
    
    if (preset.alert_type === 'port_congestion' && ports.length > 0) {
      targetEntity = ports[0].port_id;
      entityName = ports[0].name;
    } else if (preset.alert_type === 'supplier_risk' && suppliers.length > 0) {
      targetEntity = suppliers[0].supplier_id;
      entityName = suppliers[0].name;
    } else if (preset.alert_type === 'geopolitical_risk') {
      targetEntity = 'global';
      entityName = 'Global Risk Index';
    } else if (preset.alert_type === 'market_event' && markets.length > 0) {
      targetEntity = markets[0].market_id;
      entityName = markets[0].title?.substring(0, 30) + '...';
    }
    
    try {
      const res = await fetch(`${API}/supply-chain/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user',
          alert_type: preset.alert_type,
          target_entity: targetEntity,
          entity_name: entityName,
          condition: preset.condition,
          threshold: preset.threshold,
          priority: preset.priority
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadAlertData();
      }
    } catch (error) {
      console.error('Error creating preset alert:', error);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API}/supply-chain/alerts/check`, { method: 'POST' });
      const data = await res.json();
      await loadAlertData();
      if (data.alerts_triggered > 0) {
        alert(`${data.alerts_triggered} alert(s) triggered!`);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const towerRes = await fetch(`${API}/supply-chain/control-tower`).then(r => r.json());
    setControlTower(towerRes);
    setRefreshing(false);
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'text-emerald-400',
      moderate: 'text-amber-400',
      elevated: 'text-orange-400',
      high: 'text-red-400',
      critical: 'text-red-600'
    };
    return colors[level?.toLowerCase()] || 'text-slate-400';
  };

  const getRiskBg = (level) => {
    const colors = {
      low: 'bg-emerald-500/20 border-emerald-500/30',
      moderate: 'bg-amber-500/20 border-amber-500/30',
      elevated: 'bg-orange-500/20 border-orange-500/30',
      high: 'bg-red-500/20 border-red-500/30',
      critical: 'bg-red-600/30 border-red-600/40'
    };
    return colors[level?.toLowerCase()] || 'bg-slate-500/20 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="supply-chain-loading">
        <motion.div
          className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="supply-chain-hub">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Ship className="text-teal-400" />
            Supply Chain Command Center
          </h2>
          <p className="text-slate-500 text-sm font-mono mt-1">
            Trade • Monitor • Hedge Supply Chain Risk
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="border-teal-500/30 text-teal-400">
          <RefreshCw size={16} className={refreshing ? 'animate-spin mr-2' : 'mr-2'} />
          Refresh
        </Button>
      </div>

      {/* Geopolitical Risk Banner */}
      {geoRisk && (
        <div className={`p-4 rounded-xl border ${getRiskBg(geoRisk.level)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe size={24} className={getRiskColor(geoRisk.level)} />
              <div>
                <p className="text-xs text-slate-500">Geopolitical Risk Index</p>
                <p className={`text-2xl font-bold ${getRiskColor(geoRisk.level)}`}>{geoRisk.index}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${getRiskBg(geoRisk.level)}`}>
              <p className={`text-lg font-bold ${getRiskColor(geoRisk.level)}`}>{geoRisk.level}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="control-tower" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Activity size={14} className="mr-1" /> Control Tower
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            <Bell size={14} className="mr-1" /> Alerts {alerts.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/30 text-xs">{alerts.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="markets" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <BarChart3 size={14} className="mr-1" /> Event Markets
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Factory size={14} className="mr-1" /> Suppliers
          </TabsTrigger>
          <TabsTrigger value="ports" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <Ship size={14} className="mr-1" /> Ports
          </TabsTrigger>
          <TabsTrigger value="derivatives" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <DollarSign size={14} className="mr-1" /> SCF Derivatives
          </TabsTrigger>
        </TabsList>

        {/* Control Tower Tab */}
        <TabsContent value="control-tower" className="mt-6">
          <ControlTowerPanel data={controlTower} getRiskColor={getRiskColor} getRiskBg={getRiskBg} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <AlertsPanel 
            alerts={alerts}
            presets={alertPresets}
            history={alertHistory}
            stats={alertStats}
            ports={ports}
            suppliers={suppliers}
            markets={markets}
            showCreateAlert={showCreateAlert}
            setShowCreateAlert={setShowCreateAlert}
            newAlert={newAlert}
            setNewAlert={setNewAlert}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onToggleAlert={handleToggleAlert}
            onQuickSetup={handleQuickSetup}
            onCheckAlerts={handleCheckAlerts}
            refreshing={refreshing}
          />
        </TabsContent>

        {/* Markets Tab */}
        <TabsContent value="markets" className="mt-6">
          <MarketsPanel markets={markets} />
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-6">
          <SuppliersPanel suppliers={suppliers} getRiskColor={getRiskColor} />
        </TabsContent>

        {/* Ports Tab */}
        <TabsContent value="ports" className="mt-6">
          <PortsPanel ports={ports} />
        </TabsContent>

        {/* Derivatives Tab */}
        <TabsContent value="derivatives" className="mt-6">
          <DerivativesPanel instruments={instruments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Control Tower Panel
const ControlTowerPanel = ({ data, getRiskColor, getRiskBg }) => {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Factory} label="Suppliers Monitored" value={data.overview?.total_suppliers_monitored} color="amber" />
        <StatCard icon={Ship} label="Ports Tracked" value={data.overview?.total_ports_tracked} color="blue" />
        <StatCard icon={BarChart3} label="Active Markets" value={data.overview?.active_markets} color="purple" />
        <StatCard icon={DollarSign} label="SCF Instruments" value={data.overview?.scf_instruments} color="emerald" />
      </div>

      {/* Risk Summary */}
      <GlassCard title="Global Risk Assessment" icon="🌍" accent="amber">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Port Congestion</p>
            <p className="text-xl font-bold text-amber-400">{data.risk_summary?.avg_port_congestion}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">High Risk Suppliers</p>
            <p className="text-xl font-bold text-red-400">{data.risk_summary?.high_risk_suppliers}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <p className="text-xs text-slate-500">Active Alerts</p>
            <p className="text-xl font-bold text-orange-400">{data.risk_summary?.active_alerts}</p>
          </div>
          <div className={`p-4 rounded-lg border ${getRiskBg(data.risk_summary?.global_risk_level)}`}>
            <p className="text-xs text-slate-500">Global Risk</p>
            <p className={`text-xl font-bold ${getRiskColor(data.risk_summary?.global_risk_level)}`}>
              {data.risk_summary?.global_risk_level}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Top Risks and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="High Impact Events" icon="⚠️" accent="red">
          <div className="space-y-3">
            {data.top_risks?.slice(0, 4).map((risk, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border-l-2 border-red-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Impact: {risk.impact_score}</span>
                  <span className="text-xs text-amber-400">{risk.implied_probability}</span>
                </div>
                <p className="text-sm text-white">{risk.title}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Congestion Hotspots" icon="🚢" accent="blue">
          <div className="space-y-3">
            {data.congested_ports?.map((port, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{port.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    port.congestion?.status === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    port.congestion?.status === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{port.congestion?.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Queue: {port.congestion?.vessel_queue} vessels</span>
                  <span>Wait: {port.congestion?.avg_wait_days} days</span>
                </div>
                <Progress value={port.congestion?.level * 100} className="h-1.5 mt-2 bg-white/10" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// Markets Panel
const MarketsPanel = ({ markets }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {markets.map((market) => (
        <div key={market.market_id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
          <div className="flex items-start justify-between mb-3">
            <span className={`text-xs px-2 py-0.5 rounded ${
              market.event_type === 'geopolitical' ? 'bg-red-500/20 text-red-400' :
              market.event_type === 'port_congestion' ? 'bg-blue-500/20 text-blue-400' :
              market.event_type === 'tariff_change' ? 'bg-purple-500/20 text-purple-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>{market.event_type?.replace('_', ' ')}</span>
            <span className="text-xs text-slate-500">Impact: {market.impact_score}</span>
          </div>
          <h4 className="text-white font-medium mb-2 line-clamp-2">{market.title}</h4>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-emerald-400">YES {(market.yes_price * 100).toFixed(0)}¢</span>
            <span className="text-red-400">NO {(market.no_price * 100).toFixed(0)}¢</span>
          </div>
          <Progress value={market.yes_price * 100} className="h-2 bg-red-500/30" />
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>Vol: ${market.volume?.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> {market.time_to_resolution}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Suppliers Panel
const SuppliersPanel = ({ suppliers, getRiskColor }) => {
  return (
    <div className="space-y-4">
      {suppliers.map((supplier) => (
        <div key={supplier.supplier_id} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-medium">{supplier.name}</h4>
              <p className="text-xs text-slate-500">{supplier.region?.replace('_', ' ')} • {supplier.commodities?.join(', ')}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg ${
              supplier.risk_level === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
              supplier.risk_level === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
              supplier.risk_level === 'elevated' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <p className="text-xs">Risk: {supplier.risk_score}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Financial Health</p>
              <Progress value={supplier.metrics?.financial_health} className="h-1.5 mt-1 bg-white/10" />
              <p className="text-xs text-right text-white mt-0.5">{supplier.metrics?.financial_health}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Delivery</p>
              <Progress value={supplier.metrics?.delivery_reliability} className="h-1.5 mt-1 bg-white/10" />
              <p className="text-xs text-right text-white mt-0.5">{supplier.metrics?.delivery_reliability}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Quality</p>
              <Progress value={supplier.metrics?.quality_score} className="h-1.5 mt-1 bg-white/10" />
              <p className="text-xs text-right text-white mt-0.5">{supplier.metrics?.quality_score}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ESG Score</p>
              <Progress value={supplier.metrics?.esg_score} className="h-1.5 mt-1 bg-white/10" />
              <p className="text-xs text-right text-white mt-0.5">{supplier.metrics?.esg_score}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Ports Panel
const PortsPanel = ({ ports }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ports.map((port) => (
        <div key={port.port_id} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Ship size={20} className="text-blue-400" />
            <div>
              <h4 className="text-white font-medium">{port.name}</h4>
              <p className="text-xs text-slate-500">{port.country}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Congestion</span>
              <span className={
                port.congestion?.status === 'Critical' ? 'text-red-400' :
                port.congestion?.status === 'High' ? 'text-orange-400' :
                port.congestion?.status === 'Moderate' ? 'text-amber-400' :
                'text-emerald-400'
              }>{port.congestion?.level_pct}</span>
            </div>
            <Progress value={port.congestion?.level * 100} className="h-2 bg-white/10" />
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2 rounded bg-white/5">
                <p className="text-slate-500">Vessel Queue</p>
                <p className="text-white">{port.congestion?.vessel_queue}</p>
              </div>
              <div className="p-2 rounded bg-white/5">
                <p className="text-slate-500">Avg Wait</p>
                <p className="text-white">{port.congestion?.avg_wait_days} days</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-500">Trend</span>
              <span className={
                port.trend === 'rising' ? 'text-red-400' :
                port.trend === 'falling' ? 'text-emerald-400' :
                'text-slate-400'
              }>{port.trend} {port.week_over_week_change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Derivatives Panel
const DerivativesPanel = ({ instruments }) => {
  return (
    <div className="space-y-4">
      {instruments.map((inst) => (
        <div key={inst.instrument_id} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-medium">{inst.name}</h4>
              <p className="text-xs text-slate-500 capitalize">{inst.commodity}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">${inst.pricing?.current_price}</p>
              <p className={inst.pricing?.change_24h >= 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                {inst.pricing?.change_24h_pct} (24h)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-500">Volatility</p>
              <p className="text-amber-400">{inst.risk?.volatility}</p>
            </div>
            <div>
              <p className="text-slate-500">Risk Premium</p>
              <p className="text-red-400">{inst.risk?.supply_risk_premium}</p>
            </div>
            <div>
              <p className="text-slate-500">Volume 24h</p>
              <p className="text-white">${inst.trading?.volume_24h?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Open Interest</p>
              <p className="text-white">${inst.trading?.open_interest?.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600">Buy</Button>
            <Button size="sm" variant="outline" className="flex-1 border-red-500/30 text-red-400">Sell</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    red: 'text-red-400 bg-red-500/20'
  };
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Alerts Panel
const AlertsPanel = ({ 
  alerts, presets, history, stats, ports, suppliers, markets,
  showCreateAlert, setShowCreateAlert, newAlert, setNewAlert,
  onCreateAlert, onDeleteAlert, onToggleAlert, onQuickSetup, onCheckAlerts, refreshing
}) => {
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-slate-400 bg-slate-500/20',
      medium: 'text-amber-400 bg-amber-500/20',
      high: 'text-orange-400 bg-orange-500/20',
      critical: 'text-red-400 bg-red-500/20'
    };
    return colors[priority] || colors.medium;
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      port_congestion: Ship,
      supplier_risk: Factory,
      geopolitical_risk: Globe,
      commodity_price: DollarSign,
      market_event: BarChart3,
      delivery_delay: Truck
    };
    return icons[type] || Bell;
  };

  return (
    <div className="space-y-6" data-testid="alerts-panel">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Bell} label="Active Alerts" value={stats.enabled_alerts} color="blue" />
          <StatCard icon={AlertTriangle} label="Triggered Today" value={stats.triggered_today} color="amber" />
          <StatCard icon={Check} label="Total History" value={stats.total_triggered_history} color="emerald" />
          <StatCard icon={X} label="Disabled" value={stats.disabled_alerts} color="red" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowCreateAlert(true)} className="bg-teal-500 hover:bg-teal-600">
          <Plus size={16} className="mr-2" /> Create Alert
        </Button>
        <Button onClick={onCheckAlerts} disabled={refreshing} variant="outline" className="border-amber-500/30 text-amber-400">
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Check Now
        </Button>
      </div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard title="Create New Alert" icon="🔔" accent="teal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Alert Type</label>
                  <select
                    value={newAlert.alert_type}
                    onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="port_congestion">Port Congestion</option>
                    <option value="supplier_risk">Supplier Risk</option>
                    <option value="geopolitical_risk">Geopolitical Risk</option>
                    <option value="commodity_price">Commodity Price</option>
                    <option value="market_event">Market Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Target Entity</label>
                  <select
                    value={newAlert.target_entity}
                    onChange={(e) => {
                      const val = e.target.value;
                      let name = val;
                      if (newAlert.alert_type === 'port_congestion') {
                        name = ports.find(p => p.port_id === val)?.name || val;
                      } else if (newAlert.alert_type === 'supplier_risk') {
                        name = suppliers.find(s => s.supplier_id === val)?.name || val;
                      }
                      setNewAlert({ ...newAlert, target_entity: val, entity_name: name });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Select...</option>
                    {newAlert.alert_type === 'port_congestion' && ports.map(p => (
                      <option key={p.port_id} value={p.port_id}>{p.name}</option>
                    ))}
                    {newAlert.alert_type === 'supplier_risk' && suppliers.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                    ))}
                    {newAlert.alert_type === 'geopolitical_risk' && (
                      <option value="global">Global Risk Index</option>
                    )}
                    {newAlert.alert_type === 'market_event' && markets.map(m => (
                      <option key={m.market_id} value={m.market_id}>{m.title?.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Condition</label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Threshold</label>
                  <input
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Priority</label>
                  <select
                    value={newAlert.priority}
                    onChange={(e) => setNewAlert({ ...newAlert, priority: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={onCreateAlert} className="bg-teal-500 hover:bg-teal-600">
                  <Check size={16} className="mr-2" /> Create Alert
                </Button>
                <Button onClick={() => setShowCreateAlert(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <GlassCard title="Active Alerts" icon="🔔" accent="blue">
          {alerts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No alerts configured. Create one or use a preset below.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.map((alert) => {
                const Icon = getAlertTypeIcon(alert.alert_type);
                return (
                  <div key={alert.alert_id} className={`p-3 rounded-lg border ${alert.enabled ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-teal-400" />
                        <span className="text-white text-sm font-medium">{alert.entity_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <button 
                          onClick={() => onToggleAlert(alert.alert_id, alert.enabled)}
                          className={`p-1 rounded ${alert.enabled ? 'text-emerald-400' : 'text-slate-500'}`}
                        >
                          {alert.enabled ? <Check size={14} /> : <X size={14} />}
                        </button>
                        <button onClick={() => onDeleteAlert(alert.alert_id)} className="p-1 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {alert.condition} {alert.threshold} • Type: {alert.alert_type?.replace('_', ' ')}
                    </p>
                    {alert.current_value !== null && (
                      <p className="text-xs text-slate-500 mt-1">Current: {alert.current_value?.toFixed(2)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Quick Setup Presets */}
        <GlassCard title="Quick Setup" icon="⚡" accent="amber">
          <div className="space-y-3">
            {presets.map((preset, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => onQuickSetup(preset)} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                  <Plus size={14} />
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alert History */}
      {history.length > 0 && (
        <GlassCard title="Recent Triggered Alerts" icon="📜" accent="purple">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.slice(0, 10).map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border-l-2 border-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.triggered_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white">{item.message}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default SupplyChainHub;
