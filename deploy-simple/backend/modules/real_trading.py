"""
Real Exchange Trading Module
Connect to Binance, Coinbase, Kraken for live/testnet trading
"""

import os
import hmac
import hashlib
import time
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
import httpx
from pydantic import BaseModel, Field
import uuid

logger = logging.getLogger(__name__)

# ============ ENUMS ============

class Exchange(str, Enum):
    BINANCE = "binance"
    COINBASE = "coinbase"
    KRAKEN = "kraken"

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"
    TAKE_PROFIT = "TAKE_PROFIT"

class OrderStatus(str, Enum):
    NEW = "NEW"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

# ============ MODELS ============

class ExchangeConfig(BaseModel):
    """Exchange configuration"""
    exchange: Exchange
    api_key: str
    api_secret: str
    passphrase: Optional[str] = None  # For Coinbase
    is_testnet: bool = True

class Balance(BaseModel):
    """Account balance"""
    asset: str
    free: float
    locked: float
    total: float

class Order(BaseModel):
    """Trade order"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exchange_order_id: Optional[str] = None
    exchange: Exchange
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.NEW
    filled_qty: float = 0.0
    filled_price: float = 0.0
    fee: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

class TradeResult(BaseModel):
    """Result of a trade execution"""
    success: bool
    order: Optional[Order] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0

# ============ EXCHANGE ADAPTERS ============

class BinanceAdapter:
    """Binance exchange adapter"""
    
    MAINNET_BASE = "https://api.binance.com"
    TESTNET_BASE = "https://testnet.binance.vision"
    
    def __init__(self, config: ExchangeConfig):
        self.api_key = config.api_key
        self.api_secret = config.api_secret
        self.is_testnet = config.is_testnet
        self.base_url = self.TESTNET_BASE if config.is_testnet else self.MAINNET_BASE
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _sign(self, params: Dict) -> str:
        """Generate HMAC SHA256 signature"""
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    async def _request(self, method: str, endpoint: str, params: Dict = None, signed: bool = False) -> Dict:
        """Make API request"""
        url = f"{self.base_url}{endpoint}"
        headers = {"X-MBX-APIKEY": self.api_key}
        
        if params is None:
            params = {}
        
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            params["signature"] = self._sign(params)
        
        try:
            if method == "GET":
                response = await self.client.get(url, params=params, headers=headers)
            else:
                response = await self.client.post(url, params=params, headers=headers)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Binance API error: {e}")
            raise
    
    async def get_account(self) -> Dict:
        """Get account info"""
        return await self._request("GET", "/api/v3/account", signed=True)
    
    async def get_balances(self) -> List[Balance]:
        """Get all non-zero balances"""
        account = await self.get_account()
        balances = []
        for b in account.get("balances", []):
            free = float(b["free"])
            locked = float(b["locked"])
            if free > 0 or locked > 0:
                balances.append(Balance(
                    asset=b["asset"],
                    free=free,
                    locked=locked,
                    total=free + locked
                ))
        return balances
    
    async def get_price(self, symbol: str) -> float:
        """Get current price"""
        result = await self._request("GET", "/api/v3/ticker/price", {"symbol": symbol})
        return float(result["price"])
    
    async def place_order(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None
    ) -> TradeResult:
        """Place an order"""
        start_time = time.time()
        
        params = {
            "symbol": symbol,
            "side": side.value,
            "type": order_type.value,
            "quantity": str(quantity)
        }
        
        if order_type == OrderType.LIMIT and price:
            params["price"] = str(price)
            params["timeInForce"] = "GTC"
        
        try:
            result = await self._request("POST", "/api/v3/order", params, signed=True)
            
            order = Order(
                exchange_order_id=str(result["orderId"]),
                exchange=Exchange.BINANCE,
                symbol=symbol,
                side=side,
                order_type=order_type,
                quantity=quantity,
                price=price,
                status=OrderStatus(result["status"]),
                filled_qty=float(result.get("executedQty", 0)),
                filled_price=float(result.get("price", 0))
            )
            
            return TradeResult(
                success=True,
                order=order,
                execution_time_ms=(time.time() - start_time) * 1000
            )
            
        except Exception as e:
            return TradeResult(
                success=False,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )
    
    async def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel an order"""
        return await self._request("DELETE", "/api/v3/order", {
            "symbol": symbol,
            "orderId": order_id
        }, signed=True)
    
    async def get_open_orders(self, symbol: str = None) -> List[Dict]:
        """Get open orders"""
        params = {}
        if symbol:
            params["symbol"] = symbol
        return await self._request("GET", "/api/v3/openOrders", params, signed=True)
    
    async def close(self):
        await self.client.aclose()


