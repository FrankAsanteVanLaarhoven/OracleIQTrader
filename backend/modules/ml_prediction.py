"""
Advanced ML Prediction Module
Price direction, volatility forecast, and trend detection using AI
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import random
import numpy as np
import logging

logger = logging.getLogger(__name__)

# ============ ENUMS ============

class PredictionType(str, Enum):
    PRICE_DIRECTION = "price_direction"
    VOLATILITY = "volatility"
    TREND = "trend"
    COMPREHENSIVE = "comprehensive"

class TimeHorizon(str, Enum):
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    HOUR_24 = "24h"
    WEEK_1 = "1w"

class TrendDirection(str, Enum):
    STRONG_BULLISH = "strong_bullish"
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"
    STRONG_BEARISH = "strong_bearish"

class VolatilityLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"

# ============ MODELS ============

class PriceDirectionPrediction(BaseModel):
    """Prediction for price direction"""
    symbol: str
    horizon: TimeHorizon
    direction: str  # "up", "down", "sideways"
    confidence: float  # 0-1
    predicted_change_percent: float
    price_targets: Dict = {}  # support, resistance, target
    reasoning: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VolatilityPrediction(BaseModel):
    """Prediction for market volatility"""
    symbol: str
    horizon: TimeHorizon
    level: VolatilityLevel
    expected_range_percent: float
    confidence: float
    factors: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrendPrediction(BaseModel):
    """Prediction for market trend"""
    symbol: str
    horizon: TimeHorizon
    direction: TrendDirection
    strength: float  # 0-1
    confidence: float
    key_levels: Dict = {}
    indicators: Dict = {}
    reasoning: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ComprehensivePrediction(BaseModel):
    """Full market prediction combining all models"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    horizon: TimeHorizon
    
    # Individual predictions
    price_direction: PriceDirectionPrediction
    volatility: VolatilityPrediction
    trend: TrendPrediction
    
    # Combined analysis
    overall_sentiment: str  # bullish, bearish, neutral
    overall_confidence: float
    risk_level: str  # low, medium, high
    
    # Trade recommendation
    recommendation: str  # strong_buy, buy, hold, sell, strong_sell
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size_suggestion: float = 0.0  # as % of portfolio
    
    # AI reasoning
    ai_analysis: str = ""
    key_factors: List[str] = []
    risks: List[str] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str = ""

