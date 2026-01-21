import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { 
  Mic, MicOff, Volume2, VolumeX, Settings, 
  Maximize2, Minimize2, Brain, Activity,
  TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import StatusBadge from './StatusBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// 68-point facial landmark positions (normalized)
const LANDMARK_CONNECTIONS = [
  // Face contour
  [0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8], [8,9], [9,10], [10,11], [11,12], [12,13], [13,14], [14,15], [15,16],
  // Right eyebrow
  [17,18], [18,19], [19,20], [20,21],
  // Left eyebrow
  [22,23], [23,24], [24,25], [25,26],
  // Nose bridge
  [27,28], [28,29], [29,30],
  // Lower nose
  [31,32], [32,33], [33,34], [34,35],
  // Right eye
  [36,37], [37,38], [38,39], [39,40], [40,41], [41,36],
  // Left eye
  [42,43], [43,44], [44,45], [45,46], [46,47], [47,42],
  // Outer lip
  [48,49], [49,50], [50,51], [51,52], [52,53], [53,54], [54,55], [55,56], [56,57], [57,58], [58,59], [59,48],
  // Inner lip
  [60,61], [61,62], [62,63], [63,64], [64,65], [65,66], [66,67], [67,60],
];

// Generate 68 landmark positions for a face mesh
const generateLandmarks = (emotion = 'neutral', speaking = false, time = 0) => {
  const landmarks = [];
  
  // Base face shape (oval)
  const facePoints = 17;
  for (let i = 0; i < facePoints; i++) {
    const angle = (i / (facePoints - 1)) * Math.PI;
    const x = Math.sin(angle) * 1.2;
    const y = -Math.cos(angle) * 1.5 + 0.3;
    landmarks.push([x, y, 0]);
  }
  
  // Eyebrows
  const eyebrowY = emotion === 'excited' ? 0.95 : emotion === 'concerned' ? 0.75 : 0.85;
  for (let i = 0; i < 5; i++) { // Right eyebrow
    landmarks.push([0.3 + i * 0.15, eyebrowY + (i === 2 ? 0.05 : 0), 0.1]);
  }
  for (let i = 0; i < 5; i++) { // Left eyebrow
    landmarks.push([-0.3 - i * 0.15, eyebrowY + (i === 2 ? 0.05 : 0), 0.1]);
  }
  
  // Nose
  for (let i = 0; i < 4; i++) { // Bridge
    landmarks.push([0, 0.6 - i * 0.25, 0.2 + i * 0.05]);
  }
  for (let i = 0; i < 5; i++) { // Bottom
    const x = (i - 2) * 0.12;
    landmarks.push([x, -0.15, 0.15]);
  }
  
  // Eyes
  const blinkAmount = Math.sin(time * 3) > 0.95 ? 0.02 : 0.08;
  // Right eye
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = 0.4 + Math.cos(angle) * 0.12;
    const y = 0.5 + Math.sin(angle) * blinkAmount;
    landmarks.push([x, y, 0.12]);
  }
  // Left eye
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = -0.4 + Math.cos(angle) * 0.12;
    const y = 0.5 + Math.sin(angle) * blinkAmount;
    landmarks.push([x, y, 0.12]);
  }
  
  // Mouth
  const mouthOpenAmount = speaking ? 0.08 + Math.sin(time * 15) * 0.06 : 
                          emotion === 'happy' || emotion === 'excited' ? 0.04 : 0.02;
  const smileAmount = emotion === 'happy' || emotion === 'excited' ? 0.1 : 
                      emotion === 'concerned' ? -0.05 : 0;
  
  // Outer lip
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * 0.25;
    const yBase = -0.5 + Math.sin(angle) * 0.08;
    const smile = Math.abs(x) > 0.15 ? smileAmount * (1 - Math.abs(Math.sin(angle))) : 0;
    landmarks.push([x, yBase + smile + (Math.sin(angle) > 0 ? mouthOpenAmount : -mouthOpenAmount * 0.5), 0.1]);
  }
  
  // Inner lip
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 0.18;
    const yBase = -0.5 + Math.sin(angle) * 0.05;
    landmarks.push([x, yBase + (Math.sin(angle) > 0 ? mouthOpenAmount * 0.7 : -mouthOpenAmount * 0.3), 0.12]);
  }
  
  return landmarks;
};

