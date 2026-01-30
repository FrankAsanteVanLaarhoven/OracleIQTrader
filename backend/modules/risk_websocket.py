# OracleIQTrader - Risk WebSocket Manager
# Real-time risk metrics streaming via WebSocket

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

from modules.risk_analysis import risk_engine


class RiskWebSocketManager:
    """
    Manages WebSocket connections for real-time risk updates.
    Broadcasts updated risk metrics to all connected clients.
    """
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # user_id -> set of websockets
        self.broadcast_interval = 10  # seconds between risk updates
        self._running = False
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Send initial risk data
        await self.send_risk_update(websocket, user_id)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_risk_update(self, websocket: WebSocket, user_id: str):
        """Send current risk metrics to a single client"""
        try:
            risk_data = risk_engine.get_portfolio_risk(user_id)
            message = {
                "type": "risk_update",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": risk_data.model_dump()
            }
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending risk update: {e}")
    
    async def broadcast_risk_updates(self):
        """Broadcast risk updates to all connected clients"""
        for user_id, connections in list(self.active_connections.items()):
            if not connections:
                continue
                
            try:
                risk_data = risk_engine.get_portfolio_risk(user_id)
                message = {
                    "type": "risk_update",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": risk_data.model_dump()
                }
                
                dead_connections = set()
                for websocket in connections:
                    try:
                        await websocket.send_json(message)
                    except Exception:
                        dead_connections.add(websocket)
                
                # Clean up dead connections
                for ws in dead_connections:
                    self.active_connections[user_id].discard(ws)
                    
            except Exception as e:
                print(f"Error broadcasting to {user_id}: {e}")
    
    async def send_alert(self, user_id: str, alert_type: str, message: str, data: dict = None):
        """Send a risk alert to a specific user"""
        if user_id not in self.active_connections:
            return
        
        alert_message = {
            "type": "risk_alert",
            "alert_type": alert_type,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data or {}
        }
        
        for websocket in list(self.active_connections.get(user_id, [])):
            try:
                await websocket.send_json(alert_message)
            except Exception:
                self.active_connections[user_id].discard(websocket)
    
    async def run_broadcast_loop(self):
        """Background task to periodically broadcast risk updates"""
        self._running = True
        while self._running:
            await asyncio.sleep(self.broadcast_interval)
            if self.active_connections:
                await self.broadcast_risk_updates()
    
    def stop(self):
        """Stop the broadcast loop"""
        self._running = False
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        total_connections = sum(len(conns) for conns in self.active_connections.values())
        return {
            "total_connections": total_connections,
            "users_connected": len(self.active_connections),
            "broadcast_interval_seconds": self.broadcast_interval,
            "is_running": self._running
        }


# Global instance
risk_ws_manager = RiskWebSocketManager()
