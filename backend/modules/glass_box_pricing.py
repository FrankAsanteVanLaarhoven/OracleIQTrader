# OracleIQTrader - Glass-Box Pricing Engine
# Transparent, machine-readable fee breakdowns for every trade
# Shows venue fee, spread capture, FX cost, platform fee in real-time

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)


class AssetClass(str, Enum):
    EQUITY = "equity"
    CRYPTO = "crypto"
    FOREX = "forex"
    OPTIONS = "options"
    FUTURES = "futures"
    CFD = "cfd"
    PREDICTION = "prediction"
    SUPPLY_CHAIN = "supply_chain"


class ExecutionVenue(str, Enum):
    NYSE = "NYSE"
    NASDAQ = "NASDAQ"
    BINANCE = "Binance"
    COINBASE = "Coinbase"
    KRAKEN = "Kraken"
    IBKR = "Interactive Brokers"
    POLYMARKET = "Polymarket"
    KALSHI = "Kalshi"
    INTERNAL = "OracleIQ Internal"


class FeeType(str, Enum):
    VENUE_FEE = "venue_fee"
    SPREAD = "spread"
    FX_COST = "fx_cost"
    PLATFORM_FEE = "platform_fee"
    REGULATORY_FEE = "regulatory_fee"
    CLEARING_FEE = "clearing_fee"


class FeeBreakdown(BaseModel):
    fee_type: str
    description: str
    amount_usd: float
    amount_bps: float  # Basis points (1 bps = 0.01%)
    is_estimated: bool = False


class PriceQuote(BaseModel):
    venue: str
    bid: float
    ask: float
    spread: float
    spread_bps: float
    timestamp: datetime
    liquidity_score: float  # 0-100


class ExecutionReceipt(BaseModel):
    receipt_id: str
    order_id: str
    timestamp: datetime
    
    # Order details
    asset: str
    asset_class: str
    side: str  # buy/sell
    quantity: float
    
    # Execution details
    execution_venue: str
    fill_price: float
    nbbo_bid: float  # National Best Bid
    nbbo_ask: float  # National Best Offer
    price_improvement: float  # Positive = better than NBBO
    latency_ms: float
    
    # Fee breakdown
    fees: List[FeeBreakdown]
    total_fees_usd: float
    total_fees_bps: float
    
    # Comparison
    effective_cost_bps: float  # Total cost including spread
    ibkr_estimated_cost_bps: float
    etoro_estimated_cost_bps: float
    binance_estimated_cost_bps: float
    savings_vs_competitors: Dict[str, float]


class OrderTicketCosts(BaseModel):
    """Pre-trade cost estimate shown on order ticket"""
    asset: str
    asset_class: str
    side: str
    quantity: float
    notional_value: float
    
    # Current market
    best_bid: float
    best_ask: float
    mid_price: float
    spread_bps: float
    
    # Cost estimates
    estimated_fees: List[FeeBreakdown]
    total_estimated_cost_usd: float
    total_estimated_cost_bps: float
    
    # Competitor comparison
    competitor_costs: Dict[str, float]  # {competitor: bps}
    
    # Our advantage
    cost_advantage_bps: float
    
    # Execution guarantee
    max_cost_cap_bps: float  # Our guarantee
    rebate_if_exceeded: bool


# Fee schedules by asset class and tier
FEE_SCHEDULES = {
    AssetClass.EQUITY: {
        "free": {"platform_bps": 15, "venue_bps": 2, "regulatory_bps": 0.5},
        "pro": {"platform_bps": 5, "venue_bps": 2, "regulatory_bps": 0.5},
    },
    AssetClass.CRYPTO: {
        "free": {"platform_bps": 25, "venue_bps": 5, "spread_avg_bps": 10},
        "pro": {"platform_bps": 8, "venue_bps": 5, "spread_avg_bps": 5},
    },
    AssetClass.FOREX: {
        "free": {"platform_bps": 5, "spread_avg_bps": 8},
        "pro": {"platform_bps": 0, "spread_avg_bps": 3},
    },
    AssetClass.OPTIONS: {
        "free": {"platform_per_contract": 0.65, "venue_per_contract": 0.15},
        "pro": {"platform_per_contract": 0.35, "venue_per_contract": 0.15},
    },
    AssetClass.PREDICTION: {
        "free": {"platform_bps": 10, "market_fee_bps": 5},
        "pro": {"platform_bps": 3, "market_fee_bps": 5},
    },
}

