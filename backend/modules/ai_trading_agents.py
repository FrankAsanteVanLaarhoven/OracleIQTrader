# OracleIQTrader - AI Trading Agent System
# Create, customize, and deploy specialized AI trading agents

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel
import uuid
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class AgentStrategy(str, Enum):
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    TREND_FOLLOWING = "trend_following"
    CONTRARIAN = "contrarian"
    SENTIMENT_BASED = "sentiment_based"
    TECHNICAL_ANALYSIS = "technical_analysis"
    HYBRID = "hybrid"
    CUSTOM = "custom"


class AgentRiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    ULTRA_AGGRESSIVE = "ultra_aggressive"


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    PAUSED = "paused"
    BACKTESTING = "backtesting"
    ERROR = "error"


class TradingAgentConfig(BaseModel):
    # Identity
    agent_id: str
    name: str
    description: str
    avatar_emoji: str = "🤖"
    created_by: str
    created_at: datetime
    
    # Strategy
    strategy: AgentStrategy
    custom_prompt: Optional[str] = None  # Natural language strategy description
    
    # Risk Parameters (0-100 sliders)
    risk_tolerance: int = 50  # 0=very conservative, 100=very aggressive
    position_size_pct: int = 10  # % of portfolio per trade
    max_daily_trades: int = 10
    max_drawdown_pct: int = 20  # Stop trading if down this much
    
    # Technical Parameters
    stop_loss_pct: float = 5.0
    take_profit_pct: float = 15.0
    trailing_stop: bool = False
    trailing_stop_pct: float = 3.0
    
    # Entry/Exit Conditions
    entry_confidence_threshold: int = 70  # Min AI confidence to enter
    exit_confidence_threshold: int = 40  # Exit if confidence drops below
    
    # Asset Selection
    allowed_assets: List[str] = ["BTC", "ETH", "SOL"]
    excluded_assets: List[str] = []
    
    # Timing
    trading_hours: str = "24/7"  # or "market_hours"
    min_hold_time_minutes: int = 15
    max_hold_time_hours: int = 48
    
    # Automation
    auto_trade: bool = False
    paper_trading: bool = True  # Simulated trades only
    
    # Status
    status: AgentStatus = AgentStatus.IDLE
    last_active: Optional[datetime] = None


class AgentDecision(BaseModel):
    decision_id: str
    agent_id: str
    timestamp: datetime
    asset: str
    action: str  # buy, sell, hold
    confidence: float
    reasoning: str
    technical_signals: Dict[str, Any]
    sentiment_score: Optional[float] = None
    executed: bool = False
    execution_price: Optional[float] = None
    pnl: Optional[float] = None


class AgentPerformance(BaseModel):
    agent_id: str
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    total_pnl: float = 0.0
    best_trade: float = 0.0
    worst_trade: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    avg_hold_time_hours: float = 0.0


