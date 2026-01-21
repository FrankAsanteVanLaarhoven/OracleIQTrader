import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { 
  Mic, MicOff, Volume2, VolumeX, 
  Maximize2, Minimize2, Brain, Activity,
  TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create face mesh geometry with 68 landmarks
const createFaceMeshGeometry = (emotion = 'neutral', speaking = false, time = 0) => {
  const vertices = [];
  const indices = [];
  
  // Face oval contour (17 points)
  for (let i = 0; i < 17; i++) {
    const angle = (i / 16) * Math.PI;
    const x = Math.sin(angle) * 1.3;
    const y = -Math.cos(angle) * 1.6 + 0.2;
    const z = Math.cos(angle * 0.5) * 0.15;
    vertices.push(x, y, z);
  }
  
  // Eyebrow height varies with emotion
  const eyebrowY = emotion === 'excited' ? 1.0 : emotion === 'concerned' ? 0.7 : 0.85;
  const eyebrowCurve = emotion === 'concerned' ? -0.08 : 0.05;
  
  // Right eyebrow (5 points) - indices 17-21
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = 0.25 + t * 0.55;
    const y = eyebrowY + Math.sin(t * Math.PI) * eyebrowCurve;
    vertices.push(x, y, 0.15);
  }
  
  // Left eyebrow (5 points) - indices 22-26
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = -0.25 - t * 0.55;
    const y = eyebrowY + Math.sin(t * Math.PI) * eyebrowCurve;
    vertices.push(x, y, 0.15);
  }
  
  // Nose bridge (4 points) - indices 27-30
  for (let i = 0; i < 4; i++) {
    vertices.push(0, 0.5 - i * 0.25, 0.25 + i * 0.05);
  }
  
  // Nose bottom (5 points) - indices 31-35
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.13;
    vertices.push(x, -0.2, 0.2);
  }
  
  // Eye animation
  const blinkAmount = Math.sin(time * 2.5) > 0.97 ? 0.01 : 0.1;
  const eyeOpenness = emotion === 'excited' ? 0.12 : emotion === 'concerned' ? 0.06 : blinkAmount;
  
  // Right eye (6 points) - indices 36-41
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = 0.42 + Math.cos(angle) * 0.15;
    const y = 0.5 + Math.sin(angle) * eyeOpenness;
    vertices.push(x, y, 0.18);
  }
  
  // Left eye (6 points) - indices 42-47
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = -0.42 + Math.cos(angle) * 0.15;
    const y = 0.5 + Math.sin(angle) * eyeOpenness;
    vertices.push(x, y, 0.18);
  }
  
  // Mouth animation
  const mouthOpen = speaking ? 0.12 + Math.sin(time * 12) * 0.08 : 0.02;
  const smileAmount = emotion === 'happy' || emotion === 'excited' ? 0.12 : 
                      emotion === 'concerned' ? -0.08 : 0;
  
  // Outer lip (12 points) - indices 48-59
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * 0.3;
    const yBase = -0.55 + Math.sin(angle) * 0.08;
    const smile = Math.abs(x) > 0.15 ? smileAmount * (1 - Math.abs(Math.sin(angle))) : 0;
    const openOffset = Math.sin(angle) > 0 ? mouthOpen : -mouthOpen * 0.3;
    vertices.push(x, yBase + smile + openOffset, 0.12);
  }
  
  // Inner lip (8 points) - indices 60-67
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 0.2;
    const yBase = -0.55 + Math.sin(angle) * 0.04;
    const openOffset = Math.sin(angle) > 0 ? mouthOpen * 0.6 : -mouthOpen * 0.2;
    vertices.push(x, yBase + openOffset, 0.15);
  }
  
  return new Float32Array(vertices);
};

