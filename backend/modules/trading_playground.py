"""
Trading Playground Module - Paper Trading with Virtual Money
Provides simulated trading experience with realistic market conditions
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import random
import asyncio

# ============ MODELS ============

class PlaygroundAccount(BaseModel):
    """Virtual trading account"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str = "Demo Account"
    initial_balance: float = 100000.0
    current_balance: float = 100000.0
    buying_power: float = 100000.0
    total_equity: float = 100000.0
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    positions: List[Dict] = []
    trade_history: List[Dict] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    settings: Dict = {
        "leverage": 1,
        "margin_enabled": False,
        "auto_liquidation": True,
        "slippage_simulation": True
    }

class PlaygroundOrder(BaseModel):
    """Order for playground trading"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    symbol: str
    side: str  # "buy" or "sell"
    order_type: str  # "market", "limit", "stop_loss", "take_profit"
    quantity: float
    price: Optional[float] = None  # For limit orders
    stop_price: Optional[float] = None  # For stop orders
    take_profit_price: Optional[float] = None
    stop_loss_price: Optional[float] = None
    status: str = "pending"  # pending, filled, cancelled, rejected
    filled_price: Optional[float] = None
    filled_quantity: float = 0.0
    fees: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    filled_at: Optional[str] = None

class PlaygroundPosition(BaseModel):
    """Open position in playground"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    symbol: str
    side: str  # "long" or "short"
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float = 0.0
    unrealized_pnl_percent: float = 0.0
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: int = 1
    margin_used: float = 0.0
    opened_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ TRADING ENGINE ============

