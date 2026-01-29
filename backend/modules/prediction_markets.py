# OracleIQTrader - Prediction Markets Engine
# Sports, Political, and Event Trading Platform
# Supports simulated markets + Kalshi/Polymarket API scaffolding

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import random
import uuid
import asyncio

class MarketCategory(str, Enum):
    SPORTS = "sports"
    POLITICS = "politics"
    CRYPTO = "crypto"
    ECONOMICS = "economics"
    ENTERTAINMENT = "entertainment"
    WEATHER = "weather"
    CUSTOM = "custom"

class MarketStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

class League(str, Enum):
    NFL = "NFL"
    NBA = "NBA"
    MLS = "MLS"
    UFC = "UFC"
    MLB = "MLB"
    NHL = "NHL"
    SOCCER_EPL = "EPL"
    SOCCER_UCL = "UCL"

class PredictionMarket:
    """Individual prediction market"""
    
    def __init__(self, market_id: str, title: str, category: MarketCategory,
                 resolution_date: datetime, description: str = ""):
        self.market_id = market_id
        self.title = title
        self.category = category
        self.description = description
        self.status = MarketStatus.OPEN
        self.created_at = datetime.utcnow()
        self.resolution_date = resolution_date
        self.resolved_at = None
        self.outcome = None  # True/False when resolved
        
        # Market dynamics
        self.yes_price = 0.50  # Initial 50/50
        self.no_price = 0.50
        self.yes_volume = 0
        self.no_volume = 0
        self.total_volume = 0
        self.liquidity = 10000  # Initial liquidity pool
        
        # Order book
        self.yes_orders: List[Dict] = []
        self.no_orders: List[Dict] = []
        self.trade_history: List[Dict] = []
        
        # Metadata
        self.tags: List[str] = []
        self.league: Optional[League] = None
        self.event_id: Optional[str] = None
        
    def to_dict(self) -> Dict:
        return {
            "market_id": self.market_id,
            "title": self.title,
            "category": self.category.value,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "resolution_date": self.resolution_date.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "outcome": self.outcome,
            "yes_price": round(self.yes_price, 4),
            "no_price": round(self.no_price, 4),
            "implied_probability": f"{self.yes_price * 100:.1f}%",
            "yes_volume": self.yes_volume,
            "no_volume": self.no_volume,
            "total_volume": self.total_volume,
            "liquidity": self.liquidity,
            "tags": self.tags,
            "league": self.league.value if self.league else None,
            "time_to_resolution": str(self.resolution_date - datetime.utcnow()) if self.status == MarketStatus.OPEN else None
        }


class UserPosition:
    """User's position in a market"""
    
    def __init__(self, user_id: str, market_id: str):
        self.user_id = user_id
        self.market_id = market_id
        self.yes_shares = 0
        self.no_shares = 0
        self.avg_yes_price = 0
        self.avg_no_price = 0
        self.total_invested = 0
        self.realized_pnl = 0
        
    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "market_id": self.market_id,
            "yes_shares": self.yes_shares,
            "no_shares": self.no_shares,
            "avg_yes_price": round(self.avg_yes_price, 4),
            "avg_no_price": round(self.avg_no_price, 4),
            "total_invested": round(self.total_invested, 2),
            "realized_pnl": round(self.realized_pnl, 2),
            "net_position": self.yes_shares - self.no_shares
        }