# Pre-built Agent Templates
AGENT_TEMPLATES = {
    "momentum_hunter": {
        "name": "Momentum Hunter",
        "description": "Catches strong price movements and rides the trend. Best for volatile markets.",
        "avatar_emoji": "🚀",
        "strategy": AgentStrategy.MOMENTUM,
        "custom_prompt": "I am a momentum trader. I look for assets with strong price movements and high volume. I enter when momentum is building and exit when it starts to fade. I prefer quick trades with clear trends.",
        "risk_tolerance": 70,
        "position_size_pct": 15,
        "stop_loss_pct": 4.0,
        "take_profit_pct": 12.0,
        "entry_confidence_threshold": 75,
        "min_hold_time_minutes": 10,
        "max_hold_time_hours": 24
    },
    "mean_reversion_bot": {
        "name": "Mean Reversion Bot",
        "description": "Buys oversold assets and sells overbought ones. Profits from price corrections.",
        "avatar_emoji": "⚖️",
        "strategy": AgentStrategy.MEAN_REVERSION,
        "custom_prompt": "I am a mean reversion trader. I buy when assets are oversold (RSI below 30) and sell when overbought (RSI above 70). I believe prices always return to their average.",
        "risk_tolerance": 40,
        "position_size_pct": 10,
        "stop_loss_pct": 6.0,
        "take_profit_pct": 8.0,
        "entry_confidence_threshold": 65,
        "min_hold_time_minutes": 60,
        "max_hold_time_hours": 72
    },
    "trend_surfer": {
        "name": "Trend Surfer",
        "description": "Identifies and follows long-term trends. Patient approach with larger moves.",
        "avatar_emoji": "🏄",
        "strategy": AgentStrategy.TREND_FOLLOWING,
        "custom_prompt": "I am a trend follower. I use moving averages and trend lines to identify the direction of the market. I only trade in the direction of the trend and hold positions for extended periods.",
        "risk_tolerance": 50,
        "position_size_pct": 20,
        "stop_loss_pct": 8.0,
        "take_profit_pct": 25.0,
        "trailing_stop": True,
        "trailing_stop_pct": 5.0,
        "entry_confidence_threshold": 70,
        "min_hold_time_minutes": 120,
        "max_hold_time_hours": 168
    },
    "contrarian_alpha": {
        "name": "Contrarian Alpha",
        "description": "Goes against the crowd. Buys fear, sells greed. High risk, high reward.",
        "avatar_emoji": "🦊",
        "strategy": AgentStrategy.CONTRARIAN,
        "custom_prompt": "I am a contrarian trader. When everyone is selling in panic, I buy. When everyone is euphoric, I sell. I profit from market overreactions and emotional extremes.",
        "risk_tolerance": 80,
        "position_size_pct": 12,
        "stop_loss_pct": 10.0,
        "take_profit_pct": 30.0,
        "entry_confidence_threshold": 60,
        "min_hold_time_minutes": 30,
        "max_hold_time_hours": 96
    },
    "news_sentinel": {
        "name": "News Sentinel",
        "description": "Trades based on news and social sentiment. Quick reactions to market events.",
        "avatar_emoji": "📰",
        "strategy": AgentStrategy.SENTIMENT_BASED,
        "custom_prompt": "I am a sentiment-based trader. I analyze news, social media, and market sentiment to make trading decisions. I react quickly to breaking news and sentiment shifts.",
        "risk_tolerance": 65,
        "position_size_pct": 8,
        "stop_loss_pct": 5.0,
        "take_profit_pct": 10.0,
        "entry_confidence_threshold": 80,
        "min_hold_time_minutes": 5,
        "max_hold_time_hours": 12
    },
    "quant_analyzer": {
        "name": "Quant Analyzer",
        "description": "Pure technical analysis. Uses indicators, patterns, and statistical models.",
        "avatar_emoji": "📊",
        "strategy": AgentStrategy.TECHNICAL_ANALYSIS,
        "custom_prompt": "I am a quantitative technical analyst. I use RSI, MACD, Bollinger Bands, and other indicators to identify trading opportunities. I rely purely on price action and mathematical models.",
        "risk_tolerance": 45,
        "position_size_pct": 15,
        "stop_loss_pct": 4.0,
        "take_profit_pct": 12.0,
        "entry_confidence_threshold": 75,
        "min_hold_time_minutes": 30,
        "max_hold_time_hours": 48
    }
}


