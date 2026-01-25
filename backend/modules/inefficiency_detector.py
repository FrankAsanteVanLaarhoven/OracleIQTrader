"""
Market Inefficiency Detector
Statistical arbitrage, mean reversion, momentum anomalies detection
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from scipy import stats

logger = logging.getLogger(__name__)


class SignalType(str, Enum):
    STATISTICAL_ARBITRAGE = "statistical_arbitrage"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    PAIRS_TRADE = "pairs_trade"
    CROSS_ASSET = "cross_asset"
    VOLATILITY = "volatility"


class SignalStrength(str, Enum):
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"


@dataclass
class InefficiencySignal:
    """Detected market inefficiency"""
    id: str
    signal_type: SignalType
    assets: List[str]
    direction: str  # long, short, long_short
    strength: SignalStrength
    confidence: float  # 0-1
    expected_return: float  # Expected return in %
    holding_period: str  # e.g., "3-5 days"
    entry_price: Optional[float]
    target_price: Optional[float]
    stop_loss: Optional[float]
    rationale: str
    risk_reward: float
    sharpe_estimate: float
    timestamp: str


@dataclass
class PairsTrade:
    """Pairs trading opportunity"""
    asset_long: str
    asset_short: str
    spread_zscore: float
    half_life: float  # Mean reversion half-life in days
    correlation: float
    cointegration_pvalue: float
    entry_spread: float
    target_spread: float
    confidence: float


@dataclass
class MomentumSignal:
    """Momentum anomaly signal"""
    asset: str
    momentum_score: float  # -1 to +1
    trend_strength: float
    breakout_level: Optional[float]
    volume_confirmation: bool
    relative_strength: float
    sector_momentum: float


class MarketInefficiencyDetector:
    """
    Detects market inefficiencies for systematic trading
    Implements quant strategies used by top hedge funds
    """
    
    def __init__(self):
        self.signals: List[InefficiencySignal] = []
        self.pairs_opportunities: List[PairsTrade] = []
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample market data for demo"""
        # Generate sample inefficiency signals
        self._generate_sample_signals()
    
    def _generate_sample_signals(self):
        """Generate realistic sample signals"""
        signals_data = [
            {
                "type": SignalType.STATISTICAL_ARBITRAGE,
                "assets": ["BTC", "ETH"],
                "direction": "long_short",
                "strength": SignalStrength.STRONG,
                "confidence": 0.82,
                "expected_return": 3.5,
                "holding": "3-5 days",
                "rationale": "BTC/ETH ratio 2.1σ below 30-day mean. Historical reversion within 5 days: 78%",
                "risk_reward": 2.8,
                "sharpe": 1.9
            },
            {
                "type": SignalType.MEAN_REVERSION,
                "assets": ["SOL"],
                "direction": "long",
                "strength": SignalStrength.MODERATE,
                "confidence": 0.71,
                "expected_return": 5.2,
                "holding": "5-10 days",
                "rationale": "RSI at 28 (oversold). Price 2.3σ below 20-day VWAP. Volume spike suggests capitulation.",
                "risk_reward": 2.1,
                "sharpe": 1.4
            },
            {
                "type": SignalType.MOMENTUM,
                "assets": ["ETH"],
                "direction": "long",
                "strength": SignalStrength.STRONG,
                "confidence": 0.78,
                "expected_return": 8.5,
                "holding": "2-4 weeks",
                "rationale": "Breaking out of 60-day consolidation. Volume 2.5x average. Strong relative strength vs BTC.",
                "risk_reward": 3.2,
                "sharpe": 2.1
            },
            {
                "type": SignalType.CROSS_ASSET,
                "assets": ["BTC", "GOLD", "SPY"],
                "direction": "long_short",
                "strength": SignalStrength.MODERATE,
                "confidence": 0.68,
                "expected_return": 2.8,
                "holding": "1-2 weeks",
                "rationale": "BTC/Gold correlation breakdown. Historical reversion expected. Short Gold, Long BTC.",
                "risk_reward": 1.9,
                "sharpe": 1.2
            },
            {
                "type": SignalType.VOLATILITY,
                "assets": ["BTC"],
                "direction": "long",
                "strength": SignalStrength.WEAK,
                "confidence": 0.58,
                "expected_return": 4.0,
                "holding": "1-3 days",
                "rationale": "Implied volatility at 6-month low. Historical vol expansion follows within 5 days: 65%",
                "risk_reward": 1.5,
                "sharpe": 0.9
            }
        ]
        
        for i, sig in enumerate(signals_data):
            self.signals.append(InefficiencySignal(
                id=f"SIG_{datetime.now().strftime('%Y%m%d')}_{i+1:03d}",
                signal_type=sig["type"],
                assets=sig["assets"],
                direction=sig["direction"],
                strength=sig["strength"],
                confidence=sig["confidence"],
                expected_return=sig["expected_return"],
                holding_period=sig["holding"],
                entry_price=None,
                target_price=None,
                stop_loss=None,
                rationale=sig["rationale"],
                risk_reward=sig["risk_reward"],
                sharpe_estimate=sig["sharpe"],
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        
        # Generate pairs trading opportunities
        self.pairs_opportunities = [
            PairsTrade(
                asset_long="ETH",
                asset_short="BTC",
                spread_zscore=-2.1,
                half_life=4.5,
                correlation=0.89,
                cointegration_pvalue=0.02,
                entry_spread=0.052,
                target_spread=0.058,
                confidence=0.78
            ),
            PairsTrade(
                asset_long="SOL",
                asset_short="ETH",
                spread_zscore=1.8,
                half_life=6.2,
                correlation=0.82,
                cointegration_pvalue=0.04,
                entry_spread=0.031,
                target_spread=0.028,
                confidence=0.65
            )
        ]
    
    def detect_mean_reversion(self, prices: pd.Series, window: int = 20) -> Dict:
        """Detect mean reversion opportunities"""
        if len(prices) < window + 5:
            return {"signal": None, "error": "Insufficient data"}
        
        # Calculate z-score
        rolling_mean = prices.rolling(window).mean()
        rolling_std = prices.rolling(window).std()
        z_score = (prices - rolling_mean) / rolling_std
        
        current_z = z_score.iloc[-1]
        
        # Detect signal
        if current_z < -2:
            signal = "strong_buy"
            confidence = min(0.95, 0.5 + abs(current_z) * 0.15)
        elif current_z < -1.5:
            signal = "buy"
            confidence = min(0.85, 0.4 + abs(current_z) * 0.15)
        elif current_z > 2:
            signal = "strong_sell"
            confidence = min(0.95, 0.5 + abs(current_z) * 0.15)
        elif current_z > 1.5:
            signal = "sell"
            confidence = min(0.85, 0.4 + abs(current_z) * 0.15)
        else:
            signal = "neutral"
            confidence = 0.5
        
        # Calculate half-life (mean reversion speed)
        try:
            lagged = z_score.shift(1).dropna()
            current = z_score.iloc[1:].values[:len(lagged)]
            if len(lagged) > 10:
                slope, _, _, _, _ = stats.linregress(lagged.values, current)
                half_life = -np.log(2) / np.log(abs(slope)) if slope != 0 and abs(slope) < 1 else 10
            else:
                half_life = 10
        except:
            half_life = 10
        
        return {
            "signal": signal,
            "z_score": round(float(current_z), 2),
            "confidence": round(confidence, 2),
            "half_life_days": round(half_life, 1),
            "mean": round(float(rolling_mean.iloc[-1]), 2),
            "std": round(float(rolling_std.iloc[-1]), 2),
            "current_price": round(float(prices.iloc[-1]), 2)
        }
    
    def detect_momentum(self, prices: pd.Series) -> Dict:
        """Detect momentum signals"""
        if len(prices) < 60:
            return {"signal": None, "error": "Insufficient data"}
        
        # Multiple timeframe momentum
        mom_5 = (prices.iloc[-1] / prices.iloc[-5] - 1) * 100
        mom_20 = (prices.iloc[-1] / prices.iloc[-20] - 1) * 100
        mom_60 = (prices.iloc[-1] / prices.iloc[-60] - 1) * 100
        
        # Composite momentum score (-1 to +1)
        momentum_score = (
            np.sign(mom_5) * min(abs(mom_5), 10) / 10 * 0.3 +
            np.sign(mom_20) * min(abs(mom_20), 20) / 20 * 0.4 +
            np.sign(mom_60) * min(abs(mom_60), 50) / 50 * 0.3
        )
        
        # Trend strength (ADX-like calculation)
        returns = prices.pct_change()
        trend_strength = abs(returns.rolling(14).mean() / returns.rolling(14).std()).iloc[-1]
        trend_strength = min(1.0, trend_strength * 2)
        
        # Signal generation
        if momentum_score > 0.5 and trend_strength > 0.6:
            signal = "strong_long"
            confidence = min(0.9, 0.5 + momentum_score * 0.3 + trend_strength * 0.2)
        elif momentum_score > 0.2:
            signal = "long"
            confidence = min(0.75, 0.4 + momentum_score * 0.3)
        elif momentum_score < -0.5 and trend_strength > 0.6:
            signal = "strong_short"
            confidence = min(0.9, 0.5 + abs(momentum_score) * 0.3 + trend_strength * 0.2)
        elif momentum_score < -0.2:
            signal = "short"
            confidence = min(0.75, 0.4 + abs(momentum_score) * 0.3)
        else:
            signal = "neutral"
            confidence = 0.5
        
        return {
            "signal": signal,
            "momentum_score": round(momentum_score, 2),
            "trend_strength": round(float(trend_strength), 2),
            "momentum_5d": round(mom_5, 2),
            "momentum_20d": round(mom_20, 2),
            "momentum_60d": round(mom_60, 2),
            "confidence": round(confidence, 2)
        }
    
    def detect_pairs_opportunity(self, prices_a: pd.Series, prices_b: pd.Series, 
                                  asset_a: str, asset_b: str) -> Optional[PairsTrade]:
        """Detect pairs trading opportunity between two assets"""
        if len(prices_a) < 60 or len(prices_b) < 60:
            return None
        
        # Calculate spread
        spread = np.log(prices_a) - np.log(prices_b)
        
        # Z-score of spread
        spread_mean = spread.rolling(30).mean()
        spread_std = spread.rolling(30).std()
        spread_z = (spread - spread_mean) / spread_std
        current_z = spread_z.iloc[-1]
        
        # Correlation
        correlation = prices_a.pct_change().corr(prices_b.pct_change())
        
        # Simple cointegration test (ADF-like)
        spread_returns = spread.diff().dropna()
        spread_lag = spread.shift(1).dropna()
        if len(spread_returns) > 20 and len(spread_lag) > 20:
            try:
                slope, _, _, p_value, _ = stats.linregress(
                    spread_lag.values[-len(spread_returns):], 
                    spread_returns.values
                )
                cointegration_pvalue = max(0.01, min(0.99, p_value))
            except:
                cointegration_pvalue = 0.5
        else:
            cointegration_pvalue = 0.5
        
        # Only generate signal if spread is extended
        if abs(current_z) > 1.5 and correlation > 0.7 and cointegration_pvalue < 0.1:
            return PairsTrade(
                asset_long=asset_a if current_z < 0 else asset_b,
                asset_short=asset_b if current_z < 0 else asset_a,
                spread_zscore=round(float(current_z), 2),
                half_life=5.0,  # Simplified
                correlation=round(float(correlation), 2),
                cointegration_pvalue=round(cointegration_pvalue, 3),
                entry_spread=round(float(spread.iloc[-1]), 4),
                target_spread=round(float(spread_mean.iloc[-1]), 4),
                confidence=round(0.5 + abs(current_z) * 0.1 + (1 - cointegration_pvalue) * 0.2, 2)
            )
        
        return None
    
    def get_all_signals(self) -> List[Dict]:
        """Get all current inefficiency signals"""
        return [asdict(sig) for sig in self.signals]
    
    def get_pairs_opportunities(self) -> List[Dict]:
        """Get all pairs trading opportunities"""
        return [asdict(pair) for pair in self.pairs_opportunities]
    
    def get_signal_summary(self) -> Dict:
        """Get summary of all signals"""
        strong_signals = [s for s in self.signals if s.strength == SignalStrength.STRONG]
        moderate_signals = [s for s in self.signals if s.strength == SignalStrength.MODERATE]
        
        return {
            "total_signals": len(self.signals),
            "strong_signals": len(strong_signals),
            "moderate_signals": len(moderate_signals),
            "average_confidence": round(
                sum(s.confidence for s in self.signals) / len(self.signals) if self.signals else 0, 2
            ),
            "average_expected_return": round(
                sum(s.expected_return for s in self.signals) / len(self.signals) if self.signals else 0, 2
            ),
            "best_opportunity": asdict(max(self.signals, key=lambda s: s.confidence * s.expected_return)) if self.signals else None,
            "pairs_opportunities": len(self.pairs_opportunities),
            "signal_types": {
                st.value: len([s for s in self.signals if s.signal_type == st])
                for st in SignalType
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global detector instance
inefficiency_detector = MarketInefficiencyDetector()


# API Functions
def get_inefficiency_signals() -> List[Dict]:
    return inefficiency_detector.get_all_signals()

def get_pairs_trades() -> List[Dict]:
    return inefficiency_detector.get_pairs_opportunities()

def get_signal_summary() -> Dict:
    return inefficiency_detector.get_signal_summary()

def analyze_mean_reversion(prices: List[float]) -> Dict:
    return inefficiency_detector.detect_mean_reversion(pd.Series(prices))

def analyze_momentum(prices: List[float]) -> Dict:
    return inefficiency_detector.detect_momentum(pd.Series(prices))
