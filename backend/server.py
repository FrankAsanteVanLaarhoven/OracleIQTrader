from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Request, Response, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import asyncio
import httpx
import json
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Cognitive Oracle Trading Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class MarketData(BaseModel):
    symbol: str
    name: str
    price: float
    change_24h: float
    change_percent: float
    volume: float
    high_24h: float
    low_24h: float
    market_cap: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = "simulated"

class AgentVote(BaseModel):
    agent_name: str
    vote: str
    confidence: float
    reasoning: str

class ConsensusRequest(BaseModel):
    action: str
    symbol: str
    quantity: int
    current_price: float
    market_context: Optional[str] = None

class ConsensusResponse(BaseModel):
    request_id: str
    action: str
    symbol: str
    quantity: int
    agents: List[AgentVote]
    final_decision: str
    overall_confidence: float
    timestamp: datetime

class OracleQuery(BaseModel):
    query_type: str
    symbol: Optional[str] = None
    action: Optional[str] = None
    context: Optional[str] = None

class OracleMemory(BaseModel):
    similar_instances: int
    success_rate: float
    avg_pnl: float
    risk_level: str
    recommendation: str
    historical_data: List[Dict[str, Any]]

class VoiceCommand(BaseModel):
    transcript: str
    confidence: float

class ParsedCommand(BaseModel):
    action: str
    symbol: Optional[str] = None
    quantity: Optional[int] = None
    price_type: str = "market"
    confidence: float
    raw_transcript: str

class TradeExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    action: str
    symbol: str
    quantity: int
    price: float
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    consensus_confidence: float

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ P4 MODELS ============

class PriceAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    symbol: str
    condition: str  # "above" or "below"
    target_price: float
    current_price: float = 0
    triggered: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    triggered_at: Optional[datetime] = None

class PriceAlertCreate(BaseModel):
    symbol: str
    condition: str
    target_price: float

class WhaleTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    blockchain: str
    from_address: str
    to_address: str
    amount: float
    symbol: str
    usd_value: float
    timestamp: datetime
    tx_hash: str
    exchange_flow: Optional[str] = None  # "inflow", "outflow", or None

class NewsItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    source: str
    url: str
    sentiment: str  # "bullish", "bearish", "neutral"
    impact: str  # "high", "medium", "low"
    symbols: List[str]
    timestamp: datetime
    summary: Optional[str] = None

class SocialSignal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str  # "twitter", "reddit"
    content: str
    author: str
    sentiment: str
    symbols: List[str]
    engagement: int
    timestamp: datetime
    url: str

class OrderBookSignal(BaseModel):
    symbol: str
    exchange: str
    bid_volume: float
    ask_volume: float
    large_orders: List[Dict[str, Any]]
    imbalance: float  # positive = more bids, negative = more asks
    timestamp: datetime

class CrawlerSignal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    signal_type: str  # "whale", "news", "social", "orderbook"
    urgency: str  # "critical", "high", "medium", "low"
    symbol: str
    message: str
    data: Dict[str, Any]
    timestamp: datetime
    action_suggested: Optional[str] = None

# ============ COINGECKO INTEGRATION ============

COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XRP": "ripple",
    "DOGE": "dogecoin",
    "ADA": "cardano",
}

# Stock symbols (simulated)
STOCK_SYMBOLS = {
    "SPY": {"name": "S&P 500 ETF", "base_price": 598, "volatility": 0.008},
    "AAPL": {"name": "Apple Inc.", "base_price": 248, "volatility": 0.015},
    "NVDA": {"name": "NVIDIA", "base_price": 145, "volatility": 0.03},
    "TSLA": {"name": "Tesla", "base_price": 412, "volatility": 0.035},
    "MSFT": {"name": "Microsoft", "base_price": 420, "volatility": 0.012},
    "GOOGL": {"name": "Alphabet", "base_price": 175, "volatility": 0.018},
}

# Cache for CoinGecko data
price_cache: Dict[str, Any] = {}
cache_timestamp: Optional[datetime] = None
CACHE_TTL = 30  # seconds

