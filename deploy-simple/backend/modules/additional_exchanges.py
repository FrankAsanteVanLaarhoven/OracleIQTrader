"""
Additional Exchange Adapters - Coinbase Pro and Kraken
Production-ready exchange integrations
"""

import hmac
import hashlib
import base64
import time
import httpx
import logging
from typing import List, Optional, Dict
from datetime import datetime, timezone
from .exchange_integration import ExchangeAdapter, ExchangeBalance, OrderSide

logger = logging.getLogger(__name__)

# ============ COINBASE PRO ADAPTER ============

class CoinbaseProAdapter(ExchangeAdapter):
    """Coinbase Pro exchange adapter"""
    
    MAINNET_BASE_URL = "https://api.pro.coinbase.com"
    SANDBOX_BASE_URL = "https://api-public.sandbox.pro.coinbase.com"
    
    def __init__(self, api_key: str, api_secret: str, passphrase: str = "", testnet: bool = True):
        super().__init__(api_key, api_secret, testnet)
        self.passphrase = passphrase
        self.base_url = self.SANDBOX_BASE_URL if testnet else self.MAINNET_BASE_URL
    
    def _generate_signature(self, timestamp: str, method: str, path: str, body: str = "") -> str:
        """Generate CB-ACCESS-SIGN signature"""
        message = f"{timestamp}{method}{path}{body}"
        hmac_key = base64.b64decode(self.api_secret)
        signature = hmac.new(hmac_key, message.encode('utf-8'), hashlib.sha256)
        return base64.b64encode(signature.digest()).decode('utf-8')
    
    def _get_headers(self, method: str, path: str, body: str = "") -> Dict:
        """Get request headers with authentication"""
        timestamp = str(time.time())
        return {
            "CB-ACCESS-KEY": self.api_key,
            "CB-ACCESS-SIGN": self._generate_signature(timestamp, method, path, body),
            "CB-ACCESS-TIMESTAMP": timestamp,
            "CB-ACCESS-PASSPHRASE": self.passphrase,
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, method: str, endpoint: str, 
                           body: str = "", params: Dict = None) -> Dict:
        """Make API request to Coinbase Pro"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(method, endpoint, body)
        
        try:
            async with httpx.AsyncClient() as client:
                if method == "GET":
                    response = await client.get(url, headers=headers, params=params)
                elif method == "POST":
                    response = await client.post(url, headers=headers, content=body)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                if response.status_code not in [200, 201]:
                    logger.error(f"Coinbase API error: {response.text}")
                    return {"error": response.text, "status_code": response.status_code}
                
                return response.json() if response.text else {}
                
        except Exception as e:
            logger.error(f"Coinbase request error: {e}")
            return {"error": str(e)}
    
    async def get_account_balance(self) -> List[ExchangeBalance]:
        """Get account balances from Coinbase Pro"""
        result = await self._make_request("GET", "/accounts")
        
        if isinstance(result, dict) and "error" in result:
            return []
        
        balances = []
        for account in result:
            available = float(account.get("available", 0))
            hold = float(account.get("hold", 0))
            if available > 0 or hold > 0:
                balances.append(ExchangeBalance(
                    asset=account.get("currency", ""),
                    free=available,
                    locked=hold,
                    total=available + hold
                ))
        
        return balances
    
    async def get_ticker_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        product_id = f"{symbol}-USD"
        result = await self._make_request("GET", f"/products/{product_id}/ticker")
        
        if isinstance(result, dict) and "error" in result:
            return 0.0
        
        return float(result.get("price", 0))
    
    async def place_market_order(self, symbol: str, side: OrderSide, quantity: float) -> Dict:
        """Place a market order on Coinbase Pro"""
        import json
        
        product_id = f"{symbol}-USD"
        order_data = {
            "type": "market",
            "side": side.value,
            "product_id": product_id,
            "size": str(quantity)
        }
        
        result = await self._make_request("POST", "/orders", json.dumps(order_data))
        
        if isinstance(result, dict) and "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("id"),
            "symbol": symbol,
            "side": side,
            "quantity": float(result.get("size", quantity)),
            "status": result.get("status")
        }
    
    async def place_limit_order(self, symbol: str, side: OrderSide, 
                               quantity: float, price: float) -> Dict:
        """Place a limit order on Coinbase Pro"""
        import json
        
        product_id = f"{symbol}-USD"
        order_data = {
            "type": "limit",
            "side": side.value,
            "product_id": product_id,
            "size": str(quantity),
            "price": str(price)
        }
        
        result = await self._make_request("POST", "/orders", json.dumps(order_data))
        
        if isinstance(result, dict) and "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("id"),
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": price,
            "status": result.get("status")
        }
    
    async def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel an order on Coinbase Pro"""
        result = await self._make_request("DELETE", f"/orders/{order_id}")
        
        if isinstance(result, dict) and "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {"success": True, "order_id": order_id, "status": "cancelled"}
    
    async def get_order_status(self, symbol: str, order_id: str) -> Dict:
        """Get order status from Coinbase Pro"""
        result = await self._make_request("GET", f"/orders/{order_id}")
        
        if isinstance(result, dict) and "error" in result:
            return {"error": result["error"]}
        
        return {
            "order_id": result.get("id"),
            "symbol": result.get("product_id", "").replace("-USD", ""),
            "side": result.get("side"),
            "type": result.get("type"),
            "quantity": float(result.get("size", 0)),
            "executed_quantity": float(result.get("filled_size", 0)),
            "price": float(result.get("price", 0)) if result.get("price") else None,
            "status": result.get("status")
        }
    
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders from Coinbase Pro"""
        params = {"status": "open"}
        if symbol:
            params["product_id"] = f"{symbol}-USD"
        
        result = await self._make_request("GET", "/orders", params=params)
        
        if isinstance(result, dict) and "error" in result:
            return []
        
        orders = []
        for order in result:
            orders.append({
                "order_id": order.get("id"),
                "symbol": order.get("product_id", "").replace("-USD", ""),
                "side": order.get("side"),
                "type": order.get("type"),
                "quantity": float(order.get("size", 0)),
                "price": float(order.get("price", 0)) if order.get("price") else None,
                "status": order.get("status")
            })
        
        return orders
    
    async def get_trade_history(self, symbol: str, limit: int = 100) -> List[Dict]:
        """Get trade history from Coinbase Pro"""
        product_id = f"{symbol}-USD"
        result = await self._make_request("GET", f"/fills", params={"product_id": product_id, "limit": limit})
        
        if isinstance(result, dict) and "error" in result:
            return []
        
        trades = []
        for fill in result:
            trades.append({
                "id": fill.get("trade_id"),
                "order_id": fill.get("order_id"),
                "symbol": symbol,
                "side": fill.get("side"),
                "quantity": float(fill.get("size", 0)),
                "price": float(fill.get("price", 0)),
                "fee": float(fill.get("fee", 0)),
                "fee_asset": "USD",
                "timestamp": fill.get("created_at")
            })
        
        return trades


# ============ KRAKEN ADAPTER ============

class KrakenAdapter(ExchangeAdapter):
    """Kraken exchange adapter"""
    
    BASE_URL = "https://api.kraken.com"
    
    # Kraken uses different asset names
    ASSET_MAP = {
        "BTC": "XXBT",
        "ETH": "XETH",
        "SOL": "SOL",
        "XRP": "XXRP",
        "ADA": "ADA",
        "DOGE": "DOGE",
        "USD": "ZUSD"
    }
    
    PAIR_MAP = {
        "BTC": "XXBTZUSD",
        "ETH": "XETHZUSD",
        "SOL": "SOLUSD",
        "XRP": "XXRPZUSD",
        "ADA": "ADAUSD",
        "DOGE": "DOGEUSD"
    }
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        super().__init__(api_key, api_secret, testnet)
        # Note: Kraken doesn't have a public testnet, but we can simulate
        self.base_url = self.BASE_URL
    
    def _generate_signature(self, urlpath: str, data: Dict) -> str:
        """Generate Kraken API signature"""
        import urllib.parse
        
        postdata = urllib.parse.urlencode(data)
        encoded = (str(data['nonce']) + postdata).encode()
        message = urlpath.encode() + hashlib.sha256(encoded).digest()
        
        mac = hmac.new(base64.b64decode(self.api_secret), message, hashlib.sha512)
        return base64.b64encode(mac.digest()).decode()
    
    def _get_nonce(self) -> int:
        """Generate nonce for API calls"""
        return int(time.time() * 1000)
    
    async def _make_request(self, endpoint: str, data: Dict = None, private: bool = False) -> Dict:
        """Make API request to Kraken"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient() as client:
                if private:
                    data = data or {}
                    data['nonce'] = self._get_nonce()
                    
                    headers = {
                        "API-Key": self.api_key,
                        "API-Sign": self._generate_signature(endpoint, data)
                    }
                    response = await client.post(url, data=data, headers=headers)
                else:
                    response = await client.get(url, params=data) if data else await client.get(url)
                
                if response.status_code != 200:
                    logger.error(f"Kraken API error: {response.text}")
                    return {"error": [response.text]}
                
                result = response.json()
                if result.get("error"):
                    return {"error": result["error"]}
                
                return result.get("result", {})
                
        except Exception as e:
            logger.error(f"Kraken request error: {e}")
            return {"error": [str(e)]}
    
    async def get_account_balance(self) -> List[ExchangeBalance]:
        """Get account balances from Kraken"""
        result = await self._make_request("/0/private/Balance", private=True)
        
        if "error" in result:
            return []
        
        balances = []
        reverse_map = {v: k for k, v in self.ASSET_MAP.items()}
        
        for asset, balance in result.items():
            bal = float(balance)
            if bal > 0:
                symbol = reverse_map.get(asset, asset)
                balances.append(ExchangeBalance(
                    asset=symbol,
                    free=bal,
                    locked=0,
                    total=bal
                ))
        
        return balances
    
    async def get_ticker_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        pair = self.PAIR_MAP.get(symbol, f"{symbol}USD")
        result = await self._make_request("/0/public/Ticker", {"pair": pair})
        
        if "error" in result:
            return 0.0
        
        # Get the first (and only) pair result
        for pair_data in result.values():
            # 'c' is the last trade closed array [price, lot volume]
            return float(pair_data.get("c", [0])[0])
        
        return 0.0
    
    async def place_market_order(self, symbol: str, side: OrderSide, quantity: float) -> Dict:
        """Place a market order on Kraken"""
        pair = self.PAIR_MAP.get(symbol, f"{symbol}USD")
        
        data = {
            "pair": pair,
            "type": side.value,
            "ordertype": "market",
            "volume": str(quantity)
        }
        
        result = await self._make_request("/0/private/AddOrder", data, private=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("txid", [""])[0],
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "status": "submitted"
        }
    
    async def place_limit_order(self, symbol: str, side: OrderSide, 
                               quantity: float, price: float) -> Dict:
        """Place a limit order on Kraken"""
        pair = self.PAIR_MAP.get(symbol, f"{symbol}USD")
        
        data = {
            "pair": pair,
            "type": side.value,
            "ordertype": "limit",
            "volume": str(quantity),
            "price": str(price)
        }
        
        result = await self._make_request("/0/private/AddOrder", data, private=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "order_id": result.get("txid", [""])[0],
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": price,
            "status": "submitted"
        }
    
    async def cancel_order(self, symbol: str, order_id: str) -> Dict:
        """Cancel an order on Kraken"""
        result = await self._make_request("/0/private/CancelOrder", {"txid": order_id}, private=True)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {"success": True, "order_id": order_id, "status": "cancelled"}
    
    async def get_order_status(self, symbol: str, order_id: str) -> Dict:
        """Get order status from Kraken"""
        result = await self._make_request("/0/private/QueryOrders", {"txid": order_id}, private=True)
        
        if "error" in result:
            return {"error": result["error"]}
        
        order = result.get(order_id, {})
        return {
            "order_id": order_id,
            "symbol": symbol,
            "side": order.get("descr", {}).get("type"),
            "type": order.get("descr", {}).get("ordertype"),
            "quantity": float(order.get("vol", 0)),
            "executed_quantity": float(order.get("vol_exec", 0)),
            "price": float(order.get("descr", {}).get("price", 0)),
            "status": order.get("status")
        }
    
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get all open orders from Kraken"""
        result = await self._make_request("/0/private/OpenOrders", private=True)
        
        if "error" in result:
            return []
        
        orders = []
        for txid, order in result.get("open", {}).items():
            pair = order.get("descr", {}).get("pair", "")
            order_symbol = pair.replace("USD", "").replace("XBT", "BTC")
            
            if symbol and order_symbol != symbol:
                continue
            
            orders.append({
                "order_id": txid,
                "symbol": order_symbol,
                "side": order.get("descr", {}).get("type"),
                "type": order.get("descr", {}).get("ordertype"),
                "quantity": float(order.get("vol", 0)),
                "price": float(order.get("descr", {}).get("price", 0)),
                "status": order.get("status")
            })
        
        return orders
    
    async def get_trade_history(self, symbol: str, limit: int = 100) -> List[Dict]:
        """Get trade history from Kraken"""
        result = await self._make_request("/0/private/TradesHistory", private=True)
        
        if "error" in result:
            return []
        
        trades = []
        for txid, trade in list(result.get("trades", {}).items())[:limit]:
            pair = trade.get("pair", "")
            trade_symbol = pair.replace("USD", "").replace("XBT", "BTC").replace("Z", "").replace("X", "")
            
            if symbol and trade_symbol != symbol:
                continue
            
            trades.append({
                "id": txid,
                "order_id": trade.get("ordertxid"),
                "symbol": trade_symbol,
                "side": trade.get("type"),
                "quantity": float(trade.get("vol", 0)),
                "price": float(trade.get("price", 0)),
                "fee": float(trade.get("fee", 0)),
                "fee_asset": "USD",
                "timestamp": datetime.fromtimestamp(trade.get("time", 0), tz=timezone.utc).isoformat()
            })
        
        return trades


# ============ EXCHANGE FACTORY FUNCTIONS ============

import os

def get_binance_adapter():
    """Create Binance adapter from environment variables"""
    from .exchange_integration import BinanceAdapter
    
    api_key = os.environ.get("BINANCE_API_KEY")
    secret_key = os.environ.get("BINANCE_SECRET_KEY")
    testnet = os.environ.get("BINANCE_TESTNET", "true").lower() == "true"
    
    if not api_key or not secret_key:
        logger.warning("Binance API keys not configured")
        return None
    
    return BinanceAdapter(api_key, secret_key, testnet)


def get_coinbase_adapter():
    """Create Coinbase adapter from environment variables"""
    api_key = os.environ.get("COINBASE_API_KEY")
    secret_key = os.environ.get("COINBASE_SECRET_KEY")
    passphrase = os.environ.get("COINBASE_PASSPHRASE", "")
    testnet = os.environ.get("COINBASE_TESTNET", "true").lower() == "true"
    
    if not api_key or not secret_key:
        logger.warning("Coinbase API keys not configured")
        return None
    
    return CoinbaseProAdapter(api_key, secret_key, passphrase, testnet)


def get_kraken_adapter():
    """Create Kraken adapter from environment variables"""
    api_key = os.environ.get("KRAKEN_API_KEY")
    private_key = os.environ.get("KRAKEN_PRIVATE_KEY")
    testnet = os.environ.get("KRAKEN_TESTNET", "true").lower() == "true"
    
    if not api_key or not private_key:
        logger.warning("Kraken API keys not configured")
        return None
    
    return KrakenAdapter(api_key, private_key, testnet)


def get_exchange_adapter(exchange: str):
    """Factory function to get exchange adapter by name"""
    exchange = exchange.lower()
    
    if exchange == "binance":
        return get_binance_adapter()
    elif exchange == "coinbase":
        return get_coinbase_adapter()
    elif exchange == "kraken":
        return get_kraken_adapter()
    else:
        raise ValueError(f"Unsupported exchange: {exchange}")


def get_exchange_status():
    """Get status of all configured exchanges"""
    return {
        "binance": {
            "configured": bool(os.environ.get("BINANCE_API_KEY")),
            "testnet": os.environ.get("BINANCE_TESTNET", "true").lower() == "true"
        },
        "coinbase": {
            "configured": bool(os.environ.get("COINBASE_API_KEY")),
            "testnet": os.environ.get("COINBASE_TESTNET", "true").lower() == "true"
        },
        "kraken": {
            "configured": bool(os.environ.get("KRAKEN_API_KEY")),
            "testnet": os.environ.get("KRAKEN_TESTNET", "true").lower() == "true"
        }
    }
