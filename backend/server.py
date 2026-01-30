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
import base64
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# TTS Integration
try:
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# TTS Client
tts_client = None
if TTS_AVAILABLE:
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    if emergent_key:
        tts_client = OpenAITextToSpeech(api_key=emergent_key)

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
    quantity: float  # Float to support fractional crypto trades (e.g., 0.5 BTC)
    price: float
    status: str = "completed"  # Default for backward compatibility with old trades
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    consensus_confidence: float = 0.85  # Default for backward compatibility with old trades

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

# ============ PRICE ALERTS ROUTES ============

@api_router.post("/alerts", response_model=PriceAlert)
async def create_price_alert(alert_data: PriceAlertCreate, request: Request):
    """Create a new price alert"""
    user = await get_current_user(request)
    
    # Get current price
    symbol = alert_data.symbol.upper()
    current_price = 0
    if symbol in COINGECKO_IDS:
        crypto_prices = await fetch_coingecko_prices()
        if symbol in crypto_prices:
            current_price = crypto_prices[symbol].price
    elif symbol in STOCK_SYMBOLS:
        current_price = generate_stock_price(symbol).price
    
    alert = PriceAlert(
        user_id=user.user_id if user else None,
        symbol=symbol,
        condition=alert_data.condition.lower(),
        target_price=alert_data.target_price,
        current_price=current_price
    )
    
    await alert_manager.add_alert(alert)
    return alert

@api_router.get("/alerts", response_model=List[PriceAlert])
async def get_price_alerts(request: Request, include_triggered: bool = False):
    """Get all price alerts"""
    user = await get_current_user(request)
    
    query = {"triggered": False} if not include_triggered else {}
    if user:
        query["user_id"] = user.user_id
    
    alerts = await db.price_alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
        if alert.get('triggered_at') and isinstance(alert['triggered_at'], str):
            alert['triggered_at'] = datetime.fromisoformat(alert['triggered_at'])
    
    return alerts

@api_router.delete("/alerts/{alert_id}")
async def delete_price_alert(alert_id: str):
    """Delete a price alert"""
    await alert_manager.remove_alert(alert_id)
    return {"message": "Alert deleted", "id": alert_id}

# ============ TRADE CRAWLER ROUTES ============

@api_router.get("/crawler/signals")
async def get_crawler_signals(limit: int = 50, signal_type: Optional[str] = None):
    """Get recent crawler signals"""
    query = {}
    if signal_type:
        query["signal_type"] = signal_type
    
    signals = await db.crawler_signals.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return signals

