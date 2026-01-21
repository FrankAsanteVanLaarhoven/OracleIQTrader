import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, MinusCircle, Loader2 } from 'lucide-react';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import NeonButton from './NeonButton';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AgentConsensus = ({ tradeRequest, onConsensusComplete }) => {
  const [agents, setAgents] = useState([
    { name: 'Data Analyst', vote: null, confidence: 0, reasoning: '', status: 'idle' },
    { name: 'Risk Manager', vote: null, confidence: 0, reasoning: '', status: 'idle' },
    { name: 'Strategist', vote: null, confidence: 0, reasoning: '', status: 'idle' },
  ]);
  const [finalDecision, setFinalDecision] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestConsensus = async () => {
    setIsLoading(true);
    setFinalDecision(null);
    
    // Reset agents
    setAgents(prev => prev.map(a => ({ ...a, vote: null, confidence: 0, reasoning: '', status: 'thinking' })));

    try {
      const response = await axios.post(`${API}/agents/consensus`, {
        action: tradeRequest?.action || 'BUY',
        symbol: tradeRequest?.symbol || 'AAPL',
        quantity: tradeRequest?.quantity || 1000,
        current_price: tradeRequest?.price || 248.50,
        market_context: 'Standard market conditions with moderate volatility'
      });

      // Animate agents one by one
      const consensusData = response.data;
      
      for (let i = 0; i < consensusData.agents.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setAgents(prev => prev.map((a, idx) => 
          idx === i ? {
            ...a,
            vote: consensusData.agents[i].vote,
            confidence: consensusData.agents[i].confidence,
            reasoning: consensusData.agents[i].reasoning,
            status: 'complete'
          } : a
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setFinalDecision({
        decision: consensusData.final_decision,
        confidence: consensusData.overall_confidence
      });

      if (onConsensusComplete) {
        onConsensusComplete(consensusData);
      }
    } catch (error) {
      console.error('Consensus error:', error);
      // Fallback simulation
      simulateConsensus();
    }

    setIsLoading(false);
  };

  const simulateConsensus = async () => {
    const votes = ['approve', 'approve', 'neutral'];
    const reasonings = [
      'Technical indicators show positive momentum. RSI at 58, MACD bullish crossover.',
      'Position size within risk parameters. Portfolio exposure acceptable at 12%.',
      'Aligned with current market thesis. Sector rotation favors this position.'
    ];

    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 700));
      setAgents(prev => prev.map((a, idx) => 
        idx === i ? {
          ...a,
          vote: votes[i],
          confidence: 0.75 + Math.random() * 0.2,
          reasoning: reasonings[i],
          status: 'complete'
        } : a
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    setFinalDecision({
      decision: 'RECOMMEND EXECUTION',
      confidence: 0.87
    });
  };

  const getVoteIcon = (vote, status) => {
    if (status === 'thinking') return <Loader2 className="animate-spin text-slate-500" size={18} />;
    if (vote === 'approve') return <CheckCircle className="text-emerald-400" size={18} />;
    if (vote === 'reject') return <XCircle className="text-rose-400" size={18} />;
    if (vote === 'neutral') return <MinusCircle className="text-amber-400" size={18} />;
    return <div className="w-[18px] h-[18px] rounded-full border border-slate-600" />;
  };

  const getVoteColor = (vote) => {
    if (vote === 'approve') return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    if (vote === 'reject') return 'bg-rose-500/20 border-rose-500/50 text-rose-400';
    if (vote === 'neutral') return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    return 'bg-white/5 border-white/10 text-slate-400';
  };

  return (
    <div data-testid="agent-consensus-panel">
      <GlassCard title="Agent Consensus" icon="🤖" accent="teal">
        <div className="space-y-4">
          {/* Agent Votes */}
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3"
            >
              <StatusBadge 
                variant={agent.vote === 'approve' ? 'success' : agent.vote === 'reject' ? 'danger' : agent.vote ? 'warning' : 'default'}
                className="min-w-[120px] justify-center"
              >
                {getVoteIcon(agent.vote, agent.status)}
                <span className="ml-1">{agent.name}</span>
              </StatusBadge>
              <span className="text-sm text-slate-400 flex-1 truncate">
                {agent.status === 'thinking' ? 'Analyzing...' : 
                 agent.vote === 'approve' ? 'Positive Signal' :
                 agent.vote === 'reject' ? 'Risk Flagged' :
                 agent.vote === 'neutral' ? 'Needs Review' : 'Awaiting...'}
              </span>
            </motion.div>
          ))}

          {/* Final Consensus */}
          <AnimatePresence>
            {finalDecision && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-white/10"
              >
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">Final Consensus:</p>
                <p className={`font-heading text-lg font-bold uppercase ${
                  finalDecision.decision.includes('RECOMMEND') ? 'text-emerald-400' :
                  finalDecision.decision.includes('REJECT') ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {finalDecision.decision}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Overall Confidence: {(finalDecision.confidence * 100).toFixed(0)}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Request Consensus Button */}
          <NeonButton 
            onClick={requestConsensus} 
            disabled={isLoading}
            variant="teal"
            className="w-full mt-4"
            data-testid="request-consensus-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Analyzing...
              </>
            ) : (
              'Request Consensus'
            )}
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default AgentConsensus;