async def fetch_coingecko_prices() -> Dict[str, MarketData]:
    """Fetch real prices from CoinGecko API"""
    global price_cache, cache_timestamp
    
    # Check cache
    if cache_timestamp and (datetime.now(timezone.utc) - cache_timestamp).seconds < CACHE_TTL:
        return price_cache
    
    try:
        coin_ids = ",".join(COINGECKO_IDS.values())
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                
                result = {}
                for symbol, coin_id in COINGECKO_IDS.items():
                    if coin_id in data:
                        coin_data = data[coin_id]
                        price = coin_data.get('usd', 0)
                        change_percent = coin_data.get('usd_24h_change', 0) or 0
                        
                        result[symbol] = MarketData(
                            symbol=symbol,
                            name=coin_id.capitalize(),
                            price=round(price, 2),
                            change_24h=round(price * change_percent / 100, 2),
                            change_percent=round(change_percent, 2),
                            volume=coin_data.get('usd_24h_vol', 0) or 0,
                            high_24h=round(price * 1.02, 2),
                            low_24h=round(price * 0.98, 2),
                            market_cap=coin_data.get('usd_market_cap', 0),
                            source="coingecko"
                        )
                
                price_cache = result
                cache_timestamp = datetime.now(timezone.utc)
                logger.info("CoinGecko prices fetched successfully")
                return result
            else:
                logger.warning(f"CoinGecko API returned {response.status_code}")
    except Exception as e:
        logger.error(f"CoinGecko API error: {e}")
    
    # Return cached data or empty dict on error
    return price_cache if price_cache else {}

def generate_stock_price(symbol: str) -> MarketData:
    """Generate simulated stock data"""
    if symbol not in STOCK_SYMBOLS:
        raise ValueError(f"Unknown stock symbol: {symbol}")
    
    config = STOCK_SYMBOLS[symbol]
    base = config["base_price"]
    vol = config["volatility"]
    
    change_percent = random.uniform(-vol * 100, vol * 100)
    price = base * (1 + change_percent / 100)
    
    return MarketData(
        symbol=symbol,
        name=config["name"],
        price=round(price, 2),
        change_24h=round(price - base, 2),
        change_percent=round(change_percent, 2),
        volume=round(random.uniform(1e9, 50e9), 0),
        high_24h=round(price * 1.02, 2),
        low_24h=round(price * 0.98, 2),
        source="simulated"
    )

# ============ WEBSOCKET CONNECTIONS ============

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

# ============ ALERT MANAGER ============

class AlertManager:
    """Manages price alerts and triggers notifications via WebSocket"""
    def __init__(self):
        self.alerts: Dict[str, PriceAlert] = {}
        self.alert_connections: List[WebSocket] = []
    
    async def connect_alert_ws(self, websocket: WebSocket):
        await websocket.accept()
        self.alert_connections.append(websocket)
        logger.info(f"Alert WebSocket connected. Total: {len(self.alert_connections)}")
    
    def disconnect_alert_ws(self, websocket: WebSocket):
        if websocket in self.alert_connections:
            self.alert_connections.remove(websocket)
    
    async def add_alert(self, alert: PriceAlert):
        self.alerts[alert.id] = alert
        # Also persist to database
        doc = alert.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        if doc.get('triggered_at'):
            doc['triggered_at'] = doc['triggered_at'].isoformat()
        await db.price_alerts.insert_one(doc)
        logger.info(f"Alert added: {alert.symbol} {alert.condition} ${alert.target_price}")
    
    async def remove_alert(self, alert_id: str):
        if alert_id in self.alerts:
            del self.alerts[alert_id]
        await db.price_alerts.delete_one({"id": alert_id})
    
    async def check_alerts(self, prices: Dict[str, float]):
        """Check all alerts against current prices and trigger if conditions met"""
        triggered = []
        for alert_id, alert in list(self.alerts.items()):
            if alert.triggered:
                continue
            
            current_price = prices.get(alert.symbol)
            if current_price is None:
                continue
            
            should_trigger = False
            if alert.condition == "above" and current_price >= alert.target_price:
                should_trigger = True
            elif alert.condition == "below" and current_price <= alert.target_price:
                should_trigger = True
            
            if should_trigger:
                alert.triggered = True
                alert.triggered_at = datetime.now(timezone.utc)
                alert.current_price = current_price
                triggered.append(alert)
                
                # Update in database
                await db.price_alerts.update_one(
                    {"id": alert_id},
                    {"$set": {"triggered": True, "triggered_at": alert.triggered_at.isoformat(), "current_price": current_price}}
                )
        
        # Broadcast triggered alerts
        if triggered:
            for alert in triggered:
                await self.broadcast_alert(alert)
        
        return triggered
    
    async def broadcast_alert(self, alert: PriceAlert):
        """Send alert notification to all connected clients"""
        message = {
            "type": "price_alert_triggered",
            "data": {
                "id": alert.id,
                "symbol": alert.symbol,
                "condition": alert.condition,
                "target_price": alert.target_price,
                "current_price": alert.current_price,
                "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None
            }
        }
        
        for conn in self.alert_connections:
            try:
                await conn.send_json(message)
            except Exception as e:
                logger.error(f"Error sending alert: {e}")
        
        # Also broadcast to main WebSocket
        await manager.broadcast(message)
    
    async def load_alerts_from_db(self):
        """Load pending alerts from database on startup"""
        alerts = await db.price_alerts.find({"triggered": False}, {"_id": 0}).to_list(1000)
        for alert_doc in alerts:
            if isinstance(alert_doc.get('created_at'), str):
                alert_doc['created_at'] = datetime.fromisoformat(alert_doc['created_at'])
            self.alerts[alert_doc['id']] = PriceAlert(**alert_doc)
        logger.info(f"Loaded {len(self.alerts)} pending alerts from database")

