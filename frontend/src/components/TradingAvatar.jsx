import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Volume2, VolumeX, 
  Maximize2, Minimize2, Brain, Activity,
  TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Animated SVG Face Mesh Component
const AnimatedFaceMesh = ({ emotion, speaking, confidence }) => {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  const emotionColors = {
    excited: '#22c55e',
    happy: '#10b981',
    concerned: '#f59e0b',
    neutral: '#14b8a6',
    focused: '#3b82f6'
  };
  
  const color = emotionColors[emotion] || emotionColors.neutral;
  
  // Animation calculations
  const time = frame * 0.05;
  const blinkCycle = Math.sin(time * 2.5);
  const isBlinking = blinkCycle > 0.97;
  const breathe = Math.sin(time * 0.8) * 0.02;
  const headTilt = Math.sin(time * 0.3) * 2;
  
  // Eye animation
  const eyeOpenness = isBlinking ? 1 : (emotion === 'excited' ? 6 : emotion === 'concerned' ? 3 : 5);
  
  // Mouth animation
  const mouthOpen = speaking ? 4 + Math.sin(time * 12) * 3 : 0;
  const smileAmount = emotion === 'happy' || emotion === 'excited' ? -8 : 
                      emotion === 'concerned' ? 4 : 0;
  
  // Eyebrow position
  const eyebrowY = emotion === 'excited' ? -2 : emotion === 'concerned' ? 3 : 0;
  
  // Generate mesh grid points
  const generateGridPoints = () => {
    const points = [];
    const rows = 8;
    const cols = 6;
    
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = 20 + (c / cols) * 60;
        const y = 15 + (r / rows) * 90;
        
        // Apply face oval distortion
        const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 55, 2));
        const ovalFactor = Math.max(0, 1 - distFromCenter / 50);
        
        if (ovalFactor > 0.1) {
          points.push({ x, y, opacity: ovalFactor });
        }
      }
    }
    return points;
  };
  
  const gridPoints = useMemo(() => generateGridPoints(), []);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 60%)`,
        }}
      />
      
      {/* Confidence number */}
      <div 
        className="absolute top-6 left-6 font-mono font-bold text-5xl"
        style={{ color, textShadow: `0 0 20px ${color}80` }}
      >
        {confidence}
      </div>
      
      {/* Main SVG */}
      <svg 
        viewBox="0 0 100 120" 
        className="w-full h-full max-w-[400px] max-h-[450px]"
        style={{ transform: `rotate(${headTilt}deg) scale(${1 + breathe})` }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Stronger glow for points */}
          <filter id="pointGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background mesh grid */}
        <g filter="url(#glow)" opacity="0.3">
          {/* Horizontal lines */}
          {[20, 35, 50, 65, 80, 95].map((y, i) => (
            <path
              key={`h${i}`}
              d={`M 15 ${y} Q 50 ${y + Math.sin(time + i) * 2} 85 ${y}`}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
          ))}
          {/* Vertical lines */}
          {[25, 37.5, 50, 62.5, 75].map((x, i) => (
            <path
              key={`v${i}`}
              d={`M ${x} 15 Q ${x + Math.sin(time + i) * 2} 55 ${x} 100`}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
            />
          ))}
        </g>
        
        {/* Face outline - main contour */}
        <ellipse 
          cx="50" cy="55" rx="32" ry="42" 
          fill="none" 
          stroke={color} 
          strokeWidth="1.5"
          filter="url(#glow)"
          opacity="0.9"
        />
        
        {/* Secondary contour */}
        <ellipse 
          cx="50" cy="55" rx="28" ry="38" 
          fill="none" 
          stroke={color} 
          strokeWidth="0.8"
          filter="url(#glow)"
          opacity="0.5"
        />
        
        {/* Forehead lines */}
        <path
          d={`M 25 30 Q 50 ${25 + Math.sin(time) * 2} 75 30`}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          filter="url(#glow)"
          opacity="0.6"
        />
        
        {/* Left eyebrow */}
        <g filter="url(#glow)">
          <path
            d={`M 28 ${38 + eyebrowY} Q 35 ${33 + eyebrowY} 44 ${36 + eyebrowY}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        {/* Right eyebrow */}
        <g filter="url(#glow)">
          <path
            d={`M 56 ${36 + eyebrowY} Q 65 ${33 + eyebrowY} 72 ${38 + eyebrowY}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        {/* Left eye */}
        <g filter="url(#glow)">
          <ellipse 
            cx="36" cy="48" rx="8" ry={eyeOpenness}
            fill="none" 
            stroke={color} 
            strokeWidth="1.5"
          />
          {/* Pupil */}
          <circle 
            cx={36 + Math.sin(time * 0.5) * 2} 
            cy="48" 
            r="2.5" 
            fill={color}
          />
          {/* Eye highlight */}
          <circle cx="34" cy="46" r="1" fill="white" opacity="0.8" />
        </g>
        
        {/* Right eye */}
        <g filter="url(#glow)">
          <ellipse 
            cx="64" cy="48" rx="8" ry={eyeOpenness}
            fill="none" 
            stroke={color} 
            strokeWidth="1.5"
          />
          {/* Pupil */}
          <circle 
            cx={64 + Math.sin(time * 0.5) * 2} 
            cy="48" 
            r="2.5" 
            fill={color}
          />
          {/* Eye highlight */}
          <circle cx="62" cy="46" r="1" fill="white" opacity="0.8" />
        </g>
        
        {/* Nose */}
        <g filter="url(#glow)" opacity="0.8">
          <path
            d="M 50 42 L 50 60"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
          <path
            d="M 44 63 Q 47 67 50 65 Q 53 67 56 63"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        </g>
        
        {/* Mouth */}
        <g filter="url(#glow)">
          {/* Upper lip */}
          <path
            d={`M 38 ${78 + smileAmount} Q 44 ${75 + smileAmount - mouthOpen} 50 ${76 + smileAmount - mouthOpen} Q 56 ${75 + smileAmount - mouthOpen} 62 ${78 + smileAmount}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
          {/* Lower lip */}
          <path
            d={`M 38 ${78 + smileAmount} Q 50 ${82 + smileAmount + mouthOpen} 62 ${78 + smileAmount}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
          {/* Mouth opening */}
          {speaking && (
            <ellipse
              cx="50"
              cy={78 + smileAmount}
              rx="8"
              ry={mouthOpen * 0.8}
              fill={`${color}20`}
              stroke={color}
              strokeWidth="0.5"
            />
          )}
        </g>
        
        {/* Cheekbones */}
        <g filter="url(#glow)" opacity="0.5">
          <path d="M 22 55 Q 28 60 30 70" fill="none" stroke={color} strokeWidth="0.8" />
          <path d="M 78 55 Q 72 60 70 70" fill="none" stroke={color} strokeWidth="0.8" />
        </g>
        
        {/* Jaw lines */}
        <g filter="url(#glow)" opacity="0.6">
          <path d="M 25 70 Q 35 90 50 95" fill="none" stroke={color} strokeWidth="0.8" />
          <path d="M 75 70 Q 65 90 50 95" fill="none" stroke={color} strokeWidth="0.8" />
        </g>
        
        {/* Key landmark points */}
        <g filter="url(#pointGlow)">
          {/* Face contour points */}
          {[[50, 13], [30, 18], [70, 18], [20, 35], [80, 35], [18, 55], [82, 55], 
            [20, 75], [80, 75], [30, 90], [70, 90], [50, 97]].map(([x, y], i) => (
            <circle key={`fc${i}`} cx={x} cy={y} r="2" fill={color} />
          ))}
          
          {/* Eye points */}
          {[[28, 48], [36, 43], [44, 48], [36, 53],
            [56, 48], [64, 43], [72, 48], [64, 53]].map(([x, y], i) => (
            <circle key={`ep${i}`} cx={x} cy={y} r="1.5" fill={color} />
          ))}
          
          {/* Nose points */}
          {[[50, 42], [50, 52], [50, 60], [44, 63], [56, 63]].map(([x, y], i) => (
            <circle key={`np${i}`} cx={x} cy={y} r="1.5" fill={color} />
          ))}
          
          {/* Mouth points */}
          {[[38, 78 + smileAmount], [44, 76 + smileAmount], [50, 76 + smileAmount], 
            [56, 76 + smileAmount], [62, 78 + smileAmount], [50, 82 + smileAmount]].map(([x, y], i) => (
            <circle key={`mp${i}`} cx={x} cy={y} r="1.5" fill={color} />
          ))}
          
          {/* Eyebrow points */}
          {[[28, 38 + eyebrowY], [36, 34 + eyebrowY], [44, 36 + eyebrowY],
            [56, 36 + eyebrowY], [64, 34 + eyebrowY], [72, 38 + eyebrowY]].map(([x, y], i) => (
            <circle key={`eb${i}`} cx={x} cy={y} r="1.5" fill={color} />
          ))}
        </g>
        
        {/* Connection lines between landmarks */}
        <g filter="url(#glow)" opacity="0.4">
          {/* Cross mesh lines */}
          <line x1="50" y1="13" x2="50" y2="42" stroke={color} strokeWidth="0.5" />
          <line x1="30" y1="18" x2="36" y2="43" stroke={color} strokeWidth="0.5" />
          <line x1="70" y1="18" x2="64" y2="43" stroke={color} strokeWidth="0.5" />
          <line x1="36" y1="53" x2="44" y2="63" stroke={color} strokeWidth="0.5" />
          <line x1="64" y1="53" x2="56" y2="63" stroke={color} strokeWidth="0.5" />
          <line x1="50" y1="65" x2="50" y2={76 + smileAmount} stroke={color} strokeWidth="0.5" />
        </g>
      </svg>
      
      {/* Particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}`,
              left: `${30 + Math.sin(time + i * 0.8) * 20 + i * 5}%`,
              top: `${40 + Math.cos(time + i * 0.5) * 15 + i * 3}%`,
              opacity: 0.3 + Math.sin(time * 2 + i) * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Main Trading Avatar Component
const TradingAvatar = ({ marketData = {}, onInsight, onTradeCommand }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [message, setMessage] = useState('');
  const [confidence, setConfidence] = useState(68);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  
  // Announce trade function (can be called externally)
  const announceTrade = useCallback(async (tradeData) => {
    try {
      const response = await fetch(`${API}/avatar/announce-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setEmotion(data.emotion);
        
        if (data.audio && !isMuted && audioRef.current) {
          audioRef.current.src = `data:audio/mp3;base64,${data.audio}`;
          setIsSpeaking(true);
          audioRef.current.play().catch(console.error);
          audioRef.current.onended = () => setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error('Trade announcement error:', error);
    }
  }, [isMuted]);
  
  // Expose announceTrade via ref or callback
  useEffect(() => {
    if (onInsight) {
      // Pass the announce function to parent
      onInsight({ announceTrade });
    }
  }, [announceTrade, onInsight]);
  
  // Determine emotion based on market data
  useEffect(() => {
    const btcChange = marketData.btc_change || 0;
    if (btcChange > 3) {
      setEmotion('excited');
      setConfidence(Math.min(95, Math.round(68 + Math.abs(btcChange) * 3)));
    } else if (btcChange < -3) {
      setEmotion('concerned');
      setConfidence(Math.max(40, Math.round(68 - Math.abs(btcChange) * 3)));
    } else if (btcChange > 0) {
      setEmotion('happy');
      setConfidence(Math.round(68 + btcChange * 2));
    } else {
      setEmotion('neutral');
      setConfidence(68);
    }
  }, [marketData]);
  
  // Generate insight and speak
  const generateInsight = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/avatar/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          emotion,
          market_context: marketData
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate insight');
      
      const data = await response.json();
      setMessage(data.message);
      setEmotion(data.emotion);
      
      if (data.audio && !isMuted) {
        const audioUrl = `data:audio/mp3;base64,${data.audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          setIsSpeaking(true);
          audioRef.current.play().catch(console.error);
          audioRef.current.onended = () => setIsSpeaking(false);
        }
      }
      
      if (onInsight) onInsight(data);
    } catch (error) {
      console.error('Insight error:', error);
      setMessage('Unable to generate insight at this time.');
    } finally {
      setIsLoading(false);
    }
  }, [emotion, marketData, isMuted, isLoading, onInsight]);
  
  // Voice recognition
  const toggleListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setMessage('Voice recognition not supported in this browser.');
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setMessage('Listening... Say a command like "Buy 1 BTC"');
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(`Processing: "${transcript}"`);
      
      // Send to voice command API
      try {
        const response = await fetch(`${API}/voice/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, context: marketData })
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessage(data.response);
          
          // Play audio response
          if (data.audio && !isMuted && audioRef.current) {
            audioRef.current.src = `data:audio/mp3;base64,${data.audio}`;
            setIsSpeaking(true);
            audioRef.current.play().catch(console.error);
            audioRef.current.onended = () => setIsSpeaking(false);
          }
          
          // Handle action
          if (data.action_data && onTradeCommand) {
            onTradeCommand(data.action_data);
          }
        }
      } catch (error) {
        console.error('Voice command error:', error);
        setMessage('Sorry, I had trouble processing that command.');
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setMessage("I didn't hear anything. Try again!");
      } else {
        setMessage('Voice recognition error. Please try again.');
      }
    };
    
    recognition.start();
  }, [isListening, marketData, isMuted, onTradeCommand]);
  
  const emotionIcons = {
    excited: <TrendingUp className="text-emerald-400" size={16} />,
    happy: <TrendingUp className="text-emerald-400" size={16} />,
    concerned: <TrendingDown className="text-amber-400" size={16} />,
    neutral: <Activity className="text-teal-400" size={16} />,
    focused: <Brain className="text-blue-400" size={16} />
  };
  
  const emotionColors = {
    excited: 'border-emerald-500/50 shadow-emerald-500/20',
    happy: 'border-emerald-500/50 shadow-emerald-500/20',
    concerned: 'border-amber-500/50 shadow-amber-500/20',
    neutral: 'border-teal-500/50 shadow-teal-500/20',
    focused: 'border-blue-500/50 shadow-blue-500/20'
  };
  
  return (
    <div className={`${isExpanded ? 'fixed inset-4 z-50' : 'relative'}`} data-testid="trading-avatar">
      <audio ref={audioRef} className="hidden" />
      
      <div className={`h-full min-h-[450px] rounded-2xl overflow-hidden bg-black/95 backdrop-blur-xl border-2 shadow-lg ${emotionColors[emotion]} transition-all duration-500`}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <StatusBadge variant={isSpeaking ? 'active' : 'default'} pulse={isSpeaking}>
              {emotionIcons[emotion]}
              <span className="text-xs font-mono uppercase">{emotion}</span>
            </StatusBadge>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
              data-testid="avatar-mute-btn"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              data-testid="avatar-expand-btn"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
        
        {/* Animated Face Mesh */}
        <div className="w-full h-full pt-16 pb-32">
          <AnimatedFaceMesh emotion={emotion} speaking={isSpeaking} confidence={confidence} />
        </div>
        
        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 to-transparent">
          {/* Message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-sm text-white/90 text-center"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-3">
            <NeonButton
              onClick={toggleListening}
              variant={isListening ? 'teal' : 'white'}
              size="sm"
              data-testid="avatar-mic-btn"
            >
              {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
            </NeonButton>
            
            <NeonButton
              onClick={generateInsight}
              variant="teal"
              disabled={isLoading}
              data-testid="avatar-speak-btn"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
              <span className="ml-2">{isLoading ? 'Thinking...' : 'Get Insight'}</span>
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAvatar;
