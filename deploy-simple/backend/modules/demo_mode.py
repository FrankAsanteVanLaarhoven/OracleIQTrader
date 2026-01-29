"""
Demo Mode Module for Cognitive Oracle Trading Platform
Provides simulated data for demo/investor presentations without requiring login
"""

import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import math

# Demo user profile
DEMO_USER = {
    "user_id": "demo_user_001",
    "email": "demo@oracle-trading.com",
    "name": "Demo Trader",
    "picture": None,
    "is_demo": True,
    "demo_balance": 100000.00,
    "demo_pnl": 12543.50,
    "demo_pnl_percent": 12.54,
}

# Simulated portfolio for demo
DEMO_PORTFOLIO = {
    "total_value": 112543.50,
    "cash_balance": 25000.00,
    "positions": [
        {
            "symbol": "BTC",
            "quantity": 1.25,
            "avg_price": 42500.00,
            "current_price": 45200.00,
            "value": 56500.00,
            "pnl": 3375.00,
            "pnl_percent": 6.35,
        },
        {
            "symbol": "ETH",
            "quantity": 8.5,
            "avg_price": 2800.00,
            "current_price": 3150.00,
            "value": 26775.00,
            "pnl": 2975.00,
            "pnl_percent": 12.50,
        },
        {
            "symbol": "SOL",
            "quantity": 50,
            "avg_price": 85.00,
            "current_price": 98.50,
            "value": 4925.00,
            "pnl": 675.00,
            "pnl_percent": 15.88,
        },
    ],
    "allocation": {
        "BTC": 50.2,
        "ETH": 23.8,
        "SOL": 4.4,
        "CASH": 22.2,
    }
}

# Demo trade history
DEMO_TRADES = [
    {"id": "demo_1", "action": "BUY", "symbol": "BTC", "quantity": 0.5, "price": 41500.00, "timestamp": "2026-01-20T10:30:00Z", "pnl": 1850.00},
    {"id": "demo_2", "action": "BUY", "symbol": "ETH", "quantity": 5.0, "price": 2750.00, "timestamp": "2026-01-19T14:15:00Z", "pnl": 2000.00},
    {"id": "demo_3", "action": "SELL", "symbol": "DOGE", "quantity": 5000, "price": 0.12, "timestamp": "2026-01-18T09:45:00Z", "pnl": 150.00},
    {"id": "demo_4", "action": "BUY", "symbol": "SOL", "quantity": 25, "price": 82.00, "timestamp": "2026-01-17T16:00:00Z", "pnl": 412.50},
    {"id": "demo_5", "action": "BUY", "symbol": "BTC", "quantity": 0.75, "price": 43000.00, "timestamp": "2026-01-16T11:20:00Z", "pnl": 1650.00},
]

# Demo alerts
DEMO_ALERTS = [
    {"id": "alert_1", "symbol": "BTC", "target_price": 50000.00, "direction": "above", "status": "active", "created_at": "2026-01-20T08:00:00Z"},
    {"id": "alert_2", "symbol": "ETH", "target_price": 2500.00, "direction": "below", "status": "active", "created_at": "2026-01-19T12:00:00Z"},
    {"id": "alert_3", "symbol": "SOL", "target_price": 120.00, "direction": "above", "status": "active", "created_at": "2026-01-18T15:30:00Z"},
]

# Demo bot configuration
DEMO_BOT = {
    "id": "bot_demo_001",
    "name": "Demo AI Trader",
    "strategy": "momentum",
    "status": "running",
    "capital_allocated": 25000.00,
    "trades_today": 12,
    "pnl_today": 342.50,
    "pnl_total": 5420.00,
    "win_rate": 68.5,
    "last_trade": {
        "action": "BUY",
        "symbol": "ETH",
        "quantity": 0.5,
        "price": 3145.00,
        "timestamp": "2026-01-22T05:30:00Z",
    },
    "active_positions": [
        {"symbol": "BTC", "side": "LONG", "size": 0.25, "entry": 44800.00, "current_pnl": 100.00},
        {"symbol": "ETH", "side": "LONG", "size": 0.5, "entry": 3145.00, "current_pnl": 2.50},
    ]
}