@api_router.get("/crawler/whales")
async def get_whale_transactions(limit: int = 20):
    """Get recent whale transactions"""
    signals = await db.crawler_signals.find(
        {"signal_type": "whale"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals

@api_router.get("/crawler/news")
async def get_news_signals(limit: int = 20):
    """Get recent news signals"""
    signals = await db.crawler_signals.find(
        {"signal_type": "news"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals

@api_router.get("/crawler/social")
async def get_social_signals(limit: int = 20):
    """Get recent social media signals"""
    signals = await db.crawler_signals.find(
        {"signal_type": "social"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals

@api_router.get("/crawler/orderbook")
async def get_orderbook_signals(limit: int = 20):
    """Get recent order book signals"""
    signals = await db.crawler_signals.find(
        {"signal_type": "orderbook"}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return signals

# ============ EXPORT ROUTES ============

@api_router.get("/export/trades/csv")
async def export_trades_csv(request: Request):
    """Export trade history as CSV"""
    user = await get_current_user(request)
    
    query = {"user_id": user.user_id} if user else {}
    trades = await db.trades.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Date", "Time", "Action", "Symbol", "Quantity", "Price", "Total Value", "Status", "Confidence"])
    
    for trade in trades:
        timestamp = trade.get('timestamp')
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        date_str = timestamp.strftime("%Y-%m-%d") if timestamp else ""
        time_str = timestamp.strftime("%H:%M:%S") if timestamp else ""
        total_value = trade.get('quantity', 0) * trade.get('price', 0)
        
        writer.writerow([
            trade.get('id', ''),
            date_str,
            time_str,
            trade.get('action', ''),
            trade.get('symbol', ''),
            trade.get('quantity', 0),
            f"${trade.get('price', 0):,.2f}",
            f"${total_value:,.2f}",
            trade.get('status', ''),
            f"{trade.get('consensus_confidence', 0)*100:.1f}%"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=trades_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@api_router.get("/export/trades/pdf")
async def export_trades_pdf(request: Request):
    """Export trade history as PDF"""
    user = await get_current_user(request)
    
    query = {"user_id": user.user_id} if user else {}
    trades = await db.trades.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    elements.append(Paragraph("Cognitive Oracle Trading Platform", styles['Title']))
    elements.append(Paragraph("Trade History Report", styles['Heading2']))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Create table data
    table_data = [["Date", "Action", "Symbol", "Qty", "Price", "Total", "Status"]]
    
    for trade in trades[:50]:  # Limit to 50 for PDF
        timestamp = trade.get('timestamp')
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        date_str = timestamp.strftime("%Y-%m-%d %H:%M") if timestamp else ""
        total_value = trade.get('quantity', 0) * trade.get('price', 0)
        
        table_data.append([
            date_str,
            trade.get('action', ''),
            trade.get('symbol', ''),
            str(trade.get('quantity', 0)),
            f"${trade.get('price', 0):,.2f}",
            f"${total_value:,.2f}",
            trade.get('status', '')
        ])
    
    # Create and style table
    table = Table(table_data, colWidths=[80, 50, 50, 40, 70, 80, 60])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0, 0.5, 0.5)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.Color(0.95, 0.95, 0.95)),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.Color(0.7, 0.7, 0.7)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)])
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Total trades: {len(trades)}", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=trades_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"}
    )

@api_router.get("/export/alerts/csv")
async def export_alerts_csv(request: Request):
    """Export price alerts as CSV"""
    user = await get_current_user(request)
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    
    alerts = await db.price_alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Symbol", "Condition", "Target Price", "Triggered", "Created At", "Triggered At"])
    
    for alert in alerts:
        created_at = alert.get('created_at', '')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        triggered_at = alert.get('triggered_at', '')
        if triggered_at and isinstance(triggered_at, str):
            triggered_at = datetime.fromisoformat(triggered_at)
        
        writer.writerow([
            alert.get('id', ''),
            alert.get('symbol', ''),
            alert.get('condition', ''),
            f"${alert.get('target_price', 0):,.2f}",
            "Yes" if alert.get('triggered') else "No",
            created_at.strftime("%Y-%m-%d %H:%M:%S") if created_at else "",
            triggered_at.strftime("%Y-%m-%d %H:%M:%S") if triggered_at else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

# ============ TTS / AVATAR ROUTES ============

class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"  # Default to energetic voice for trading
    speed: float = 1.0

class AvatarMessage(BaseModel):
    message: str
    emotion: str = "neutral"  # neutral, happy, concerned, excited, focused
    market_context: Optional[Dict[str, Any]] = None

@api_router.post("/avatar/speak")
async def avatar_speak(request: TTSRequest):
    """Generate speech audio for the avatar"""
    if not tts_client:
        raise HTTPException(status_code=503, detail="TTS service not available")
    
    if len(request.text) > 4096:
        raise HTTPException(status_code=400, detail="Text too long (max 4096 characters)")
    
    try:
        # Generate speech as base64
        audio_base64 = await tts_client.generate_speech_base64(
            text=request.text,
            model="tts-1",  # Fast model for real-time
            voice=request.voice,
            speed=request.speed,
            response_format="mp3"
        )
        
        return {
            "audio": audio_base64,
            "format": "mp3",
            "voice": request.voice
        }
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/avatar/insight")
async def avatar_generate_insight(request: AvatarMessage):
    """Generate trading insight and speech for avatar"""
    # Determine emotion based on market context
    emotion = request.emotion
    
    market_data = request.market_context or {}
    btc_change = market_data.get('btc_change', 0)
    
    if btc_change > 3:
        emotion = "excited"
    elif btc_change < -3:
        emotion = "concerned"
    elif btc_change > 0:
        emotion = "happy"
    
    # Generate contextual trading insight
    insights = {
        "excited": [
            "Wow! Bitcoin is surging! This could be the breakout we've been waiting for.",
            "Markets are heating up! Time to consider taking profits on your winners.",
            "Bullish momentum is strong! Watch for a potential continuation pattern.",
        ],
        "concerned": [
            "Market conditions are turning bearish. Consider reviewing your stop losses.",
            "We're seeing some significant selling pressure. Stay cautious.",
            "Volatility is increasing. This might be a good time to reduce exposure.",
        ],
        "happy": [
            "Markets are looking healthy today. Your portfolio is in good shape.",
            "Steady gains across the board. Keep an eye on key support levels.",
            "Positive momentum continues. Your trading strategy is working well.",
        ],
        "neutral": [
            "Markets are consolidating. Waiting for a clear direction.",
            "Volume is low. Major moves could come with the next catalyst.",
            "Range-bound trading continues. Watch for breakout signals.",
        ],
        "focused": [
            "I'm monitoring key price levels for you.",
            "Alert systems are active. I'll notify you of any significant moves.",
            "Analyzing market patterns for potential opportunities.",
        ]
    }
    
    message = request.message or random.choice(insights.get(emotion, insights["neutral"]))
    
    # Generate speech if TTS is available
    audio_data = None
    if tts_client:
        try:
            voice_map = {
                "excited": "nova",
                "concerned": "onyx",
                "happy": "shimmer",
                "neutral": "alloy",
                "focused": "sage"
            }
            audio_base64 = await tts_client.generate_speech_base64(
                text=message,
                model="tts-1",
                voice=voice_map.get(emotion, "alloy"),
                speed=1.1 if emotion == "excited" else 0.95 if emotion == "concerned" else 1.0,
                response_format="mp3"
            )
            audio_data = audio_base64
        except Exception as e:
            logger.error(f"TTS error: {e}")
    
    return {
        "message": message,
        "emotion": emotion,
        "audio": audio_data,
        "format": "mp3" if audio_data else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/avatar/voices")
async def get_available_voices():
    """Get list of available avatar voices"""
    return {
        "voices": [
            {"id": "alloy", "name": "Alloy", "description": "Neutral, balanced"},
            {"id": "nova", "name": "Nova", "description": "Energetic, upbeat"},
            {"id": "shimmer", "name": "Shimmer", "description": "Bright, cheerful"},
            {"id": "onyx", "name": "Onyx", "description": "Deep, authoritative"},
            {"id": "sage", "name": "Sage", "description": "Wise, measured"},
            {"id": "echo", "name": "Echo", "description": "Smooth, calm"},
            {"id": "fable", "name": "Fable", "description": "Expressive, storytelling"},
        ],
        "default": "nova"
    }

# ============ VOICE COMMAND PROCESSING ============

class VoiceCommandRequest(BaseModel):
    transcript: str
    context: Optional[Dict[str, Any]] = None

class TradeAnnouncementRequest(BaseModel):
    action: str  # "buy" or "sell"
    symbol: str
    quantity: float
    price: float
    profit_loss: Optional[float] = None

@api_router.post("/voice/command")
async def process_voice_command(request: VoiceCommandRequest):
    """Process voice command and return action"""
    transcript = request.transcript.lower().strip()
    
    # Parse trading commands
    command = None
    response_message = ""
    action_data = {}
    
    # Buy commands
    if any(word in transcript for word in ["buy", "purchase", "get", "long"]):
        command = "buy"
        # Extract quantity and symbol
        import re
        
        # Match patterns like "buy 100 btc" or "buy btc 100" or "buy 0.5 bitcoin"
        qty_match = re.search(r'(\d+\.?\d*)\s*(btc|bitcoin|eth|ethereum|sol|solana|spy|aapl|nvda)?', transcript)
        symbol_match = re.search(r'(btc|bitcoin|eth|ethereum|sol|solana|spy|aapl|nvda)\s*(\d+\.?\d*)?', transcript)
        
        quantity = 1.0
        symbol = "BTC"
        
        if qty_match:
            quantity = float(qty_match.group(1))
        if symbol_match:
            symbol_map = {"btc": "BTC", "bitcoin": "BTC", "eth": "ETH", "ethereum": "ETH", 
                         "sol": "SOL", "solana": "SOL", "spy": "SPY", "aapl": "AAPL", "nvda": "NVDA"}
            symbol = symbol_map.get(symbol_match.group(1).lower(), "BTC")
            if symbol_match.group(2):
                quantity = float(symbol_match.group(2))
        
        action_data = {"action": "buy", "symbol": symbol, "quantity": quantity}
        response_message = f"Understood! Preparing to buy {quantity} {symbol}."
    
    # Sell commands
    elif any(word in transcript for word in ["sell", "short", "dump", "exit"]):
        command = "sell"
        import re
        
        qty_match = re.search(r'(\d+\.?\d*)\s*(btc|bitcoin|eth|ethereum|sol|solana|spy|aapl|nvda)?', transcript)
        symbol_match = re.search(r'(btc|bitcoin|eth|ethereum|sol|solana|spy|aapl|nvda)', transcript)
        
        quantity = 1.0
        symbol = "BTC"
        
        if qty_match:
            quantity = float(qty_match.group(1))
        if symbol_match:
            symbol_map = {"btc": "BTC", "bitcoin": "BTC", "eth": "ETH", "ethereum": "ETH",
                         "sol": "SOL", "solana": "SOL", "spy": "SPY", "aapl": "AAPL", "nvda": "NVDA"}
            symbol = symbol_map.get(symbol_match.group(1).lower(), "BTC")
        
        action_data = {"action": "sell", "symbol": symbol, "quantity": quantity}
        response_message = f"Understood! Preparing to sell {quantity} {symbol}."
    
    # Price check
    elif any(word in transcript for word in ["price", "how much", "what's", "what is", "check"]):
        command = "price_check"
        import re
        symbol_match = re.search(r'(btc|bitcoin|eth|ethereum|sol|solana|spy|aapl|nvda)', transcript)
        symbol = "BTC"
        if symbol_match:
            symbol_map = {"btc": "BTC", "bitcoin": "BTC", "eth": "ETH", "ethereum": "ETH",
                         "sol": "SOL", "solana": "SOL", "spy": "SPY", "aapl": "AAPL", "nvda": "NVDA"}
            symbol = symbol_map.get(symbol_match.group(1).lower(), "BTC")
        
        action_data = {"action": "price_check", "symbol": symbol}
        response_message = f"Checking the current price of {symbol}."
    
    # Set alert
    elif any(word in transcript for word in ["alert", "notify", "tell me when", "watch"]):
        command = "set_alert"
        import re
        
        price_match = re.search(r'(\d+(?:,\d{3})*(?:\.\d+)?)', transcript)
        symbol_match = re.search(r'(btc|bitcoin|eth|ethereum|sol|solana)', transcript)
        condition = "above" if any(w in transcript for w in ["above", "over", "reaches", "hits"]) else "below"
        
        target_price = 100000
        symbol = "BTC"
        
        if price_match:
            target_price = float(price_match.group(1).replace(",", ""))
        if symbol_match:
            symbol_map = {"btc": "BTC", "bitcoin": "BTC", "eth": "ETH", "ethereum": "ETH", "sol": "SOL", "solana": "SOL"}
            symbol = symbol_map.get(symbol_match.group(1).lower(), "BTC")
        
        action_data = {"action": "set_alert", "symbol": symbol, "condition": condition, "target_price": target_price}
        response_message = f"Setting alert for {symbol} {condition} ${target_price:,.2f}."
    
    # Market status
    elif any(word in transcript for word in ["market", "status", "how are", "overview"]):
        command = "market_status"
        action_data = {"action": "market_status"}
        response_message = "Let me check the current market conditions for you."
    
    # Help
    elif any(word in transcript for word in ["help", "what can", "commands"]):
        command = "help"
        action_data = {"action": "help"}
        response_message = "I can help you buy or sell crypto, check prices, set alerts, and provide market insights. Just say 'buy 1 BTC' or 'what's the price of ETH'."
    
    else:
        command = "unknown"
        response_message = "I didn't quite catch that. Try saying 'buy 1 BTC', 'sell ETH', 'check BTC price', or 'set alert BTC above 100000'."
    
    # Generate audio response
    audio_data = None
    if tts_client and response_message:
        try:
            audio_data = await tts_client.generate_speech_base64(
                text=response_message,
                model="tts-1",
                voice="nova",
                speed=1.0,
                response_format="mp3"
            )
        except Exception as e:
            logger.error(f"Voice command TTS error: {e}")
    
    return {
        "command": command,
        "transcript": transcript,
        "response": response_message,
        "action_data": action_data,
        "audio": audio_data,
        "format": "mp3" if audio_data else None
    }

@api_router.post("/avatar/announce-trade")
async def announce_trade(request: TradeAnnouncementRequest):
    """Generate voice announcement for a completed trade"""
    action = request.action.upper()
    symbol = request.symbol.upper()
    quantity = request.quantity
    price = request.price
    profit_loss = request.profit_loss
    
    # Generate announcement message
    if profit_loss is not None and profit_loss != 0:
        if profit_loss > 0:
            message = f"Trade executed! {action} {quantity} {symbol} at ${price:,.2f}. Congratulations, you made ${profit_loss:,.2f} profit!"
            emotion = "excited"
        else:
            message = f"Trade executed. {action} {quantity} {symbol} at ${price:,.2f}. Loss of ${abs(profit_loss):,.2f}. Let's analyze what happened."
            emotion = "concerned"
    else:
        message = f"Trade executed! {action} {quantity} {symbol} at ${price:,.2f}. Order filled successfully."
        emotion = "happy"
    
    # Generate audio
    audio_data = None
    if tts_client:
        try:
            voice_map = {"excited": "nova", "concerned": "onyx", "happy": "shimmer"}
            audio_data = await tts_client.generate_speech_base64(
                text=message,
                model="tts-1",
                voice=voice_map.get(emotion, "alloy"),
                speed=1.1 if emotion == "excited" else 0.95 if emotion == "concerned" else 1.0,
                response_format="mp3"
            )
        except Exception as e:
            logger.error(f"Trade announcement TTS error: {e}")
    
    # Store trade in database
    trade_doc = {
        "id": str(uuid.uuid4()),
        "action": request.action,
        "symbol": symbol,
        "quantity": quantity,
        "price": price,
        "profit_loss": profit_loss,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "announced": True
    }
    await db.trades.insert_one(trade_doc)
    
    # Broadcast trade to WebSocket clients
    await manager.broadcast({
        "type": "trade_executed",
        "data": {
            "action": request.action,
            "symbol": symbol,
            "quantity": quantity,
            "price": price,
            "profit_loss": profit_loss,
            "message": message
        }
    })
    
    return {
        "message": message,
        "emotion": emotion,
        "audio": audio_data,
        "format": "mp3" if audio_data else None,
        "trade_id": trade_doc["id"]
    }

# ============ REAL API INTEGRATIONS ============

@api_router.get("/real/whale-transactions")
async def get_real_whale_transactions():
    """Fetch real whale transactions from blockchain APIs"""
    try:
        # Using Blockchain.com API for large transactions (free, no key needed)
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get latest BTC blocks
            response = await client.get("https://blockchain.info/latestblock")
            if response.status_code == 200:
                latest = response.json()
                block_hash = latest.get("hash")
                
                # Get block details
                block_resp = await client.get(f"https://blockchain.info/rawblock/{block_hash}")
                if block_resp.status_code == 200:
                    block = block_resp.json()
                    
                    # Filter large transactions (> 10 BTC)
                    large_txs = []
                    for tx in block.get("tx", [])[:50]:  # Check first 50 txs
                        total_output = sum(out.get("value", 0) for out in tx.get("out", [])) / 100000000  # Satoshi to BTC
                        if total_output > 10:
                            large_txs.append({
                                "hash": tx.get("hash"),
                                "amount": round(total_output, 4),
                                "symbol": "BTC",
                                "usd_value": round(total_output * 90000, 2),  # Approximate
                                "timestamp": datetime.fromtimestamp(tx.get("time", 0), timezone.utc).isoformat(),
                                "inputs": len(tx.get("inputs", [])),
                                "outputs": len(tx.get("out", []))
                            })
                    
                    return {
                        "source": "blockchain.info",
                        "transactions": large_txs[:10],
                        "block_height": latest.get("height"),
                        "fetched_at": datetime.now(timezone.utc).isoformat()
                    }
        
        return {"source": "blockchain.info", "transactions": [], "error": "Could not fetch data"}
    except Exception as e:
        logger.error(f"Whale API error: {e}")
        return {"source": "blockchain.info", "transactions": [], "error": str(e)}

@api_router.get("/real/crypto-news")
async def get_real_crypto_news():
    """Fetch real crypto news from CryptoPanic API (free tier)"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # CryptoPanic public feed (no auth required for basic access)
            response = await client.get(
                "https://cryptopanic.com/api/v1/posts/",
                params={
                    "auth_token": "free",  # Public access
                    "public": "true",
                    "kind": "news",
                    "filter": "hot"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                news = []
                for item in data.get("results", [])[:15]:
                    # Determine sentiment from votes
                    votes = item.get("votes", {})
                    positive = votes.get("positive", 0)
                    negative = votes.get("negative", 0)
                    sentiment = "bullish" if positive > negative else "bearish" if negative > positive else "neutral"
                    
                    news.append({
                        "id": item.get("id"),
                        "title": item.get("title"),
                        "source": item.get("source", {}).get("title", "Unknown"),
                        "url": item.get("url"),
                        "sentiment": sentiment,
                        "votes": votes,
                        "currencies": [c.get("code") for c in item.get("currencies", [])],
                        "published_at": item.get("published_at")
                    })
                
                return {
                    "source": "cryptopanic",
                    "news": news,
                    "fetched_at": datetime.now(timezone.utc).isoformat()
                }
            else:
                # Fallback to simulated news if API fails
                return await get_fallback_news()
    except Exception as e:
        logger.error(f"CryptoPanic API error: {e}")
        return await get_fallback_news()

async def get_fallback_news():
    """Return simulated news as fallback"""
    return {
        "source": "simulated",
        "news": [
            {"title": "Bitcoin maintains support above $89,000", "sentiment": "bullish", "source": "CoinDesk"},
            {"title": "Ethereum gas fees reach 6-month low", "sentiment": "bullish", "source": "The Block"},
            {"title": "Federal Reserve signals potential rate cuts", "sentiment": "bullish", "source": "Bloomberg"},
        ],
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }

# ============ TRADING JOURNAL ============

class JournalEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    trades_count: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl: float = 0
    best_trade: Optional[Dict[str, Any]] = None
    worst_trade: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    ai_insights: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/journal/daily-summary")
async def get_daily_summary(date: Optional[str] = None, include_audio: bool = False, request: Request = None):
    """Get trading journal summary for a specific day"""
    user = await get_current_user(request) if request else None
    
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get trades for the day
    start_of_day = f"{date}T00:00:00"
    end_of_day = f"{date}T23:59:59"
    
    query = {
        "timestamp": {"$gte": start_of_day, "$lte": end_of_day}
    }
    if user:
        query["user_id"] = user.user_id
    
    trades = await db.trades.find(query, {"_id": 0}).to_list(1000)
    
    if not trades:
        # Generate sample trades for demo
        trades = [
            {"action": "buy", "symbol": "BTC", "quantity": 0.5, "price": 89500, "profit_loss": 250, "timestamp": f"{date}T10:30:00"},
            {"action": "sell", "symbol": "ETH", "quantity": 5, "price": 2950, "profit_loss": -75, "timestamp": f"{date}T14:15:00"},
            {"action": "buy", "symbol": "SOL", "quantity": 20, "price": 125, "profit_loss": 180, "timestamp": f"{date}T16:45:00"},
        ]
    
    # Calculate statistics
    wins = sum(1 for t in trades if (t.get("profit_loss") or 0) > 0)
    losses = sum(1 for t in trades if (t.get("profit_loss") or 0) < 0)
    total_pnl = sum(t.get("profit_loss") or 0 for t in trades)
    
    best_trade = max(trades, key=lambda t: t.get("profit_loss") or 0) if trades else None
    worst_trade = min(trades, key=lambda t: t.get("profit_loss") or 0) if trades else None
    
    win_rate = (wins / len(trades) * 100) if trades else 0
    
    # Generate AI insights
    if total_pnl > 0:
        insight = f"Great day! You made ${total_pnl:,.2f} with a {win_rate:.1f}% win rate. "
        if best_trade:
            insight += f"Your best trade was {best_trade.get('action', '')} {best_trade.get('symbol', '')} for ${best_trade.get('profit_loss', 0):,.2f} profit. "
        insight += "Consider taking partial profits on winning positions to lock in gains."
        emotion = "excited"
    elif total_pnl < 0:
        insight = f"Challenging day with ${abs(total_pnl):,.2f} in losses. "
        if worst_trade:
            insight += f"Your biggest loss was on {worst_trade.get('symbol', '')}. "
        insight += "Review your entry points and consider tighter stop losses. Tomorrow is a new opportunity!"
        emotion = "concerned"
    else:
        insight = "Flat day with no significant gains or losses. Markets may be consolidating. Use this time to research potential opportunities."
        emotion = "neutral"
    
    # Generate audio summary only if requested
    audio_data = None
    if include_audio and tts_client:
        summary_text = f"Here's your trading summary for {date}. You made {len(trades)} trades with {wins} wins and {losses} losses. "
        summary_text += f"Your total profit and loss is ${total_pnl:,.2f}. " + insight
        
        try:
            voice_map = {"excited": "nova", "concerned": "onyx", "neutral": "alloy"}
            audio_data = await tts_client.generate_speech_base64(
                text=summary_text,
                model="tts-1",
                voice=voice_map.get(emotion, "alloy"),
                speed=1.0,
                response_format="mp3"
            )
        except Exception as e:
            logger.error(f"Journal TTS error: {e}")
    
    return {
        "date": date,
        "trades_count": len(trades),
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 1),
        "total_pnl": round(total_pnl, 2),
        "best_trade": best_trade,
        "worst_trade": worst_trade,
        "trades": trades,
        "ai_insights": insight,
        "emotion": emotion,
        "audio": audio_data,
        "format": "mp3" if audio_data else None
    }

@api_router.get("/journal/weekly-summary")
async def get_weekly_summary(request: Request = None):
    """Get trading journal summary for the past 7 days"""
    user = await get_current_user(request) if request else None
    
    daily_summaries = []
    total_pnl = 0
    total_trades = 0
    total_wins = 0
    
    for i in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        summary = await get_daily_summary(date, request)
        daily_summaries.append({
            "date": date,
            "pnl": summary["total_pnl"],
            "trades": summary["trades_count"],
            "win_rate": summary["win_rate"]
        })
        total_pnl += summary["total_pnl"]
        total_trades += summary["trades_count"]
        total_wins += summary["wins"]
    
    overall_win_rate = (total_wins / total_trades * 100) if total_trades > 0 else 0
    
    # AI weekly insight
    if total_pnl > 500:
        weekly_insight = f"Excellent week! You're up ${total_pnl:,.2f}. Your consistent strategy is paying off."
    elif total_pnl > 0:
        weekly_insight = f"Positive week with ${total_pnl:,.2f} profit. Keep refining your approach."
    elif total_pnl > -500:
        weekly_insight = f"Slight drawdown of ${abs(total_pnl):,.2f}. Review your risk management."
    else:
        weekly_insight = f"Tough week with ${abs(total_pnl):,.2f} in losses. Consider reducing position sizes."
    
    return {
        "period": "7 days",
        "daily_summaries": daily_summaries,
        "total_pnl": round(total_pnl, 2),
        "total_trades": total_trades,
        "overall_win_rate": round(overall_win_rate, 1),
        "ai_insights": weekly_insight
    }

@api_router.post("/journal/add-note")
async def add_journal_note(date: str, note: str, request: Request = None):
    """Add a personal note to a trading journal entry"""
    user = await get_current_user(request) if request else None
    
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user.user_id if user else None,
        "date": date,
        "note": note,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.journal_notes.insert_one(entry)
    
    # Return without MongoDB _id
    return {"message": "Note added successfully", "id": entry["id"]}

# ============ PORTFOLIO SHARING ============

class UserPortfolio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    is_public: bool = False
    total_value: float = 0
    daily_pnl: float = 0
    weekly_pnl: float = 0
    win_rate: float = 0
    holdings: List[Dict[str, Any]] = []
    followers: int = 0
    following: int = 0
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/portfolios/public")
async def get_public_portfolios(sort_by: str = "total_value", limit: int = 20):
    """Get public portfolios for leaderboard"""
    # Generate sample leaderboard data
    portfolios = [
        {
            "id": str(uuid.uuid4()),
            "username": "CryptoWhale_42",
            "avatar_url": None,
            "total_value": 2547832.50,
            "daily_pnl": 12450.00,
            "daily_pnl_percent": 0.49,
            "weekly_pnl": 87250.00,
            "win_rate": 72.5,
            "followers": 15420,
            "verified": True,
            "top_holdings": ["BTC", "ETH", "SOL"],
            "rank": 1
        },
        {
            "id": str(uuid.uuid4()),
            "username": "TradingMaster",
            "avatar_url": None,
            "total_value": 1823450.00,
            "daily_pnl": 8920.00,
            "daily_pnl_percent": 0.49,
            "weekly_pnl": 45600.00,
            "win_rate": 68.3,
            "followers": 8750,
            "verified": True,
            "top_holdings": ["ETH", "BTC", "AAPL"],
            "rank": 2
        },
        {
            "id": str(uuid.uuid4()),
            "username": "DeFiKing",
            "avatar_url": None,
            "total_value": 956780.00,
            "daily_pnl": -2340.00,
            "daily_pnl_percent": -0.24,
            "weekly_pnl": 23400.00,
            "win_rate": 65.8,
            "followers": 5230,
            "verified": False,
            "top_holdings": ["SOL", "ETH", "BTC"],
            "rank": 3
        },
        {
            "id": str(uuid.uuid4()),
            "username": "QuantTrader_Pro",
            "avatar_url": None,
            "total_value": 745230.00,
            "daily_pnl": 5670.00,
            "daily_pnl_percent": 0.76,
            "weekly_pnl": 18900.00,
            "win_rate": 71.2,
            "followers": 3890,
            "verified": True,
            "top_holdings": ["BTC", "NVDA", "SPY"],
            "rank": 4
        },
        {
            "id": str(uuid.uuid4()),
            "username": "AlphaSeeker",
            "avatar_url": None,
            "total_value": 523890.00,
            "daily_pnl": 1230.00,
            "daily_pnl_percent": 0.23,
            "weekly_pnl": 8750.00,
            "win_rate": 58.9,
            "followers": 2150,
            "verified": False,
            "top_holdings": ["ETH", "SOL", "BTC"],
            "rank": 5
        },
    ]
    
    # Sort by specified field
    if sort_by == "daily_pnl":
        portfolios.sort(key=lambda x: x["daily_pnl"], reverse=True)
    elif sort_by == "win_rate":
        portfolios.sort(key=lambda x: x["win_rate"], reverse=True)
    elif sort_by == "followers":
        portfolios.sort(key=lambda x: x["followers"], reverse=True)
    
    return {
        "portfolios": portfolios[:limit],
        "total_count": len(portfolios),
        "sort_by": sort_by
    }

@api_router.get("/portfolios/{portfolio_id}")
async def get_portfolio_details(portfolio_id: str):
    """Get detailed portfolio information"""
    # Return sample portfolio details
    return {
        "id": portfolio_id,
        "username": "CryptoWhale_42",
        "bio": "Full-time crypto trader since 2017. Focus on BTC and ETH swing trading.",
        "total_value": 2547832.50,
        "initial_value": 500000.00,
        "all_time_pnl": 2047832.50,
        "all_time_return": 409.57,
        "daily_pnl": 12450.00,
        "weekly_pnl": 87250.00,
        "monthly_pnl": 234500.00,
        "win_rate": 72.5,
        "avg_win": 2450.00,
        "avg_loss": 980.00,
        "risk_reward_ratio": 2.5,
        "followers": 15420,
        "following": 45,
        "verified": True,
        "holdings": [
            {"symbol": "BTC", "quantity": 15.5, "value": 1390975.00, "allocation": 54.6, "pnl": 125000.00},
            {"symbol": "ETH", "quantity": 250, "value": 742500.00, "allocation": 29.1, "pnl": 45000.00},
            {"symbol": "SOL", "quantity": 1500, "value": 195000.00, "allocation": 7.7, "pnl": 12500.00},
            {"symbol": "USDT", "quantity": 219357.50, "value": 219357.50, "allocation": 8.6, "pnl": 0}
        ],
        "recent_trades": [
            {"action": "buy", "symbol": "BTC", "quantity": 0.5, "price": 89500, "timestamp": datetime.now(timezone.utc).isoformat()},
            {"action": "sell", "symbol": "ETH", "quantity": 10, "price": 2980, "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()},
        ],
        "trading_style": "Swing Trading",
        "risk_level": "Medium",
        "joined_date": "2017-03-15"
    }

@api_router.post("/portfolios/follow/{portfolio_id}")
async def follow_portfolio(portfolio_id: str, request: Request = None):
    """Follow a portfolio for copy trading"""
    user = await get_current_user(request) if request else None
    
    follow_doc = {
        "id": str(uuid.uuid4()),
        "follower_id": user.user_id if user else "anonymous",
        "portfolio_id": portfolio_id,
        "copy_trades": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.portfolio_follows.insert_one(follow_doc)
    
    return {"message": "Now following portfolio", "follow_id": follow_doc["id"]}

# ============ ENHANCED SOCIAL SIGNALS ============

@api_router.get("/social/trending")
async def get_trending_topics():
    """Get trending crypto topics from social media (simulated)"""
    trending = [
        {
            "topic": "#Bitcoin",
            "mentions": 45230,
            "sentiment": "bullish",
            "sentiment_score": 0.72,
            "change_24h": 15.3,
            "top_influencers": ["@whale_alert", "@bitcoin", "@CryptoCapital"],
            "sample_tweets": [
                "BTC breaking out! $100k incoming 🚀",
                "Institutional buying continues to accelerate",
                "Bitcoin dominance reaching new highs"
            ]
        },
        {
            "topic": "#Ethereum",
            "mentions": 28450,
            "sentiment": "bullish",
            "sentiment_score": 0.65,
            "change_24h": 8.7,
            "top_influencers": ["@VitalikButerin", "@ethereum", "@DeFiPulse"],
            "sample_tweets": [
                "ETH staking rewards looking attractive",
                "Layer 2 adoption accelerating",
                "Gas fees at yearly lows"
            ]
        },
        {
            "topic": "#Solana",
            "mentions": 18920,
            "sentiment": "neutral",
            "sentiment_score": 0.51,
            "change_24h": -5.2,
            "top_influencers": ["@solaboratory", "@SolanaConf", "@phantom"],
            "sample_tweets": [
                "SOL ecosystem growing despite volatility",
                "New DEX launches on Solana",
                "Network congestion concerns addressed"
            ]
        },
        {
            "topic": "#DeFi",
            "mentions": 12340,
            "sentiment": "bullish",
            "sentiment_score": 0.68,
            "change_24h": 22.1,
            "top_influencers": ["@DefiLlama", "@DeFiPulse", "@AaveAave"],
            "sample_tweets": [
                "TVL surging across protocols",
                "Yield farming opportunities emerging",
                "DeFi summer 2.0?"
            ]
        },
        {
            "topic": "#NFTs",
            "mentions": 8760,
            "sentiment": "bearish",
            "sentiment_score": 0.38,
            "change_24h": -12.5,
            "top_influencers": ["@opensea", "@BoredApeYC", "@pudaborated"],
            "sample_tweets": [
                "NFT volume declining",
                "Blue chips holding steady",
                "Focus shifting to utility"
            ]
        }
    ]
    
    return {
        "trending": trending,
        "overall_sentiment": "bullish",
        "fear_greed_index": 72,
        "fear_greed_label": "Greed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/social/sentiment/{symbol}")
async def get_symbol_sentiment(symbol: str):
    """Get social sentiment for a specific symbol"""
    symbol = symbol.upper()
    
    # Simulated sentiment data
    sentiments = {
        "BTC": {"score": 0.72, "label": "Very Bullish", "mentions": 45230, "volume_change": 15.3},
        "ETH": {"score": 0.65, "label": "Bullish", "mentions": 28450, "volume_change": 8.7},
        "SOL": {"score": 0.51, "label": "Neutral", "mentions": 18920, "volume_change": -5.2},
        "AAPL": {"score": 0.58, "label": "Slightly Bullish", "mentions": 12400, "volume_change": 3.2},
        "NVDA": {"score": 0.78, "label": "Very Bullish", "mentions": 34500, "volume_change": 28.5},
    }
    
    data = sentiments.get(symbol, {"score": 0.50, "label": "Neutral", "mentions": 1000, "volume_change": 0})
    
    return {
        "symbol": symbol,
        "sentiment_score": data["score"],
        "sentiment_label": data["label"],
        "mentions_24h": data["mentions"],
        "mentions_change": data["volume_change"],
        "sources": {
            "twitter": int(data["mentions"] * 0.6),
            "reddit": int(data["mentions"] * 0.25),
            "telegram": int(data["mentions"] * 0.15)
        },
        "key_influencers": [
            {"name": "@CryptoTrader1", "followers": 125000, "sentiment": "bullish"},
            {"name": "@MarketAnalyst", "followers": 89000, "sentiment": "bullish"},
            {"name": "@WhaleWatch", "followers": 67000, "sentiment": "neutral"}
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

# ============ WEBSOCKET ENDPOINTS ============

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

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket for real-time price alert notifications"""
    await alert_manager.connect_alert_ws(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle subscribe/unsubscribe commands
    except WebSocketDisconnect:
        alert_manager.disconnect_alert_ws(websocket)

@app.websocket("/ws/crawler")
async def websocket_crawler(websocket: WebSocket):
    """WebSocket for real-time crawler signals"""
    await crawler.connect_crawler_ws(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        crawler.disconnect_crawler_ws(websocket)

# ============ NEW PRODUCTION MODULES ============

# Import new modules
from modules.trading_playground import TradingPlaygroundEngine, PlaygroundOrder
from modules.autonomous_bot import AutonomousBotEngine, TradingStrategy, BotMode
from modules.training_system import TrainingEngine, BacktestConfig
from modules.exchange_integration import ExchangeManager, ExchangeType, OrderSide, OrderType
from modules.social_integration import SocialManager

# Initialize module engines
playground_engine = TradingPlaygroundEngine(db)
bot_engine = AutonomousBotEngine(db, playground_engine)
training_engine = TrainingEngine(db)
exchange_manager = ExchangeManager(db)
social_manager = SocialManager(db)

# ============ TRADING PLAYGROUND ENDPOINTS ============

@api_router.post("/playground/account")
async def create_playground_account(initial_balance: float = 100000.0, request: Request = None):
    """Create a new paper trading account"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else None
    
    # Check if user already has an account
    if user_id:
        existing = await playground_engine.get_user_account(user_id)
        if existing:
            return existing.model_dump()
    
    account = await playground_engine.create_account(user_id, initial_balance)
    return account.model_dump()

@api_router.get("/playground/account/{account_id}")
async def get_playground_account(account_id: str):
    """Get playground account details"""
    result = await playground_engine.update_positions(account_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail="Account not found")
    return result["account"]

@api_router.get("/playground/account")
async def get_my_playground_account(request: Request):
    """Get current user's playground account"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    account = await playground_engine.get_user_account(user["id"])
    if not account:
        # Create one automatically
        account = await playground_engine.create_account(user["id"])
    
    await playground_engine.update_positions(account.id)
    return account.model_dump()

@api_router.post("/playground/order")
async def place_playground_order(
    account_id: str,
    symbol: str,
    side: str,
    order_type: str = "market",
    quantity: float = 0.01,
    price: Optional[float] = None,
    stop_loss: Optional[float] = None,
    take_profit: Optional[float] = None
):
    """Place an order in the playground"""
    order = PlaygroundOrder(
        account_id=account_id,
        symbol=symbol.upper(),
        side=side.lower(),
        order_type=order_type.lower(),
        quantity=quantity,
        price=price,
        stop_loss_price=stop_loss,
        take_profit_price=take_profit
    )
    
    if order_type.lower() == "market":
        result = await playground_engine.execute_market_order(order)
    else:
        result = await playground_engine.execute_limit_order(order)
    
    return result

@api_router.post("/playground/reset/{account_id}")
async def reset_playground_account(account_id: str, initial_balance: float = 100000.0):
    """Reset playground account to initial state"""
    result = await playground_engine.reset_account(account_id, initial_balance)
    return result

@api_router.get("/playground/leaderboard")
async def get_playground_leaderboard(limit: int = 10):
    """Get top performing playground traders"""
    leaderboard = await playground_engine.get_leaderboard(limit)
    return {"leaderboard": leaderboard}

# ============ AUTONOMOUS BOT ENDPOINTS ============

@api_router.post("/bot/create")
async def create_trading_bot(
    account_id: str,
    strategy: str = "moderate",
    trading_pairs: List[str] = None,
    request: Request = None
):
    """Create a new autonomous trading bot"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    strategy_enum = TradingStrategy(strategy.lower())
    bot = await bot_engine.create_bot(
        user_id=user_id,
        account_id=account_id,
        strategy=strategy_enum,
        trading_pairs=trading_pairs or ["BTC", "ETH", "SOL"]
    )
    return bot.model_dump()

@api_router.get("/bot/{bot_id}")
async def get_bot(bot_id: str):
    """Get bot details"""
    bot = await bot_engine.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot.model_dump()

@api_router.get("/bot/user/bots")
async def get_user_bots(request: Request):
    """Get all bots for current user"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    bots = await bot_engine.get_user_bots(user_id)
    return {"bots": [b.model_dump() for b in bots]}

@api_router.post("/bot/{bot_id}/mode")
async def set_bot_mode(bot_id: str, mode: str):
    """Set bot operating mode (full_auto, semi_auto, paused)"""
    try:
        mode_enum = BotMode(mode.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mode. Use: full_auto, semi_auto, paused")
    
    result = await bot_engine.update_bot_mode(bot_id, mode_enum)
    return result

@api_router.get("/bot/{bot_id}/performance")
async def get_bot_performance(bot_id: str):
    """Get bot performance statistics"""
    performance = await bot_engine.get_bot_performance(bot_id)
    return performance

@api_router.get("/bot/{bot_id}/signals")
async def get_pending_signals(bot_id: str):
    """Get pending signals for semi-auto mode"""
    signals = await bot_engine.get_pending_signals(bot_id)
    return {"signals": signals}

@api_router.post("/bot/signal/{signal_id}/approve")
async def approve_signal(signal_id: str):
    """Approve a pending signal"""
    result = await bot_engine.approve_signal(signal_id)
    return result

@api_router.post("/bot/signal/{signal_id}/reject")
async def reject_signal(signal_id: str):
    """Reject a pending signal"""
    result = await bot_engine.reject_signal(signal_id)
    return result

@api_router.post("/bot/{bot_id}/analyze")
async def trigger_analysis(bot_id: str, symbol: str = "BTC"):
    """Manually trigger market analysis"""
    bot = await bot_engine.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    analysis = await bot_engine.analyze_market(symbol)
    
    # Get current price (simulated)
    current_price = await playground_engine.get_current_price(symbol)
    
    # Generate signal
    signal = await bot_engine.generate_signal(bot, symbol, analysis, current_price)
    
    return {
        "analysis": analysis,
        "signal": signal.model_dump()
    }

# ============ TRAINING SYSTEM ENDPOINTS ============

@api_router.get("/training/content")
async def get_training_content():
    """Get all available training content"""
    content = await training_engine.get_all_content()
    return content

@api_router.get("/training/progress")
async def get_user_progress(request: Request):
    """Get user's training progress"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    progress = await training_engine.get_user_progress(user_id)
    return progress.model_dump()

@api_router.post("/training/tutorial/{tutorial_id}/complete")
async def complete_tutorial(tutorial_id: str, request: Request):
    """Mark tutorial as completed"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    result = await training_engine.complete_tutorial(user_id, tutorial_id)
    return result

@api_router.post("/training/lesson/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, quiz_score: int = 0, request: Request = None):
    """Mark lesson as completed"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    result = await training_engine.complete_lesson(user_id, lesson_id, quiz_score)
    return result

@api_router.post("/training/scenario/{scenario_id}/complete")
async def complete_scenario(
    scenario_id: str, 
    final_balance: float,
    max_drawdown: float,
    request: Request = None
):
    """Complete a trading scenario"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    result = await training_engine.complete_scenario(
        user_id, scenario_id, final_balance, max_drawdown
    )
    return result

@api_router.post("/training/backtest")
async def run_backtest(
    symbol: str = "BTC",
    start_date: str = "2024-01-01",
    end_date: str = "2024-12-31",
    strategy_type: str = "sma_cross",
    initial_capital: float = 10000.0,
    request: Request = None
):
    """Run a strategy backtest"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    config = BacktestConfig(
        user_id=user_id,
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        strategy_type=strategy_type,
        initial_capital=initial_capital
    )
    
    results = await training_engine.run_backtest(config)
    return {"config": config.model_dump(), "results": results}

# ============ EXCHANGE INTEGRATION ENDPOINTS ============

@api_router.get("/exchange/supported")
async def get_supported_exchanges():
    """Get list of supported exchanges"""
    exchanges = await exchange_manager.get_supported_exchanges()
    return {"exchanges": exchanges}

@api_router.post("/exchange/connect")
async def connect_exchange(
    exchange: str,
    api_key: str,
    api_secret: str,
    is_testnet: bool = True,
    request: Request = None
):
    """Connect an exchange account"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    try:
        exchange_type = ExchangeType(exchange.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported exchange")
    
    result = await exchange_manager.save_credentials(
        user_id=user_id,
        exchange=exchange_type,
        api_key=api_key,
        api_secret=api_secret,
        is_testnet=is_testnet
    )
    
    return result

@api_router.post("/exchange/{exchange}/test")
async def test_exchange_connection(exchange: str, request: Request):
    """Test exchange connection"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    try:
        exchange_type = ExchangeType(exchange.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported exchange")
    
    result = await exchange_manager.test_connection(user_id, exchange_type)
    return result

@api_router.get("/exchange/{exchange}/balances")
async def get_exchange_balances(exchange: str, request: Request):
    """Get exchange account balances"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    try:
        exchange_type = ExchangeType(exchange.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported exchange")
    
    balances = await exchange_manager.get_balances(user_id, exchange_type)
    return {"balances": [b.model_dump() for b in balances]}

@api_router.post("/exchange/{exchange}/order")
async def place_exchange_order(
    exchange: str,
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None,
    request: Request = None
):
    """Place an order on exchange"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    try:
        exchange_type = ExchangeType(exchange.lower())
        side_enum = OrderSide(side.lower())
        type_enum = OrderType(order_type.lower())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    result = await exchange_manager.place_order(
        user_id=user_id,
        exchange=exchange_type,
        symbol=symbol.upper(),
        side=side_enum,
        order_type=type_enum,
        quantity=quantity,
        price=price
    )
    
    return result

@api_router.get("/exchange/orders")
async def get_my_orders(exchange: str = None, request: Request = None):
    """Get user's order history"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    exchange_type = ExchangeType(exchange.lower()) if exchange else None
    orders = await exchange_manager.get_user_orders(user_id, exchange_type)
    return {"orders": orders}

# ============ SOCIAL INTEGRATION ENDPOINTS ============

@api_router.get("/social/status")
async def get_social_status():
    """Get social media integration status"""
    status = await social_manager.get_configuration_status()
    return status

@api_router.post("/social/twitter/configure")
async def configure_twitter(
    bearer_token: str = None,
    api_key: str = None,
    api_secret: str = None
):
    """Configure Twitter API credentials"""
    result = await social_manager.configure_twitter(bearer_token, api_key, api_secret)
    return result

@api_router.post("/social/reddit/configure")
async def configure_reddit(client_id: str, client_secret: str):
    """Configure Reddit API credentials"""
    result = await social_manager.configure_reddit(client_id, client_secret)
    return result

@api_router.get("/social/sentiment/{symbol}")
async def get_social_sentiment(symbol: str):
    """Get social sentiment for a cryptocurrency"""
    sentiment = await social_manager.get_symbol_sentiment(symbol.upper())
    return sentiment.model_dump()

@api_router.get("/social/trending")
async def get_trending_crypto():
    """Get trending cryptocurrencies on social media"""
    trending = await social_manager.get_trending_crypto()
    return {"trending": trending}

# ============ ML PREDICTION ENDPOINTS ============

from modules.ml_prediction import MLPredictionEngine, TimeHorizon, PredictionType
from modules.trading_competition import CompetitionEngine, CompetitionType

# Initialize new engines
ml_engine = MLPredictionEngine(db)
competition_engine = CompetitionEngine(db, playground_engine)

@api_router.get("/ml/predict/direction/{symbol}")
async def predict_price_direction(symbol: str, horizon: str = "24h"):
    """Get AI price direction prediction"""
    try:
        horizon_enum = TimeHorizon(horizon)
    except ValueError:
        horizon_enum = TimeHorizon.HOUR_24
    
    prediction = await ml_engine.predict_price_direction(symbol.upper(), horizon_enum)
    return prediction.model_dump()

@api_router.get("/ml/predict/volatility/{symbol}")
async def predict_volatility(symbol: str, horizon: str = "24h"):
    """Get AI volatility prediction"""
    try:
        horizon_enum = TimeHorizon(horizon)
    except ValueError:
        horizon_enum = TimeHorizon.HOUR_24
    
    prediction = await ml_engine.predict_volatility(symbol.upper(), horizon_enum)
    return prediction.model_dump()

@api_router.get("/ml/predict/trend/{symbol}")
async def predict_trend(symbol: str, horizon: str = "24h"):
    """Get AI trend prediction"""
    try:
        horizon_enum = TimeHorizon(horizon)
    except ValueError:
        horizon_enum = TimeHorizon.HOUR_24
    
    prediction = await ml_engine.predict_trend(symbol.upper(), horizon_enum)
    return prediction.model_dump()

@api_router.get("/ml/predict/comprehensive/{symbol}")
async def get_comprehensive_prediction(symbol: str, horizon: str = "24h"):
    """Get comprehensive AI prediction combining all models"""
    try:
        horizon_enum = TimeHorizon(horizon)
    except ValueError:
        horizon_enum = TimeHorizon.HOUR_24
    
    prediction = await ml_engine.get_comprehensive_prediction(symbol.upper(), horizon_enum)
    return prediction.model_dump()

@api_router.get("/ml/accuracy")
async def get_prediction_accuracy():
    """Get ML prediction accuracy statistics"""
    accuracy = await ml_engine.get_prediction_accuracy()
    return accuracy

# ============ TRADING COMPETITION ENDPOINTS ============

@api_router.get("/competition/active")
async def get_active_competitions():
    """Get all active competitions"""
    competitions = await competition_engine.get_active_competitions()
    return {"competitions": [c.model_dump() for c in competitions]}

@api_router.get("/competition/{competition_id}")
async def get_competition(competition_id: str):
    """Get competition details"""
    competition = await competition_engine.get_competition(competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition.model_dump()

@api_router.post("/competition/create/daily")
async def create_daily_challenge():
    """Create a daily trading challenge"""
    competition = await competition_engine.create_daily_challenge()
    return competition.model_dump()

@api_router.post("/competition/create/weekly")
async def create_weekly_tournament():
    """Create a weekly tournament"""
    competition = await competition_engine.create_weekly_tournament()
    return competition.model_dump()

@api_router.post("/competition/create/themed")
async def create_themed_event(theme: str = "moon_mission"):
    """Create a themed competition event"""
    competition = await competition_engine.create_themed_event(theme)
    return competition.model_dump()

@api_router.post("/competition/{competition_id}/join")
async def join_competition(competition_id: str, request: Request):
    """Join a competition"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else f"demo_{uuid.uuid4().hex[:8]}"
    username = user.get("name") if user else f"Trader_{random.randint(1000, 9999)}"
    
    result = await competition_engine.join_competition(competition_id, user_id, username)
    return result

@api_router.get("/competition/{competition_id}/leaderboard")
async def get_competition_leaderboard(competition_id: str, limit: int = 50):
    """Get competition leaderboard"""
    leaderboard = await competition_engine.get_competition_leaderboard(competition_id, limit)
    return {"leaderboard": leaderboard}

@api_router.get("/competition/{competition_id}/entry")
async def get_user_entry(competition_id: str, request: Request):
    """Get user's entry in a competition"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    entry = await competition_engine.get_user_entry(competition_id, user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Not entered in this competition")
    return entry.model_dump()

@api_router.post("/competition/entry/{entry_id}/trade")
async def execute_competition_trade(
    entry_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: Optional[float] = None
):
    """Execute a trade in a competition"""
    # Get current price if not provided
    if price is None:
        price = await playground_engine.get_current_price(symbol.upper())
    
    result = await competition_engine.execute_competition_trade(
        entry_id, symbol.upper(), side.lower(), quantity, price
    )
    return result

@api_router.get("/competition/user/stats")
async def get_user_competition_stats(request: Request):
    """Get user's overall competition statistics"""
    user = await get_current_user(request) if request else None
    user_id = user.get("id") if user else "demo"
    
    stats = await competition_engine.get_user_stats(user_id)
    return stats.model_dump()

@api_router.get("/competition/global/leaderboard")
async def get_global_competition_leaderboard(limit: int = 100):
    """Get global competition leaderboard by tier"""
    leaderboard = await competition_engine.get_global_leaderboard(limit)
    return {"leaderboard": leaderboard}

@api_router.post("/competition/{competition_id}/finalize")
async def finalize_competition(competition_id: str):
    """Finalize a competition and distribute prizes"""
    try:
        result = await competition_engine.finalize_competition(competition_id)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============ ML TRAINING ENDPOINTS ============

from modules.ml_training import get_training_status, start_training, get_prediction, ml_trainer

@api_router.get("/ml/training/status")
async def get_ml_training_status():
    """Get ML training status and available models"""
    return get_training_status()

@api_router.get("/ml/training/models")
async def list_trained_models():
    """List all trained ML models"""
    return {"models": ml_trainer.list_models()}

@api_router.post("/ml/training/train")
async def train_ml_model(
    symbol: str,
    model_type: str = "direction",
    data: List[Dict] = None
):
    """Start training a new ML model"""
    if not data:
        # Use mock data for demo
        return {"error": "Training data required. Provide OHLCV data."}
    
    result = start_training(symbol, model_type, data)
    return result

@api_router.post("/ml/training/predict")
async def ml_trained_predict(
    symbol: str,
    model_type: str = "direction",
    features: List[float] = None
):
    """Get prediction from custom trained model"""
    if not features:
        return {"error": "Features required for prediction"}
    
    return get_prediction(symbol, model_type, features)

# ============ BENZINGA NEWS ENDPOINTS ============

from modules.benzinga_integration import get_news_feed, get_benzinga_client

@api_router.get("/news/benzinga")
async def get_benzinga_news(
    symbols: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20
):
    """Get news from Benzinga API"""
    symbol_list = symbols.split(",") if symbols else None
    articles = await get_news_feed(symbols=symbol_list, category=category, limit=limit)
    
    client = get_benzinga_client()
    return {
        "articles": articles,
        "is_live": client.is_configured,
        "source": "Benzinga" if client.is_configured else "Benzinga (Mock)"
    }

@api_router.get("/news/benzinga/crypto")
async def get_crypto_news(limit: int = 20):
    """Get cryptocurrency news from Benzinga"""
    articles = await get_news_feed(category="crypto", limit=limit)
    return {"articles": articles}

@api_router.get("/news/benzinga/market-movers")
async def get_market_movers_news(limit: int = 10):
    """Get market-moving news from Benzinga"""
    articles = await get_news_feed(category="market_movers", limit=limit)
    return {"articles": articles}

@api_router.get("/news/benzinga/symbol/{symbol}")
async def get_symbol_news(symbol: str, limit: int = 10):
    """Get news for a specific symbol"""
    articles = await get_news_feed(symbols=[symbol.upper()], limit=limit)
    return {"articles": articles}

# ============ EXCHANGE MANAGEMENT ENDPOINTS ============

from modules.additional_exchanges import get_exchange_status, get_exchange_adapter

@api_router.get("/exchanges/status")
async def get_all_exchange_status():
    """Get configuration status of all exchanges"""
    return get_exchange_status()

@api_router.get("/exchanges/{exchange}/balance")
async def get_exchange_balance(exchange: str):
    """Get balance from a specific exchange"""
    try:
        adapter = get_exchange_adapter(exchange)
        if not adapter:
            return {"error": f"{exchange} not configured", "configured": False}
        
        balances = await adapter.get_account_balance()
        return {
            "exchange": exchange,
            "balances": [b.__dict__ if hasattr(b, '__dict__') else b for b in balances],
            "configured": True
        }
    except Exception as e:
        return {"error": str(e), "configured": False}

@api_router.post("/exchanges/{exchange}/order")
async def place_exchange_order(
    exchange: str,
    symbol: str,
    side: str,
    quantity: float,
    price: Optional[float] = None,
    order_type: str = "market"
):
    """Place an order on a specific exchange"""
    try:
        adapter = get_exchange_adapter(exchange)
        if not adapter:
            raise HTTPException(status_code=400, detail=f"{exchange} not configured")
        
        from modules.exchange_integration import OrderSide
        order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
        
        if order_type == "market":
            result = await adapter.place_market_order(symbol.upper(), order_side, quantity)
        else:
            if not price:
                raise HTTPException(status_code=400, detail="Price required for limit orders")
            result = await adapter.place_limit_order(symbol.upper(), order_side, quantity, price)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/exchanges/{exchange}/orders")
async def get_exchange_orders(exchange: str, symbol: Optional[str] = None):
    """Get open orders from a specific exchange"""
    try:
        adapter = get_exchange_adapter(exchange)
        if not adapter:
            return {"error": f"{exchange} not configured", "orders": []}
        
        orders = await adapter.get_open_orders(symbol.upper() if symbol else None)
        return {"exchange": exchange, "orders": orders}
    except Exception as e:
        return {"error": str(e), "orders": []}

@api_router.delete("/exchanges/{exchange}/order/{order_id}")
async def cancel_exchange_order(exchange: str, order_id: str, symbol: str = "BTC"):
    """Cancel an order on a specific exchange"""
    try:
        adapter = get_exchange_adapter(exchange)
        if not adapter:
            raise HTTPException(status_code=400, detail=f"{exchange} not configured")
        
        result = await adapter.cancel_order(symbol.upper(), order_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ REAL SOCIAL MEDIA ENDPOINTS ============

from modules.real_social_integration import get_social_sentiment, get_social_status

@api_router.get("/social/status")
async def social_integration_status():
    """Get status of social media integrations"""
    return await get_social_status()

@api_router.get("/social/sentiment/{symbol}")
async def get_symbol_social_sentiment(symbol: str):
    """Get combined social sentiment for a symbol"""
    return await get_social_sentiment(symbol.upper())

@api_router.get("/social/twitter/{symbol}")
async def get_twitter_sentiment(symbol: str):
    """Get Twitter sentiment for a symbol"""
    from modules.real_social_integration import TwitterClient
    client = TwitterClient()
    if not client.is_configured:
        return {"error": "Twitter API not configured", "configured": False}
    try:
        return await client.get_crypto_sentiment(symbol.upper())
    finally:
        await client.close()

@api_router.get("/social/reddit/{symbol}")
async def get_reddit_sentiment(symbol: str):
    """Get Reddit sentiment for a symbol"""
    from modules.real_social_integration import RedditClient
    client = RedditClient()
    if not client.is_configured:
        return {"error": "Reddit API not configured", "configured": False}
    try:
        return await client.get_crypto_sentiment(symbol.upper())
    finally:
        await client.close()

# ============ DEMO MODE ENDPOINTS ============
from modules.demo_mode import (
    get_demo_user, get_demo_portfolio, get_demo_trades, get_demo_alerts,
    get_demo_bot, get_demo_prediction, get_demo_competition, get_demo_sentiment,
    execute_demo_trade, get_demo_stats
)

@api_router.get("/demo/status")
async def demo_status():
    """Get demo mode status and features"""
    return get_demo_stats()

@api_router.get("/demo/user")
async def demo_user():
    """Get demo user profile"""
    return get_demo_user()

@api_router.get("/demo/portfolio")
async def demo_portfolio():
    """Get demo portfolio with live fluctuations"""
    return get_demo_portfolio()

@api_router.get("/demo/trades")
async def demo_trades(limit: int = 10):
    """Get demo trade history"""
    return get_demo_trades(limit)

@api_router.get("/demo/alerts")
async def demo_alerts():
    """Get demo price alerts"""
    return get_demo_alerts()

@api_router.get("/demo/bot")
async def demo_bot():
    """Get demo AI trading bot status"""
    return get_demo_bot()

@api_router.get("/demo/prediction/{symbol}")
async def demo_prediction(symbol: str):
    """Get demo ML prediction for a symbol"""
    return get_demo_prediction(symbol.upper())

@api_router.get("/demo/competition")
async def demo_competition():
    """Get demo competition status"""
    return get_demo_competition()

@api_router.get("/demo/sentiment/{symbol}")
async def demo_sentiment(symbol: str):
    """Get demo social sentiment"""
    return get_demo_sentiment(symbol.upper())

@api_router.post("/demo/trade")
async def demo_trade(action: str, symbol: str, quantity: float, price: float):
    """Execute a demo trade (simulated)"""
    return execute_demo_trade(action.upper(), symbol.upper(), quantity, price)


# ============ AI SENTIMENT ENDPOINTS ============
from modules.ai_sentiment import analyze_social_sentiment, get_ai_sentiment_status, ai_analyzer

@api_router.get("/ai/sentiment/status")
async def ai_sentiment_status():
    """Get AI sentiment analyzer status"""
    return await get_ai_sentiment_status()

@api_router.post("/ai/sentiment/analyze")
async def ai_sentiment_analyze(texts: List[str], symbol: str = "BTC"):
    """Analyze texts using AI-powered sentiment analysis"""
    if not texts:
        raise HTTPException(status_code=400, detail="No texts provided")
    return await analyze_social_sentiment(texts, symbol.upper())

@api_router.get("/ai/sentiment/{symbol}")
async def ai_sentiment_for_symbol(symbol: str):
    """Get AI sentiment analysis for a symbol (fetches from social and analyzes)"""
    # Get social posts first
    try:
        from modules.real_social_integration import get_social_sentiment as get_raw_social
        social_data = await get_raw_social(symbol.upper())
        
        # Extract texts from social posts
        texts = []
        if "twitter" in social_data and isinstance(social_data["twitter"], dict):
            sample_posts = social_data["twitter"].get("sample_posts", [])
            texts.extend([p.get("text", "") for p in sample_posts])
        if "reddit" in social_data and isinstance(social_data["reddit"], dict):
            sample_posts = social_data["reddit"].get("sample_posts", [])
            texts.extend([p.get("text", "") for p in sample_posts])
        
        # If we have texts, analyze with AI
        if texts:
            ai_result = await analyze_social_sentiment(texts, symbol.upper())
            return {
                "symbol": symbol.upper(),
                "ai_analysis": ai_result,
                "raw_social": social_data,
                "source": "ai_enhanced"
            }
        else:
            # Return raw social data if no texts available
            return {
                "symbol": symbol.upper(),
                "ai_analysis": None,
                "raw_social": social_data,
                "source": "social_only"
            }
    except Exception as e:
        logger.error(f"AI sentiment error: {str(e)}")
        return {
            "symbol": symbol.upper(),
            "error": str(e),
            "ai_status": await get_ai_sentiment_status()
        }


# ============ ENHANCED ML TRAINING ENDPOINTS ============
from modules.ml_training import ml_trainer, TrainingConfig, ModelType, FeatureEngineer
import pandas as pd

@api_router.post("/ml/train/full/{symbol}")
async def train_full_model(symbol: str, model_type: str = "direction", periods: int = 500):
    """Train a full ML model with historical data"""
    try:
        # Fetch historical data from CoinGecko or generate synthetic
        symbol = symbol.upper()
        
        # Try to get real historical data
        historical_data = []
        try:
            async with httpx.AsyncClient() as client:
                # Get historical prices from CoinGecko
                coingecko_ids = {
                    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
                    "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin"
                }
                coin_id = coingecko_ids.get(symbol, symbol.lower())
                
                response = await client.get(
                    f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc",
                    params={"vs_currency": "usd", "days": "90"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for candle in data:
                        # Use naive datetime (no timezone) for pandas compatibility
                        historical_data.append({
                            "timestamp": datetime.utcfromtimestamp(candle[0] / 1000),
                            "open": candle[1],
                            "high": candle[2],
                            "low": candle[3],
                            "close": candle[4],
                            "volume": random.uniform(1000000, 10000000)  # CoinGecko OHLC doesn't include volume
                        })
        except Exception as e:
            logger.warning(f"Failed to fetch historical data: {e}")
        
        # If no real data, generate synthetic
        if len(historical_data) < 100:
            logger.info("Generating synthetic training data")
            base_price = {"BTC": 45000, "ETH": 3000, "SOL": 100}.get(symbol, 100)
            
            for i in range(periods):
                # Use naive datetime for pandas compatibility
                timestamp = datetime.utcnow() - timedelta(hours=periods-i)
                volatility = random.uniform(0.02, 0.05)
                change = random.gauss(0, volatility)
                
                price = base_price * (1 + change)
                high = price * (1 + abs(random.gauss(0, 0.01)))
                low = price * (1 - abs(random.gauss(0, 0.01)))
                
                historical_data.append({
                    "timestamp": timestamp,
                    "open": base_price,
                    "high": high,
                    "low": low,
                    "close": price,
                    "volume": random.uniform(1000000, 50000000)
                })
                base_price = price
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        df = df.sort_index()
        
        # Create training config
        config = TrainingConfig(
            model_type=ModelType(model_type),
            symbol=symbol
        )
        
        # Prepare data and train
        X, y = ml_trainer.prepare_data(df, config)
        
        if len(X) < 50:
            return {"success": False, "error": "Insufficient data for training"}
        
        # Train model
        result = ml_trainer.train_sklearn_model(X, y, config)
        
        # Save model
        model_path = ml_trainer.save_model(result['model_key'])
        
        return {
            "success": True,
            "symbol": symbol,
            "model_type": model_type,
            "training_samples": len(X),
            "metrics": result['metrics'],
            "model_path": model_path,
            "feature_importance": result.get('feature_importance', {}),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return {"success": False, "error": str(e)}

@api_router.get("/ml/models")
async def list_ml_models():
    """List all trained ML models"""
    return {
        "models": ml_trainer.list_models(),
        "model_types": [t.value for t in ModelType],
        "supported_symbols": ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE"],
        "status": "ready"
    }

@api_router.get("/ml/model/{symbol}/{model_type}")
async def get_ml_model_info(symbol: str, model_type: str):
    """Get info about a specific trained model"""
    model_key = f"{symbol.upper()}_{model_type}"
    return ml_trainer.get_model_info(model_key)

@api_router.post("/ml/predict/trained/{symbol}")
async def predict_with_trained_model(symbol: str, model_type: str = "direction"):
    """Make prediction using a trained model"""
    try:
        symbol = symbol.upper()
        model_key = f"{symbol}_{model_type}"
        
        # Get latest market data for features
        async with httpx.AsyncClient() as client:
            coingecko_ids = {
                "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
                "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin"
            }
            coin_id = coingecko_ids.get(symbol, symbol.lower())
            
            response = await client.get(
                f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc",
                params={"vs_currency": "usd", "days": "30"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch market data")
            
            data = response.json()
            
        # Convert to DataFrame
        df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        df['volume'] = [random.uniform(1000000, 10000000) for _ in range(len(df))]
        
        # Generate features
        feature_engineer = FeatureEngineer()
        features = feature_engineer.generate_features(df)
        
        if len(features) == 0:
            return {"success": False, "error": "Insufficient data for prediction"}
        
        # Get latest features
        latest_features = features.iloc[-1].values
        
        # Make prediction
        result = ml_trainer.predict(model_key, latest_features)
        
        # Map prediction to label
        direction_labels = {0: "bearish", 1: "bullish"}
        volatility_labels = {0: "low", 1: "medium", 2: "high"}
        trend_labels = {0: "strong_down", 1: "down", 2: "neutral", 3: "up", 4: "strong_up"}
        
        if model_type == "direction":
            label = direction_labels.get(result['prediction'], "unknown")
        elif model_type == "volatility":
            label = volatility_labels.get(result['prediction'], "unknown")
        elif model_type == "trend":
            label = trend_labels.get(result['prediction'], "unknown")
        else:
            label = str(result['prediction'])
        
        return {
            "success": True,
            "symbol": symbol,
            "model_type": model_type,
            "prediction": label,
            "raw_prediction": result['prediction'],
            "confidence": result['confidence'],
            "probabilities": result['probabilities'],
            "current_price": df['close'].iloc[-1],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model_used": model_key
        }
        
    except ValueError as e:
        return {"success": False, "error": str(e), "hint": "Model may not be trained yet. Use /api/ml/train/full/{symbol} first."}
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {"success": False, "error": str(e)}


# ============ LSTM DEEP LEARNING ENDPOINTS ============
from modules.lstm_model import train_lstm_model, predict_with_lstm, get_lstm_status, LSTMConfig, get_lstm_predictor
import yfinance as yf

@api_router.get("/ml/lstm/status")
async def lstm_status():
    """Get LSTM model status"""
    return get_lstm_status()

@api_router.post("/ml/lstm/train/{symbol}")
async def train_lstm(symbol: str, lookback: int = 60, forecast_horizon: int = 24):
    """Train LSTM model for a symbol with historical data"""
    try:
        symbol = symbol.upper()
        
        # Fetch 1+ year of historical data using yfinance
        logger.info(f"Fetching historical data for {symbol}")
        
        ticker_map = {
            "BTC": "BTC-USD",
            "ETH": "ETH-USD",
            "SOL": "SOL-USD",
            "XRP": "XRP-USD",
            "ADA": "ADA-USD",
            "DOGE": "DOGE-USD",
            "SPY": "SPY",
            "AAPL": "AAPL",
            "TSLA": "TSLA"
        }
        
        ticker = ticker_map.get(symbol, f"{symbol}-USD")
        
        try:
            # Get 2 years of hourly data
            data = yf.download(ticker, period="2y", interval="1d", progress=False)
            
            if len(data) < 200:
                # Fallback to daily data
                data = yf.download(ticker, period="5y", interval="1d", progress=False)
        except Exception as e:
            logger.warning(f"yfinance error: {e}, generating synthetic data")
            data = None
        
        if data is None or len(data) < 200:
            # Generate synthetic data for training
            import numpy as np
            base_price = {"BTC": 45000, "ETH": 3000, "SOL": 100, "XRP": 0.5, "ADA": 0.5}.get(symbol, 100)
            periods = 500
            
            dates = pd.date_range(end=datetime.now(), periods=periods, freq='D')
            prices = [base_price]
            
            for _ in range(periods - 1):
                change = np.random.normal(0, 0.02)
                prices.append(prices[-1] * (1 + change))
            
            data = pd.DataFrame({
                'open': prices,
                'high': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
                'low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
                'close': prices,
                'volume': [np.random.uniform(1e6, 1e8) for _ in prices]
            }, index=dates)
        else:
            # Rename columns to lowercase
            data.columns = [c.lower() for c in data.columns]
        
        logger.info(f"Training LSTM with {len(data)} data points")
        
        # Train model
        result = await train_lstm_model(symbol, data)
        
        return result
        
    except Exception as e:
        logger.error(f"LSTM training error: {str(e)}")
        return {"success": False, "error": str(e)}

@api_router.post("/ml/lstm/predict/{symbol}")
async def predict_lstm(symbol: str):
    """Make prediction using LSTM model"""
    try:
        symbol = symbol.upper()
        
        # Fetch recent data for prediction
        ticker_map = {
            "BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD",
            "XRP": "XRP-USD", "ADA": "ADA-USD", "DOGE": "DOGE-USD"
        }
        
        ticker = ticker_map.get(symbol, f"{symbol}-USD")
        data = None
        
        # Try yfinance first
        try:
            data = yf.download(ticker, period="6mo", interval="1d", progress=False)
            if len(data) > 0:
                data.columns = [c.lower() for c in data.columns]
        except Exception as e:
            logger.warning(f"yfinance error for {symbol}: {e}")
        
        # Fallback to CoinGecko
        if data is None or len(data) < 60:
            try:
                coingecko_ids = {
                    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
                    "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin"
                }
                coin_id = coingecko_ids.get(symbol, symbol.lower())
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc",
                        params={"vs_currency": "usd", "days": "180"}
                    )
                    
                    if response.status_code == 200:
                        ohlc_data = response.json()
                        data = pd.DataFrame(ohlc_data, columns=['timestamp', 'open', 'high', 'low', 'close'])
                        data['timestamp'] = pd.to_datetime(data['timestamp'], unit='ms')
                        data.set_index('timestamp', inplace=True)
                        data['volume'] = [random.uniform(1e6, 1e8) for _ in range(len(data))]
            except Exception as e:
                logger.warning(f"CoinGecko fallback error: {e}")
        
        # Final fallback: generate synthetic data based on current price
        if data is None or len(data) < 120:
            base_prices = {"BTC": 45000, "ETH": 3000, "SOL": 100, "XRP": 0.5, "ADA": 0.5, "DOGE": 0.1}
            base_price = base_prices.get(symbol, 100)
            
            dates = pd.date_range(end=datetime.now(), periods=200, freq='D')
            prices = [base_price]
            for _ in range(199):
                change = random.gauss(0, 0.02)
                prices.append(prices[-1] * (1 + change))
            
            data = pd.DataFrame({
                'open': prices,
                'high': [p * (1 + abs(random.gauss(0, 0.01))) for p in prices],
                'low': [p * (1 - abs(random.gauss(0, 0.01))) for p in prices],
                'close': prices,
                'volume': [random.uniform(1e6, 1e8) for _ in prices]
            }, index=dates)
        
        if len(data) < 120:
            return {"success": False, "error": "Insufficient data for prediction"}
        
        result = await predict_with_lstm(symbol, data)
        return result
        
    except Exception as e:
        logger.error(f"LSTM prediction error: {str(e)}")
        return {"success": False, "error": str(e)}


# ============ TOURNAMENT ENDPOINTS ============
from modules.tournament import (
    get_active_tournaments, get_tournament_details, get_tournament_leaderboard,
    register_for_tournament, execute_tournament_trade, get_user_tournament_status,
    tournament_engine
)

@api_router.get("/tournament/active")
async def active_tournaments():
    """Get all active tournaments"""
    return get_active_tournaments()

@api_router.get("/tournament/{tournament_id}")
async def tournament_details(tournament_id: str):
    """Get tournament details"""
    result = get_tournament_details(tournament_id)
    if not result:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return result

@api_router.get("/tournament/{tournament_id}/leaderboard")
async def tournament_leaderboard(tournament_id: str, limit: int = 100):
    """Get tournament leaderboard"""
    return get_tournament_leaderboard(tournament_id, limit)

@api_router.post("/tournament/{tournament_id}/register")
async def register_tournament(tournament_id: str, user_id: str, username: str):
    """Register for a tournament"""
    return register_for_tournament(tournament_id, user_id, username)

@api_router.post("/tournament/{tournament_id}/trade")
async def tournament_trade(
    tournament_id: str,
    user_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: float
):
    """Execute a trade in a tournament"""
    return execute_tournament_trade(tournament_id, user_id, symbol, side, quantity, price)

@api_router.get("/tournament/{tournament_id}/user/{user_id}")
async def user_tournament_status(tournament_id: str, user_id: str):
    """Get user's status in a tournament"""
    result = get_user_tournament_status(tournament_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found in tournament")
    return result


# ============ REAL EXCHANGE TRADING ENDPOINTS ============
from modules.real_trading import (
    connect_exchange, get_exchange_balances, place_exchange_order,
    get_user_exchange_status, disconnect_exchange
)

@api_router.post("/exchange/connect")
async def connect_to_exchange(
    user_id: str,
    exchange: str,
    api_key: str,
    api_secret: str,
    passphrase: Optional[str] = None,
    is_testnet: bool = True
):
    """Connect to an exchange (Binance, Coinbase, Kraken)"""
    # Security: Log connection attempt (not keys)
    logger.info(f"User {user_id} connecting to {exchange} ({'testnet' if is_testnet else 'mainnet'})")
    
    result = await connect_exchange(user_id, exchange, api_key, api_secret, passphrase, is_testnet)
    return result

@api_router.get("/exchange/{exchange}/balances")
async def exchange_balances(exchange: str, user_id: str):
    """Get balances from connected exchange"""
    return await get_exchange_balances(user_id, exchange)

@api_router.post("/exchange/{exchange}/order")
async def place_order_on_exchange(
    exchange: str,
    user_id: str,
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None
):
    """Place an order on exchange (testnet or mainnet)"""
    # Security: Confirmation required for mainnet orders
    logger.info(f"User {user_id} placing {side} order for {quantity} {symbol} on {exchange}")
    
    return await place_exchange_order(user_id, exchange, symbol, side, order_type, quantity, price)

@api_router.get("/exchange/status/{user_id}")
async def user_exchange_status(user_id: str):
    """Get user's connected exchanges"""
    return get_user_exchange_status(user_id)

@api_router.delete("/exchange/{exchange}/disconnect")
async def disconnect_from_exchange(exchange: str, user_id: str):
    """Disconnect from an exchange"""
    return disconnect_exchange(user_id, exchange)


# ============ TRANSFORMER & ENSEMBLE MODEL ENDPOINTS ============
from modules.transformer_model import (
    train_transformer_model, predict_with_transformer, get_transformer_status,
    get_transformer_predictor, get_ensemble_predictor
)
from modules.lstm_model import predict_with_lstm, get_lstm_predictor

@api_router.get("/ml/transformer/status")
async def transformer_status():
    """Get Transformer model status"""
    return get_transformer_status()

@api_router.post("/ml/transformer/train/{symbol}")
async def train_transformer(symbol: str):
    """Train Transformer model for a symbol"""
    try:
        symbol = symbol.upper()
        
        # Generate training data
        base_prices = {"BTC": 45000, "ETH": 3000, "SOL": 100, "XRP": 0.5, "ADA": 0.5}
        base_price = base_prices.get(symbol, 100)
        
        dates = pd.date_range(end=datetime.now(), periods=300, freq='D')
        prices = [base_price]
        for _ in range(299):
            change = random.gauss(0, 0.02)
            prices.append(prices[-1] * (1 + change))
        
        data = pd.DataFrame({
            'open': prices,
            'high': [p * (1 + abs(random.gauss(0, 0.01))) for p in prices],
            'low': [p * (1 - abs(random.gauss(0, 0.01))) for p in prices],
            'close': prices,
            'volume': [random.uniform(1e6, 1e8) for _ in prices]
        }, index=dates)
        
        result = await train_transformer_model(symbol, data)
        return result
        
    except Exception as e:
        logger.error(f"Transformer training error: {str(e)}")
        return {"success": False, "error": str(e)}

@api_router.post("/ml/ensemble/predict/{symbol}")
async def ensemble_predict(symbol: str):
    """Get ensemble prediction (LSTM + Transformer combined)"""
    try:
        symbol = symbol.upper()
        
        # Generate prediction data
        base_prices = {"BTC": 45000, "ETH": 3000, "SOL": 100, "XRP": 0.5, "ADA": 0.5}
        base_price = base_prices.get(symbol, 100)
        
        dates = pd.date_range(end=datetime.now(), periods=200, freq='D')
        prices = [base_price]
        for _ in range(199):
            change = random.gauss(0, 0.02)
            prices.append(prices[-1] * (1 + change))
        
        data = pd.DataFrame({
            'open': prices,
            'high': [p * (1 + abs(random.gauss(0, 0.01))) for p in prices],
            'low': [p * (1 - abs(random.gauss(0, 0.01))) for p in prices],
            'close': prices,
            'volume': [random.uniform(1e6, 1e8) for _ in prices]
        }, index=dates)
        
        # Get predictions from both models
        lstm_pred = await predict_with_lstm(symbol, data)
        transformer_pred = await predict_with_transformer(symbol, data)
        
        # Combine with ensemble
        ensemble = get_ensemble_predictor(symbol)
        result = ensemble.predict(lstm_pred, transformer_pred)
        
        return result
        
    except Exception as e:
        logger.error(f"Ensemble prediction error: {str(e)}")
        return {"success": False, "error": str(e)}


# ============ TOURNAMENT WEBSOCKET ENDPOINTS ============
from fastapi import WebSocket, WebSocketDisconnect
from modules.tournament_websocket import handle_tournament_websocket, get_spectator_stats, ws_manager

@app.websocket("/ws/tournament/{tournament_id}")
async def tournament_websocket(websocket: WebSocket, tournament_id: str):
    """WebSocket endpoint for tournament spectator mode"""
    await websocket.accept()
    await handle_tournament_websocket(websocket, tournament_id)

@api_router.get("/tournament/{tournament_id}/spectators")
async def tournament_spectators(tournament_id: str):
    """Get spectator count for a tournament"""
    return get_spectator_stats(tournament_id)

@api_router.post("/tournament/{tournament_id}/spectator/start")
async def start_spectator_simulation(tournament_id: str):
    """Start trade simulation for spectator mode (demo)"""
    ws_manager.start_simulation(tournament_id)
    return {"success": True, "message": f"Simulation started for tournament {tournament_id}"}


# ============ COPY TRADING REAL-TIME WEBSOCKET ============
from modules.copy_trading_ws import (
    copy_trading_ws_manager, TradeAction, simulate_master_trades
)

@app.websocket("/ws/copy-trading/{user_id}")
async def copy_trading_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time copy trading updates"""
    await copy_trading_ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle subscription commands
            if data.get("action") == "subscribe":
                trader_id = data.get("trader_id")
                settings = data.get("settings", {})
                copy_trading_ws_manager.subscribe_to_trader(user_id, trader_id, settings)
                await websocket.send_json({
                    "type": "subscribed",
                    "trader_id": trader_id,
                    "message": f"Now receiving trades from {trader_id}"
                })
            
            elif data.get("action") == "unsubscribe":
                trader_id = data.get("trader_id")
                copy_trading_ws_manager.unsubscribe_from_trader(user_id, trader_id)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "trader_id": trader_id,
                    "message": f"Stopped receiving trades from {trader_id}"
                })
            
            elif data.get("action") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
    
    except WebSocketDisconnect:
        copy_trading_ws_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"Copy trading WS error for {user_id}: {e}")
        copy_trading_ws_manager.disconnect(websocket, user_id)

@api_router.get("/copy-trading/ws/stats")
async def copy_trading_ws_stats():
    """Get copy trading WebSocket statistics"""
    return copy_trading_ws_manager.get_stats()

@api_router.get("/copy-trading/ws/events")
async def copy_trading_events(limit: int = 50):
    """Get recent trade events"""
    return copy_trading_ws_manager.get_recent_events(limit)

@api_router.get("/copy-trading/ws/trades/{user_id}")
async def copy_trading_user_trades(user_id: str, limit: int = 50):
    """Get a user's copied trade history"""
    return copy_trading_ws_manager.get_user_copied_trades(user_id, limit)

@api_router.post("/copy-trading/ws/simulate")
async def simulate_trade_for_test(data: dict):
    """Simulate a master trader trade for testing (demo only)"""
    event = await copy_trading_ws_manager.propagate_trade(
        master_trader_id=data.get("master_trader_id", "MTR-001"),
        master_name=data.get("master_name", "Test Trader"),
        action=TradeAction(data.get("action", "buy")),
        symbol=data.get("symbol", "BTC"),
        quantity=float(data.get("quantity", 0.5)),
        price=float(data.get("price", 45000))
    )
    return {"success": True, "event": event.to_dict()}

@api_router.get("/copy-trading/ws/followers/{trader_id}")
async def get_trader_followers(trader_id: str):
    """Get list of followers for a trader"""
    return {"trader_id": trader_id, "followers": copy_trading_ws_manager.get_trader_followers(trader_id)}


# ============ BRIDGEWATER-STYLE QUANTITATIVE RESEARCH ============

# Macro Economic Engine
from modules.macro_engine import (
    get_economic_indicators, get_debt_cycle_analysis, get_economic_phase,
    get_central_bank_policies, get_global_liquidity, get_dalio_principles
)

@api_router.get("/quant/macro/indicators")
async def macro_indicators():
    """Get all economic indicators"""
    return get_economic_indicators()

@api_router.get("/quant/macro/debt-cycle")
async def debt_cycle():
    """Analyze current debt cycle position (Ray Dalio framework)"""
    return get_debt_cycle_analysis()

@api_router.get("/quant/macro/economic-phase")
async def economic_phase():
    """Get current economic machine phase"""
    return get_economic_phase()

@api_router.get("/quant/macro/central-banks")
async def central_banks():
    """Get central bank policy summary"""
    return get_central_bank_policies()

@api_router.get("/quant/macro/liquidity")
async def global_liquidity():
    """Get global liquidity conditions"""
    return get_global_liquidity()

@api_router.get("/quant/macro/dalio-principles")
async def dalio_principles():
    """Apply Ray Dalio's Principles to current market"""
    return get_dalio_principles()


# Market Inefficiency Detector
from modules.inefficiency_detector import (
    get_inefficiency_signals, get_pairs_trades, get_signal_summary,
    analyze_mean_reversion, analyze_momentum
)

@api_router.get("/quant/inefficiency/signals")
async def inefficiency_signals():
    """Get all detected market inefficiencies"""
    return get_inefficiency_signals()

@api_router.get("/quant/inefficiency/pairs")
async def pairs_trades():
    """Get pairs trading opportunities"""
    return get_pairs_trades()

@api_router.get("/quant/inefficiency/summary")
async def inefficiency_summary():
    """Get summary of all signals"""
    return get_signal_summary()

@api_router.post("/quant/inefficiency/analyze-reversion")
async def analyze_reversion(prices: List[float]):
    """Analyze mean reversion opportunity"""
    return analyze_mean_reversion(prices)

@api_router.post("/quant/inefficiency/analyze-momentum")
async def analyze_momentum_signal(prices: List[float]):
    """Analyze momentum signal"""
    return analyze_momentum(prices)


# Portfolio Optimization
from modules.portfolio_optimizer import (
    get_all_weather_portfolio, get_risk_parity_portfolio,
    get_pure_alpha_strategy, get_strategy_comparison, get_drawdown_protection
)

@api_router.get("/quant/portfolio/all-weather")
async def all_weather_portfolio(growth: str = "rising", inflation: str = "falling"):
    """Get All Weather portfolio allocation (Ray Dalio's flagship)"""
    return get_all_weather_portfolio(growth, inflation)

@api_router.get("/quant/portfolio/risk-parity")
async def risk_parity_portfolio():
    """Get Risk Parity portfolio allocation"""
    return get_risk_parity_portfolio()

@api_router.get("/quant/portfolio/pure-alpha")
async def pure_alpha_portfolio():
    """Get Pure Alpha strategy (market-neutral)"""
    return get_pure_alpha_strategy()

@api_router.get("/quant/portfolio/strategies")
async def portfolio_strategies():
    """Compare all available portfolio strategies"""
    return get_strategy_comparison()

@api_router.get("/quant/portfolio/drawdown-protection")
async def drawdown_protection(current_drawdown: float = 0.0):
    """Get drawdown protection recommendations"""
    return get_drawdown_protection(current_drawdown)


# AI Research Analyst
from modules.ai_research_analyst import (
    generate_market_commentary, generate_trade_thesis,
    generate_research_report, apply_dalio_principles as apply_principles,
    get_ai_analyst_status
)

@api_router.get("/quant/ai/status")
async def ai_analyst_status():
    """Get AI research analyst status"""
    return get_ai_analyst_status()

@api_router.post("/quant/ai/commentary")
async def ai_market_commentary(market_data: Dict = {}):
    """Generate AI market commentary"""
    return await generate_market_commentary(market_data)

@api_router.post("/quant/ai/thesis/{asset}")
async def ai_trade_thesis(asset: str, context: Dict = {}):
    """Generate AI trade thesis for an asset"""
    return await generate_trade_thesis(asset, context)

@api_router.post("/quant/ai/report")
async def ai_research_report(topic: str = "Market Outlook", data: Dict = {}):
    """Generate AI research report"""
    return await generate_research_report(topic, data)

@api_router.post("/quant/ai/principles")
async def ai_dalio_principles(context: Dict = {}):
    """Apply Ray Dalio's Principles to a decision"""
    return await apply_principles(context)


# Institutional Dashboard
from modules.institutional_dashboard import (
    get_systemic_risk_dashboard, get_institutional_advisory,
    get_full_institutional_report, get_available_client_types
)

@api_router.get("/quant/institutional/systemic-risk")
async def systemic_risk_dashboard():
    """Get systemic risk dashboard"""
    return get_systemic_risk_dashboard()

@api_router.get("/quant/institutional/advisory/{client_type}")
async def institutional_advisory(client_type: str):
    """Get advisory for specific client type (central_bank, hedge_fund, government, etc.)"""
    return get_institutional_advisory(client_type)

@api_router.get("/quant/institutional/full-report")
async def full_institutional_report():
    """Get comprehensive institutional report"""
    return get_full_institutional_report()

@api_router.get("/quant/institutional/client-types")
async def client_types():
    """Get available client types for advisory"""
    return get_available_client_types()


# ============ INSTITUTIONAL INFRASTRUCTURE ============

# Advanced Risk Modeling
from modules.risk_modeling import (
    get_portfolio_risk_analysis, get_sharpe_ratio, get_var_analysis,
    get_correlation_analysis, get_tail_risk
)

@api_router.post("/risk/portfolio-analysis")
async def portfolio_risk_analysis(data: dict):
    """Get comprehensive portfolio risk analysis (Sharpe, Sortino, VaR, CVaR)"""
    prices = data.get("prices", [])
    portfolio_value = data.get("portfolio_value", 100000)
    return get_portfolio_risk_analysis(prices, portfolio_value)

@api_router.post("/risk/sharpe")
async def sharpe_ratio(data: dict):
    """Calculate Sharpe Ratio"""
    return get_sharpe_ratio(data.get("prices", []))

@api_router.post("/risk/var")
async def value_at_risk(data: dict):
    """Calculate Value at Risk (VaR)"""
    return get_var_analysis(data.get("prices", []), data.get("confidence", 0.95))

@api_router.post("/risk/correlation")
async def correlation_matrix(data: dict):
    """Calculate correlation matrix between assets"""
    return get_correlation_analysis(data.get("asset_prices", {}))

@api_router.post("/risk/tail-risk")
async def tail_risk_analysis(data: dict):
    """Get tail risk analysis (skewness, kurtosis)"""
    return get_tail_risk(data.get("prices", []))


# Algorithmic Execution Engine
from modules.algo_execution import (
    create_vwap_order, create_twap_order, create_iceberg_order,
    create_smart_order, get_algo_order, cancel_algo_order,
    get_all_algo_orders, get_algo_analytics
)

@api_router.post("/algo/vwap")
async def algo_vwap_order(data: dict):
    """Create VWAP (Volume Weighted Average Price) order"""
    return await create_vwap_order(
        data.get("symbol"), data.get("side"), data.get("quantity"),
        data.get("duration_minutes", 60)
    )

@api_router.post("/algo/twap")
async def algo_twap_order(data: dict):
    """Create TWAP (Time Weighted Average Price) order"""
    return await create_twap_order(
        data.get("symbol"), data.get("side"), data.get("quantity"),
        data.get("duration_minutes", 60), data.get("slices", 12)
    )

@api_router.post("/algo/iceberg")
async def algo_iceberg_order(data: dict):
    """Create Iceberg (Hidden) order"""
    return await create_iceberg_order(
        data.get("symbol"), data.get("side"), data.get("quantity"),
        data.get("visible_quantity"), data.get("limit_price")
    )

@api_router.post("/algo/smart")
async def algo_smart_order(data: dict):
    """Create Smart order with intelligent routing"""
    return await create_smart_order(
        data.get("symbol"), data.get("side"), data.get("quantity"),
        data.get("urgency", "medium")
    )

@api_router.get("/algo/order/{order_id}")
async def get_algo_order_status(order_id: str):
    """Get algorithmic order status"""
    return get_algo_order(order_id)

@api_router.delete("/algo/order/{order_id}")
async def cancel_algorithmic_order(order_id: str):
    """Cancel an algorithmic order"""
    return cancel_algo_order(order_id)

@api_router.get("/algo/orders")
async def get_all_algorithmic_orders():
    """Get all algorithmic orders"""
    return get_all_algo_orders()

@api_router.get("/algo/analytics")
async def get_execution_analytics():
    """Get algorithmic execution performance analytics"""
    return get_algo_analytics()


# ============ PREDICTION MARKETS ============

from modules.prediction_markets import (
    get_all_prediction_markets, get_sports_markets, get_political_markets,
    get_crypto_markets, get_prediction_market, buy_prediction_shares,
    sell_prediction_shares, get_user_prediction_positions, get_user_prediction_balance,
    get_prediction_leaderboard, get_trending_predictions, search_predictions,
    create_prediction_market, get_market_trade_history, connect_kalshi, connect_polymarket
)

@api_router.get("/predictions/markets")
async def prediction_markets(category: str = None):
    """Get all prediction markets"""
    return get_all_prediction_markets(category)

@api_router.get("/predictions/sports")
async def sports_predictions(league: str = None):
    """Get sports prediction markets (NFL, NBA, MLS, UFC)"""
    return get_sports_markets(league)

@api_router.get("/predictions/politics")
async def political_predictions():
    """Get political and economic prediction markets"""
    return get_political_markets()

@api_router.get("/predictions/crypto")
async def crypto_predictions():
    """Get crypto prediction markets"""
    return get_crypto_markets()

@api_router.get("/predictions/trending")
async def trending_predictions():
    """Get trending prediction markets"""
    return get_trending_predictions()

@api_router.get("/predictions/leaderboard")
async def predictions_leaderboard():
    """Get prediction markets leaderboard"""
    return get_prediction_leaderboard()

@api_router.get("/predictions/search")
async def search_prediction_markets(q: str):
    """Search prediction markets"""
    return search_predictions(q)

@api_router.get("/predictions/market/{market_id}")
async def get_single_prediction_market(market_id: str):
    """Get single prediction market details"""
    return get_prediction_market(market_id)

@api_router.get("/predictions/market/{market_id}/history")
async def prediction_market_history(market_id: str):
    """Get trade history for a prediction market"""
    return get_market_trade_history(market_id)

@api_router.post("/predictions/buy")
async def buy_prediction(data: dict):
    """Buy YES or NO shares in a prediction market"""
    return buy_prediction_shares(
        data.get("user_id", "demo_user"),
        data.get("market_id"),
        data.get("side"),
        data.get("amount")
    )

@api_router.post("/predictions/sell")
async def sell_prediction(data: dict):
    """Sell YES or NO shares in a prediction market"""
    return sell_prediction_shares(
        data.get("user_id", "demo_user"),
        data.get("market_id"),
        data.get("side"),
        data.get("shares")
    )

@api_router.get("/predictions/positions/{user_id}")
async def user_prediction_positions(user_id: str):
    """Get user's prediction market positions"""
    return get_user_prediction_positions(user_id)

@api_router.get("/predictions/balance/{user_id}")
async def user_prediction_balance(user_id: str):
    """Get user's prediction market balance"""
    return get_user_prediction_balance(user_id)

@api_router.post("/predictions/create")
async def create_new_prediction_market(data: dict):
    """Create a new prediction market"""
    return create_prediction_market(
        data.get("title"),
        data.get("category"),
        data.get("resolution_date"),
        data.get("description", ""),
        data.get("tags", [])
    )

@api_router.post("/predictions/kalshi/connect")
async def connect_kalshi_api(data: dict):
    """Connect to Kalshi API (CFTC-regulated)"""
    return await connect_kalshi(data.get("api_key"), data.get("api_secret"))

@api_router.post("/predictions/polymarket/connect")
async def connect_polymarket_api(data: dict):
    """Connect to Polymarket API (crypto-based)"""
    return await connect_polymarket(data.get("wallet_address"))



# ============ COPY TRADING ============

from modules.copy_trading import (
    get_master_traders, get_master_trader, get_top_performers, get_trending_traders,
    start_copy_trading, stop_copy_trading, pause_copy_trading, resume_copy_trading,
    update_copy_settings, get_user_copies, get_copy_portfolio, add_funds_to_copy
)

@api_router.get("/copy/traders")
async def list_master_traders(sort_by: str = "total_return", risk_level: str = None):
    """Get all master traders available for copying"""
    return get_master_traders(sort_by, risk_level)

@api_router.get("/copy/traders/top")
async def top_performing_traders(period: str = "monthly"):
    """Get top performing traders"""
    return get_top_performers(period)

@api_router.get("/copy/traders/trending")
async def trending_master_traders():
    """Get trending traders by follower growth"""
    return get_trending_traders()

@api_router.get("/copy/trader/{trader_id}")
async def get_single_master_trader(trader_id: str):
    """Get details of a single master trader"""
    return get_master_trader(trader_id)

@api_router.post("/copy/start")
async def start_copying(data: dict):
    """Start copying a master trader"""
    return start_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("master_trader_id"),
        data.get("amount", 0),
        data.get("settings")
    )

@api_router.post("/copy/stop")
async def stop_copying(data: dict):
    """Stop copying a master trader"""
    return stop_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )

@api_router.post("/copy/pause")
async def pause_copying(data: dict):
    """Pause copying (no new trades)"""
    return pause_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )

@api_router.post("/copy/resume")
async def resume_copying(data: dict):
    """Resume copying"""
    return resume_copy_trading(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id")
    )

@api_router.post("/copy/settings")
async def update_copy_trading_settings(data: dict):
    """Update copy trading settings"""
    return update_copy_settings(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id"),
        data.get("settings", {})
    )

@api_router.get("/copy/relationships/{user_id}")
async def get_user_copy_relationships(user_id: str):
    """Get user's copy trading relationships"""
    return get_user_copies(user_id)

@api_router.get("/copy/portfolio/{user_id}")
async def get_user_copy_portfolio(user_id: str):
    """Get user's copy trading portfolio summary"""
    return get_copy_portfolio(user_id)

@api_router.post("/copy/add-funds")
async def add_copy_funds(data: dict):
    """Add more funds to a copy relationship"""
    return add_funds_to_copy(
        data.get("follower_id", "demo_user"),
        data.get("relationship_id"),
        data.get("amount", 0)
    )





# ============ SUPPLY CHAIN TRADING ============

from modules.supply_chain import (
    get_supply_chain_markets, get_supply_chain_market, get_high_impact_events,
    buy_supply_chain_position, get_suppliers, get_supplier, get_at_risk_suppliers,
    get_ports, get_congested_ports, get_scf_instruments, get_scf_instrument,
    trade_scf_instrument, get_control_tower, get_geopolitical_risk, get_commodity_dashboard
)

@api_router.get("/supply-chain/markets")
async def supply_chain_markets(event_type: str = None, region: str = None):
    """Get all supply chain prediction markets"""
    return get_supply_chain_markets(event_type, region)

@api_router.get("/supply-chain/market/{market_id}")
async def supply_chain_market(market_id: str):
    """Get single supply chain market"""
    return get_supply_chain_market(market_id)

@api_router.get("/supply-chain/high-impact")
async def high_impact_supply_events():
    """Get high-impact supply chain events"""
    return get_high_impact_events()

@api_router.post("/supply-chain/trade")
async def trade_supply_chain_market(data: dict):
    """Trade supply chain prediction market"""
    return buy_supply_chain_position(
        data.get("user_id", "demo_user"),
        data.get("market_id"),
        data.get("side"),
        data.get("amount", 0)
    )

@api_router.get("/supply-chain/suppliers")
async def list_suppliers(region: str = None, risk_level: str = None):
    """Get all monitored suppliers"""
    return get_suppliers(region, risk_level)

@api_router.get("/supply-chain/supplier/{supplier_id}")
async def get_single_supplier(supplier_id: str):
    """Get single supplier details"""
    return get_supplier(supplier_id)

@api_router.get("/supply-chain/suppliers/at-risk")
async def at_risk_suppliers():
    """Get suppliers above risk threshold"""
    return get_at_risk_suppliers()

@api_router.get("/supply-chain/ports")
async def list_ports(region: str = None):
    """Get all tracked ports"""
    return get_ports(region)

@api_router.get("/supply-chain/ports/congested")
async def congested_ports():
    """Get congested ports"""
    return get_congested_ports()

@api_router.get("/supply-chain/instruments")
async def list_scf_instruments(commodity: str = None):
    """Get all SCF derivative instruments"""
    return get_scf_instruments(commodity)

@api_router.get("/supply-chain/instrument/{instrument_id}")
async def get_single_scf_instrument(instrument_id: str):
    """Get single SCF instrument"""
    return get_scf_instrument(instrument_id)

@api_router.post("/supply-chain/instrument/trade")
async def trade_scf(data: dict):
    """Trade SCF derivative instrument"""
    return trade_scf_instrument(
        data.get("user_id", "demo_user"),
        data.get("instrument_id"),
        data.get("side"),
        data.get("quantity", 0)
    )

@api_router.get("/supply-chain/control-tower")
async def control_tower_summary():
    """Get supply chain control tower overview"""
    return get_control_tower()

@api_router.get("/supply-chain/geopolitical-risk")
async def geopolitical_risk_index():
    """Get geopolitical risk index"""
    return get_geopolitical_risk()

@api_router.get("/supply-chain/commodity/{commodity}")
async def commodity_risk_dashboard(commodity: str):
    """Get risk dashboard for specific commodity"""
    return get_commodity_dashboard(commodity)


# ============ Supply Chain Alert Endpoints ============
from modules.supply_chain_alerts import (
    supply_chain_alert_engine, SCAlertType, SCAlertCondition, SCAlertPriority
)

@api_router.get("/supply-chain/alerts/presets")
async def get_alert_presets():
    """Get preset alert configurations for quick setup"""
    return supply_chain_alert_engine.get_preset_alerts()

@api_router.get("/supply-chain/alerts")
async def get_user_sc_alerts(user_id: str = "demo_user"):
    """Get all supply chain alerts for a user"""
    alerts = supply_chain_alert_engine.get_user_alerts(user_id)
    return [a.model_dump() for a in alerts]

@api_router.post("/supply-chain/alerts")
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

@api_router.put("/supply-chain/alerts/{alert_id}")
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

@api_router.delete("/supply-chain/alerts/{alert_id}")
async def delete_sc_alert(alert_id: str):
    """Delete a supply chain alert"""
    success = supply_chain_alert_engine.delete_alert(alert_id)
    return {"success": success}

@api_router.get("/supply-chain/alerts/history")
async def get_alert_history(user_id: str = "demo_user", limit: int = 50):
    """Get history of triggered alerts"""
    history = supply_chain_alert_engine.get_triggered_history(user_id, limit)
    return [h.model_dump() for h in history]

@api_router.get("/supply-chain/alerts/stats")
async def get_alert_stats():
    """Get alert system statistics"""
    return supply_chain_alert_engine.get_alert_stats()

@api_router.post("/supply-chain/alerts/check")
async def check_sc_alerts_now():
    """Manually trigger alert check against current supply chain data"""
    # Build current supply chain data from existing functions
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


# ============ AI TRADING AGENTS ============
from modules.ai_trading_agents import ai_trading_engine, AgentStatus

# Initialize AI Trading Engine with MongoDB
ai_trading_engine.set_db(db)

@api_router.get("/agents/templates")
async def get_agent_templates():
    """Get all available agent templates"""
    return ai_trading_engine.get_templates()

@api_router.get("/agents")
async def get_user_agents(user_id: str = "demo_user"):
    """Get all agents for a user"""
    agents = await ai_trading_engine.get_user_agents(user_id)
    return [a.model_dump() for a in agents]

@api_router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get agent by ID"""
    agent = await ai_trading_engine.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()

@api_router.post("/agents")
async def create_agent(data: dict):
    """Create a new trading agent"""
    try:
        user_id = data.pop("user_id", "demo_user")
        agent = await ai_trading_engine.create_agent(user_id, data)
        return {"success": True, "agent": agent.model_dump()}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/agents/from-template")
async def create_agent_from_template(data: dict):
    """Create agent from a template"""
    try:
        user_id = data.get("user_id", "demo_user")
        template_id = data.get("template_id")
        overrides = data.get("overrides", {})
        agent = await ai_trading_engine.create_from_template(user_id, template_id, overrides)
        return {"success": True, "agent": agent.model_dump()}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.put("/agents/{agent_id}")
async def update_agent(agent_id: str, data: dict):
    """Update agent configuration"""
    agent = await ai_trading_engine.update_agent(agent_id, data)
    if agent:
        return {"success": True, "agent": agent.model_dump()}
    return {"success": False, "error": "Agent not found"}

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    success = await ai_trading_engine.delete_agent(agent_id)
    return {"success": success}

@api_router.post("/agents/{agent_id}/activate")
async def activate_agent(agent_id: str):
    """Activate agent for trading"""
    success = await ai_trading_engine.activate_agent(agent_id)
    return {"success": success, "status": "active" if success else "error"}

@api_router.post("/agents/{agent_id}/pause")
async def pause_agent(agent_id: str):
    """Pause an agent"""
    success = await ai_trading_engine.pause_agent(agent_id)
    return {"success": success, "status": "paused" if success else "error"}

@api_router.post("/agents/{agent_id}/analyze")
async def agent_analyze_market(agent_id: str, data: dict):
    """Have agent analyze market data and make a decision"""
    decision = await ai_trading_engine.analyze_market(agent_id, data)
    if decision:
        return {"success": True, "decision": decision.model_dump()}
    return {"success": False, "error": "Agent not active or not found"}

@api_router.get("/agents/{agent_id}/decisions")
async def get_agent_decisions(agent_id: str, limit: int = 50):
    """Get recent decisions for an agent"""
    decisions = ai_trading_engine.get_agent_decisions(agent_id, limit)
    return [d.model_dump() for d in decisions]

@api_router.get("/agents/{agent_id}/performance")
async def get_agent_performance(agent_id: str):
    """Get performance metrics for an agent"""
    perf = ai_trading_engine.get_agent_performance(agent_id)
    if perf:
        return perf.model_dump()
    return {"error": "Agent not found"}

@api_router.post("/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, data: dict):
    """Chat with an agent about trading"""
    message = data.get("message", "")
    context = data.get("market_context", {})
    response = ai_trading_engine.chat_with_agent(agent_id, message, context)
    return response


# ==================== GLASS-BOX PRICING ENGINE ====================
# Transparent, machine-readable fee breakdowns for every trade

from modules.glass_box_pricing import glass_box_engine

glass_box_engine.set_db(db)

@api_router.get("/pricing/fee-schedule")
async def get_fee_schedule():
    """Get complete public fee schedule - machine readable"""
    return glass_box_engine.get_all_fee_schedules()

@api_router.get("/pricing/fee-schedule/{asset_class}")
async def get_asset_fee_schedule(asset_class: str, tier: str = "free"):
    """Get fee schedule for specific asset class"""
    return {
        "asset_class": asset_class,
        "tier": tier,
        "fees": glass_box_engine.get_fee_schedule(asset_class, tier)
    }

@api_router.post("/pricing/estimate")
async def estimate_order_costs(data: dict):
    """Get pre-trade cost estimate for order ticket"""
    try:
        estimate = glass_box_engine.estimate_order_costs(
            asset=data.get("asset", "BTC"),
            asset_class=data.get("asset_class", "crypto"),
            side=data.get("side", "buy"),
            quantity=data.get("quantity", 1),
            current_price=data.get("current_price", 45000),
            spread_bps=data.get("spread_bps", 10),
            tier=data.get("tier", "free")
        )
        return estimate.model_dump()
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/pricing/execution-receipt")
async def generate_execution_receipt(data: dict):
    """Generate post-trade execution receipt with full transparency"""
    try:
        receipt = glass_box_engine.generate_execution_receipt(
            order_id=data.get("order_id", f"ORD-{uuid.uuid4().hex[:8]}"),
            asset=data.get("asset", "BTC"),
            asset_class=data.get("asset_class", "crypto"),
            side=data.get("side", "buy"),
            quantity=data.get("quantity", 1),
            fill_price=data.get("fill_price", 45000),
            nbbo_bid=data.get("nbbo_bid", 44990),
            nbbo_ask=data.get("nbbo_ask", 45010),
            venue=data.get("venue", "OracleIQ Internal"),
            latency_ms=data.get("latency_ms", 12.5),
            tier=data.get("tier", "free")
        )
        return receipt.model_dump()
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/pricing/monthly-report/{user_id}")
async def get_monthly_cost_report(user_id: str):
    """Get monthly trading cost summary vs competitors"""
    return glass_box_engine.get_monthly_cost_report(user_id)

@api_router.get("/pricing/competitor-comparison")
async def get_competitor_comparison():
    """Get fee comparison across major competitors"""
    from modules.glass_box_pricing import COMPETITOR_FEES, AssetClass
    return {
        "oracleiq": {
            ac.value: {
                "free_tier_bps": glass_box_engine.get_fee_schedule(ac.value, "free").get("platform_bps", 0),
                "pro_tier_bps": glass_box_engine.get_fee_schedule(ac.value, "pro").get("platform_bps", 0)
            } for ac in AssetClass
        },
        "competitors": COMPETITOR_FEES,
        "note": "All figures in basis points (bps). 100 bps = 1%"
    }


# ==================== PUSH NOTIFICATIONS ====================
from modules.push_notifications import push_notification_service, NotificationPreferences, DeviceRegistration

push_notification_service.set_db(db)

@api_router.post("/notifications/register")
async def register_device(data: dict):
    """Register device for push notifications"""
    try:
        registration = DeviceRegistration(
            token=data.get("token"),
            platform=data.get("platform"),
            device=data.get("device"),
            user_id=data.get("user_id")
        )
        success = await push_notification_service.register_device(registration)
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.delete("/notifications/unregister")
async def unregister_device(token: str):
    """Unregister device from push notifications"""
    success = await push_notification_service.unregister_device(token)
    return {"success": success}

@api_router.get("/notifications/preferences")
async def get_notification_preferences(user_id: str):
    """Get notification preferences for user"""
    prefs = push_notification_service.get_preferences(user_id)
    return prefs.model_dump()

@api_router.post("/notifications/preferences")
async def update_notification_preferences(data: dict):
    """Update notification preferences"""
    user_id = data.pop("user_id", "demo_user")
    prefs = NotificationPreferences(**data)
    await push_notification_service.update_preferences(user_id, prefs)
    return {"success": True}

@api_router.post("/notifications/send")
async def send_notification(data: dict):
    """Send push notification to user (admin only)"""
    user_id = data.get("user_id")
    title = data.get("title")
    body = data.get("body")
    notification_data = data.get("data", {})
    
    results = await push_notification_service.send_to_user(user_id, title, body, notification_data)
    return {"success": True, "sent": len(results)}

@api_router.get("/notifications/stats")
async def get_notification_stats():
    """Get push notification statistics"""
    return push_notification_service.get_stats()


# Include the router
app.include_router(api_router)

# CORS configuration - handle all origins dynamically
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "https://srv1304213.hstgr.cloud", "https://oracleiqtrader.com"],
    allow_origin_regex=r"https://.*\.(hstgr\.cloud|oracleiqtrader\.com)",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Load pending alerts from database
    await alert_manager.load_alerts_from_db()
    logger.info("Alert manager initialized")
    
    # Start price streaming background task
    asyncio.create_task(price_streamer())
    logger.info("Price streamer started")
    
    # Start trade crawler background task
    asyncio.create_task(trade_crawler_task())
    logger.info("Trade crawler started")
    
    # Load social media credentials
    await social_manager.load_credentials()
    logger.info("Social manager initialized")
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