class PredictionMarketsEngine:
    """
    Prediction Markets Trading Engine.
    Supports sports, politics, and event-based prediction contracts.
    """
    
    def __init__(self):
        self.markets: Dict[str, PredictionMarket] = {}
        self.user_positions: Dict[str, Dict[str, UserPosition]] = {}  # user_id -> {market_id -> position}
        self.user_balances: Dict[str, float] = {}  # user_id -> balance
        self.leaderboard: List[Dict] = []
        
        # Initialize with sample markets
        self._create_sample_markets()
        
    def _generate_market_id(self) -> str:
        return f"MKT-{uuid.uuid4().hex[:8].upper()}"
    
    def _create_sample_markets(self):
        """Create sample prediction markets"""
        
        # Sports Markets
        sports_markets = [
            {
                "title": "Chiefs to win Super Bowl 2026",
                "category": MarketCategory.SPORTS,
                "description": "Will the Kansas City Chiefs win Super Bowl LX?",
                "resolution_date": datetime(2026, 2, 15),
                "yes_price": 0.22,
                "league": League.NFL,
                "tags": ["NFL", "Super Bowl", "Chiefs"]
            },
            {
                "title": "Lakers to win NBA Championship 2026",
                "category": MarketCategory.SPORTS,
                "description": "Will the Los Angeles Lakers win the 2025-26 NBA Championship?",
                "resolution_date": datetime(2026, 6, 20),
                "yes_price": 0.15,
                "league": League.NBA,
                "tags": ["NBA", "Lakers", "Championship"]
            },
            {
                "title": "Inter Miami to win MLS Cup 2026",
                "category": MarketCategory.SPORTS,
                "description": "Will Inter Miami CF win the 2026 MLS Cup?",
                "resolution_date": datetime(2026, 12, 10),
                "yes_price": 0.18,
                "league": League.MLS,
                "tags": ["MLS", "Inter Miami", "Messi"]
            },
            {
                "title": "Jon Jones to retain UFC Heavyweight title in next fight",
                "category": MarketCategory.SPORTS,
                "description": "Will Jon Jones successfully defend his UFC Heavyweight Championship?",
                "resolution_date": datetime(2026, 3, 15),
                "yes_price": 0.72,
                "league": League.UFC,
                "tags": ["UFC", "Jon Jones", "Heavyweight"]
            }
        ]
        
        # Political Markets
        political_markets = [
            {
                "title": "Fed to cut rates by March 2026",
                "category": MarketCategory.POLITICS,
                "description": "Will the Federal Reserve cut interest rates by at least 25bps before March 31, 2026?",
                "resolution_date": datetime(2026, 3, 31),
                "yes_price": 0.68,
                "tags": ["Fed", "Interest Rates", "Monetary Policy"]
            },
            {
                "title": "US GDP growth above 2.5% in Q1 2026",
                "category": MarketCategory.ECONOMICS,
                "description": "Will US real GDP growth exceed 2.5% in Q1 2026?",
                "resolution_date": datetime(2026, 4, 30),
                "yes_price": 0.45,
                "tags": ["GDP", "Economy", "Growth"]
            },
            {
                "title": "Bitcoin above $150k by June 2026",
                "category": MarketCategory.CRYPTO,
                "description": "Will Bitcoin price exceed $150,000 at any point before June 30, 2026?",
                "resolution_date": datetime(2026, 6, 30),
                "yes_price": 0.35,
                "tags": ["Bitcoin", "Crypto", "Price"]
            },
            {
                "title": "Ethereum ETF net inflows exceed $10B in 2026",
                "category": MarketCategory.CRYPTO,
                "description": "Will spot Ethereum ETFs see cumulative net inflows exceeding $10 billion in calendar year 2026?",
                "resolution_date": datetime(2026, 12, 31),
                "yes_price": 0.52,
                "tags": ["Ethereum", "ETF", "Institutional"]
            }
        ]
        
        # Create all markets
        for market_data in sports_markets + political_markets:
            market_id = self._generate_market_id()
            market = PredictionMarket(
                market_id=market_id,
                title=market_data["title"],
                category=market_data["category"],
                resolution_date=market_data["resolution_date"],
                description=market_data["description"]
            )
            market.yes_price = market_data["yes_price"]
            market.no_price = 1 - market_data["yes_price"]
            market.tags = market_data.get("tags", [])
            market.league = market_data.get("league")
            
            # Add some simulated volume
            market.yes_volume = random.randint(10000, 500000)
            market.no_volume = random.randint(10000, 500000)
            market.total_volume = market.yes_volume + market.no_volume
            
            self.markets[market_id] = market
    
    def get_user_balance(self, user_id: str) -> float:
        """Get user's trading balance"""
        if user_id not in self.user_balances:
            self.user_balances[user_id] = 10000.0  # Initial demo balance
        return self.user_balances[user_id]
    
    def create_market(self, title: str, category: str, resolution_date: datetime,
                      description: str = "", tags: List[str] = None,
                      league: str = None, initial_price: float = 0.5) -> Dict:
        """Create a new prediction market"""
        market_id = self._generate_market_id()
        
        market = PredictionMarket(
            market_id=market_id,
            title=title,
            category=MarketCategory(category),
            resolution_date=resolution_date,
            description=description
        )
        market.yes_price = initial_price
        market.no_price = 1 - initial_price
        market.tags = tags or []
        if league:
            market.league = League(league)
            
        self.markets[market_id] = market
        
        return {
            "success": True,
            "market": market.to_dict()
        }
    
    def get_market(self, market_id: str) -> Optional[Dict]:
        """Get market details"""
        market = self.markets.get(market_id)
        return market.to_dict() if market else None
    
    def get_all_markets(self, category: str = None, status: str = None,
                        league: str = None) -> List[Dict]:
        """Get all markets with optional filtering"""
        markets = list(self.markets.values())
        
        if category:
            markets = [m for m in markets if m.category.value == category]
        if status:
            markets = [m for m in markets if m.status.value == status]
        if league:
            markets = [m for m in markets if m.league and m.league.value == league]
            
        return [m.to_dict() for m in sorted(markets, key=lambda x: x.total_volume, reverse=True)]
    
    def get_sports_markets(self, league: str = None) -> List[Dict]:
        """Get sports prediction markets"""
        return self.get_all_markets(category="sports", league=league)
    
    def get_political_markets(self) -> List[Dict]:
        """Get political/economic prediction markets"""
        markets = self.get_all_markets(category="politics")
        markets.extend(self.get_all_markets(category="economics"))
        return markets
    
    def get_crypto_markets(self) -> List[Dict]:
        """Get crypto prediction markets"""
        return self.get_all_markets(category="crypto")
    
    def buy_shares(self, user_id: str, market_id: str, side: str, 
                   amount: float) -> Dict:
        """
        Buy YES or NO shares in a market.
        
        Args:
            user_id: User identifier
            market_id: Market identifier
            side: "yes" or "no"
            amount: Dollar amount to spend
        """
        market = self.markets.get(market_id)
        if not market:
            return {"error": "Market not found"}
            
        if market.status != MarketStatus.OPEN:
            return {"error": f"Market is {market.status.value}"}
            
        balance = self.get_user_balance(user_id)
        if amount > balance:
            return {"error": "Insufficient balance", "balance": balance}
            
        # Calculate shares based on current price
        price = market.yes_price if side.lower() == "yes" else market.no_price
        shares = amount / price
        
        # Apply market impact (simple linear model)
        impact = (amount / market.liquidity) * 0.01
        new_price = min(0.99, price + impact) if side.lower() == "yes" else max(0.01, price - impact)
        
        # Update market
        if side.lower() == "yes":
            market.yes_price = new_price
            market.no_price = 1 - new_price
            market.yes_volume += amount
        else:
            market.no_price = new_price
            market.yes_price = 1 - new_price
            market.no_volume += amount
            
        market.total_volume += amount
        
        # Update user position
        if user_id not in self.user_positions:
            self.user_positions[user_id] = {}
        if market_id not in self.user_positions[user_id]:
            self.user_positions[user_id][market_id] = UserPosition(user_id, market_id)
            
        position = self.user_positions[user_id][market_id]
        
        if side.lower() == "yes":
            # Update average price
            total_cost = position.avg_yes_price * position.yes_shares + amount
            position.yes_shares += shares
            position.avg_yes_price = total_cost / position.yes_shares if position.yes_shares > 0 else 0
        else:
            total_cost = position.avg_no_price * position.no_shares + amount
            position.no_shares += shares
            position.avg_no_price = total_cost / position.no_shares if position.no_shares > 0 else 0
            
        position.total_invested += amount
        
        # Deduct from balance
        self.user_balances[user_id] = balance - amount
        
        # Record trade
        trade = {
            "trade_id": f"TRD-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "market_id": market_id,
            "side": side.upper(),
            "shares": round(shares, 4),
            "price": round(price, 4),
            "amount": round(amount, 2),
            "new_market_price": round(new_price, 4)
        }
        market.trade_history.append(trade)
        
        return {
            "success": True,
            "trade": trade,
            "position": position.to_dict(),
            "new_balance": round(self.user_balances[user_id], 2),
            "market": {
                "yes_price": round(market.yes_price, 4),
                "no_price": round(market.no_price, 4),
                "implied_probability": f"{market.yes_price * 100:.1f}%"
            }
        }
    
    def sell_shares(self, user_id: str, market_id: str, side: str,
                    shares: float) -> Dict:
        """Sell YES or NO shares"""
        market = self.markets.get(market_id)
        if not market:
            return {"error": "Market not found"}
            
        if market.status != MarketStatus.OPEN:
            return {"error": f"Market is {market.status.value}"}
            
        if user_id not in self.user_positions or market_id not in self.user_positions[user_id]:
            return {"error": "No position in this market"}
            
        position = self.user_positions[user_id][market_id]
        
        if side.lower() == "yes" and shares > position.yes_shares:
            return {"error": "Insufficient YES shares", "available": position.yes_shares}
        if side.lower() == "no" and shares > position.no_shares:
            return {"error": "Insufficient NO shares", "available": position.no_shares}
        
        # Calculate proceeds
        price = market.yes_price if side.lower() == "yes" else market.no_price
        proceeds = shares * price
        
        # Apply market impact
        impact = (proceeds / market.liquidity) * 0.01
        new_price = max(0.01, price - impact) if side.lower() == "yes" else min(0.99, price + impact)
        
        # Update market
        if side.lower() == "yes":
            market.yes_price = new_price
            market.no_price = 1 - new_price
            position.yes_shares -= shares
            # Calculate P&L
            cost_basis = shares * position.avg_yes_price
            position.realized_pnl += proceeds - cost_basis
        else:
            market.no_price = new_price
            market.yes_price = 1 - new_price
            position.no_shares -= shares
            cost_basis = shares * position.avg_no_price
            position.realized_pnl += proceeds - cost_basis
        
        # Add to balance
        self.user_balances[user_id] = self.get_user_balance(user_id) + proceeds
        
        return {
            "success": True,
            "shares_sold": shares,
            "proceeds": round(proceeds, 2),
            "new_balance": round(self.user_balances[user_id], 2),
            "position": position.to_dict()
        }
    
    def get_user_positions(self, user_id: str) -> List[Dict]:
        """Get all user positions"""
        if user_id not in self.user_positions:
            return []
            
        positions = []
        for market_id, position in self.user_positions[user_id].items():
            market = self.markets.get(market_id)
            if market:
                pos_data = position.to_dict()
                pos_data["market_title"] = market.title
                pos_data["current_yes_price"] = market.yes_price
                pos_data["current_no_price"] = market.no_price
                
                # Calculate unrealized P&L
                yes_value = position.yes_shares * market.yes_price
                no_value = position.no_shares * market.no_price
                yes_cost = position.yes_shares * position.avg_yes_price
                no_cost = position.no_shares * position.avg_no_price
                pos_data["unrealized_pnl"] = round((yes_value + no_value) - (yes_cost + no_cost), 2)
                pos_data["total_value"] = round(yes_value + no_value, 2)
                
                positions.append(pos_data)
                
        return positions
    
    def get_leaderboard(self, period: str = "all") -> List[Dict]:
        """Get prediction markets leaderboard"""
        leaderboard = []
        
        for user_id in self.user_positions:
            positions = self.get_user_positions(user_id)
            
            total_pnl = sum(p.get("unrealized_pnl", 0) + p.get("realized_pnl", 0) for p in positions)
            total_volume = sum(p.get("total_invested", 0) for p in positions)
            
            leaderboard.append({
                "user_id": user_id,
                "total_pnl": round(total_pnl, 2),
                "total_volume": round(total_volume, 2),
                "positions_count": len(positions),
                "win_rate": random.uniform(0.4, 0.7)  # Simulated
            })
        
        # Sort by P&L
        leaderboard.sort(key=lambda x: x["total_pnl"], reverse=True)
        
        # Add ranks
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
            
        return leaderboard[:100]  # Top 100
    
    def resolve_market(self, market_id: str, outcome: bool) -> Dict:
        """Resolve a market (admin function)"""
        market = self.markets.get(market_id)
        if not market:
            return {"error": "Market not found"}
            
        market.status = MarketStatus.RESOLVED
        market.resolved_at = datetime.utcnow()
        market.outcome = outcome
        
        # Settle all positions
        settlements = []
        for user_id, positions in self.user_positions.items():
            if market_id in positions:
                position = positions[market_id]
                
                # Calculate payout
                if outcome:  # YES wins
                    payout = position.yes_shares * 1.0  # $1 per share
                    loss = position.no_shares * position.avg_no_price
                else:  # NO wins
                    payout = position.no_shares * 1.0
                    loss = position.yes_shares * position.avg_yes_price
                
                net = payout - loss
                self.user_balances[user_id] = self.get_user_balance(user_id) + payout
                
                settlements.append({
                    "user_id": user_id,
                    "payout": round(payout, 2),
                    "net_pnl": round(net, 2)
                })
        
        return {
            "success": True,
            "market_id": market_id,
            "outcome": "YES" if outcome else "NO",
            "settlements": settlements,
            "total_payouts": sum(s["payout"] for s in settlements)
        }
    
    def get_market_history(self, market_id: str, limit: int = 50) -> List[Dict]:
        """Get trade history for a market"""
        market = self.markets.get(market_id)
        if not market:
            return []
        return market.trade_history[-limit:]
    
    def get_trending_markets(self, limit: int = 10) -> List[Dict]:
        """Get trending markets by volume"""
        markets = sorted(self.markets.values(), key=lambda x: x.total_volume, reverse=True)
        return [m.to_dict() for m in markets[:limit]]
    
    def search_markets(self, query: str) -> List[Dict]:
        """Search markets by title or tags"""
        query_lower = query.lower()
        results = []
        
        for market in self.markets.values():
            if query_lower in market.title.lower():
                results.append(market.to_dict())
            elif any(query_lower in tag.lower() for tag in market.tags):
                results.append(market.to_dict())
                
        return results