class CoinbaseAdapter:
    """Coinbase exchange adapter (simplified)"""
    
    MAINNET_BASE = "https://api.coinbase.com"
    SANDBOX_BASE = "https://api-public.sandbox.exchange.coinbase.com"
    
    def __init__(self, config: ExchangeConfig):
        self.api_key = config.api_key
        self.api_secret = config.api_secret
        self.passphrase = config.passphrase or ""
        self.is_testnet = config.is_testnet
        self.base_url = self.SANDBOX_BASE if config.is_testnet else self.MAINNET_BASE
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_balances(self) -> List[Balance]:
        """Get account balances - placeholder"""
        # Coinbase API requires OAuth2 or advanced signing
        # For now, return mock data for testnet
        if self.is_testnet:
            return [
                Balance(asset="BTC", free=1.5, locked=0.0, total=1.5),
                Balance(asset="ETH", free=10.0, locked=0.0, total=10.0),
                Balance(asset="USD", free=50000.0, locked=0.0, total=50000.0)
            ]
        return []
    
    async def place_order(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None
    ) -> TradeResult:
        """Place order - placeholder for testnet"""
        if self.is_testnet:
            # Simulate order for testnet
            order = Order(
                exchange_order_id=f"cb_{uuid.uuid4().hex[:8]}",
                exchange=Exchange.COINBASE,
                symbol=symbol,
                side=side,
                order_type=order_type,
                quantity=quantity,
                price=price or 45000.0,
                status=OrderStatus.FILLED,
                filled_qty=quantity,
                filled_price=price or 45000.0
            )
            return TradeResult(success=True, order=order)
        
        return TradeResult(success=False, error="Coinbase mainnet not implemented")
    
    async def close(self):
        await self.client.aclose()


class KrakenAdapter:
    """Kraken exchange adapter (simplified)"""
    
    def __init__(self, config: ExchangeConfig):
        self.api_key = config.api_key
        self.api_secret = config.api_secret
        self.is_testnet = config.is_testnet
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_balances(self) -> List[Balance]:
        """Get balances - placeholder"""
        if self.is_testnet:
            return [
                Balance(asset="XBT", free=2.0, locked=0.0, total=2.0),
                Balance(asset="ETH", free=15.0, locked=0.0, total=15.0),
                Balance(asset="USD", free=75000.0, locked=0.0, total=75000.0)
            ]
        return []
    
    async def place_order(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None
    ) -> TradeResult:
        """Place order - placeholder"""
        if self.is_testnet:
            order = Order(
                exchange_order_id=f"kr_{uuid.uuid4().hex[:8]}",
                exchange=Exchange.KRAKEN,
                symbol=symbol,
                side=side,
                order_type=order_type,
                quantity=quantity,
                price=price or 45000.0,
                status=OrderStatus.FILLED,
                filled_qty=quantity,
                filled_price=price or 45000.0
            )
            return TradeResult(success=True, order=order)
        
        return TradeResult(success=False, error="Kraken mainnet not implemented")
    
    async def close(self):
        await self.client.aclose()


# ============ EXCHANGE MANAGER ============

