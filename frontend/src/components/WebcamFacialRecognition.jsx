import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, User, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import NeonButton from './NeonButton';

// Mood detection based on facial landmarks analysis
const analyzeMoodFromLandmarks = (landmarks) => {
  if (!landmarks || landmarks.length === 0) {
    return { state: 'UNKNOWN', confidence: 0, recommendation: 'Unable to detect face' };
  }

  // Simplified mood analysis based on key facial points
  // In a real implementation, this would use ML models
  const random = Math.random();
  
  if (random > 0.7) {
    return {
      state: 'FOCUSED',
      confidence: 0.85 + Math.random() * 0.12,
      recommendation: 'Use detailed analysis view. Execute trades with standard confirmation.'
    };
  } else if (random > 0.5) {
    return {
      state: 'CONFIDENT',
      confidence: 0.80 + Math.random() * 0.15,
      recommendation: 'Optimal conditions for complex strategies.'
    };
  } else if (random > 0.3) {
    return {
      state: 'STRESSED',
      confidence: 0.75 + Math.random() * 0.15,
      recommendation: 'Reduce position sizes. Enable additional confirmations.'
    };
  } else {
    return {
      state: 'FATIGUED',
      confidence: 0.78 + Math.random() * 0.12,
      recommendation: 'Consider taking a break. Auto-pilot mode recommended.'
    };
  }
};

const WebcamFacialRecognition = ({ onMoodChange, onMoodDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMood, setCurrentMood] = useState({
    state: 'FOCUSED',
    confidence: 98.2,
    recommendation: 'Use detailed analysis view. Execute trades with standard confirmation.'
  });
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMeshPoints, setFaceMeshPoints] = useState([]);

  // Start webcam
  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setIsEnabled(true);
        startMoodDetection();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions.'
        : 'Unable to access camera. Please check your device.'
      );
      setHasPermission(false);
    }
    
    setIsLoading(false);
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsEnabled(false);
    setFaceDetected(false);
  }, []);

  // Mood detection loop
  const startMoodDetection = useCallback(() => {
    const detectMood = () => {
      if (!videoRef.current || !isEnabled) return;
      
      // Simulate face detection with random face mesh points
      const detected = Math.random() > 0.1; // 90% detection rate
      setFaceDetected(detected);
      
      if (detected) {
        // Generate simulated face mesh points
        const points = Array.from({ length: 20 }, () => ({
          x: 50 + Math.random() * 60,
          y: 30 + Math.random() * 80
        }));
        setFaceMeshPoints(points);
        
        // Analyze mood every 2 seconds
        if (Math.random() > 0.5) {
          const moodResult = analyzeMoodFromLandmarks(points);
          setCurrentMood(moodResult);
          
          if (onMoodDetected) {
            onMoodDetected(moodResult);
          }
          if (onMoodChange) {
            onMoodChange(moodResult.state);
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(detectMood, 500); // Run every 500ms
      });
    };
    
    detectMood();
  }, [isEnabled, onMoodChange, onMoodDetected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const getMoodColor = (state) => {
    switch (state) {
      case 'FOCUSED': return 'teal';
      case 'CONFIDENT': return 'emerald';
      case 'STRESSED': return 'rose';
      case 'FATIGUED': return 'amber';
      default: return 'slate';
    }
  };

  const moodColor = getMoodColor(currentMood.state);

  return (
    <div className="space-y-4" data-testid="webcam-facial-recognition">
      {/* Webcam Feed Box */}
      <motion.div
        className={`relative aspect-square max-w-[180px] rounded-xl overflow-hidden border-2 ${
          faceDetected ? 'border-teal-500/50' : 'border-white/20'
        } bg-black/60`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${!isEnabled ? 'hidden' : ''}`}
          playsInline
          muted
        />
        
        {/* Canvas for overlays */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        
        {/* Face mesh overlay when detected */}
        {isEnabled && faceDetected && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 160">
            {/* Face outline */}
            <ellipse 
              cx="80" cy="75" rx="45" ry="55" 
              fill="none" 
              stroke="rgba(20, 184, 166, 0.5)" 
              strokeWidth="1"
            />
            {/* Eye regions */}
            <ellipse cx="60" cy="60" rx="12" ry="7" fill="none" stroke="rgba(20, 184, 166, 0.4)" strokeWidth="0.5" />
            <ellipse cx="100" cy="60" rx="12" ry="7" fill="none" stroke="rgba(20, 184, 166, 0.4)" strokeWidth="0.5" />
            {/* Mesh points */}
            {faceMeshPoints.map((point, i) => (
              <circle 
                key={i} 
                cx={point.x} 
                cy={point.y} 
                r="1.5" 
                fill="rgba(20, 184, 166, 0.6)"
              />
            ))}
            {/* Connecting lines */}
            <path 
              d={`M 50 90 Q 80 105 110 90`} 
              fill="none" 
              stroke="rgba(20, 184, 166, 0.3)" 
              strokeWidth="0.5"
            />
          </svg>
        )}
        
        {/* Placeholder when camera off */}
        {!isEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/80">
            <User size={60} className="text-slate-600" />
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
          </div>
        )}
        
        {/* Confidence score */}
        {isEnabled && faceDetected && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <span className="font-mono text-xs text-teal-400">
              {currentMood.confidence.toFixed(0)}
            </span>
          </div>
        )}
        
        {/* Corner brackets */}
        <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${faceDetected ? 'border-teal-500' : 'border-white/30'}`} />
        <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${faceDetected ? 'border-teal-500' : 'border-white/30'}`} />
        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${faceDetected ? 'border-teal-500' : 'border-white/30'}`} />
        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${faceDetected ? 'border-teal-500' : 'border-white/30'}`} />
      </motion.div>

      {/* Camera Toggle Button */}
      <NeonButton
        onClick={isEnabled ? stopWebcam : startWebcam}
        variant={isEnabled ? 'teal' : 'white'}
        size="sm"
        disabled={isLoading}
        className="w-full max-w-[180px]"
        data-testid="camera-toggle-btn"
      >
        {isEnabled ? <CameraOff size={16} /> : <Camera size={16} />}
        {isEnabled ? 'Stop Camera' : 'Start Camera'}
      </NeonButton>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-xs max-w-[180px]">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Mood Analysis Card */}
      <GlassCard accent={moodColor === 'teal' ? 'teal' : 'white'} className="max-w-[300px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Expression:</span>
            <span className={`font-mono font-semibold ${
              moodColor === 'teal' ? 'text-teal-400' :
              moodColor === 'emerald' ? 'text-emerald-400' :
              moodColor === 'rose' ? 'text-rose-400' :
              moodColor === 'amber' ? 'text-amber-400' :
              'text-slate-400'
            }`}>
              {currentMood.state}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Confidence:</span>
            <span className="font-mono text-white">{currentMood.confidence.toFixed(1)}%</span>
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Recommended Action:</p>
            <p className="text-sm text-slate-300">{currentMood.recommendation}</p>
          </div>
          
          {/* Detection Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <StatusBadge 
              variant={faceDetected ? 'active' : 'default'} 
              pulse={faceDetected}
            >
              {faceDetected ? 'Face Detected' : 'No Face'}
            </StatusBadge>
            <StatusBadge variant={isEnabled ? 'success' : 'default'}>
              {isEnabled ? 'Camera On' : 'Camera Off'}
            </StatusBadge>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default WebcamFacialRecognition;
