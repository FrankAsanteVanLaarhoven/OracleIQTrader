# OracleIQTrader - AI Trading Agent System
# Create, customize, and deploy specialized AI trading agents
# Now with MongoDB persistence

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel
import uuid
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
    strategy: str
    custom_prompt: Optional[str] = None
    
    # Risk Parameters (0-100 sliders)
    risk_tolerance: int = 50
    position_size_pct: int = 10
    max_daily_trades: int = 10
    max_drawdown_pct: int = 20
    
    # Technical Parameters
    stop_loss_pct: float = 5.0
    take_profit_pct: float = 15.0
    trailing_stop: bool = False
    trailing_stop_pct: float = 3.0
    
    # Entry/Exit Conditions
    entry_confidence_threshold: int = 70
    exit_confidence_threshold: int = 40
    
    # Asset Selection
    allowed_assets: List[str] = ["BTC", "ETH", "SOL"]
    excluded_assets: List[str] = []
    
    # Timing
    trading_hours: str = "24/7"
    min_hold_time_minutes: int = 15
    max_hold_time_hours: int = 48
    
    # Automation
    auto_trade: bool = False
    paper_trading: bool = True
    
    # Status
    status: str = "idle"
    last_active: Optional[datetime] = None


class AgentDecision(BaseModel):
    decision_id: str
    agent_id: str
    timestamp: datetime
    asset: str
    action: str
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
        "strategy": "momentum",
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
        "strategy": "mean_reversion",
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
        "strategy": "trend_following",
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
        "strategy": "contrarian",
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
        "strategy": "sentiment_based",
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
        "strategy": "technical_analysis",
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
    """Core engine for AI Trading Agents with MongoDB persistence"""
    
    def __init__(self, db=None):
        self.db = db
        self._in_memory_cache: Dict[str, TradingAgentConfig] = {}
        self._decisions_cache: Dict[str, List[AgentDecision]] = {}
        self._performance_cache: Dict[str, AgentPerformance] = {}
    
    def set_db(self, db):
        """Set MongoDB database connection"""
        self.db = db
    
    async def _save_agent_to_db(self, agent: TradingAgentConfig):
        """Save agent to MongoDB"""
        if self.db:
            agent_dict = agent.model_dump()
            agent_dict["created_at"] = agent.created_at.isoformat()
            if agent.last_active:
                agent_dict["last_active"] = agent.last_active.isoformat()
            await self.db.trading_agents.update_one(
                {"agent_id": agent.agent_id},
                {"$set": agent_dict},
                upsert=True
            )
    
    async def _load_agents_from_db(self, user_id: str) -> List[TradingAgentConfig]:
        """Load agents from MongoDB"""
        if self.db:
            agents = []
            cursor = self.db.trading_agents.find({"created_by": user_id})
            async for doc in cursor:
                doc.pop("_id", None)
                if isinstance(doc.get("created_at"), str):
                    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
                if isinstance(doc.get("last_active"), str):
                    doc["last_active"] = datetime.fromisoformat(doc["last_active"])
                agent = TradingAgentConfig(**doc)
                self._in_memory_cache[agent.agent_id] = agent
                agents.append(agent)
            return agents
        return []
    
    async def _load_agent_from_db(self, agent_id: str) -> Optional[TradingAgentConfig]:
        """Load single agent from MongoDB"""
        if self.db:
            doc = await self.db.trading_agents.find_one({"agent_id": agent_id})
            if doc:
                doc.pop("_id", None)
                if isinstance(doc.get("created_at"), str):
                    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
                if isinstance(doc.get("last_active"), str):
                    doc["last_active"] = datetime.fromisoformat(doc["last_active"])
                agent = TradingAgentConfig(**doc)
                self._in_memory_cache[agent.agent_id] = agent
                return agent
        return None
    
    async def _delete_agent_from_db(self, agent_id: str):
        """Delete agent from MongoDB"""
        if self.db:
            await self.db.trading_agents.delete_one({"agent_id": agent_id})
            await self.db.agent_decisions.delete_many({"agent_id": agent_id})
    
    async def _save_decision_to_db(self, decision: AgentDecision):
        """Save decision to MongoDB"""
        if self.db:
            decision_dict = decision.model_dump()
            decision_dict["timestamp"] = decision.timestamp.isoformat()
            await self.db.agent_decisions.insert_one(decision_dict)
    
    async def create_agent(self, user_id: str, config: Dict) -> TradingAgentConfig:
        """Create a new trading agent"""
        agent_id = f"AGT-{uuid.uuid4().hex[:8].upper()}"
        
        agent = TradingAgentConfig(
            agent_id=agent_id,
            created_by=user_id,
            created_at=datetime.now(timezone.utc),
            **config
        )
        
        self._in_memory_cache[agent_id] = agent
        self._decisions_cache[agent_id] = []
        self._performance_cache[agent_id] = AgentPerformance(agent_id=agent_id)
        
        await self._save_agent_to_db(agent)
        
        logger.info(f"Created agent {agent_id}: {agent.name}")
        return agent
    
    async def create_from_template(self, user_id: str, template_id: str, overrides: Dict = None) -> TradingAgentConfig:
        """Create agent from a pre-built template"""
        if template_id not in AGENT_TEMPLATES:
            raise ValueError(f"Unknown template: {template_id}")
        
        config = AGENT_TEMPLATES[template_id].copy()
        if overrides:
            config.update(overrides)
        
        return await self.create_agent(user_id, config)
    
    async def get_agent(self, agent_id: str) -> Optional[TradingAgentConfig]:
        """Get agent by ID"""
        if agent_id in self._in_memory_cache:
            return self._in_memory_cache[agent_id]
        return await self._load_agent_from_db(agent_id)
    
    async def get_user_agents(self, user_id: str) -> List[TradingAgentConfig]:
        """Get all agents for a user"""
        # First check cache
        cached = [a for a in self._in_memory_cache.values() if a.created_by == user_id]
        if cached:
            return cached
        # Load from DB
        return await self._load_agents_from_db(user_id)
    
    async def update_agent(self, agent_id: str, updates: Dict) -> Optional[TradingAgentConfig]:
        """Update agent configuration"""
        agent = await self.get_agent(agent_id)
        if not agent:
            return None
        
        # Create updated agent
        agent_dict = agent.model_dump()
        agent_dict.update(updates)
        updated_agent = TradingAgentConfig(**agent_dict)
        
        self._in_memory_cache[agent_id] = updated_agent
        await self._save_agent_to_db(updated_agent)
        
        return updated_agent
    
    async def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        if agent_id in self._in_memory_cache:
            del self._in_memory_cache[agent_id]
        if agent_id in self._decisions_cache:
            del self._decisions_cache[agent_id]
        if agent_id in self._performance_cache:
            del self._performance_cache[agent_id]
        
        await self._delete_agent_from_db(agent_id)
        return True
    
    async def activate_agent(self, agent_id: str) -> bool:
        """Activate an agent for trading"""
        agent = await self.get_agent(agent_id)
        if agent:
            return await self.update_agent(agent_id, {
                "status": "active",
                "last_active": datetime.now(timezone.utc)
            }) is not None
        return False
    
    async def pause_agent(self, agent_id: str) -> bool:
        """Pause an agent"""
        agent = await self.get_agent(agent_id)
        if agent:
            return await self.update_agent(agent_id, {"status": "paused"}) is not None
        return False
    
    async def analyze_market(self, agent_id: str, market_data: Dict) -> Optional[AgentDecision]:
        """Have agent analyze market and make a decision"""
        agent = await self.get_agent(agent_id)
        if not agent or agent.status != "active":
            return None
        
        decision = await self._generate_decision(agent, market_data)
        
        if decision:
            if agent_id not in self._decisions_cache:
                self._decisions_cache[agent_id] = []
            self._decisions_cache[agent_id].append(decision)
            if len(self._decisions_cache[agent_id]) > 1000:
                self._decisions_cache[agent_id] = self._decisions_cache[agent_id][-500:]
            
            await self._save_decision_to_db(decision)
        
        return decision
    
    async def _generate_decision(self, agent: TradingAgentConfig, market_data: Dict) -> AgentDecision:
        """Generate trading decision based on agent config and market data"""
        price = market_data.get("price", 0)
        change_24h = market_data.get("change_percent", 0)
        volume = market_data.get("volume", 0)
        rsi = market_data.get("rsi", 50)
        
        signals = {
            "price_momentum": change_24h,
            "rsi": rsi,
            "volume_surge": volume > market_data.get("avg_volume", volume) * 1.5,
            "trend": "bullish" if change_24h > 2 else "bearish" if change_24h < -2 else "neutral"
        }
        
        action = "hold"
        confidence = 50.0
        reasoning = ""
        
        strategy = agent.strategy
        
        if strategy == "momentum":
            if change_24h > 3 and signals["volume_surge"]:
                action = "buy"
                confidence = min(90, 60 + change_24h * 3)
                reasoning = f"Strong upward momentum detected (+{change_24h:.1f}%) with volume surge"
            elif change_24h < -3:
                action = "sell"
                confidence = min(90, 60 + abs(change_24h) * 3)
                reasoning = f"Downward momentum detected ({change_24h:.1f}%), exiting position"
        
        elif strategy == "mean_reversion":
            if rsi < 30:
                action = "buy"
                confidence = min(95, 60 + (30 - rsi) * 2)
                reasoning = f"Asset oversold (RSI: {rsi}), expecting mean reversion"
            elif rsi > 70:
                action = "sell"
                confidence = min(95, 60 + (rsi - 70) * 2)
                reasoning = f"Asset overbought (RSI: {rsi}), expecting pullback"
        
        elif strategy == "trend_following":
            if change_24h > 1 and signals["trend"] == "bullish":
                action = "buy"
                confidence = 70
                reasoning = "Uptrend confirmed, following the trend"
            elif change_24h < -1 and signals["trend"] == "bearish":
                action = "sell"
                confidence = 70
                reasoning = "Downtrend confirmed, following the trend"
        
        elif strategy == "contrarian":
            if rsi < 25 and change_24h < -5:
                action = "buy"
                confidence = 75
                reasoning = f"Extreme fear detected (RSI: {rsi}, -5%+), contrarian buy signal"
            elif rsi > 75 and change_24h > 5:
                action = "sell"
                confidence = 75
                reasoning = f"Extreme greed detected (RSI: {rsi}, +5%+), contrarian sell signal"
        
        confidence = confidence * (agent.risk_tolerance / 100 + 0.5)
        confidence = min(99, max(1, confidence))
        
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
        decisions = self._decisions_cache.get(agent_id, [])
        return sorted(decisions, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_agent_performance(self, agent_id: str) -> Optional[AgentPerformance]:
        """Get performance metrics for an agent"""
        return self._performance_cache.get(agent_id)
    
    def get_templates(self) -> Dict:
        """Get all available agent templates"""
        return AGENT_TEMPLATES
    
    def chat_with_agent(self, agent_id: str, message: str, market_context: Dict = None) -> Dict:
        """Interactive chat with agent about trading decisions"""
        agent = self._in_memory_cache.get(agent_id)
        if not agent:
            return {"error": "Agent not found"}
        
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
            "momentum": {
                "default": f"As a momentum trader, I'm always watching for breakouts. Currently analyzing price action and volume patterns.",
                "buy": f"I see momentum building! When price moves {agent.entry_confidence_threshold}%+ with volume, I strike.",
                "strategy": f"My approach: catch the wave early, ride it hard, exit before it crashes. Stop loss at {agent.stop_loss_pct}%, take profit at {agent.take_profit_pct}%."
            },
            "mean_reversion": {
                "default": f"I'm patiently waiting for extremes. Markets always revert to the mean - that's where I profit.",
                "buy": f"When RSI drops below 30, that's my signal. I wait for oversold conditions and buy the dip.",
                "strategy": f"Buy fear, sell greed. Position size: {agent.position_size_pct}% per trade. Patience is key."
            },
            "contrarian": {
                "default": f"When the crowd panics, I see opportunity. Going against the herd is my edge.",
                "buy": f"Maximum fear = maximum opportunity. I accumulate when others are liquidating.",
                "strategy": f"Be greedy when others are fearful. My risk tolerance is {agent.risk_tolerance}/100."
            },
            "trend_following": {
                "default": f"I follow the trend. The trend is your friend until it ends.",
                "buy": f"I wait for confirmed trends before entering. No prediction, just reaction.",
                "strategy": f"Trailing stops at {agent.trailing_stop_pct}% protect my gains while letting winners run."
            },
            "sentiment_based": {
                "default": f"I watch the news and social sentiment like a hawk. Market psychology drives prices.",
                "buy": f"When sentiment turns positive with volume, I'm ready to move fast.",
                "strategy": f"Quick in, quick out. My edge is speed and sentiment reading."
            },
            "technical_analysis": {
                "default": f"The chart tells me everything. RSI, MACD, Bollinger - these are my tools.",
                "buy": f"I wait for technical confluence - multiple indicators aligning.",
                "strategy": f"Pure price action. No emotions, just math and patterns."
            }
        }
        
        responses = strategy_responses.get(agent.strategy, strategy_responses["momentum"])
        
        if any(word in message_lower for word in ["strategy", "approach", "how do you"]):
            return responses["strategy"]
        elif any(word in message_lower for word in ["buy", "enter", "position"]):
            return responses["buy"]
        else:
            return responses["default"]


# Global instance (will be initialized with DB in server.py)
ai_trading_engine = AITradingAgentEngine()
