import React, { useState, useRef } from 'react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

// Device mockup URLs
const DEVICES = {
  tablet: {
    id: 'tablet',
    name: 'iPad Pro',
    type: 'tablet',
    defaultPosition: { x: -350, y: 50 },
    size: { width: 320, height: 420 },
    rotation: -5,
    zIndex: 1,
    screenContent: {
      portfolio: '$3,299.20',
      change: '+8.4%',
      chart: true
    }
  },
  phone: {
    id: 'phone',
    name: 'iPhone Pro',
    type: 'phone',
    defaultPosition: { x: 0, y: 0 },
    size: { width: 200, height: 400 },
    rotation: 0,
    zIndex: 3,
    screenContent: {
      portfolio: '$3,299.20',
      prices: [
        { symbol: 'BTC', price: '$72,245', change: '+3.6%' },
        { symbol: 'DOGE', price: '$0.384', change: '+50%' },
        { symbol: 'DYDX', price: '$3.04', change: '+30%' }
      ]
    }
  },
  vr: {
    id: 'vr',
    name: 'Vision Pro',
    type: 'vr',
    defaultPosition: { x: 300, y: 80 },
    size: { width: 350, height: 200 },
    rotation: 5,
    zIndex: 2,
    screenContent: {
      portfolio: '+$209.20',
      holographic: true
    }
  }
};