alert_manager = AlertManager()

# ============ TRADE CRAWLER ============

class TradeCrawler:
    """Real-time trade signal crawler - monitors whales, news, social, orderbooks"""
    def __init__(self):
        self.signals: List[CrawlerSignal] = []
        self.crawler_connections: List[WebSocket] = []
        self.running = False
    
    async def connect_crawler_ws(self, websocket: WebSocket):
        await websocket.accept()
        self.crawler_connections.append(websocket)
        logger.info(f"Crawler WebSocket connected. Total: {len(self.crawler_connections)}")
    
    def disconnect_crawler_ws(self, websocket: WebSocket):
        if websocket in self.crawler_connections:
            self.crawler_connections.remove(websocket)
    
    async def broadcast_signal(self, signal: CrawlerSignal):
        """Broadcast crawler signal to all connected clients"""
        message = {
            "type": "crawler_signal",
            "data": signal.model_dump()
        }
        message['data']['timestamp'] = message['data']['timestamp'].isoformat()
        
        for conn in self.crawler_connections:
            try:
                await conn.send_json(message)
            except Exception as e:
                logger.error(f"Error sending crawler signal: {e}")
        
        # Also broadcast to main WebSocket
        await manager.broadcast(message)
    
    async def fetch_whale_transactions(self) -> List[WhaleTransaction]:
        """Fetch large whale transactions from blockchain APIs"""
        try:
            # Using Whale Alert API simulation (in production, use real API)
            # Real API: https://api.whale-alert.io/v1/transactions
            
            # Simulate whale transactions
            whales = []
            symbols = ["BTC", "ETH", "SOL"]
            
            for symbol in symbols:
                if random.random() > 0.7:  # 30% chance of whale activity
                    amount = random.uniform(100, 5000) if symbol == "BTC" else random.uniform(1000, 50000)
                    price_map = {"BTC": 90000, "ETH": 3000, "SOL": 130}
                    
                    whale = WhaleTransaction(
                        blockchain={"BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana"}[symbol],
                        from_address=f"0x{uuid.uuid4().hex[:40]}",
                        to_address=f"0x{uuid.uuid4().hex[:40]}",
                        amount=round(amount, 4),
                        symbol=symbol,
                        usd_value=round(amount * price_map[symbol], 2),
                        timestamp=datetime.now(timezone.utc),
                        tx_hash=f"0x{uuid.uuid4().hex}",
                        exchange_flow=random.choice(["inflow", "outflow", None])
                    )
                    whales.append(whale)
            
            return whales
        except Exception as e:
            logger.error(f"Whale fetch error: {e}")
            return []
    
    async def fetch_news_headlines(self) -> List[NewsItem]:
        """Fetch latest crypto news headlines"""
        try:
            # In production, use real news APIs like CryptoPanic, NewsAPI, etc.
            # Simulating news for demo
            
            news_templates = [
                {"title": "Bitcoin breaks ${price} resistance, analysts bullish", "sentiment": "bullish", "impact": "high", "symbols": ["BTC"]},
                {"title": "Ethereum 2.0 staking reaches new all-time high", "sentiment": "bullish", "impact": "medium", "symbols": ["ETH"]},
                {"title": "SEC announces new crypto regulation framework", "sentiment": "bearish", "impact": "high", "symbols": ["BTC", "ETH", "SOL"]},
                {"title": "Major institution adds Bitcoin to treasury", "sentiment": "bullish", "impact": "high", "symbols": ["BTC"]},
                {"title": "Solana network experiences brief congestion", "sentiment": "bearish", "impact": "medium", "symbols": ["SOL"]},
                {"title": "DeFi TVL surges past $50B milestone", "sentiment": "bullish", "impact": "medium", "symbols": ["ETH", "SOL"]},
                {"title": "Crypto exchange reports record trading volume", "sentiment": "bullish", "impact": "low", "symbols": ["BTC", "ETH"]},
                {"title": "Federal Reserve hints at rate pause", "sentiment": "bullish", "impact": "high", "symbols": ["BTC", "ETH", "SPY"]},
            ]
            
            news_items = []
            if random.random() > 0.6:  # 40% chance of new news
                template = random.choice(news_templates)
                news_items.append(NewsItem(
                    title=template["title"].replace("${price}", str(random.randint(85000, 105000))),
                    source=random.choice(["CoinDesk", "Bloomberg", "CoinTelegraph", "Reuters", "The Block"]),
                    url=f"https://news.example.com/{uuid.uuid4().hex[:8]}",
                    sentiment=template["sentiment"],
                    impact=template["impact"],
                    symbols=template["symbols"],
                    timestamp=datetime.now(timezone.utc),
                    summary="Breaking news affecting crypto markets."
                ))
            
            return news_items
        except Exception as e:
            logger.error(f"News fetch error: {e}")
            return []
    
    async def fetch_social_signals(self) -> List[SocialSignal]:
        """Fetch social media signals from Twitter/Reddit"""
        try:
            # In production, use Twitter API, Reddit API, or aggregators
            
            social_templates = [
                {"content": "🚀 $BTC looking ready for breakout! Chart pattern forming.", "platform": "twitter", "sentiment": "bullish", "symbols": ["BTC"]},
                {"content": "$ETH gas fees at yearly low - bullish for adoption", "platform": "twitter", "sentiment": "bullish", "symbols": ["ETH"]},
                {"content": "Massive whale accumulation detected on $SOL", "platform": "twitter", "sentiment": "bullish", "symbols": ["SOL"]},
                {"content": "Warning: Descending triangle forming on $BTC 4H", "platform": "twitter", "sentiment": "bearish", "symbols": ["BTC"]},
                {"content": "Just bought more $ETH - loading up before the merge anniversary", "platform": "reddit", "sentiment": "bullish", "symbols": ["ETH"]},
            ]
            
            signals = []
            if random.random() > 0.5:  # 50% chance of social signal
                template = random.choice(social_templates)
                signals.append(SocialSignal(
                    platform=template["platform"],
                    content=template["content"],
                    author=f"@crypto_{uuid.uuid4().hex[:8]}",
                    sentiment=template["sentiment"],
                    symbols=template["symbols"],
                    engagement=random.randint(100, 50000),
                    timestamp=datetime.now(timezone.utc),
                    url=f"https://{template['platform']}.com/{uuid.uuid4().hex[:10]}"
                ))
            
            return signals
        except Exception as e:
            logger.error(f"Social fetch error: {e}")
            return []
    
    async def fetch_orderbook_signals(self) -> List[OrderBookSignal]:
        """Analyze order books for large orders and imbalances"""
        try:
            signals = []
            symbols = ["BTC", "ETH", "SOL"]
            
            for symbol in symbols:
                if random.random() > 0.8:  # 20% chance of significant orderbook signal
                    bid_vol = random.uniform(1e8, 5e8)
                    ask_vol = random.uniform(1e8, 5e8)
                    imbalance = (bid_vol - ask_vol) / (bid_vol + ask_vol)
                    
                    large_orders = []
                    if abs(imbalance) > 0.1:
                        large_orders.append({
                            "side": "bid" if imbalance > 0 else "ask",
                            "size": round(random.uniform(100, 1000), 2),
                            "price": round(random.uniform(85000, 95000) if symbol == "BTC" else random.uniform(2800, 3200), 2)
                        })
                    
                    signals.append(OrderBookSignal(
                        symbol=symbol,
                        exchange=random.choice(["Binance", "Coinbase", "Kraken"]),
                        bid_volume=round(bid_vol, 2),
                        ask_volume=round(ask_vol, 2),
                        large_orders=large_orders,
                        imbalance=round(imbalance, 4),
                        timestamp=datetime.now(timezone.utc)
                    ))
            
            return signals
        except Exception as e:
            logger.error(f"Orderbook fetch error: {e}")
            return []
    
    def create_signal(self, signal_type: str, urgency: str, symbol: str, message: str, data: Dict, action: str = None) -> CrawlerSignal:
        return CrawlerSignal(
            signal_type=signal_type,
            urgency=urgency,
            symbol=symbol,
            message=message,
            data=data,
            timestamp=datetime.now(timezone.utc),
            action_suggested=action
        )