# Competitor fee estimates for comparison
COMPETITOR_FEES = {
    "IBKR": {
        AssetClass.EQUITY: 3.5,  # bps (very low)
        AssetClass.CRYPTO: 18,
        AssetClass.FOREX: 2,
        AssetClass.OPTIONS: 6.5,  # per contract equivalent
    },
    "eToro": {
        AssetClass.EQUITY: 0,  # "free" but with spread markup
        AssetClass.CRYPTO: 100,  # 1% spread
        AssetClass.FOREX: 30,  # pip spreads
        AssetClass.OPTIONS: None,  # not offered
    },
    "Trading212": {
        AssetClass.EQUITY: 0,  # "free" PFOF model
        AssetClass.CRYPTO: 150,  # 1.5%
        AssetClass.FOREX: 25,
        AssetClass.OPTIONS: None,
    },
    "Binance": {
        AssetClass.EQUITY: None,
        AssetClass.CRYPTO: 10,  # 0.1% maker/taker
        AssetClass.FOREX: None,
        AssetClass.OPTIONS: 3,
    },
    "Coinbase": {
        AssetClass.EQUITY: None,
        AssetClass.CRYPTO: 60,  # ~0.6% for retail
        AssetClass.FOREX: None,
        AssetClass.OPTIONS: None,
    },
}


