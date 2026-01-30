# OracleIQTrader - Alpaca Trading Integration
# Commission-free stock trading: orders, positions, account management

import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum

# Check if alpaca-py is available
try:
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import (
        MarketOrderRequest, LimitOrderRequest, StopOrderRequest,
        GetOrdersRequest
    )
    from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus
    from alpaca.data.historical.stock import StockHistoricalDataClient
    from alpaca.data.requests import StockBarsRequest
    from alpaca.data.timeframe import TimeFrame
    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    print("Warning: alpaca-py not installed. Run: pip install alpaca-py")


# Alpaca Configuration
ALPACA_API_KEY = os.environ.get("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY = os.environ.get("ALPACA_SECRET_KEY", "")
ALPACA_PAPER = os.environ.get("ALPACA_PAPER", "true").lower() == "true"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSideType(str, Enum):
    BUY = "buy"
    SELL = "sell"


class AlpacaAccount(BaseModel):
    account_id: str
    buying_power: float
    cash: float
    portfolio_value: float
    equity: float
    status: str
    trading_blocked: bool
    pattern_day_trader: bool
    currency: str = "USD"


class AlpacaPosition(BaseModel):
    symbol: str
    qty: float
    avg_entry_price: float
    market_value: float
    cost_basis: float
    unrealized_pl: float
    unrealized_plpc: float
    current_price: float
    side: str


class AlpacaOrder(BaseModel):
    order_id: str
    symbol: str
    qty: float
    side: str
    order_type: str
    status: str
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    filled_qty: float = 0
    filled_avg_price: Optional[float] = None
    created_at: str
    updated_at: Optional[str] = None


class AlpacaTradingService:
    """
    Alpaca Trading API integration for commission-free stock trading.
    Supports paper trading and live trading.
    """
    
    def __init__(self, api_key: str = None, secret_key: str = None, paper: bool = True):
        self.api_key = api_key or ALPACA_API_KEY
        self.secret_key = secret_key or ALPACA_SECRET_KEY
        self.paper = paper if paper is not None else ALPACA_PAPER
        
        self.trading_client = None
        self.data_client = None
        
        if ALPACA_AVAILABLE and self.api_key and self.secret_key:
            try:
                self.trading_client = TradingClient(
                    api_key=self.api_key,
                    secret_key=self.secret_key,
                    paper=self.paper
                )
                self.data_client = StockHistoricalDataClient(
                    api_key=self.api_key,
                    secret_key=self.secret_key
                )
                print(f"Alpaca client initialized ({'paper' if self.paper else 'live'} mode)")
            except Exception as e:
                print(f"Failed to initialize Alpaca client: {e}")
    
    def is_connected(self) -> bool:
        """Check if Alpaca client is properly connected"""
        return self.trading_client is not None
    
    async def get_account(self) -> Optional[AlpacaAccount]:
        """Get account information"""
        if not self.trading_client:
            return self._mock_account()
        
        try:
            account = self.trading_client.get_account()
            return AlpacaAccount(
                account_id=str(account.id),
                buying_power=float(account.buying_power),
                cash=float(account.cash),
                portfolio_value=float(account.portfolio_value),
                equity=float(account.equity),
                status=str(account.status),
                trading_blocked=account.trading_blocked,
                pattern_day_trader=account.pattern_day_trader,
                currency=account.currency
            )
        except Exception as e:
            print(f"Alpaca get_account error: {e}")
            return self._mock_account()
    
    async def get_positions(self) -> List[AlpacaPosition]:
        """Get all open positions"""
        if not self.trading_client:
            return self._mock_positions()
        
        try:
            positions = self.trading_client.get_all_positions()
            return [
                AlpacaPosition(
                    symbol=pos.symbol,
                    qty=float(pos.qty),
                    avg_entry_price=float(pos.avg_entry_price),
                    market_value=float(pos.market_value),
                    cost_basis=float(pos.cost_basis),
                    unrealized_pl=float(pos.unrealized_pl),
                    unrealized_plpc=float(pos.unrealized_plpc) * 100,
                    current_price=float(pos.current_price),
                    side=str(pos.side.value)
                )
                for pos in positions
            ]
        except Exception as e:
            print(f"Alpaca get_positions error: {e}")
            return self._mock_positions()
    
    async def get_position(self, symbol: str) -> Optional[AlpacaPosition]:
        """Get position for a specific symbol"""
        if not self.trading_client:
            return None
        
        try:
            pos = self.trading_client.get_open_position(symbol)
            return AlpacaPosition(
                symbol=pos.symbol,
                qty=float(pos.qty),
                avg_entry_price=float(pos.avg_entry_price),
                market_value=float(pos.market_value),
                cost_basis=float(pos.cost_basis),
                unrealized_pl=float(pos.unrealized_pl),
                unrealized_plpc=float(pos.unrealized_plpc) * 100,
                current_price=float(pos.current_price),
                side=str(pos.side.value)
            )
        except Exception as e:
            print(f"Alpaca get_position error for {symbol}: {e}")
            return None
    
    async def place_market_order(self, symbol: str, qty: float, side: str) -> Optional[AlpacaOrder]:
        """Place a market order"""
        if not self.trading_client:
            return self._mock_order(symbol, qty, side, "market")
        
        try:
            order_side = OrderSide.BUY if side.upper() == "BUY" else OrderSide.SELL
            order_data = MarketOrderRequest(
                symbol=symbol.upper(),
                qty=qty,
                side=order_side,
                time_in_force=TimeInForce.DAY
            )
            order = self.trading_client.submit_order(order_data=order_data)
            return self._parse_order(order)
        except Exception as e:
            print(f"Alpaca place_market_order error: {e}")
            return None
    
    async def place_limit_order(self, symbol: str, qty: float, side: str, 
                                 limit_price: float) -> Optional[AlpacaOrder]:
        """Place a limit order"""
        if not self.trading_client:
            return self._mock_order(symbol, qty, side, "limit", limit_price=limit_price)
        
        try:
            order_side = OrderSide.BUY if side.upper() == "BUY" else OrderSide.SELL
            order_data = LimitOrderRequest(
                symbol=symbol.upper(),
                qty=qty,
                side=order_side,
                limit_price=limit_price,
                time_in_force=TimeInForce.DAY
            )
            order = self.trading_client.submit_order(order_data=order_data)
            return self._parse_order(order)
        except Exception as e:
            print(f"Alpaca place_limit_order error: {e}")
            return None
    
    async def place_stop_order(self, symbol: str, qty: float, side: str,
                                stop_price: float) -> Optional[AlpacaOrder]:
        """Place a stop order"""
        if not self.trading_client:
            return self._mock_order(symbol, qty, side, "stop", stop_price=stop_price)
        
        try:
            order_side = OrderSide.BUY if side.upper() == "BUY" else OrderSide.SELL
            order_data = StopOrderRequest(
                symbol=symbol.upper(),
                qty=qty,
                side=order_side,
                stop_price=stop_price,
                time_in_force=TimeInForce.DAY
            )
            order = self.trading_client.submit_order(order_data=order_data)
            return self._parse_order(order)
        except Exception as e:
            print(f"Alpaca place_stop_order error: {e}")
            return None
    
    async def get_orders(self, status: str = "open") -> List[AlpacaOrder]:
        """Get orders by status (open, closed, all)"""
        if not self.trading_client:
            return []
        
        try:
            orders = self.trading_client.get_orders(
                filter=GetOrdersRequest(status=status)
            )
            return [self._parse_order(order) for order in orders]
        except Exception as e:
            print(f"Alpaca get_orders error: {e}")
            return []
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order by ID"""
        if not self.trading_client:
            return True  # Mock success
        
        try:
            self.trading_client.cancel_order_by_id(order_id)
            return True
        except Exception as e:
            print(f"Alpaca cancel_order error: {e}")
            return False
    
    async def cancel_all_orders(self) -> int:
        """Cancel all open orders"""
        if not self.trading_client:
            return 0
        
        try:
            cancelled = self.trading_client.cancel_orders()
            return len(cancelled) if cancelled else 0
        except Exception as e:
            print(f"Alpaca cancel_all_orders error: {e}")
            return 0
    
    async def close_position(self, symbol: str) -> bool:
        """Close a position completely"""
        if not self.trading_client:
            return True
        
        try:
            self.trading_client.close_position(symbol)
            return True
        except Exception as e:
            print(f"Alpaca close_position error for {symbol}: {e}")
            return False
    
    async def close_all_positions(self) -> int:
        """Close all positions"""
        if not self.trading_client:
            return 0
        
        try:
            closed = self.trading_client.close_all_positions()
            return len(closed) if closed else 0
        except Exception as e:
            print(f"Alpaca close_all_positions error: {e}")
            return 0
    
    async def get_bars(self, symbol: str, timeframe: str = "1Day", 
                       limit: int = 100) -> List[Dict]:
        """Get historical price bars"""
        if not self.data_client:
            return []
        
        try:
            # Map timeframe string to TimeFrame enum
            tf_map = {
                "1Min": TimeFrame.Minute,
                "5Min": TimeFrame.Minute,
                "15Min": TimeFrame.Minute,
                "1Hour": TimeFrame.Hour,
                "1Day": TimeFrame.Day,
                "1Week": TimeFrame.Week,
            }
            tf = tf_map.get(timeframe, TimeFrame.Day)
            
            start = datetime.now(timezone.utc) - timedelta(days=limit * 2)
            request = StockBarsRequest(
                symbol_or_symbols=symbol,
                start=start,
                timeframe=tf
            )
            
            bars = self.data_client.get_stock_bars(request)
            
            if symbol not in bars:
                return []
            
            return [
                {
                    "timestamp": bar.timestamp.isoformat(),
                    "open": float(bar.open),
                    "high": float(bar.high),
                    "low": float(bar.low),
                    "close": float(bar.close),
                    "volume": int(bar.volume)
                }
                for bar in bars[symbol][-limit:]
            ]
        except Exception as e:
            print(f"Alpaca get_bars error for {symbol}: {e}")
            return []
    
    def _parse_order(self, order) -> AlpacaOrder:
        """Parse Alpaca order object to AlpacaOrder model"""
        return AlpacaOrder(
            order_id=str(order.id),
            symbol=order.symbol,
            qty=float(order.qty) if order.qty else 0,
            side=str(order.side.value) if hasattr(order.side, 'value') else str(order.side),
            order_type=str(order.order_type.value) if hasattr(order.order_type, 'value') else str(order.order_type),
            status=str(order.status.value) if hasattr(order.status, 'value') else str(order.status),
            limit_price=float(order.limit_price) if order.limit_price else None,
            stop_price=float(order.stop_price) if order.stop_price else None,
            filled_qty=float(order.filled_qty) if order.filled_qty else 0,
            filled_avg_price=float(order.filled_avg_price) if order.filled_avg_price else None,
            created_at=order.created_at.isoformat() if order.created_at else "",
            updated_at=order.updated_at.isoformat() if order.updated_at else None
        )
    
    def _mock_account(self) -> AlpacaAccount:
        """Return mock account for demo mode"""
        return AlpacaAccount(
            account_id="demo-account",
            buying_power=100000.00,
            cash=50000.00,
            portfolio_value=127432.52,
            equity=127432.52,
            status="ACTIVE",
            trading_blocked=False,
            pattern_day_trader=False
        )
    
    def _mock_positions(self) -> List[AlpacaPosition]:
        """Return mock positions for demo mode"""
        return [
            AlpacaPosition(
                symbol="AAPL", qty=100, avg_entry_price=178.50,
                market_value=18950.00, cost_basis=17850.00,
                unrealized_pl=1100.00, unrealized_plpc=6.16,
                current_price=189.50, side="long"
            ),
            AlpacaPosition(
                symbol="TSLA", qty=50, avg_entry_price=245.00,
                market_value=12750.00, cost_basis=12250.00,
                unrealized_pl=500.00, unrealized_plpc=4.08,
                current_price=255.00, side="long"
            ),
            AlpacaPosition(
                symbol="NVDA", qty=30, avg_entry_price=875.00,
                market_value=28500.00, cost_basis=26250.00,
                unrealized_pl=2250.00, unrealized_plpc=8.57,
                current_price=950.00, side="long"
            )
        ]
    
    def _mock_order(self, symbol: str, qty: float, side: str, 
                    order_type: str, **kwargs) -> AlpacaOrder:
        """Return mock order for demo mode"""
        import uuid
        return AlpacaOrder(
            order_id=str(uuid.uuid4()),
            symbol=symbol.upper(),
            qty=qty,
            side=side.lower(),
            order_type=order_type,
            status="accepted",
            limit_price=kwargs.get("limit_price"),
            stop_price=kwargs.get("stop_price"),
            created_at=datetime.now(timezone.utc).isoformat()
        )


# Global instance
alpaca_service = AlpacaTradingService()