# Kalshi API Scaffolding
class KalshiAPIClient:
    """
    Kalshi API Client Scaffolding.
    CFTC-regulated prediction markets integration.
    """
    
    def __init__(self, api_key: str = None, api_secret: str = None):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://trading-api.kalshi.com/v1"
        self.is_connected = False
        
    async def connect(self) -> Dict:
        """Connect to Kalshi API"""
        if not self.api_key:
            return {
                "connected": False,
                "error": "API key required",
                "instructions": "Get API keys at https://kalshi.com/developers"
            }
        
        # Placeholder for actual connection
        return {
            "connected": True,
            "message": "Kalshi API connection scaffolded",
            "note": "Implement actual API calls when keys provided"
        }
    
    async def get_markets(self, status: str = "open") -> Dict:
        """Get Kalshi markets"""
        return {
            "source": "kalshi",
            "scaffolded": True,
            "endpoint": f"{self.base_url}/markets",
            "params": {"status": status}
        }
    
    async def place_order(self, market_id: str, side: str, 
                          contracts: int, price: float) -> Dict:
        """Place order on Kalshi"""
        return {
            "source": "kalshi",
            "scaffolded": True,
            "endpoint": f"{self.base_url}/orders",
            "body": {
                "market_id": market_id,
                "side": side,
                "contracts": contracts,
                "price": price
            }
        }


