# OracleIQTrader - Push Notifications Backend
# Register devices, manage preferences, send notifications

from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
import httpx
import logging
import asyncio

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    PRICE_ALERT = "price_alert"
    TRADE_EXECUTED = "trade_executed"
    COPY_TRADE = "copy_trade"
    AGENT_SIGNAL = "agent_signal"
    PORTFOLIO_UPDATE = "portfolio_update"
    MARKET_NEWS = "market_news"
    RISK_WARNING = "risk_warning"
    DEPOSIT_WITHDRAWAL = "deposit_withdrawal"


class DeviceRegistration(BaseModel):
    token: str
    platform: str  # ios, android
    device: Optional[str] = None
    user_id: Optional[str] = None


class NotificationPreferences(BaseModel):
    trades: bool = True
    alerts: bool = True
    copyTrading: bool = True
    agents: bool = True
    news: bool = False
    marketing: bool = False


class PushNotification(BaseModel):
    to: str  # Expo push token
    title: str
    body: str
    data: Optional[Dict] = None
    sound: str = "default"
    badge: int = 1
    priority: str = "high"
    channelId: Optional[str] = None


class PushNotificationService:
    """Service for sending push notifications via Expo"""
    
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    def __init__(self, db=None):
        self.db = db
        self._device_registry: Dict[str, DeviceRegistration] = {}
        self._user_devices: Dict[str, List[str]] = {}  # user_id -> [tokens]
        self._preferences: Dict[str, NotificationPreferences] = {}
        self._notification_queue: List[PushNotification] = []
        self._stats = {
            "total_sent": 0,
            "total_delivered": 0,
            "total_failed": 0,
        }
    
    def set_db(self, db):
        self.db = db
    
    async def register_device(self, registration: DeviceRegistration) -> bool:
        """Register a device for push notifications"""
        token = registration.token
        
        # Store in memory
        self._device_registry[token] = registration
        
        # Associate with user if provided
        if registration.user_id:
            if registration.user_id not in self._user_devices:
                self._user_devices[registration.user_id] = []
            if token not in self._user_devices[registration.user_id]:
                self._user_devices[registration.user_id].append(token)
        
        # Persist to MongoDB
        if self.db:
            await self.db.push_devices.update_one(
                {"token": token},
                {"$set": {
                    "token": token,
                    "platform": registration.platform,
                    "device": registration.device,
                    "user_id": registration.user_id,
                    "registered_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True
            )
        
        logger.info(f"Registered device: {registration.platform} - {registration.device}")
        return True
    
    async def unregister_device(self, token: str) -> bool:
        """Unregister a device"""
        if token in self._device_registry:
            reg = self._device_registry[token]
            if reg.user_id and reg.user_id in self._user_devices:
                self._user_devices[reg.user_id] = [
                    t for t in self._user_devices[reg.user_id] if t != token
                ]
            del self._device_registry[token]
        
        if self.db:
            await self.db.push_devices.delete_one({"token": token})
        
        return True
    
    async def update_preferences(self, user_id: str, preferences: NotificationPreferences):
        """Update notification preferences for a user"""
        self._preferences[user_id] = preferences
        
        if self.db:
            await self.db.notification_preferences.update_one(
                {"user_id": user_id},
                {"$set": {
                    "user_id": user_id,
                    **preferences.model_dump(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True
            )
    
    def get_preferences(self, user_id: str) -> NotificationPreferences:
        """Get notification preferences for a user"""
        return self._preferences.get(user_id, NotificationPreferences())
    
    def get_user_tokens(self, user_id: str) -> List[str]:
        """Get all push tokens for a user"""
        return self._user_devices.get(user_id, [])
    
    async def send_notification(self, notification: PushNotification) -> Dict:
        """Send a single push notification via Expo"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.EXPO_PUSH_URL,
                    json={
                        "to": notification.to,
                        "title": notification.title,
                        "body": notification.body,
                        "data": notification.data or {},
                        "sound": notification.sound,
                        "badge": notification.badge,
                        "priority": notification.priority,
                        "channelId": notification.channelId,
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=10.0
                )
                
                result = response.json()
                
                if response.status_code == 200:
                    self._stats["total_sent"] += 1
                    if result.get("data", {}).get("status") == "ok":
                        self._stats["total_delivered"] += 1
                    logger.info(f"Notification sent to {notification.to[:20]}...")
                    return {"success": True, "result": result}
                else:
                    self._stats["total_failed"] += 1
                    logger.error(f"Failed to send notification: {result}")
                    return {"success": False, "error": result}
                    
        except Exception as e:
            self._stats["total_failed"] += 1
            logger.error(f"Exception sending notification: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_to_user(self, user_id: str, title: str, body: str, 
                          data: Dict = None, notification_type: NotificationType = None) -> List[Dict]:
        """Send notification to all devices of a user"""
        tokens = self.get_user_tokens(user_id)
        if not tokens:
            return []
        
        # Check preferences
        prefs = self.get_preferences(user_id)
        if notification_type:
            if notification_type == NotificationType.TRADE_EXECUTED and not prefs.trades:
                return []
            if notification_type == NotificationType.PRICE_ALERT and not prefs.alerts:
                return []
            if notification_type == NotificationType.COPY_TRADE and not prefs.copyTrading:
                return []
            if notification_type == NotificationType.AGENT_SIGNAL and not prefs.agents:
                return []
            if notification_type == NotificationType.MARKET_NEWS and not prefs.news:
                return []
        
        results = []
        for token in tokens:
            notification = PushNotification(
                to=token,
                title=title,
                body=body,
                data=data or {},
            )
            result = await self.send_notification(notification)
            results.append(result)
        
        return results
    
    async def broadcast(self, title: str, body: str, data: Dict = None,
                       user_ids: List[str] = None) -> Dict:
        """Broadcast notification to multiple users or all users"""
        if user_ids:
            tokens = []
            for uid in user_ids:
                tokens.extend(self.get_user_tokens(uid))
        else:
            tokens = list(self._device_registry.keys())
        
        if not tokens:
            return {"sent": 0, "failed": 0}
        
        sent = 0
        failed = 0
        
        # Send in batches of 100
        batch_size = 100
        for i in range(0, len(tokens), batch_size):
            batch = tokens[i:i + batch_size]
            tasks = []
            for token in batch:
                notification = PushNotification(to=token, title=title, body=body, data=data)
                tasks.append(self.send_notification(notification))
            
            results = await asyncio.gather(*tasks)
            for r in results:
                if r.get("success"):
                    sent += 1
                else:
                    failed += 1
        
        return {"sent": sent, "failed": failed}
    
    # Convenience methods for specific notification types
    
    async def notify_trade_executed(self, user_id: str, trade: Dict):
        """Notify user of executed trade"""
        side_emoji = "🟢" if trade.get("side") == "buy" else "🔴"
        title = f"{side_emoji} Trade Executed"
        body = f"{trade.get('side', '').upper()} {trade.get('quantity')} {trade.get('symbol')} @ ${trade.get('price', 0):.2f}"
        
        return await self.send_to_user(
            user_id, title, body,
            data={"type": NotificationType.TRADE_EXECUTED.value, "trade": trade},
            notification_type=NotificationType.TRADE_EXECUTED
        )
    
    async def notify_copy_trade(self, user_id: str, trade: Dict, master_name: str):
        """Notify user of copied trade"""
        title = "📋 Trade Copied"
        body = f"Copied {master_name}: {trade.get('side', '').upper()} {trade.get('quantity')} {trade.get('symbol')}"
        
        return await self.send_to_user(
            user_id, title, body,
            data={"type": NotificationType.COPY_TRADE.value, "trade": trade, "master": master_name},
            notification_type=NotificationType.COPY_TRADE
        )
    
    async def notify_price_alert(self, user_id: str, symbol: str, price: float, alert_type: str):
        """Notify user of price alert triggered"""
        title = f"🔔 Price Alert: {symbol}"
        direction = "above" if alert_type == "above" else "below"
        body = f"{symbol} is now {direction} ${price:.2f}"
        
        return await self.send_to_user(
            user_id, title, body,
            data={"type": NotificationType.PRICE_ALERT.value, "symbol": symbol, "price": price},
            notification_type=NotificationType.PRICE_ALERT
        )
    
    async def notify_agent_signal(self, user_id: str, agent: Dict, signal: Dict):
        """Notify user of AI agent signal"""
        title = f"🤖 {agent.get('name')} Signal"
        body = f"{signal.get('action', '').upper()} {signal.get('symbol')} - Confidence: {signal.get('confidence')}%"
        
        return await self.send_to_user(
            user_id, title, body,
            data={"type": NotificationType.AGENT_SIGNAL.value, "agent": agent, "signal": signal},
            notification_type=NotificationType.AGENT_SIGNAL
        )
    
    async def notify_risk_warning(self, user_id: str, warning: str, severity: str = "medium"):
        """Notify user of risk warning"""
        emoji = "🔴" if severity == "high" else "⚠️"
        title = f"{emoji} Risk Warning"
        
        return await self.send_to_user(
            user_id, title, warning,
            data={"type": NotificationType.RISK_WARNING.value, "severity": severity},
            notification_type=NotificationType.RISK_WARNING
        )
    
    def get_stats(self) -> Dict:
        """Get notification statistics"""
        return {
            **self._stats,
            "registered_devices": len(self._device_registry),
            "users_with_devices": len(self._user_devices),
        }


# Global instance
push_notification_service = PushNotificationService()
