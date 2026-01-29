"""
Quantitative Research System API Tests
Tests for Bridgewater-style Quant modules:
- Macro Engine (Ray Dalio's principles)
- Market Inefficiency Detector
- Portfolio Optimizer (All Weather, Risk Parity, Pure Alpha)
- AI Research Analyst
- Institutional Dashboard
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMacroEngine:
    """Macro Economic Engine - Ray Dalio's Framework Tests"""
    
    def test_dalio_principles(self):
        """GET /api/quant/macro/dalio-principles - Main endpoint for Dalio's framework"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/dalio-principles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify economic phase data
        assert "economic_machine_position" in data, "Missing economic_machine_position"
        phase = data["economic_machine_position"]
        assert "current_phase" in phase, "Missing current_phase"
        assert "phase_description" in phase, "Missing phase_description"
        assert "recommended_allocation" in phase, "Missing recommended_allocation"
        
        # Verify debt cycle data
        assert "debt_cycle" in data, "Missing debt_cycle"
        debt = data["debt_cycle"]
        assert "debt_to_gdp" in debt, "Missing debt_to_gdp"
        assert "credit_growth" in debt, "Missing credit_growth"
        assert "deleveraging_risk" in debt, "Missing deleveraging_risk"
        
        # Verify liquidity conditions
        assert "liquidity_conditions" in data, "Missing liquidity_conditions"
        liquidity = data["liquidity_conditions"]
        assert "liquidity_score" in liquidity, "Missing liquidity_score"
        assert "risk_appetite" in liquidity, "Missing risk_appetite"
        
        # Verify principles applied
        assert "principles_applied" in data, "Missing principles_applied"
        assert len(data["principles_applied"]) > 0, "No principles applied"
        
        print(f"✓ Dalio Principles: Phase={phase['current_phase']}, Debt/GDP={debt['debt_to_gdp']}%")
    
    def test_economic_indicators(self):
        """GET /api/quant/macro/indicators - Economic indicators"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/indicators")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of indicators"
        assert len(data) > 0, "No indicators returned"
        
        # Check indicator structure
        indicator = data[0]
        assert "name" in indicator
        assert "value" in indicator
        assert "trend" in indicator
        print(f"✓ Economic Indicators: {len(data)} indicators returned")
    
    def test_debt_cycle_analysis(self):
        """GET /api/quant/macro/debt-cycle - Debt cycle analysis"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/debt-cycle")
        assert response.status_code == 200
        
        data = response.json()
        assert "short_term_phase" in data
        assert "long_term_phase" in data
        assert "debt_to_gdp" in data
        assert "bubble_indicator" in data
        print(f"✓ Debt Cycle: Short-term={data['short_term_phase']}, Bubble={data['bubble_indicator']}")
    
    def test_economic_phase(self):
        """GET /api/quant/macro/economic-phase - Current economic phase"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/economic-phase")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_phase" in data
        assert "recommended_allocation" in data
        assert "key_risks" in data
        print(f"✓ Economic Phase: {data['current_phase']}")
    
    def test_central_banks(self):
        """GET /api/quant/macro/central-banks - Central bank policies"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/central-banks")
        assert response.status_code == 200
        
        data = response.json()
        assert "banks" in data
        assert "global_hawkishness" in data
        assert "FED" in data["banks"] or len(data["banks"]) > 0
        print(f"✓ Central Banks: {len(data['banks'])} banks, Hawkishness={data['global_hawkishness']}")
    
    def test_global_liquidity(self):
        """GET /api/quant/macro/liquidity - Global liquidity conditions"""
        response = requests.get(f"{BASE_URL}/api/quant/macro/liquidity")
        assert response.status_code == 200
        
        data = response.json()
        assert "liquidity_score" in data
        assert "risk_appetite" in data
        assert "trend" in data
        print(f"✓ Global Liquidity: Score={data['liquidity_score']}, Appetite={data['risk_appetite']}")


class TestInefficiencyDetector:
    """Market Inefficiency Detector Tests"""
    
    def test_inefficiency_summary(self):
        """GET /api/quant/inefficiency/summary - Signal summary"""
        response = requests.get(f"{BASE_URL}/api/quant/inefficiency/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_signals" in data, "Missing total_signals"
        assert "strong_signals" in data, "Missing strong_signals"
        assert "average_confidence" in data, "Missing average_confidence"
        assert "best_opportunity" in data, "Missing best_opportunity"
        
        # Verify best opportunity structure
        if data["best_opportunity"]:
            opp = data["best_opportunity"]
            assert "assets" in opp
            assert "confidence" in opp
            assert "expected_return" in opp
        
        print(f"✓ Inefficiency Summary: {data['total_signals']} signals, {data['strong_signals']} strong")
    
    def test_inefficiency_signals(self):
        """GET /api/quant/inefficiency/signals - All signals"""
        response = requests.get(f"{BASE_URL}/api/quant/inefficiency/signals")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of signals"
        
        if len(data) > 0:
            signal = data[0]
            assert "signal_type" in signal
            assert "assets" in signal
            assert "direction" in signal
            assert "confidence" in signal
            assert "expected_return" in signal
        
        print(f"✓ Inefficiency Signals: {len(data)} signals returned")
    
    def test_pairs_trades(self):
        """GET /api/quant/inefficiency/pairs - Pairs trading opportunities"""
        response = requests.get(f"{BASE_URL}/api/quant/inefficiency/pairs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of pairs"
        
        if len(data) > 0:
            pair = data[0]
            assert "asset_long" in pair
            assert "asset_short" in pair
            assert "spread_zscore" in pair
            assert "correlation" in pair
        
        print(f"✓ Pairs Trades: {len(data)} opportunities")


class TestPortfolioOptimizer:
    """Portfolio Optimizer Tests - All Weather, Risk Parity, Pure Alpha"""
    
    def test_all_weather_portfolio(self):
        """GET /api/quant/portfolio/all-weather - Ray Dalio's All Weather"""
        response = requests.get(f"{BASE_URL}/api/quant/portfolio/all-weather")
        assert response.status_code == 200
        
        data = response.json()
        assert "strategy" in data, "Missing strategy"
        assert "weights" in data, "Missing weights"
        assert "expected_annual_return" in data, "Missing expected_annual_return"
        assert "expected_volatility" in data, "Missing expected_volatility"
        assert "sharpe_ratio" in data, "Missing sharpe_ratio"
        
        # Verify weights structure
        weights = data["weights"]
        assert isinstance(weights, dict)
        assert len(weights) > 0
        
        print(f"✓ All Weather: Return={data['expected_annual_return']}%, Vol={data['expected_volatility']}%")
    
    def test_portfolio_strategies(self):
        """GET /api/quant/portfolio/strategies - Strategy comparison"""
        response = requests.get(f"{BASE_URL}/api/quant/portfolio/strategies")
        assert response.status_code == 200
        
        data = response.json()
        assert "strategies" in data, "Missing strategies"
        strategies = data["strategies"]
        assert len(strategies) >= 3, "Expected at least 3 strategies"
        
        # Verify strategy structure
        for strat in strategies:
            assert "name" in strat
            assert "type" in strat
            assert "expected_return" in strat
            assert "sharpe" in strat
        
        print(f"✓ Portfolio Strategies: {len(strategies)} strategies compared")
    
    def test_risk_parity_portfolio(self):
        """GET /api/quant/portfolio/risk-parity - Risk Parity allocation"""
        response = requests.get(f"{BASE_URL}/api/quant/portfolio/risk-parity")
        assert response.status_code == 200
        
        data = response.json()
        assert "strategy" in data
        assert "allocations" in data
        assert "portfolio_metrics" in data
        
        print(f"✓ Risk Parity: {len(data['allocations'])} assets allocated")
    
    def test_pure_alpha_strategy(self):
        """GET /api/quant/portfolio/pure-alpha - Pure Alpha (market-neutral)"""
        response = requests.get(f"{BASE_URL}/api/quant/portfolio/pure-alpha")
        assert response.status_code == 200
        
        data = response.json()
        assert "strategy" in data, "Missing strategy"
        assert "signals" in data, "Missing signals"
        assert "exposure" in data, "Missing exposure"
        
        # Verify exposure structure
        exposure = data["exposure"]
        assert "gross" in exposure
        assert "net" in exposure
        assert "long" in exposure
        assert "short" in exposure
        
        print(f"✓ Pure Alpha: Gross={exposure['gross']}, Net={exposure['net']}")
    
    def test_drawdown_protection(self):
        """GET /api/quant/portfolio/drawdown-protection - Drawdown protection"""
        response = requests.get(f"{BASE_URL}/api/quant/portfolio/drawdown-protection?current_drawdown=-0.08")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_drawdown" in data
        assert "risk_reduction_factor" in data
        assert "recommended_action" in data
        
        print(f"✓ Drawdown Protection: Action={data['recommended_action']}")


