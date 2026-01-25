"""
Macro Economic Engine - Ray Dalio's Framework
Debt cycle analysis, economic indicators, central bank policy tracking
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)


class EconomicPhase(str, Enum):
    """Ray Dalio's Economic Machine Phases"""
    EARLY_EXPANSION = "early_expansion"      # Low rates, rising growth
    LATE_EXPANSION = "late_expansion"        # Rising rates, peak growth
    EARLY_CONTRACTION = "early_contraction"  # High rates, falling growth
    LATE_CONTRACTION = "late_contraction"    # Falling rates, bottom growth
    DELEVERAGING = "deleveraging"            # Debt crisis, deflation risk
    REFLATION = "reflation"                  # Stimulus, recovery


class DebtCyclePhase(str, Enum):
    """Short-term and Long-term Debt Cycle Phases"""
    ACCUMULATION = "accumulation"
    EXPANSION = "expansion"
    BUBBLE = "bubble"
    CRISIS = "crisis"
    DELEVERAGING = "deleveraging"
    RECOVERY = "recovery"


@dataclass
class EconomicIndicator:
    """Single economic indicator"""
    name: str
    value: float
    previous: float
    change_pct: float
    trend: str  # improving, deteriorating, stable
    z_score: float  # standard deviations from mean
    signal: str  # bullish, bearish, neutral
    last_updated: str


@dataclass
class DebtCycleAnalysis:
    """Debt cycle analysis result"""
    short_term_phase: DebtCyclePhase
    long_term_phase: DebtCyclePhase
    debt_to_gdp: float
    credit_growth: float
    deleveraging_risk: float  # 0-1
    bubble_indicator: float  # 0-1
    years_in_cycle: int
    projection: str


@dataclass
class CentralBankPolicy:
    """Central bank policy analysis"""
    bank: str
    current_rate: float
    rate_trend: str  # hiking, cutting, holding
    balance_sheet_size: float
    qe_status: str  # expanding, tapering, tightening
    forward_guidance: str
    hawkish_score: float  # -1 (dovish) to +1 (hawkish)
    next_meeting: str
    rate_projection: float


@dataclass
class GlobalLiquidity:
    """Global liquidity conditions"""
    total_central_bank_assets: float
    m2_growth_global: float
    credit_impulse: float
    dollar_liquidity: float
    liquidity_score: float  # 0-100
    trend: str
    risk_appetite: str  # risk-on, risk-off, neutral


