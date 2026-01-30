# OracleIQTrader - Price Alert Routes
# Price alert management and notifications

from fastapi import APIRouter, Request, HTTPException
from typing import List, Optional
from datetime import datetime


alert_router = APIRouter(prefix="/alerts", tags=["alerts"])

# These will be set during initialization
_db = None
_alert_manager = None
_get_current_user = None
_fetch_coingecko_prices = None
_generate_stock_price = None
_COINGECKO_IDS = None
_STOCK_SYMBOLS = None
_PriceAlert = None
_PriceAlertCreate = None


def init_alert_routes(db, alert_manager, get_current_user, fetch_coingecko_prices, 
                      generate_stock_price, COINGECKO_IDS, STOCK_SYMBOLS, 
                      PriceAlert, PriceAlertCreate):
    """Initialize alert routes with dependencies"""
    global _db, _alert_manager, _get_current_user, _fetch_coingecko_prices
    global _generate_stock_price, _COINGECKO_IDS, _STOCK_SYMBOLS, _PriceAlert, _PriceAlertCreate
    
    _db = db
    _alert_manager = alert_manager
    _get_current_user = get_current_user
    _fetch_coingecko_prices = fetch_coingecko_prices
    _generate_stock_price = generate_stock_price
    _COINGECKO_IDS = COINGECKO_IDS
    _STOCK_SYMBOLS = STOCK_SYMBOLS
    _PriceAlert = PriceAlert
    _PriceAlertCreate = PriceAlertCreate


@alert_router.post("")
async def create_price_alert(alert_data: dict, request: Request):
    """Create a new price alert"""
    user = await _get_current_user(request)
    
    # Get current price
    symbol = alert_data.get("symbol", "").upper()
    current_price = 0
    if symbol in _COINGECKO_IDS:
        crypto_prices = await _fetch_coingecko_prices()
        if symbol in crypto_prices:
            current_price = crypto_prices[symbol].price
    elif symbol in _STOCK_SYMBOLS:
        current_price = _generate_stock_price(symbol).price
    
    alert = _PriceAlert(
        user_id=user.user_id if user else None,
        symbol=symbol,
        condition=alert_data.get("condition", "above").lower(),
        target_price=alert_data.get("target_price", 0),
        current_price=current_price
    )
    
    await _alert_manager.add_alert(alert)
    return alert.model_dump()


@alert_router.get("")
async def get_price_alerts(request: Request, include_triggered: bool = False):
    """Get all price alerts"""
    user = await _get_current_user(request)
    
    query = {"triggered": False} if not include_triggered else {}
    if user:
        query["user_id"] = user.user_id
    
    alerts = await _db.price_alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
        if alert.get('triggered_at') and isinstance(alert['triggered_at'], str):
            alert['triggered_at'] = datetime.fromisoformat(alert['triggered_at'])
    
    return alerts


@alert_router.delete("/{alert_id}")
async def delete_price_alert(alert_id: str):
    """Delete a price alert"""
    await _alert_manager.remove_alert(alert_id)
    return {"message": "Alert deleted", "id": alert_id}


# Crawler routes (related to alerts/signals)
crawler_router = APIRouter(prefix="/crawler", tags=["crawler"])


def init_crawler_routes(db):
    """Initialize crawler routes with database"""
    global _db
    _db = db


@crawler_router.get("/signals")
async def get_crawler_signals(limit: int = 50, signal_type: Optional[str] = None):
    """Get recent crawler signals"""
    query = {}
    if signal_type:
        query["signal_type"] = signal_type
    
    signals = await _db.crawler_signals.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return signals


@crawler_router.get("/whales")
async def get_whale_transactions(limit: int = 20):
    """Get recent whale transactions"""
    signals = await _db.crawler_signals.find(
        {"signal_type": "whale"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals


@crawler_router.get("/news")
async def get_news_signals(limit: int = 20):
    """Get recent news signals"""
    signals = await _db.crawler_signals.find(
        {"signal_type": "news"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals


@crawler_router.get("/social")
async def get_social_signals(limit: int = 20):
    """Get recent social media signals"""
    signals = await _db.crawler_signals.find(
        {"signal_type": "social"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals


@crawler_router.get("/orderbook")
async def get_orderbook_signals(limit: int = 20):
    """Get recent order book signals"""
    signals = await _db.crawler_signals.find(
        {"signal_type": "orderbook"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals
