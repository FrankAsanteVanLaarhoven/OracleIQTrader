# OracleIQTrader - Advanced Risk Modeling Engine
# Institutional-grade portfolio analytics: Sharpe, Sortino, VaR, CVaR, Tail Risk

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import math

class RiskModelingEngine:
    """
    Institutional-grade risk modeling for portfolio analytics.
    Implements Sharpe, Sortino, VaR, CVaR, and tail-risk metrics.
    """
    
    def __init__(self, risk_free_rate: float = 0.05):
        self.risk_free_rate = risk_free_rate  # Annual risk-free rate (5%)
        self.trading_days = 252  # Annual trading days
        
    def calculate_returns(self, prices: List[float]) -> np.ndarray:
        """Calculate daily returns from price series"""
        prices = np.array(prices)
        returns = np.diff(prices) / prices[:-1]
        return returns
    
    def sharpe_ratio(self, returns: np.ndarray, annualize: bool = True) -> float:
        """
        Calculate Sharpe Ratio - risk-adjusted return measure
        Sharpe = (Rp - Rf) / σp
        """
        if len(returns) < 2:
            return 0.0
            
        mean_return = np.mean(returns)
        std_return = np.std(returns, ddof=1)
        
        if std_return == 0:
            return 0.0
            
        daily_rf = self.risk_free_rate / self.trading_days
        sharpe = (mean_return - daily_rf) / std_return
        
        if annualize:
            sharpe *= np.sqrt(self.trading_days)
            
        return round(sharpe, 4)
    
    def sortino_ratio(self, returns: np.ndarray, annualize: bool = True) -> float:
        """
        Calculate Sortino Ratio - penalizes only downside volatility
        Sortino = (Rp - Rf) / σd (downside deviation)
        """
        if len(returns) < 2:
            return 0.0
            
        mean_return = np.mean(returns)
        daily_rf = self.risk_free_rate / self.trading_days
        
        # Calculate downside deviation (only negative returns)
        negative_returns = returns[returns < daily_rf]
        if len(negative_returns) == 0:
            return float('inf')  # No downside risk
            
        downside_std = np.std(negative_returns, ddof=1)
        
        if downside_std == 0:
            return float('inf')
            
        sortino = (mean_return - daily_rf) / downside_std
        
        if annualize:
            sortino *= np.sqrt(self.trading_days)
            
        return round(sortino, 4)
    
    def calmar_ratio(self, returns: np.ndarray, max_drawdown: float) -> float:
        """
        Calculate Calmar Ratio - return over max drawdown
        Calmar = Annual Return / |Max Drawdown|
        """
        if max_drawdown == 0:
            return float('inf')
            
        annual_return = np.mean(returns) * self.trading_days
        calmar = annual_return / abs(max_drawdown)
        
        return round(calmar, 4)
    
    def value_at_risk(self, returns: np.ndarray, confidence: float = 0.95, 
                      method: str = "historical") -> Dict:
        """
        Calculate Value at Risk (VaR)
        - Historical: Percentile-based
        - Parametric: Assumes normal distribution
        - Monte Carlo: Simulation-based
        """
        if len(returns) < 10:
            return {"var": 0, "method": method, "confidence": confidence}
            
        if method == "historical":
            var = np.percentile(returns, (1 - confidence) * 100)
        elif method == "parametric":
            mean = np.mean(returns)
            std = np.std(returns, ddof=1)
            z_score = 1.645 if confidence == 0.95 else 2.326  # 95% or 99%
            var = mean - z_score * std
        elif method == "monte_carlo":
            mean = np.mean(returns)
            std = np.std(returns, ddof=1)
            simulations = np.random.normal(mean, std, 10000)
            var = np.percentile(simulations, (1 - confidence) * 100)
        else:
            var = np.percentile(returns, (1 - confidence) * 100)
            
        return {
            "var": round(var * 100, 4),  # As percentage
            "var_dollar": None,  # Set when portfolio value known
            "method": method,
            "confidence": confidence,
            "interpretation": f"With {confidence*100}% confidence, daily loss won't exceed {abs(var)*100:.2f}%"
        }
    
    def conditional_var(self, returns: np.ndarray, confidence: float = 0.95) -> Dict:
        """
        Calculate Conditional VaR (CVaR) / Expected Shortfall
        Average loss when VaR is exceeded (tail risk measure)
        """
        if len(returns) < 10:
            return {"cvar": 0, "confidence": confidence}
            
        var_threshold = np.percentile(returns, (1 - confidence) * 100)
        tail_returns = returns[returns <= var_threshold]
        
        if len(tail_returns) == 0:
            cvar = var_threshold
        else:
            cvar = np.mean(tail_returns)
            
        return {
            "cvar": round(cvar * 100, 4),
            "var": round(var_threshold * 100, 4),
            "confidence": confidence,
            "tail_events": len(tail_returns),
            "interpretation": f"Expected loss in worst {(1-confidence)*100}% of cases: {abs(cvar)*100:.2f}%"
        }
    
    def max_drawdown(self, prices: List[float]) -> Dict:
        """
        Calculate Maximum Drawdown and drawdown duration
        """
        prices = np.array(prices)
        peak = prices[0]
        max_dd = 0
        max_dd_start = 0
        max_dd_end = 0
        current_dd_start = 0
        
        for i, price in enumerate(prices):
            if price > peak:
                peak = price
                current_dd_start = i
            
            drawdown = (peak - price) / peak
            if drawdown > max_dd:
                max_dd = drawdown
                max_dd_start = current_dd_start
                max_dd_end = i
                
        return {
            "max_drawdown": round(max_dd * 100, 2),
            "drawdown_start_idx": max_dd_start,
            "drawdown_end_idx": max_dd_end,
            "drawdown_duration": max_dd_end - max_dd_start,
            "interpretation": f"Maximum peak-to-trough decline: {max_dd*100:.2f}%"
        }
    
    def tail_risk_analysis(self, returns: np.ndarray) -> Dict:
        """
        Comprehensive tail risk analysis
        """
        if len(returns) < 30:
            return {"error": "Insufficient data for tail risk analysis"}
            
        # Skewness (negative = left tail risk)
        mean = np.mean(returns)
        std = np.std(returns, ddof=1)
        skewness = np.mean(((returns - mean) / std) ** 3)
        
        # Kurtosis (excess kurtosis, >0 = fat tails)
        kurtosis = np.mean(((returns - mean) / std) ** 4) - 3
        
        # Tail ratios
        left_tail = returns[returns < np.percentile(returns, 5)]
        right_tail = returns[returns > np.percentile(returns, 95)]
        
        return {
            "skewness": round(skewness, 4),
            "skewness_interpretation": "Left-skewed (crash risk)" if skewness < -0.5 else "Right-skewed (upside)" if skewness > 0.5 else "Symmetric",
            "kurtosis": round(kurtosis, 4),
            "kurtosis_interpretation": "Fat tails (extreme events likely)" if kurtosis > 1 else "Thin tails (normal distribution)" if kurtosis < -1 else "Normal tails",
            "left_tail_avg": round(np.mean(left_tail) * 100, 2) if len(left_tail) > 0 else 0,
            "right_tail_avg": round(np.mean(right_tail) * 100, 2) if len(right_tail) > 0 else 0,
            "tail_ratio": round(abs(np.mean(left_tail) / np.mean(right_tail)), 2) if len(right_tail) > 0 and np.mean(right_tail) != 0 else 0
        }
    
    def correlation_matrix(self, asset_returns: Dict[str, List[float]]) -> Dict:
        """
        Calculate correlation matrix between assets
        """
        assets = list(asset_returns.keys())
        n = len(assets)
        
        # Ensure all arrays same length
        min_len = min(len(r) for r in asset_returns.values())
        returns_matrix = np.array([asset_returns[a][:min_len] for a in assets])
        
        corr_matrix = np.corrcoef(returns_matrix)
        
        # Format as readable dict
        correlations = {}
        for i, asset_i in enumerate(assets):
            correlations[asset_i] = {}
            for j, asset_j in enumerate(assets):
                correlations[asset_i][asset_j] = round(corr_matrix[i, j], 4)
                
        # Find highest/lowest correlations (excluding self)
        pairs = []
        for i in range(n):
            for j in range(i + 1, n):
                pairs.append({
                    "pair": f"{assets[i]}/{assets[j]}",
                    "correlation": round(corr_matrix[i, j], 4)
                })
        
        pairs.sort(key=lambda x: x["correlation"])
        
        return {
            "matrix": correlations,
            "most_correlated": pairs[-1] if pairs else None,
            "least_correlated": pairs[0] if pairs else None,
            "diversification_score": round(1 - np.mean(np.abs(corr_matrix[np.triu_indices(n, 1)])), 2)
        }
    
    def portfolio_risk_summary(self, prices: List[float], 
                                portfolio_value: float = 100000) -> Dict:
        """
        Generate comprehensive portfolio risk summary
        """
        returns = self.calculate_returns(prices)
        
        if len(returns) < 10:
            return {"error": "Insufficient price history for risk analysis"}
        
        # Calculate all metrics
        sharpe = self.sharpe_ratio(returns)
        sortino = self.sortino_ratio(returns)
        var_95 = self.value_at_risk(returns, 0.95)
        var_99 = self.value_at_risk(returns, 0.99)
        cvar = self.conditional_var(returns)
        drawdown = self.max_drawdown(prices)
        tail = self.tail_risk_analysis(returns)
        calmar = self.calmar_ratio(returns, drawdown["max_drawdown"] / 100)
        
        # Add dollar amounts
        var_95["var_dollar"] = round(portfolio_value * abs(var_95["var"]) / 100, 2)
        var_99["var_dollar"] = round(portfolio_value * abs(var_99["var"]) / 100, 2)
        
        # Risk grade
        risk_score = self._calculate_risk_score(sharpe, sortino, var_95["var"], drawdown["max_drawdown"])
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "portfolio_value": portfolio_value,
            "metrics": {
                "sharpe_ratio": sharpe,
                "sortino_ratio": sortino,
                "calmar_ratio": calmar,
                "annualized_return": round(np.mean(returns) * self.trading_days * 100, 2),
                "annualized_volatility": round(np.std(returns, ddof=1) * np.sqrt(self.trading_days) * 100, 2)
            },
            "var_analysis": {
                "var_95": var_95,
                "var_99": var_99,
                "cvar_95": cvar
            },
            "drawdown": drawdown,
            "tail_risk": tail,
            "risk_grade": risk_score,
            "recommendations": self._generate_recommendations(risk_score, tail, drawdown)
        }
    
    def _calculate_risk_score(self, sharpe: float, sortino: float, 
                               var: float, max_dd: float) -> Dict:
        """Calculate overall risk score (A+ to F)"""
        score = 0
        
        # Sharpe contribution (0-25 points)
        if sharpe > 2: score += 25
        elif sharpe > 1: score += 20
        elif sharpe > 0.5: score += 15
        elif sharpe > 0: score += 10
        else: score += 5
        
        # Sortino contribution (0-25 points)
        if sortino > 3: score += 25
        elif sortino > 2: score += 20
        elif sortino > 1: score += 15
        elif sortino > 0: score += 10
        else: score += 5
        
        # VaR contribution (0-25 points, lower is better)
        var_abs = abs(var)
        if var_abs < 2: score += 25
        elif var_abs < 3: score += 20
        elif var_abs < 5: score += 15
        elif var_abs < 7: score += 10
        else: score += 5
        
        # Max DD contribution (0-25 points, lower is better)
        if max_dd < 10: score += 25
        elif max_dd < 20: score += 20
        elif max_dd < 30: score += 15
        elif max_dd < 50: score += 10
        else: score += 5
        
        # Grade mapping
        if score >= 90: grade = "A+"
        elif score >= 80: grade = "A"
        elif score >= 70: grade = "B+"
        elif score >= 60: grade = "B"
        elif score >= 50: grade = "C+"
        elif score >= 40: grade = "C"
        elif score >= 30: grade = "D"
        else: grade = "F"
        
        return {
            "score": score,
            "grade": grade,
            "risk_level": "Low" if score >= 70 else "Medium" if score >= 50 else "High"
        }
    
    def _generate_recommendations(self, risk_score: Dict, tail: Dict, drawdown: Dict) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_score["grade"] in ["D", "F"]:
            recommendations.append("⚠️ HIGH RISK: Consider reducing position sizes by 50%")
            
        if tail.get("kurtosis", 0) > 2:
            recommendations.append("📊 Fat tails detected: Implement tail-risk hedging (put options, stop-losses)")
            
        if tail.get("skewness", 0) < -1:
            recommendations.append("📉 Negative skew: Portfolio vulnerable to crash risk. Consider protective puts")
            
        if drawdown.get("max_drawdown", 0) > 30:
            recommendations.append("🔻 Large drawdown history: Implement trailing stop-losses at 15-20%")
            
        if risk_score["risk_level"] == "Low":
            recommendations.append("✅ Risk profile healthy. Consider slight leverage for alpha generation")
            
        if not recommendations:
            recommendations.append("📈 Portfolio risk within acceptable parameters")
            
        return recommendations