class AITradingAgentEngine:
    """Core engine for AI Trading Agents"""
    
    def __init__(self):
        self.agents: Dict[str, TradingAgentConfig] = {}
        self.decisions: Dict[str, List[AgentDecision]] = {}
        self.performance: Dict[str, AgentPerformance] = {}
        self.active_positions: Dict[str, Dict] = {}
        
    def create_agent(self, user_id: str, config: Dict) -> TradingAgentConfig:
        """Create a new trading agent"""
        agent_id = f"AGT-{uuid.uuid4().hex[:8].upper()}"
        
        agent = TradingAgentConfig(
            agent_id=agent_id,
            created_by=user_id,
            created_at=datetime.now(timezone.utc),
            **config
        )
        
        self.agents[agent_id] = agent
        self.decisions[agent_id] = []
        self.performance[agent_id] = AgentPerformance(agent_id=agent_id)
        
        logger.info(f"Created agent {agent_id}: {agent.name}")
        return agent
    
    def create_from_template(self, user_id: str, template_id: str, overrides: Dict = None) -> TradingAgentConfig:
        """Create agent from a pre-built template"""
        if template_id not in AGENT_TEMPLATES:
            raise ValueError(f"Unknown template: {template_id}")
        
        config = AGENT_TEMPLATES[template_id].copy()
        if overrides:
            config.update(overrides)
        
        return self.create_agent(user_id, config)
    
    def get_agent(self, agent_id: str) -> Optional[TradingAgentConfig]:
        """Get agent by ID"""
        return self.agents.get(agent_id)
    
    def get_user_agents(self, user_id: str) -> List[TradingAgentConfig]:
        """Get all agents for a user"""
        return [a for a in self.agents.values() if a.created_by == user_id]
    
    def update_agent(self, agent_id: str, updates: Dict) -> Optional[TradingAgentConfig]:
        """Update agent configuration"""
        agent = self.agents.get(agent_id)
        if not agent:
            return None
        
        for key, value in updates.items():
            if hasattr(agent, key):
                setattr(agent, key, value)
        
        return agent
    
    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            if agent_id in self.decisions:
                del self.decisions[agent_id]
            if agent_id in self.performance:
                del self.performance[agent_id]
            return True
        return False
    
    def activate_agent(self, agent_id: str) -> bool:
        """Activate an agent for trading"""
        agent = self.agents.get(agent_id)
        if agent:
            agent.status = AgentStatus.ACTIVE
            agent.last_active = datetime.now(timezone.utc)
            return True
        return False
    
    def pause_agent(self, agent_id: str) -> bool:
        """Pause an agent"""
        agent = self.agents.get(agent_id)
        if agent:
            agent.status = AgentStatus.PAUSED
            return True
        return False
    
    async def analyze_market(self, agent_id: str, market_data: Dict) -> Optional[AgentDecision]:
        """Have agent analyze market and make a decision"""
        agent = self.agents.get(agent_id)
        if not agent or agent.status != AgentStatus.ACTIVE:
            return None
        
        # Build analysis context based on agent's strategy
        decision = await self._generate_decision(agent, market_data)
        
        if decision:
            self.decisions[agent_id].append(decision)
            # Keep last 1000 decisions
            if len(self.decisions[agent_id]) > 1000:
                self.decisions[agent_id] = self.decisions[agent_id][-500:]
        
        return decision
    
    async def _generate_decision(self, agent: TradingAgentConfig, market_data: Dict) -> AgentDecision:
        """Generate trading decision based on agent config and market data"""
        import random
        
        # Extract market signals
        price = market_data.get("price", 0)
        change_24h = market_data.get("change_percent", 0)
        volume = market_data.get("volume", 0)
        rsi = market_data.get("rsi", 50)
        
        # Calculate technical signals
        signals = {
            "price_momentum": change_24h,
            "rsi": rsi,
            "volume_surge": volume > market_data.get("avg_volume", volume) * 1.5,
            "trend": "bullish" if change_24h > 2 else "bearish" if change_24h < -2 else "neutral"
        }
        
        # Determine action based on strategy
        action = "hold"
        confidence = 50.0
        reasoning = ""
        
        if agent.strategy == AgentStrategy.MOMENTUM:
            if change_24h > 3 and signals["volume_surge"]:
                action = "buy"
                confidence = min(90, 60 + change_24h * 3)
                reasoning = f"Strong upward momentum detected (+{change_24h:.1f}%) with volume surge"
            elif change_24h < -3:
                action = "sell"
                confidence = min(90, 60 + abs(change_24h) * 3)
                reasoning = f"Downward momentum detected ({change_24h:.1f}%), exiting position"
        
        elif agent.strategy == AgentStrategy.MEAN_REVERSION:
            if rsi < 30:
                action = "buy"
                confidence = min(95, 60 + (30 - rsi) * 2)
                reasoning = f"Asset oversold (RSI: {rsi}), expecting mean reversion"
            elif rsi > 70:
                action = "sell"
                confidence = min(95, 60 + (rsi - 70) * 2)
                reasoning = f"Asset overbought (RSI: {rsi}), expecting pullback"
        
        elif agent.strategy == AgentStrategy.TREND_FOLLOWING:
            if change_24h > 1 and signals["trend"] == "bullish":
                action = "buy"
                confidence = 70
                reasoning = "Uptrend confirmed, following the trend"
            elif change_24h < -1 and signals["trend"] == "bearish":
                action = "sell"
                confidence = 70
                reasoning = "Downtrend confirmed, following the trend"
        
        elif agent.strategy == AgentStrategy.CONTRARIAN:
            if rsi < 25 and change_24h < -5:
                action = "buy"
                confidence = 75
                reasoning = f"Extreme fear detected (RSI: {rsi}, -5%+), contrarian buy signal"
            elif rsi > 75 and change_24h > 5:
                action = "sell"
                confidence = 75
                reasoning = f"Extreme greed detected (RSI: {rsi}, +5%+), contrarian sell signal"
        
        # Apply risk tolerance modifier
        confidence = confidence * (agent.risk_tolerance / 100 + 0.5)
        confidence = min(99, max(1, confidence))
        
        # Check if confidence meets threshold
        if action != "hold" and confidence < agent.entry_confidence_threshold:
            action = "hold"
            reasoning = f"Confidence ({confidence:.0f}%) below threshold ({agent.entry_confidence_threshold}%)"
        
        decision = AgentDecision(
            decision_id=f"DEC-{uuid.uuid4().hex[:8].upper()}",
            agent_id=agent.agent_id,
            timestamp=datetime.now(timezone.utc),
            asset=market_data.get("symbol", "BTC"),
            action=action,
            confidence=round(confidence, 1),
            reasoning=reasoning,
            technical_signals=signals,
            sentiment_score=market_data.get("sentiment"),
            executed=False
        )
        
        return decision
    
    def get_agent_decisions(self, agent_id: str, limit: int = 50) -> List[AgentDecision]:
        """Get recent decisions for an agent"""
        decisions = self.decisions.get(agent_id, [])
        return sorted(decisions, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_agent_performance(self, agent_id: str) -> Optional[AgentPerformance]:
        """Get performance metrics for an agent"""
        return self.performance.get(agent_id)
    
    def get_templates(self) -> Dict:
        """Get all available agent templates"""
        return AGENT_TEMPLATES
    
    def chat_with_agent(self, agent_id: str, message: str, market_context: Dict = None) -> Dict:
        """Interactive chat with agent about trading decisions"""
        agent = self.agents.get(agent_id)
        if not agent:
            return {"error": "Agent not found"}
        
        # Generate contextual response based on agent personality
        response = self._generate_agent_response(agent, message, market_context)
        
        return {
            "agent_id": agent_id,
            "agent_name": agent.name,
            "avatar": agent.avatar_emoji,
            "message": message,
            "response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def _generate_agent_response(self, agent: TradingAgentConfig, message: str, context: Dict = None) -> str:
        """Generate agent response based on personality"""
        message_lower = message.lower()
        
        strategy_responses = {
            AgentStrategy.MOMENTUM: {
                "default": f"As a momentum trader, I'm always watching for breakouts. Currently analyzing price action and volume patterns.",
                "buy": f"I see momentum building! When price moves {agent.entry_confidence_threshold}%+ with volume, I strike.",
                "strategy": f"My approach: catch the wave early, ride it hard, exit before it crashes. Stop loss at {agent.stop_loss_pct}%, take profit at {agent.take_profit_pct}%."
            },
            AgentStrategy.MEAN_REVERSION: {
                "default": f"I'm patiently waiting for extremes. Markets always revert to the mean - that's where I profit.",
                "buy": f"When RSI drops below 30, that's my signal. I wait for oversold conditions and buy the dip.",
                "strategy": f"Buy fear, sell greed. Position size: {agent.position_size_pct}% per trade. Patience is key."
            },
            AgentStrategy.CONTRARIAN: {
                "default": f"When the crowd panics, I see opportunity. Going against the herd is my edge.",
                "buy": f"Maximum fear = maximum opportunity. I accumulate when others are liquidating.",
                "strategy": f"Be greedy when others are fearful. My risk tolerance is {agent.risk_tolerance}/100."
            }
        }
        
        responses = strategy_responses.get(agent.strategy, strategy_responses[AgentStrategy.MOMENTUM])
        
        if any(word in message_lower for word in ["strategy", "approach", "how do you"]):
            return responses["strategy"]
        elif any(word in message_lower for word in ["buy", "enter", "position"]):
            return responses["buy"]
        else:
            return responses["default"]


# Global instance
ai_trading_engine = AITradingAgentEngine()
