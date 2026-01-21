import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, CameraOff, Eye, EyeOff, 
  RefreshCw, AlertCircle, Check
} from 'lucide-react';
import NeonButton from './NeonButton';

// Facial expression state that will be passed to avatar
const defaultFaceState = {
  leftEyeOpen: 1,
  rightEyeOpen: 1,
  mouthOpen: 0,
  smileAmount: 0,
  eyebrowRaise: 0,
  headTiltX: 0,
  headTiltY: 0,
  lookX: 0,
  lookY: 0,
  emotion: 'neutral',
  confidence: 0
};

const WebcamFaceTracker = ({ onFaceData, className = '' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceState, setFaceState] = useState(defaultFaceState);
  
  // Load MediaPipe FaceMesh
  const loadFaceMesh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Dynamic import MediaPipe
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');
      
      // Initialize FaceMesh
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      faceMesh.onResults(handleFaceResults);
      faceMeshRef.current = faceMesh;
      
      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Create camera instance
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        await camera.start();
        cameraRef.current = camera;
        setIsActive(true);
      }
    } catch (err) {
      console.error('FaceMesh init error:', err);
      setError(err.message || 'Failed to initialize face tracking');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Process face mesh results
  const handleFaceResults = useCallback((results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      return;
    }
    
    setFaceDetected(true);
    const landmarks = results.multiFaceLandmarks[0];
    
    // Extract facial features from 468 landmarks
    // Landmark indices based on MediaPipe Face Mesh topology:
    // Left eye: 33 (outer), 133 (inner), 159 (top), 145 (bottom)
    // Right eye: 362 (outer), 263 (inner), 386 (top), 374 (bottom)
    // Mouth: 61 (left), 291 (right), 0 (top), 17 (bottom)
    // Nose tip: 4
    
    // Calculate eye openness (vertical distance between top and bottom)
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    
    const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y) * 100;
    const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBottom.y) * 100;
    
    // Calculate mouth openness
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y) * 100;
    
    // Calculate smile amount (horizontal mouth stretch)
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x) * 100;
    const smileAmount = Math.max(0, (mouthWidth - 15) / 10); // Normalize
    
    // Eyebrow position
    const leftBrow = landmarks[107];
    const rightBrow = landmarks[336];
    const leftEyeCenter = landmarks[159];
    const rightEyeCenter = landmarks[386];
    const eyebrowRaise = ((leftBrow.y - leftEyeCenter.y) + (rightBrow.y - rightEyeCenter.y)) / 2 * -50;
    
    // Head tilt (rotation)
    const noseTip = landmarks[4];
    const noseBase = landmarks[168];
    const headTiltX = (noseTip.x - 0.5) * 30; // Left-right tilt
    const headTiltY = (noseTip.y - noseBase.y - 0.05) * 50; // Up-down tilt
    
    // Eye gaze direction (pupil position relative to eye center)
    const leftPupil = landmarks[468]; // Iris center if refineLandmarks is true
    const rightPupil = landmarks[473];
    const lookX = leftPupil ? (leftPupil.x - landmarks[33].x) * 50 : 0;
    const lookY = leftPupil ? (leftPupil.y - landmarks[159].y) * 50 : 0;
    
    // Determine emotion based on facial features
    let emotion = 'neutral';
    let confidence = 0.7;
    
    if (smileAmount > 2 && leftEyeOpen > 3 && rightEyeOpen > 3) {
      emotion = 'happy';
      confidence = Math.min(0.95, 0.7 + smileAmount * 0.05);
    } else if (mouthOpen > 5 && eyebrowRaise > 2) {
      emotion = 'excited';
      confidence = 0.8;
    } else if (eyebrowRaise < -1 && smileAmount < 1) {
      emotion = 'concerned';
      confidence = 0.75;
    } else if (leftEyeOpen < 2 || rightEyeOpen < 2) {
      emotion = 'focused';
      confidence = 0.7;
    }
    
    const newFaceState = {
      leftEyeOpen: Math.min(1, leftEyeOpen / 5),
      rightEyeOpen: Math.min(1, rightEyeOpen / 5),
      mouthOpen: Math.min(1, mouthOpen / 10),
      smileAmount: Math.min(1, smileAmount / 5),
      eyebrowRaise: Math.max(-1, Math.min(1, eyebrowRaise / 5)),
      headTiltX,
      headTiltY,
      lookX,
      lookY,
      emotion,
      confidence
    };
    
    setFaceState(newFaceState);
    
    // Send face data to parent
    if (onFaceData) {
      onFaceData(newFaceState);
    }
    
    // Draw landmarks on canvas for visualization
    if (canvasRef.current && showVideo) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw face mesh
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.lineWidth = 0.5;
      
      // Draw key landmarks
      const keyPoints = [
        159, 145, 386, 374, // Eyes
        61, 291, 13, 14, // Mouth
        107, 336, // Eyebrows
        4, 168 // Nose
      ];
      
      keyPoints.forEach(i => {
        const point = landmarks[i];
        ctx.beginPath();
        ctx.arc(point.x * 640, point.y * 480, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
        ctx.fill();
      });
    }
  }, [onFaceData, showVideo]);
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsActive(false);
    setFaceDetected(false);
    setFaceState(defaultFaceState);
  }, []);
  
  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (isActive) {
      stopTracking();
    } else {
      loadFaceMesh();
    }
  }, [isActive, loadFaceMesh, stopTracking]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Control Panel */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <NeonButton
            onClick={toggleTracking}
            variant={isActive ? 'danger' : 'cyan'}
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : isActive ? (
              <CameraOff size={16} />
            ) : (
              <Camera size={16} />
            )}
            {isActive ? 'Stop' : 'Start'} Face Tracking
          </NeonButton>
          
          {isActive && (
            <NeonButton
              onClick={() => setShowVideo(!showVideo)}
              variant="white"
              size="sm"
            >
              {showVideo ? <EyeOff size={16} /> : <Eye size={16} />}
              {showVideo ? 'Hide' : 'Show'} Camera
            </NeonButton>
          )}
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono ${
                faceDetected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {faceDetected ? <Check size={12} /> : <AlertCircle size={12} />}
              {faceDetected ? 'Face Detected' : 'No Face'}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
          >
            <AlertCircle size={14} className="inline mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Video preview */}
      <AnimatePresence>
        {showVideo && isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden rounded-xl border border-white/10 mb-4"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto transform scale-x-[-1]"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full transform scale-x-[-1] pointer-events-none"
            />
            
            {/* Overlay with face data */}
            <div className="absolute bottom-2 left-2 right-2 flex gap-2 flex-wrap">
              {faceDetected && (
                <>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-xs text-teal-400 font-mono">
                    😊 {(faceState.smileAmount * 100).toFixed(0)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-xs text-blue-400 font-mono">
                    👁️ {(faceState.leftEyeOpen * 100).toFixed(0)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-xs text-purple-400 font-mono">
                    👄 {(faceState.mouthOpen * 100).toFixed(0)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-xs text-amber-400 font-mono">
                    {faceState.emotion}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden video element when preview is off but tracking is on */}
      {!showVideo && isActive && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />
      )}
      
      {/* Real-time face metrics */}
      {isActive && faceDetected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-4 gap-2 text-center"
        >
          <div className="p-2 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-1">Eyes</div>
            <div className="text-sm font-mono text-teal-400">
              {((faceState.leftEyeOpen + faceState.rightEyeOpen) / 2 * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-1">Smile</div>
            <div className="text-sm font-mono text-green-400">
              {(faceState.smileAmount * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-1">Brows</div>
            <div className="text-sm font-mono text-amber-400">
              {faceState.eyebrowRaise > 0 ? '+' : ''}{(faceState.eyebrowRaise * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-1">Emotion</div>
            <div className="text-sm font-mono text-purple-400 capitalize">
              {faceState.emotion}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WebcamFaceTracker;