class TestAIResearchAnalyst:
    """AI Research Analyst Tests"""
    
    def test_ai_status(self):
        """GET /api/quant/ai/status - AI analyst status"""
        response = requests.get(f"{BASE_URL}/api/quant/ai/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_enabled" in data, "Missing ai_enabled"
        assert "provider" in data, "Missing provider"
        assert "capabilities" in data, "Missing capabilities"
        assert "status" in data, "Missing status"
        
        print(f"✓ AI Status: Enabled={data['ai_enabled']}, Provider={data['provider']}")


class TestInstitutionalDashboard:
    """Institutional Dashboard Tests"""
    
    def test_systemic_risk_dashboard(self):
        """GET /api/quant/institutional/systemic-risk - Systemic risk monitoring"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/systemic-risk")
        assert response.status_code == 200
        
        data = response.json()
        assert "overall_risk_level" in data, "Missing overall_risk_level"
        assert "aggregate_risk_score" in data, "Missing aggregate_risk_score"
        assert "indicators" in data, "Missing indicators"
        assert "recommendation" in data, "Missing recommendation"
        
        # Verify indicators structure
        indicators = data["indicators"]
        assert isinstance(indicators, list)
        assert len(indicators) > 0
        
        print(f"✓ Systemic Risk: Level={data['overall_risk_level']}, Score={data['aggregate_risk_score']}")
    
    def test_hedge_fund_advisory(self):
        """GET /api/quant/institutional/advisory/hedge_fund - Hedge fund advisory"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/advisory/hedge_fund")
        assert response.status_code == 200
        
        data = response.json()
        assert "client_type" in data, "Missing client_type"
        assert data["client_type"] == "hedge_fund"
        assert "market_regime" in data, "Missing market_regime"
        assert "alpha_opportunities" in data, "Missing alpha_opportunities"
        
        print(f"✓ Hedge Fund Advisory: Regime={data['market_regime']['current']}")
    
    def test_central_bank_advisory(self):
        """GET /api/quant/institutional/advisory/central_bank - Central bank advisory"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/advisory/central_bank")
        assert response.status_code == 200
        
        data = response.json()
        assert "client_type" in data
        assert data["client_type"] == "central_bank"
        assert "executive_briefing" in data
        assert "policy_recommendations" in data
        
        print(f"✓ Central Bank Advisory: {data['executive_briefing']['title']}")
    
    def test_government_advisory(self):
        """GET /api/quant/institutional/advisory/government - Government advisory"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/advisory/government")
        assert response.status_code == 200
        
        data = response.json()
        assert "client_type" in data
        assert data["client_type"] == "government"
        
        print(f"✓ Government Advisory: Retrieved successfully")
    
    def test_client_types(self):
        """GET /api/quant/institutional/client-types - Available client types"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/client-types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert "hedge_fund" in data
        assert "central_bank" in data
        
        print(f"✓ Client Types: {len(data)} types available")
    
    def test_invalid_client_type(self):
        """GET /api/quant/institutional/advisory/invalid - Invalid client type"""
        response = requests.get(f"{BASE_URL}/api/quant/institutional/advisory/invalid_type")
        assert response.status_code == 200  # Returns error in response body
        
        data = response.json()
        assert "error" in data
        
        print(f"✓ Invalid Client Type: Error handled correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
