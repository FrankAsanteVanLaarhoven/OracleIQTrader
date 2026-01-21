from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random
import asyncio

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
    price: float
    change_24h: float
    change_percent: float
    volume: float
    high_24h: float
    low_24h: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AgentVote(BaseModel):
    agent_name: str
    vote: str  # "approve", "reject", "neutral"
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
    query_type: str  # "similar_trades", "market_pattern", "risk_analysis"
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
    action: str
    symbol: str
    quantity: int
    price: float
    status: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    consensus_confidence: float

# ============ SIMULATED DATA ============

MARKET_SYMBOLS = {
    "BTC": {"name": "Bitcoin", "base_price": 112000, "volatility": 0.02},
    "ETH": {"name": "Ethereum", "base_price": 4200, "volatility": 0.025},
    "SPY": {"name": "S&P 500 ETF", "base_price": 598, "volatility": 0.008},
    "AAPL": {"name": "Apple Inc.", "base_price": 248, "volatility": 0.015},
    "NVDA": {"name": "NVIDIA", "base_price": 145, "volatility": 0.03},
    "TSLA": {"name": "Tesla", "base_price": 412, "volatility": 0.035},
}

def generate_market_price(symbol: str) -> MarketData:
    """Generate simulated market data with realistic price movements"""
    if symbol not in MARKET_SYMBOLS:
        raise ValueError(f"Unknown symbol: {symbol}")
    
    config = MARKET_SYMBOLS[symbol]
    base = config["base_price"]
    vol = config["volatility"]
    
    # Random walk price
    change_percent = random.uniform(-vol * 100, vol * 100)
    price = base * (1 + change_percent / 100)
    change_24h = price - base
    
    return MarketData(
        symbol=symbol,
        price=round(price, 2),
        change_24h=round(change_24h, 2),
        change_percent=round(change_percent, 2),
        volume=round(random.uniform(1e9, 50e9), 0),
        high_24h=round(price * 1.02, 2),
        low_24h=round(price * 0.98, 2)
    )

# ============ AI AGENT INTEGRATION ============

