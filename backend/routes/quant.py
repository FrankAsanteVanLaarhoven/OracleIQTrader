# OracleIQTrader - Quantitative Research Routes
# Bridgewater-style institutional analysis based on Ray Dalio's principles

from fastapi import APIRouter
from typing import List

router = APIRouter()

# ============ MACRO ECONOMIC ENGINE ============
from modules.macro_engine import (
    get_economic_indicators, get_debt_cycle_analysis, get_economic_phase,
    get_central_bank_policies, get_global_liquidity, get_dalio_principles
)

@router.get("/macro/indicators")
async def macro_indicators():
    """Get all economic indicators"""
    return get_economic_indicators()

@router.get("/macro/debt-cycle")
async def debt_cycle():
    """Analyze current debt cycle position (Ray Dalio framework)"""
    return get_debt_cycle_analysis()

@router.get("/macro/economic-phase")
async def economic_phase():
    """Get current economic machine phase"""
    return get_economic_phase()

@router.get("/macro/central-banks")
async def central_banks():
    """Get central bank policy summary"""
    return get_central_bank_policies()

@router.get("/macro/liquidity")
async def global_liquidity():
    """Get global liquidity conditions"""
    return get_global_liquidity()

@router.get("/macro/dalio-principles")
async def dalio_principles():
    """Apply Ray Dalio's Principles to current market"""
    return get_dalio_principles()


# ============ MARKET INEFFICIENCY DETECTOR ============
from modules.inefficiency_detector import (
    get_inefficiency_signals, get_pairs_trades, get_signal_summary,
    analyze_mean_reversion, analyze_momentum
)

@router.get("/inefficiency/signals")
async def inefficiency_signals():
    """Get all detected market inefficiencies"""
    return get_inefficiency_signals()

@router.get("/inefficiency/pairs")
async def pairs_trades():
    """Get pairs trading opportunities"""
    return get_pairs_trades()

@router.get("/inefficiency/summary")
async def inefficiency_summary():
    """Get summary of all signals"""
    return get_signal_summary()

@router.post("/inefficiency/analyze-reversion")
async def analyze_reversion(prices: List[float]):
    """Analyze mean reversion opportunity"""
    return analyze_mean_reversion(prices)

@router.post("/inefficiency/analyze-momentum")
async def analyze_momentum_signal(prices: List[float]):
    """Analyze momentum signal"""
    return analyze_momentum(prices)


# ============ PORTFOLIO OPTIMIZATION ============
from modules.portfolio_optimizer import (
    get_all_weather_portfolio, get_risk_parity_portfolio,
    get_pure_alpha_strategy, get_strategy_comparison, get_drawdown_protection
)

@router.get("/portfolio/all-weather")
async def all_weather_portfolio(growth: str = "rising", inflation: str = "falling"):
    """Get All Weather portfolio allocation (Ray Dalio's flagship)"""
    return get_all_weather_portfolio(growth, inflation)

@router.get("/portfolio/risk-parity")
async def risk_parity_portfolio():
    """Get risk-parity optimized portfolio"""
    return get_risk_parity_portfolio()

@router.get("/portfolio/pure-alpha")
async def pure_alpha_strategy():
    """Get Pure Alpha hedge fund strategy"""
    return get_pure_alpha_strategy()

@router.get("/portfolio/strategies")
async def strategy_comparison():
    """Compare all portfolio strategies"""
    return get_strategy_comparison()

@router.get("/portfolio/drawdown-protection")
async def drawdown_protection():
    """Get drawdown protection recommendations"""
    return get_drawdown_protection()


# ============ AI RESEARCH ANALYST ============
from modules.ai_research_analyst import (
    get_ai_commentary, generate_trade_thesis, generate_research_report,
    apply_dalio_principles_ai, get_ai_status
)

@router.get("/ai/status")
async def ai_status():
    """Get AI analyst status and capabilities"""
    return get_ai_status()

@router.get("/ai/commentary")
async def ai_commentary():
    """Get AI-generated market commentary"""
    return await get_ai_commentary()

@router.post("/ai/thesis")
async def ai_thesis(data: dict):
    """Generate AI trade thesis"""
    return await generate_trade_thesis(data.get("symbol", "BTC"), data.get("direction", "long"))

@router.post("/ai/report")
async def ai_report(data: dict):
    """Generate comprehensive research report"""
    return await generate_research_report(data.get("topic", "Market Analysis"), data.get("data", {}))

@router.post("/ai/dalio-analysis")
async def ai_dalio_analysis(data: dict):
    """Apply Ray Dalio principles via AI"""
    return await apply_dalio_principles_ai(data)


# ============ INSTITUTIONAL DASHBOARD ============
from modules.institutional_dashboard import (
    get_systemic_risk, get_client_advisory, get_institutional_full_report
)

@router.get("/institutional/systemic-risk")
async def systemic_risk():
    """Get systemic risk indicators and warnings"""
    return get_systemic_risk()

@router.get("/institutional/advisory/{client_type}")
async def client_advisory(client_type: str):
    """Get client-specific advisory (central_bank, hedge_fund, sovereign_wealth, government, bank)"""
    return get_client_advisory(client_type)

@router.get("/institutional/full-report")
async def institutional_full_report():
    """Get comprehensive institutional report"""
    return get_institutional_full_report()
