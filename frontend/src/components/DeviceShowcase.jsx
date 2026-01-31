import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tablet, Glasses, Zap, Bell, Fingerprint, Monitor } from 'lucide-react';

// Multi-device showcase image
const DEVICE_SHOWCASE_IMAGE = "https://customer-assets.emergentagent.com/job_tradehub-380/artifacts/0biltc25_%243299.20.png";

const DeviceShowcase = ({ onGetStarted }) => {
  const features = [
    { icon: Zap, label: 'Real-time Prices' },
    { icon: Bell, label: 'Push Alerts' },
    { icon: Fingerprint, label: 'Biometric Login' },
    { icon: Monitor, label: 'PWA Support' },
  ];

  return (
    <section className="relative py-20 overflow-hidden" data-testid="device-showcase">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a1628] to-[#050505]">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Device Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-purple-500/20 blur-3xl" />
              
              {/* Main Image */}
              <motion.img
                src={DEVICE_SHOWCASE_IMAGE}
                alt="OracleIQTrader on Tablet, Phone, and VR"
                className="relative w-full max-w-xl mx-auto drop-shadow-2xl"
                initial={{ y: 20 }}
                animate={{ y: [20, -10, 20] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                Trade On The Go
              </span>
            </h2>
            
            <p className="text-lg text-slate-400 mb-8">
              Download our mobile app and access real-time trading, AI predictions, 
              and portfolio analytics from anywhere in the world.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <feature.icon className="w-5 h-5 text-teal-400" />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-slate-500">Download on</div>
                  <div className="text-white font-semibold">App Store</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5m18-8.5l-12 12v-24l12 12z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-slate-500">Get it on</div>
                  <div className="text-white font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeviceShowcase;
