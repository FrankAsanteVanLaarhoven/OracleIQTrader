# OracleIQTrader - Real-time Copy Trading WebSocket
# Live trade propagation to followers when master traders execute

from datetime import datetime, timezone
from typing import Dict, List, Set
from fastapi import WebSocket
from enum import Enum
import asyncio
import json
import logging
import uuid

logger = logging.getLogger(__name__)


class TradeAction(str, Enum):
    BUY = "buy"
    SELL = "sell"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


class CopyTradeEvent:
    """Represents a trade event to propagate to followers"""
    
    def __init__(self, master_trader_id: str, master_name: str, action: TradeAction,
                 symbol: str, quantity: float, price: float):
        self.event_id = f"CTE-{uuid.uuid4().hex[:8].upper()}"
        self.master_trader_id = master_trader_id
        self.master_name = master_name
        self.action = action
        self.symbol = symbol
        self.quantity = quantity
        self.price = price
        self.timestamp = datetime.now(timezone.utc)
        self.propagated_to: List[str] = []
        self.total_followers = 0
        self.total_volume = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "event_id": self.event_id,
            "master_trader_id": self.master_trader_id,
            "master_name": self.master_name,
            "action": self.action.value,
            "symbol": self.symbol,
            "quantity": self.quantity,
            "price": self.price,
            "timestamp": self.timestamp.isoformat(),
            "propagated_count": len(self.propagated_to),
            "total_followers": self.total_followers,
            "total_volume": self.total_volume
        }


class CopiedTrade:
    """Represents a trade copied by a follower"""
    
    def __init__(self, follower_id: str, event: CopyTradeEvent, copy_ratio: float):
        self.trade_id = f"CPT-{uuid.uuid4().hex[:8].upper()}"
        self.follower_id = follower_id
        self.event_id = event.event_id
        self.master_trader_id = event.master_trader_id
        self.action = event.action
        self.symbol = event.symbol
        self.original_quantity = event.quantity
        self.copied_quantity = event.quantity * copy_ratio
        self.price = event.price
        self.copy_ratio = copy_ratio
        self.status = "executed"
        self.timestamp = datetime.now(timezone.utc)
    
    def to_dict(self) -> Dict:
        return {
            "trade_id": self.trade_id,
            "follower_id": self.follower_id,
            "event_id": self.event_id,
            "master_trader_id": self.master_trader_id,
            "action": self.action.value,
            "symbol": self.symbol,
            "original_quantity": self.original_quantity,
            "copied_quantity": self.copied_quantity,
            "price": self.price,
            "copy_ratio": self.copy_ratio,
            "status": self.status,
            "timestamp": self.timestamp.isoformat()
        }


