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
import axios from 'axios';

// Icons
import { 
  Brain, Activity, TrendingUp, TrendingDown, Zap, LogIn,
  LayoutDashboard, Users, PieChart, Banknote, Bell, Layers,
  Newspaper, Bot, Wallet, Menu, X, Radar, Download, User, Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Navigation Tabs
const NAV_TABS = [
  { id: 'dashboard', label: 'Trading', icon: LayoutDashboard, labelKey: 'nav.trading' },
  { id: 'avatar', label: 'Avatar', icon: User, labelKey: 'Avatar' },
  { id: 'crawler', label: 'Signals', icon: Radar, labelKey: 'crawler.title' },
  { id: 'orders', label: 'Orders', icon: Layers, labelKey: 'nav.orders' },
  { id: 'alerts', label: 'Alerts', icon: Bell, labelKey: 'nav.alerts' },
  { id: 'auto', label: 'Auto', icon: Bot, labelKey: 'nav.auto' },
  { id: 'news', label: 'News', icon: Newspaper, labelKey: 'nav.news' },
  { id: 'social', label: 'Social', icon: Users, labelKey: 'nav.social' },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart, labelKey: 'nav.portfolio' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, labelKey: 'nav.wallet' },
  { id: 'paper', label: 'Paper', icon: Banknote, labelKey: 'nav.paper' },
  { id: 'export', label: 'Export', icon: Download, labelKey: 'common.export' },
  { id: 'settings', label: 'Settings', icon: Settings, labelKey: 'common.settings' },
];

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);
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

  if (showSplash) {
    return <AnimatePresence><SplashScreen onComplete={() => setShowSplash(false)} /></AnimatePresence>;
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
                      <h1 className="font-heading text-base md:text-lg font-bold uppercase tracking-wider text-white">Oracle</h1>
                      <p className="text-[10px] text-slate-500 font-mono hidden md:block">AI Trading</p>
                    </div>
                  </div>

                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center gap-1">
                    {NAV_TABS.map((tab) => (
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
                        {tab.labelKey ? t(tab.labelKey) : tab.label}
                      </button>
                    ))}
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

              {/* Paper Trading */}
              {activeTab === 'paper' && (
                <motion.div key="paper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <Banknote className="text-amber-400" />{t('nav.paper')} Trading
                    </h2>
                    <p className="text-slate-500 text-sm font-mono mt-1">Practice with $100,000 virtual funds</p>
                  </div>
                  <PaperTradingPanel currentPrices={marketPrices} />
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
      <AuthProvider>
        <div className="App"><AppRouter /></div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
