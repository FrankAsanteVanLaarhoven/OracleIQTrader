# OracleIQTrader - Algorithmic Execution Engine
# Institutional-grade order execution: VWAP, TWAP, Iceberg, Smart Routing

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from enum import Enum
import random
import math

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    VWAP = "vwap"
    TWAP = "twap"
    ICEBERG = "iceberg"
    POV = "pov"  # Percentage of Volume
    SMART = "smart"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class AlgoOrder:
    """Base class for algorithmic orders"""
    
    def __init__(self, order_id: str, symbol: str, side: OrderSide, 
                 total_quantity: float, order_type: OrderType):
        self.order_id = order_id
        self.symbol = symbol
        self.side = side
        self.total_quantity = total_quantity
        self.filled_quantity = 0.0
        self.order_type = order_type
        self.status = OrderStatus.PENDING
        self.created_at = datetime.utcnow()
        self.child_orders: List[Dict] = []
        self.execution_log: List[Dict] = []
        self.avg_fill_price = 0.0
        self.slippage = 0.0
        
    def to_dict(self) -> Dict:
        return {
            "order_id": self.order_id,
            "symbol": self.symbol,
            "side": self.side.value,
            "total_quantity": self.total_quantity,
            "filled_quantity": self.filled_quantity,
            "remaining_quantity": self.total_quantity - self.filled_quantity,
            "fill_percentage": round((self.filled_quantity / self.total_quantity) * 100, 2),
            "order_type": self.order_type.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "avg_fill_price": self.avg_fill_price,
            "slippage_bps": round(self.slippage * 10000, 2),
            "child_orders": len(self.child_orders),
            "execution_log": self.execution_log[-10:]  # Last 10 executions
        }


