# OracleIQTrader - Alpaca Trading Routes
# Commission-free stock trading endpoints

from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel, Field

from modules.alpaca_trading import alpaca_service

alpaca_router = APIRouter(prefix="/alpaca", tags=["alpaca-trading"])


class MarketOrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    qty: float = Field(..., gt=0)
    side: str = Field(..., pattern="^(buy|sell|BUY|SELL)$")


class LimitOrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    qty: float = Field(..., gt=0)
    side: str = Field(..., pattern="^(buy|sell|BUY|SELL)$")
    limit_price: float = Field(..., gt=0)


class StopOrderRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    qty: float = Field(..., gt=0)
    side: str = Field(..., pattern="^(buy|sell|BUY|SELL)$")
    stop_price: float = Field(..., gt=0)


# Account endpoints
@alpaca_router.get("/account")
async def get_account():
    """
    Get Alpaca account information.
    Returns buying power, cash, portfolio value, equity.
    """
    account = await alpaca_service.get_account()
    if not account:
        raise HTTPException(status_code=503, detail="Unable to fetch account info")
    return account.model_dump()


@alpaca_router.get("/status")
async def get_connection_status():
    """
    Check Alpaca API connection status.
    """
    return {
        "connected": alpaca_service.is_connected(),
        "mode": "paper" if alpaca_service.paper else "live",
        "has_credentials": bool(alpaca_service.api_key and alpaca_service.secret_key)
    }


# Position endpoints
@alpaca_router.get("/positions")
async def get_all_positions():
    """
    Get all open positions.
    """
    positions = await alpaca_service.get_positions()
    return {
        "count": len(positions),
        "positions": [p.model_dump() for p in positions]
    }


@alpaca_router.get("/positions/{symbol}")
async def get_position(symbol: str):
    """
    Get position for a specific symbol.
    """
    position = await alpaca_service.get_position(symbol.upper())
    if not position:
        raise HTTPException(status_code=404, detail=f"No position found for {symbol}")
    return position.model_dump()


@alpaca_router.delete("/positions/{symbol}")
async def close_position(symbol: str):
    """
    Close position for a specific symbol.
    """
    success = await alpaca_service.close_position(symbol.upper())
    return {"success": success, "symbol": symbol.upper()}


@alpaca_router.delete("/positions")
async def close_all_positions():
    """
    Close all open positions.
    """
    closed = await alpaca_service.close_all_positions()
    return {"success": True, "closed_count": closed}


# Order endpoints
@alpaca_router.post("/orders/market")
async def place_market_order(order: MarketOrderRequest):
    """
    Place a market order.
    Executes immediately at best available price.
    """
    result = await alpaca_service.place_market_order(
        symbol=order.symbol.upper(),
        qty=order.qty,
        side=order.side.upper()
    )
    if not result:
        raise HTTPException(status_code=400, detail="Failed to place market order")
    return result.model_dump()


@alpaca_router.post("/orders/limit")
async def place_limit_order(order: LimitOrderRequest):
    """
    Place a limit order.
    Executes only at specified price or better.
    """
    result = await alpaca_service.place_limit_order(
        symbol=order.symbol.upper(),
        qty=order.qty,
        side=order.side.upper(),
        limit_price=order.limit_price
    )
    if not result:
        raise HTTPException(status_code=400, detail="Failed to place limit order")
    return result.model_dump()


@alpaca_router.post("/orders/stop")
async def place_stop_order(order: StopOrderRequest):
    """
    Place a stop order.
    Becomes a market order when stop price is reached.
    """
    result = await alpaca_service.place_stop_order(
        symbol=order.symbol.upper(),
        qty=order.qty,
        side=order.side.upper(),
        stop_price=order.stop_price
    )
    if not result:
        raise HTTPException(status_code=400, detail="Failed to place stop order")
    return result.model_dump()


@alpaca_router.get("/orders")
async def get_orders(status: str = "open"):
    """
    Get orders by status.
    Status: open, closed, all
    """
    orders = await alpaca_service.get_orders(status)
    return {
        "status_filter": status,
        "count": len(orders),
        "orders": [o.model_dump() for o in orders]
    }


@alpaca_router.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    """
    Cancel an order by ID.
    """
    success = await alpaca_service.cancel_order(order_id)
    return {"success": success, "order_id": order_id}


@alpaca_router.delete("/orders")
async def cancel_all_orders():
    """
    Cancel all open orders.
    """
    cancelled = await alpaca_service.cancel_all_orders()
    return {"success": True, "cancelled_count": cancelled}


# Historical data endpoints
@alpaca_router.get("/bars/{symbol}")
async def get_historical_bars(symbol: str, timeframe: str = "1Day", limit: int = 100):
    """
    Get historical price bars.
    Timeframes: 1Min, 5Min, 15Min, 1Hour, 1Day, 1Week
    """
    bars = await alpaca_service.get_bars(symbol.upper(), timeframe, limit)
    return {
        "symbol": symbol.upper(),
        "timeframe": timeframe,
        "count": len(bars),
        "bars": bars
    }
