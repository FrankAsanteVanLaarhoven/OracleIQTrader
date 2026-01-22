import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Zap, TrendingUp, Shield, Brain, Smartphone, Globe, 
  ChevronRight, Play, Star, Users, BarChart3, Bot,
  Wallet, Bell, Award, ArrowRight, Check, Sparkles,
  LineChart, PieChart, Activity, Lock, Cpu, Layers
} from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced ML models predict price movements with confidence scoring',
      color: '#A855F7',
      gradient: 'from-purple-500/20 to-transparent',
    },
    {
      icon: Bot,
      title: 'Autonomous Trading Bot',
      description: 'Configure strategies and let AI execute trades 24/7',
      color: '#14B8A6',
      gradient: 'from-teal-500/20 to-transparent',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Live market data, sentiment analysis, and whale alerts',
      color: '#3B82F6',
      gradient: 'from-blue-500/20 to-transparent',
    },
    {
      icon: Award,
      title: 'Trading Competitions',
      description: 'Compete with traders worldwide in daily challenges',
      color: '#F59E0B',
      gradient: 'from-amber-500/20 to-transparent',
    },
  ];

  const stats = [
    { value: '$2.4B+', label: 'Trading Volume', icon: Activity },
    { value: '50K+', label: 'Active Traders', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Shield },
    { value: '24/7', label: 'AI Monitoring', icon: Cpu },
  ];

  const testimonials = [
    {
      quote: "The AI predictions are incredibly accurate. My trading performance improved 40% in just 2 months.",
      author: "Alex Chen",
      role: "Professional Trader",
      avatar: "AC",
    },
    {
      quote: "Finally, a platform that combines real-time data with actionable AI insights. Game changer.",
      author: "Sarah Williams",
      role: "Crypto Enthusiast",
      avatar: "SW",
    },
    {
      quote: "The autonomous bot feature lets me trade while I sleep. Passive income on autopilot.",
      author: "Michael Park",
      role: "Day Trader",
      avatar: "MP",
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      features: ['Paper Trading', 'Basic Analytics', '5 Price Alerts', 'Community Access'],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: ['Live Trading', 'AI Predictions', 'Unlimited Alerts', 'Priority Support', 'Trading Bot'],
      cta: 'Go Pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Multi-Exchange', 'Custom Models', 'API Access', 'Dedicated Manager', 'White Label'],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full bg-teal-500/10 blur-[120px]"
          style={{ y: backgroundY }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]"
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute left-1/4 bottom-0 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[80px]"
          animate={{
            x: [0, 80, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Mouse follower */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[60px] pointer-events-none"
          animate={{
            x: mousePosition.x - 200,
            y: mousePosition.y - 200,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">ORACLE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-slate-400 hover:text-white transition-colors">Reviews</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all"
            >
              Launch App
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">AI-Powered Trading Platform</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              Trade Smarter
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              With AI Oracle
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            Harness the power of machine learning, real-time analytics, and autonomous trading 
            to maximize your crypto and stock portfolio performance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button 
              onClick={onGetStarted}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transition-all flex items-center gap-2"
            >
              Start Trading Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-teal-500/10">
              <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-950 p-8">
                {/* Simulated Dashboard Preview */}
                <div className="grid grid-cols-3 gap-4 h-full">
                  <div className="col-span-2 space-y-4">
                    <div className="h-2/3 rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <LineChart className="w-5 h-5 text-teal-400" />
                        <span className="text-sm font-medium">BTC/USD</span>
                        <span className="text-xs text-green-400 ml-auto">+2.34%</span>
                      </div>
                      <div className="h-[calc(100%-40px)] flex items-end gap-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-teal-500/50 to-teal-400/20 rounded-t"
                            initial={{ height: 0 }}
                            animate={{ height: `${30 + Math.random() * 70}%` }}
                            transition={{ delay: 1 + i * 0.02, duration: 0.5 }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="h-1/3 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="text-xs text-slate-500 mb-1">Portfolio Value</div>
                        <div className="text-2xl font-bold text-white">$127,432.50</div>
                        <div className="text-xs text-green-400">+$2,340.50 (1.87%)</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="text-xs text-slate-500 mb-1">AI Prediction</div>
                        <div className="text-2xl font-bold text-teal-400">BULLISH</div>
                        <div className="text-xs text-slate-400">89% confidence</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4 h-1/2">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium">Holdings</span>
                      </div>
                      <div className="space-y-2">
                        {['BTC', 'ETH', 'SOL'].map((coin, i) => (
                          <div key={coin} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-purple-400' : 'bg-teal-400'}`} />
                            <span className="text-xs text-slate-400">{coin}</span>
                            <span className="text-xs text-white ml-auto">{40 - i * 10}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/20 p-4 h-1/2">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-teal-400" />
                        <span className="text-sm font-medium">AI Bot</span>
                      </div>
                      <div className="text-xs text-green-400 mb-2">● Running</div>
                      <div className="text-xs text-slate-400">Strategy: Moderate</div>
                      <div className="text-xs text-slate-400">Today's P&L: +$342.50</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          style={{ opacity }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-teal-400 mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent"> Win</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Powerful tools designed for both beginners and professional traders
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveFeature(index)}
                className={`relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                  activeFeature === index 
                    ? 'bg-white/5 border-white/20 shadow-xl' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div 
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 ${
                    activeFeature === index ? 'opacity-100' : ''
                  }`}
                />
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-teal-500/10 via-transparent to-purple-500/10 border border-white/10"
          >
            <Sparkles className="w-12 h-12 text-teal-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of traders who are already using AI to make smarter decisions.
              Start with $100,000 in virtual money - no risk, all reward.
            </p>
            <button 
              onClick={onGetStarted}
              className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transition-all inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">ORACLE TRADING</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 Oracle Trading. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