// Face Mesh Lines Component
const FaceMeshLines = ({ emotion, speaking, color }) => {
  const meshRef = useRef();
  const [time, setTime] = useState(0);
  
  // Connection indices for lines
  const connections = useMemo(() => [
    // Face contour
    ...Array.from({length: 16}, (_, i) => [i, i+1]).flat(),
    // Right eyebrow
    17,18, 18,19, 19,20, 20,21,
    // Left eyebrow
    22,23, 23,24, 24,25, 25,26,
    // Nose
    27,28, 28,29, 29,30, 31,32, 32,33, 33,34, 34,35, 30,33,
    // Right eye
    36,37, 37,38, 38,39, 39,40, 40,41, 41,36,
    // Left eye
    42,43, 43,44, 44,45, 45,46, 46,47, 47,42,
    // Outer lip
    48,49, 49,50, 50,51, 51,52, 52,53, 53,54, 54,55, 55,56, 56,57, 57,58, 58,59, 59,48,
    // Inner lip
    60,61, 61,62, 62,63, 63,64, 64,65, 65,66, 66,67, 67,60,
    // Cross connections for mesh effect
    0,27, 16,27, 8,30, 4,31, 12,35,
    17,36, 21,39, 22,42, 26,45,
    33,51, 33,57, 48,4, 54,12,
  ], []);
  
  useFrame((state) => {
    setTime(state.clock.elapsedTime);
    if (meshRef.current) {
      // Subtle head movement
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });
  
  const vertices = useMemo(() => createFaceMeshGeometry(emotion, speaking, time), [emotion, speaking, time]);
  
  // Create line positions from vertex pairs
  const linePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < connections.length; i += 2) {
      const idx1 = connections[i] * 3;
      const idx2 = connections[i + 1] * 3;
      if (idx1 < vertices.length && idx2 < vertices.length) {
        positions.push(
          vertices[idx1], vertices[idx1 + 1], vertices[idx1 + 2],
          vertices[idx2], vertices[idx2 + 1], vertices[idx2 + 2]
        );
      }
    }
    return new Float32Array(positions);
  }, [vertices, connections]);
  
  return (
    <group ref={meshRef}>
      {/* Main mesh lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={linePositions}
            count={linePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </lineSegments>
      
      {/* Vertex points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={vertices}
            count={vertices.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.06} sizeAttenuation transparent opacity={1} />
      </points>
      
      {/* Glow sphere behind face */}
      <mesh position={[0, 0, -0.5]}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      
      {/* Inner glow */}
      <mesh position={[0, 0, -0.2]}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
    </group>
  );
};

// Confidence Number Display
const ConfidenceDisplay = ({ value, color }) => {
  return (
    <group position={[-2, 1.5, 0]}>
      <mesh>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// Main Scene
const AvatarScene = ({ emotion, speaking, confidence }) => {
  const emotionColors = {
    excited: '#22c55e',
    happy: '#10b981',
    concerned: '#f59e0b',
    neutral: '#14b8a6',
    focused: '#3b82f6'
  };
  
  const color = emotionColors[emotion] || emotionColors.neutral;
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.3} />
      <pointLight position={[-5, 5, 5]} intensity={0.3} color={color} />
      
      <FaceMeshLines emotion={emotion} speaking={speaking} color={color} />
      <ConfidenceDisplay value={confidence} color={color} />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2} 
        minPolarAngle={Math.PI / 3}
        autoRotate={false}
      />
    </>
  );
};

