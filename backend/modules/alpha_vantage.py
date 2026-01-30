# OracleIQTrader - Alpha Vantage Integration
# Real stock market data: quotes, historical data, technical indicators

import httpx
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel
import os

# Alpha Vantage API Key
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "6CNLW423QCA3FYXZ")
AV_BASE_URL = "https://www.alphavantage.co/query"

# Rate limiting: Free tier = 25 requests/day, 5 requests/minute
REQUEST_DELAY = 12  # seconds between requests (5 req/min = 12s between)


class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    latest_trading_day: str
    previous_close: float
    open: float
    high: float
    low: float


class StockBar(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class CompanyOverview(BaseModel):
    symbol: str
    name: str
    description: str
    exchange: str
    currency: str
    sector: str
    industry: str
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    dividend_yield: Optional[float]
    eps: Optional[float]
    fifty_two_week_high: Optional[float]
    fifty_two_week_low: Optional[float]


class AlphaVantageService:
    """
    Alpha Vantage API integration for real stock market data.
    Free tier: 25 requests/day, 5 requests/minute
    """
    
    def __init__(self):
        self.api_key = ALPHA_VANTAGE_KEY
        self.base_url = AV_BASE_URL
        self._cache: Dict[str, tuple] = {}  # Simple cache with timestamps
        self._cache_ttl = 60  # Cache TTL in seconds
        self._last_request = 0
    
    async def _rate_limit(self):
        """Enforce rate limiting"""
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_request
        if elapsed < REQUEST_DELAY:
            await asyncio.sleep(REQUEST_DELAY - elapsed)
        self._last_request = asyncio.get_event_loop().time()
    
    def _get_cached(self, key: str):
        """Get cached value if still valid"""
        if key in self._cache:
            data, timestamp = self._cache[key]
            if (datetime.now(timezone.utc) - timestamp).total_seconds() < self._cache_ttl:
                return data
        return None
    
    def _set_cache(self, key: str, data):
        """Cache data with timestamp"""
        self._cache[key] = (data, datetime.now(timezone.utc))
    
    async def get_quote(self, symbol: str) -> Optional[StockQuote]:
        """
        Get real-time stock quote.
        Uses GLOBAL_QUOTE endpoint.
        """
        cache_key = f"quote:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "GLOBAL_QUOTE",
                        "symbol": symbol,
                        "apikey": self.api_key
                    },
                    timeout=30
                )
                data = response.json()
                
                if "Global Quote" not in data or not data["Global Quote"]:
                    return None
                
                q = data["Global Quote"]
                quote = StockQuote(
                    symbol=q.get("01. symbol", symbol),
                    price=float(q.get("05. price", 0)),
                    change=float(q.get("09. change", 0)),
                    change_percent=float(q.get("10. change percent", "0%").rstrip("%")),
                    volume=int(q.get("06. volume", 0)),
                    latest_trading_day=q.get("07. latest trading day", ""),
                    previous_close=float(q.get("08. previous close", 0)),
                    open=float(q.get("02. open", 0)),
                    high=float(q.get("03. high", 0)),
                    low=float(q.get("04. low", 0))
                )
                
                self._set_cache(cache_key, quote)
                return quote
                
        except Exception as e:
            print(f"Alpha Vantage quote error for {symbol}: {e}")
            return None
    
    async def get_intraday(self, symbol: str, interval: str = "5min") -> List[StockBar]:
        """
        Get intraday time series data.
        Intervals: 1min, 5min, 15min, 30min, 60min
        """
        cache_key = f"intraday:{symbol}:{interval}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "TIME_SERIES_INTRADAY",
                        "symbol": symbol,
                        "interval": interval,
                        "apikey": self.api_key,
                        "outputsize": "compact"  # Last 100 data points
                    },
                    timeout=30
                )
                data = response.json()
                
                key = f"Time Series ({interval})"
                if key not in data:
                    return []
                
                bars = []
                for timestamp, values in list(data[key].items())[:100]:
                    bars.append(StockBar(
                        timestamp=timestamp,
                        open=float(values["1. open"]),
                        high=float(values["2. high"]),
                        low=float(values["3. low"]),
                        close=float(values["4. close"]),
                        volume=int(values["5. volume"])
                    ))
                
                bars.reverse()  # Oldest first
                self._set_cache(cache_key, bars)
                return bars
                
        except Exception as e:
            print(f"Alpha Vantage intraday error for {symbol}: {e}")
            return []
    
    async def get_daily(self, symbol: str, days: int = 100) -> List[StockBar]:
        """
        Get daily time series data.
        """
        cache_key = f"daily:{symbol}:{days}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "TIME_SERIES_DAILY",
                        "symbol": symbol,
                        "apikey": self.api_key,
                        "outputsize": "compact" if days <= 100 else "full"
                    },
                    timeout=30
                )
                data = response.json()
                
                if "Time Series (Daily)" not in data:
                    return []
                
                bars = []
                for timestamp, values in list(data["Time Series (Daily)"].items())[:days]:
                    bars.append(StockBar(
                        timestamp=timestamp,
                        open=float(values["1. open"]),
                        high=float(values["2. high"]),
                        low=float(values["3. low"]),
                        close=float(values["4. close"]),
                        volume=int(values["5. volume"])
                    ))
                
                bars.reverse()  # Oldest first
                self._set_cache(cache_key, bars)
                return bars
                
        except Exception as e:
            print(f"Alpha Vantage daily error for {symbol}: {e}")
            return []
    
    async def get_company_overview(self, symbol: str) -> Optional[CompanyOverview]:
        """
        Get company fundamentals and overview.
        """
        cache_key = f"overview:{symbol}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "OVERVIEW",
                        "symbol": symbol,
                        "apikey": self.api_key
                    },
                    timeout=30
                )
                data = response.json()
                
                if not data or "Symbol" not in data:
                    return None
                
                def safe_float(val, default=None):
                    try:
                        return float(val) if val and val != "None" else default
                    except:
                        return default
                
                overview = CompanyOverview(
                    symbol=data.get("Symbol", symbol),
                    name=data.get("Name", ""),
                    description=data.get("Description", "")[:500],
                    exchange=data.get("Exchange", ""),
                    currency=data.get("Currency", "USD"),
                    sector=data.get("Sector", ""),
                    industry=data.get("Industry", ""),
                    market_cap=safe_float(data.get("MarketCapitalization")),
                    pe_ratio=safe_float(data.get("PERatio")),
                    dividend_yield=safe_float(data.get("DividendYield")),
                    eps=safe_float(data.get("EPS")),
                    fifty_two_week_high=safe_float(data.get("52WeekHigh")),
                    fifty_two_week_low=safe_float(data.get("52WeekLow"))
                )
                
                self._set_cache(cache_key, overview)
                return overview
                
        except Exception as e:
            print(f"Alpha Vantage overview error for {symbol}: {e}")
            return None
    
    async def get_rsi(self, symbol: str, interval: str = "daily", period: int = 14) -> Dict:
        """
        Get RSI (Relative Strength Index) technical indicator.
        """
        cache_key = f"rsi:{symbol}:{interval}:{period}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "RSI",
                        "symbol": symbol,
                        "interval": interval,
                        "time_period": period,
                        "series_type": "close",
                        "apikey": self.api_key
                    },
                    timeout=30
                )
                data = response.json()
                
                if "Technical Analysis: RSI" not in data:
                    return {}
                
                rsi_data = data["Technical Analysis: RSI"]
                latest = list(rsi_data.items())[0] if rsi_data else (None, None)
                
                result = {
                    "symbol": symbol,
                    "indicator": "RSI",
                    "period": period,
                    "latest_date": latest[0],
                    "latest_value": float(latest[1]["RSI"]) if latest[1] else None,
                    "history": [
                        {"date": k, "value": float(v["RSI"])}
                        for k, v in list(rsi_data.items())[:30]
                    ]
                }
                
                self._set_cache(cache_key, result)
                return result
                
        except Exception as e:
            print(f"Alpha Vantage RSI error for {symbol}: {e}")
            return {}
    
    async def search_symbols(self, keywords: str) -> List[Dict]:
        """
        Search for stock symbols by keywords.
        """
        await self._rate_limit()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "SYMBOL_SEARCH",
                        "keywords": keywords,
                        "apikey": self.api_key
                    },
                    timeout=30
                )
                data = response.json()
                
                if "bestMatches" not in data:
                    return []
                
                return [
                    {
                        "symbol": match.get("1. symbol"),
                        "name": match.get("2. name"),
                        "type": match.get("3. type"),
                        "region": match.get("4. region"),
                        "currency": match.get("8. currency")
                    }
                    for match in data["bestMatches"]
                ]
                
        except Exception as e:
            print(f"Alpha Vantage search error: {e}")
            return []


# Global instance
alpha_vantage_service = AlphaVantageService()
