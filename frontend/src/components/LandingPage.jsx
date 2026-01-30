import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Zap, TrendingUp, Shield, Brain, Globe, ChevronRight, Play, 
  Star, Users, BarChart3, Bot, Wallet, ArrowRight, Check, 
  Sparkles, LineChart, Activity, Lock, Layers, Receipt, 
  DollarSign, Eye, Code, Smartphone, PieChart, Target,
  Ship, Scale, Radio, FileText, Building, HelpCircle, Mail
} from 'lucide-react';
import DemoMode from './DemoMode';

const LOGO_3D = "https://static.prod-images.emergentagent.com/jobs/a0a82ecc-3e60-429c-be59-f5b8a7b8a45e/images/9e4794f327719e73fa1fbd376c7f3d287a8340f4814b1f897ccd5f1707647dac.png";

const LandingPage = ({ onGetStarted }) => {
  const [showDemo, setShowDemo] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Asset classes for "Trade Everything"
  const assetClasses = [
    { name: 'Real Stocks', icon: TrendingUp, color: 'text-blue-400' },
    { name: 'Crypto', icon: Wallet, color: 'text-amber-400' },
    { name: 'ETFs', icon: PieChart, color: 'text-purple-400' },
    { name: 'Options', icon: Layers, color: 'text-pink-400' },
    { name: 'Futures', icon: BarChart3, color: 'text-cyan-400' },
    { name: 'Forex', icon: Globe, color: 'text-green-400' },
    { name: 'Event Markets', icon: Target, color: 'text-orange-400' },
    { name: 'Supply Chain', icon: Ship, color: 'text-teal-400' },
    { name: 'Macro Events', icon: Scale, color: 'text-indigo-400' },
    { name: 'Prediction', icon: Brain, color: 'text-rose-400' },
  ];

  // "Why You'll Never Leave" features
  const whyFeatures = [
    {
      num: '1',
      title: 'Execution Receipt',
      desc: 'See every detail of every trade instantly: venue, NBBO, fill price, all fees, latency. Export to CSV for tax prep.',
      icon: Receipt,
      color: 'from-teal-500/20'
    },
    {
      num: '2',
      title: 'Cost Tracker',
      desc: 'Monthly "cost of trading" report vs. IBKR, Binance, and eToro. See exactly what you saved this month.',
      icon: DollarSign,
      color: 'from-emerald-500/20'
    },
    {
      num: '3',
      title: 'Risk Dashboard',
      desc: 'Visual VaR, portfolio heat, drawdown projections per position. Long-term and trading buckets separate by default.',
      icon: Shield,
      color: 'from-blue-500/20'
    },
    {
      num: '4',
      title: 'Creator Economy',
      desc: 'Embed your transparent fill receipt in your YouTube or TikTok. Revenue share with creators on referrals.',
      icon: Star,
      color: 'from-purple-500/20'
    },
    {
      num: '5',
      title: 'Open API',
      desc: 'REST, WebSocket, Python, JS libraries. Real-time market data. Algorithmic execution. TradingView integration native.',
      icon: Code,
      color: 'from-cyan-500/20'
    },
    {
      num: '6',
      title: 'Ethical Monetization',
      desc: 'Public dashboard of our monthly revenue sources. No PFOF. No short-selling your order flow. Full transparency.',
      icon: Eye,
      color: 'from-amber-500/20'
    },
    {
      num: '7',
      title: 'Prediction Markets',
      desc: 'Trade sports outcomes, political events, macro indicators, and supply chain risks. Real probability discovery.',
      icon: Target,
      color: 'from-rose-500/20'
    },
    {
      num: '8',
      title: 'Mobile Parity',
      desc: 'Everything on desktop is on mobile. Real execution, risk management, and reporting—no "app-ified" dumbing down.',
      icon: Smartphone,
      color: 'from-indigo-500/20'
    },
  ];

  // Comparison table data
  const comparisonData = [
    { feature: 'Fee Transparency', oracleiq: true, ibkr: false, t212: false, etoro: false, binance: true },
    { feature: 'Real Interbank FX', oracleiq: true, ibkr: true, t212: false, etoro: false, binance: null },
    { feature: 'Zero PFOF', oracleiq: true, ibkr: true, t212: false, etoro: false, binance: null },
    { feature: 'Stocks + Crypto + Derivatives', oracleiq: true, ibkr: true, t212: 'Stocks only', etoro: 'CFDs only', binance: 'Crypto only' },
    { feature: 'Prediction Markets', oracleiq: true, ibkr: false, t212: false, etoro: false, binance: false },
    { feature: 'Best Execution Audit Trail', oracleiq: true, ibkr: false, t212: false, etoro: false, binance: false },
    { feature: 'Native TradingView API', oracleiq: true, ibkr: false, t212: true, etoro: true, binance: true },
    { feature: 'Beginner-Friendly UX', oracleiq: true, ibkr: false, t212: true, etoro: true, binance: true },
    { feature: 'Public Fee Breakdown', oracleiq: true, ibkr: false, t212: false, etoro: false, binance: true },
  ];

  // Value propositions
  const valueProps = [
    {
      title: 'Transparent Pricing',
      desc: 'See exactly what you pay: venue fees, spreads, FX costs, platform fee. No hidden markups. We cap execution costs and refund the difference when we beat our own promise.',
      icon: DollarSign,
      color: 'text-emerald-400'
    },
    {
      title: 'Best Execution Proof',
      desc: 'On every trade, we show you the best quote available across all venues vs. your fill price. Transparent audit trail on every receipt.',
      icon: Receipt,
      color: 'text-blue-400'
    },
    {
      title: 'Truly Global',
      desc: 'Real interbank FX rates. Trade US stocks, EU equities, crypto, forex, commodities—all in one account with true multi-currency support.',
      icon: Globe,
      color: 'text-purple-400'
    },
    {
      title: 'Real Risk Management',
      desc: 'Visual VaR bands, position-level risk, portfolio heat maps. No dark leverage defaults. Long-term investing and speculation separated by design.',
      icon: Shield,
      color: 'text-amber-400'
    },
    {
      title: 'Ethical Monetization',
      desc: 'No payment for order flow. No proprietary trading against your flow. Public dashboard showing exactly how we make money each month.',
      icon: Eye,
      color: 'text-rose-400'
    },
    {
      title: 'Built for Creators',
      desc: 'Native TradingView integration. Public APIs (REST/WebSocket). Python/JS libraries. Embed transparent execution into your content.',
      icon: Code,
      color: 'text-cyan-400'
    },
  ];

  const trustBadges = [
    { text: 'FCA Regulated', icon: Shield },
    { text: 'MiFID II Compliant', icon: Check },
    { text: 'Best Execution Guaranteed', icon: Zap },
    { text: 'Zero PFOF', icon: Lock },
  ];

  const renderCheckmark = (value) => {
    if (value === true) return <Check className="w-5 h-5 text-emerald-400 mx-auto" />;
    if (value === false) return <span className="text-slate-500">✗</span>;
    if (value === null) return <span className="text-slate-500">N/A</span>;
    return <span className="text-xs text-slate-400">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full bg-teal-500/10 blur-[120px]"
          style={{ y: backgroundY }}
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]"
          animate={{ x: [0, -50, 0], y: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img 
              src={LOGO_3D} 
              alt="OracleIQ" 
              className="w-10 h-10 rounded-xl"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-xl font-bold tracking-wider">OracleIQTrader</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#trade-everything" className="text-sm text-slate-400 hover:text-white transition-colors">Assets</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#compare" className="text-sm text-slate-400 hover:text-white transition-colors">Compare</a>
            <a href="#why" className="text-sm text-slate-400 hover:text-white transition-colors">Why Us</a>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowDemo(true)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Watch Demo
            </button>
            <button 
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all"
              data-testid="get-started-btn"
            >
              Start Trading Free
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {trustBadges.map((badge, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                <badge.icon size={12} className="text-teal-400" />
                {badge.text}
              </div>
            ))}
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              Trading Without
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Compromises
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10"
          >
            One platform. Zero hidden fees. Glass-box pricing. Trade stocks, crypto, options, 
            futures, forex, prediction markets—all with institutional clarity.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <button 
              onClick={onGetStarted}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transition-all flex items-center gap-2"
              data-testid="start-trading-btn"
            >
              Start Trading Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setShowDemo(true)}
              className="group px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
              data-testid="try-demo-btn"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { value: '50K+', label: 'Traders' },
              { value: '0%', label: 'Hidden Fees' },
              { value: '100%', label: 'Transparent' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trade Everything Section */}
      <section id="trade-everything" className="relative py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Trade Everything</h2>
            <p className="text-xl text-slate-400">One account. Multiple asset classes. Unified risk engine.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {assetClasses.map((asset, i) => (
              <motion.div
                key={asset.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/10 transition-all text-center group cursor-pointer"
              >
                <asset.icon className={`w-8 h-8 ${asset.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-white">{asset.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why You'll Never Leave Section */}
      <section id="features" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why You'll Never Leave</h2>
            <p className="text-xl text-slate-400">Features designed by traders, for traders</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${feature.color} to-transparent border border-white/10 hover:border-white/20 transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-teal-400">
                    {feature.num}
                  </div>
                  <feature.icon className="w-5 h-5 text-white/70" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="compare" className="relative py-24 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How We Stack Up</h2>
            <p className="text-xl text-slate-400">The truth about pricing transparency and range</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-slate-400 font-normal">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <span className="text-teal-400 font-bold">Oracle IQ</span>
                  </th>
                  <th className="py-4 px-4 text-center text-slate-400">Interactive Brokers</th>
                  <th className="py-4 px-4 text-center text-slate-400">Trading 212</th>
                  <th className="py-4 px-4 text-center text-slate-400">eToro</th>
                  <th className="py-4 px-4 text-center text-slate-400">Binance</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white text-sm">{row.feature}</td>
                    <td className="py-4 px-4 text-center bg-teal-500/5">{renderCheckmark(row.oracleiq)}</td>
                    <td className="py-4 px-4 text-center">{renderCheckmark(row.ibkr)}</td>
                    <td className="py-4 px-4 text-center">{renderCheckmark(row.t212)}</td>
                    <td className="py-4 px-4 text-center">{renderCheckmark(row.etoro)}</td>
                    <td className="py-4 px-4 text-center">{renderCheckmark(row.binance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Why Oracle IQ Trader Section */}
      <section id="why" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Oracle IQ Trader?</h2>
            <p className="text-xl text-slate-400">Built for young traders and serious investors. Finally.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {valueProps.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <prop.icon className={`w-10 h-10 ${prop.color} mb-4`} />
                <h3 className="text-xl font-bold text-white mb-3">{prop.title}</h3>
                <p className="text-slate-400 leading-relaxed">{prop.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop Overpaying for Mediocrity
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Interactive Brokers for the serious investor. Trading 212 simplicity for the young trader. 
              And transparency nobody else offers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xl hover:shadow-2xl hover:shadow-teal-500/30 transition-all"
              >
                Join 50,000+ Traders
              </button>
              <button className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all">
                Read Our Whitepaper
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO_3D} alt="OracleIQ" className="w-8 h-8 rounded-lg" />
                <span className="font-bold">OracleIQTrader</span>
              </div>
              <p className="text-sm text-slate-500">
                The most transparent trading platform in the world.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Trading Platform</li>
                <li className="hover:text-white cursor-pointer transition-colors">Mobile App</li>
                <li className="hover:text-white cursor-pointer transition-colors">APIs & Tools</li>
                <li className="hover:text-white cursor-pointer transition-colors">Education Hub</li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-white cursor-pointer transition-colors">Press</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Regulatory</li>
                <li className="hover:text-white cursor-pointer transition-colors">Risk Disclosure</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-white cursor-pointer transition-colors">Community</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Status</li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2026 OracleIQTrader. FCA Regulated | MiFID II Compliant | Best Execution Guaranteed
            </p>
            <p className="text-xs text-slate-600 text-center md:text-right max-w-md">
              Past performance is not indicative of future results. Trading leveraged instruments carries high risk.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Mode Modal */}
      {showDemo && <DemoMode onClose={() => setShowDemo(false)} />}
    </div>
  );
};

export default LandingPage;
