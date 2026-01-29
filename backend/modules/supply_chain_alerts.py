# OracleIQTrader - Supply Chain Alert System
# Real-time alerts for port congestion, supplier risk, and supply chain events

from datetime import datetime, timezone
from typing import Dict, List, Optional
from enum import Enum
from pydantic import BaseModel
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)


class SCAlertType(str, Enum):
    PORT_CONGESTION = "port_congestion"
    SUPPLIER_RISK = "supplier_risk"
    GEOPOLITICAL_RISK = "geopolitical_risk"
    COMMODITY_PRICE = "commodity_price"
    DELIVERY_DELAY = "delivery_delay"
    MARKET_EVENT = "market_event"


class SCAlertCondition(str, Enum):
    ABOVE = "above"
    BELOW = "below"
    EQUALS = "equals"
    CHANGE_PCT = "change_pct"


class SCAlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SupplyChainAlert(BaseModel):
    alert_id: str
    user_id: str
    alert_type: SCAlertType
    target_entity: str  # port_id, supplier_id, commodity, etc.
    entity_name: str
    condition: SCAlertCondition
    threshold: float
    current_value: Optional[float] = None
    priority: SCAlertPriority = SCAlertPriority.MEDIUM
    enabled: bool = True
    triggered: bool = False
    triggered_at: Optional[datetime] = None
    created_at: datetime
    last_checked: Optional[datetime] = None
    notification_channels: List[str] = ["web", "push"]
    cooldown_minutes: int = 60  # Don't re-trigger for this many minutes
    message_template: Optional[str] = None


class TriggeredAlert(BaseModel):
    alert_id: str
    alert_type: SCAlertType
    entity_name: str
    condition: str
    threshold: float
    current_value: float
    priority: SCAlertPriority
    message: str
    triggered_at: datetime