// Face Mesh Component
const FaceMesh = ({ landmarks, color = '#00d4aa' }) => {
  const meshRef = useRef();
  const linesRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });
  
  // Create geometry from landmarks
  const points = landmarks.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  
  // Create line segments for mesh
  const linePositions = [];
  LANDMARK_CONNECTIONS.forEach(([start, end]) => {
    if (landmarks[start] && landmarks[end]) {
      linePositions.push(...landmarks[start], ...landmarks[end]);
    }
  });
  
  // Add points as spheres
  const pointGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group ref={meshRef}>
      {/* Landmark points */}
      <points geometry={pointGeometry}>
        <pointsMaterial color={color} size={0.03} sizeAttenuation={true} />
      </points>
      
      {/* Connection lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(linePositions)}
            count={linePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={1} />
      </lineSegments>
      
      {/* Glow effect sphere behind */}
      <mesh position={[0, 0.1, -0.3]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
    </group>
  );
};

// Confidence Badge
const ConfidenceBadge = ({ value }) => {
  return (
    <Text
      position={[-1.5, 1.3, 0]}
      fontSize={0.5}
      color="#00d4aa"
      anchorX="left"
      anchorY="middle"
      font="/fonts/mono.woff"
    >
      {value}
    </Text>
  );
};

// Main Avatar Scene
const AvatarScene = ({ emotion, speaking, confidence }) => {
  const [time, setTime] = useState(0);
  const landmarks = generateLandmarks(emotion, speaking, time);
  
  useFrame((state) => {
    setTime(state.clock.elapsedTime);
  });
  
  const emotionColor = {
    excited: '#22c55e',
    happy: '#10b981',
    concerned: '#f59e0b',
    neutral: '#00d4aa',
    focused: '#3b82f6'
  }[emotion] || '#00d4aa';
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <FaceMesh landmarks={landmarks} color={emotionColor} />
      <ConfidenceBadge value={confidence} />
    </>
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
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const audioRef = useRef(null);
  
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
      setConfidence(68 + btcChange * 2);
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
        // Play audio
        const audioUrl = `data:audio/mp3;base64,${data.audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsSpeaking(true);
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
  
  // Auto-generate insights periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpeaking && !isLoading && Math.random() > 0.7) {
        generateInsight();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [generateInsight, isSpeaking, isLoading]);
  
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
      // Process voice command
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
  
  return (
    <div className={`${isExpanded ? 'fixed inset-4 z-50' : 'relative'}`} data-testid="trading-avatar">
      <audio ref={audioRef} className="hidden" />
      
      <div className={`h-full rounded-2xl overflow-hidden bg-black/80 backdrop-blur-xl border border-white/10 ${isExpanded ? '' : 'aspect-square'}`}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <StatusBadge variant={isSpeaking ? 'active' : 'default'} pulse={isSpeaking}>
              {emotionIcons[emotion]}
              <span className="text-xs font-mono uppercase">{emotion}</span>
            </StatusBadge>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
              data-testid="avatar-mute-btn"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
              data-testid="avatar-expand-btn"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
        
        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <AvatarScene emotion={emotion} speaking={isSpeaking} confidence={Math.round(confidence)} />
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
          </Suspense>
        </Canvas>
        
        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
          {/* Message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm text-sm text-white/90 text-center"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-2">
            <NeonButton
              onClick={toggleListening}
              variant={isListening ? 'teal' : 'white'}
              size="sm"
              data-testid="avatar-mic-btn"
            >
              {isListening ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} />}
            </NeonButton>
            
            <NeonButton
              onClick={generateInsight}
              variant="teal"
              size="sm"
              disabled={isLoading}
              data-testid="avatar-speak-btn"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {isLoading ? 'Thinking...' : 'Get Insight'}
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAvatar;
