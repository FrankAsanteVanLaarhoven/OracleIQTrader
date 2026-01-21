"""
Oracle Trading Platform Modules
"""

from .trading_playground import TradingPlaygroundEngine, PlaygroundAccount, PlaygroundOrder, PlaygroundPosition
from .autonomous_bot import AutonomousBotEngine, TradingBot, TradeSignal, TradingStrategy, BotMode
from .training_system import TrainingEngine, UserProgress, Tutorial, Lesson, TradingScenario, BacktestConfig
from .exchange_integration import ExchangeManager, ExchangeType, OrderSide, OrderType
from .social_integration import SocialManager, SocialPlatform
from .additional_exchanges import CoinbaseProAdapter, KrakenAdapter
from .ml_prediction import MLPredictionEngine, PredictionType, TimeHorizon
from .trading_competition import CompetitionEngine, CompetitionType, Competition

__all__ = [
    # Trading Playground
    "TradingPlaygroundEngine",
    "PlaygroundAccount", 
    "PlaygroundOrder",
    "PlaygroundPosition",
    
    # Autonomous Bot
    "AutonomousBotEngine",
    "TradingBot",
    "TradeSignal",
    "TradingStrategy",
    "BotMode",
    
    # Training System
    "TrainingEngine",
    "UserProgress",
    "Tutorial",
    "Lesson",
    "TradingScenario",
    "BacktestConfig",
    
    # Exchange Integration
    "ExchangeManager",
    "ExchangeType",
    "OrderSide",
    "OrderType",
    "CoinbaseProAdapter",
    "KrakenAdapter",
    
    # Social Integration
    "SocialManager",
    "SocialPlatform",
    
    # ML Prediction
    "MLPredictionEngine",
    "PredictionType",
    "TimeHorizon",
    
    # Trading Competition
    "CompetitionEngine",
    "CompetitionType",
    "Competition"
]