class TradingPlaygroundEngine:
    """Engine for simulating trades with realistic conditions"""
    
    # Simulated fee structure (similar to major exchanges)
    MAKER_FEE = 0.001  # 0.1%
    TAKER_FEE = 0.001  # 0.1%
    
    # Slippage simulation (0.05% - 0.2%)
    MIN_SLIPPAGE = 0.0005
    MAX_SLIPPAGE = 0.002
    
    def __init__(self, db):
        self.db = db
        self.price_cache = {}
        
    async def get_current_price(self, symbol: str) -> float:
        """Get current market price for a symbol"""
        # Try to get from cache first
        if symbol in self.price_cache:
            cache_time, price = self.price_cache[symbol]
            if datetime.now(timezone.utc) - cache_time < timedelta(seconds=5):
                return price
        
        # Default prices for major cryptos (fallback)
        default_prices = {
            "BTC": 95000.0,
            "ETH": 3200.0,
            "SOL": 180.0,
            "XRP": 2.5,
            "ADA": 0.95,
            "DOGE": 0.35,
            "AVAX": 35.0,
            "LINK": 22.0,
            "DOT": 7.5,
            "MATIC": 0.85
        }
        
        base_price = default_prices.get(symbol, 100.0)
        # Add some random variation (-2% to +2%)
        variation = random.uniform(-0.02, 0.02)
        price = base_price * (1 + variation)
        
        self.price_cache[symbol] = (datetime.now(timezone.utc), price)
        return price
    
    def calculate_slippage(self, price: float, side: str) -> float:
        """Simulate realistic slippage based on order side"""
        slippage_percent = random.uniform(self.MIN_SLIPPAGE, self.MAX_SLIPPAGE)
        if side == "buy":
            return price * (1 + slippage_percent)
        else:
            return price * (1 - slippage_percent)
    
    def calculate_fees(self, amount: float, order_type: str) -> float:
        """Calculate trading fees"""
        fee_rate = self.MAKER_FEE if order_type == "limit" else self.TAKER_FEE
        return amount * fee_rate
    
    async def create_account(self, user_id: str = None, initial_balance: float = 100000.0) -> PlaygroundAccount:
        """Create a new playground trading account"""
        account = PlaygroundAccount(
            user_id=user_id,
            initial_balance=initial_balance,
            current_balance=initial_balance,
            buying_power=initial_balance,
            total_equity=initial_balance
        )
        
        await self.db.playground_accounts.insert_one(account.model_dump())
        return account
    
    async def get_account(self, account_id: str) -> Optional[PlaygroundAccount]:
        """Get playground account by ID"""
        doc = await self.db.playground_accounts.find_one({"id": account_id}, {"_id": 0})
        return PlaygroundAccount(**doc) if doc else None
    
    async def get_user_account(self, user_id: str) -> Optional[PlaygroundAccount]:
        """Get user's playground account"""
        doc = await self.db.playground_accounts.find_one({"user_id": user_id}, {"_id": 0})
        return PlaygroundAccount(**doc) if doc else None
    
    async def execute_market_order(self, order: PlaygroundOrder) -> Dict:
        """Execute a market order immediately"""
        account = await self.get_account(order.account_id)
        if not account:
            return {"success": False, "error": "Account not found"}
        
        # Get current price
        current_price = await self.get_current_price(order.symbol)
        
        # Apply slippage for market orders
        if account.settings.get("slippage_simulation", True):
            fill_price = self.calculate_slippage(current_price, order.side)
        else:
            fill_price = current_price
        
        # Calculate order value and fees
        order_value = order.quantity * fill_price
        fees = self.calculate_fees(order_value, "market")
        total_cost = order_value + fees if order.side == "buy" else -order_value + fees
        
        # Check if account has enough balance
        if order.side == "buy" and total_cost > account.buying_power:
            return {"success": False, "error": "Insufficient buying power"}
        
        # Update order
        order.status = "filled"
        order.filled_price = fill_price
        order.filled_quantity = order.quantity
        order.fees = fees
        order.filled_at = datetime.now(timezone.utc).isoformat()
        
        # Update account balance
        if order.side == "buy":
            account.current_balance -= total_cost
            account.buying_power -= total_cost
            
            # Create or update position
            position = PlaygroundPosition(
                account_id=account.id,
                symbol=order.symbol,
                side="long",
                quantity=order.quantity,
                entry_price=fill_price,
                current_price=fill_price,
                stop_loss=order.stop_loss_price,
                take_profit=order.take_profit_price
            )
            account.positions.append(position.model_dump())
        else:
            # Selling - close position
            account.current_balance += order_value - fees
            account.buying_power += order_value - fees
            
            # Find and close position
            for i, pos in enumerate(account.positions):
                if pos["symbol"] == order.symbol:
                    # Calculate realized P&L
                    entry_price = pos["entry_price"]
                    pnl = (fill_price - entry_price) * order.quantity
                    account.total_pnl += pnl
                    
                    # Remove position
                    account.positions.pop(i)
                    break
        
        # Calculate total equity
        account.total_equity = account.current_balance
        for pos in account.positions:
            pos_price = await self.get_current_price(pos["symbol"])
            pos_value = pos["quantity"] * pos_price
            account.total_equity += pos_value
        
        account.total_pnl_percent = ((account.total_equity - account.initial_balance) / account.initial_balance) * 100
        account.last_updated = datetime.now(timezone.utc).isoformat()
        
        # Add to trade history
        trade_record = {
            "id": order.id,
            "symbol": order.symbol,
            "side": order.side,
            "quantity": order.quantity,
            "price": fill_price,
            "value": order_value,
            "fees": fees,
            "timestamp": order.filled_at
        }
        account.trade_history.append(trade_record)
        
        # Save updates
        await self.db.playground_accounts.update_one(
            {"id": account.id},
            {"$set": account.model_dump()}
        )
        
        await self.db.playground_orders.insert_one(order.model_dump())
        
        return {
            "success": True,
            "order": order.model_dump(),
            "account": {
                "balance": account.current_balance,
                "equity": account.total_equity,
                "pnl": account.total_pnl,
                "pnl_percent": account.total_pnl_percent
            }
        }
    
    async def execute_limit_order(self, order: PlaygroundOrder) -> Dict:
        """Place a limit order (will be filled when price reaches target)"""
        account = await self.get_account(order.account_id)
        if not account:
            return {"success": False, "error": "Account not found"}
        
        if order.price is None:
            return {"success": False, "error": "Limit price required"}
        
        # Reserve buying power for buy orders
        if order.side == "buy":
            order_value = order.quantity * order.price
            if order_value > account.buying_power:
                return {"success": False, "error": "Insufficient buying power"}
            
            account.buying_power -= order_value
            await self.db.playground_accounts.update_one(
                {"id": account.id},
                {"$set": {"buying_power": account.buying_power}}
            )
        
        order.status = "pending"
        await self.db.playground_orders.insert_one(order.model_dump())
        
        return {
            "success": True,
            "order": order.model_dump(),
            "message": f"Limit order placed at ${order.price:.2f}"
        }
    
    async def cancel_order(self, order_id: str) -> Dict:
        """Cancel a pending order"""
        order_doc = await self.db.playground_orders.find_one({"id": order_id}, {"_id": 0})
        if not order_doc:
            return {"success": False, "error": "Order not found"}
        
        if order_doc["status"] != "pending":
            return {"success": False, "error": "Order is not pending"}
        
        # Restore buying power if it was a buy order
        if order_doc["side"] == "buy" and order_doc.get("price"):
            account = await self.get_account(order_doc["account_id"])
            if account:
                order_value = order_doc["quantity"] * order_doc["price"]
                account.buying_power += order_value
                await self.db.playground_accounts.update_one(
                    {"id": account.id},
                    {"$set": {"buying_power": account.buying_power}}
                )
        
        await self.db.playground_orders.update_one(
            {"id": order_id},
            {"$set": {"status": "cancelled"}}
        )
        
        return {"success": True, "message": "Order cancelled"}
    
    async def update_positions(self, account_id: str) -> Dict:
        """Update all position prices and P&L"""
        account = await self.get_account(account_id)
        if not account:
            return {"success": False, "error": "Account not found"}
        
        total_unrealized_pnl = 0
        
        for pos in account.positions:
            current_price = await self.get_current_price(pos["symbol"])
            pos["current_price"] = current_price
            
            # Calculate unrealized P&L
            if pos["side"] == "long":
                pnl = (current_price - pos["entry_price"]) * pos["quantity"]
            else:
                pnl = (pos["entry_price"] - current_price) * pos["quantity"]
            
            pos["unrealized_pnl"] = pnl
            pos["unrealized_pnl_percent"] = (pnl / (pos["entry_price"] * pos["quantity"])) * 100
            total_unrealized_pnl += pnl
            
            # Check stop loss / take profit
            if pos.get("stop_loss") and current_price <= pos["stop_loss"]:
                # Trigger stop loss
                pass  # Would auto-sell in real implementation
            
            if pos.get("take_profit") and current_price >= pos["take_profit"]:
                # Trigger take profit
                pass  # Would auto-sell in real implementation
        
        # Update total equity
        account.total_equity = account.current_balance + total_unrealized_pnl
        account.total_pnl_percent = ((account.total_equity - account.initial_balance) / account.initial_balance) * 100
        account.last_updated = datetime.now(timezone.utc).isoformat()
        
        await self.db.playground_accounts.update_one(
            {"id": account.id},
            {"$set": {
                "positions": account.positions,
                "total_equity": account.total_equity,
                "total_pnl_percent": account.total_pnl_percent,
                "last_updated": account.last_updated
            }}
        )
        
        return {
            "success": True,
            "account": account.model_dump(),
            "unrealized_pnl": total_unrealized_pnl
        }
    
    async def reset_account(self, account_id: str, initial_balance: float = 100000.0) -> Dict:
        """Reset account to initial state"""
        account = await self.get_account(account_id)
        if not account:
            return {"success": False, "error": "Account not found"}
        
        account.initial_balance = initial_balance
        account.current_balance = initial_balance
        account.buying_power = initial_balance
        account.total_equity = initial_balance
        account.total_pnl = 0.0
        account.total_pnl_percent = 0.0
        account.positions = []
        account.trade_history = []
        account.last_updated = datetime.now(timezone.utc).isoformat()
        
        await self.db.playground_accounts.update_one(
            {"id": account_id},
            {"$set": account.model_dump()}
        )
        
        return {"success": True, "account": account.model_dump()}
    
    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get top performing playground traders"""
        accounts = await self.db.playground_accounts.find(
            {},
            {"_id": 0}
        ).sort("total_pnl_percent", -1).limit(limit).to_list(limit)
        
        return accounts
