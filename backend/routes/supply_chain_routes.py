# OracleIQTrader - Supply Chain Trading Routes
# Supply chain prediction markets, SCF instruments, port monitoring

from fastapi import APIRouter
from datetime import datetime, timezone

from modules.supply_chain import (
    get_supply_chain_markets, get_supply_chain_market, get_high_impact_events,
    buy_supply_chain_position, get_suppliers, get_supplier, get_at_risk_suppliers,
    get_ports, get_congested_ports, get_scf_instruments, get_scf_instrument,
    trade_scf_instrument, get_control_tower, get_geopolitical_risk, get_commodity_dashboard
)
from modules.supply_chain_alerts import (
    supply_chain_alert_engine, SCAlertType, SCAlertCondition, SCAlertPriority
)

supply_chain_router = APIRouter(prefix="/supply-chain", tags=["supply-chain"])


# ============ Market Routes ============

@supply_chain_router.get("/markets")
async def supply_chain_markets(event_type: str = None, region: str = None):
    """Get all supply chain prediction markets"""
    return get_supply_chain_markets(event_type, region)


@supply_chain_router.get("/market/{market_id}")
async def supply_chain_market(market_id: str):
    """Get single supply chain market"""
    return get_supply_chain_market(market_id)


@supply_chain_router.get("/high-impact")
async def high_impact_supply_events():
    """Get high-impact supply chain events"""
    return get_high_impact_events()


@supply_chain_router.post("/trade")
async def trade_supply_chain_market(data: dict):
    """Trade supply chain prediction market"""
    return buy_supply_chain_position(
        data.get("user_id", "demo_user"),
        data.get("market_id"),
        data.get("side"),
        data.get("amount", 0)
    )


# ============ Supplier Routes ============

@supply_chain_router.get("/suppliers")
async def list_suppliers(region: str = None, risk_level: str = None):
    """Get all monitored suppliers"""
    return get_suppliers(region, risk_level)


@supply_chain_router.get("/supplier/{supplier_id}")
async def get_single_supplier(supplier_id: str):
    """Get single supplier details"""
    return get_supplier(supplier_id)


@supply_chain_router.get("/suppliers/at-risk")
async def at_risk_suppliers():
    """Get suppliers above risk threshold"""
    return get_at_risk_suppliers()


# ============ Port Routes ============

@supply_chain_router.get("/ports")
async def list_ports(region: str = None):
    """Get all tracked ports"""
    return get_ports(region)


@supply_chain_router.get("/ports/congested")
async def congested_ports():
    """Get congested ports"""
    return get_congested_ports()


# ============ SCF Instruments ============

@supply_chain_router.get("/instruments")
async def list_scf_instruments(commodity: str = None):
    """Get all SCF derivative instruments"""
    return get_scf_instruments(commodity)


@supply_chain_router.get("/instrument/{instrument_id}")
async def get_single_scf_instrument(instrument_id: str):
    """Get single SCF instrument"""
    return get_scf_instrument(instrument_id)


@supply_chain_router.post("/instrument/trade")
async def trade_scf(data: dict):
    """Trade SCF derivative instrument"""
    return trade_scf_instrument(
        data.get("user_id", "demo_user"),
        data.get("instrument_id"),
        data.get("side"),
        data.get("quantity", 0)
    )


# ============ Dashboard Routes ============

@supply_chain_router.get("/control-tower")
async def control_tower_summary():
    """Get supply chain control tower overview"""
    return get_control_tower()


@supply_chain_router.get("/geopolitical-risk")
async def geopolitical_risk_index():
    """Get geopolitical risk index"""
    return get_geopolitical_risk()


@supply_chain_router.get("/commodity/{commodity}")
async def commodity_risk_dashboard(commodity: str):
    """Get risk dashboard for specific commodity"""
    return get_commodity_dashboard(commodity)


# ============ Alert Routes ============

@supply_chain_router.get("/alerts/presets")
async def get_alert_presets():
    """Get preset alert configurations for quick setup"""
    return supply_chain_alert_engine.get_preset_alerts()


@supply_chain_router.get("/alerts")
async def get_user_sc_alerts(user_id: str = "demo_user"):
    """Get all supply chain alerts for a user"""
    alerts = supply_chain_alert_engine.get_user_alerts(user_id)
    return [a.model_dump() for a in alerts]


@supply_chain_router.post("/alerts")
async def create_sc_alert(data: dict):
    """Create a new supply chain alert"""
    try:
        alert = supply_chain_alert_engine.create_alert(
            user_id=data.get("user_id", "demo_user"),
            alert_type=SCAlertType(data.get("alert_type")),
            target_entity=data.get("target_entity"),
            entity_name=data.get("entity_name"),
            condition=SCAlertCondition(data.get("condition")),
            threshold=float(data.get("threshold")),
            priority=SCAlertPriority(data.get("priority", "medium")),
            notification_channels=data.get("notification_channels", ["web", "push"]),
            cooldown_minutes=data.get("cooldown_minutes", 60)
        )
        return {"success": True, "alert": alert.model_dump()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@supply_chain_router.put("/alerts/{alert_id}")
async def update_sc_alert(alert_id: str, data: dict):
    """Update an existing supply chain alert"""
    alert = supply_chain_alert_engine.update_alert(
        alert_id=alert_id,
        enabled=data.get("enabled"),
        threshold=data.get("threshold"),
        priority=SCAlertPriority(data["priority"]) if data.get("priority") else None
    )
    if alert:
        return {"success": True, "alert": alert.model_dump()}
    return {"success": False, "error": "Alert not found"}


@supply_chain_router.delete("/alerts/{alert_id}")
async def delete_sc_alert(alert_id: str):
    """Delete a supply chain alert"""
    success = supply_chain_alert_engine.delete_alert(alert_id)
    return {"success": success}


@supply_chain_router.get("/alerts/history")
async def get_alert_history(user_id: str = "demo_user", limit: int = 50):
    """Get history of triggered alerts"""
    history = supply_chain_alert_engine.get_triggered_history(user_id, limit)
    return [h.model_dump() for h in history]


@supply_chain_router.get("/alerts/stats")
async def get_alert_stats():
    """Get alert system statistics"""
    return supply_chain_alert_engine.get_alert_stats()


@supply_chain_router.post("/alerts/check")
async def check_sc_alerts_now():
    """Manually trigger alert check against current supply chain data"""
    ports_data = get_ports()
    suppliers_data = get_suppliers()
    geo_risk = get_geopolitical_risk()
    instruments_data = get_scf_instruments()
    markets_data = get_supply_chain_markets()
    
    supply_chain_data = {
        "ports": {p["port_id"]: {"congestion_level": p.get("congestion", {}).get("level", 0)} for p in ports_data},
        "suppliers": {s["supplier_id"]: {"risk_score": s.get("risk_score", 0)} for s in suppliers_data},
        "geopolitical_risk": geo_risk,
        "commodities": {i["commodity"]: {"price": i.get("pricing", {}).get("current_price", 0)} for i in instruments_data},
        "markets": {m["market_id"]: {"yes_price": m.get("yes_price", 0)} for m in markets_data}
    }
    
    triggered = await supply_chain_alert_engine.check_alerts(supply_chain_data)
    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "alerts_checked": len(supply_chain_alert_engine.alerts),
        "alerts_triggered": len(triggered),
        "triggered": [t.model_dump() for t in triggered]
    }