async def get_agent_consensus(request: ConsensusRequest) -> ConsensusResponse:
    """Multi-agent consensus using GPT-5.2 via Emergent LLM Key"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not found, using simulated agents")
            return await simulate_agent_consensus(request)
        
        agents_config = [
            {
                "name": "Data Analyst",
                "role": "You are a quantitative data analyst. Analyze market signals, technical indicators, and price patterns. Be precise with numbers.",
                "focus": "technical analysis"
            },
            {
                "name": "Risk Manager",
                "role": "You are a risk manager. Evaluate position sizing, portfolio exposure, and potential downside. Be conservative.",
                "focus": "risk assessment"
            },
            {
                "name": "Strategist",
                "role": "You are a trading strategist. Consider market thesis, macroeconomic factors, and timing. Think long-term.",
                "focus": "strategic alignment"
            }
        ]
        
        agents_votes = []
        
        for agent in agents_config:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"agent-{agent['name']}-{uuid.uuid4()}",
                system_message=f"{agent['role']} Respond in JSON format with: vote (approve/reject/neutral), confidence (0-1), reasoning (brief)."
            ).with_model("openai", "gpt-5.2")
            
            prompt = f"""
            Trade Request: {request.action} {request.quantity} shares of {request.symbol} at ${request.current_price}
            Market Context: {request.market_context or 'Standard market conditions'}
            
            Analyze this trade from your {agent['focus']} perspective. Provide your vote.
            """
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            # Parse response
            try:
                import json
                # Try to extract JSON from response
                response_text = response.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                parsed = json.loads(response_text)
                agents_votes.append(AgentVote(
                    agent_name=agent["name"],
                    vote=parsed.get("vote", "neutral"),
                    confidence=float(parsed.get("confidence", 0.7)),
                    reasoning=parsed.get("reasoning", "Analysis complete")
                ))
            except:
                # Fallback if parsing fails
                agents_votes.append(AgentVote(
                    agent_name=agent["name"],
                    vote="approve" if "approve" in response.lower() else "neutral",
                    confidence=0.75,
                    reasoning=response[:200] if len(response) > 200 else response
                ))
        
        # Calculate consensus
        approve_count = sum(1 for a in agents_votes if a.vote == "approve")
        reject_count = sum(1 for a in agents_votes if a.vote == "reject")
        avg_confidence = sum(a.confidence for a in agents_votes) / len(agents_votes)
        
        if approve_count >= 2:
            final_decision = "RECOMMEND EXECUTION"
        elif reject_count >= 2:
            final_decision = "REJECT - HIGH RISK"
        else:
            final_decision = "REVIEW REQUIRED"
        
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
    """Fallback simulated consensus when AI is unavailable"""
    agents = [
        AgentVote(
            agent_name="Data Analyst",
            vote=random.choice(["approve", "approve", "neutral"]),
            confidence=round(random.uniform(0.7, 0.95), 2),
            reasoning="Technical indicators show positive momentum. RSI at 58, MACD bullish crossover."
        ),
        AgentVote(
            agent_name="Risk Manager",
            vote=random.choice(["approve", "neutral", "reject"]),
            confidence=round(random.uniform(0.65, 0.9), 2),
            reasoning="Position size within risk parameters. Portfolio exposure acceptable at 12%."
        ),
        AgentVote(
            agent_name="Strategist",
            vote=random.choice(["approve", "approve", "neutral"]),
            confidence=round(random.uniform(0.7, 0.92), 2),
            reasoning="Aligned with current market thesis. Sector rotation favors this position."
        )
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

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Cognitive Oracle Trading Platform API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Market Data Endpoints
@api_router.get("/market/prices", response_model=List[MarketData])
async def get_all_market_prices():
    """Get current prices for all tracked symbols"""
    return [generate_market_price(symbol) for symbol in MARKET_SYMBOLS.keys()]

@api_router.get("/market/{symbol}", response_model=MarketData)
async def get_market_price(symbol: str):
    """Get current price for a specific symbol"""
    symbol = symbol.upper()
    if symbol not in MARKET_SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    return generate_market_price(symbol)

@api_router.get("/market/{symbol}/history")
async def get_price_history(symbol: str, periods: int = 50):
    """Get historical price data for charting"""
    symbol = symbol.upper()
    if symbol not in MARKET_SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    config = MARKET_SYMBOLS[symbol]
    base = config["base_price"]
    vol = config["volatility"]
    
    history = []
    current_price = base
    
    for i in range(periods):
        change = random.uniform(-vol, vol)
        current_price = current_price * (1 + change)
        
        high = current_price * (1 + random.uniform(0.001, 0.01))
        low = current_price * (1 - random.uniform(0.001, 0.01))
        open_price = current_price * (1 + random.uniform(-0.005, 0.005))
        
        history.append({
            "time": i,
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(current_price, 2),
            "volume": round(random.uniform(1e6, 10e6), 0)
        })
    
    return history

# Agent Consensus Endpoints
@api_router.post("/agents/consensus", response_model=ConsensusResponse)
async def request_consensus(request: ConsensusRequest):
    """Request multi-agent consensus on a trade"""
    return await get_agent_consensus(request)

# Oracle Memory Endpoints
@api_router.post("/oracle/query", response_model=OracleMemory)
async def query_oracle(query: OracleQuery):
    """Query the Oracle's historical memory for similar situations"""
    # Simulated oracle memory responses
    success_rate = random.uniform(0.65, 0.85)
    avg_pnl = random.uniform(2000, 8000)
    
    historical = [
        {
            "date": "2024-11-15",
            "action": query.action or "BUY",
            "symbol": query.symbol or "AAPL",
            "result": "profitable",
            "pnl": round(random.uniform(1000, 5000), 2)
        },
        {
            "date": "2024-10-22",
            "action": query.action or "BUY",
            "symbol": query.symbol or "AAPL",
            "result": "profitable",
            "pnl": round(random.uniform(2000, 6000), 2)
        },
        {
            "date": "2024-09-08",
            "action": query.action or "BUY",
            "symbol": query.symbol or "AAPL",
            "result": "loss",
            "pnl": round(-random.uniform(500, 2000), 2)
        }
    ]
    
    risk_levels = ["LOW", "MODERATE", "ELEVATED"]
    
    return OracleMemory(
        similar_instances=random.randint(3, 12),
        success_rate=round(success_rate * 100, 1),
        avg_pnl=round(avg_pnl, 2),
        risk_level=random.choice(risk_levels),
        recommendation=f"Historical data suggests {'favorable' if success_rate > 0.7 else 'cautious'} conditions for this trade.",
        historical_data=historical
    )

