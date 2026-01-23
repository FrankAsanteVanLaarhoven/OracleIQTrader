"""
Tournament WebSocket Module
Real-time trade feed and spectator mode for tournaments
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, asdict
import random

logger = logging.getLogger(__name__)


@dataclass
class LiveTrade:
    """Real-time trade event"""
    id: str
    tournament_id: str
    trader_name: str
    trader_rank: int
    symbol: str
    side: str  # buy/sell
    quantity: float
    price: float
    pnl: float
    pnl_percent: float
    timestamp: str


@dataclass
class LeaderboardUpdate:
    """Leaderboard position change"""
    trader_name: str
    old_rank: int
    new_rank: int
    pnl_percent: float
    movement: str  # up/down/same


class TournamentWebSocketManager:
    """Manages WebSocket connections for tournament spectator mode"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set] = {}  # tournament_id -> set of websockets
        self.spectator_counts: Dict[str, int] = {}
        self.trade_history: Dict[str, List[LiveTrade]] = {}
        self._running = False
        self._simulation_task = None
    
    async def connect(self, websocket, tournament_id: str):
        """Add a spectator to a tournament"""
        if tournament_id not in self.active_connections:
            self.active_connections[tournament_id] = set()
            self.trade_history[tournament_id] = []
            self.spectator_counts[tournament_id] = 0
        
        self.active_connections[tournament_id].add(websocket)
        self.spectator_counts[tournament_id] += 1
        
        # Send welcome message
        await self._send_to_websocket(websocket, {
            "type": "welcome",
            "tournament_id": tournament_id,
            "spectators": self.spectator_counts[tournament_id],
            "recent_trades": [asdict(t) for t in self.trade_history[tournament_id][-10:]]
        })
        
        # Broadcast spectator count update
        await self.broadcast(tournament_id, {
            "type": "spectator_update",
            "count": self.spectator_counts[tournament_id]
        })
        
        logger.info(f"Spectator joined tournament {tournament_id}. Total: {self.spectator_counts[tournament_id]}")
    
    async def disconnect(self, websocket, tournament_id: str):
        """Remove a spectator from a tournament"""
        if tournament_id in self.active_connections:
            self.active_connections[tournament_id].discard(websocket)
            self.spectator_counts[tournament_id] = max(0, self.spectator_counts[tournament_id] - 1)
            
            await self.broadcast(tournament_id, {
                "type": "spectator_update",
                "count": self.spectator_counts[tournament_id]
            })
    
    async def broadcast(self, tournament_id: str, message: dict):
        """Broadcast message to all spectators of a tournament"""
        if tournament_id not in self.active_connections:
            return
        
        disconnected = set()
        for websocket in self.active_connections[tournament_id]:
            try:
                await self._send_to_websocket(websocket, message)
            except Exception:
                disconnected.add(websocket)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.active_connections[tournament_id].discard(ws)
    
    async def _send_to_websocket(self, websocket, message: dict):
        """Send message to a single websocket"""
        try:
            if hasattr(websocket, 'send_json'):
                await websocket.send_json(message)
            else:
                await websocket.send(json.dumps(message))
        except Exception as e:
            logger.debug(f"WebSocket send error: {e}")
    
    async def broadcast_trade(self, tournament_id: str, trade: LiveTrade):
        """Broadcast a new trade to all spectators"""
        if tournament_id not in self.trade_history:
            self.trade_history[tournament_id] = []
        
        self.trade_history[tournament_id].append(trade)
        
        # Keep only last 100 trades
        if len(self.trade_history[tournament_id]) > 100:
            self.trade_history[tournament_id] = self.trade_history[tournament_id][-100:]
        
        await self.broadcast(tournament_id, {
            "type": "trade",
            "data": asdict(trade)
        })
    
    async def broadcast_leaderboard_update(self, tournament_id: str, updates: List[LeaderboardUpdate]):
        """Broadcast leaderboard changes"""
        await self.broadcast(tournament_id, {
            "type": "leaderboard_update",
            "updates": [asdict(u) for u in updates]
        })
    
    def start_simulation(self, tournament_id: str):
        """Start simulated trade feed for demo purposes"""
        if not self._running:
            self._running = True
            self._simulation_task = asyncio.create_task(
                self._simulate_trades(tournament_id)
            )
    
    def stop_simulation(self):
        """Stop simulation"""
        self._running = False
        if self._simulation_task:
            self._simulation_task.cancel()
    
    async def _simulate_trades(self, tournament_id: str):
        """Generate simulated trades for demo/testing"""
        traders = [
            ("CryptoKing", 1), ("TradeMaster", 2), ("BullRunner", 3),
            ("DiamondHands", 4), ("MoonShot", 5), ("WhaleCatcher", 6),
            ("BTCMaxi", 7), ("ETHEnthusiast", 8), ("DeFiDegen", 9), ("TokenTrader", 10)
        ]
        symbols = ["BTC", "ETH", "SOL", "XRP", "ADA"]
        base_prices = {"BTC": 45000, "ETH": 3000, "SOL": 100, "XRP": 0.5, "ADA": 0.5}
        
        while self._running:
            try:
                # Random trade every 2-5 seconds
                await asyncio.sleep(random.uniform(2, 5))
                
                trader_name, rank = random.choice(traders)
                symbol = random.choice(symbols)
                side = random.choice(["buy", "sell"])
                quantity = random.uniform(0.1, 10)
                price = base_prices[symbol] * (1 + random.uniform(-0.02, 0.02))
                pnl = random.uniform(-500, 1000)
                pnl_percent = random.uniform(-5, 10)
                
                trade = LiveTrade(
                    id=f"sim_{datetime.now().timestamp()}",
                    tournament_id=tournament_id,
                    trader_name=trader_name,
                    trader_rank=rank,
                    symbol=symbol,
                    side=side,
                    quantity=round(quantity, 4),
                    price=round(price, 2),
                    pnl=round(pnl, 2),
                    pnl_percent=round(pnl_percent, 2),
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
                
                await self.broadcast_trade(tournament_id, trade)
                
                # Occasional leaderboard shuffle
                if random.random() < 0.2:
                    updates = []
                    for i in range(random.randint(1, 3)):
                        name, old_rank = random.choice(traders)
                        change = random.choice([-1, 1, 0])
                        new_rank = max(1, min(10, old_rank + change))
                        updates.append(LeaderboardUpdate(
                            trader_name=name,
                            old_rank=old_rank,
                            new_rank=new_rank,
                            pnl_percent=random.uniform(5, 20),
                            movement="up" if change < 0 else "down" if change > 0 else "same"
                        ))
                    await self.broadcast_leaderboard_update(tournament_id, updates)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulation error: {e}")
                await asyncio.sleep(1)
    
    def get_stats(self, tournament_id: str) -> Dict:
        """Get spectator stats for a tournament"""
        return {
            "tournament_id": tournament_id,
            "spectators": self.spectator_counts.get(tournament_id, 0),
            "trades_recorded": len(self.trade_history.get(tournament_id, [])),
            "active": tournament_id in self.active_connections
        }


# Global WebSocket manager
ws_manager = TournamentWebSocketManager()


# FastAPI WebSocket endpoint integration
async def handle_tournament_websocket(websocket, tournament_id: str):
    """Handle WebSocket connection for tournament spectator mode"""
    await ws_manager.connect(websocket, tournament_id)
    
    # Start simulation if first spectator
    if ws_manager.spectator_counts.get(tournament_id, 0) == 1:
        ws_manager.start_simulation(tournament_id)
    
    try:
        while True:
            # Keep connection alive, handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await ws_manager._send_to_websocket(websocket, {"type": "pong"})
            
    except Exception as e:
        logger.debug(f"WebSocket closed: {e}")
    finally:
        await ws_manager.disconnect(websocket, tournament_id)
        
        # Stop simulation if no spectators left
        if ws_manager.spectator_counts.get(tournament_id, 0) == 0:
            ws_manager.stop_simulation()


def get_spectator_stats(tournament_id: str) -> Dict:
    """Get spectator mode stats"""
    return ws_manager.get_stats(tournament_id)