class AlgorithmicExecutionEngine:
    """
    Institutional-grade algorithmic execution engine.
    Implements VWAP, TWAP, Iceberg, POV, and Smart Order Routing.
    """
    
    def __init__(self):
        self.active_orders: Dict[str, AlgoOrder] = {}
        self.order_counter = 0
        self.execution_callbacks: List[Callable] = []
        
    def _generate_order_id(self) -> str:
        self.order_counter += 1
        return f"ALGO-{datetime.utcnow().strftime('%Y%m%d')}-{self.order_counter:06d}"
    
    async def create_vwap_order(self, symbol: str, side: OrderSide, 
                                 quantity: float, duration_minutes: int = 60,
                                 participation_rate: float = 0.1,
                                 limit_price: Optional[float] = None) -> Dict:
        """
        Create Volume Weighted Average Price (VWAP) order.
        Executes order to match or beat market VWAP over duration.
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Total quantity to execute
            duration_minutes: Time window for execution
            participation_rate: Max % of market volume to capture (0.1 = 10%)
            limit_price: Optional price limit
        """
        order_id = self._generate_order_id()
        order = AlgoOrder(order_id, symbol, side, quantity, OrderType.VWAP)
        
        # VWAP-specific parameters
        order.duration_minutes = duration_minutes
        order.participation_rate = participation_rate
        order.limit_price = limit_price
        order.target_vwap = None
        order.current_vwap = None
        
        # Generate execution schedule based on historical volume profile
        volume_profile = self._get_volume_profile(symbol, duration_minutes)
        order.execution_schedule = self._create_vwap_schedule(
            quantity, duration_minutes, volume_profile, participation_rate
        )
        
        order.status = OrderStatus.ACTIVE
        self.active_orders[order_id] = order
        
        # Start execution (simulated)
        asyncio.create_task(self._execute_vwap(order))
        
        return {
            "order_id": order_id,
            "type": "VWAP",
            "symbol": symbol,
            "side": side.value,
            "quantity": quantity,
            "duration_minutes": duration_minutes,
            "participation_rate": participation_rate,
            "limit_price": limit_price,
            "status": "ACTIVE",
            "schedule_slices": len(order.execution_schedule),
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=duration_minutes)).isoformat()
        }
    
    async def create_twap_order(self, symbol: str, side: OrderSide,
                                 quantity: float, duration_minutes: int = 60,
                                 slices: int = 12,
                                 randomize: bool = True) -> Dict:
        """
        Create Time Weighted Average Price (TWAP) order.
        Executes equal slices over time to minimize market impact.
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Total quantity to execute
            duration_minutes: Time window for execution
            slices: Number of execution slices
            randomize: Add randomization to prevent pattern detection
        """
        order_id = self._generate_order_id()
        order = AlgoOrder(order_id, symbol, side, quantity, OrderType.TWAP)
        
        # TWAP-specific parameters
        order.duration_minutes = duration_minutes
        order.slices = slices
        order.randomize = randomize
        
        # Create uniform execution schedule
        slice_quantity = quantity / slices
        slice_interval = duration_minutes / slices
        
        order.execution_schedule = []
        for i in range(slices):
            # Add randomization (+/- 20% of interval and quantity)
            if randomize:
                time_offset = slice_interval * i + random.uniform(-0.2, 0.2) * slice_interval
                qty = slice_quantity * random.uniform(0.8, 1.2)
            else:
                time_offset = slice_interval * i
                qty = slice_quantity
                
            order.execution_schedule.append({
                "slice": i + 1,
                "time_offset_minutes": round(time_offset, 2),
                "quantity": round(qty, 4),
                "status": "pending"
            })
        
        # Normalize quantities to match total
        total_scheduled = sum(s["quantity"] for s in order.execution_schedule)
        for s in order.execution_schedule:
            s["quantity"] = round(s["quantity"] * (quantity / total_scheduled), 4)
        
        order.status = OrderStatus.ACTIVE
        self.active_orders[order_id] = order
        
        # Start execution
        asyncio.create_task(self._execute_twap(order))
        
        return {
            "order_id": order_id,
            "type": "TWAP",
            "symbol": symbol,
            "side": side.value,
            "quantity": quantity,
            "duration_minutes": duration_minutes,
            "slices": slices,
            "randomized": randomize,
            "status": "ACTIVE",
            "schedule": order.execution_schedule,
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=duration_minutes)).isoformat()
        }
    
    async def create_iceberg_order(self, symbol: str, side: OrderSide,
                                    quantity: float, visible_quantity: float,
                                    limit_price: float,
                                    variance: float = 0.1) -> Dict:
        """
        Create Iceberg (Hidden) order.
        Shows only a portion of the order to hide large positions.
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Total quantity (hidden)
            visible_quantity: Quantity shown on order book
            limit_price: Limit price for execution
            variance: Randomize visible quantity (+/- %)
        """
        order_id = self._generate_order_id()
        order = AlgoOrder(order_id, symbol, side, quantity, OrderType.ICEBERG)
        
        # Iceberg-specific parameters
        order.visible_quantity = visible_quantity
        order.limit_price = limit_price
        order.variance = variance
        order.hidden_quantity = quantity - visible_quantity
        order.refresh_count = 0
        
        # Calculate number of refreshes needed
        order.max_refreshes = math.ceil(quantity / visible_quantity)
        
        order.status = OrderStatus.ACTIVE
        self.active_orders[order_id] = order
        
        # Start execution
        asyncio.create_task(self._execute_iceberg(order))
        
        return {
            "order_id": order_id,
            "type": "ICEBERG",
            "symbol": symbol,
            "side": side.value,
            "total_quantity": quantity,
            "visible_quantity": visible_quantity,
            "hidden_quantity": quantity - visible_quantity,
            "limit_price": limit_price,
            "variance": variance,
            "status": "ACTIVE",
            "estimated_refreshes": order.max_refreshes,
            "stealth_ratio": round((quantity - visible_quantity) / quantity * 100, 1)
        }
    
    async def create_pov_order(self, symbol: str, side: OrderSide,
                                quantity: float, participation_rate: float = 0.15,
                                min_rate: float = 0.05, max_rate: float = 0.25) -> Dict:
        """
        Create Percentage of Volume (POV) order.
        Maintains a target percentage of market volume.
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Total quantity to execute
            participation_rate: Target % of market volume
            min_rate: Minimum participation rate
            max_rate: Maximum participation rate
        """
        order_id = self._generate_order_id()
        order = AlgoOrder(order_id, symbol, side, quantity, OrderType.POV)
        
        order.participation_rate = participation_rate
        order.min_rate = min_rate
        order.max_rate = max_rate
        
        order.status = OrderStatus.ACTIVE
        self.active_orders[order_id] = order
        
        asyncio.create_task(self._execute_pov(order))
        
        return {
            "order_id": order_id,
            "type": "POV",
            "symbol": symbol,
            "side": side.value,
            "quantity": quantity,
            "target_participation": f"{participation_rate * 100}%",
            "participation_range": f"{min_rate * 100}% - {max_rate * 100}%",
            "status": "ACTIVE"
        }
    
    async def create_smart_order(self, symbol: str, side: OrderSide,
                                  quantity: float, urgency: str = "medium",
                                  limit_price: Optional[float] = None) -> Dict:
        """
        Create Smart Order with intelligent routing.
        Automatically selects best execution strategy based on market conditions.
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Total quantity
            urgency: low, medium, high - affects execution speed vs cost tradeoff
            limit_price: Optional price limit
        """
        order_id = self._generate_order_id()
        
        # Analyze market conditions
        market_analysis = self._analyze_market_conditions(symbol, quantity)
        
        # Select optimal algorithm
        if urgency == "high":
            if market_analysis["liquidity"] == "high":
                strategy = "AGGRESSIVE_TWAP"
                duration = 15
            else:
                strategy = "ICEBERG"
                duration = 30
        elif urgency == "low":
            strategy = "VWAP"
            duration = 120
        else:  # medium
            if market_analysis["volatility"] == "high":
                strategy = "TWAP"
                duration = 60
            else:
                strategy = "VWAP"
                duration = 60
        
        # Create the selected order type
        if strategy == "VWAP":
            return await self.create_vwap_order(symbol, side, quantity, duration)
        elif strategy in ["TWAP", "AGGRESSIVE_TWAP"]:
            slices = 6 if strategy == "AGGRESSIVE_TWAP" else 12
            return await self.create_twap_order(symbol, side, quantity, duration, slices)
        else:  # ICEBERG
            visible = quantity * 0.1
            return await self.create_iceberg_order(symbol, side, quantity, visible, limit_price or 0)
    
    def _get_volume_profile(self, symbol: str, duration: int) -> List[float]:
        """Get historical volume profile (simulated)"""
        # Simulated U-shaped volume profile (higher at open/close)
        intervals = min(duration, 60)
        profile = []
        for i in range(intervals):
            # U-shape: higher volume at start and end
            x = i / intervals
            volume = 1 + 0.5 * (4 * (x - 0.5) ** 2)
            profile.append(volume)
        return profile
    
    def _create_vwap_schedule(self, quantity: float, duration: int, 
                               volume_profile: List[float], 
                               participation_rate: float) -> List[Dict]:
        """Create VWAP execution schedule based on volume profile"""
        total_volume = sum(volume_profile)
        schedule = []
        
        for i, vol in enumerate(volume_profile):
            proportion = vol / total_volume
            qty = quantity * proportion
            
            schedule.append({
                "slice": i + 1,
                "time_offset_minutes": i * (duration / len(volume_profile)),
                "quantity": round(qty, 4),
                "volume_weight": round(proportion, 4),
                "status": "pending"
            })
        
        return schedule
    
    def _analyze_market_conditions(self, symbol: str, quantity: float) -> Dict:
        """Analyze current market conditions for smart routing"""
        # Simulated market analysis
        return {
            "symbol": symbol,
            "liquidity": random.choice(["low", "medium", "high"]),
            "volatility": random.choice(["low", "medium", "high"]),
            "spread_bps": random.uniform(1, 10),
            "avg_trade_size": random.uniform(100, 10000),
            "order_imbalance": random.uniform(-0.3, 0.3),
            "recommended_strategy": "VWAP" if quantity > 10000 else "TWAP"
        }
    
    async def _execute_vwap(self, order: AlgoOrder):
        """Execute VWAP order (simulated)"""
        base_price = 100  # Simulated base price
        
        for slice_info in order.execution_schedule:
            if order.status == OrderStatus.CANCELLED:
                break
                
            await asyncio.sleep(0.1)  # Simulate time passing
            
            # Simulate execution
            fill_price = base_price * (1 + random.uniform(-0.001, 0.001))
            fill_qty = slice_info["quantity"]
            
            order.filled_quantity += fill_qty
            order.avg_fill_price = (
                (order.avg_fill_price * (order.filled_quantity - fill_qty) + fill_price * fill_qty) 
                / order.filled_quantity
            )
            
            slice_info["status"] = "filled"
            slice_info["fill_price"] = fill_price
            
            order.execution_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "slice": slice_info["slice"],
                "quantity": fill_qty,
                "price": fill_price,
                "cumulative_filled": order.filled_quantity
            })
            
            if order.filled_quantity >= order.total_quantity:
                order.status = OrderStatus.FILLED
                break
        
        if order.filled_quantity >= order.total_quantity * 0.99:
            order.status = OrderStatus.FILLED
    
    async def _execute_twap(self, order: AlgoOrder):
        """Execute TWAP order (simulated)"""
        base_price = 100
        
        for slice_info in order.execution_schedule:
            if order.status == OrderStatus.CANCELLED:
                break
                
            await asyncio.sleep(0.1)
            
            fill_price = base_price * (1 + random.uniform(-0.001, 0.001))
            fill_qty = slice_info["quantity"]
            
            order.filled_quantity += fill_qty
            order.avg_fill_price = (
                (order.avg_fill_price * (order.filled_quantity - fill_qty) + fill_price * fill_qty) 
                / order.filled_quantity
            ) if order.filled_quantity > 0 else fill_price
            
            slice_info["status"] = "filled"
            
            order.execution_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "slice": slice_info["slice"],
                "quantity": fill_qty,
                "price": fill_price
            })
        
        order.status = OrderStatus.FILLED
    
    async def _execute_iceberg(self, order: AlgoOrder):
        """Execute Iceberg order (simulated)"""
        base_price = order.limit_price or 100
        remaining = order.total_quantity
        
        while remaining > 0 and order.status != OrderStatus.CANCELLED:
            await asyncio.sleep(0.1)
            
            # Calculate visible slice (with variance)
            variance_mult = 1 + random.uniform(-order.variance, order.variance)
            slice_qty = min(order.visible_quantity * variance_mult, remaining)
            
            fill_price = base_price * (1 + random.uniform(-0.0005, 0.0005))
            
            order.filled_quantity += slice_qty
            remaining -= slice_qty
            order.refresh_count += 1
            
            order.avg_fill_price = (
                (order.avg_fill_price * (order.filled_quantity - slice_qty) + fill_price * slice_qty) 
                / order.filled_quantity
            ) if order.filled_quantity > 0 else fill_price
            
            order.child_orders.append({
                "refresh": order.refresh_count,
                "quantity": slice_qty,
                "price": fill_price,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            order.execution_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "type": "iceberg_refresh",
                "refresh_count": order.refresh_count,
                "quantity": slice_qty,
                "price": fill_price,
                "remaining": remaining
            })
        
        order.status = OrderStatus.FILLED
    
    async def _execute_pov(self, order: AlgoOrder):
        """Execute POV order (simulated)"""
        base_price = 100
        simulated_market_volume = 100000
        
        while order.filled_quantity < order.total_quantity:
            if order.status == OrderStatus.CANCELLED:
                break
                
            await asyncio.sleep(0.1)
            
            # Calculate participation based on simulated market volume
            market_slice = simulated_market_volume * 0.01  # 1% of daily volume per tick
            our_slice = market_slice * order.participation_rate
            our_slice = min(our_slice, order.total_quantity - order.filled_quantity)
            
            fill_price = base_price * (1 + random.uniform(-0.001, 0.001))
            
            order.filled_quantity += our_slice
            order.avg_fill_price = (
                (order.avg_fill_price * (order.filled_quantity - our_slice) + fill_price * our_slice) 
                / order.filled_quantity
            ) if order.filled_quantity > 0 else fill_price
            
            order.execution_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "market_volume": market_slice,
                "our_volume": our_slice,
                "participation": round(our_slice / market_slice * 100, 2),
                "price": fill_price
            })
        
        order.status = OrderStatus.FILLED
    
    def get_order(self, order_id: str) -> Optional[Dict]:
        """Get order status"""
        order = self.active_orders.get(order_id)
        return order.to_dict() if order else None
    
    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an active order"""
        order = self.active_orders.get(order_id)
        if not order:
            return {"error": "Order not found"}
        
        if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED]:
            return {"error": f"Order already {order.status.value}"}
        
        order.status = OrderStatus.CANCELLED
        return {
            "order_id": order_id,
            "status": "CANCELLED",
            "filled_quantity": order.filled_quantity,
            "unfilled_quantity": order.total_quantity - order.filled_quantity
        }
    
    def get_all_orders(self) -> List[Dict]:
        """Get all orders"""
        return [order.to_dict() for order in self.active_orders.values()]
    
    def get_execution_analytics(self) -> Dict:
        """Get execution performance analytics"""
        filled_orders = [o for o in self.active_orders.values() if o.status == OrderStatus.FILLED]
        
        if not filled_orders:
            return {"message": "No completed orders for analysis"}
        
        avg_slippage = sum(o.slippage for o in filled_orders) / len(filled_orders)
        
        by_type = {}
        for order in filled_orders:
            otype = order.order_type.value
            if otype not in by_type:
                by_type[otype] = {"count": 0, "total_quantity": 0, "avg_slippage": 0}
            by_type[otype]["count"] += 1
            by_type[otype]["total_quantity"] += order.total_quantity
        
        return {
            "total_orders": len(filled_orders),
            "average_slippage_bps": round(avg_slippage * 10000, 2),
            "by_order_type": by_type,
            "fill_rate": round(len(filled_orders) / len(self.active_orders) * 100, 2)
        }


# Singleton instance
algo_engine = AlgorithmicExecutionEngine()


# API Functions
async def create_vwap_order(symbol: str, side: str, quantity: float, 
                            duration_minutes: int = 60) -> Dict:
    """Create VWAP order"""
    return await algo_engine.create_vwap_order(
        symbol, OrderSide(side.lower()), quantity, duration_minutes
    )

async def create_twap_order(symbol: str, side: str, quantity: float,
                            duration_minutes: int = 60, slices: int = 12) -> Dict:
    """Create TWAP order"""
    return await algo_engine.create_twap_order(
        symbol, OrderSide(side.lower()), quantity, duration_minutes, slices
    )

async def create_iceberg_order(symbol: str, side: str, quantity: float,
                               visible_quantity: float, limit_price: float) -> Dict:
    """Create Iceberg order"""
    return await algo_engine.create_iceberg_order(
        symbol, OrderSide(side.lower()), quantity, visible_quantity, limit_price
    )

async def create_smart_order(symbol: str, side: str, quantity: float,
                             urgency: str = "medium") -> Dict:
    """Create Smart order with auto-routing"""
    return await algo_engine.create_smart_order(
        symbol, OrderSide(side.lower()), quantity, urgency
    )

def get_algo_order(order_id: str) -> Dict:
    """Get order status"""
    return algo_engine.get_order(order_id) or {"error": "Order not found"}

def cancel_algo_order(order_id: str) -> Dict:
    """Cancel order"""
    return algo_engine.cancel_order(order_id)

def get_all_algo_orders() -> List[Dict]:
    """Get all orders"""
    return algo_engine.get_all_orders()

def get_algo_analytics() -> Dict:
    """Get execution analytics"""
    return algo_engine.get_execution_analytics()