crawler = TradeCrawler()

# Background task for price streaming with alert checking
async def price_streamer():
    """Background task to stream prices to all connected clients and check alerts"""
    while True:
        try:
            # Fetch real crypto prices
            crypto_prices = await fetch_coingecko_prices()
            
            # Generate stock prices
            all_prices = []
            price_dict = {}
            
            for symbol, data in crypto_prices.items():
                all_prices.append(data.model_dump())
                price_dict[symbol] = data.price
            
            for symbol in STOCK_SYMBOLS.keys():
                stock_data = generate_stock_price(symbol)
                all_prices.append(stock_data.model_dump())
                price_dict[symbol] = stock_data.price
            
            # Check price alerts
            await alert_manager.check_alerts(price_dict)
            
            if manager.active_connections:
                # Convert datetime to ISO string for JSON
                for price in all_prices:
                    if isinstance(price.get('timestamp'), datetime):
                        price['timestamp'] = price['timestamp'].isoformat()
                
                await manager.broadcast({
                    "type": "price_update",
                    "data": all_prices,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            await asyncio.sleep(5)  # Update every 5 seconds
        except Exception as e:
            logger.error(f"Price streamer error: {e}")
            await asyncio.sleep(5)

# Background task for trade crawler
async def trade_crawler_task():
    """Background task to crawl for trade signals"""
    while True:
        try:
            # Fetch whale transactions
            whales = await crawler.fetch_whale_transactions()
            for whale in whales:
                urgency = "critical" if whale.usd_value > 10000000 else "high" if whale.usd_value > 1000000 else "medium"
                action = None
                if whale.exchange_flow == "inflow":
                    action = "POTENTIAL_SELL_PRESSURE"
                elif whale.exchange_flow == "outflow":
                    action = "POTENTIAL_ACCUMULATION"
                
                signal = crawler.create_signal(
                    signal_type="whale",
                    urgency=urgency,
                    symbol=whale.symbol,
                    message=f"🐋 Whale Alert: {whale.amount:,.2f} {whale.symbol} (${whale.usd_value:,.0f}) moved",
                    data=whale.model_dump(),
                    action=action
                )
                signal.data['timestamp'] = signal.data['timestamp'].isoformat()
                await crawler.broadcast_signal(signal)
                
                # Store in database
                doc = signal.model_dump()
                doc['timestamp'] = doc['timestamp'].isoformat()
                await db.crawler_signals.insert_one(doc)
            
            # Fetch news headlines
            news = await crawler.fetch_news_headlines()
            for item in news:
                urgency = "critical" if item.impact == "high" else "medium" if item.impact == "medium" else "low"
                action = "CONSIDER_LONG" if item.sentiment == "bullish" else "CONSIDER_SHORT" if item.sentiment == "bearish" else None
                
                signal = crawler.create_signal(
                    signal_type="news",
                    urgency=urgency,
                    symbol=item.symbols[0] if item.symbols else "MARKET",
                    message=f"📰 {item.title}",
                    data=item.model_dump(),
                    action=action
                )
                signal.data['timestamp'] = signal.data['timestamp'].isoformat()
                await crawler.broadcast_signal(signal)
                
                doc = signal.model_dump()
                doc['timestamp'] = doc['timestamp'].isoformat()
                await db.crawler_signals.insert_one(doc)
            
            # Fetch social signals
            social = await crawler.fetch_social_signals()
            for item in social:
                urgency = "high" if item.engagement > 10000 else "medium" if item.engagement > 1000 else "low"
                
                signal = crawler.create_signal(
                    signal_type="social",
                    urgency=urgency,
                    symbol=item.symbols[0] if item.symbols else "CRYPTO",
                    message=f"📱 [{item.platform.upper()}] {item.content[:100]}",
                    data=item.model_dump(),
                    action=None
                )
                signal.data['timestamp'] = signal.data['timestamp'].isoformat()
                await crawler.broadcast_signal(signal)
            
            # Fetch orderbook signals
            orderbook = await crawler.fetch_orderbook_signals()
            for item in orderbook:
                if abs(item.imbalance) > 0.15:  # Only significant imbalances
                    urgency = "high" if abs(item.imbalance) > 0.3 else "medium"
                    action = "BULLISH_PRESSURE" if item.imbalance > 0 else "BEARISH_PRESSURE"
                    
                    signal = crawler.create_signal(
                        signal_type="orderbook",
                        urgency=urgency,
                        symbol=item.symbol,
                        message=f"📊 Order book imbalance on {item.exchange}: {item.imbalance:+.1%}",
                        data=item.model_dump(),
                        action=action
                    )
                    signal.data['timestamp'] = signal.data['timestamp'].isoformat()
                    await crawler.broadcast_signal(signal)
            
            await asyncio.sleep(10)  # Check every 10 seconds
        except Exception as e:
            logger.error(f"Trade crawler error: {e}")
            await asyncio.sleep(10)

# ============ AUTHENTICATION ============

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token"""
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    # Find session in database
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authentication for protected routes"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ============ AUTH ROUTES ============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    try:
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
    except httpx.RequestError as e:
        logger.error(f"Auth API error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    # Create or update user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create session
    session_token = user_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user for response
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user_doc,
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}

# ============ MARKET DATA ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Cognitive Oracle Trading Platform API", "version": "2.0.0"}

@api_router.get("/market/prices", response_model=List[MarketData])
async def get_all_market_prices():
    """Get current prices for all tracked symbols"""
    prices = []
    
    # Fetch real crypto prices
    crypto_prices = await fetch_coingecko_prices()
    prices.extend(crypto_prices.values())
    
    # Add stock prices
    for symbol in STOCK_SYMBOLS.keys():
        prices.append(generate_stock_price(symbol))
    
    return prices

@api_router.get("/market/{symbol}", response_model=MarketData)
async def get_market_price(symbol: str):
    """Get current price for a specific symbol"""
    symbol = symbol.upper()
    
    # Check if it's a crypto
    if symbol in COINGECKO_IDS:
        crypto_prices = await fetch_coingecko_prices()
        if symbol in crypto_prices:
            return crypto_prices[symbol]
        # Fallback with simulated crypto price
        base_prices = {"BTC": 90000, "ETH": 3000, "SOL": 130, "XRP": 2, "DOGE": 0.3, "ADA": 0.8}
        return MarketData(
            symbol=symbol,
            name=COINGECKO_IDS[symbol].capitalize(),
            price=base_prices.get(symbol, 100),
            change_24h=0,
            change_percent=round(random.uniform(-2, 2), 2),
            volume=round(random.uniform(1e9, 10e9), 0),
            high_24h=base_prices.get(symbol, 100) * 1.02,
            low_24h=base_prices.get(symbol, 100) * 0.98,
            source="fallback"
        )
    
    # Check if it's a stock
    if symbol in STOCK_SYMBOLS:
        return generate_stock_price(symbol)
    
    raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

@api_router.get("/market/{symbol}/history")
async def get_price_history(symbol: str, periods: int = 50):
    """Get historical price data for charting"""
    symbol = symbol.upper()
    
    # Get base price
    if symbol in COINGECKO_IDS:
        crypto_prices = await fetch_coingecko_prices()
        if symbol in crypto_prices:
            base = crypto_prices[symbol].price
            vol = 0.02
        else:
            base = 100000
            vol = 0.02
    elif symbol in STOCK_SYMBOLS:
        config = STOCK_SYMBOLS[symbol]
        base = config["base_price"]
        vol = config["volatility"]
    else:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    history = []
    current_price = base * 0.95  # Start a bit lower
    
    for i in range(periods):
        change = random.uniform(-vol, vol)
        current_price = current_price * (1 + change)
        
        high = current_price * (1 + random.uniform(0.001, 0.015))
        low = current_price * (1 - random.uniform(0.001, 0.015))
        open_price = current_price * (1 + random.uniform(-0.008, 0.008))
        
        history.append({
            "time": i,
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(current_price, 2),
            "volume": round(random.uniform(1e6, 10e6), 0)
        })
    
    return history

# ============ AI AGENT ROUTES ============

async def get_agent_consensus(request: ConsensusRequest) -> ConsensusResponse:
    """Multi-agent consensus using GPT-5.2"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return await simulate_agent_consensus(request)
        
        agents_config = [
            {"name": "Data Analyst", "role": "quantitative analyst focusing on technical indicators", "focus": "technical analysis"},
            {"name": "Risk Manager", "role": "risk manager evaluating position sizing and exposure", "focus": "risk assessment"},
            {"name": "Strategist", "role": "trading strategist considering macro factors", "focus": "strategic alignment"},
        ]
        
        agents_votes = []
        
        for agent in agents_config:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"agent-{agent['name']}-{uuid.uuid4()}",
                system_message=f"You are a {agent['role']}. Respond ONLY with valid JSON: {{\"vote\": \"approve\"/\"reject\"/\"neutral\", \"confidence\": 0.0-1.0, \"reasoning\": \"brief explanation\"}}"
            ).with_model("openai", "gpt-5.2")
            
            prompt = f"Analyze: {request.action} {request.quantity} shares of {request.symbol} at ${request.current_price}. Context: {request.market_context or 'Standard conditions'}"
            
            try:
                response = await chat.send_message(UserMessage(text=prompt))
                response_text = response.strip()
                if "```" in response_text:
                    response_text = response_text.split("```")[1].replace("json", "").strip()
                
                parsed = json.loads(response_text)
                agents_votes.append(AgentVote(
                    agent_name=agent["name"],
                    vote=parsed.get("vote", "neutral"),
                    confidence=float(parsed.get("confidence", 0.7)),
                    reasoning=parsed.get("reasoning", "Analysis complete")
                ))
            except:
                agents_votes.append(AgentVote(
                    agent_name=agent["name"],
                    vote="approve" if random.random() > 0.3 else "neutral",
                    confidence=round(0.7 + random.random() * 0.25, 2),
                    reasoning="Technical analysis suggests favorable conditions"
                ))
        
        approve_count = sum(1 for a in agents_votes if a.vote == "approve")
        avg_confidence = sum(a.confidence for a in agents_votes) / len(agents_votes)
        
        final_decision = "RECOMMEND EXECUTION" if approve_count >= 2 else "REVIEW REQUIRED"
        
        return ConsensusResponse(
            request_id=str(uuid.uuid4()),
            action=request.action,
            symbol=request.symbol,
            quantity=request.quantity,
            agents=agents_votes,
            final_decision=final_decision,
            overall_confidence=round(avg_confidence, 2),
            timestamp=datetime.now(timezone.utc)
        )
    except Exception as e:
        logger.error(f"Agent consensus error: {e}")
        return await simulate_agent_consensus(request)

async def simulate_agent_consensus(request: ConsensusRequest) -> ConsensusResponse:
    """Fallback simulated consensus"""
    agents = [
        AgentVote(agent_name="Data Analyst", vote="approve", confidence=round(0.75 + random.random() * 0.2, 2), reasoning="Technical indicators positive. RSI at 58, MACD bullish."),
        AgentVote(agent_name="Risk Manager", vote=random.choice(["approve", "neutral"]), confidence=round(0.7 + random.random() * 0.2, 2), reasoning="Position size within parameters. Exposure at 12%."),
        AgentVote(agent_name="Strategist", vote="approve", confidence=round(0.75 + random.random() * 0.18, 2), reasoning="Aligned with market thesis. Sector rotation favorable."),
    ]
    
    approve_count = sum(1 for a in agents if a.vote == "approve")
    avg_confidence = sum(a.confidence for a in agents) / len(agents)
    
    return ConsensusResponse(
        request_id=str(uuid.uuid4()),
        action=request.action,
        symbol=request.symbol,
        quantity=request.quantity,
        agents=agents,
        final_decision="RECOMMEND EXECUTION" if approve_count >= 2 else "REVIEW REQUIRED",
        overall_confidence=round(avg_confidence, 2),
        timestamp=datetime.now(timezone.utc)
    )

@api_router.post("/agents/consensus", response_model=ConsensusResponse)
async def request_consensus(request: ConsensusRequest):
    return await get_agent_consensus(request)

# ============ ORACLE ROUTES ============

@api_router.post("/oracle/query", response_model=OracleMemory)
async def query_oracle(query: OracleQuery):
    success_rate = random.uniform(0.65, 0.85)
    avg_pnl = random.uniform(2000, 8000)
    
    return OracleMemory(
        similar_instances=random.randint(3, 12),
        success_rate=round(success_rate * 100, 1),
        avg_pnl=round(avg_pnl, 2),
        risk_level=random.choice(["LOW", "MODERATE", "ELEVATED"]),
        recommendation=f"Historical data suggests {'favorable' if success_rate > 0.7 else 'cautious'} conditions.",
        historical_data=[
            {"date": "2024-11-15", "result": "profitable", "pnl": round(random.uniform(1000, 5000), 2)},
            {"date": "2024-10-22", "result": "profitable", "pnl": round(random.uniform(2000, 6000), 2)},
            {"date": "2024-09-08", "result": "loss", "pnl": round(-random.uniform(500, 2000), 2)},
        ]
    )

# ============ VOICE ROUTES ============

@api_router.post("/voice/parse", response_model=ParsedCommand)
async def parse_voice_command(command: VoiceCommand):
    transcript = command.transcript.lower()
    action = "BUY" if "buy" in transcript else "SELL" if "sell" in transcript else "UNKNOWN"
    
    symbol = None
    all_symbols = list(COINGECKO_IDS.keys()) + list(STOCK_SYMBOLS.keys())
    for sym in all_symbols:
        if sym.lower() in transcript:
            symbol = sym
            break
    
    quantity = None
    words = transcript.split()
    for word in words:
        if word.isdigit():
            quantity = int(word)
            break
    
    return ParsedCommand(
        action=action,
        symbol=symbol,
        quantity=quantity,
        price_type="market" if "market" in transcript else "limit",
        confidence=command.confidence,
        raw_transcript=command.transcript
    )

# ============ TRADE ROUTES ============

@api_router.post("/trades/execute", response_model=TradeExecution)
async def execute_trade(action: str, symbol: str, quantity: int, request: Request):
    symbol = symbol.upper()
    
    # Get price
    if symbol in COINGECKO_IDS:
        crypto_prices = await fetch_coingecko_prices()
        price = crypto_prices.get(symbol, MarketData(symbol=symbol, name="", price=0, change_24h=0, change_percent=0, volume=0, high_24h=0, low_24h=0)).price
    elif symbol in STOCK_SYMBOLS:
        price = generate_stock_price(symbol).price
    else:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    # Get user if authenticated
    user = await get_current_user(request)
    
    trade = TradeExecution(
        user_id=user.user_id if user else None,
        action=action.upper(),
        symbol=symbol,
        quantity=quantity,
        price=price,
        status="EXECUTED",
        consensus_confidence=random.uniform(0.8, 0.95)
    )
    
    doc = trade.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.trades.insert_one(doc)
    
    return trade

@api_router.get("/trades/history", response_model=List[TradeExecution])
async def get_trade_history(request: Request, limit: int = 20):
    user = await get_current_user(request)
    
    query = {"user_id": user.user_id} if user else {}
    trades = await db.trades.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for trade in trades:
        if isinstance(trade['timestamp'], str):
            trade['timestamp'] = datetime.fromisoformat(trade['timestamp'])
    
    return trades

# ============ USER STATE ROUTES ============

@api_router.get("/user/mood")
async def get_mood_analysis():
    moods = [
        {"state": "FOCUSED", "confidence": 0.92, "recommendation": "Optimal for complex analysis"},
        {"state": "STRESSED", "confidence": 0.78, "recommendation": "Consider reducing position sizes"},
        {"state": "FATIGUED", "confidence": 0.85, "recommendation": "Take a break before major decisions"},
        {"state": "CONFIDENT", "confidence": 0.88, "recommendation": "Good state for execution"},
    ]
    return random.choice(moods)

@api_router.get("/gestures/detected")
async def get_gesture():
    gestures = [
        {"gesture": "PINCH", "hand": "Right", "action": "Zoom In"},
        {"gesture": "SWIPE_LEFT", "hand": "Right", "action": "Previous"},
        {"gesture": "SWIPE_RIGHT", "hand": "Left", "action": "Next"},
        {"gesture": "THUMBS_UP", "hand": "Right", "action": "Approve"},
        {"gesture": "THUMBS_DOWN", "hand": "Left", "action": "Reject"},
    ]
    return random.choice(gestures)

@api_router.get("/portfolio/summary")
async def get_portfolio_summary(request: Request):
    user = await get_current_user(request)
    
    crypto_prices = await fetch_coingecko_prices()
    btc_price = crypto_prices.get("BTC", MarketData(symbol="BTC", name="Bitcoin", price=100000, change_24h=0, change_percent=0, volume=0, high_24h=0, low_24h=0)).price
    eth_price = crypto_prices.get("ETH", MarketData(symbol="ETH", name="Ethereum", price=4000, change_24h=0, change_percent=0, volume=0, high_24h=0, low_24h=0)).price
    
    return {
        "total_value": round(random.uniform(250000, 500000), 2),
        "daily_pnl": round(random.uniform(-5000, 15000), 2),
        "daily_pnl_percent": round(random.uniform(-2, 5), 2),
        "positions": [
            {"symbol": "BTC", "quantity": 2.5, "value": round(2.5 * btc_price, 2), "price": btc_price},
            {"symbol": "ETH", "quantity": 25, "value": round(25 * eth_price, 2), "price": eth_price},
            {"symbol": "AAPL", "quantity": 500, "value": round(500 * 248, 2), "price": 248},
            {"symbol": "NVDA", "quantity": 200, "value": round(200 * 145, 2), "price": 145},
        ],
        "cash_balance": round(random.uniform(50000, 100000), 2)
    }

# ============ STATUS ROUTES ============

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ============ WEBSOCKET ENDPOINT ============

@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Could handle commands like subscribe/unsubscribe
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Start price streaming background task
    asyncio.create_task(price_streamer())
    logger.info("Price streamer started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
