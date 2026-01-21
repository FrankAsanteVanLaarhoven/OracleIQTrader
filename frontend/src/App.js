import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import WebcamFacialRecognition from './components/WebcamFacialRecognition';
import GestureRecognition from './components/GestureRecognition';
import AgentConsensus from './components/AgentConsensus';
import OracleMemory from './components/OracleMemory';
import TradingChart from './components/TradingChart';
import StatusBar from './components/StatusBar';
import ControlPanel from './components/ControlPanel';
import UserMenu from './components/UserMenu';

// Icons
import { 
  Mic, Hand, Brain, Shield, Activity, 
  TrendingUp, TrendingDown, Zap, LogIn
} from 'lucide-react';

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [gestureReady, setGestureReady] = useState(true);
  const [currentMood, setCurrentMood] = useState('FOCUSED');
  const [showMarkets, setShowMarkets] = useState(true);
  const [lastCommand, setLastCommand] = useState(null);
  const [systemMessages, setSystemMessages] = useState([]);

  const handleVoiceCommand = useCallback((command) => {
    setLastCommand(command);
    addSystemMessage(`Voice: ${command.action} ${command.quantity || ''} ${command.symbol || ''}`);
  }, []);

  const handleGesture = useCallback((gesture) => {
    addSystemMessage(`Gesture: ${gesture.name} - ${gesture.action}`);
  }, []);

  const handleMoodChange = useCallback((newMood) => {
    setCurrentMood(newMood);
  }, []);

  const handleMoodDetected = useCallback((moodResult) => {
    addSystemMessage(`Mood detected: ${moodResult.state} (${(moodResult.confidence * 100).toFixed(0)}%)`);
  }, []);

  const addSystemMessage = (message) => {
    const newMsg = { id: Date.now(), text: message, timestamp: new Date() };
    setSystemMessages(prev => [...prev, newMsg]);
    setTimeout(() => {
      setSystemMessages(prev => prev.filter(m => m.id !== newMsg.id));
    }, 5000);
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
    const messages = [
      'Market volatility increasing',
      'Bullish signal on NVDA',
      'Risk parameters updated',
      'Portfolio rebalancing recommended'
    ];
    addSystemMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden" data-testid="main-dashboard">
      <MatrixBackground />

      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 flex items-center justify-center">
                  <Zap className="text-teal-400" size={20} />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold uppercase tracking-wider text-white">
                    Cognitive Oracle
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">AI-Powered Trading Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge variant="active" pulse>
                  <Activity size={12} />
                  Voice Active
                </StatusBadge>
                <StatusBadge variant={currentMood === 'FOCUSED' ? 'active' : currentMood === 'STRESSED' ? 'danger' : 'warning'}>
                  <Brain size={12} />
                  {currentMood}
                </StatusBadge>
                
                {/* User Menu or Login */}
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <NeonButton onClick={loginWithGoogle} variant="teal" size="sm" data-testid="header-login-btn">
                    <LogIn size={14} />
                    Sign In
                  </NeonButton>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-6">
              <WebcamFacialRecognition 
                onMoodChange={handleMoodChange}
                onMoodDetected={handleMoodDetected}
              />
              <VoicePanel onCommand={handleVoiceCommand} />
            </div>

            {/* Center Column */}
            <div className="lg:col-span-6 space-y-6">
              <AnimatePresence>
                {showMarkets && (
                  <LiveMarketsRealtime 
                    onClose={() => setShowMarkets(false)}
                    symbols={['BTC', 'ETH', 'SPY']}
                  />
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TradingChart symbol="BTC" title="Bitcoin / USD" />
                <TradingChart symbol="ETH" title="Ethereum / USD" />
              </div>

              {/* System Messages */}
              <AnimatePresence>
                {systemMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="glass-teal rounded-xl px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={16} className="text-teal-400" />
                      <p className="text-sm text-white font-mono">{msg.text}</p>
                      <span className="text-xs text-slate-500 ml-auto">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Speed Trading */}
              <GlassCard title="Speed Trading" icon="⚡" accent="teal">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-mono text-slate-500 mb-1">Symbol</p>
                    <p className="text-xl font-heading font-bold text-white">AAPL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-slate-500 mb-1">Quantity</p>
                    <p className="text-xl font-heading font-bold text-white">1,000</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-slate-500 mb-1">Type</p>
                    <p className="text-xl font-heading font-bold text-teal-400">MARKET</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <NeonButton variant="teal" className="flex-1" data-testid="quick-buy-btn">
                    <TrendingUp size={16} />
                    BUY
                  </NeonButton>
                  <NeonButton variant="rose" className="flex-1" data-testid="quick-sell-btn">
                    <TrendingDown size={16} />
                    SELL
                  </NeonButton>
                </div>
              </GlassCard>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 space-y-6">
              <GestureRecognition onGesture={handleGesture} />
              <AgentConsensus tradeRequest={{ action: 'BUY', symbol: 'AAPL', quantity: 1000, price: 248.50 }} />
              <OracleMemory symbol="AAPL" action="BUY" />
            </div>
          </div>
        </main>

        {/* Status Bar */}
        <div className="fixed bottom-20 left-0 right-0 z-30 px-6">
          <StatusBar voiceActive={voiceActive} gestureReady={gestureReady} mood={currentMood} riskLevel="LOW" />
        </div>

        {/* Control Panel */}
        <ControlPanel
          onVoice={handleVoiceToggle}
          onGesture={handleGestureToggle}
          onMood={handleMoodToggle}
          onOracle={handleOracleQuery}
          onMessage={handleNewMessage}
          voiceActive={voiceActive}
        />
      </div>
    </div>
  );
};

// App Router with Auth handling
const AppRouter = () => {
  const location = useLocation();
  
  // Handle auth callback synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <AppRouter />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