# Voice Command Endpoints
@api_router.post("/voice/parse", response_model=ParsedCommand)
async def parse_voice_command(command: VoiceCommand):
    """Parse a voice command into a structured trade request"""
    transcript = command.transcript.lower()
    
    # Simple NLP parsing
    action = "BUY" if "buy" in transcript else "SELL" if "sell" in transcript else "UNKNOWN"
    
    # Extract symbol
    symbol = None
    for sym in MARKET_SYMBOLS.keys():
        if sym.lower() in transcript:
            symbol = sym
            break
    
    # Extract quantity
    quantity = None
    words = transcript.split()
    for i, word in enumerate(words):
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

# Trade Execution Endpoints
@api_router.post("/trades/execute", response_model=TradeExecution)
async def execute_trade(action: str, symbol: str, quantity: int):
    """Execute a trade (simulated)"""
    symbol = symbol.upper()
    if symbol not in MARKET_SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    market_data = generate_market_price(symbol)
    
    trade = TradeExecution(
        action=action.upper(),
        symbol=symbol,
        quantity=quantity,
        price=market_data.price,
        status="EXECUTED",
        consensus_confidence=random.uniform(0.8, 0.95)
    )
    
    # Store trade in DB
    doc = trade.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.trades.insert_one(doc)
    
    return trade

@api_router.get("/trades/history", response_model=List[TradeExecution])
async def get_trade_history(limit: int = 20):
    """Get recent trade history"""
    trades = await db.trades.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    for trade in trades:
        if isinstance(trade['timestamp'], str):
            trade['timestamp'] = datetime.fromisoformat(trade['timestamp'])
    return trades

# Mood/Expression Endpoints
@api_router.get("/user/mood")
async def get_mood_analysis():
    """Get current mood analysis (simulated)"""
    moods = [
        {"state": "FOCUSED", "confidence": 0.92, "recommendation": "Optimal for complex analysis"},
        {"state": "STRESSED", "confidence": 0.78, "recommendation": "Consider reducing position sizes"},
        {"state": "FATIGUED", "confidence": 0.85, "recommendation": "Take a break before major decisions"},
        {"state": "CONFIDENT", "confidence": 0.88, "recommendation": "Good state for execution"},
    ]
    return random.choice(moods)

# Gesture Endpoints
@api_router.get("/gestures/detected")
async def get_gesture():
    """Get last detected gesture (simulated)"""
    gestures = [
        {"gesture": "PINCH", "hand": "Right", "action": "Zoom In", "timestamp": datetime.now(timezone.utc).isoformat()},
        {"gesture": "SWIPE_LEFT", "hand": "Right", "action": "Previous", "timestamp": datetime.now(timezone.utc).isoformat()},
        {"gesture": "SWIPE_RIGHT", "hand": "Left", "action": "Next", "timestamp": datetime.now(timezone.utc).isoformat()},
        {"gesture": "THUMBS_UP", "hand": "Right", "action": "Approve", "timestamp": datetime.now(timezone.utc).isoformat()},
        {"gesture": "THUMBS_DOWN", "hand": "Left", "action": "Reject", "timestamp": datetime.now(timezone.utc).isoformat()},
    ]
    return random.choice(gestures)

# Portfolio Endpoints
@api_router.get("/portfolio/summary")
async def get_portfolio_summary():
    """Get portfolio summary"""
    return {
        "total_value": round(random.uniform(250000, 500000), 2),
        "daily_pnl": round(random.uniform(-5000, 15000), 2),
        "daily_pnl_percent": round(random.uniform(-2, 5), 2),
        "positions": [
            {"symbol": "BTC", "quantity": 2.5, "value": round(2.5 * 112000 * random.uniform(0.98, 1.02), 2)},
            {"symbol": "ETH", "quantity": 25, "value": round(25 * 4200 * random.uniform(0.98, 1.02), 2)},
            {"symbol": "AAPL", "quantity": 500, "value": round(500 * 248 * random.uniform(0.98, 1.02), 2)},
            {"symbol": "NVDA", "quantity": 200, "value": round(200 * 145 * random.uniform(0.98, 1.02), 2)},
        ],
        "cash_balance": round(random.uniform(50000, 100000), 2)
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
