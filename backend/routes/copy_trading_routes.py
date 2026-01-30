# OracleIQTrader - Copy Trading Routes
# Social/copy trading functionality - follow master traders

from fastapi import APIRouter

from modules.copy_trading import (
    get_master_traders, get_master_trader, get_top_performers, get_trending_traders,
    start_copy_trading, stop_copy_trading, pause_copy_trading, resume_copy_trading,
    update_copy_settings, get_user_copies, get_copy_portfolio, add_funds_to_copy
)

copy_router = APIRouter(prefix="/copy", tags=["copy-trading"])


@copy_router.get("/traders")
async def list_master_traders(sort_by: str = "total_return", risk_level: str = None):
    """Get all master traders available for copying"""
    return get_master_traders(sort_by, risk_level)


@copy_router.get("/traders/top")
async def top_performing_traders(period: str = "monthly"):
    """Get top performing traders"""
    return get_top_performers(period)


@copy_router.get("/traders/trending")
async def trending_master_traders():
    """Get trending traders by follower growth"""
    return get_trending_traders()


@copy_router.get("/trader/{trader_id}")
async def get_single_master_trader(trader_id: str):
    """Get details of a single master trader"""
    return get_master_trader(trader_id)


@copy_router.post("/start")
async def start_copying(data: dict):
    """Start copying a master trader"""
    return start_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("master_trader_id"),
        data.get("amount", 0),
        data.get("settings")
    )


@copy_router.post("/stop")
async def stop_copying(data: dict):
    """Stop copying a master trader"""
    return stop_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )


@copy_router.post("/pause")
async def pause_copying(data: dict):
    """Pause copying (no new trades)"""
    return pause_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )


@copy_router.post("/resume")
async def resume_copying(data: dict):
    """Resume copying"""
    return resume_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )


@copy_router.post("/settings")
async def update_copy_trading_settings(data: dict):
    """Update copy trading settings"""
    return update_copy_settings(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id"),
        data.get("settings", {})
    )


@copy_router.get("/relationships/{user_id}")
async def get_user_copy_relationships(user_id: str):
    """Get user's copy trading relationships"""
    return get_user_copies(user_id)


@copy_router.get("/portfolio/{user_id}")
async def get_user_copy_portfolio(user_id: str):
    """Get user's copy trading portfolio summary"""
    return get_copy_portfolio(user_id)


@copy_router.post("/add-funds")
async def add_copy_funds(data: dict):
    """Add more funds to a copy relationship"""
    return add_funds_to_copy(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id"),
        data.get("amount", 0)
    )