class CopyTradingWebSocketManager:
    """Manages WebSocket connections for copy trading updates"""
    
    def __init__(self):
        # WebSocket connections per user
        self.connections: Dict[str, Set[WebSocket]] = {}
        
        # Trade event history
        self.trade_events: List[CopyTradeEvent] = []
        self.copied_trades: Dict[str, List[CopiedTrade]] = {}  # by follower_id
        
        # User subscriptions (which traders they're copying)
        self.subscriptions: Dict[str, Set[str]] = {}  # follower_id -> set of master_trader_ids
        
        # Copy relationships with settings
        self.copy_settings: Dict[str, Dict] = {}  # relationship_id -> settings
        
        # Statistics
        self.total_events_propagated = 0
        self.total_trades_copied = 0
        self.total_volume_copied = 0.0
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user to the copy trading WebSocket"""
        await websocket.accept()
        
        if user_id not in self.connections:
            self.connections[user_id] = set()
        self.connections[user_id].add(websocket)
        
        logger.info(f"Copy trading WS connected: {user_id}. Total connections: {self._total_connections()}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected to copy trading stream",
            "subscribed_traders": list(self.subscriptions.get(user_id, set()))
        })
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a user from the WebSocket"""
        if user_id in self.connections:
            self.connections[user_id].discard(websocket)
            if not self.connections[user_id]:
                del self.connections[user_id]
        
        logger.info(f"Copy trading WS disconnected: {user_id}. Total connections: {self._total_connections()}")
    
    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self.connections.values())
    
    def subscribe_to_trader(self, follower_id: str, master_trader_id: str, settings: Dict = None):
        """Subscribe a follower to a master trader's trades"""
        if follower_id not in self.subscriptions:
            self.subscriptions[follower_id] = set()
        
        self.subscriptions[follower_id].add(master_trader_id)
        
        if settings:
            rel_key = f"{follower_id}:{master_trader_id}"
            self.copy_settings[rel_key] = settings
        
        logger.info(f"User {follower_id} subscribed to trader {master_trader_id}")
    
    def unsubscribe_from_trader(self, follower_id: str, master_trader_id: str):
        """Unsubscribe a follower from a master trader"""
        if follower_id in self.subscriptions:
            self.subscriptions[follower_id].discard(master_trader_id)
            
        rel_key = f"{follower_id}:{master_trader_id}"
        if rel_key in self.copy_settings:
            del self.copy_settings[rel_key]
        
        logger.info(f"User {follower_id} unsubscribed from trader {master_trader_id}")
    
    def get_copy_settings(self, follower_id: str, master_trader_id: str) -> Dict:
        """Get copy settings for a follower-trader pair"""
        rel_key = f"{follower_id}:{master_trader_id}"
        return self.copy_settings.get(rel_key, {
            "copy_ratio": 1.0,
            "max_trade_size": None,
            "stop_loss_pct": None,
            "take_profit_pct": None
        })
    
    async def propagate_trade(self, master_trader_id: str, master_name: str,
                              action: TradeAction, symbol: str, quantity: float, price: float) -> CopyTradeEvent:
        """Propagate a master trader's trade to all followers"""
        
        # Create event
        event = CopyTradeEvent(master_trader_id, master_name, action, symbol, quantity, price)
        
        # Find all followers subscribed to this trader
        followers_to_notify = []
        for follower_id, subscribed_traders in self.subscriptions.items():
            if master_trader_id in subscribed_traders:
                followers_to_notify.append(follower_id)
        
        event.total_followers = len(followers_to_notify)
        
        # Propagate to each follower
        for follower_id in followers_to_notify:
            settings = self.get_copy_settings(follower_id, master_trader_id)
            
            # Calculate copied quantity
            copy_ratio = settings.get("copy_ratio", 1.0)
            copied_quantity = quantity * copy_ratio
            
            # Apply max trade size limit
            max_size = settings.get("max_trade_size")
            if max_size and copied_quantity * price > max_size:
                copied_quantity = max_size / price
            
            # Create copied trade record
            copied_trade = CopiedTrade(follower_id, event, copy_ratio)
            copied_trade.copied_quantity = copied_quantity
            
            if follower_id not in self.copied_trades:
                self.copied_trades[follower_id] = []
            self.copied_trades[follower_id].append(copied_trade)
            
            # Update event stats
            event.propagated_to.append(follower_id)
            event.total_volume += copied_quantity * price
            
            # Send WebSocket notification to follower
            if follower_id in self.connections:
                notification = {
                    "type": "trade_copied",
                    "event": event.to_dict(),
                    "your_trade": copied_trade.to_dict(),
                    "message": f"Copied {action.value.upper()} {copied_quantity:.4f} {symbol} @ ${price:.2f}"
                }
                
                for ws in list(self.connections[follower_id]):
                    try:
                        await ws.send_json(notification)
                    except Exception as e:
                        logger.error(f"Failed to send to {follower_id}: {e}")
                        self.connections[follower_id].discard(ws)
            
            self.total_trades_copied += 1
            self.total_volume_copied += copied_quantity * price
        
        # Store event
        self.trade_events.append(event)
        if len(self.trade_events) > 1000:
            self.trade_events = self.trade_events[-500:]
        
        self.total_events_propagated += 1
        
        logger.info(f"Trade propagated: {master_name} {action.value} {quantity} {symbol} -> {len(followers_to_notify)} followers")
        
        return event
    
    async def broadcast_master_activity(self, master_trader_id: str, master_name: str, activity: Dict):
        """Broadcast non-trade activity (portfolio updates, position changes, etc.)"""
        
        followers_to_notify = []
        for follower_id, subscribed_traders in self.subscriptions.items():
            if master_trader_id in subscribed_traders:
                followers_to_notify.append(follower_id)
        
        notification = {
            "type": "master_activity",
            "master_trader_id": master_trader_id,
            "master_name": master_name,
            "activity": activity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        for follower_id in followers_to_notify:
            if follower_id in self.connections:
                for ws in list(self.connections[follower_id]):
                    try:
                        await ws.send_json(notification)
                    except Exception:
                        self.connections[follower_id].discard(ws)
    
    def get_user_copied_trades(self, follower_id: str, limit: int = 50) -> List[Dict]:
        """Get a user's copied trade history"""
        trades = self.copied_trades.get(follower_id, [])
        return [t.to_dict() for t in sorted(trades, key=lambda x: x.timestamp, reverse=True)[:limit]]
    
    def get_recent_events(self, limit: int = 50) -> List[Dict]:
        """Get recent trade events"""
        return [e.to_dict() for e in sorted(self.trade_events, key=lambda x: x.timestamp, reverse=True)[:limit]]
    
    def get_stats(self) -> Dict:
        """Get copy trading statistics"""
        return {
            "active_connections": self._total_connections(),
            "total_subscribers": len(self.subscriptions),
            "total_events_propagated": self.total_events_propagated,
            "total_trades_copied": self.total_trades_copied,
            "total_volume_copied": round(self.total_volume_copied, 2),
            "events_in_history": len(self.trade_events)
        }
    
    def get_trader_followers(self, master_trader_id: str) -> List[str]:
        """Get list of followers for a specific trader"""
        followers = []
        for follower_id, subscribed_traders in self.subscriptions.items():
            if master_trader_id in subscribed_traders:
                followers.append(follower_id)
        return followers


# Global instance
copy_trading_ws_manager = CopyTradingWebSocketManager()


# Simulated trade generator for demo purposes
async def simulate_master_trades(manager: CopyTradingWebSocketManager):
    """Simulate master traders making trades for demo purposes"""
    import random
    
    master_traders = [
        {"id": "MTR-001", "name": "Bridgewater Alpha Fund"},
        {"id": "MTR-002", "name": "Citadel Momentum"},
        {"id": "MTR-003", "name": "Renaissance Quant"},
        {"id": "MTR-004", "name": "DeFi Alpha Hunter"},
        {"id": "MTR-005", "name": "Trend Surfer Pro"},
    ]
    
    symbols = ["BTC", "ETH", "SOL", "AVAX", "LINK", "MATIC", "ARB"]
    
    while True:
        await asyncio.sleep(random.randint(30, 120))  # Random 30-120 seconds
        
        if manager._total_connections() > 0:
            trader = random.choice(master_traders)
            symbol = random.choice(symbols)
            action = random.choice([TradeAction.BUY, TradeAction.SELL])
            quantity = random.uniform(0.1, 5.0)
            price = random.uniform(100, 50000) if symbol == "BTC" else random.uniform(10, 3000)
            
            await manager.propagate_trade(
                trader["id"],
                trader["name"],
                action,
                symbol,
                round(quantity, 4),
                round(price, 2)
            )
