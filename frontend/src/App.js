import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import './i18n';
import '@/App.css';

// Components
import MatrixBackground from './components/MatrixBackground';
import SplashScreen from './components/SplashScreen';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import GlassCard from './components/GlassCard';
import StatusBadge from './components/StatusBadge';
import NeonButton from './components/NeonButton';
import LiveMarketsRealtime from './components/LiveMarketsRealtime';
import VoicePanel from './components/VoicePanel';
import TensorFlowFacialRecognition from './components/TensorFlowFacialRecognition';
import GestureRecognition from './components/GestureRecognition';
import AgentConsensus from './components/AgentConsensus';
import OracleMemory from './components/OracleMemory';
import CandlestickChart from './components/CandlestickChart';
import StatusBar from './components/StatusBar';
import ControlPanel from './components/ControlPanel';
import UserMenu from './components/UserMenu';
import SocialTrading from './components/SocialTrading';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import PaperTradingPanel, { PaperTradingProvider } from './components/PaperTrading';
import PriceAlerts from './components/PriceAlerts';
import AdvancedOrders from './components/AdvancedOrders';
import NewsFeed from './components/NewsFeed';
import AutoTrading from './components/AutoTrading';
import UserWallet from './components/UserWallet';
import TradeCrawler from './components/TradeCrawler';
import LanguageSelector from './components/LanguageSelector';
import ExportPanel from './components/ExportPanel';
import TradingAvatar from './components/TradingAvatar';
import ThemeToggle from './components/ThemeToggle';
import NotificationManager from './components/NotificationManager';
import TradingJournal from './components/TradingJournal';
import PortfolioLeaderboard from './components/PortfolioLeaderboard';
import SocialSignals from './components/SocialSignals';
import TradingPlayground from './components/TradingPlayground';
import AutonomousBot from './components/AutonomousBot';
import TrainingCenter from './components/TrainingCenter';
import MLPredictions from './components/MLPredictions';
import TradingCompetitions from './components/TradingCompetitions';
import BenzingaNews from './components/BenzingaNews';
import ExchangeSettings from './components/ExchangeSettings';
import TournamentCenter from './components/TournamentCenter';
import QuantitativeCenter from './components/QuantitativeCenter';
import PredictionHub from './components/PredictionHub';
import CopyTradingHub from './components/CopyTradingHub';
import SupplyChainHub from './components/SupplyChainHub';
import AgentBuilder from './components/AgentBuilder';
import GlassBoxPricing from './components/GlassBoxPricing';
import ExecutionAuditTrail from './components/ExecutionAuditTrail';
import RiskDashboard from './components/RiskDashboard';
import TradingViewIntegration from './components/TradingViewIntegration';
import HowWeMakeMoney from './components/HowWeMakeMoney';
import UXModeToggle from './components/UXModeToggle';
import { UXModeProvider, useUXMode } from './contexts/UXModeContext';
import axios from 'axios';

// Icons
import { 
  Brain, Activity, TrendingUp, TrendingDown, Zap, LogIn,
  LayoutDashboard, Users, PieChart, Banknote, Bell, Layers,
  Newspaper, Bot, Wallet, Menu, X, Radar, Download, User, Settings,
  BookOpen, Trophy, MessageCircle, GraduationCap, Sparkles, Medal, Scale, Target, Copy, Ship, MoreHorizontal, Cpu, DollarSign, Receipt, Shield, BarChart2, Eye
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Primary Navigation Tabs (always visible)
const PRIMARY_TABS = [
  { id: 'dashboard', label: 'Trading', icon: LayoutDashboard },
  { id: 'agents', label: 'AI Agents', icon: Brain },
  { id: 'agent-builder', label: 'Agent Builder', icon: Cpu },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'copy-trading', label: 'Copy', icon: Copy },
  { id: 'bot', label: 'AI Bot', icon: Bot },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

// Secondary Navigation Tabs (in "More" dropdown)
const SECONDARY_TABS = [
  { id: 'orders', label: 'Orders', icon: Layers },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'audit-trail', label: 'Execution', icon: Receipt },
  { id: 'risk', label: 'Risk', icon: Shield },
  { id: 'playground', label: 'Playground', icon: Banknote },
  { id: 'prediction-markets', label: 'Predictions', icon: Target },
  { id: 'supply-chain', label: 'Supply Chain', icon: Ship },
  { id: 'quantitative', label: 'Quant Research', icon: Scale },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'ml-predictions', label: 'ML Predict', icon: Sparkles },
  { id: 'tournament', label: 'Tournament', icon: Trophy },
  { id: 'competitions', label: 'Compete', icon: Medal },
  { id: 'avatar', label: 'Avatar', icon: User },
  { id: 'crawler', label: 'Signals', icon: Radar },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'leaderboard', label: 'Leaders', icon: Users },
  { id: 'sentiment', label: 'Sentiment', icon: MessageCircle },
  { id: 'benzinga', label: 'Benzinga', icon: Newspaper },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// All tabs combined for mobile menu
