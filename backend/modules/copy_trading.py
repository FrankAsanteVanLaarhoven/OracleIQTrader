# OracleIQTrader - Copy Trading Infrastructure
# Retail→Institutional strategy mirroring system with fee-sharing

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import uuid
import random

class StrategyType(str, Enum):
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    ARBITRAGE = "arbitrage"
    TREND_FOLLOWING = "trend_following"
    MARKET_NEUTRAL = "market_neutral"
    QUANTITATIVE = "quantitative"
    AI_DRIVEN = "ai_driven"

class RiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    ULTRA_AGGRESSIVE = "ultra_aggressive"

class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    INSTITUTIONAL = "institutional"

class TraderVerification(str, Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    PROFESSIONAL = "professional"
    INSTITUTIONAL = "institutional"


class MasterTrader:
    """Represents a master trader whose strategies can be copied"""
    
    def __init__(self, trader_id: str, name: str, verification: TraderVerification):
        self.trader_id = trader_id
        self.name = name
        self.verification = verification
        self.created_at = datetime.utcnow()
        
        # Performance metrics
        self.total_return = 0.0
        self.monthly_return = 0.0
        self.win_rate = 0.0
        self.sharpe_ratio = 0.0
        self.max_drawdown = 0.0
        self.total_trades = 0
        self.profitable_trades = 0
        
        # Strategy info
        self.strategy_type = StrategyType.QUANTITATIVE
        self.risk_level = RiskLevel.MODERATE
        self.description = ""
        self.min_investment = 100
        self.performance_fee = 20  # % of profits
        self.management_fee = 2    # % annual
        
        # Followers
        self.followers_count = 0
        self.total_aum = 0  # Assets Under Management by copiers
        
        # Trading history
        self.recent_trades: List[Dict] = []
        self.portfolio: Dict[str, float] = {}
        
    def to_dict(self) -> Dict:
        return {
            "trader_id": self.trader_id,
            "name": self.name,
            "verification": self.verification.value,
            "created_at": self.created_at.isoformat(),
            "performance": {
                "total_return": round(self.total_return, 2),
                "monthly_return": round(self.monthly_return, 2),
                "win_rate": round(self.win_rate * 100, 1),
                "sharpe_ratio": round(self.sharpe_ratio, 2),
                "max_drawdown": round(self.max_drawdown, 2),
                "total_trades": self.total_trades,
                "profitable_trades": self.profitable_trades
            },
            "strategy": {
                "type": self.strategy_type.value,
                "risk_level": self.risk_level.value,
                "description": self.description
            },
            "fees": {
                "performance_fee": self.performance_fee,
                "management_fee": self.management_fee,
                "min_investment": self.min_investment
            },
            "social": {
                "followers_count": self.followers_count,
                "total_aum": round(self.total_aum, 2)
            },
            "portfolio": self.portfolio,
            "recent_trades": self.recent_trades[-10:]
        }


class CopyRelationship:
    """Represents a follower copying a master trader"""
    
    def __init__(self, relationship_id: str, follower_id: str, 
                 master_trader_id: str, allocated_amount: float):
        self.relationship_id = relationship_id
        self.follower_id = follower_id
        self.master_trader_id = master_trader_id
        self.allocated_amount = allocated_amount
        self.created_at = datetime.utcnow()
        
        # Status
        self.is_active = True
        self.paused = False
        
        # Copy settings
        self.copy_ratio = 1.0  # 1.0 = exact copy, 0.5 = half size
        self.max_trade_size = None  # Optional limit
        self.stop_loss_pct = None   # Optional auto-stop
        self.take_profit_pct = None # Optional auto-take
        
        # Performance tracking
        self.total_pnl = 0.0
        self.fees_paid = 0.0
        self.trades_copied = 0
        self.current_value = allocated_amount
        
    def to_dict(self) -> Dict:
        return {
            "relationship_id": self.relationship_id,
            "follower_id": self.follower_id,
            "master_trader_id": self.master_trader_id,
            "allocated_amount": self.allocated_amount,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "paused": self.paused,
            "settings": {
                "copy_ratio": self.copy_ratio,
                "max_trade_size": self.max_trade_size,
                "stop_loss_pct": self.stop_loss_pct,
                "take_profit_pct": self.take_profit_pct
            },
            "performance": {
                "total_pnl": round(self.total_pnl, 2),
                "pnl_pct": round((self.total_pnl / self.allocated_amount) * 100, 2) if self.allocated_amount > 0 else 0,
                "fees_paid": round(self.fees_paid, 2),
                "trades_copied": self.trades_copied,
                "current_value": round(self.current_value, 2)
            }
        }


class CopyTradingEngine:
    """
    Copy Trading Engine - Enables retail traders to mirror institutional strategies.
    
    Features:
    - One-click follow/copy master traders
    - Proportional trade mirroring
    - Performance fee sharing (20% profit share to master)
    - Risk controls (stop-loss, position limits)
    - Real-time position synchronization
    """
    
    def __init__(self):
        self.master_traders: Dict[str, MasterTrader] = {}
        self.copy_relationships: Dict[str, CopyRelationship] = {}
        self.user_relationships: Dict[str, List[str]] = {}  # follower_id -> [relationship_ids]
        
        # Initialize sample master traders
        self._create_sample_traders()
        
    def _generate_id(self, prefix: str) -> str:
        return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
    
    def _create_sample_traders(self):
        """Create sample institutional/verified traders"""
        
        traders_data = [
            {
                "name": "Bridgewater Alpha Fund",
                "verification": TraderVerification.INSTITUTIONAL,
                "strategy_type": StrategyType.QUANTITATIVE,
                "risk_level": RiskLevel.MODERATE,
                "description": "Ray Dalio-inspired All Weather strategy. Diversified across asset classes with risk parity allocation.",
                "total_return": 156.8,
                "monthly_return": 3.2,
                "win_rate": 0.68,
                "sharpe_ratio": 1.85,
                "max_drawdown": -12.5,
                "performance_fee": 20,
                "management_fee": 2,
                "min_investment": 1000,
                "followers_count": 12450,
                "total_aum": 45000000,
                "portfolio": {"BTC": 0.30, "ETH": 0.20, "GOLD": 0.25, "BONDS": 0.15, "CASH": 0.10}
            },
            {
                "name": "Citadel Momentum",
                "verification": TraderVerification.INSTITUTIONAL,
                "strategy_type": StrategyType.MOMENTUM,
                "risk_level": RiskLevel.AGGRESSIVE,
                "description": "High-frequency momentum strategy capturing short-term price movements in crypto markets.",
                "total_return": 312.4,
                "monthly_return": 8.5,
                "win_rate": 0.58,
                "sharpe_ratio": 2.12,
                "max_drawdown": -28.3,
                "performance_fee": 25,
                "management_fee": 2.5,
                "min_investment": 5000,
                "followers_count": 5680,
                "total_aum": 28000000,
                "portfolio": {"BTC": 0.45, "ETH": 0.30, "SOL": 0.15, "AVAX": 0.10}
            },
            {
                "name": "Renaissance Quant",
                "verification": TraderVerification.INSTITUTIONAL,
                "strategy_type": StrategyType.AI_DRIVEN,
                "risk_level": RiskLevel.MODERATE,
                "description": "Machine learning-driven strategy using transformer models for market prediction.",
                "total_return": 198.6,
                "monthly_return": 4.8,
                "win_rate": 0.72,
                "sharpe_ratio": 2.45,
                "max_drawdown": -15.2,
                "performance_fee": 30,
                "management_fee": 3,
                "min_investment": 10000,
                "followers_count": 3240,
                "total_aum": 85000000,
                "portfolio": {"BTC": 0.35, "ETH": 0.25, "SOL": 0.15, "LINK": 0.10, "MATIC": 0.15}
            },
            {
                "name": "DeFi Alpha Hunter",
                "verification": TraderVerification.PROFESSIONAL,
                "strategy_type": StrategyType.ARBITRAGE,
                "risk_level": RiskLevel.AGGRESSIVE,
                "description": "Cross-exchange arbitrage and DeFi yield optimization across multiple chains.",
                "total_return": 425.2,
                "monthly_return": 12.3,
                "win_rate": 0.82,
                "sharpe_ratio": 1.65,
                "max_drawdown": -35.8,
                "performance_fee": 20,
                "management_fee": 1.5,
                "min_investment": 500,
                "followers_count": 8920,
                "total_aum": 12000000,
                "portfolio": {"ETH": 0.40, "USDC": 0.30, "ARB": 0.15, "OP": 0.15}
            },
            {
                "name": "Steady Eddie Conservative",
                "verification": TraderVerification.VERIFIED,
                "strategy_type": StrategyType.MEAN_REVERSION,
                "risk_level": RiskLevel.CONSERVATIVE,
                "description": "Low-risk mean reversion strategy focused on stable returns with minimal drawdowns.",
                "total_return": 45.6,
                "monthly_return": 1.2,
                "win_rate": 0.75,
                "sharpe_ratio": 1.95,
                "max_drawdown": -5.2,
                "performance_fee": 15,
                "management_fee": 1,
                "min_investment": 100,
                "followers_count": 15680,
                "total_aum": 8500000,
                "portfolio": {"BTC": 0.20, "USDC": 0.50, "ETH": 0.15, "GOLD": 0.15}
            },
            {
                "name": "Trend Surfer Pro",
                "verification": TraderVerification.PROFESSIONAL,
                "strategy_type": StrategyType.TREND_FOLLOWING,
                "risk_level": RiskLevel.MODERATE,
                "description": "Multi-timeframe trend following with dynamic position sizing based on volatility.",
                "total_return": 178.9,
                "monthly_return": 5.4,
                "win_rate": 0.52,
                "sharpe_ratio": 1.72,
                "max_drawdown": -22.4,
                "performance_fee": 18,
                "management_fee": 1.5,
                "min_investment": 250,
                "followers_count": 9450,
                "total_aum": 15600000,
                "portfolio": {"BTC": 0.50, "ETH": 0.30, "SOL": 0.20}
            }
        ]
        
        for data in traders_data:
            trader_id = self._generate_id("MTR")
            trader = MasterTrader(trader_id, data["name"], data["verification"])
            
            trader.strategy_type = data["strategy_type"]
            trader.risk_level = data["risk_level"]
            trader.description = data["description"]
            trader.total_return = data["total_return"]
            trader.monthly_return = data["monthly_return"]
            trader.win_rate = data["win_rate"]
            trader.sharpe_ratio = data["sharpe_ratio"]
            trader.max_drawdown = data["max_drawdown"]
            trader.performance_fee = data["performance_fee"]
            trader.management_fee = data["management_fee"]
            trader.min_investment = data["min_investment"]
            trader.followers_count = data["followers_count"]
            trader.total_aum = data["total_aum"]
            trader.portfolio = data["portfolio"]
            trader.total_trades = random.randint(500, 5000)
            trader.profitable_trades = int(trader.total_trades * trader.win_rate)
            
            # Generate sample recent trades
            trader.recent_trades = self._generate_sample_trades(trader_id, 10)
            
            self.master_traders[trader_id] = trader
    
    def _generate_sample_trades(self, trader_id: str, count: int) -> List[Dict]:
        """Generate sample trade history"""
        symbols = ["BTC", "ETH", "SOL", "AVAX", "LINK", "MATIC"]
        trades = []
        
        for i in range(count):
            symbol = random.choice(symbols)
            side = random.choice(["BUY", "SELL"])
            entry_price = random.uniform(1000, 50000) if symbol == "BTC" else random.uniform(10, 3000)
            pnl_pct = random.uniform(-5, 15)
            
            trades.append({
                "trade_id": f"TRD-{uuid.uuid4().hex[:6]}",
                "symbol": symbol,
                "side": side,
                "entry_price": round(entry_price, 2),
                "exit_price": round(entry_price * (1 + pnl_pct/100), 2),
                "pnl_pct": round(pnl_pct, 2),
                "timestamp": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                "status": "closed"
            })
        
        return trades
    
    def get_all_traders(self, sort_by: str = "total_return", 
                        risk_level: str = None,
                        verification: str = None) -> List[Dict]:
        """Get all master traders with optional filtering"""
        traders = list(self.master_traders.values())
        
        if risk_level:
            traders = [t for t in traders if t.risk_level.value == risk_level]
        if verification:
            traders = [t for t in traders if t.verification.value == verification]
        
        # Sort
        sort_keys = {
            "total_return": lambda x: x.total_return,
            "monthly_return": lambda x: x.monthly_return,
            "followers": lambda x: x.followers_count,
            "sharpe": lambda x: x.sharpe_ratio,
            "win_rate": lambda x: x.win_rate,
            "aum": lambda x: x.total_aum
        }
        
        if sort_by in sort_keys:
            traders.sort(key=sort_keys[sort_by], reverse=True)
        
        return [t.to_dict() for t in traders]
    
    def get_trader(self, trader_id: str) -> Optional[Dict]:
        """Get single trader details"""
        trader = self.master_traders.get(trader_id)
        return trader.to_dict() if trader else None
    
    def get_top_performers(self, period: str = "monthly", limit: int = 10) -> List[Dict]:
        """Get top performing traders"""
        traders = list(self.master_traders.values())
        
        if period == "monthly":
            traders.sort(key=lambda x: x.monthly_return, reverse=True)
        else:
            traders.sort(key=lambda x: x.total_return, reverse=True)
        
        return [t.to_dict() for t in traders[:limit]]
    
    def get_trending_traders(self, limit: int = 10) -> List[Dict]:
        """Get traders with most new followers (simulated)"""
        traders = list(self.master_traders.values())
        traders.sort(key=lambda x: x.followers_count, reverse=True)
        return [t.to_dict() for t in traders[:limit]]
    
    def start_copying(self, follower_id: str, master_trader_id: str,
                      amount: float, settings: Dict = None) -> Dict:
        """Start copying a master trader"""
        trader = self.master_traders.get(master_trader_id)
        if not trader:
            return {"error": "Master trader not found"}
        
        if amount < trader.min_investment:
            return {"error": f"Minimum investment is ${trader.min_investment}"}
        
        # Check if already copying
        if follower_id in self.user_relationships:
            for rel_id in self.user_relationships[follower_id]:
                rel = self.copy_relationships.get(rel_id)
                if rel and rel.master_trader_id == master_trader_id and rel.is_active:
                    return {"error": "Already copying this trader"}
        
        # Create relationship
        relationship_id = self._generate_id("CPY")
        relationship = CopyRelationship(
            relationship_id, follower_id, master_trader_id, amount
        )
        
        # Apply settings
        if settings:
            relationship.copy_ratio = settings.get("copy_ratio", 1.0)
            relationship.max_trade_size = settings.get("max_trade_size")
            relationship.stop_loss_pct = settings.get("stop_loss_pct")
            relationship.take_profit_pct = settings.get("take_profit_pct")
        
        self.copy_relationships[relationship_id] = relationship
        
        if follower_id not in self.user_relationships:
            self.user_relationships[follower_id] = []
        self.user_relationships[follower_id].append(relationship_id)
        
        # Update trader stats
        trader.followers_count += 1
        trader.total_aum += amount
        
        return {
            "success": True,
            "relationship": relationship.to_dict(),
            "message": f"Now copying {trader.name}",
            "fees_info": {
                "performance_fee": f"{trader.performance_fee}% of profits",
                "management_fee": f"{trader.management_fee}% annual"
            }
        }
    
    def stop_copying(self, follower_id: str, relationship_id: str) -> Dict:
        """Stop copying a master trader"""
        relationship = self.copy_relationships.get(relationship_id)
        if not relationship:
            return {"error": "Relationship not found"}
        
        if relationship.follower_id != follower_id:
            return {"error": "Unauthorized"}
        
        relationship.is_active = False
        
        # Update trader stats
        trader = self.master_traders.get(relationship.master_trader_id)
        if trader:
            trader.followers_count = max(0, trader.followers_count - 1)
            trader.total_aum = max(0, trader.total_aum - relationship.current_value)
        
        # Calculate final settlement
        final_pnl = relationship.total_pnl
        final_fees = relationship.fees_paid
        
        return {
            "success": True,
            "final_settlement": {
                "initial_amount": relationship.allocated_amount,
                "final_value": round(relationship.current_value, 2),
                "total_pnl": round(final_pnl, 2),
                "total_fees_paid": round(final_fees, 2),
                "net_return": round(final_pnl - final_fees, 2)
            }
        }
    
    def pause_copying(self, follower_id: str, relationship_id: str) -> Dict:
        """Pause copying (stop new trades but keep positions)"""
        relationship = self.copy_relationships.get(relationship_id)
        if not relationship or relationship.follower_id != follower_id:
            return {"error": "Relationship not found or unauthorized"}
        
        relationship.paused = True
        return {"success": True, "status": "paused"}
    
    def resume_copying(self, follower_id: str, relationship_id: str) -> Dict:
        """Resume copying"""
        relationship = self.copy_relationships.get(relationship_id)
        if not relationship or relationship.follower_id != follower_id:
            return {"error": "Relationship not found or unauthorized"}
        
        relationship.paused = False
        return {"success": True, "status": "active"}
    
    def update_copy_settings(self, follower_id: str, relationship_id: str,
                             settings: Dict) -> Dict:
        """Update copy settings"""
        relationship = self.copy_relationships.get(relationship_id)
        if not relationship or relationship.follower_id != follower_id:
            return {"error": "Relationship not found or unauthorized"}
        
        if "copy_ratio" in settings:
            relationship.copy_ratio = max(0.1, min(2.0, settings["copy_ratio"]))
        if "max_trade_size" in settings:
            relationship.max_trade_size = settings["max_trade_size"]
        if "stop_loss_pct" in settings:
            relationship.stop_loss_pct = settings["stop_loss_pct"]
        if "take_profit_pct" in settings:
            relationship.take_profit_pct = settings["take_profit_pct"]
        
        return {
            "success": True,
            "settings": relationship.to_dict()["settings"]
        }
    
    def add_funds(self, follower_id: str, relationship_id: str, amount: float) -> Dict:
        """Add more funds to a copy relationship"""
        relationship = self.copy_relationships.get(relationship_id)
        if not relationship or relationship.follower_id != follower_id:
            return {"error": "Relationship not found or unauthorized"}
        
        relationship.allocated_amount += amount
        relationship.current_value += amount
        
        # Update trader AUM
        trader = self.master_traders.get(relationship.master_trader_id)
        if trader:
            trader.total_aum += amount
        
        return {
            "success": True,
            "new_allocated": relationship.allocated_amount,
            "new_value": relationship.current_value
        }
    
    def get_user_copy_relationships(self, follower_id: str) -> List[Dict]:
        """Get all copy relationships for a user"""
        if follower_id not in self.user_relationships:
            return []
        
        relationships = []
        for rel_id in self.user_relationships[follower_id]:
            rel = self.copy_relationships.get(rel_id)
            if rel:
                rel_data = rel.to_dict()
                # Add trader info
                trader = self.master_traders.get(rel.master_trader_id)
                if trader:
                    rel_data["trader_name"] = trader.name
                    rel_data["trader_performance"] = {
                        "total_return": trader.total_return,
                        "monthly_return": trader.monthly_return
                    }
                relationships.append(rel_data)
        
        return relationships
    
    def get_copy_portfolio_summary(self, follower_id: str) -> Dict:
        """Get summary of all copy trading activity"""
        relationships = self.get_user_copy_relationships(follower_id)
        
        if not relationships:
            return {
                "total_invested": 0,
                "current_value": 0,
                "total_pnl": 0,
                "active_copies": 0
            }
        
        total_invested = sum(r["allocated_amount"] for r in relationships)
        current_value = sum(r["performance"]["current_value"] for r in relationships)
        total_pnl = sum(r["performance"]["total_pnl"] for r in relationships)
        total_fees = sum(r["performance"]["fees_paid"] for r in relationships)
        active = len([r for r in relationships if r["is_active"]])
        
        return {
            "total_invested": round(total_invested, 2),
            "current_value": round(current_value, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round((total_pnl / total_invested) * 100, 2) if total_invested > 0 else 0,
            "total_fees_paid": round(total_fees, 2),
            "net_return": round(total_pnl - total_fees, 2),
            "active_copies": active,
            "total_copies": len(relationships)
        }
    
    def simulate_trade_propagation(self, master_trader_id: str, 
                                   trade: Dict) -> List[Dict]:
        """Simulate propagating a trade to all copiers"""
        results = []
        
        for rel_id, rel in self.copy_relationships.items():
            if rel.master_trader_id == master_trader_id and rel.is_active and not rel.paused:
                # Calculate copy size
                copy_size = trade.get("size", 0) * rel.copy_ratio
                if rel.max_trade_size:
                    copy_size = min(copy_size, rel.max_trade_size)
                
                # Simulate execution
                results.append({
                    "relationship_id": rel_id,
                    "follower_id": rel.follower_id,
                    "original_size": trade.get("size"),
                    "copied_size": copy_size,
                    "status": "executed"
                })
                
                rel.trades_copied += 1
        
        return results


# Singleton instance
copy_trading_engine = CopyTradingEngine()


# API Functions
def get_master_traders(sort_by: str = "total_return", risk_level: str = None) -> List[Dict]:
    """Get all master traders"""
    return copy_trading_engine.get_all_traders(sort_by, risk_level)

def get_master_trader(trader_id: str) -> Dict:
    """Get single master trader"""
    return copy_trading_engine.get_trader(trader_id) or {"error": "Trader not found"}

def get_top_performers(period: str = "monthly") -> List[Dict]:
    """Get top performing traders"""
    return copy_trading_engine.get_top_performers(period)

def get_trending_traders() -> List[Dict]:
    """Get trending traders"""
    return copy_trading_engine.get_trending_traders()

def start_copy_trading(follower_id: str, master_trader_id: str, 
                       amount: float, settings: Dict = None) -> Dict:
    """Start copying a master trader"""
    return copy_trading_engine.start_copying(follower_id, master_trader_id, amount, settings)

def stop_copy_trading(follower_id: str, relationship_id: str) -> Dict:
    """Stop copying"""
    return copy_trading_engine.stop_copying(follower_id, relationship_id)

def pause_copy_trading(follower_id: str, relationship_id: str) -> Dict:
    """Pause copying"""
    return copy_trading_engine.pause_copying(follower_id, relationship_id)

def resume_copy_trading(follower_id: str, relationship_id: str) -> Dict:
    """Resume copying"""
    return copy_trading_engine.resume_copying(follower_id, relationship_id)

def update_copy_settings(follower_id: str, relationship_id: str, settings: Dict) -> Dict:
    """Update copy settings"""
    return copy_trading_engine.update_copy_settings(follower_id, relationship_id, settings)

def get_user_copies(follower_id: str) -> List[Dict]:
    """Get user's copy relationships"""
    return copy_trading_engine.get_user_copy_relationships(follower_id)

def get_copy_portfolio(follower_id: str) -> Dict:
    """Get user's copy trading portfolio summary"""
    return copy_trading_engine.get_copy_portfolio_summary(follower_id)

def add_funds_to_copy(follower_id: str, relationship_id: str, amount: float) -> Dict:
    """Add funds to copy relationship"""
    return copy_trading_engine.add_funds(follower_id, relationship_id, amount)
