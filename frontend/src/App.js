import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import PaperTradingPanel, { PaperTradingProvider, usePaperTrading } from './components/PaperTrading';
import axios from 'axios';

// Icons
import { 
  Mic, Brain, Activity, TrendingUp, TrendingDown, Zap, LogIn,
  LayoutDashboard, Users, PieChart, Banknote, Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Navigation Tabs
const NAV_TABS = [
  { id: 'dashboard', label: 'Trading', icon: LayoutDashboard },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'paper', label: 'Paper Trade', icon: Banknote },
];

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [voiceActive, setVoiceActive] = useState(false);
  const [gestureReady, setGestureReady] = useState(true);
  const [currentMood, setCurrentMood] = useState('FOCUSED');
  const [showMarkets, setShowMarkets] = useState(true);
  const [systemMessages, setSystemMessages] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});

  // Fetch market prices for paper trading
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(`${API}/market/prices`);
        const prices = {};
        response.data.forEach(item => {
          prices[item.symbol] = item.price;
        });
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
      <div className="min-h-screen bg-[#050505] overflow-hidden" data-testid="main-dashboard">
        <MatrixBackground />

        <div className="relative z-10 min-h-screen pb-24">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
            <div className="max-w-[1920px] mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 flex items-center justify-center">
                      <Zap className="text-teal-400" size={18} />
                    </div>
                    <div>
                      <h1 className="font-heading text-lg font-bold uppercase tracking-wider text-white">Cognitive Oracle</h1>
                      <p className="text-[10px] text-slate-500 font-mono">AI Trading Platform</p>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className="hidden md:flex items-center gap-1 ml-6">
                    {NAV_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                          activeTab === tab.id
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                        data-testid={`nav-${tab.id}`}
                      >
                        <tab.icon size={16} />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge variant="active" pulse><Activity size={12} />Live</StatusBadge>
                  <StatusBadge variant={currentMood === 'FOCUSED' ? 'active' : currentMood === 'STRESSED' ? 'danger' : 'warning'}>
                    <Brain size={12} />{currentMood}
                  </StatusBadge>
                  {isAuthenticated ? <UserMenu /> : (
                    <NeonButton onClick={loginWithGoogle} variant="teal" size="sm" data-testid="header-login-btn">
                      <LogIn size={14} />Sign In
                    </NeonButton>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-[1920px] mx-auto px-6 py-6">
            <AnimatePresence mode="wait">
              {/* Trading Dashboard */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-6">
                    <TensorFlowFacialRecognition onMoodChange={handleMoodChange} onMoodDetected={handleMoodDetected} />
                    <VoicePanel onCommand={(cmd) => addSystemMessage(`Voice: ${cmd.action} ${cmd.symbol || ''}`)} />
                  </div>

                  {/* Center Column */}
                  <div className="lg:col-span-6 space-y-6">
                    {showMarkets && <LiveMarketsRealtime onClose={() => setShowMarkets(false)} symbols={['BTC', 'ETH', 'SPY']} />}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CandlestickChart symbol="BTC" title="Bitcoin / USD" />
                      <CandlestickChart symbol="ETH" title="Ethereum / USD" />
                    </div>

                    {/* System Messages */}
                    <AnimatePresence>
                      {systemMessages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-teal rounded-xl px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Zap size={16} className="text-teal-400" />
                            <p className="text-sm text-white font-mono">{msg.text}</p>
                            <span className="text-xs text-slate-500 ml-auto">{msg.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Speed Trading */}
                    <GlassCard title="Speed Trading" icon="⚡" accent="teal">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center"><p className="text-xs font-mono text-slate-500 mb-1">Symbol</p><p className="text-xl font-heading font-bold text-white">AAPL</p></div>
                        <div className="text-center"><p className="text-xs font-mono text-slate-500 mb-1">Qty</p><p className="text-xl font-heading font-bold text-white">1,000</p></div>
                        <div className="text-center"><p className="text-xs font-mono text-slate-500 mb-1">Type</p><p className="text-xl font-heading font-bold text-teal-400">MARKET</p></div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <NeonButton variant="teal" className="flex-1" data-testid="quick-buy-btn"><TrendingUp size={16} />BUY</NeonButton>
                        <NeonButton variant="rose" className="flex-1" data-testid="quick-sell-btn"><TrendingDown size={16} />SELL</NeonButton>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-3 space-y-6">
                    <GestureRecognition onGesture={(g) => addSystemMessage(`Gesture: ${g.name}`)} />
                    <AgentConsensus tradeRequest={{ action: 'BUY', symbol: 'AAPL', quantity: 1000, price: 248.50 }} />
                    <OracleMemory symbol="AAPL" action="BUY" />
                  </div>
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

              {/* Paper Trading */}
              {activeTab === 'paper' && (
                <motion.div key="paper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <h2 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
                      <Banknote className="text-amber-400" />
                      Paper Trading Mode
                    </h2>
                    <p className="text-slate-500 text-sm font-mono mt-1">Practice trading with virtual funds - no real money at risk</p>
                  </div>
                  <PaperTradingPanel currentPrices={marketPrices} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Status Bar */}
          <div className="fixed bottom-20 left-0 right-0 z-30 px-6">
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