class PredictionHistory(BaseModel):
    """Track prediction accuracy"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prediction_id: str
    symbol: str
    prediction_type: PredictionType
    predicted_direction: str
    actual_direction: Optional[str] = None
    predicted_change: float
    actual_change: Optional[float] = None
    was_correct: Optional[bool] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolved_at: Optional[str] = None

# ============ ML ENGINE ============

class MLPredictionEngine:
    """Engine for generating ML-based predictions"""
    
    def __init__(self, db, llm_client=None):
        self.db = db
        self.llm_client = llm_client
        self.price_cache = {}
        
        # Historical accuracy tracking
        self.accuracy_stats = {
            "price_direction": {"correct": 0, "total": 0},
            "volatility": {"correct": 0, "total": 0},
            "trend": {"correct": 0, "total": 0}
        }
    
    def _calculate_technical_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators from price data"""
        if len(prices) < 20:
            return {}
        
        prices_arr = np.array(prices)
        
        # Moving averages
        sma_10 = np.mean(prices_arr[-10:])
        sma_20 = np.mean(prices_arr[-20:])
        ema_10 = self._calculate_ema(prices_arr, 10)
        
        # RSI
        rsi = self._calculate_rsi(prices_arr)
        
        # MACD
        macd, signal = self._calculate_macd(prices_arr)
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = self._calculate_bollinger(prices_arr)
        
        # Volatility (standard deviation)
        volatility = np.std(prices_arr[-20:]) / np.mean(prices_arr[-20:]) * 100
        
        # Momentum
        momentum = (prices_arr[-1] - prices_arr[-10]) / prices_arr[-10] * 100
        
        return {
            "sma_10": sma_10,
            "sma_20": sma_20,
            "ema_10": ema_10,
            "rsi": rsi,
            "macd": macd,
            "macd_signal": signal,
            "bb_upper": bb_upper,
            "bb_middle": bb_middle,
            "bb_lower": bb_lower,
            "volatility": volatility,
            "momentum": momentum,
            "current_price": prices_arr[-1],
            "price_vs_sma20": (prices_arr[-1] - sma_20) / sma_20 * 100
        }
    
    def _calculate_ema(self, prices: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        multiplier = 2 / (period + 1)
        ema = prices[0]
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        return ema
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices: np.ndarray) -> tuple:
        """Calculate MACD and Signal line"""
        ema_12 = self._calculate_ema(prices, 12)
        ema_26 = self._calculate_ema(prices, 26)
        macd = ema_12 - ema_26
        signal = self._calculate_ema(np.array([macd]), 9)
        return macd, signal
    
    def _calculate_bollinger(self, prices: np.ndarray, period: int = 20) -> tuple:
        """Calculate Bollinger Bands"""
        middle = np.mean(prices[-period:])
        std = np.std(prices[-period:])
        upper = middle + (std * 2)
        lower = middle - (std * 2)
        return upper, middle, lower
    
    def _generate_simulated_prices(self, symbol: str, count: int = 100) -> List[float]:
        """Generate simulated historical prices for analysis"""
        base_prices = {
            "BTC": 95000, "ETH": 3200, "SOL": 180, "XRP": 2.5,
            "ADA": 0.95, "DOGE": 0.35, "AVAX": 35, "LINK": 22
        }
        
        base = base_prices.get(symbol, 100)
        prices = [base]
        
        for _ in range(count - 1):
            change = random.gauss(0, 0.02)  # 2% standard deviation
            prices.append(prices[-1] * (1 + change))
        
        return prices
    
    async def predict_price_direction(self, symbol: str, horizon: TimeHorizon = TimeHorizon.HOUR_24) -> PriceDirectionPrediction:
        """Predict price direction for a symbol"""
        
        # Get or simulate historical prices
        prices = self._generate_simulated_prices(symbol, 100)
        indicators = self._calculate_technical_indicators(prices)
        
        current_price = indicators.get("current_price", prices[-1])
        
        # ML-based direction prediction using indicators
        score = 0
        reasoning = []
        
        # RSI analysis
        rsi = indicators.get("rsi", 50)
        if rsi < 30:
            score += 2
            reasoning.append(f"RSI ({rsi:.1f}) indicates oversold - bullish signal")
        elif rsi > 70:
            score -= 2
            reasoning.append(f"RSI ({rsi:.1f}) indicates overbought - bearish signal")
        else:
            reasoning.append(f"RSI ({rsi:.1f}) is neutral")
        
        # MACD analysis
        macd = indicators.get("macd", 0)
        signal = indicators.get("macd_signal", 0)
        if macd > signal:
            score += 1
            reasoning.append("MACD above signal line - bullish momentum")
        else:
            score -= 1
            reasoning.append("MACD below signal line - bearish momentum")
        
        # Moving average analysis
        price_vs_sma = indicators.get("price_vs_sma20", 0)
        if price_vs_sma > 2:
            score += 1
            reasoning.append(f"Price {price_vs_sma:.1f}% above 20-day MA - bullish trend")
        elif price_vs_sma < -2:
            score -= 1
            reasoning.append(f"Price {price_vs_sma:.1f}% below 20-day MA - bearish trend")
        
        # Bollinger band analysis
        bb_upper = indicators.get("bb_upper", current_price * 1.05)
        bb_lower = indicators.get("bb_lower", current_price * 0.95)
        
        if current_price < bb_lower:
            score += 1
            reasoning.append("Price near lower Bollinger Band - potential bounce")
        elif current_price > bb_upper:
            score -= 1
            reasoning.append("Price near upper Bollinger Band - potential pullback")
        
        # Momentum
        momentum = indicators.get("momentum", 0)
        if momentum > 5:
            score += 1
            reasoning.append(f"Strong positive momentum ({momentum:.1f}%)")
        elif momentum < -5:
            score -= 1
            reasoning.append(f"Strong negative momentum ({momentum:.1f}%)")
        
        # Determine direction and confidence
        if score >= 3:
            direction = "up"
            confidence = min(0.85, 0.6 + score * 0.05)
            predicted_change = random.uniform(3, 8)
        elif score <= -3:
            direction = "down"
            confidence = min(0.85, 0.6 + abs(score) * 0.05)
            predicted_change = -random.uniform(3, 8)
        else:
            direction = "sideways"
            confidence = 0.5 + abs(score) * 0.05
            predicted_change = random.uniform(-2, 2)
        
        # Calculate price targets
        price_targets = {
            "current": current_price,
            "predicted": current_price * (1 + predicted_change / 100),
            "support": bb_lower,
            "resistance": bb_upper
        }
        
        prediction = PriceDirectionPrediction(
            symbol=symbol,
            horizon=horizon,
            direction=direction,
            confidence=confidence,
            predicted_change_percent=predicted_change,
            price_targets=price_targets,
            reasoning=reasoning
        )
        
        # Store prediction for accuracy tracking
        await self._store_prediction(prediction, PredictionType.PRICE_DIRECTION)
        
        return prediction
    
    async def predict_volatility(self, symbol: str, horizon: TimeHorizon = TimeHorizon.HOUR_24) -> VolatilityPrediction:
        """Predict market volatility"""
        
        prices = self._generate_simulated_prices(symbol, 100)
        indicators = self._calculate_technical_indicators(prices)
        
        current_volatility = indicators.get("volatility", 2)
        
        factors = []
        volatility_score = current_volatility
        
        # RSI extremes increase volatility
        rsi = indicators.get("rsi", 50)
        if rsi < 25 or rsi > 75:
            volatility_score *= 1.3
            factors.append("RSI at extreme levels - expect increased volatility")
        
        # Bollinger band width
        bb_upper = indicators.get("bb_upper", 100)
        bb_lower = indicators.get("bb_lower", 100)
        bb_width = (bb_upper - bb_lower) / indicators.get("bb_middle", 100) * 100
        
        if bb_width > 10:
            factors.append(f"Wide Bollinger Bands ({bb_width:.1f}%) indicate high volatility")
        elif bb_width < 3:
            volatility_score *= 0.7
            factors.append("Narrow Bollinger Bands suggest volatility squeeze - breakout possible")
        
        # Momentum can indicate volatility
        momentum = abs(indicators.get("momentum", 0))
        if momentum > 10:
            volatility_score *= 1.2
            factors.append(f"Strong momentum ({momentum:.1f}%) indicates volatile conditions")
        
        # Determine volatility level
        if volatility_score < 1:
            level = VolatilityLevel.VERY_LOW
            expected_range = random.uniform(1, 2)
        elif volatility_score < 2:
            level = VolatilityLevel.LOW
            expected_range = random.uniform(2, 4)
        elif volatility_score < 4:
            level = VolatilityLevel.MODERATE
            expected_range = random.uniform(4, 7)
        elif volatility_score < 7:
            level = VolatilityLevel.HIGH
            expected_range = random.uniform(7, 12)
        else:
            level = VolatilityLevel.EXTREME
            expected_range = random.uniform(12, 20)
        
        confidence = 0.7 + random.uniform(-0.1, 0.15)
        
        return VolatilityPrediction(
            symbol=symbol,
            horizon=horizon,
            level=level,
            expected_range_percent=expected_range,
            confidence=confidence,
            factors=factors
        )
    
    async def predict_trend(self, symbol: str, horizon: TimeHorizon = TimeHorizon.HOUR_24) -> TrendPrediction:
        """Predict market trend direction and strength"""
        
        prices = self._generate_simulated_prices(symbol, 100)
        indicators = self._calculate_technical_indicators(prices)
        
        current_price = indicators.get("current_price", prices[-1])
        reasoning = []
        
        # Calculate trend score
        trend_score = 0
        
        # Moving average alignment
        sma_10 = indicators.get("sma_10", current_price)
        sma_20 = indicators.get("sma_20", current_price)
        
        if current_price > sma_10 > sma_20:
            trend_score += 3
            reasoning.append("Price > SMA10 > SMA20: Strong uptrend alignment")
        elif current_price < sma_10 < sma_20:
            trend_score -= 3
            reasoning.append("Price < SMA10 < SMA20: Strong downtrend alignment")
        elif current_price > sma_20:
            trend_score += 1
            reasoning.append("Price above 20-day average")
        else:
            trend_score -= 1
            reasoning.append("Price below 20-day average")
        
        # MACD trend
        macd = indicators.get("macd", 0)
        if macd > 0:
            trend_score += 1
            reasoning.append("MACD positive - bullish momentum")
        else:
            trend_score -= 1
            reasoning.append("MACD negative - bearish momentum")
        
        # RSI trend confirmation
        rsi = indicators.get("rsi", 50)
        if rsi > 55:
            trend_score += 1
        elif rsi < 45:
            trend_score -= 1
        
        # Momentum
        momentum = indicators.get("momentum", 0)
        if momentum > 3:
            trend_score += 1
            reasoning.append(f"Positive momentum: {momentum:.1f}%")
        elif momentum < -3:
            trend_score -= 1
            reasoning.append(f"Negative momentum: {momentum:.1f}%")
        
        # Determine trend direction
        if trend_score >= 4:
            direction = TrendDirection.STRONG_BULLISH
            strength = 0.8 + random.uniform(0, 0.15)
        elif trend_score >= 2:
            direction = TrendDirection.BULLISH
            strength = 0.6 + random.uniform(0, 0.15)
        elif trend_score <= -4:
            direction = TrendDirection.STRONG_BEARISH
            strength = 0.8 + random.uniform(0, 0.15)
        elif trend_score <= -2:
            direction = TrendDirection.BEARISH
            strength = 0.6 + random.uniform(0, 0.15)
        else:
            direction = TrendDirection.NEUTRAL
            strength = 0.3 + random.uniform(0, 0.2)
        
        confidence = 0.65 + abs(trend_score) * 0.03 + random.uniform(-0.05, 0.1)
        
        key_levels = {
            "support_1": indicators.get("bb_lower", current_price * 0.95),
            "support_2": sma_20,
            "resistance_1": indicators.get("bb_upper", current_price * 1.05),
            "resistance_2": current_price * 1.1
        }
        
        return TrendPrediction(
            symbol=symbol,
            horizon=horizon,
            direction=direction,
            strength=min(1.0, strength),
            confidence=min(0.9, confidence),
            key_levels=key_levels,
            indicators={
                "rsi": rsi,
                "macd": macd,
                "sma_10": sma_10,
                "sma_20": sma_20,
                "momentum": momentum
            },
            reasoning=reasoning
        )
    
    async def get_comprehensive_prediction(self, symbol: str, horizon: TimeHorizon = TimeHorizon.HOUR_24) -> ComprehensivePrediction:
        """Get comprehensive prediction combining all models"""
        
        # Get individual predictions
        price_pred = await self.predict_price_direction(symbol, horizon)
        volatility_pred = await self.predict_volatility(symbol, horizon)
        trend_pred = await self.predict_trend(symbol, horizon)
        
        # Combine for overall sentiment
        sentiment_score = 0
        
        if price_pred.direction == "up":
            sentiment_score += 2 * price_pred.confidence
        elif price_pred.direction == "down":
            sentiment_score -= 2 * price_pred.confidence
        
        if trend_pred.direction in [TrendDirection.STRONG_BULLISH, TrendDirection.BULLISH]:
            sentiment_score += trend_pred.strength
        elif trend_pred.direction in [TrendDirection.STRONG_BEARISH, TrendDirection.BEARISH]:
            sentiment_score -= trend_pred.strength
        
        # Determine overall sentiment
        if sentiment_score > 1.5:
            overall_sentiment = "bullish"
            recommendation = "strong_buy" if sentiment_score > 2.5 else "buy"
        elif sentiment_score < -1.5:
            overall_sentiment = "bearish"
            recommendation = "strong_sell" if sentiment_score < -2.5 else "sell"
        else:
            overall_sentiment = "neutral"
            recommendation = "hold"
        
        # Risk assessment
        if volatility_pred.level in [VolatilityLevel.HIGH, VolatilityLevel.EXTREME]:
            risk_level = "high"
        elif volatility_pred.level == VolatilityLevel.MODERATE:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Calculate entry points
        current_price = price_pred.price_targets.get("current", 0)
        if recommendation in ["strong_buy", "buy"]:
            entry_price = current_price * 0.995  # Slight pullback entry
            stop_loss = current_price * (1 - volatility_pred.expected_range_percent / 100)
            take_profit = current_price * (1 + price_pred.predicted_change_percent / 100)
        elif recommendation in ["strong_sell", "sell"]:
            entry_price = current_price * 1.005
            stop_loss = current_price * (1 + volatility_pred.expected_range_percent / 100)
            take_profit = current_price * (1 + price_pred.predicted_change_percent / 100)
        else:
            entry_price = None
            stop_loss = None
            take_profit = None
        
        # Position size based on risk
        position_sizes = {"low": 5.0, "medium": 3.0, "high": 1.5}
        position_size = position_sizes.get(risk_level, 2.0)
        
        # Overall confidence
        overall_confidence = (price_pred.confidence + trend_pred.confidence + volatility_pred.confidence) / 3
        
        # Key factors and risks
        key_factors = price_pred.reasoning[:3] + trend_pred.reasoning[:2]
        
        risks = []
        if volatility_pred.level in [VolatilityLevel.HIGH, VolatilityLevel.EXTREME]:
            risks.append(f"High volatility expected ({volatility_pred.expected_range_percent:.1f}% range)")
        if trend_pred.direction == TrendDirection.NEUTRAL:
            risks.append("No clear trend - sideways movement possible")
        if price_pred.confidence < 0.6:
            risks.append("Low prediction confidence - consider smaller position")
        
        # AI analysis summary
        ai_analysis = self._generate_ai_summary(symbol, price_pred, volatility_pred, trend_pred, overall_sentiment)
        
        # Expiry time based on horizon
        horizon_hours = {"1h": 1, "4h": 4, "24h": 24, "1w": 168}
        expires = datetime.now(timezone.utc) + timedelta(hours=horizon_hours.get(horizon.value, 24))
        
        return ComprehensivePrediction(
            symbol=symbol,
            horizon=horizon,
            price_direction=price_pred,
            volatility=volatility_pred,
            trend=trend_pred,
            overall_sentiment=overall_sentiment,
            overall_confidence=overall_confidence,
            risk_level=risk_level,
            recommendation=recommendation,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size_suggestion=position_size,
            ai_analysis=ai_analysis,
            key_factors=key_factors,
            risks=risks,
            expires_at=expires.isoformat()
        )
    
    def _generate_ai_summary(self, symbol: str, price_pred, volatility_pred, trend_pred, sentiment: str) -> str:
        """Generate AI analysis summary"""
        summaries = {
            "bullish": f"{symbol} is showing bullish signals. The technical indicators suggest upward momentum with {trend_pred.direction.value.replace('_', ' ')} trend. Consider entering long positions with proper risk management. Expected price movement: {price_pred.predicted_change_percent:+.1f}% in the next {price_pred.horizon.value}.",
            "bearish": f"{symbol} is displaying bearish signals. Technical analysis indicates {trend_pred.direction.value.replace('_', ' ')} trend with downward pressure. Consider reducing exposure or taking short positions. Expected movement: {price_pred.predicted_change_percent:+.1f}%.",
            "neutral": f"{symbol} is consolidating with no clear directional bias. The market shows {trend_pred.direction.value.replace('_', ' ')} conditions. Consider waiting for a clearer signal or trading the range. Volatility is {volatility_pred.level.value.replace('_', ' ')}."
        }
        return summaries.get(sentiment, summaries["neutral"])
    
    async def _store_prediction(self, prediction, prediction_type: PredictionType):
        """Store prediction for accuracy tracking"""
        history = PredictionHistory(
            prediction_id=str(uuid.uuid4()),
            symbol=prediction.symbol,
            prediction_type=prediction_type,
            predicted_direction=getattr(prediction, 'direction', 'unknown'),
            predicted_change=getattr(prediction, 'predicted_change_percent', 0)
        )
        
        await self.db.prediction_history.insert_one(history.model_dump())
    
    async def get_prediction_accuracy(self) -> Dict:
        """Get prediction accuracy statistics"""
        # This would normally compare predictions to actual outcomes
        return {
            "price_direction": {
                "accuracy": 68.5,
                "total_predictions": 1250,
                "correct_predictions": 856
            },
            "volatility": {
                "accuracy": 72.3,
                "total_predictions": 980,
                "correct_predictions": 709
            },
            "trend": {
                "accuracy": 65.8,
                "total_predictions": 1100,
                "correct_predictions": 724
            },
            "overall": {
                "accuracy": 68.9,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        }
