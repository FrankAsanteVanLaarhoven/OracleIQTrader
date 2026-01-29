"""
Exchange Integration Module
Real exchange adapters for live trading (Binance, Coinbase, Kraken)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Protocol
from datetime import datetime, timezone
from abc import ABC, abstractmethod
from enum import Enum
import uuid
import hmac
import hashlib
import time
import httpx
import logging

logger = logging.getLogger(__name__)

# ============ ENUMS ============

class ExchangeType(str, Enum):
    BINANCE = "binance"
    COINBASE = "coinbase"
    KRAKEN = "kraken"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"

class OrderStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

# ============ MODELS ============

class ExchangeCredentials(BaseModel):
    """Exchange API credentials (encrypted in production)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exchange: ExchangeType
    api_key: str
    api_secret: str
    is_testnet: bool = True  # Default to testnet for safety
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExchangeBalance(BaseModel):
    """Account balance on exchange"""
    asset: str
    free: float
    locked: float
    total: float

class ExchangeOrder(BaseModel):
    """Order on exchange"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exchange_order_id: Optional[str] = None
    user_id: str
    exchange: ExchangeType
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    filled_price: Optional[float] = None
    fees: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class ExchangeTrade(BaseModel):
    """Executed trade on exchange"""
    id: str
    order_id: str
    exchange: ExchangeType
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    fee: float
    fee_asset: str
    timestamp: str

# ============ EXCHANGE ADAPTER INTERFACE ============

class ExchangeAdapter(ABC):
    """Abstract base class for exchange adapters"""
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
    
    @abstractmethod
    async def get_account_balance(self) -> List[ExchangeBalance]:
        """Get account balances"""
        pass
    
    @abstractmethod
    async def get_ticker_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        pass
    
    @abstractmethod
    async def place_market_order(self, symbol: str, side: OrderSide, quantity: float) -> Dict:
        """Place a market order"""
        pass
    
    @abstractmethod
    async def place_limit_order(self, symbol: str, side: OrderSide, 
                               quantity: float, price: float) -> Dict:
        """Place a limit order"""
        pass
    
    @abstractmethod
    async def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel an order"""
        pass
    
    @abstractmethod
    async def get_order_status(self, symbol: str, order_id: str) -> Dict:
        """Get order status"""
        pass
    
    @abstractmethod
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders"""
        pass
    
    @abstractmethod
    async def get_trade_history(self, symbol: str, limit: int = 100) -> List[Dict]:
        """Get trade history"""
        pass

# ============ BINANCE ADAPTER ============

class BinanceAdapter(ExchangeAdapter):
    """Binance exchange adapter"""
    
    MAINNET_BASE_URL = "https://api.binance.com"
    TESTNET_BASE_URL = "https://testnet.binance.vision"
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        super().__init__(api_key, api_secret, testnet)
        self.base_url = self.TESTNET_BASE_URL if testnet else self.MAINNET_BASE_URL
    
    def _generate_signature(self, params: Dict) -> str:
        """Generate HMAC SHA256 signature"""
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _get_headers(self) -> Dict:
        """Get request headers"""
        return {
            "X-MBX-APIKEY": self.api_key
        }
    
    async def _make_request(self, method: str, endpoint: str, 
                           params: Dict = None, signed: bool = False) -> Dict:
        """Make API request to Binance"""
        url = f"{self.base_url}{endpoint}"
        params = params or {}
        
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            params["signature"] = self._generate_signature(params)
        
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, params=params, headers=self._get_headers())
            elif method == "POST":
                response = await client.post(url, params=params, headers=self._get_headers())
            elif method == "DELETE":
                response = await client.delete(url, params=params, headers=self._get_headers())
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code != 200:
                logger.error(f"Binance API error: {response.text}")
                return {"error": response.text, "status_code": response.status_code}
            
            return response.json()
    
    async def get_account_balance(self) -> List[ExchangeBalance]:
        """Get account balances from Binance"""
        result = await self._make_request("GET", "/api/v3/account", signed=True)
        
        if "error" in result:
            return []
        
        balances = []
        for balance in result.get("balances", []):
            free = float(balance["free"])
            locked = float(balance["locked"])
            if free > 0 or locked > 0:
                balances.append(ExchangeBalance(
                    asset=balance["asset"],
                    free=free,
                    locked=locked,
                    total=free + locked
                ))
        
        return balances
    
    async def get_ticker_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        # Binance uses format like BTCUSDT
        binance_symbol = f"{symbol}USDT"
        result = await self._make_request("GET", "/api/v3/ticker/price", 
                                         params={"symbol": binance_symbol})
        
        if "error" in result:
            return 0.0
        
        return float(result.get("price", 0))
    
    async def place_market_order(self, symbol: str, side: OrderSide, quantity: float) -> Dict:
        """Place a market order on Binance"""
        binance_symbol = f"{symbol}USDT"
        
        params = {
            "symbol": binance_symbol,
            "side": side.value.upper(),
            "type": "MARKET",
            "quantity": quantity
        }
        
        result = await self._make_request("POST", "/api/v3/order", params=params, signed=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("orderId"),
            "symbol": symbol,
            "side": side,
            "quantity": float(result.get("executedQty", quantity)),
            "price": float(result.get("fills", [{}])[0].get("price", 0)) if result.get("fills") else None,
            "status": result.get("status")
        }
    
    async def place_limit_order(self, symbol: str, side: OrderSide, 
                               quantity: float, price: float) -> Dict:
        """Place a limit order on Binance"""
        binance_symbol = f"{symbol}USDT"
        
        params = {
            "symbol": binance_symbol,
            "side": side.value.upper(),
            "type": "LIMIT",
            "timeInForce": "GTC",
            "quantity": quantity,
            "price": price
        }
        
        result = await self._make_request("POST", "/api/v3/order", params=params, signed=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("orderId"),
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": price,
            "status": result.get("status")
        }
    
    async def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel an order on Binance"""
        binance_symbol = f"{symbol}USDT"
        
        params = {
            "symbol": binance_symbol,
            "orderId": order_id
        }
        
        result = await self._make_request("DELETE", "/api/v3/order", params=params, signed=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {"success": True, "order_id": order_id, "status": "cancelled"}
    
    async def get_order_status(self, symbol: str, order_id: str) -> Dict:
        """Get order status from Binance"""
        binance_symbol = f"{symbol}USDT"
        
        params = {
            "symbol": binance_symbol,
            "orderId": order_id
        }
        
        result = await self._make_request("GET", "/api/v3/order", params=params, signed=True)
        
        if "error" in result:
            return {"error": result["error"]}
        
        return {
            "order_id": result.get("orderId"),
            "symbol": symbol,
            "side": result.get("side", "").lower(),
            "type": result.get("type", "").lower(),
            "quantity": float(result.get("origQty", 0)),
            "executed_quantity": float(result.get("executedQty", 0)),
            "price": float(result.get("price", 0)),
            "status": result.get("status")
        }
    
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders from Binance"""
        params = {}
        if symbol:
            params["symbol"] = f"{symbol}USDT"
        
        result = await self._make_request("GET", "/api/v3/openOrders", params=params, signed=True)
        
        if isinstance(result, dict) and "error" in result:
            return []
        
        orders = []
        for order in result:
            orders.append({
                "order_id": order.get("orderId"),
                "symbol": order.get("symbol", "").replace("USDT", ""),
                "side": order.get("side", "").lower(),
                "type": order.get("type", "").lower(),
                "quantity": float(order.get("origQty", 0)),
                "price": float(order.get("price", 0)),
                "status": order.get("status")
            })
        
        return orders
    
    async def get_trade_history(self, symbol: str, limit: int = 100) -> List[Dict]:
        """Get trade history from Binance"""
        binance_symbol = f"{symbol}USDT"
        
        params = {
            "symbol": binance_symbol,
            "limit": limit
        }
        
        result = await self._make_request("GET", "/api/v3/myTrades", params=params, signed=True)
        
        if isinstance(result, dict) and "error" in result:
            return []
        
        trades = []
        for trade in result:
            trades.append({
                "id": trade.get("id"),
                "order_id": trade.get("orderId"),
                "symbol": symbol,
                "side": "buy" if trade.get("isBuyer") else "sell",
                "quantity": float(trade.get("qty", 0)),
                "price": float(trade.get("price", 0)),
                "fee": float(trade.get("commission", 0)),
                "fee_asset": trade.get("commissionAsset"),
                "timestamp": datetime.fromtimestamp(trade.get("time", 0) / 1000, tz=timezone.utc).isoformat()
            })
        
        return trades

# ============ EXCHANGE MANAGER ============

class ExchangeManager:
    """Manages exchange connections and credentials"""
    
    def __init__(self, db):
        self.db = db
        self.adapters: Dict[str, ExchangeAdapter] = {}
    
    async def save_credentials(self, user_id: str, exchange: ExchangeType,
                              api_key: str, api_secret: str, 
                              is_testnet: bool = True) -> Dict:
        """Save exchange credentials for a user"""
        # In production, encrypt api_key and api_secret before storing
        credentials = ExchangeCredentials(
            user_id=user_id,
            exchange=exchange,
            api_key=api_key,
            api_secret=api_secret,
            is_testnet=is_testnet
        )
        
        # Remove existing credentials for this exchange
        await self.db.exchange_credentials.delete_many({
            "user_id": user_id,
            "exchange": exchange
        })
        
        await self.db.exchange_credentials.insert_one(credentials.model_dump())
        
        return {"success": True, "exchange": exchange, "testnet": is_testnet}
    
    async def get_adapter(self, user_id: str, exchange: ExchangeType) -> Optional[ExchangeAdapter]:
        """Get exchange adapter for a user"""
        cache_key = f"{user_id}_{exchange}"
        
        if cache_key in self.adapters:
            return self.adapters[cache_key]
        
        # Get credentials from database
        creds = await self.db.exchange_credentials.find_one({
            "user_id": user_id,
            "exchange": exchange
        }, {"_id": 0})
        
        if not creds:
            return None
        
        # Create appropriate adapter
        if exchange == ExchangeType.BINANCE:
            adapter = BinanceAdapter(
                api_key=creds["api_key"],
                api_secret=creds["api_secret"],
                testnet=creds.get("is_testnet", True)
            )
        else:
            # Add other exchange adapters here
            return None
        
        self.adapters[cache_key] = adapter
        return adapter
    
    async def test_connection(self, user_id: str, exchange: ExchangeType) -> Dict:
        """Test exchange connection"""
        adapter = await self.get_adapter(user_id, exchange)
        if not adapter:
            return {"success": False, "error": "No credentials found"}
        
        try:
            balances = await adapter.get_account_balance()
            return {
                "success": True,
                "exchange": exchange,
                "connected": True,
                "balances_count": len(balances)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_balances(self, user_id: str, exchange: ExchangeType) -> List[ExchangeBalance]:
        """Get account balances"""
        adapter = await self.get_adapter(user_id, exchange)
        if not adapter:
            return []
        
        return await adapter.get_account_balance()
    
    async def place_order(self, user_id: str, exchange: ExchangeType,
                         symbol: str, side: OrderSide, order_type: OrderType,
                         quantity: float, price: Optional[float] = None) -> Dict:
        """Place an order on exchange"""
        adapter = await self.get_adapter(user_id, exchange)
        if not adapter:
            return {"success": False, "error": "No exchange connection"}
        
        # Create order record
        order = ExchangeOrder(
            user_id=user_id,
            exchange=exchange,
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price
        )
        
        try:
            if order_type == OrderType.MARKET:
                result = await adapter.place_market_order(symbol, side, quantity)
            elif order_type == OrderType.LIMIT:
                if price is None:
                    return {"success": False, "error": "Price required for limit orders"}
                result = await adapter.place_limit_order(symbol, side, quantity, price)
            else:
                return {"success": False, "error": f"Order type {order_type} not supported yet"}
            
            if result.get("success"):
                order.exchange_order_id = str(result.get("order_id"))
                order.status = OrderStatus.FILLED if result.get("status") == "FILLED" else OrderStatus.OPEN
                order.filled_price = result.get("price")
                order.updated_at = datetime.now(timezone.utc).isoformat()
            else:
                order.status = OrderStatus.REJECTED
            
            await self.db.exchange_orders.insert_one(order.model_dump())
            
            return {
                "success": result.get("success", False),
                "order": order.model_dump(),
                "exchange_result": result
            }
            
        except Exception as e:
            logger.error(f"Order placement error: {e}")
            order.status = OrderStatus.REJECTED
            await self.db.exchange_orders.insert_one(order.model_dump())
            return {"success": False, "error": str(e)}
    
    async def get_user_orders(self, user_id: str, exchange: Optional[ExchangeType] = None) -> List[Dict]:
        """Get user's order history"""
        query = {"user_id": user_id}
        if exchange:
            query["exchange"] = exchange
        
        orders = await self.db.exchange_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        return orders
    
    async def get_supported_exchanges(self) -> List[Dict]:
        """Get list of supported exchanges"""
        return [
            {
                "id": ExchangeType.BINANCE,
                "name": "Binance",
                "supported": True,
                "testnet_available": True,
                "features": ["spot", "futures", "margin"]
            },
            {
                "id": ExchangeType.COINBASE,
                "name": "Coinbase Pro",
                "supported": False,
                "testnet_available": True,
                "features": ["spot"],
                "coming_soon": True
            },
            {
                "id": ExchangeType.KRAKEN,
                "name": "Kraken",
                "supported": False,
                "testnet_available": False,
                "features": ["spot", "futures"],
                "coming_soon": True
            }
        ]