# Demo ML predictions
DEMO_ML_PREDICTIONS = {
    "BTC": {
        "direction": "bullish",
        "confidence": 0.78,
        "target_24h": 46500.00,
        "volatility": "medium",
        "trend_strength": 0.72,
        "support": 43500.00,
        "resistance": 47000.00,
    },
    "ETH": {
        "direction": "bullish", 
        "confidence": 0.82,
        "target_24h": 3300.00,
        "volatility": "medium",
        "trend_strength": 0.68,
        "support": 3000.00,
        "resistance": 3400.00,
    },
    "SOL": {
        "direction": "very_bullish",
        "confidence": 0.85,
        "target_24h": 105.00,
        "volatility": "high",
        "trend_strength": 0.81,
        "support": 92.00,
        "resistance": 110.00,
    },
}

# Demo competition
DEMO_COMPETITION = {
    "id": "comp_daily_001",
    "name": "Daily Trading Challenge",
    "type": "daily",
    "status": "active",
    "prize_pool": 5000.00,
    "participants": 1247,
    "time_remaining": "4h 32m",
    "user_rank": 23,
    "user_pnl": 8.45,
    "leaderboard": [
        {"rank": 1, "name": "CryptoKing", "pnl_percent": 24.5, "trades": 45},
        {"rank": 2, "name": "TradeMaster", "pnl_percent": 21.2, "trades": 38},
        {"rank": 3, "name": "BullRunner", "pnl_percent": 18.8, "trades": 52},
        {"rank": 4, "name": "DiamondHands", "pnl_percent": 16.3, "trades": 29},
        {"rank": 5, "name": "MoonShot", "pnl_percent": 14.1, "trades": 61},
    ]
}

# Demo social sentiment
DEMO_SENTIMENT = {
    "BTC": {
        "overall": "bullish",
        "score": 0.72,
        "twitter_sentiment": 0.68,
        "reddit_sentiment": 0.75,
        "total_mentions": 45230,
        "trending_hashtags": ["#Bitcoin", "#BTC", "#Crypto", "#ToTheMoon"],
        "whale_activity": "accumulating",
        "fear_greed_index": 72,
    },
    "ETH": {
        "overall": "bullish",
        "score": 0.65,
        "twitter_sentiment": 0.62,
        "reddit_sentiment": 0.68,
        "total_mentions": 28450,
        "trending_hashtags": ["#Ethereum", "#ETH", "#DeFi"],
        "whale_activity": "holding",
        "fear_greed_index": 68,
    }
}


