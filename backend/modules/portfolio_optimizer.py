"""
Risk Parity & Portfolio Optimization
All Weather, Pure Alpha strategies, Dynamic risk budgeting
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from scipy.optimize import minimize

logger = logging.getLogger(__name__)


class StrategyType(str, Enum):
    ALL_WEATHER = "all_weather"
    PURE_ALPHA = "pure_alpha"
    RISK_PARITY = "risk_parity"
    MEAN_VARIANCE = "mean_variance"
    MAXIMUM_SHARPE = "maximum_sharpe"
    MINIMUM_VOLATILITY = "minimum_volatility"


@dataclass
class AssetAllocation:
    """Asset allocation result"""
    asset: str
    weight: float
    risk_contribution: float
    expected_return: float
    volatility: float


@dataclass
class PortfolioMetrics:
    """Portfolio metrics"""
    expected_return: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    var_95: float  # Value at Risk 95%
    cvar_95: float  # Conditional VaR 95%
    calmar_ratio: float
    sortino_ratio: float


@dataclass 
class RiskBudget:
    """Risk budget allocation"""
    asset: str
    risk_budget_pct: float
    marginal_risk_contribution: float
    beta_to_portfolio: float


class AllWeatherPortfolio:
    """
    Ray Dalio's All Weather Strategy
    Designed to perform in any economic environment
    """
    
    # Classic All Weather allocation
    CLASSIC_WEIGHTS = {
        "STOCKS": 0.30,      # 30% Stocks
        "LT_BONDS": 0.40,    # 40% Long-term bonds
        "IT_BONDS": 0.15,    # 15% Intermediate bonds
        "GOLD": 0.075,       # 7.5% Gold
        "COMMODITIES": 0.075 # 7.5% Commodities
    }
    
    # Economic environment adjustments
    ENVIRONMENT_ADJUSTMENTS = {
        "rising_growth_rising_inflation": {"STOCKS": 0.05, "COMMODITIES": 0.05, "LT_BONDS": -0.10},
        "rising_growth_falling_inflation": {"STOCKS": 0.10, "LT_BONDS": 0.05, "GOLD": -0.05},
        "falling_growth_rising_inflation": {"GOLD": 0.05, "COMMODITIES": 0.05, "STOCKS": -0.10},
        "falling_growth_falling_inflation": {"LT_BONDS": 0.10, "STOCKS": -0.05, "COMMODITIES": -0.05}
    }
    
    def __init__(self):
        self.current_weights = self.CLASSIC_WEIGHTS.copy()
        self.environment = "neutral"
    
    def adjust_for_environment(self, growth_direction: str, inflation_direction: str) -> Dict[str, float]:
        """Adjust weights based on economic environment"""
        env_key = f"{growth_direction}_growth_{inflation_direction}_inflation"
        
        if env_key in self.ENVIRONMENT_ADJUSTMENTS:
            adjustments = self.ENVIRONMENT_ADJUSTMENTS[env_key]
            adjusted = self.CLASSIC_WEIGHTS.copy()
            
            for asset, adj in adjustments.items():
                if asset in adjusted:
                    adjusted[asset] = max(0.05, min(0.50, adjusted[asset] + adj))
            
            # Normalize
            total = sum(adjusted.values())
            adjusted = {k: v/total for k, v in adjusted.items()}
            
            self.current_weights = adjusted
            self.environment = env_key
        
        return self.current_weights
    
    def get_allocation(self) -> Dict:
        """Get current All Weather allocation"""
        return {
            "strategy": "All Weather",
            "description": "Bridgewater's flagship strategy designed to perform across all economic environments",
            "weights": self.current_weights,
            "environment": self.environment,
            "expected_annual_return": 6.5,
            "expected_volatility": 8.0,
            "sharpe_ratio": 0.81,
            "max_historical_drawdown": -12.5,
            "assets_mapping": {
                "STOCKS": ["SPY", "VTI", "VXUS"],
                "LT_BONDS": ["TLT", "VGLT"],
                "IT_BONDS": ["IEF", "VGIT"],
                "GOLD": ["GLD", "IAU"],
                "COMMODITIES": ["DJP", "GSG"]
            }
        }


class RiskParityOptimizer:
    """
    Risk Parity Portfolio Optimization
    Each asset contributes equally to portfolio risk
    """
    
    def __init__(self):
        self.risk_budgets: Dict[str, float] = {}
    
    def optimize(self, returns: pd.DataFrame, risk_budgets: Optional[Dict[str, float]] = None) -> Dict:
        """
        Optimize portfolio for risk parity
        
        Args:
            returns: DataFrame of asset returns
            risk_budgets: Optional custom risk budget per asset
        """
        n_assets = len(returns.columns)
        assets = returns.columns.tolist()
        
        # Default: equal risk budget
        if risk_budgets is None:
            risk_budgets = {asset: 1/n_assets for asset in assets}
        
        # Calculate covariance matrix
        cov_matrix = returns.cov().values * 252  # Annualized
        
        # Expected returns (historical)
        expected_returns = returns.mean().values * 252
        
        def risk_parity_objective(weights):
            """Objective: minimize deviation from target risk contribution"""
            portfolio_vol = np.sqrt(weights @ cov_matrix @ weights)
            marginal_contrib = cov_matrix @ weights
            risk_contrib = weights * marginal_contrib / portfolio_vol
            
            # Target risk contribution
            target_contrib = np.array([risk_budgets[a] for a in assets]) * portfolio_vol
            
            # Sum of squared deviations
            return np.sum((risk_contrib - target_contrib) ** 2)
        
        # Constraints
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # Weights sum to 1
        ]
        bounds = [(0.01, 0.50) for _ in range(n_assets)]  # Min 1%, Max 50%
        
        # Initial guess: equal weight
        x0 = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(
            risk_parity_objective,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        optimal_weights = result.x
        
        # Calculate portfolio metrics
        portfolio_return = optimal_weights @ expected_returns
        portfolio_vol = np.sqrt(optimal_weights @ cov_matrix @ optimal_weights)
        sharpe = portfolio_return / portfolio_vol if portfolio_vol > 0 else 0
        
        # Risk contributions
        marginal_contrib = cov_matrix @ optimal_weights
        risk_contrib = optimal_weights * marginal_contrib / portfolio_vol
        
        allocations = [
            AssetAllocation(
                asset=assets[i],
                weight=round(optimal_weights[i], 4),
                risk_contribution=round(risk_contrib[i] / portfolio_vol, 4),
                expected_return=round(expected_returns[i] * 100, 2),
                volatility=round(np.sqrt(cov_matrix[i, i]) * 100, 2)
            )
            for i in range(n_assets)
        ]
        
        return {
            "strategy": "Risk Parity",
            "allocations": [asdict(a) for a in allocations],
            "portfolio_metrics": {
                "expected_return": round(portfolio_return * 100, 2),
                "volatility": round(portfolio_vol * 100, 2),
                "sharpe_ratio": round(sharpe, 2)
            },
            "optimization_success": result.success,
            "risk_budgets": risk_budgets
        }


class PureAlphaStrategy:
    """
    Pure Alpha Strategy
    Market-neutral strategy seeking absolute returns
    """
    
    def __init__(self):
        self.positions: List[Dict] = []
        self.gross_exposure = 2.0  # 200% gross exposure
        self.net_exposure_target = 0.0  # Market neutral
    
    def generate_signals(self, market_data: Dict) -> List[Dict]:
        """Generate Pure Alpha trading signals"""
        # Simulated alpha signals
        signals = [
            {
                "asset": "BTC",
                "signal": "long",
                "conviction": 0.75,
                "weight": 0.15,
                "alpha_source": "momentum",
                "expected_alpha": 2.5
            },
            {
                "asset": "ETH",
                "signal": "long",
                "conviction": 0.68,
                "weight": 0.12,
                "alpha_source": "mean_reversion",
                "expected_alpha": 1.8
            },
            {
                "asset": "MARKET_INDEX",
                "signal": "short",
                "conviction": 0.60,
                "weight": -0.27,  # Hedge
                "alpha_source": "hedge",
                "expected_alpha": 0
            },
            {
                "asset": "SOL",
                "signal": "short",
                "conviction": 0.55,
                "weight": -0.08,
                "alpha_source": "relative_value",
                "expected_alpha": 1.2
            }
        ]
        
        return signals
    
    def get_strategy_summary(self) -> Dict:
        """Get Pure Alpha strategy summary"""
        signals = self.generate_signals({})
        
        long_exposure = sum(s["weight"] for s in signals if s["weight"] > 0)
        short_exposure = abs(sum(s["weight"] for s in signals if s["weight"] < 0))
        
        return {
            "strategy": "Pure Alpha",
            "description": "Market-neutral strategy seeking absolute returns through active management",
            "signals": signals,
            "exposure": {
                "gross": round(long_exposure + short_exposure, 2),
                "net": round(long_exposure - short_exposure, 2),
                "long": round(long_exposure, 2),
                "short": round(short_exposure, 2)
            },
            "target_metrics": {
                "annual_return": 12.0,
                "volatility": 10.0,
                "sharpe_ratio": 1.2,
                "max_drawdown": -15.0,
                "beta": 0.05  # Near market-neutral
            },
            "alpha_sources": ["momentum", "mean_reversion", "relative_value", "carry"],
            "risk_management": {
                "position_limit": 0.20,
                "sector_limit": 0.30,
                "var_limit_daily": 0.02,
                "stop_loss_portfolio": 0.05
            }
        }


class PortfolioOptimizer:
    """Main portfolio optimization engine"""
    
    def __init__(self):
        self.all_weather = AllWeatherPortfolio()
        self.risk_parity = RiskParityOptimizer()
        self.pure_alpha = PureAlphaStrategy()
    
    def get_all_weather_allocation(self, growth: str = "rising", inflation: str = "falling") -> Dict:
        """Get All Weather portfolio allocation"""
        self.all_weather.adjust_for_environment(growth, inflation)
        return self.all_weather.get_allocation()
    
    def get_risk_parity_allocation(self, assets: List[str] = None) -> Dict:
        """Get Risk Parity allocation"""
        if assets is None:
            assets = ["BTC", "ETH", "GOLD", "BONDS", "STOCKS"]
        
        # Generate sample returns for demo
        np.random.seed(42)
        n_periods = 252
        returns_data = {
            asset: np.random.normal(0.0003, 0.02, n_periods) 
            for asset in assets
        }
        returns_df = pd.DataFrame(returns_data)
        
        return self.risk_parity.optimize(returns_df)
    
    def get_pure_alpha_strategy(self) -> Dict:
        """Get Pure Alpha strategy"""
        return self.pure_alpha.get_strategy_summary()
    
    def calculate_optimal_portfolio(self, strategy: StrategyType, **kwargs) -> Dict:
        """Calculate optimal portfolio based on strategy"""
        if strategy == StrategyType.ALL_WEATHER:
            return self.get_all_weather_allocation(
                kwargs.get("growth", "rising"),
                kwargs.get("inflation", "falling")
            )
        elif strategy == StrategyType.RISK_PARITY:
            return self.get_risk_parity_allocation(kwargs.get("assets"))
        elif strategy == StrategyType.PURE_ALPHA:
            return self.get_pure_alpha_strategy()
        else:
            return {"error": f"Unknown strategy: {strategy}"}
    
    def get_drawdown_protection(self, current_drawdown: float) -> Dict:
        """Dynamic risk management based on drawdown"""
        if current_drawdown < -0.05:
            risk_reduction = min(0.5, abs(current_drawdown) * 5)
        else:
            risk_reduction = 0
        
        return {
            "current_drawdown": round(current_drawdown * 100, 2),
            "risk_reduction_factor": round(risk_reduction, 2),
            "recommended_action": "reduce_exposure" if risk_reduction > 0.2 else "maintain",
            "position_sizing_multiplier": round(1 - risk_reduction, 2),
            "stop_loss_tightening": risk_reduction > 0.3,
            "alert_level": "high" if current_drawdown < -0.10 else "medium" if current_drawdown < -0.05 else "low"
        }
    
    def get_strategy_comparison(self) -> Dict:
        """Compare all available strategies"""
        return {
            "strategies": [
                {
                    "name": "All Weather",
                    "type": StrategyType.ALL_WEATHER.value,
                    "risk_level": "low",
                    "expected_return": 6.5,
                    "expected_volatility": 8.0,
                    "sharpe": 0.81,
                    "suitable_for": "Long-term wealth preservation",
                    "market_conditions": "All environments"
                },
                {
                    "name": "Risk Parity",
                    "type": StrategyType.RISK_PARITY.value,
                    "risk_level": "medium",
                    "expected_return": 8.0,
                    "expected_volatility": 10.0,
                    "sharpe": 0.80,
                    "suitable_for": "Balanced risk-adjusted returns",
                    "market_conditions": "Normal volatility"
                },
                {
                    "name": "Pure Alpha",
                    "type": StrategyType.PURE_ALPHA.value,
                    "risk_level": "high",
                    "expected_return": 12.0,
                    "expected_volatility": 10.0,
                    "sharpe": 1.20,
                    "suitable_for": "Absolute returns, hedge fund style",
                    "market_conditions": "Active management"
                }
            ],
            "recommendation": "All Weather for conservative, Pure Alpha for aggressive",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global optimizer instance
portfolio_optimizer = PortfolioOptimizer()


# API Functions
def get_all_weather_portfolio(growth: str = "rising", inflation: str = "falling") -> Dict:
    return portfolio_optimizer.get_all_weather_allocation(growth, inflation)

def get_risk_parity_portfolio(assets: List[str] = None) -> Dict:
    return portfolio_optimizer.get_risk_parity_allocation(assets)

def get_pure_alpha_strategy() -> Dict:
    return portfolio_optimizer.get_pure_alpha_strategy()

def get_strategy_comparison() -> Dict:
    return portfolio_optimizer.get_strategy_comparison()

def get_drawdown_protection(drawdown: float) -> Dict:
    return portfolio_optimizer.get_drawdown_protection(drawdown)