class SupplyChainAlertEngine:
    """Manages supply chain alerts and triggers notifications"""
    
    def __init__(self):
        self.alerts: Dict[str, SupplyChainAlert] = {}
        self.triggered_history: List[TriggeredAlert] = []
        self.websocket_connections: List = []
        
        # Default alert templates
        self.alert_templates = {
            SCAlertType.PORT_CONGESTION: "⚠️ Port Alert: {entity_name} congestion at {current_value}% (threshold: {threshold}%)",
            SCAlertType.SUPPLIER_RISK: "🏭 Supplier Alert: {entity_name} risk score {current_value} (threshold: {threshold})",
            SCAlertType.GEOPOLITICAL_RISK: "🌍 Geo Risk Alert: Global risk index at {current_value} (threshold: {threshold})",
            SCAlertType.COMMODITY_PRICE: "📈 Commodity Alert: {entity_name} price moved to ${current_value} ({condition} ${threshold})",
            SCAlertType.DELIVERY_DELAY: "🚚 Delivery Alert: {entity_name} delay at {current_value} days (threshold: {threshold} days)",
            SCAlertType.MARKET_EVENT: "📊 Market Alert: {entity_name} probability at {current_value}% (threshold: {threshold}%)",
        }
    
    def create_alert(self, user_id: str, alert_type: SCAlertType, target_entity: str,
                     entity_name: str, condition: SCAlertCondition, threshold: float,
                     priority: SCAlertPriority = SCAlertPriority.MEDIUM,
                     notification_channels: List[str] = None,
                     cooldown_minutes: int = 60) -> SupplyChainAlert:
        """Create a new supply chain alert"""
        
        alert_id = f"SCA-{uuid.uuid4().hex[:8].upper()}"
        
        alert = SupplyChainAlert(
            alert_id=alert_id,
            user_id=user_id,
            alert_type=alert_type,
            target_entity=target_entity,
            entity_name=entity_name,
            condition=condition,
            threshold=threshold,
            priority=priority,
            notification_channels=notification_channels or ["web", "push"],
            cooldown_minutes=cooldown_minutes,
            created_at=datetime.now(timezone.utc)
        )
        
        self.alerts[alert_id] = alert
        logger.info(f"Created supply chain alert: {alert_id} - {alert_type.value} for {entity_name}")
        
        return alert
    
    def get_user_alerts(self, user_id: str) -> List[SupplyChainAlert]:
        """Get all alerts for a user"""
        return [a for a in self.alerts.values() if a.user_id == user_id]
    
    def get_alert(self, alert_id: str) -> Optional[SupplyChainAlert]:
        """Get a specific alert"""
        return self.alerts.get(alert_id)
    
    def update_alert(self, alert_id: str, enabled: Optional[bool] = None,
                     threshold: Optional[float] = None, priority: Optional[SCAlertPriority] = None) -> Optional[SupplyChainAlert]:
        """Update an existing alert"""
        alert = self.alerts.get(alert_id)
        if not alert:
            return None
        
        if enabled is not None:
            alert.enabled = enabled
        if threshold is not None:
            alert.threshold = threshold
        if priority is not None:
            alert.priority = priority
        
        return alert
    
    def delete_alert(self, alert_id: str) -> bool:
        """Delete an alert"""
        if alert_id in self.alerts:
            del self.alerts[alert_id]
            return True
        return False
    
    def _check_condition(self, current_value: float, condition: SCAlertCondition, threshold: float) -> bool:
        """Check if alert condition is met"""
        if condition == SCAlertCondition.ABOVE:
            return current_value >= threshold
        elif condition == SCAlertCondition.BELOW:
            return current_value <= threshold
        elif condition == SCAlertCondition.EQUALS:
            return abs(current_value - threshold) < 0.01
        elif condition == SCAlertCondition.CHANGE_PCT:
            return abs(current_value) >= threshold
        return False
    
    def _format_message(self, alert: SupplyChainAlert, current_value: float) -> str:
        """Format alert message using template"""
        template = alert.message_template or self.alert_templates.get(
            alert.alert_type, 
            "Alert: {entity_name} value {current_value} crossed threshold {threshold}"
        )
        
        return template.format(
            entity_name=alert.entity_name,
            current_value=round(current_value, 2),
            threshold=round(alert.threshold, 2),
            condition=alert.condition.value
        )
    
    def _can_trigger(self, alert: SupplyChainAlert) -> bool:
        """Check if alert can be triggered (cooldown check)"""
        if not alert.enabled:
            return False
        
        if alert.triggered and alert.triggered_at:
            cooldown_end = alert.triggered_at.replace(tzinfo=timezone.utc) + \
                          __import__('datetime').timedelta(minutes=alert.cooldown_minutes)
            if datetime.now(timezone.utc) < cooldown_end:
                return False
        
        return True
    
    async def check_alerts(self, supply_chain_data: Dict) -> List[TriggeredAlert]:
        """Check all alerts against current supply chain data"""
        triggered = []
        now = datetime.now(timezone.utc)
        
        # Extract current values from supply chain data
        port_congestion = supply_chain_data.get("ports", {})
        supplier_risks = supply_chain_data.get("suppliers", {})
        geo_risk = supply_chain_data.get("geopolitical_risk", {})
        commodities = supply_chain_data.get("commodities", {})
        markets = supply_chain_data.get("markets", {})
        
        for alert_id, alert in list(self.alerts.items()):
            if not self._can_trigger(alert):
                continue
            
            current_value = None
            
            # Get current value based on alert type
            if alert.alert_type == SCAlertType.PORT_CONGESTION:
                port_data = port_congestion.get(alert.target_entity, {})
                current_value = port_data.get("congestion_level", 0) * 100
                
            elif alert.alert_type == SCAlertType.SUPPLIER_RISK:
                supplier_data = supplier_risks.get(alert.target_entity, {})
                current_value = supplier_data.get("risk_score", 0)
                
            elif alert.alert_type == SCAlertType.GEOPOLITICAL_RISK:
                current_value = geo_risk.get("index", 0)
                
            elif alert.alert_type == SCAlertType.COMMODITY_PRICE:
                commodity_data = commodities.get(alert.target_entity, {})
                current_value = commodity_data.get("price", 0)
                
            elif alert.alert_type == SCAlertType.MARKET_EVENT:
                market_data = markets.get(alert.target_entity, {})
                current_value = market_data.get("yes_price", 0) * 100
            
            if current_value is None:
                continue
            
            alert.current_value = current_value
            alert.last_checked = now
            
            # Check if condition is met
            if self._check_condition(current_value, alert.condition, alert.threshold):
                alert.triggered = True
                alert.triggered_at = now
                
                message = self._format_message(alert, current_value)
                
                triggered_alert = TriggeredAlert(
                    alert_id=alert_id,
                    alert_type=alert.alert_type,
                    entity_name=alert.entity_name,
                    condition=f"{alert.condition.value} {alert.threshold}",
                    threshold=alert.threshold,
                    current_value=current_value,
                    priority=alert.priority,
                    message=message,
                    triggered_at=now
                )
                
                triggered.append(triggered_alert)
                self.triggered_history.append(triggered_alert)
                
                # Keep history manageable
                if len(self.triggered_history) > 1000:
                    self.triggered_history = self.triggered_history[-500:]
                
                logger.info(f"Alert triggered: {alert_id} - {message}")
        
        return triggered
    
    def get_triggered_history(self, user_id: str = None, limit: int = 50) -> List[TriggeredAlert]:
        """Get history of triggered alerts"""
        history = self.triggered_history
        
        if user_id:
            user_alert_ids = {a.alert_id for a in self.alerts.values() if a.user_id == user_id}
            history = [h for h in history if h.alert_id in user_alert_ids]
        
        return sorted(history, key=lambda x: x.triggered_at, reverse=True)[:limit]
    
    def get_alert_stats(self) -> Dict:
        """Get alert system statistics"""
        total = len(self.alerts)
        enabled = sum(1 for a in self.alerts.values() if a.enabled)
        triggered_today = sum(1 for h in self.triggered_history 
                            if h.triggered_at.date() == datetime.now(timezone.utc).date())
        
        by_type = {}
        by_priority = {}
        
        for alert in self.alerts.values():
            by_type[alert.alert_type.value] = by_type.get(alert.alert_type.value, 0) + 1
            by_priority[alert.priority.value] = by_priority.get(alert.priority.value, 0) + 1
        
        return {
            "total_alerts": total,
            "enabled_alerts": enabled,
            "disabled_alerts": total - enabled,
            "triggered_today": triggered_today,
            "total_triggered_history": len(self.triggered_history),
            "by_type": by_type,
            "by_priority": by_priority
        }
    
    def get_preset_alerts(self) -> List[Dict]:
        """Get preset alert configurations for quick setup"""
        return [
            {
                "name": "Critical Port Congestion",
                "description": "Alert when any major port exceeds 80% congestion",
                "alert_type": SCAlertType.PORT_CONGESTION.value,
                "condition": SCAlertCondition.ABOVE.value,
                "threshold": 80,
                "priority": SCAlertPriority.HIGH.value,
                "icon": "🚢"
            },
            {
                "name": "High Supplier Risk",
                "description": "Alert when supplier risk score exceeds 70",
                "alert_type": SCAlertType.SUPPLIER_RISK.value,
                "condition": SCAlertCondition.ABOVE.value,
                "threshold": 70,
                "priority": SCAlertPriority.HIGH.value,
                "icon": "🏭"
            },
            {
                "name": "Geopolitical Risk Spike",
                "description": "Alert when global risk index exceeds 60",
                "alert_type": SCAlertType.GEOPOLITICAL_RISK.value,
                "condition": SCAlertCondition.ABOVE.value,
                "threshold": 60,
                "priority": SCAlertPriority.CRITICAL.value,
                "icon": "🌍"
            },
            {
                "name": "Commodity Price Drop",
                "description": "Alert when commodity price falls below threshold",
                "alert_type": SCAlertType.COMMODITY_PRICE.value,
                "condition": SCAlertCondition.BELOW.value,
                "threshold": 100,
                "priority": SCAlertPriority.MEDIUM.value,
                "icon": "📉"
            },
            {
                "name": "Market Event Probability",
                "description": "Alert when event probability exceeds 70%",
                "alert_type": SCAlertType.MARKET_EVENT.value,
                "condition": SCAlertCondition.ABOVE.value,
                "threshold": 70,
                "priority": SCAlertPriority.MEDIUM.value,
                "icon": "📊"
            },
            {
                "name": "Delivery Delay Warning",
                "description": "Alert when expected delay exceeds 5 days",
                "alert_type": SCAlertType.DELIVERY_DELAY.value,
                "condition": SCAlertCondition.ABOVE.value,
                "threshold": 5,
                "priority": SCAlertPriority.HIGH.value,
                "icon": "🚚"
            }
        ]


# Global instance
supply_chain_alert_engine = SupplyChainAlertEngine()