class GlassBoxPricingEngine:
    """
    Transparent pricing engine that shows exact cost breakdown for every trade.
    Key principles:
    - No hidden fees
    - Real-time competitor comparison
    - Execution cost cap with rebates
    - Public, machine-readable fee schedule
    """
    
    def __init__(self, db=None):
        self.db = db
        self._receipts_cache: Dict[str, ExecutionReceipt] = {}
    
    def set_db(self, db):
        self.db = db
    
    def get_fee_schedule(self, asset_class: str, tier: str = "free") -> Dict:
        """Get public fee schedule for asset class and tier"""
        ac = AssetClass(asset_class) if isinstance(asset_class, str) else asset_class
        return FEE_SCHEDULES.get(ac, {}).get(tier, {})
    
    def get_all_fee_schedules(self) -> Dict:
        """Get complete public fee schedule - machine readable"""
        return {
            "version": "1.0",
            "updated": datetime.now(timezone.utc).isoformat(),
            "tiers": {
                "free": {
                    "name": "Free Tier",
                    "monthly_cost": 0,
                    "description": "Standard trading with competitive fees"
                },
                "pro": {
                    "name": "Pro Tier",
                    "monthly_cost": 29.99,
                    "description": "Raw spreads, zero platform commission on most assets"
                }
            },
            "asset_classes": {
                ac.value: {
                    "free": FEE_SCHEDULES.get(ac, {}).get("free", {}),
                    "pro": FEE_SCHEDULES.get(ac, {}).get("pro", {})
                } for ac in AssetClass
            },
            "cost_caps": {
                "equity": {"free": 50, "pro": 20},  # bps
                "crypto": {"free": 60, "pro": 25},
                "forex": {"free": 20, "pro": 8},
                "prediction": {"free": 25, "pro": 12}
            },
            "rebate_policy": "If your all-in execution cost exceeds our cap, we rebate the difference automatically."
        }
    
    def estimate_order_costs(
        self,
        asset: str,
        asset_class: str,
        side: str,
        quantity: float,
        current_price: float,
        spread_bps: float = 10,
        tier: str = "free"
    ) -> OrderTicketCosts:
        """
        Generate pre-trade cost estimate for order ticket.
        Shows exact breakdown before user confirms.
        """
        ac = AssetClass(asset_class)
        fees = self.get_fee_schedule(asset_class, tier)
        
        notional = quantity * current_price
        half_spread = spread_bps / 2
        
        # Build fee breakdown
        fee_list = []
        total_bps = 0
        
        # Spread cost (always present)
        spread_cost_bps = half_spread
        fee_list.append(FeeBreakdown(
            fee_type=FeeType.SPREAD.value,
            description=f"Market spread ({spread_bps:.1f} bps total, you pay half)",
            amount_usd=(spread_cost_bps / 10000) * notional,
            amount_bps=spread_cost_bps,
            is_estimated=True
        ))
        total_bps += spread_cost_bps
        
        # Platform fee
        platform_bps = fees.get("platform_bps", 0)
        if platform_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.PLATFORM_FEE.value,
                description="OracleIQ platform fee",
                amount_usd=(platform_bps / 10000) * notional,
                amount_bps=platform_bps
            ))
            total_bps += platform_bps
        
        # Venue fee
        venue_bps = fees.get("venue_bps", 0)
        if venue_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.VENUE_FEE.value,
                description="Exchange/venue fee",
                amount_usd=(venue_bps / 10000) * notional,
                amount_bps=venue_bps
            ))
            total_bps += venue_bps
        
        # Regulatory fee (equity only)
        reg_bps = fees.get("regulatory_bps", 0)
        if reg_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.REGULATORY_FEE.value,
                description="SEC/FINRA regulatory fee",
                amount_usd=(reg_bps / 10000) * notional,
                amount_bps=reg_bps
            ))
            total_bps += reg_bps
        
        # Competitor comparison
        competitor_costs = {}
        for comp, comp_fees in COMPETITOR_FEES.items():
            comp_bps = comp_fees.get(ac)
            if comp_bps is not None:
                competitor_costs[comp] = comp_bps
        
        # Calculate cost advantage
        avg_competitor = sum(competitor_costs.values()) / len(competitor_costs) if competitor_costs else total_bps
        cost_advantage = avg_competitor - total_bps
        
        # Cost cap
        caps = self.get_all_fee_schedules()["cost_caps"]
        cap_bps = caps.get(asset_class, {}).get(tier, 100)
        
        return OrderTicketCosts(
            asset=asset,
            asset_class=asset_class,
            side=side,
            quantity=quantity,
            notional_value=notional,
            best_bid=current_price * (1 - spread_bps/20000),
            best_ask=current_price * (1 + spread_bps/20000),
            mid_price=current_price,
            spread_bps=spread_bps,
            estimated_fees=fee_list,
            total_estimated_cost_usd=(total_bps / 10000) * notional,
            total_estimated_cost_bps=total_bps,
            competitor_costs=competitor_costs,
            cost_advantage_bps=cost_advantage,
            max_cost_cap_bps=cap_bps,
            rebate_if_exceeded=True
        )
    
    def generate_execution_receipt(
        self,
        order_id: str,
        asset: str,
        asset_class: str,
        side: str,
        quantity: float,
        fill_price: float,
        nbbo_bid: float,
        nbbo_ask: float,
        venue: str,
        latency_ms: float,
        tier: str = "free"
    ) -> ExecutionReceipt:
        """
        Generate post-trade execution receipt with full transparency.
        Shows exactly what happened and compares to competitors.
        """
        receipt_id = f"RCP-{uuid.uuid4().hex[:12].upper()}"
        ac = AssetClass(asset_class)
        fees_config = self.get_fee_schedule(asset_class, tier)
        
        notional = quantity * fill_price
        nbbo_mid = (nbbo_bid + nbbo_ask) / 2
        
        # Calculate price improvement
        if side == "buy":
            expected_fill = nbbo_ask
            price_improvement = expected_fill - fill_price
        else:
            expected_fill = nbbo_bid
            price_improvement = fill_price - expected_fill
        
        price_improvement_bps = (price_improvement / nbbo_mid) * 10000 if nbbo_mid > 0 else 0
        
        # Build actual fee breakdown
        fee_list = []
        total_bps = 0
        
        # Actual spread paid
        actual_spread = nbbo_ask - nbbo_bid
        spread_bps = (actual_spread / nbbo_mid) * 10000 if nbbo_mid > 0 else 0
        spread_paid_bps = spread_bps / 2 - price_improvement_bps  # Minus improvement
        spread_paid_bps = max(0, spread_paid_bps)
        
        fee_list.append(FeeBreakdown(
            fee_type=FeeType.SPREAD.value,
            description=f"Spread cost (NBBO spread: {spread_bps:.1f} bps, improvement: {price_improvement_bps:.1f} bps)",
            amount_usd=(spread_paid_bps / 10000) * notional,
            amount_bps=spread_paid_bps
        ))
        total_bps += spread_paid_bps
        
        # Platform fee
        platform_bps = fees_config.get("platform_bps", 0)
        if platform_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.PLATFORM_FEE.value,
                description="OracleIQ platform fee",
                amount_usd=(platform_bps / 10000) * notional,
                amount_bps=platform_bps
            ))
            total_bps += platform_bps
        
        # Venue fee
        venue_bps = fees_config.get("venue_bps", 0)
        if venue_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.VENUE_FEE.value,
                description=f"{venue} execution fee",
                amount_usd=(venue_bps / 10000) * notional,
                amount_bps=venue_bps
            ))
            total_bps += venue_bps
        
        # Regulatory fee
        reg_bps = fees_config.get("regulatory_bps", 0)
        if reg_bps > 0:
            fee_list.append(FeeBreakdown(
                fee_type=FeeType.REGULATORY_FEE.value,
                description="Regulatory fees (SEC/FINRA)",
                amount_usd=(reg_bps / 10000) * notional,
                amount_bps=reg_bps
            ))
            total_bps += reg_bps
        
        # Competitor estimates
        competitor_estimates = {}
        savings = {}
        for comp, comp_fees in COMPETITOR_FEES.items():
            comp_bps = comp_fees.get(ac)
            if comp_bps is not None:
                competitor_estimates[comp] = comp_bps
                savings[comp] = comp_bps - total_bps
        
        receipt = ExecutionReceipt(
            receipt_id=receipt_id,
            order_id=order_id,
            timestamp=datetime.now(timezone.utc),
            asset=asset,
            asset_class=asset_class,
            side=side,
            quantity=quantity,
            execution_venue=venue,
            fill_price=fill_price,
            nbbo_bid=nbbo_bid,
            nbbo_ask=nbbo_ask,
            price_improvement=price_improvement,
            latency_ms=latency_ms,
            fees=fee_list,
            total_fees_usd=(total_bps / 10000) * notional,
            total_fees_bps=total_bps,
            effective_cost_bps=total_bps,
            ibkr_estimated_cost_bps=competitor_estimates.get("IBKR", 0),
            etoro_estimated_cost_bps=competitor_estimates.get("eToro", 0),
            binance_estimated_cost_bps=competitor_estimates.get("Binance", 0),
            savings_vs_competitors=savings
        )
        
        self._receipts_cache[receipt_id] = receipt
        return receipt
    
    def get_monthly_cost_report(self, user_id: str) -> Dict:
        """Generate monthly trading cost summary vs competitors"""
        # Simulated monthly stats
        return {
            "user_id": user_id,
            "period": "January 2026",
            "summary": {
                "total_trades": 47,
                "total_volume_usd": 125000,
                "total_fees_paid_usd": 15.62,
                "effective_rate_bps": 12.5,
            },
            "vs_competitors": {
                "IBKR": {"their_estimated_cost": 18.75, "your_savings": 3.13},
                "eToro": {"their_estimated_cost": 125.00, "your_savings": 109.38},
                "Trading212": {"their_estimated_cost": 93.75, "your_savings": 78.13},
                "Coinbase": {"their_estimated_cost": 75.00, "your_savings": 59.38}
            },
            "breakdown_by_asset": {
                "crypto": {"trades": 25, "volume": 75000, "fees": 9.38, "rate_bps": 12.5},
                "equity": {"trades": 15, "volume": 35000, "fees": 4.38, "rate_bps": 12.5},
                "prediction": {"trades": 7, "volume": 15000, "fees": 1.88, "rate_bps": 12.5}
            },
            "rebates_earned": 0,
            "cap_breaches": 0,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }


# Global instance
glass_box_engine = GlassBoxPricingEngine()
