"""
Benzinga News Integration Module

Real-time financial news integration with Benzinga API
Provides news alerts, sentiment analysis, and market-moving news detection
"""

import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import os
import asyncio

logger = logging.getLogger(__name__)


class NewsSentiment(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class NewsImpact(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class NewsCategory(str, Enum):
    EARNINGS = "Earnings"
    REGULATORY = "Regulatory"
    MERGER = "M&A"
    CRYPTO = "Crypto"
    MACRO = "Macro"
    TECHNOLOGY = "Technology"
    COMMODITIES = "Commodities"
    ANALYST = "Analyst"
    IPO = "IPO"
    GENERAL = "General"


@dataclass
class NewsArticle:
    """Represents a news article from Benzinga"""
    id: str
    title: str
    teaser: str
    url: str
    published: datetime
    updated: datetime
    author: str
    symbols: List[str]
    channels: List[str]
    sentiment: NewsSentiment
    impact: NewsImpact
    category: NewsCategory
    source: str = "Benzinga"


class BenzingaClient:
    """
    Benzinga API Client for real-time news
    
    API Documentation: https://docs.benzinga.io/
    
    Endpoints used:
    - /api/v2/news - Get news articles
    - /api/v2.1/calendar/earnings - Earnings calendar
    - /api/v2/quoteDelayed - Delayed quotes
    """
    
    BASE_URL = "https://api.benzinga.com"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("BENZINGA_API_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)
        self._cache: Dict[str, tuple] = {}  # Simple cache with expiry
        self._cache_ttl = 60  # 1 minute cache
    
    @property
    def is_configured(self) -> bool:
        """Check if API key is configured"""
        return bool(self.api_key)
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated request to Benzinga API"""
        if not self.is_configured:
            raise ValueError("Benzinga API key not configured")
        
        url = f"{self.BASE_URL}{endpoint}"
        headers = {"Accept": "application/json"}
        params = params or {}
        params["token"] = self.api_key
        
        try:
            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Benzinga API error: {str(e)}")
            raise
    
    def _analyze_sentiment(self, article: Dict) -> NewsSentiment:
        """Analyze sentiment from article content"""
        title = article.get("title", "").lower()
        teaser = article.get("teaser", "").lower()
        text = f"{title} {teaser}"
        
        bullish_keywords = [
            "surge", "rally", "soar", "jump", "gain", "bull", "upgrade",
            "beat", "record", "growth", "profit", "buy", "outperform",
            "breakthrough", "positive", "strong"
        ]
        bearish_keywords = [
            "drop", "fall", "crash", "plunge", "decline", "bear", "downgrade",
            "miss", "loss", "weak", "sell", "underperform", "concern",
            "risk", "negative", "warning", "cut"
        ]
        
        bullish_count = sum(1 for word in bullish_keywords if word in text)
        bearish_count = sum(1 for word in bearish_keywords if word in text)
        
        if bullish_count > bearish_count + 1:
            return NewsSentiment.BULLISH
        elif bearish_count > bullish_count + 1:
            return NewsSentiment.BEARISH
        return NewsSentiment.NEUTRAL
    
    def _determine_impact(self, article: Dict) -> NewsImpact:
        """Determine news impact level"""
        title = article.get("title", "").lower()
        channels = article.get("channels", [])
        
        high_impact_keywords = [
            "breaking", "urgent", "major", "significant", "historic",
            "fed", "sec", "lawsuit", "acquisition", "merger"
        ]
        
        high_impact_channels = ["News", "Markets", "M&A", "Earnings"]
        
        if any(word in title for word in high_impact_keywords):
            return NewsImpact.HIGH
        if any(ch.get("name") in high_impact_channels for ch in channels if isinstance(ch, dict)):
            return NewsImpact.MEDIUM
        return NewsImpact.LOW
    
    def _categorize_article(self, article: Dict) -> NewsCategory:
        """Categorize article based on channels and content"""
        channels = [ch.get("name", ch) if isinstance(ch, dict) else ch 
                   for ch in article.get("channels", [])]
        title = article.get("title", "").lower()
        
        if "Earnings" in channels or "earnings" in title:
            return NewsCategory.EARNINGS
        if "M&A" in channels or "merger" in title or "acquisition" in title:
            return NewsCategory.MERGER
        if "Crypto" in channels or any(c in title for c in ["bitcoin", "crypto", "ethereum"]):
            return NewsCategory.CRYPTO
        if "IPO" in channels or "ipo" in title:
            return NewsCategory.IPO
        if "Analyst" in channels or "upgrade" in title or "downgrade" in title:
            return NewsCategory.ANALYST
        if any(word in title for word in ["fed", "interest rate", "inflation", "gdp"]):
            return NewsCategory.MACRO
        if "Technology" in channels:
            return NewsCategory.TECHNOLOGY
        if "Commodities" in channels:
            return NewsCategory.COMMODITIES
        return NewsCategory.GENERAL
    
    def _parse_article(self, article: Dict) -> NewsArticle:
        """Parse raw API response into NewsArticle"""
        return NewsArticle(
            id=str(article.get("id", "")),
            title=article.get("title", ""),
            teaser=article.get("teaser", ""),
            url=article.get("url", ""),
            published=datetime.fromisoformat(article.get("created", datetime.now().isoformat()).replace("Z", "+00:00")),
            updated=datetime.fromisoformat(article.get("updated", datetime.now().isoformat()).replace("Z", "+00:00")),
            author=article.get("author", "Unknown"),
            symbols=[s.get("name", s) if isinstance(s, dict) else s 
                    for s in article.get("stocks", [])],
            channels=[c.get("name", c) if isinstance(c, dict) else c 
                     for c in article.get("channels", [])],
            sentiment=self._analyze_sentiment(article),
            impact=self._determine_impact(article),
            category=self._categorize_article(article)
        )
    
    async def get_news(
        self,
        symbols: Optional[List[str]] = None,
        channels: Optional[List[str]] = None,
        page_size: int = 20,
        page: int = 0,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[NewsArticle]:
        """
        Fetch news articles from Benzinga
        
        Args:
            symbols: List of stock/crypto symbols to filter
            channels: List of news channels (e.g., "Earnings", "M&A")
            page_size: Number of articles per page
            page: Page number
            date_from: Start date filter
            date_to: End date filter
        
        Returns:
            List of NewsArticle objects
        """
        params = {
            "pageSize": page_size,
            "page": page,
            "displayOutput": "full"
        }
        
        if symbols:
            params["tickers"] = ",".join(symbols)
        if channels:
            params["channels"] = ",".join(channels)
        if date_from:
            params["dateFrom"] = date_from.strftime("%Y-%m-%d")
        if date_to:
            params["dateTo"] = date_to.strftime("%Y-%m-%d")
        
        try:
            response = await self._make_request("/api/v2/news", params)
            articles = response if isinstance(response, list) else response.get("data", [])
            return [self._parse_article(article) for article in articles]
        except Exception as e:
            logger.error(f"Failed to fetch news: {str(e)}")
            return []
    
    async def get_market_movers_news(self, limit: int = 10) -> List[NewsArticle]:
        """Get high-impact market-moving news"""
        articles = await self.get_news(
            channels=["News", "Markets", "M&A", "Earnings"],
            page_size=50
        )
        
        # Filter for high impact
        high_impact = [a for a in articles if a.impact == NewsImpact.HIGH]
        return high_impact[:limit]
    
    async def get_crypto_news(self, limit: int = 20) -> List[NewsArticle]:
        """Get cryptocurrency-related news"""
        return await self.get_news(
            symbols=["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE"],
            channels=["Crypto"],
            page_size=limit
        )
    
    async def get_earnings_news(self, limit: int = 20) -> List[NewsArticle]:
        """Get earnings-related news"""
        return await self.get_news(
            channels=["Earnings"],
            page_size=limit
        )
    
    async def get_symbol_news(self, symbol: str, limit: int = 10) -> List[NewsArticle]:
        """Get news for a specific symbol"""
        return await self.get_news(
            symbols=[symbol],
            page_size=limit
        )
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


class BenzingaMockClient:
    """
    Mock client for development/testing without API key
    Provides realistic simulated news data
    """
    
    def __init__(self):
        self._news_templates = [
            {
                "title": "Bitcoin ETF Sees Record Inflows as Institutional Interest Grows",
                "teaser": "Major asset managers report unprecedented demand for spot Bitcoin ETF products.",
                "symbols": ["BTC"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.HIGH,
                "category": NewsCategory.CRYPTO
            },
            {
                "title": "Federal Reserve Signals Potential Rate Pause in Upcoming Meeting",
                "teaser": "Fed officials indicate they may hold rates steady as inflation shows signs of cooling.",
                "symbols": ["SPY", "QQQ"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.HIGH,
                "category": NewsCategory.MACRO
            },
            {
                "title": "Tech Giant Beats Earnings Expectations, Shares Surge",
                "teaser": "Company reports strong quarterly results driven by AI and cloud computing growth.",
                "symbols": ["NVDA", "MSFT"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.HIGH,
                "category": NewsCategory.EARNINGS
            },
            {
                "title": "SEC Announces New Cryptocurrency Compliance Framework",
                "teaser": "Regulatory clarity expected to impact crypto markets significantly.",
                "symbols": ["BTC", "ETH"],
                "sentiment": NewsSentiment.NEUTRAL,
                "impact": NewsImpact.HIGH,
                "category": NewsCategory.REGULATORY
            },
            {
                "title": "Ethereum Network Upgrade Successfully Completed",
                "teaser": "Latest network improvement enhances scalability and reduces gas fees.",
                "symbols": ["ETH"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.MEDIUM,
                "category": NewsCategory.CRYPTO
            },
            {
                "title": "Analyst Upgrades Tesla to Buy Rating",
                "teaser": "Wall Street firm raises price target citing strong EV demand outlook.",
                "symbols": ["TSLA"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.MEDIUM,
                "category": NewsCategory.ANALYST
            },
            {
                "title": "Oil Prices Drop on Supply Concerns",
                "teaser": "Crude oil futures decline amid reports of increased production.",
                "symbols": ["USO", "XLE"],
                "sentiment": NewsSentiment.BEARISH,
                "impact": NewsImpact.MEDIUM,
                "category": NewsCategory.COMMODITIES
            },
            {
                "title": "Major Bank Announces Crypto Custody Services",
                "teaser": "Traditional financial institution enters digital asset space.",
                "symbols": ["BTC", "ETH"],
                "sentiment": NewsSentiment.BULLISH,
                "impact": NewsImpact.MEDIUM,
                "category": NewsCategory.CRYPTO
            },
        ]
    
    @property
    def is_configured(self) -> bool:
        return False  # Mock client is never "configured"
    
    async def get_news(
        self,
        symbols: Optional[List[str]] = None,
        channels: Optional[List[str]] = None,
        page_size: int = 20,
        **kwargs
    ) -> List[NewsArticle]:
        """Generate mock news articles"""
        import random
        
        articles = []
        for i, template in enumerate(self._news_templates[:page_size]):
            # Filter by symbols if provided
            if symbols and not any(s in template["symbols"] for s in symbols):
                continue
            
            article = NewsArticle(
                id=f"mock-{i}-{random.randint(1000, 9999)}",
                title=template["title"],
                teaser=template["teaser"],
                url=f"https://benzinga.com/article/{i}",
                published=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 120)),
                updated=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 5)),
                author="Benzinga Staff",
                symbols=template["symbols"],
                channels=[template["category"].value],
                sentiment=template["sentiment"],
                impact=template["impact"],
                category=template["category"],
                source="Benzinga (Mock)"
            )
            articles.append(article)
        
        return articles
    
    async def get_market_movers_news(self, limit: int = 10) -> List[NewsArticle]:
        return await self.get_news(page_size=limit)
    
    async def get_crypto_news(self, limit: int = 20) -> List[NewsArticle]:
        return await self.get_news(symbols=["BTC", "ETH"], page_size=limit)
    
    async def get_symbol_news(self, symbol: str, limit: int = 10) -> List[NewsArticle]:
        return await self.get_news(symbols=[symbol], page_size=limit)
    
    async def close(self):
        pass


def get_benzinga_client() -> BenzingaClient | BenzingaMockClient:
    """Factory function to get appropriate Benzinga client"""
    api_key = os.environ.get("BENZINGA_API_KEY")
    if api_key:
        return BenzingaClient(api_key)
    logger.warning("Benzinga API key not found, using mock client")
    return BenzingaMockClient()


# FastAPI integration
async def get_news_feed(
    symbols: Optional[List[str]] = None,
    category: Optional[str] = None,
    limit: int = 20
) -> List[Dict]:
    """Get news feed for API endpoint"""
    client = get_benzinga_client()
    
    try:
        if category == "crypto":
            articles = await client.get_crypto_news(limit)
        elif category == "earnings":
            articles = await client.get_earnings_news(limit) if hasattr(client, 'get_earnings_news') else await client.get_news(channels=["Earnings"], page_size=limit)
        elif category == "market_movers":
            articles = await client.get_market_movers_news(limit)
        elif symbols:
            articles = await client.get_news(symbols=symbols, page_size=limit)
        else:
            articles = await client.get_news(page_size=limit)
        
        return [
            {
                "id": a.id,
                "title": a.title,
                "teaser": a.teaser,
                "url": a.url,
                "published": a.published.isoformat(),
                "author": a.author,
                "symbols": a.symbols,
                "sentiment": a.sentiment.value,
                "impact": a.impact.value,
                "category": a.category.value,
                "source": a.source
            }
            for a in articles
        ]
    finally:
        await client.close()
