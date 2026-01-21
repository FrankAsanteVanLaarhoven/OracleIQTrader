import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VoicePanel = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recognition, setRecognition] = useState(null);
  const [ephemeralCommands, setEphemeralCommands] = useState([]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const last = event.results.length - 1;
        const result = event.results[last];
        const text = result[0].transcript;
        const conf = result[0].confidence;

        setTranscript(text);
        setConfidence(conf);

        if (result.isFinal) {
          handleFinalTranscript(text, conf);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleFinalTranscript = async (text, conf) => {
    // Add to ephemeral commands
    const newCommand = {
      id: Date.now(),
      text,
      confidence: conf,
      timestamp: new Date(),
    };

    setEphemeralCommands(prev => [...prev, newCommand]);

    // Auto-remove after 5 seconds (ephemeral UI)
    setTimeout(() => {
      setEphemeralCommands(prev => prev.filter(c => c.id !== newCommand.id));
    }, 5000);

    // Parse command via API
    try {
      const response = await axios.post(`${API}/voice/parse`, {
        transcript: text,
        confidence: conf
      });
      if (onCommand) {
        onCommand(response.data);
      }
    } catch (error) {
      console.error('Error parsing voice command:', error);
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  // Simulate voice command for demo
  const simulateVoiceCommand = () => {
    const commands = [
      'Buy 1000 shares AAPL at market',
      'Sell 500 shares NVDA limit 150',
      'Buy 2 BTC at market price',
      'Show me ETH analysis',
      'Execute buy order for Tesla',
    ];
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    const conf = 0.85 + Math.random() * 0.12;
    
    handleFinalTranscript(randomCommand, conf);
    setTranscript(randomCommand);
    setConfidence(conf);
  };

  return (
    <div className="space-y-4" data-testid="voice-panel">
      {/* Voice Control Button */}
      <motion.button
        onClick={simulateVoiceCommand}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl transition-all ${
          isListening 
            ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.3)]'
            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-testid="voice-toggle-btn"
      >
        {isListening ? (
          <Mic className="animate-pulse" size={20} />
        ) : (
          <MicOff size={20} />
        )}
        <span className="font-mono text-sm">
          {isListening ? 'Voice Active' : 'Start Listening'}
        </span>
        {isListening && (
          <span className="relative flex h-2 w-2 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
        )}
      </motion.button>

      {/* Ephemeral Voice Commands */}
      <AnimatePresence>
        {ephemeralCommands.map((command) => (
          <motion.div
            key={command.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            data-testid="voice-command-ephemeral"
          >
            <GlassCard className="glass-teal" accent="teal">
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Execute:
                </p>
                <p className="text-xl font-heading font-semibold text-white">
                  {command.text}
                </p>
                <p className="text-sm font-mono text-teal-400">
                  Confidence: {(command.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default VoicePanel;