# Polymarket API Scaffolding  
class PolymarketAPIClient:
    """
    Polymarket API Client Scaffolding.
    Crypto-based prediction markets integration.
    """
    
    def __init__(self, wallet_address: str = None):
        self.wallet_address = wallet_address
        self.base_url = "https://gamma-api.polymarket.com"
        self.is_connected = False
        
    async def connect(self) -> Dict:
        """Connect to Polymarket"""
        return {
            "connected": True,
            "message": "Polymarket API connection scaffolded",
            "note": "Requires Web3 wallet integration for trading"
        }
    
    async def get_markets(self) -> Dict:
        """Get Polymarket markets"""
        return {
            "source": "polymarket",
            "scaffolded": True,
            "endpoint": f"{self.base_url}/markets"
        }


# Singleton instance
prediction_engine = PredictionMarketsEngine()
kalshi_client = KalshiAPIClient()
polymarket_client = PolymarketAPIClient()


# API Functions
def get_all_prediction_markets(category: str = None) -> List[Dict]:
    """Get all prediction markets"""
    return prediction_engine.get_all_markets(category=category)

def get_sports_markets(league: str = None) -> List[Dict]:
    """Get sports prediction markets"""
    return prediction_engine.get_sports_markets(league)

def get_political_markets() -> List[Dict]:
    """Get political/economic markets"""
    return prediction_engine.get_political_markets()