class RealExchangeManager:
    """Manager for multiple exchange connections"""
    
    def __init__(self):
        self.adapters: Dict[str, Any] = {}  # user_id_exchange -> adapter
        self.configs: Dict[str, Dict[str, ExchangeConfig]] = {}  # user_id -> exchange -> config
    
    def add_exchange(self, user_id: str, config: ExchangeConfig) -> Dict:
        """Add exchange credentials for a user"""
        if user_id not in self.configs:
            self.configs[user_id] = {}
        
        self.configs[user_id][config.exchange.value] = config
        
        # Create adapter
        adapter_key = f"{user_id}_{config.exchange.value}"
        
        if config.exchange == Exchange.BINANCE:
            self.adapters[adapter_key] = BinanceAdapter(config)
        elif config.exchange == Exchange.COINBASE:
            self.adapters[adapter_key] = CoinbaseAdapter(config)
        elif config.exchange == Exchange.KRAKEN:
            self.adapters[adapter_key] = KrakenAdapter(config)
        
        return {
            "success": True,
            "exchange": config.exchange.value,
            "is_testnet": config.is_testnet,
            "message": f"Connected to {config.exchange.value} {'testnet' if config.is_testnet else 'mainnet'}"
        }
    
    def get_adapter(self, user_id: str, exchange: Exchange):
        """Get adapter for user and exchange"""
        adapter_key = f"{user_id}_{exchange.value}"
        return self.adapters.get(adapter_key)
    
    async def get_balances(self, user_id: str, exchange: Exchange) -> List[Balance]:
        """Get balances from exchange"""
        adapter = self.get_adapter(user_id, exchange)
        if not adapter:
            return []
        return await adapter.get_balances()
    
    async def place_order(
        self,
        user_id: str,
        exchange: Exchange,
        symbol: str,
        side: OrderSide,
        order_type: OrderType,
        quantity: float,
        price: Optional[float] = None
    ) -> TradeResult:
        """Place order on exchange"""
        adapter = self.get_adapter(user_id, exchange)
        if not adapter:
            return TradeResult(success=False, error="Exchange not configured")
        
        return await adapter.place_order(symbol, side, order_type, quantity, price)
    
    def get_user_exchanges(self, user_id: str) -> List[Dict]:
        """Get user's configured exchanges"""
        user_configs = self.configs.get(user_id, {})
        return [
            {
                "exchange": ex,
                "is_testnet": config.is_testnet,
                "connected": True
            }
            for ex, config in user_configs.items()
        ]
    
    def remove_exchange(self, user_id: str, exchange: Exchange) -> bool:
        """Remove exchange credentials"""
        adapter_key = f"{user_id}_{exchange.value}"
        if adapter_key in self.adapters:
            del self.adapters[adapter_key]
        if user_id in self.configs and exchange.value in self.configs[user_id]:
            del self.configs[user_id][exchange.value]
            return True
        return False


# Global exchange manager
exchange_manager = RealExchangeManager()


# ============ API FUNCTIONS ============

async def connect_exchange(
    user_id: str,
    exchange: str,
    api_key: str,
    api_secret: str,
    passphrase: Optional[str] = None,
    is_testnet: bool = True
) -> Dict:
    """Connect to an exchange"""
    try:
        config = ExchangeConfig(
            exchange=Exchange(exchange.lower()),
            api_key=api_key,
            api_secret=api_secret,
            passphrase=passphrase,
            is_testnet=is_testnet
        )
        return exchange_manager.add_exchange(user_id, config)
    except Exception as e:
        return {"success": False, "error": str(e)}

async def get_exchange_balances(user_id: str, exchange: str) -> List[Dict]:
    """Get balances from exchange"""
    balances = await exchange_manager.get_balances(user_id, Exchange(exchange.lower()))
    return [b.model_dump() for b in balances]

async def place_exchange_order(
    user_id: str,
    exchange: str,
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None
) -> Dict:
    """Place order on exchange"""
    result = await exchange_manager.place_order(
        user_id,
        Exchange(exchange.lower()),
        symbol,
        OrderSide(side.upper()),
        OrderType(order_type.upper()),
        quantity,
        price
    )
    return result.model_dump()

def get_user_exchange_status(user_id: str) -> List[Dict]:
    """Get user's connected exchanges"""
    return exchange_manager.get_user_exchanges(user_id)

def disconnect_exchange(user_id: str, exchange: str) -> Dict:
    """Disconnect from exchange"""
    success = exchange_manager.remove_exchange(user_id, Exchange(exchange.lower()))
    return {"success": success}
