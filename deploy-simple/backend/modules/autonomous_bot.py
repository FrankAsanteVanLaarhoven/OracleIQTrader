"""
Autonomous Trading Bot Module
AI-powered trading bot with multiple strategies and risk management
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import random
import asyncio
import logging

logger = logging.getLogger(__name__)

# ============ ENUMS ============

class TradingStrategy(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class BotMode(str, Enum):
    FULL_AUTO = "full_auto"
    SEMI_AUTO = "semi_auto"
    PAUSED = "paused"

class SignalStrength(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"

# ============ MODELS ============

class RiskSettings(BaseModel):
    """Risk management configuration"""
    max_trade_size_usd: float = 1000.0  # Max per trade
    max_trade_size_percent: float = 5.0  # Max % of portfolio per trade
    daily_loss_limit_usd: float = 500.0
    daily_loss_limit_percent: float = 2.0
    max_portfolio_allocation_percent: float = 80.0  # Keep 20% in cash
    max_positions: int = 10
    stop_loss_percent: float = 5.0  # Default stop loss
    take_profit_percent: float = 10.0  # Default take profit
    trailing_stop_enabled: bool = False
    trailing_stop_percent: float = 3.0

class StrategySettings(BaseModel):
    """Strategy-specific settings"""
    strategy: TradingStrategy = TradingStrategy.MODERATE
    
    # Technical indicators to use
    use_rsi: bool = True
    use_macd: bool = True
    use_bollinger: bool = True
    use_moving_averages: bool = True
    use_volume_analysis: bool = True
    
    # Sentiment analysis
    use_social_sentiment: bool = True
    use_fear_greed_index: bool = True
    
    # AI analysis
    use_ai_prediction: bool = True
    confidence_threshold: float = 0.7  # Min confidence to trade
    
    # Timing
    check_interval_seconds: int = 60  # How often to analyze
    min_hold_time_minutes: int = 5  # Minimum position hold time

class TradingBot(BaseModel):
    """Autonomous trading bot configuration"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str  # Linked trading account
    name: str = "Oracle Bot"
    mode: BotMode = BotMode.PAUSED
    
    # Settings
    risk_settings: RiskSettings = Field(default_factory=RiskSettings)
    strategy_settings: StrategySettings = Field(default_factory=StrategySettings)
    
    # Trading pairs to monitor
    trading_pairs: List[str] = ["BTC", "ETH", "SOL"]
    
    # Performance tracking
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_pnl: float = 0.0
    today_pnl: float = 0.0
    today_trades: int = 0
    
    # State
    is_active: bool = False
    last_analysis: Optional[str] = None
    last_trade: Optional[str] = None
    pending_signals: List[Dict] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TradeSignal(BaseModel):
    """AI-generated trade signal"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bot_id: str
    symbol: str
    signal: SignalStrength
    confidence: float  # 0-1
    
    # Analysis details
    technical_score: float = 0.0  # -1 to 1
    sentiment_score: float = 0.0  # -1 to 1
    ai_score: float = 0.0  # -1 to 1
    
    # Recommendation
    action: str  # "buy", "sell", "hold"
    quantity: Optional[float] = None
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    
    # Reasoning
    reasoning: List[str] = []
    
    # Status
    status: str = "pending"  # pending, approved, rejected, executed, expired
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: Optional[str] = None

# ============ BOT ENGINE ============

class AutonomousBotEngine:
    """Engine for running autonomous trading bots"""
    
    def __init__(self, db, playground_engine=None):
        self.db = db
        self.playground_engine = playground_engine
        self.running_bots = {}
        
    async def create_bot(self, user_id: str, account_id: str, 
                         strategy: TradingStrategy = TradingStrategy.MODERATE,
                         trading_pairs: List[str] = None) -> TradingBot:
        """Create a new trading bot"""
        
        # Set strategy-specific defaults
        risk_settings = RiskSettings()
        strategy_settings = StrategySettings(strategy=strategy)
        
        if strategy == TradingStrategy.CONSERVATIVE:
            risk_settings.max_trade_size_percent = 2.0
            risk_settings.daily_loss_limit_percent = 1.0
            risk_settings.stop_loss_percent = 3.0
            risk_settings.take_profit_percent = 5.0
            strategy_settings.confidence_threshold = 0.85
            strategy_settings.check_interval_seconds = 300
            
        elif strategy == TradingStrategy.AGGRESSIVE:
            risk_settings.max_trade_size_percent = 10.0
            risk_settings.daily_loss_limit_percent = 5.0
            risk_settings.stop_loss_percent = 10.0
            risk_settings.take_profit_percent = 20.0
            strategy_settings.confidence_threshold = 0.6
            strategy_settings.check_interval_seconds = 30
        
        bot = TradingBot(
            user_id=user_id,
            account_id=account_id,
            risk_settings=risk_settings,
            strategy_settings=strategy_settings,
            trading_pairs=trading_pairs or ["BTC", "ETH", "SOL"]
        )
        
        await self.db.trading_bots.insert_one(bot.model_dump())
        return bot
    
    async def get_bot(self, bot_id: str) -> Optional[TradingBot]:
        """Get bot by ID"""
        doc = await self.db.trading_bots.find_one({"id": bot_id}, {"_id": 0})
        return TradingBot(**doc) if doc else None
    
    async def get_user_bots(self, user_id: str) -> List[TradingBot]:
        """Get all bots for a user"""
        docs = await self.db.trading_bots.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(100)
        return [TradingBot(**doc) for doc in docs]
    
    async def update_bot_mode(self, bot_id: str, mode: BotMode) -> Dict:
        """Update bot operating mode"""
        bot = await self.get_bot(bot_id)
        if not bot:
            return {"success": False, "error": "Bot not found"}
        
        bot.mode = mode
        bot.is_active = mode != BotMode.PAUSED
        bot.updated_at = datetime.now(timezone.utc).isoformat()
        
        await self.db.trading_bots.update_one(
            {"id": bot_id},
            {"$set": {"mode": mode, "is_active": bot.is_active, "updated_at": bot.updated_at}}
        )
        
        if mode == BotMode.FULL_AUTO:
            # Start bot loop
            asyncio.create_task(self.run_bot_loop(bot_id))
        
        return {"success": True, "mode": mode}
    
    async def analyze_market(self, symbol: str) -> Dict:
        """Analyze market conditions for a symbol"""
        
        # Simulated technical analysis
        rsi = random.uniform(20, 80)
        macd_signal = random.choice(["bullish", "bearish", "neutral"])
        bb_position = random.choice(["upper", "middle", "lower"])
        ma_trend = random.choice(["uptrend", "downtrend", "sideways"])
        volume_trend = random.choice(["increasing", "decreasing", "stable"])
        
        # Calculate technical score (-1 to 1)
        technical_score = 0
        
        if rsi < 30:  # Oversold - bullish
            technical_score += 0.3
        elif rsi > 70:  # Overbought - bearish
            technical_score -= 0.3
            
        if macd_signal == "bullish":
            technical_score += 0.2
        elif macd_signal == "bearish":
            technical_score -= 0.2
            
        if bb_position == "lower":
            technical_score += 0.2
        elif bb_position == "upper":
            technical_score -= 0.2
            
        if ma_trend == "uptrend":
            technical_score += 0.15
        elif ma_trend == "downtrend":
            technical_score -= 0.15
            
        if volume_trend == "increasing":
            technical_score += 0.1
        
        # Simulated sentiment analysis
        social_sentiment = random.uniform(-1, 1)
        fear_greed = random.randint(0, 100)
        
        sentiment_score = social_sentiment * 0.5
        if fear_greed < 25:  # Extreme fear - contrarian buy
            sentiment_score += 0.3
        elif fear_greed > 75:  # Extreme greed - contrarian sell
            sentiment_score -= 0.3
        
        # Simulated AI prediction
        ai_score = random.uniform(-0.5, 0.5)
        ai_confidence = random.uniform(0.5, 0.95)
        
        # Combined score
        total_score = (technical_score * 0.4 + sentiment_score * 0.3 + ai_score * 0.3)
        
        return {
            "symbol": symbol,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "technical": {
                "rsi": rsi,
                "macd": macd_signal,
                "bollinger": bb_position,
                "ma_trend": ma_trend,
                "volume": volume_trend,
                "score": technical_score
            },
            "sentiment": {
                "social": social_sentiment,
                "fear_greed": fear_greed,
                "score": sentiment_score
            },
            "ai_prediction": {
                "score": ai_score,
                "confidence": ai_confidence
            },
            "total_score": total_score,
            "overall_confidence": (ai_confidence + 0.7) / 2  # Blend confidence
        }
    
    async def generate_signal(self, bot: TradingBot, symbol: str, 
                             analysis: Dict, current_price: float) -> TradeSignal:
        """Generate a trade signal based on analysis"""
        
        total_score = analysis["total_score"]
        confidence = analysis["overall_confidence"]
        
        # Determine signal strength
        if total_score > 0.5:
            signal = SignalStrength.STRONG_BUY
            action = "buy"
        elif total_score > 0.2:
            signal = SignalStrength.BUY
            action = "buy"
        elif total_score < -0.5:
            signal = SignalStrength.STRONG_SELL
            action = "sell"
        elif total_score < -0.2:
            signal = SignalStrength.SELL
            action = "sell"
        else:
            signal = SignalStrength.HOLD
            action = "hold"
        
        # Calculate position size based on risk settings
        quantity = None
        stop_loss = None
        take_profit = None
        
        if action != "hold":
            # Get account balance (would integrate with playground engine)
            account_balance = 100000  # Placeholder
            
            max_position_usd = min(
                bot.risk_settings.max_trade_size_usd,
                account_balance * (bot.risk_settings.max_trade_size_percent / 100)
            )
            
            quantity = max_position_usd / current_price
            
            if action == "buy":
                stop_loss = current_price * (1 - bot.risk_settings.stop_loss_percent / 100)
                take_profit = current_price * (1 + bot.risk_settings.take_profit_percent / 100)
            else:
                stop_loss = current_price * (1 + bot.risk_settings.stop_loss_percent / 100)
                take_profit = current_price * (1 - bot.risk_settings.take_profit_percent / 100)
        
        # Build reasoning
        reasoning = []
        tech = analysis["technical"]
        sent = analysis["sentiment"]
        
        if tech["rsi"] < 30:
            reasoning.append(f"RSI ({tech['rsi']:.1f}) indicates oversold conditions")
        elif tech["rsi"] > 70:
            reasoning.append(f"RSI ({tech['rsi']:.1f}) indicates overbought conditions")
            
        reasoning.append(f"MACD showing {tech['macd']} signal")
        reasoning.append(f"Price near {tech['bollinger']} Bollinger Band")
        reasoning.append(f"Moving averages indicate {tech['ma_trend']}")
        reasoning.append(f"Fear & Greed Index at {sent['fear_greed']}")
        reasoning.append(f"Social sentiment: {'positive' if sent['social'] > 0 else 'negative'}")
        
        trade_signal = TradeSignal(
            bot_id=bot.id,
            symbol=symbol,
            signal=signal,
            confidence=confidence,
            technical_score=analysis["technical"]["score"],
            sentiment_score=analysis["sentiment"]["score"],
            ai_score=analysis["ai_prediction"]["score"],
            action=action,
            quantity=quantity,
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            reasoning=reasoning,
            expires_at=(datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        )
        
        await self.db.trade_signals.insert_one(trade_signal.model_dump())
        return trade_signal
    
    async def approve_signal(self, signal_id: str) -> Dict:
        """Approve a pending signal (for semi-auto mode)"""
        signal_doc = await self.db.trade_signals.find_one({"id": signal_id}, {"_id": 0})
        if not signal_doc:
            return {"success": False, "error": "Signal not found"}
        
        signal = TradeSignal(**signal_doc)
        
        if signal.status != "pending":
            return {"success": False, "error": "Signal is not pending"}
        
        # Execute the trade
        result = await self.execute_signal(signal)
        
        return result
    
    async def reject_signal(self, signal_id: str) -> Dict:
        """Reject a pending signal"""
        await self.db.trade_signals.update_one(
            {"id": signal_id},
            {"$set": {"status": "rejected"}}
        )
        return {"success": True, "message": "Signal rejected"}
    
    async def execute_signal(self, signal: TradeSignal) -> Dict:
        """Execute a trade signal"""
        bot = await self.get_bot(signal.bot_id)
        if not bot:
            return {"success": False, "error": "Bot not found"}
        
        # Check daily loss limit
        if bot.today_pnl < -bot.risk_settings.daily_loss_limit_usd:
            signal.status = "rejected"
            await self.db.trade_signals.update_one(
                {"id": signal.id},
                {"$set": {"status": "rejected"}}
            )
            return {"success": False, "error": "Daily loss limit reached"}
        
        # Execute through playground engine if available
        if self.playground_engine and signal.action != "hold":
            from .trading_playground import PlaygroundOrder
            
            order = PlaygroundOrder(
                account_id=bot.account_id,
                symbol=signal.symbol,
                side=signal.action,
                order_type="market",
                quantity=signal.quantity or 0.01,
                stop_loss_price=signal.stop_loss,
                take_profit_price=signal.take_profit
            )
            
            result = await self.playground_engine.execute_market_order(order)
            
            if result["success"]:
                signal.status = "executed"
                bot.total_trades += 1
                bot.today_trades += 1
                bot.last_trade = datetime.now(timezone.utc).isoformat()
            else:
                signal.status = "rejected"
        else:
            signal.status = "executed"  # Simulated execution
        
        await self.db.trade_signals.update_one(
            {"id": signal.id},
            {"$set": {"status": signal.status}}
        )
        
        bot.updated_at = datetime.now(timezone.utc).isoformat()
        await self.db.trading_bots.update_one(
            {"id": bot.id},
            {"$set": {
                "total_trades": bot.total_trades,
                "today_trades": bot.today_trades,
                "last_trade": bot.last_trade,
                "updated_at": bot.updated_at
            }}
        )
        
        return {
            "success": True,
            "signal": signal.model_dump(),
            "message": f"Trade {signal.action} {signal.symbol} executed"
        }
    
    async def run_bot_loop(self, bot_id: str):
        """Main loop for running a bot in full-auto mode"""
        logger.info(f"Starting bot loop for {bot_id}")
        
        while True:
            bot = await self.get_bot(bot_id)
            if not bot or bot.mode != BotMode.FULL_AUTO:
                logger.info(f"Bot {bot_id} stopped or mode changed")
                break
            
            try:
                for symbol in bot.trading_pairs:
                    # Analyze market
                    analysis = await self.analyze_market(symbol)
                    
                    # Get current price (simulated)
                    current_price = random.uniform(90000, 100000) if symbol == "BTC" else random.uniform(2800, 3500)
                    
                    # Generate signal
                    signal = await self.generate_signal(bot, symbol, analysis, current_price)
                    
                    # Check if signal meets confidence threshold
                    if signal.confidence >= bot.strategy_settings.confidence_threshold:
                        if signal.action != "hold":
                            # Auto-execute in full auto mode
                            await self.execute_signal(signal)
                    
                    bot.last_analysis = datetime.now(timezone.utc).isoformat()
                    await self.db.trading_bots.update_one(
                        {"id": bot.id},
                        {"$set": {"last_analysis": bot.last_analysis}}
                    )
                
            except Exception as e:
                logger.error(f"Bot {bot_id} error: {e}")
            
            # Wait for next analysis cycle
            await asyncio.sleep(bot.strategy_settings.check_interval_seconds)
    
    async def get_bot_performance(self, bot_id: str) -> Dict:
        """Get bot performance statistics"""
        bot = await self.get_bot(bot_id)
        if not bot:
            return {"error": "Bot not found"}
        
        # Get recent signals
        signals = await self.db.trade_signals.find(
            {"bot_id": bot_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        executed = [s for s in signals if s["status"] == "executed"]
        
        return {
            "bot_id": bot_id,
            "total_trades": bot.total_trades,
            "winning_trades": bot.winning_trades,
            "losing_trades": bot.losing_trades,
            "win_rate": (bot.winning_trades / bot.total_trades * 100) if bot.total_trades > 0 else 0,
            "total_pnl": bot.total_pnl,
            "today_pnl": bot.today_pnl,
            "today_trades": bot.today_trades,
            "last_analysis": bot.last_analysis,
            "last_trade": bot.last_trade,
            "recent_signals": signals[:10],
            "mode": bot.mode,
            "strategy": bot.strategy_settings.strategy
        }
    
    async def get_pending_signals(self, bot_id: str) -> List[Dict]:
        """Get pending signals for semi-auto mode"""
        signals = await self.db.trade_signals.find(
            {"bot_id": bot_id, "status": "pending"},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return signals
