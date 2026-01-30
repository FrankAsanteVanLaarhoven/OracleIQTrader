# OracleIQTrader - Glass-Box Pricing Routes
# Transparent, machine-readable fee breakdowns for every trade

from fastapi import APIRouter
import uuid

from modules.glass_box_pricing import glass_box_engine, COMPETITOR_FEES, AssetClass

pricing_router = APIRouter(prefix="/pricing", tags=["pricing"])


def init_pricing_db(db):
    """Initialize the pricing engine with database"""
    glass_box_engine.set_db(db)


@pricing_router.get("/fee-schedule")
async def get_fee_schedule():
    """Get complete public fee schedule - machine readable"""
    return glass_box_engine.get_all_fee_schedules()


@pricing_router.get("/fee-schedule/{asset_class}")
async def get_asset_fee_schedule(asset_class: str, tier: str = "free"):
    """Get fee schedule for specific asset class"""
    return {
        "asset_class": asset_class,
        "tier": tier,
        "fees": glass_box_engine.get_fee_schedule(asset_class, tier)
    }


@pricing_router.post("/estimate")
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


@pricing_router.post("/execution-receipt")
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


@pricing_router.get("/monthly-report/{user_id}")
async def get_monthly_cost_report(user_id: str):
    """Get monthly trading cost summary vs competitors"""
    return glass_box_engine.get_monthly_cost_report(user_id)


@pricing_router.get("/competitor-comparison")
async def get_competitor_comparison():
    """Get fee comparison across major competitors"""
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