class MacroEconomicEngine:
    """
    Ray Dalio-style Macro Economic Analysis Engine
    Implements the Economic Machine framework
    """
    
    def __init__(self):
        self.indicators: Dict[str, EconomicIndicator] = {}
        self.central_banks: Dict[str, CentralBankPolicy] = {}
        self._initialize_data()
    
    def _initialize_data(self):
        """Initialize with current economic data (simulated for demo)"""
        # US Economic Indicators
        us_indicators = {
            "US_GDP_GROWTH": (2.8, 2.5, "improving"),
            "US_INFLATION_CPI": (3.2, 3.5, "improving"),
            "US_UNEMPLOYMENT": (3.9, 4.0, "improving"),
            "US_CONSUMER_CONFIDENCE": (102.5, 99.8, "improving"),
            "US_PMI_MANUFACTURING": (49.2, 48.5, "improving"),
            "US_PMI_SERVICES": (52.8, 51.5, "improving"),
            "US_RETAIL_SALES": (0.6, 0.3, "improving"),
            "US_HOUSING_STARTS": (1.42, 1.38, "improving"),
            "US_INITIAL_CLAIMS": (218, 225, "improving"),
            "US_CORE_PCE": (2.8, 2.9, "improving"),
        }
        
        for name, (value, prev, trend) in us_indicators.items():
            change_pct = ((value - prev) / prev) * 100 if prev != 0 else 0
            z_score = random.uniform(-2, 2)
            signal = "bullish" if trend == "improving" else "bearish" if trend == "deteriorating" else "neutral"
            
            self.indicators[name] = EconomicIndicator(
                name=name,
                value=value,
                previous=prev,
                change_pct=round(change_pct, 2),
                trend=trend,
                z_score=round(z_score, 2),
                signal=signal,
                last_updated=datetime.now(timezone.utc).isoformat()
            )
        
        # Central Banks
        self.central_banks = {
            "FED": CentralBankPolicy(
                bank="Federal Reserve",
                current_rate=5.25,
                rate_trend="holding",
                balance_sheet_size=7.5,  # Trillion USD
                qe_status="tightening",
                forward_guidance="Data dependent, potential cuts in 2024",
                hawkish_score=0.3,
                next_meeting="2024-03-20",
                rate_projection=4.75
            ),
            "ECB": CentralBankPolicy(
                bank="European Central Bank",
                current_rate=4.50,
                rate_trend="holding",
                balance_sheet_size=6.8,
                qe_status="tapering",
                forward_guidance="Rates to remain restrictive",
                hawkish_score=0.2,
                next_meeting="2024-03-07",
                rate_projection=4.0
            ),
            "BOJ": CentralBankPolicy(
                bank="Bank of Japan",
                current_rate=-0.10,
                rate_trend="hiking",
                balance_sheet_size=5.2,
                qe_status="tapering",
                forward_guidance="End of negative rates possible",
                hawkish_score=-0.5,
                next_meeting="2024-03-19",
                rate_projection=0.0
            ),
            "PBOC": CentralBankPolicy(
                bank="People's Bank of China",
                current_rate=3.45,
                rate_trend="cutting",
                balance_sheet_size=5.8,
                qe_status="expanding",
                forward_guidance="Supporting economic recovery",
                hawkish_score=-0.7,
                next_meeting="2024-02-20",
                rate_projection=3.25
            ),
            "BOE": CentralBankPolicy(
                bank="Bank of England",
                current_rate=5.25,
                rate_trend="holding",
                balance_sheet_size=0.85,
                qe_status="tightening",
                forward_guidance="Inflation fight continues",
                hawkish_score=0.4,
                next_meeting="2024-03-21",
                rate_projection=4.75
            )
        }
    
    def analyze_debt_cycle(self) -> DebtCycleAnalysis:
        """Analyze current position in debt cycle"""
        # Simulated analysis based on Ray Dalio's framework
        debt_to_gdp = 122.5  # US debt to GDP
        credit_growth = 4.2  # Annual credit growth %
        
        # Calculate bubble indicator (0-1)
        bubble_indicator = min(1.0, max(0, (debt_to_gdp - 80) / 100 + credit_growth / 20))
        
        # Determine cycle phase
        if debt_to_gdp > 120 and credit_growth < 3:
            short_term = DebtCyclePhase.DELEVERAGING
        elif debt_to_gdp > 100 and credit_growth > 5:
            short_term = DebtCyclePhase.BUBBLE
        elif credit_growth > 4:
            short_term = DebtCyclePhase.EXPANSION
        else:
            short_term = DebtCyclePhase.RECOVERY
        
        # Long-term cycle (typically 75-100 years)
        long_term = DebtCyclePhase.EXPANSION  # Current position in long-term cycle
        
        deleveraging_risk = min(1.0, (debt_to_gdp - 100) / 50) if debt_to_gdp > 100 else 0
        
        return DebtCycleAnalysis(
            short_term_phase=short_term,
            long_term_phase=long_term,
            debt_to_gdp=debt_to_gdp,
            credit_growth=credit_growth,
            deleveraging_risk=round(deleveraging_risk, 2),
            bubble_indicator=round(bubble_indicator, 2),
            years_in_cycle=15,  # Years since last major deleveraging (2008)
            projection="Elevated debt levels suggest caution. Credit growth normalizing. Watch for policy shifts."
        )
    
    def get_economic_phase(self) -> Dict:
        """Determine current phase of economic machine"""
        gdp = self.indicators.get("US_GDP_GROWTH")
        inflation = self.indicators.get("US_INFLATION_CPI")
        unemployment = self.indicators.get("US_UNEMPLOYMENT")
        fed = self.central_banks.get("FED")
        
        # Simplified phase determination
        if gdp and inflation and fed:
            if gdp.value > 2.5 and inflation.value < 3 and fed.rate_trend == "cutting":
                phase = EconomicPhase.EARLY_EXPANSION
            elif gdp.value > 2 and inflation.value > 3:
                phase = EconomicPhase.LATE_EXPANSION
            elif gdp.value < 2 and inflation.value > 3:
                phase = EconomicPhase.EARLY_CONTRACTION
            elif gdp.value < 1 and fed.rate_trend == "cutting":
                phase = EconomicPhase.LATE_CONTRACTION
            else:
                phase = EconomicPhase.LATE_EXPANSION
        else:
            phase = EconomicPhase.LATE_EXPANSION
        
        return {
            "current_phase": phase.value,
            "phase_description": self._get_phase_description(phase),
            "recommended_allocation": self._get_phase_allocation(phase),
            "key_risks": self._get_phase_risks(phase),
            "opportunities": self._get_phase_opportunities(phase)
        }
    
    def _get_phase_description(self, phase: EconomicPhase) -> str:
        descriptions = {
            EconomicPhase.EARLY_EXPANSION: "Economy recovering, low rates stimulating growth. Risk assets favored.",
            EconomicPhase.LATE_EXPANSION: "Peak growth, rising inflation. Central banks tightening. Caution warranted.",
            EconomicPhase.EARLY_CONTRACTION: "Growth slowing, inflation sticky. Defensive positioning recommended.",
            EconomicPhase.LATE_CONTRACTION: "Recession risk elevated. Central banks pivoting dovish. Bond rally expected.",
            EconomicPhase.DELEVERAGING: "Debt crisis mode. Cash and safe assets. Extreme caution.",
            EconomicPhase.REFLATION: "Stimulus driving recovery. Commodities and cyclicals favored."
        }
        return descriptions.get(phase, "")
    
    def _get_phase_allocation(self, phase: EconomicPhase) -> Dict[str, float]:
        allocations = {
            EconomicPhase.EARLY_EXPANSION: {"stocks": 50, "bonds": 20, "commodities": 20, "cash": 10},
            EconomicPhase.LATE_EXPANSION: {"stocks": 35, "bonds": 25, "commodities": 25, "cash": 15},
            EconomicPhase.EARLY_CONTRACTION: {"stocks": 25, "bonds": 35, "commodities": 15, "cash": 25},
            EconomicPhase.LATE_CONTRACTION: {"stocks": 30, "bonds": 40, "commodities": 10, "cash": 20},
            EconomicPhase.DELEVERAGING: {"stocks": 15, "bonds": 25, "commodities": 10, "cash": 50},
            EconomicPhase.REFLATION: {"stocks": 45, "bonds": 20, "commodities": 25, "cash": 10}
        }
        return allocations.get(phase, {"stocks": 25, "bonds": 25, "commodities": 25, "cash": 25})
    
    def _get_phase_risks(self, phase: EconomicPhase) -> List[str]:
        risks = {
            EconomicPhase.EARLY_EXPANSION: ["Inflation resurgence", "Policy misstep", "Geopolitical shock"],
            EconomicPhase.LATE_EXPANSION: ["Overtightening", "Asset bubble burst", "Credit crunch"],
            EconomicPhase.EARLY_CONTRACTION: ["Hard landing", "Earnings collapse", "Credit defaults"],
            EconomicPhase.LATE_CONTRACTION: ["Deflation", "Banking stress", "Unemployment spike"],
            EconomicPhase.DELEVERAGING: ["Systemic collapse", "Currency crisis", "Social unrest"],
            EconomicPhase.REFLATION: ["Hyperinflation", "Debt monetization", "Currency debasement"]
        }
        return risks.get(phase, [])
    
    def _get_phase_opportunities(self, phase: EconomicPhase) -> List[str]:
        opportunities = {
            EconomicPhase.EARLY_EXPANSION: ["Growth stocks", "High yield bonds", "Emerging markets"],
            EconomicPhase.LATE_EXPANSION: ["Value stocks", "Inflation hedges", "Short duration bonds"],
            EconomicPhase.EARLY_CONTRACTION: ["Quality stocks", "Long bonds", "Defensive sectors"],
            EconomicPhase.LATE_CONTRACTION: ["Distressed debt", "Rate-sensitive equities", "REITs"],
            EconomicPhase.DELEVERAGING: ["Gold", "Cash equivalents", "Short selling"],
            EconomicPhase.REFLATION: ["Commodities", "Cyclicals", "Inflation-linked bonds"]
        }
        return opportunities.get(phase, [])
    
    def get_global_liquidity(self) -> GlobalLiquidity:
        """Analyze global liquidity conditions"""
        # Aggregate central bank balance sheets
        total_assets = sum(cb.balance_sheet_size for cb in self.central_banks.values())
        
        # Calculate liquidity metrics
        m2_growth = 3.5  # Global M2 growth estimate
        credit_impulse = 1.2  # Credit impulse indicator
        dollar_liquidity = 85  # Dollar liquidity index
        
        # Liquidity score (0-100)
        liquidity_score = 50 + (m2_growth * 5) + (credit_impulse * 10) - (5.25 * 5)  # Adjust for Fed rate
        liquidity_score = max(0, min(100, liquidity_score))
        
        # Trend determination
        if m2_growth > 5:
            trend = "expanding"
        elif m2_growth < 2:
            trend = "contracting"
        else:
            trend = "stable"
        
        # Risk appetite
        if liquidity_score > 70:
            risk_appetite = "risk-on"
        elif liquidity_score < 40:
            risk_appetite = "risk-off"
        else:
            risk_appetite = "neutral"
        
        return GlobalLiquidity(
            total_central_bank_assets=round(total_assets, 2),
            m2_growth_global=m2_growth,
            credit_impulse=credit_impulse,
            dollar_liquidity=dollar_liquidity,
            liquidity_score=round(liquidity_score, 1),
            trend=trend,
            risk_appetite=risk_appetite
        )
    
    def get_all_indicators(self) -> List[Dict]:
        """Get all economic indicators"""
        return [asdict(ind) for ind in self.indicators.values()]
    
    def get_central_bank_summary(self) -> Dict:
        """Get summary of all central bank policies"""
        return {
            "banks": {name: asdict(cb) for name, cb in self.central_banks.items()},
            "global_hawkishness": round(
                sum(cb.hawkish_score for cb in self.central_banks.values()) / len(self.central_banks), 2
            ),
            "rate_direction": "mixed",
            "policy_divergence": "high"
        }
    
    def get_dalio_principles_assessment(self) -> Dict:
        """Apply Ray Dalio's Principles to current market"""
        debt_analysis = self.analyze_debt_cycle()
        phase = self.get_economic_phase()
        liquidity = self.get_global_liquidity()
        
        return {
            "economic_machine_position": phase,
            "debt_cycle": asdict(debt_analysis),
            "liquidity_conditions": asdict(liquidity),
            "principles_applied": [
                {
                    "principle": "Understand the Economic Machine",
                    "application": f"Currently in {phase['current_phase']} phase. {phase['phase_description']}"
                },
                {
                    "principle": "Diversify Well",
                    "application": f"Recommended allocation: {phase['recommended_allocation']}"
                },
                {
                    "principle": "Watch Debt Cycles",
                    "application": f"Debt/GDP at {debt_analysis.debt_to_gdp}%. Deleveraging risk: {debt_analysis.deleveraging_risk*100}%"
                },
                {
                    "principle": "Follow Liquidity",
                    "application": f"Global liquidity score: {liquidity.liquidity_score}. Risk appetite: {liquidity.risk_appetite}"
                }
            ],
            "overall_assessment": self._generate_overall_assessment(debt_analysis, phase, liquidity),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def _generate_overall_assessment(self, debt: DebtCycleAnalysis, phase: Dict, liquidity: GlobalLiquidity) -> str:
        assessments = []
        
        if debt.deleveraging_risk > 0.5:
            assessments.append("HIGH ALERT: Elevated deleveraging risk. Reduce leverage and increase cash.")
        
        if liquidity.risk_appetite == "risk-off":
            assessments.append("CAUTION: Liquidity conditions deteriorating. Favor quality assets.")
        elif liquidity.risk_appetite == "risk-on":
            assessments.append("CONSTRUCTIVE: Liquidity supportive. Maintain risk exposure.")
        
        if phase["current_phase"] in ["early_contraction", "late_contraction"]:
            assessments.append("DEFENSIVE: Economic momentum weakening. Prioritize capital preservation.")
        elif phase["current_phase"] in ["early_expansion", "reflation"]:
            assessments.append("OPPORTUNISTIC: Growth recovering. Increase cyclical exposure.")
        
        return " | ".join(assessments) if assessments else "NEUTRAL: Balanced conditions. Maintain strategic allocation."


# Global engine instance
macro_engine = MacroEconomicEngine()


# API Functions
def get_economic_indicators() -> List[Dict]:
    return macro_engine.get_all_indicators()

def get_debt_cycle_analysis() -> Dict:
    return asdict(macro_engine.analyze_debt_cycle())

def get_economic_phase() -> Dict:
    return macro_engine.get_economic_phase()

def get_central_bank_policies() -> Dict:
    return macro_engine.get_central_bank_summary()

def get_global_liquidity() -> Dict:
    return asdict(macro_engine.get_global_liquidity())

def get_dalio_principles() -> Dict:
    return macro_engine.get_dalio_principles_assessment()