class DemoModeProvider:
    """Provides demo data for unauthenticated users"""
    
    def __init__(self):
        self.demo_enabled = True
        self.session_start = datetime.now(timezone.utc)
    
    def get_user(self) -> Dict:
        """Get demo user profile"""
        return {**DEMO_USER, "session_start": self.session_start.isoformat()}
    
    def get_portfolio(self) -> Dict:
        """Get demo portfolio with realistic fluctuations"""
        portfolio = DEMO_PORTFOLIO.copy()
        
        # Add small random fluctuations to make it feel live
        for pos in portfolio["positions"]:
            fluctuation = random.uniform(-0.5, 0.5)
            pos["current_price"] *= (1 + fluctuation / 100)
            pos["value"] = pos["quantity"] * pos["current_price"]
            pos["pnl"] = pos["value"] - (pos["quantity"] * pos["avg_price"])
            pos["pnl_percent"] = (pos["pnl"] / (pos["quantity"] * pos["avg_price"])) * 100
        
        # Recalculate total
        total_positions = sum(p["value"] for p in portfolio["positions"])
        portfolio["total_value"] = total_positions + portfolio["cash_balance"]
        
        return portfolio
    
    def get_trades(self, limit: int = 10) -> List[Dict]:
        """Get demo trade history"""
        return DEMO_TRADES[:limit]
    
    def get_alerts(self) -> List[Dict]:
        """Get demo alerts"""
        return DEMO_ALERTS
    
    def get_bot_status(self) -> Dict:
        """Get demo bot status with live updates"""
        bot = DEMO_BOT.copy()
        
        # Simulate live P&L changes
        bot["pnl_today"] += random.uniform(-10, 20)
        bot["trades_today"] += random.randint(0, 1)
        
        return bot
    
    def get_ml_prediction(self, symbol: str) -> Dict:
        """Get demo ML prediction"""
        if symbol in DEMO_ML_PREDICTIONS:
            pred = DEMO_ML_PREDICTIONS[symbol].copy()
            # Add slight confidence variation
            pred["confidence"] = min(0.95, max(0.6, pred["confidence"] + random.uniform(-0.05, 0.05)))
            pred["timestamp"] = datetime.now(timezone.utc).isoformat()
            return pred
        return {
            "symbol": symbol,
            "direction": "neutral",
            "confidence": 0.5,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_competition(self) -> Dict:
        """Get demo competition status"""
        comp = DEMO_COMPETITION.copy()
        # Update user rank slightly
        comp["user_rank"] = max(1, comp["user_rank"] + random.randint(-2, 2))
        comp["user_pnl"] += random.uniform(-0.5, 1.0)
        return comp
    
    def get_sentiment(self, symbol: str) -> Dict:
        """Get demo social sentiment"""
        if symbol in DEMO_SENTIMENT:
            sent = DEMO_SENTIMENT[symbol].copy()
            # Add slight variations
            sent["score"] = min(1.0, max(-1.0, sent["score"] + random.uniform(-0.05, 0.05)))
            sent["total_mentions"] += random.randint(-100, 500)
            sent["timestamp"] = datetime.now(timezone.utc).isoformat()
            return sent
        return {
            "symbol": symbol,
            "overall": "neutral",
            "score": 0.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def simulate_trade(self, action: str, symbol: str, quantity: float, price: float) -> Dict:
        """Simulate a demo trade"""
        trade_id = f"demo_{datetime.now().timestamp()}"
        
        # Simulate execution with small slippage
        slippage = random.uniform(-0.1, 0.1)
        executed_price = price * (1 + slippage / 100)
        
        return {
            "id": trade_id,
            "action": action,
            "symbol": symbol,
            "quantity": quantity,
            "requested_price": price,
            "executed_price": round(executed_price, 2),
            "slippage_percent": round(slippage, 3),
            "status": "EXECUTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
            "message": f"Demo trade executed: {action} {quantity} {symbol} @ ${executed_price:,.2f}"
        }
    
    def get_demo_stats(self) -> Dict:
        """Get overall demo session stats"""
        session_duration = (datetime.now(timezone.utc) - self.session_start).total_seconds()
        
        return {
            "is_demo_mode": True,
            "session_duration_seconds": int(session_duration),
            "features_available": [
                "Portfolio Tracking",
                "AI Predictions (ML)",
                "Price Alerts",
                "Trading Bot Simulation",
                "Social Sentiment",
                "Trading Competitions",
                "Paper Trading",
                "Candlestick Charts",
                "Voice Commands (demo)",
            ],
            "limitations": [
                "Trades are simulated, not real",
                "Data resets on refresh",
                "No persistent storage",
            ],
            "cta": "Sign up to save your progress and trade with real money!",
            "sign_up_bonus": "$100 bonus when you deposit $500+"
        }


# Global demo provider instance
demo_provider = DemoModeProvider()


# FastAPI integration functions
def get_demo_user() -> Dict:
    return demo_provider.get_user()

def get_demo_portfolio() -> Dict:
    return demo_provider.get_portfolio()

def get_demo_trades(limit: int = 10) -> List[Dict]:
    return demo_provider.get_trades(limit)

def get_demo_alerts() -> List[Dict]:
    return demo_provider.get_alerts()

def get_demo_bot() -> Dict:
    return demo_provider.get_bot_status()

def get_demo_prediction(symbol: str) -> Dict:
    return demo_provider.get_ml_prediction(symbol)

def get_demo_competition() -> Dict:
    return demo_provider.get_competition()

def get_demo_sentiment(symbol: str) -> Dict:
    return demo_provider.get_sentiment(symbol)

def execute_demo_trade(action: str, symbol: str, quantity: float, price: float) -> Dict:
    return demo_provider.simulate_trade(action, symbol, quantity, price)

def get_demo_stats() -> Dict:
    return demo_provider.get_demo_stats()