const DraggableDevice = ({ device, onSelect, isSelected, onPositionChange, zIndex }) => {
  const dragControls = useDragControls();
  const [position, setPosition] = useState(device.defaultPosition);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragEnd = (event, info) => {
    const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPos);
    onPositionChange?.(device.id, newPos);
  };

  const renderPhoneScreen = () => (
    <div className="absolute inset-3 rounded-2xl bg-gradient-to-b from-[#0a1628] to-[#0d1f35] overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-[8px] text-white/60">
        <span>9:41</span>
        <span>OracleIQTrader</span>
        <span>●●●</span>
      </div>
      
      {/* Price Ticker */}
      <div className="flex justify-center gap-2 px-2 py-1">
        {device.screenContent.prices?.map((p, i) => (
          <div key={i} className="text-center">
            <div className="text-[7px] text-white/50">{p.symbol}</div>
            <div className="text-[8px] text-white">{p.price}</div>
            <div className={`text-[7px] ${p.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{p.change}</div>
          </div>
        ))}
      </div>

      {/* Portfolio Value */}
      <div className="text-center py-2">
        <div className="text-[8px] text-white/50">Portfolio</div>
        <div className="text-lg font-bold text-white">{device.screenContent.portfolio}</div>
        <div className="flex justify-center gap-2 mt-1">
          <button className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[8px]">Deposit</button>
          <button className="px-3 py-1 rounded-full bg-white/10 text-white text-[8px]">Divide</button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-1">
        <div className="text-[8px] text-white/50 mb-1">Monthly Balance</div>
        <div className="h-24 relative">
          <svg className="w-full h-full" viewBox="0 0 100 50">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,40 Q10,35 20,30 T40,25 T60,20 T80,35 T100,15" fill="none" stroke="#14b8a6" strokeWidth="1.5"/>
            <path d="M0,40 Q10,35 20,30 T40,25 T60,20 T80,35 T100,15 L100,50 L0,50 Z" fill="url(#chartGradient)"/>
          </svg>
          <div className="absolute right-0 top-0 bg-red-500 text-white text-[6px] px-1 rounded">Expert</div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around py-2 bg-black/30">
        {['🏠', '🔍', '📊', '💼', '⚙️'].map((icon, i) => (
          <span key={i} className="text-xs opacity-60">{icon}</span>
        ))}
      </div>
    </div>
  );

  const renderTabletScreen = () => (
    <div className="absolute inset-3 rounded-xl bg-gradient-to-b from-[#0a1628] to-[#0d1f35] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
        <span className="text-[10px] text-white font-medium">OracleIQTrader</span>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px]">+8.4%</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[8px]">DEMO</span>
        </div>
      </div>

      {/* Portfolio Value */}
      <div className="px-4 py-3">
        <div className="text-[8px] text-white/50">Portfolio</div>
        <div className="text-2xl font-bold text-white">{device.screenContent.portfolio}</div>
        <div className="flex gap-2 mt-1">
          <span className="text-[8px] text-white/50">Asset Diversification</span>
          <span className="text-[8px] text-emerald-400">On Track</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 h-32 relative">
        <svg className="w-full h-full" viewBox="0 0 200 80">
          <defs>
            <linearGradient id="tabletGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Candlesticks */}
          {Array.from({ length: 30 }).map((_, i) => {
            const x = i * 6 + 5;
            const height = Math.random() * 30 + 10;
            const y = 40 - height / 2 + Math.sin(i * 0.3) * 15;
            const isGreen = Math.random() > 0.4;
            return (
              <g key={i}>
                <line x1={x} y1={y - 5} x2={x} y2={y + height + 5} stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="0.5"/>
                <rect x={x - 1.5} y={y} width="3" height={height} fill={isGreen ? '#22c55e' : '#ef4444'}/>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Volume */}
      <div className="px-4 h-8">
        <div className="text-[7px] text-white/30 mb-1">VOLUME</div>
        <div className="flex gap-0.5 h-4">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/20" style={{ height: `${Math.random() * 100}%` }}/>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around py-2 px-4 bg-black/30 border-t border-white/10">
        {[
          { label: 'BTC', value: '$72,245' },
          { label: 'ETH', value: '$2,748' },
          { label: 'SOL', value: '$98.45' },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="text-[7px] text-white/50">{item.label}</div>
            <div className="text-[9px] text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVRScreen = () => (
    <div className="absolute inset-0 overflow-hidden">
      {/* VR Headset Shape */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-[40px]">
        {/* Left Lens */}
        <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-[30%] h-[70%] rounded-full bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 border border-purple-500/30 overflow-hidden">
          <div className="absolute inset-2 rounded-full bg-black/50 flex items-center justify-center">
            <svg className="w-3/4 h-1/2" viewBox="0 0 100 50">
              <path d="M0,40 Q25,10 50,25 T100,15" fill="none" stroke="#14b8a6" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Right Lens */}
        <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-[30%] h-[70%] rounded-full bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 border border-purple-500/30 overflow-hidden">
          <div className="absolute inset-2 rounded-full bg-black/50 flex items-center justify-center flex-col">
            <div className="text-white text-sm font-bold">+$209.20</div>
            <div className="text-emerald-400 text-[8px]">+3.2%</div>
          </div>
        </div>

        {/* Center Bridge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white/50">
          OracleIQTrader
        </div>

        {/* Floating Data Points */}
        <div className="absolute top-2 right-4 px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-[8px]">
          ◇ 14bb
        </div>
        <div className="absolute top-8 right-8 px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-[8px]">
          ⬡ 14b8a6
        </div>
        <div className="absolute bottom-4 right-12 px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-[8px]">
          ◇ 14b89a6
        </div>
        <div className="absolute bottom-8 left-4 px-2 py-1 rounded bg-white/10 text-white text-[8px]">
          🏠 11dbff
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ 
        x: device.defaultPosition.x, 
        y: device.defaultPosition.y,
        rotate: device.rotation,
        scale: 0.8,
        opacity: 0
      }}
      animate={{ 
        x: position.x, 
        y: position.y,
        rotate: isHovered ? 0 : device.rotation,
        scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
        opacity: 1,
        zIndex: isSelected ? 100 : zIndex
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onSelect(device.id)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`absolute cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-black/50' : ''}`}
      style={{ 
        width: device.size.width, 
        height: device.size.height,
        zIndex: isSelected ? 100 : zIndex
      }}
    >
      {/* Device Frame */}
      <div className={`w-full h-full rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl shadow-black/50 overflow-hidden relative ${
        device.type === 'vr' ? 'rounded-[40px]' : ''
      }`}>
        {/* Screen Content */}
        {device.type === 'phone' && renderPhoneScreen()}
        {device.type === 'tablet' && renderTabletScreen()}
        {device.type === 'vr' && renderVRScreen()}

        {/* Device Label on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 text-white text-xs whitespace-nowrap"
            >
              {device.name} • Click to expand
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const DeviceShowcase = ({ onGetStarted }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showExpandedView, setShowExpandedView] = useState(false);
  const containerRef = useRef(null);

  const handleDeviceSelect = (deviceId) => {
    if (selectedDevice === deviceId) {
      setShowExpandedView(true);
    } else {
      setSelectedDevice(deviceId);
    }
  };

  const resetPositions = () => {
    setSelectedDevice(null);
    // Force re-render to reset positions
    window.location.reload();
  };

  return (
    <section className="relative min-h-[600px] py-20 overflow-hidden">
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
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trade Anywhere, Any Device
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Drag and interact with our devices. Full feature parity across tablet, phone, and VR.
          </p>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetPositions}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all z-50"
        >
          <RotateCcw size={18} className="text-slate-400" />
        </button>

        {/* Device Container */}
        <div 
          ref={containerRef}
          className="relative h-[500px] flex items-center justify-center"
          data-testid="device-showcase"
        >
          {Object.values(DEVICES).map((device, index) => (
            <DraggableDevice
              key={device.id}
              device={device}
              onSelect={handleDeviceSelect}
              isSelected={selectedDevice === device.id}
              zIndex={device.zIndex}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all"
          >
            Try on Your Device
          </button>
        </div>
      </div>

      {/* Expanded Device Modal */}
      <AnimatePresence>
        {showExpandedView && selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
            onClick={() => setShowExpandedView(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowExpandedView(false)}
                className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              >
                <X size={24} className="text-white" />
              </button>

              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white">{DEVICES[selectedDevice]?.name}</h3>
                  <p className="text-slate-400">Full platform experience</p>
                </div>

                {/* Placeholder for expanded view */}
                <div className="aspect-video bg-[#0a1628] rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      {selectedDevice === 'phone' ? '📱' : selectedDevice === 'tablet' ? '📲' : '🥽'}
                    </div>
                    <div className="text-white text-xl font-bold">$3,299.20</div>
                    <div className="text-emerald-400">+8.4% Today</div>
                    <button
                      onClick={onGetStarted}
                      className="mt-6 px-6 py-3 rounded-xl bg-teal-500 text-white font-semibold"
                    >
                      Open Full App
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default DeviceShowcase;
