# OracleIQTrader - Alpha Vantage Routes
# Real stock market data endpoints

from fastapi import APIRouter, HTTPException
from typing import Optional

from modules.alpha_vantage import alpha_vantage_service

alpha_vantage_router = APIRouter(prefix="/stocks", tags=["stocks"])


@alpha_vantage_router.get("/quote/{symbol}")
async def get_stock_quote(symbol: str):
    """
    Get real-time stock quote from Alpha Vantage.
    Returns current price, change, volume, and more.
    """
    quote = await alpha_vantage_service.get_quote(symbol.upper())
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote not found for {symbol}")
    return quote.model_dump()


@alpha_vantage_router.get("/intraday/{symbol}")
async def get_intraday_data(symbol: str, interval: str = "5min"):
    """
    Get intraday time series data.
    Intervals: 1min, 5min, 15min, 30min, 60min
    """
    bars = await alpha_vantage_service.get_intraday(symbol.upper(), interval)
    return {
        "symbol": symbol.upper(),
        "interval": interval,
        "count": len(bars),
        "bars": [b.model_dump() for b in bars]
    }


@alpha_vantage_router.get("/daily/{symbol}")
async def get_daily_data(symbol: str, days: int = 100):
    """
    Get daily time series data.
    """
    bars = await alpha_vantage_service.get_daily(symbol.upper(), days)
    return {
        "symbol": symbol.upper(),
        "timeframe": "daily",
        "count": len(bars),
        "bars": [b.model_dump() for b in bars]
    }


@alpha_vantage_router.get("/overview/{symbol}")
async def get_company_overview(symbol: str):
    """
    Get company fundamentals and overview.
    Includes market cap, P/E ratio, sector, industry, etc.
    """
    overview = await alpha_vantage_service.get_company_overview(symbol.upper())
    if not overview:
        raise HTTPException(status_code=404, detail=f"Company overview not found for {symbol}")
    return overview.model_dump()


@alpha_vantage_router.get("/rsi/{symbol}")
async def get_rsi_indicator(symbol: str, interval: str = "daily", period: int = 14):
    """
    Get RSI (Relative Strength Index) technical indicator.
    """
    rsi_data = await alpha_vantage_service.get_rsi(symbol.upper(), interval, period)
    if not rsi_data:
        raise HTTPException(status_code=404, detail=f"RSI data not found for {symbol}")
    return rsi_data


@alpha_vantage_router.get("/search")
async def search_symbols(keywords: str):
    """
    Search for stock symbols by keywords.
    """
    if not keywords or len(keywords) < 1:
        raise HTTPException(status_code=400, detail="Keywords required")
    
    results = await alpha_vantage_service.search_symbols(keywords)
    return {
        "keywords": keywords,
        "count": len(results),
        "results": results
    }


@alpha_vantage_router.get("/batch")
async def get_batch_quotes(symbols: str):
    """
    Get quotes for multiple symbols (comma-separated).
    Limited to 5 symbols due to rate limiting.
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",")][:5]
    
    quotes = []
    for symbol in symbol_list:
        quote = await alpha_vantage_service.get_quote(symbol)
        if quote:
            quotes.append(quote.model_dump())
    
    return {
        "requested": symbol_list,
        "count": len(quotes),
        "quotes": quotes
    }