const NAV_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS];

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [voiceActive, setVoiceActive] = useState(false);
  const [gestureReady, setGestureReady] = useState(true);
  const [currentMood, setCurrentMood] = useState('FOCUSED');
  const [showMarkets, setShowMarkets] = useState(true);
  const [systemMessages, setSystemMessages] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch market prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(`${API}/market/prices`);
        const prices = {};
        response.data.forEach(item => { prices[item.symbol] = item.price; });
        setMarketPrices(prices);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMoodChange = useCallback((newMood) => setCurrentMood(newMood), []);
  const handleMoodDetected = useCallback((moodResult) => {
    addSystemMessage(`AI Mood: ${moodResult.state} (${moodResult.confidence.toFixed(0)}%)`);
  }, []);

  const addSystemMessage = (message) => {
    const newMsg = { id: Date.now(), text: message, timestamp: new Date() };
    setSystemMessages(prev => [...prev, newMsg]);
    setTimeout(() => setSystemMessages(prev => prev.filter(m => m.id !== newMsg.id)), 5000);
  };

  const handleVoiceToggle = () => {
    setVoiceActive(!voiceActive);
    addSystemMessage(voiceActive ? 'Voice deactivated' : 'Voice activated');
  };

  const handleGestureToggle = () => addSystemMessage('Gesture recognition triggered');
  const handleMoodToggle = () => {
    const moods = ['FOCUSED', 'STRESSED', 'FATIGUED', 'CONFIDENT'];
    const nextMood = moods[(moods.indexOf(currentMood) + 1) % moods.length];
    setCurrentMood(nextMood);
    addSystemMessage(`Mood: ${nextMood}`);
  };
  const handleOracleQuery = () => addSystemMessage('Querying oracle memory...');
  const handleNewMessage = () => {
    const messages = ['Market volatility increasing', 'Bullish signal on NVDA', 'Risk parameters updated'];
    addSystemMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  // Handle "Get Started" from landing page - triggers Google login or shows dashboard
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      loginWithGoogle();
    }
    setShowLanding(false);
  };

  // Show Splash Screen FIRST (before landing page)
  if (showSplash) {
    return <AnimatePresence><SplashScreen onComplete={() => setShowSplash(false)} /></AnimatePresence>;
  }

  // Show Landing Page for unauthenticated users who haven't clicked "Get Started"
  if (!isAuthenticated && showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <PaperTradingProvider initialBalance={100000}>
      <div className="min-h-screen bg-[#050505] overflow-x-hidden" data-testid="main-dashboard">
        <MatrixBackground />

        <div className="relative z-10 min-h-screen pb-20 md:pb-16">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
            <div className="max-w-[1920px] mx-auto px-3 md:px-6 py-2 md:py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-6">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-slate-400 hover:text-white"
                    data-testid="mobile-menu-btn"
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>

                  {/* Logo */}
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 flex items-center justify-center">
                      <Zap className="text-teal-400" size={16} />
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="font-heading text-base md:text-lg font-bold uppercase tracking-wider text-white">OracleIQTrader</h1>
                      <p className="text-[10px] text-slate-500 font-mono hidden md:block">AI Trading</p>
                    </div>
                  </div>

                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center gap-1">
                    {PRIMARY_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          activeTab === tab.id
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                        data-testid={`nav-${tab.id}`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                    {/* More Dropdown */}
                    <div className="relative group">
                      <button
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          SECONDARY_TABS.some(t => t.id === activeTab)
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <MoreHorizontal size={14} />
                        More
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-80 overflow-y-auto">
                        {SECONDARY_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-mono transition-all ${
                              activeTab === tab.id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            data-testid={`nav-${tab.id}`}
                          >
                            <tab.icon size={14} />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <ThemeToggle variant="simple" />
                  <LanguageSelector variant="compact" />
                  <StatusBadge variant="active" pulse className="hidden sm:flex"><Activity size={10} />{t('status.live')}</StatusBadge>
                  <StatusBadge variant={currentMood === 'FOCUSED' ? 'active' : currentMood === 'STRESSED' ? 'danger' : 'warning'} className="hidden md:flex">
                    <Brain size={10} />{t(`status.${currentMood.toLowerCase()}`)}
                  </StatusBadge>
                  {isAuthenticated ? <UserMenu /> : (
                    <NeonButton onClick={loginWithGoogle} variant="teal" size="sm" data-testid="header-login-btn">
                      <LogIn size={14} /><span className="hidden sm:inline">Sign In</span>
                    </NeonButton>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden border-t border-white/5 bg-black/80"
                >
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {NAV_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-mono transition-all ${
                          activeTab === tab.id
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                      >
                        <tab.icon size={18} />
                        {tab.labelKey ? t(tab.labelKey) : tab.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Main Content */}
          <main className="max-w-[1920px] mx-auto px-3 md:px-6 py-4 md:py-6">
            <AnimatePresence mode="wait">
              {/* Trading Dashboard */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                  {/* Left */}
                  <div className="lg:col-span-3 space-y-4 md:space-y-6">
                    <TensorFlowFacialRecognition onMoodChange={handleMoodChange} onMoodDetected={handleMoodDetected} />
                    <VoicePanel onCommand={(cmd) => addSystemMessage(`Voice: ${cmd.action} ${cmd.symbol || ''}`)} />
                  </div>
                  {/* Center */}
                  <div className="lg:col-span-6 space-y-4 md:space-y-6">
                    {showMarkets && <LiveMarketsRealtime onClose={() => setShowMarkets(false)} symbols={['BTC', 'ETH', 'SPY']} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CandlestickChart symbol="BTC" title="Bitcoin / USD" />
                      <CandlestickChart symbol="ETH" title="Ethereum / USD" />
                    </div>
                    <AnimatePresence>
                      {systemMessages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-teal rounded-xl px-4 py-2">
                          <div className="flex items-center gap-3">
                            <Zap size={14} className="text-teal-400" />
                            <p className="text-sm text-white font-mono flex-1">{msg.text}</p>
                            <span className="text-xs text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <GlassCard title="Speed Trading" icon="⚡" accent="teal">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center"><p className="text-xs font-mono text-slate-500">Symbol</p><p className="text-lg md:text-xl font-heading font-bold text-white">AAPL</p></div>
                        <div className="text-center"><p className="text-xs font-mono text-slate-500">Qty</p><p className="text-lg md:text-xl font-heading font-bold text-white">1,000</p></div>
                        <div className="text-center"><p className="text-xs font-mono text-slate-500">Type</p><p className="text-lg md:text-xl font-heading font-bold text-teal-400">MARKET</p></div>
                      </div>
                      <div className="flex gap-3">
                        <NeonButton variant="teal" className="flex-1" data-testid="quick-buy-btn"><TrendingUp size={16} />BUY</NeonButton>
                        <NeonButton variant="rose" className="flex-1" data-testid="quick-sell-btn"><TrendingDown size={16} />SELL</NeonButton>
                      </div>
                    </GlassCard>
                  </div>
                  {/* Right */}
                  <div className="lg:col-span-3 space-y-4 md:space-y-6">
                    <GestureRecognition onGesture={(g) => addSystemMessage(`Gesture: ${g.name}`)} />
                    <AgentConsensus tradeRequest={{ action: 'BUY', symbol: 'AAPL', quantity: 1000, price: 248.50 }} />
                    <OracleMemory symbol="AAPL" action="BUY" />
                  </div>
                </motion.div>
              )}

              {/* Advanced Orders */}
              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                  <AdvancedOrders currentPrices={marketPrices} />
                </motion.div>
              )}

              {/* Glass-Box Pricing */}
              {activeTab === 'pricing' && (
                <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <GlassBoxPricing />
                </motion.div>
              )}

              {/* Execution Audit Trail */}
              {activeTab === 'audit-trail' && (
                <motion.div key="audit-trail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <ExecutionAuditTrail />
                </motion.div>
              )}

              {/* Risk Dashboard */}
              {activeTab === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <RiskDashboard />
                </motion.div>
              )}

              {/* Price Alerts */}
              {activeTab === 'alerts' && (
                <motion.div key="alerts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <PriceAlerts currentPrices={marketPrices} />
                </motion.div>
              )}

              {/* Auto Trading */}
              {activeTab === 'auto' && (
                <motion.div key="auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                  <AutoTrading currentPrices={marketPrices} onTrade={(t) => addSystemMessage(`Auto: ${t.side} ${t.symbol}`)} />
                </motion.div>
              )}

              {/* News Feed */}
              {activeTab === 'news' && (
                <motion.div key="news" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                  <NewsFeed />
                </motion.div>
              )}

              {/* Social Trading */}
              {activeTab === 'social' && (
                <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <SocialTrading />
                </motion.div>
              )}

              {/* Portfolio Analytics */}
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <PortfolioAnalytics />
                </motion.div>
              )}

              {/* User Wallet */}
              {activeTab === 'wallet' && (
                <motion.div key="wallet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <UserWallet currentPrices={marketPrices} />
                </motion.div>
              )}

              {/* Trading Playground */}
              {activeTab === 'playground' && (
                <motion.div key="playground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <TradingPlayground />
                </motion.div>
              )}

              {/* AI Trading Bot */}
              {activeTab === 'bot' && (
                <motion.div key="bot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <AutonomousBot />
                </motion.div>
              )}

              {/* Training Center */}
              {activeTab === 'training' && (
                <motion.div key="training" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <TrainingCenter />
                </motion.div>
              )}

              {/* ML Predictions */}
              {activeTab === 'ml-predictions' && (
                <motion.div key="predictions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <MLPredictions />
                </motion.div>
              )}

              {/* Paper Trading Tournament */}
              {activeTab === 'tournament' && (
                <motion.div key="tournament" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <TournamentCenter />
                </motion.div>
              )}

              {/* Quantitative Research Center */}
              {activeTab === 'quantitative' && (
                <motion.div key="quantitative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto">
                  <QuantitativeCenter />
                </motion.div>
              )}

              {/* Prediction Markets Hub */}
              {activeTab === 'prediction-markets' && (
                <motion.div key="prediction-markets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <PredictionHub />
                </motion.div>
              )}

              {/* Copy Trading Hub */}
              {activeTab === 'copy-trading' && (
                <motion.div key="copy-trading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <CopyTradingHub />
                </motion.div>
              )}

              {/* Supply Chain Hub */}
              {activeTab === 'supply-chain' && (
                <motion.div key="supply-chain" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto">
                  <SupplyChainHub />
                </motion.div>
              )}

              {/* AI Agent Builder */}
              {activeTab === 'agent-builder' && (
                <motion.div key="agent-builder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
                  <AgentBuilder />
                </motion.div>
              )}

              {/* Trading Competitions */}
              {activeTab === 'competitions' && (
                <motion.div key="competitions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <TradingCompetitions />
                </motion.div>
              )}

              {/* Trade Crawler / Signals */}
              {activeTab === 'crawler' && (
                <motion.div key="crawler" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                  <TradeCrawler />
                </motion.div>
              )}

              {/* Export Panel */}
              {activeTab === 'export' && (
                <motion.div key="export" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <ExportPanel />
                </motion.div>
              )}

              {/* Trading Avatar */}
              {activeTab === 'avatar' && (
                <motion.div key="avatar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <User className="text-teal-400" />AI Trading Avatar
                    </h2>
                    <p className="text-slate-500 text-sm font-mono mt-1">Interactive voice assistant with real-time market insights</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="aspect-square max-h-[400px]">
                      <TradingAvatar marketData={{ btc_change: marketPrices.BTC?.change || 0 }} />
                    </div>
                    <div className="space-y-4">
                      <GlassCard title="Avatar Features" icon="🤖" accent="teal">
                        <ul className="space-y-2 text-sm text-slate-400">
                          <li className="flex items-center gap-2">✓ 68-point facial mesh overlay</li>
                          <li className="flex items-center gap-2">✓ Real-time emotional expressions</li>
                          <li className="flex items-center gap-2">✓ Voice synthesis (OpenAI TTS)</li>
                          <li className="flex items-center gap-2">✓ Market-responsive mood</li>
                          <li className="flex items-center gap-2">✓ Voice command recognition</li>
                        </ul>
                      </GlassCard>
                      <GlassCard title="Current Market Context" icon="📊" accent="blue">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-white/5">
                            <p className="text-slate-500 text-xs">BTC Change</p>
                            <p className={`font-mono ${(marketPrices.BTC?.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(marketPrices.BTC?.change || 0).toFixed(2)}%
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5">
                            <p className="text-slate-500 text-xs">ETH Change</p>
                            <p className={`font-mono ${(marketPrices.ETH?.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(marketPrices.ETH?.change || 0).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <Settings className="text-slate-400" />{t('common.settings')}
                    </h2>
                    <p className="text-slate-500 text-sm font-mono mt-1">Configure your trading experience</p>
                  </div>
                  <div className="space-y-6">
                    {/* Theme Settings */}
                    <GlassCard title="Appearance" icon="🎨" accent="purple">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-sm text-white">Theme</p>
                          <p className="text-xs text-slate-500">Choose your preferred color scheme</p>
                        </div>
                        <ThemeToggle />
                      </div>
                    </GlassCard>
                    
                    {/* Notification Settings */}
                    <GlassCard title="Notifications" icon="🔔" accent="amber">
                      <NotificationManager />
                    </GlassCard>
                    
                    {/* Language Settings */}
                    <GlassCard title="Language" icon="🌍" accent="blue">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-sm text-white">Display Language</p>
                          <p className="text-xs text-slate-500">Select your preferred language</p>
                        </div>
                        <LanguageSelector />
                      </div>
                    </GlassCard>
                    
                    {/* Exchange API Keys */}
                    <ExchangeSettings />
                  </div>
                </motion.div>
              )}

              {/* Trading Journal */}
              {activeTab === 'journal' && (
                <motion.div key="journal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <TradingJournal />
                </motion.div>
              )}

              {/* Portfolio Leaderboard */}
              {activeTab === 'leaderboard' && (
                <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <PortfolioLeaderboard />
                </motion.div>
              )}

              {/* Social Sentiment */}
              {activeTab === 'sentiment' && (
                <motion.div key="sentiment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
                  <SocialSignals />
                </motion.div>
              )}

              {/* Benzinga News */}
              {activeTab === 'benzinga' && (
                <motion.div key="benzinga" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                  <BenzingaNews />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Status Bar - Hidden on mobile to save space */}
          <div className="hidden md:block fixed bottom-14 left-0 right-0 z-30 px-6">
            <StatusBar voiceActive={voiceActive} gestureReady={gestureReady} mood={currentMood} riskLevel="LOW" />
          </div>

          {/* Control Panel */}
          <ControlPanel onVoice={handleVoiceToggle} onGesture={handleGestureToggle} onMood={handleMoodToggle} onOracle={handleOracleQuery} onMessage={handleNewMessage} voiceActive={voiceActive} />
        </div>
      </div>
    </PaperTradingProvider>
  );
};

// App Router
const AppRouter = () => {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="App"><AppRouter /></div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