# Singleton instance
risk_engine = RiskModelingEngine()


# API Functions
def get_portfolio_risk_analysis(prices: List[float], portfolio_value: float = 100000) -> Dict:
    """Get comprehensive portfolio risk analysis"""
    return risk_engine.portfolio_risk_summary(prices, portfolio_value)

def get_sharpe_ratio(prices: List[float]) -> Dict:
    """Calculate Sharpe ratio"""
    returns = risk_engine.calculate_returns(prices)
    return {
        "sharpe_ratio": risk_engine.sharpe_ratio(returns),
        "interpretation": "Excellent" if risk_engine.sharpe_ratio(returns) > 1 else "Good" if risk_engine.sharpe_ratio(returns) > 0.5 else "Poor"
    }

def get_var_analysis(prices: List[float], confidence: float = 0.95) -> Dict:
    """Calculate Value at Risk"""
    returns = risk_engine.calculate_returns(prices)
    return risk_engine.value_at_risk(returns, confidence)

def get_correlation_analysis(asset_prices: Dict[str, List[float]]) -> Dict:
    """Calculate correlation matrix between assets"""
    asset_returns = {k: list(risk_engine.calculate_returns(v)) for k, v in asset_prices.items()}
    return risk_engine.correlation_matrix(asset_returns)

def get_tail_risk(prices: List[float]) -> Dict:
    """Get tail risk analysis"""
    returns = risk_engine.calculate_returns(prices)
    return risk_engine.tail_risk_analysis(returns)