// Fallback 2D Avatar when WebGL not available
const Avatar2D = ({ emotion, speaking, confidence }) => {
  const emotionColors = {
    excited: '#22c55e',
    happy: '#10b981',
    concerned: '#f59e0b',
    neutral: '#14b8a6',
    focused: '#3b82f6'
  };
  
  const color = emotionColors[emotion] || emotionColors.neutral;
  
  // SVG face mesh
  const eyeY = emotion === 'excited' ? 35 : emotion === 'concerned' ? 40 : 38;
  const mouthCurve = emotion === 'happy' || emotion === 'excited' ? -10 : 
                     emotion === 'concerned' ? 5 : 0;
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow background */}
      <div 
        className="absolute inset-0 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      />
      
      {/* Confidence badge */}
      <div className="absolute top-4 left-4 text-4xl font-bold" style={{ color }}>
        {confidence}
      </div>
      
      <svg viewBox="0 0 100 120" className="w-4/5 h-4/5 max-w-[300px]">
        {/* Face outline */}
        <ellipse 
          cx="50" cy="55" rx="35" ry="45" 
          fill="none" 
          stroke={color} 
          strokeWidth="1.5"
          opacity="0.8"
        />
        
        {/* Mesh grid lines - horizontal */}
        {[25, 40, 55, 70, 85].map((y, i) => (
          <path
            key={`h${i}`}
            d={`M ${15 + Math.abs(y - 55) * 0.3} ${y} Q 50 ${y + (y > 55 ? 5 : -5)} ${85 - Math.abs(y - 55) * 0.3} ${y}`}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.5"
          />
        ))}
        
        {/* Mesh grid lines - vertical */}
        {[30, 40, 50, 60, 70].map((x, i) => (
          <path
            key={`v${i}`}
            d={`M ${x} 15 Q ${x + (x - 50) * 0.1} 55 ${x} 95`}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.5"
          />
        ))}
        
        {/* Left eyebrow */}
        <path
          d={`M 25 ${eyeY - 8} Q 35 ${eyeY - 12} 42 ${eyeY - 8}`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        
        {/* Right eyebrow */}
        <path
          d={`M 58 ${eyeY - 8} Q 65 ${eyeY - 12} 75 ${eyeY - 8}`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        
        {/* Left eye */}
        <ellipse 
          cx="33" cy={eyeY} rx="8" ry={speaking ? 4 : 5}
          fill="none" 
          stroke={color} 
          strokeWidth="1.5"
        />
        <circle cx="33" cy={eyeY} r="2" fill={color} />
        
        {/* Right eye */}
        <ellipse 
          cx="67" cy={eyeY} rx="8" ry={speaking ? 4 : 5}
          fill="none" 
          stroke={color} 
          strokeWidth="1.5"
        />
        <circle cx="67" cy={eyeY} r="2" fill={color} />
        
        {/* Nose */}
        <path
          d="M 50 45 L 50 60 M 45 62 Q 50 65 55 62"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        
        {/* Mouth */}
        <path
          d={`M 35 75 Q 50 ${75 + mouthCurve + (speaking ? Math.sin(Date.now() / 100) * 5 : 0)} 65 75`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        
        {/* Vertex points */}
        {[
          [50, 15], [30, 20], [70, 20], [20, 35], [80, 35],
          [15, 55], [85, 55], [20, 75], [80, 75], [30, 90], [70, 90], [50, 98],
          [33, eyeY], [67, eyeY], [50, 60], [42, 75], [58, 75]
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.8" />
        ))}
      </svg>
    </div>
  );
};

// Main Trading Avatar Component
const TradingAvatar = ({ marketData = {}, onInsight }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [message, setMessage] = useState('');
  const [confidence, setConfidence] = useState(68);
  const [isLoading, setIsLoading] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const audioRef = useRef(null);
  
  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);
  
  // Determine emotion based on market data
  useEffect(() => {
    const btcChange = marketData.btc_change || 0;
    if (btcChange > 3) {
      setEmotion('excited');
      setConfidence(Math.min(95, 68 + Math.abs(btcChange) * 3));
    } else if (btcChange < -3) {
      setEmotion('concerned');
      setConfidence(Math.max(40, 68 - Math.abs(btcChange) * 3));
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
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(`You said: "${transcript}"`);
      generateInsight();
    };
    
    recognition.start();
  }, [isListening, generateInsight]);
  
  const emotionIcons = {
    excited: <TrendingUp className="text-emerald-400" size={16} />,
    happy: <TrendingUp className="text-emerald-400" size={16} />,
    concerned: <TrendingDown className="text-amber-400" size={16} />,
    neutral: <Activity className="text-teal-400" size={16} />,
    focused: <Brain className="text-blue-400" size={16} />
  };
  
  const emotionColors = {
    excited: 'border-emerald-500/50',
    happy: 'border-emerald-500/50',
    concerned: 'border-amber-500/50',
    neutral: 'border-teal-500/50',
    focused: 'border-blue-500/50'
  };
  
  return (
    <div className={`${isExpanded ? 'fixed inset-4 z-50' : 'relative'}`} data-testid="trading-avatar">
      <audio ref={audioRef} className="hidden" />
      
      <div className={`h-full min-h-[400px] rounded-2xl overflow-hidden bg-black/90 backdrop-blur-xl border-2 ${emotionColors[emotion]} transition-colors duration-500 ${isExpanded ? '' : ''}`}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center gap-2">
            <StatusBadge variant={isSpeaking ? 'active' : 'default'} pulse={isSpeaking}>
              {emotionIcons[emotion]}
              <span className="text-xs font-mono uppercase">{emotion}</span>
            </StatusBadge>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
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
        
        {/* 3D Canvas or 2D Fallback */}
        <div className="w-full h-full">
          {webGLSupported ? (
            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }}
            >
              <Suspense fallback={null}>
                <AvatarScene emotion={emotion} speaking={isSpeaking} confidence={confidence} />
              </Suspense>
            </Canvas>
          ) : (
            <Avatar2D emotion={emotion} speaking={isSpeaking} confidence={confidence} />
          )}
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
