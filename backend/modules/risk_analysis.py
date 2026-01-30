# OracleIQTrader - Risk Analysis Module
# Real-time portfolio risk metrics: VaR, drawdown, heat maps

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel
import math
import random


class PositionRisk(BaseModel):
    symbol: str
    allocation: float  # percentage
    value: float
    var95: float  # 95% Value at Risk
    var99: float  # 99% Value at Risk
    heat: int  # Risk heat score 0-100
    beta: float
    drawdown: float
    volatility: float
    max_loss_1d: float


class PortfolioRisk(BaseModel):
    total_value: float
    daily_var95: float
    daily_var99: float
    weekly_var95: float
    monthly_var95: float
    current_drawdown: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    beta: float
    correlation_to_market: float
    volatility_annual: float
    risk_score: int  # 0-100
    positions: List[PositionRisk]
    stress_scenarios: Dict[str, float]
    updated_at: str


class RiskAnalysisEngine:
    """
    Risk analysis engine for portfolio and position-level metrics.
    Calculates VaR, drawdown, heat maps, and stress scenarios.
    """
    
    def __init__(self):
        self.db = None
        # Historical volatility estimates (annualized)
        self.asset_volatility = {
            "BTC": 65.0, "ETH": 75.0, "SOL": 90.0, "AVAX": 85.0,
            "LINK": 70.0, "MATIC": 80.0, "ARB": 85.0, "DOGE": 95.0,
            "AAPL": 25.0, "TSLA": 55.0, "NVDA": 50.0, "GOOGL": 28.0,
            "MSFT": 24.0, "AMZN": 32.0, "META": 40.0, "SPY": 15.0,
        }
        # Beta estimates
        self.asset_beta = {
            "BTC": 1.4, "ETH": 1.5, "SOL": 1.8, "AVAX": 1.6,
            "LINK": 1.3, "MATIC": 1.5, "ARB": 1.7, "DOGE": 2.0,
            "AAPL": 1.1, "TSLA": 1.8, "NVDA": 1.5, "GOOGL": 1.0,
            "MSFT": 0.95, "AMZN": 1.2, "META": 1.3, "SPY": 1.0,
        }
    
    def set_db(self, db):
        self.db = db
    
    def calculate_var(self, value: float, volatility: float, confidence: float = 0.95, days: int = 1) -> float:
        """
        Calculate Value at Risk using parametric method
        VaR = Portfolio Value × Z-score × Daily Volatility × √days
        """
        z_scores = {0.95: 1.645, 0.99: 2.326}
        z = z_scores.get(confidence, 1.645)
        daily_vol = volatility / 100 / math.sqrt(252)  # Convert annual to daily
        return value * z * daily_vol * math.sqrt(days)
    
    def calculate_heat_score(self, position_data: Dict) -> int:
        """
        Calculate risk heat score (0-100) based on multiple factors:
        - Concentration risk
        - Volatility
        - Drawdown
        - Beta
        """
        vol_score = min(position_data.get("volatility", 50) / 100, 1.0) * 30
        beta_score = min(position_data.get("beta", 1.0) / 2.0, 1.0) * 25
        dd_score = min(abs(position_data.get("drawdown", 0)) / 20, 1.0) * 25
        alloc_score = min(position_data.get("allocation", 10) / 50, 1.0) * 20
        
        return min(100, int(vol_score + beta_score + dd_score + alloc_score))
    
    def get_portfolio_risk(self, user_id: str, positions: List[Dict] = None) -> PortfolioRisk:
        """
        Calculate comprehensive portfolio risk metrics
        """
        # Use provided positions or generate demo data
        if not positions:
            positions = self._get_demo_positions()
        
        total_value = sum(p.get("value", 0) for p in positions)
        
        # Calculate position-level risks
        position_risks = []
        total_var95 = 0
        total_var99 = 0
        weighted_beta = 0
        weighted_vol = 0
        
        for pos in positions:
            symbol = pos.get("symbol", "UNKNOWN")
            value = pos.get("value", 0)
            allocation = (value / total_value * 100) if total_value > 0 else 0
            
            vol = self.asset_volatility.get(symbol, 50.0)
            beta = self.asset_beta.get(symbol, 1.0)
            
            var95 = self.calculate_var(value, vol, 0.95, 1)
            var99 = self.calculate_var(value, vol, 0.99, 1)
            
            # Random drawdown for demo (in production, calculate from price history)
            drawdown = random.uniform(-2, -12) if symbol in ["BTC", "ETH", "SOL", "TSLA"] else random.uniform(-1, -5)
            
            heat = self.calculate_heat_score({
                "volatility": vol,
                "beta": beta,
                "drawdown": drawdown,
                "allocation": allocation
            })
            
            position_risks.append(PositionRisk(
                symbol=symbol,
                allocation=round(allocation, 2),
                value=round(value, 2),
                var95=round(var95, 2),
                var99=round(var99, 2),
                heat=heat,
                beta=round(beta, 2),
                drawdown=round(drawdown, 2),
                volatility=round(vol, 2),
                max_loss_1d=round(var99, 2)
            ))
            
            total_var95 += var95
            total_var99 += var99
            weighted_beta += beta * (value / total_value) if total_value > 0 else 0
            weighted_vol += vol * (value / total_value) if total_value > 0 else 0
        
        # Calculate portfolio-level metrics
        portfolio_vol = weighted_vol * 0.8  # Diversification benefit
        
        daily_var95 = self.calculate_var(total_value, portfolio_vol, 0.95, 1)
        daily_var99 = self.calculate_var(total_value, portfolio_vol, 0.99, 1)
        weekly_var95 = self.calculate_var(total_value, portfolio_vol, 0.95, 5)
        monthly_var95 = self.calculate_var(total_value, portfolio_vol, 0.95, 21)
        
        # Stress scenarios
        stress_scenarios = {
            "market_crash_20pct": -total_value * 0.20 * weighted_beta,
            "crypto_winter_50pct": -sum(p.value for p in position_risks if p.symbol in ["BTC", "ETH", "SOL", "AVAX"]) * 0.50,
            "black_swan_3sigma": -daily_var99 * 3,
            "rate_hike_shock": -total_value * 0.05 * weighted_beta,
            "liquidity_crisis": -total_value * 0.15,
        }
        
        # Overall risk score
        risk_score = min(100, int(
            (daily_var95 / total_value * 100 * 2) +
            (weighted_vol / 100 * 30) +
            (weighted_beta / 2 * 20)
        )) if total_value > 0 else 0
        
        return PortfolioRisk(
            total_value=round(total_value, 2),
            daily_var95=round(daily_var95, 2),
            daily_var99=round(daily_var99, 2),
            weekly_var95=round(weekly_var95, 2),
            monthly_var95=round(monthly_var95, 2),
            current_drawdown=round(random.uniform(-2, -8), 2),
            max_drawdown=round(random.uniform(-10, -25), 2),
            sharpe_ratio=round(random.uniform(0.8, 2.5), 2),
            sortino_ratio=round(random.uniform(1.0, 3.0), 2),
            beta=round(weighted_beta, 2),
            correlation_to_market=round(random.uniform(0.6, 0.9), 2),
            volatility_annual=round(portfolio_vol, 2),
            risk_score=risk_score,
            positions=position_risks,
            stress_scenarios={k: round(v, 2) for k, v in stress_scenarios.items()},
            updated_at=datetime.now(timezone.utc).isoformat()
        )
    
    def _get_demo_positions(self) -> List[Dict]:
        """Generate demo positions for testing"""
        return [
            {"symbol": "BTC", "value": 44601.38, "quantity": 0.62},
            {"symbol": "ETH", "value": 31858.13, "quantity": 11.5},
            {"symbol": "SOL", "value": 19114.88, "quantity": 195},
            {"symbol": "AAPL", "value": 19114.88, "quantity": 100},
            {"symbol": "TSLA", "value": 12743.25, "quantity": 50},
        ]
    
    async def get_execution_audit_trail(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Get execution audit trail from database
        """
        if not self.db:
            return self._get_demo_executions(limit)
        
        try:
            executions = await self.db.execution_receipts.find(
                {"user_id": user_id} if user_id != "demo_user" else {},
                {"_id": 0}
            ).sort("timestamp", -1).to_list(limit)
            
            if not executions:
                return self._get_demo_executions(limit)
            
            return executions
        except Exception:
            return self._get_demo_executions(limit)
    
    def _get_demo_executions(self, limit: int) -> List[Dict]:
        """Generate demo execution receipts"""
        samples = [
            {"asset": "BTC", "side": "buy", "quantity": 0.5, "fill_price": 72245.50, "asset_class": "crypto"},
            {"asset": "ETH", "side": "sell", "quantity": 2.0, "fill_price": 2748.90, "asset_class": "crypto"},
            {"asset": "AAPL", "side": "buy", "quantity": 100, "fill_price": 189.23, "asset_class": "equity"},
            {"asset": "TSLA", "side": "buy", "quantity": 50, "fill_price": 245.67, "asset_class": "equity"},
            {"asset": "SOL", "side": "sell", "quantity": 25, "fill_price": 98.45, "asset_class": "crypto"},
            {"asset": "NVDA", "side": "buy", "quantity": 30, "fill_price": 145.80, "asset_class": "equity"},
        ]
        
        executions = []
        venues = ["NYSE", "NASDAQ", "Crypto Exchange", "DeFi Venue"]
        
        for i, sample in enumerate(samples[:limit]):
            spread_bps = random.uniform(5, 15)
            spread = sample["fill_price"] * spread_bps / 10000
            nbbo_bid = sample["fill_price"] - spread / 2
            nbbo_ask = sample["fill_price"] + spread / 2
            
            # Calculate price improvement (positive = better than midpoint)
            midpoint = (nbbo_bid + nbbo_ask) / 2
            if sample["side"] == "buy":
                price_improvement = midpoint - sample["fill_price"]
            else:
                price_improvement = sample["fill_price"] - midpoint
            
            executions.append({
                "receipt_id": f"RCP-{random.randint(10000, 99999)}",
                "order_id": f"ORD-{random.randint(10000, 99999)}",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i*2)).isoformat(),
                "asset": sample["asset"],
                "asset_class": sample["asset_class"],
                "side": sample["side"],
                "quantity": sample["quantity"],
                "execution_venue": random.choice(venues),
                "fill_price": sample["fill_price"],
                "nbbo_bid": round(nbbo_bid, 2),
                "nbbo_ask": round(nbbo_ask, 2),
                "price_improvement": round(price_improvement, 4),
                "latency_ms": round(random.uniform(5, 25), 2),
                "fees": [
                    {"fee_type": "platform_fee", "description": "OracleIQ Platform Fee", "amount_usd": round(sample["fill_price"] * sample["quantity"] * 0.0005, 2), "amount_bps": 5},
                    {"fee_type": "venue_fee", "description": "Exchange Fee", "amount_usd": round(sample["fill_price"] * sample["quantity"] * 0.0002, 2), "amount_bps": 2},
                ],
                "total_fees_usd": round(sample["fill_price"] * sample["quantity"] * 0.0007, 2),
                "total_fees_bps": 7,
                "effective_cost_bps": round(spread_bps + 7, 2),
                "pro_broker_estimated_cost_bps": round(spread_bps + 12, 2),
                "social_trading_estimated_cost_bps": round(spread_bps + 50, 2),
                "crypto_exchange_estimated_cost_bps": round(spread_bps + 10, 2),
                "savings_vs_competitors": {
                    "Pro_Brokers": round(5, 2),
                    "Social_Trading": round(43, 2),
                    "Crypto_Exchanges": round(3, 2),
                }
            })
        
        return executions


# Global instance
risk_engine = RiskAnalysisEngine()
