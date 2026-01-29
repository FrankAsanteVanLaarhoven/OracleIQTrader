"""
Institutional Dashboard
Government/Central Bank advisory, Hedge Fund recommendations, Systemic risk monitoring
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"
    HIGH = "high"
    CRITICAL = "critical"


class ClientType(str, Enum):
    CENTRAL_BANK = "central_bank"
    SOVEREIGN_WEALTH = "sovereign_wealth"
    HEDGE_FUND = "hedge_fund"
    PENSION_FUND = "pension_fund"
    BANK = "bank"
    GOVERNMENT = "government"
    FAMILY_OFFICE = "family_office"


@dataclass
class SystemicRiskIndicator:
    """Systemic risk monitoring"""
    name: str
    current_value: float
    threshold_warning: float
    threshold_critical: float
    status: RiskLevel
    trend: str
    description: str


@dataclass
class AdvisoryRecommendation:
    """Advisory recommendation for institutional clients"""
    client_type: ClientType
    recommendation: str
    rationale: str
    priority: str
    action_items: List[str]
    risk_considerations: List[str]


class InstitutionalDashboard:
    """
    Dashboard for institutional clients
    Provides advisory for central banks, governments, hedge funds, banks
    """
    
    def __init__(self):
        self._initialize_risk_indicators()
    
    def _initialize_risk_indicators(self):
        """Initialize systemic risk indicators"""
        self.risk_indicators = [
            SystemicRiskIndicator(
                name="Global Debt/GDP",
                current_value=356,
                threshold_warning=350,
                threshold_critical=400,
                status=RiskLevel.ELEVATED,
                trend="rising",
                description="Total global debt as percentage of GDP"
            ),
            SystemicRiskIndicator(
                name="Credit Spreads (IG)",
                current_value=115,
                threshold_warning=150,
                threshold_critical=250,
                status=RiskLevel.LOW,
                trend="stable",
                description="Investment grade credit spreads in basis points"
            ),
            SystemicRiskIndicator(
                name="VIX Index",
                current_value=14.5,
                threshold_warning=25,
                threshold_critical=40,
                status=RiskLevel.LOW,
                trend="falling",
                description="Market volatility index"
            ),
            SystemicRiskIndicator(
                name="MOVE Index",
                current_value=95,
                threshold_warning=120,
                threshold_critical=180,
                status=RiskLevel.LOW,
                trend="stable",
                description="Bond market volatility"
            ),
            SystemicRiskIndicator(
                name="Dollar Liquidity Index",
                current_value=82,
                threshold_warning=70,
                threshold_critical=50,
                status=RiskLevel.MODERATE,
                trend="falling",
                description="Global dollar liquidity conditions"
            ),
            SystemicRiskIndicator(
                name="Bank CDS Spreads",
                current_value=68,
                threshold_warning=100,
                threshold_critical=200,
                status=RiskLevel.LOW,
                trend="stable",
                description="Average G-SIB CDS spreads"
            ),
            SystemicRiskIndicator(
                name="Yield Curve (2s10s)",
                current_value=-15,
                threshold_warning=-50,
                threshold_critical=-100,
                status=RiskLevel.MODERATE,
                trend="steepening",
                description="Treasury yield curve slope in basis points"
            ),
            SystemicRiskIndicator(
                name="Crypto Volatility",
                current_value=45,
                threshold_warning=80,
                threshold_critical=120,
                status=RiskLevel.LOW,
                trend="falling",
                description="Bitcoin 30-day realized volatility"
            )
        ]
    
    def get_systemic_risk_dashboard(self) -> Dict:
        """Get comprehensive systemic risk dashboard"""
        # Calculate aggregate risk score
        risk_scores = {
            RiskLevel.LOW: 0,
            RiskLevel.MODERATE: 25,
            RiskLevel.ELEVATED: 50,
            RiskLevel.HIGH: 75,
            RiskLevel.CRITICAL: 100
        }
        
        avg_risk = sum(risk_scores[ind.status] for ind in self.risk_indicators) / len(self.risk_indicators)
        
        if avg_risk < 20:
            overall_status = RiskLevel.LOW
        elif avg_risk < 35:
            overall_status = RiskLevel.MODERATE
        elif avg_risk < 50:
            overall_status = RiskLevel.ELEVATED
        elif avg_risk < 75:
            overall_status = RiskLevel.HIGH
        else:
            overall_status = RiskLevel.CRITICAL
        
        elevated_indicators = [ind for ind in self.risk_indicators if ind.status in [RiskLevel.ELEVATED, RiskLevel.HIGH, RiskLevel.CRITICAL]]
        
        return {
            "overall_risk_level": overall_status.value,
            "aggregate_risk_score": round(avg_risk, 1),
            "indicators": [asdict(ind) for ind in self.risk_indicators],
            "elevated_risks": [asdict(ind) for ind in elevated_indicators],
            "key_concerns": self._get_key_concerns(),
            "recommendation": self._get_overall_recommendation(overall_status),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    def _get_key_concerns(self) -> List[str]:
        """Get current key concerns"""
        concerns = []
        
        for ind in self.risk_indicators:
            if ind.status in [RiskLevel.ELEVATED, RiskLevel.HIGH]:
                concerns.append(f"{ind.name}: {ind.description} ({ind.trend})")
        
        if not concerns:
            concerns = ["No elevated systemic risks detected"]
        
        return concerns
    
    def _get_overall_recommendation(self, risk_level: RiskLevel) -> str:
        """Get overall recommendation based on risk level"""
        recommendations = {
            RiskLevel.LOW: "Risk environment supportive. Maintain strategic allocations with tactical flexibility.",
            RiskLevel.MODERATE: "Mixed signals warrant caution. Consider modest de-risking in vulnerable areas.",
            RiskLevel.ELEVATED: "Elevated risk conditions. Reduce leverage, increase hedges, favor quality.",
            RiskLevel.HIGH: "High risk environment. Significant de-risking recommended. Prioritize capital preservation.",
            RiskLevel.CRITICAL: "CRITICAL: Systemic stress elevated. Move to defensive positioning. Cash and safe assets."
        }
        return recommendations.get(risk_level, "Monitor conditions closely.")
    
    def get_central_bank_advisory(self) -> Dict:
        """Advisory for central banks"""
        return {
            "client_type": ClientType.CENTRAL_BANK.value,
            "executive_briefing": {
                "title": "Central Bank Policy Advisory",
                "summary": "Current conditions suggest maintaining a data-dependent approach with bias toward gradual normalization.",
                "key_metrics": {
                    "inflation_outlook": "Moderating toward target",
                    "growth_outlook": "Soft landing scenario base case",
                    "financial_stability": "Generally sound, watch commercial real estate",
                    "labor_market": "Gradual rebalancing in progress"
                }
            },
            "policy_recommendations": [
                {
                    "recommendation": "Maintain current rate stance",
                    "rationale": "Inflation moderating but above target; economy resilient",
                    "confidence": 0.75
                },
                {
                    "recommendation": "Continue QT at current pace",
                    "rationale": "Reserves ample; money markets stable",
                    "confidence": 0.70
                },
                {
                    "recommendation": "Enhance communication clarity",
                    "rationale": "Market expectations well-anchored; avoid surprises",
                    "confidence": 0.85
                }
            ],
            "risk_scenarios": [
                {
                    "scenario": "Inflation reacceleration",
                    "probability": 0.20,
                    "response": "Additional tightening may be needed"
                },
                {
                    "scenario": "Growth shock",
                    "probability": 0.15,
                    "response": "Prepared to cut rates if needed"
                },
                {
                    "scenario": "Financial stress event",
                    "probability": 0.10,
                    "response": "Liquidity facilities ready"
                }
            ],
            "global_coordination": {
                "status": "Central banks broadly aligned on policy direction",
                "divergence_risk": "Moderate - BOJ normalization a watch item"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_sovereign_wealth_advisory(self) -> Dict:
        """Advisory for sovereign wealth funds"""
        return {
            "client_type": ClientType.SOVEREIGN_WEALTH.value,
            "strategic_allocation": {
                "public_equities": {"weight": 40, "recommendation": "Neutral", "regions": ["US overweight", "EM selective"]},
                "fixed_income": {"weight": 25, "recommendation": "Underweight duration", "preference": "Short-term quality"},
                "alternatives": {"weight": 20, "recommendation": "Overweight", "focus": ["Private credit", "Infrastructure"]},
                "real_assets": {"weight": 10, "recommendation": "Neutral", "preference": "Inflation-linked"},
                "cash": {"weight": 5, "recommendation": "Tactical reserve", "purpose": "Dry powder"}
            },
            "thematic_opportunities": [
                {
                    "theme": "AI Infrastructure",
                    "conviction": "High",
                    "timeframe": "5-10 years",
                    "allocation_suggestion": "3-5% of portfolio"
                },
                {
                    "theme": "Energy Transition",
                    "conviction": "High",
                    "timeframe": "10+ years",
                    "allocation_suggestion": "5-8% of portfolio"
                },
                {
                    "theme": "India Growth Story",
                    "conviction": "Medium-High",
                    "timeframe": "5-10 years",
                    "allocation_suggestion": "2-4% of portfolio"
                }
            ],
            "risk_management": {
                "currency_hedging": "Selective - hedge JPY, EUR exposures",
                "tail_risk": "Maintain protective structures",
                "liquidity": "Ensure 2-year liquidity buffer"
            },
            "governance_notes": "Regular rebalancing discipline; avoid style drift",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_hedge_fund_advisory(self) -> Dict:
        """Advisory for hedge funds"""
        return {
            "client_type": ClientType.HEDGE_FUND.value,
            "market_regime": {
                "current": "Low vol, positive momentum",
                "regime_indicators": {
                    "volatility_regime": "compressed",
                    "correlation_regime": "moderate",
                    "trend_regime": "uptrend",
                    "liquidity_regime": "adequate"
                },
                "regime_change_probability": 0.25,
                "regime_change_catalysts": ["Fed pivot", "Geopolitical shock", "Credit event"]
            },
            "strategy_recommendations": {
                "equity_long_short": {
                    "recommendation": "Moderate net long",
                    "gross_exposure": "140-160%",
                    "net_exposure": "30-50%",
                    "sector_tilts": ["Tech overweight", "Defensives underweight"]
                },
                "macro": {
                    "recommendation": "Tactical positioning",
                    "key_trades": ["Long USD/JPY", "Short duration", "Long commodities"],
                    "risk_budget": "Moderate"
                },
                "quant": {
                    "recommendation": "Favor momentum, reduce mean reversion",
                    "factor_tilts": ["Momentum positive", "Value neutral", "Quality overweight"],
                    "crowding_risk": "Elevated in momentum"
                }
            },
            "alpha_opportunities": [
                {
                    "opportunity": "BTC/ETH relative value",
                    "expected_sharpe": 1.5,
                    "capacity": "High",
                    "competition": "Moderate"
                },
                {
                    "opportunity": "Volatility selling",
                    "expected_sharpe": 0.8,
                    "capacity": "Medium",
                    "competition": "High"
                },
                {
                    "opportunity": "EM currency carry",
                    "expected_sharpe": 1.2,
                    "capacity": "Medium",
                    "competition": "Low"
                }
            ],
            "risk_warnings": [
                "Vol compression typically precedes vol expansion",
                "Crowded positioning in momentum strategies",
                "Liquidity conditions can deteriorate quickly"
            ],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_bank_risk_advisory(self) -> Dict:
        """Advisory for commercial and investment banks"""
        return {
            "client_type": ClientType.BANK.value,
            "credit_cycle_position": {
                "current_phase": "Late cycle",
                "credit_quality_trend": "Gradual deterioration",
                "default_cycle_position": "Pre-peak",
                "spread_cycle_position": "Tight"
            },
            "lending_guidance": {
                "corporate_lending": {
                    "recommendation": "Selective, favor investment grade",
                    "sectors_to_favor": ["Technology", "Healthcare", "Essential services"],
                    "sectors_to_avoid": ["Office CRE", "Discretionary retail"]
                },
                "consumer_lending": {
                    "recommendation": "Tighten underwriting",
                    "watch_areas": ["Subprime auto", "Credit cards"],
                    "opportunity": "Prime mortgages"
                },
                "commercial_real_estate": {
                    "recommendation": "Highly selective",
                    "avoid": ["Office", "Older malls"],
                    "opportunity": ["Industrial", "Data centers"]
                }
            },
            "capital_management": {
                "capital_adequacy": "Maintain buffers above regulatory minimums",
                "stress_testing": "Prepare for 15% equity drawdown scenario",
                "dividend_policy": "Conservative; prioritize capital build"
            },
            "trading_book_guidance": {
                "var_limits": "Maintain current limits",
                "concentration_risk": "Watch single-name exposures",
                "hedging": "Ensure counterparty diversification"
            },
            "regulatory_outlook": {
                "basel_iv": "Implementation timeline accelerating",
                "stress_testing": "Expect more severe scenarios",
                "climate_risk": "Disclosure requirements increasing"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_government_economic_advisory(self) -> Dict:
        """Advisory for government economic policy"""
        return {
            "client_type": ClientType.GOVERNMENT.value,
            "macroeconomic_assessment": {
                "growth_outlook": {
                    "2024": {"gdp_growth": 2.5, "confidence": 0.70},
                    "2025": {"gdp_growth": 2.2, "confidence": 0.55}
                },
                "inflation_outlook": {
                    "2024": {"cpi": 2.8, "core_pce": 2.6},
                    "2025": {"cpi": 2.3, "core_pce": 2.2}
                },
                "labor_market": {
                    "unemployment_rate": 4.0,
                    "job_growth": "Moderating",
                    "wage_growth": "Above pre-pandemic trend"
                }
            },
            "fiscal_policy_recommendations": [
                {
                    "recommendation": "Gradual fiscal consolidation",
                    "rationale": "Debt/GDP elevated; interest costs rising",
                    "priority": "High"
                },
                {
                    "recommendation": "Targeted investment in productivity",
                    "rationale": "Infrastructure and education yield long-term returns",
                    "priority": "High"
                },
                {
                    "recommendation": "Social safety net preservation",
                    "rationale": "Economic stability requires robust safety nets",
                    "priority": "Medium"
                }
            ],
            "structural_policy_considerations": {
                "labor_market_reforms": "Focus on skills training and mobility",
                "regulatory_environment": "Balance innovation with stability",
                "trade_policy": "Maintain open trade with strategic considerations",
                "energy_transition": "Gradual transition with worker support"
            },
            "risk_scenarios_for_planning": [
                {
                    "scenario": "Recession",
                    "probability": 0.25,
                    "fiscal_impact": "Automatic stabilizers activate",
                    "recommended_response": "Counter-cyclical fiscal policy"
                },
                {
                    "scenario": "Inflation resurgence",
                    "probability": 0.15,
                    "fiscal_impact": "Higher interest costs",
                    "recommended_response": "Avoid adding fiscal stimulus"
                },
                {
                    "scenario": "Geopolitical shock",
                    "probability": 0.20,
                    "fiscal_impact": "Defense/security spending pressure",
                    "recommended_response": "Prepared contingency plans"
                }
            ],
            "debt_sustainability_analysis": {
                "current_debt_gdp": 122.5,
                "interest_costs_gdp": 3.2,
                "sustainability_assessment": "Manageable but requires attention",
                "recommended_target": "Stabilize below 120% over medium term"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_advisory_by_client_type(self, client_type: ClientType) -> Dict:
        """Get advisory for specific client type"""
        advisories = {
            ClientType.CENTRAL_BANK: self.get_central_bank_advisory,
            ClientType.SOVEREIGN_WEALTH: self.get_sovereign_wealth_advisory,
            ClientType.HEDGE_FUND: self.get_hedge_fund_advisory,
            ClientType.BANK: self.get_bank_risk_advisory,
            ClientType.GOVERNMENT: self.get_government_economic_advisory,
        }
        
        if client_type in advisories:
            return advisories[client_type]()
        else:
            return {"error": f"No advisory available for {client_type}"}
    
    def get_full_institutional_report(self) -> Dict:
        """Get comprehensive institutional report"""
        return {
            "title": "Institutional Advisory Report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "systemic_risk": self.get_systemic_risk_dashboard(),
            "central_bank_view": self.get_central_bank_advisory(),
            "sovereign_wealth_view": self.get_sovereign_wealth_advisory(),
            "hedge_fund_view": self.get_hedge_fund_advisory(),
            "bank_view": self.get_bank_risk_advisory(),
            "government_view": self.get_government_economic_advisory(),
            "disclaimer": "This analysis is for informational purposes only and does not constitute investment advice."
        }


# Global dashboard instance
institutional_dashboard = InstitutionalDashboard()


# API Functions
def get_systemic_risk_dashboard() -> Dict:
    return institutional_dashboard.get_systemic_risk_dashboard()

def get_institutional_advisory(client_type: str) -> Dict:
    try:
        ct = ClientType(client_type)
        return institutional_dashboard.get_advisory_by_client_type(ct)
    except ValueError:
        return {"error": f"Unknown client type: {client_type}"}

def get_full_institutional_report() -> Dict:
    return institutional_dashboard.get_full_institutional_report()

def get_available_client_types() -> List[str]:
    return [ct.value for ct in ClientType]