def get_crypto_markets() -> List[Dict]:
    """Get crypto prediction markets"""
    return prediction_engine.get_crypto_markets()

def get_prediction_market(market_id: str) -> Dict:
    """Get single market details"""
    return prediction_engine.get_market(market_id) or {"error": "Market not found"}

def buy_prediction_shares(user_id: str, market_id: str, side: str, amount: float) -> Dict:
    """Buy shares in a prediction market"""
    return prediction_engine.buy_shares(user_id, market_id, side, amount)

def sell_prediction_shares(user_id: str, market_id: str, side: str, shares: float) -> Dict:
    """Sell shares in a prediction market"""
    return prediction_engine.sell_shares(user_id, market_id, side, shares)

def get_user_prediction_positions(user_id: str) -> List[Dict]:
    """Get user's prediction market positions"""
    return prediction_engine.get_user_positions(user_id)

def get_user_prediction_balance(user_id: str) -> Dict:
    """Get user's prediction market balance"""
    return {
        "user_id": user_id,
        "balance": prediction_engine.get_user_balance(user_id),
        "currency": "USD"
    }

def get_prediction_leaderboard() -> List[Dict]:
    """Get prediction markets leaderboard"""
    return prediction_engine.get_leaderboard()

def get_trending_predictions() -> List[Dict]:
    """Get trending prediction markets"""
    return prediction_engine.get_trending_markets()

def search_predictions(query: str) -> List[Dict]:
    """Search prediction markets"""
    return prediction_engine.search_markets(query)

def create_prediction_market(title: str, category: str, resolution_date: str,
                             description: str = "", tags: List[str] = None) -> Dict:
    """Create a new prediction market"""
    try:
        res_date = datetime.fromisoformat(resolution_date.replace('Z', '+00:00'))
    except:
        res_date = datetime.utcnow() + timedelta(days=30)
    return prediction_engine.create_market(title, category, res_date, description, tags)

def get_market_trade_history(market_id: str) -> List[Dict]:
    """Get trade history for a market"""
    return prediction_engine.get_market_history(market_id)

async def connect_kalshi(api_key: str, api_secret: str) -> Dict:
    """Connect to Kalshi API"""
    kalshi_client.api_key = api_key
    kalshi_client.api_secret = api_secret
    return await kalshi_client.connect()

async def connect_polymarket(wallet_address: str) -> Dict:
    """Connect to Polymarket"""
    polymarket_client.wallet_address = wallet_address
    return await polymarket_client.connect()
