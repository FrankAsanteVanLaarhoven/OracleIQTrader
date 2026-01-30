"""
SOTA Platform Feature Tests - Iteration 17
Tests for: Landing Page APIs, Glass-Box Pricing, AI Trading Agents, 
Push Notifications, Copy Trading WebSocket
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data
        print(f"✓ API health check passed: {data}")

    def test_market_prices(self):
        """Test market prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Market prices returned {len(data)} assets")


class TestGlassBoxPricing:
    """Glass-Box Pricing API Tests"""
    
    def test_get_fee_schedule(self):
        """GET /api/pricing/fee-schedule returns fee tiers and asset classes"""
        response = requests.get(f"{BASE_URL}/api/pricing/fee-schedule")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "tiers" in data
        assert "asset_classes" in data
        
        # Verify tiers (actual structure)
        tiers = data["tiers"]
        assert len(tiers) > 0
        assert "free" in tiers or "pro" in tiers
        for tier_name, tier_data in tiers.items():
            assert "name" in tier_data
            assert "monthly_cost" in tier_data
            assert "description" in tier_data
        
        # Verify asset classes
        asset_classes = data["asset_classes"]
        assert len(asset_classes) > 0
        assert "equity" in asset_classes or "crypto" in asset_classes
        print(f"✓ Fee schedule: {len(tiers)} tiers, {len(asset_classes)} asset classes")
    
    def test_post_pricing_estimate(self):
        """POST /api/pricing/estimate returns cost breakdown with competitor comparison"""
        payload = {
            "asset": "BTC",
            "asset_class": "crypto",
            "side": "buy",
            "quantity": 1,
            "current_price": 45000,
            "tier": "free"
        }
        response = requests.post(
            f"{BASE_URL}/api/pricing/estimate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify cost breakdown (actual structure)
        assert "estimated_fees" in data
        assert "total_estimated_cost_usd" in data
        assert "total_estimated_cost_bps" in data
        
        # Verify competitor comparison
        assert "competitor_costs" in data
        competitors = data["competitor_costs"]
        assert len(competitors) > 0
        
        print(f"✓ Pricing estimate: Total cost ${data['total_estimated_cost_usd']:.2f}")
        print(f"  Competitors compared: {list(competitors.keys())}")
    
    def test_get_competitor_comparison(self):
        """GET /api/pricing/competitor-comparison returns competitor fees"""
        response = requests.get(f"{BASE_URL}/api/pricing/competitor-comparison")
        assert response.status_code == 200
        data = response.json()
        
        # Should have competitor data
        assert isinstance(data, dict)
        assert len(data) > 0
        print(f"✓ Competitor comparison: {list(data.keys())}")


class TestAITradingAgents:
    """AI Trading Agents API Tests"""
    
    def test_get_templates(self):
        """GET /api/agents/templates returns 6 templates"""
        response = requests.get(f"{BASE_URL}/api/agents/templates")
        assert response.status_code == 200
        data = response.json()
        
        # Verify 6 templates
        assert isinstance(data, dict)
        assert len(data) == 6, f"Expected 6 templates, got {len(data)}"
        
        # Verify template structure
        expected_templates = ["momentum_hunter", "mean_reversion_bot", "trend_surfer", 
                            "contrarian_alpha", "news_sentinel", "quant_analyzer"]
        for template_id in expected_templates:
            assert template_id in data, f"Missing template: {template_id}"
            template = data[template_id]
            assert "name" in template
            assert "description" in template
            assert "avatar_emoji" in template
            assert "strategy" in template
        
        print(f"✓ Templates: {list(data.keys())}")
    
    def test_create_agent(self):
        """POST /api/agents creates agent with MongoDB persistence"""
        payload = {
            "name": "TEST_Agent_Iteration17",
            "description": "Test agent for iteration 17 testing",
            "strategy": "momentum",
            "risk_tolerance": 50,
            "position_size_pct": 10,
            "entry_confidence_threshold": 70,
            "stop_loss_pct": 5,
            "take_profit_pct": 15,
            "allowed_assets": ["BTC", "ETH"],
            "user_id": "test_user_iteration17"
        }
        response = requests.post(
            f"{BASE_URL}/api/agents",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify agent created (actual structure)
        assert data.get("success") == True
        assert "agent" in data
        agent = data["agent"]
        assert "agent_id" in agent
        assert agent["name"] == payload["name"]
        assert agent["strategy"] == payload["strategy"]
        
        print(f"✓ Agent created: {agent['agent_id']}")
        return agent["agent_id"]
    
    def test_get_user_agents(self):
        """GET /api/agents?user_id=test returns persisted agents"""
        # First create an agent
        create_payload = {
            "name": "TEST_GetAgents_Iteration17",
            "description": "Test agent for get agents test",
            "strategy": "mean_reversion",
            "user_id": "test_user_get_agents"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/agents",
            json=create_payload,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        created_data = create_response.json()
        assert created_data.get("success") == True
        created_agent = created_data["agent"]
        
        # Now get user's agents
        response = requests.get(f"{BASE_URL}/api/agents?user_id=test_user_get_agents")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        # Find our created agent
        agent_ids = [a.get("agent_id") for a in data]
        assert created_agent["agent_id"] in agent_ids, "Created agent not found in list"
        
        print(f"✓ User agents: {len(data)} agents found")
    
    def test_activate_agent(self):
        """POST /api/agents/{id}/activate changes status to active"""
        # Create agent first
        create_payload = {
            "name": "TEST_Activate_Iteration17",
            "description": "Test agent for activation test",
            "strategy": "trend_following",
            "user_id": "test_user_activate"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/agents",
            json=create_payload,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        created_data = create_response.json()
        assert created_data.get("success") == True
        agent_id = created_data["agent"]["agent_id"]
        
        # Activate agent
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/activate")
        assert response.status_code == 200
        data = response.json()
        
        # Verify activation
        assert data.get("success") == True or data.get("status") == "active"
        print(f"✓ Agent {agent_id} activated")


class TestPushNotifications:
    """Push Notifications API Tests"""
    
    def test_get_notification_stats(self):
        """GET /api/notifications/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/notifications/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_sent" in data or "registered_devices" in data
        print(f"✓ Notification stats: {data}")
    
    def test_register_device(self):
        """POST /api/notifications/register accepts device token"""
        payload = {
            "token": "ExponentPushToken[TEST_TOKEN_ITERATION17]",
            "platform": "ios",
            "device": "iPhone 15 Pro",
            "user_id": "test_user_notifications"
        }
        response = requests.post(
            f"{BASE_URL}/api/notifications/register",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Registration failed: {data}"
        print(f"✓ Device registered: {payload['token'][:30]}...")
    
    def test_get_preferences(self):
        """GET /api/notifications/preferences returns user preferences"""
        response = requests.get(f"{BASE_URL}/api/notifications/preferences?user_id=test_user")
        assert response.status_code == 200
        data = response.json()
        
        # Should have preference fields
        assert isinstance(data, dict)
        print(f"✓ Notification preferences: {data}")


class TestCopyTradingWebSocket:
    """Copy Trading WebSocket Tests"""
    
    def test_copy_trading_stats(self):
        """GET /api/copy-trading/ws/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "active_connections" in data or "total_subscribers" in data
        print(f"✓ Copy trading stats: {data}")
    
    def test_copy_trading_events(self):
        """GET /api/copy-trading/ws/events returns recent events"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/events")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Copy trading events: {len(data)} events")
    
    def test_simulate_trade(self):
        """POST /api/copy-trading/ws/simulate simulates a trade propagation"""
        payload = {
            "master_trader_id": "MTR-TEST",
            "master_name": "Test Trader",
            "action": "buy",
            "symbol": "BTC",
            "quantity": 0.5,
            "price": 45000
        }
        response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "event_id" in data or "event" in data
        print(f"✓ Trade simulation: {data}")


class TestExecutionAuditTrail:
    """Execution Audit Trail API Tests"""
    
    def test_execution_receipt(self):
        """POST /api/pricing/execution-receipt returns detailed receipt"""
        payload = {
            "order_id": "TEST-ORDER-001",
            "asset": "AAPL",
            "asset_class": "equity",
            "side": "buy",
            "quantity": 100,
            "limit_price": 175.50,
            "fill_price": 175.45,
            "venue": "NYSE",
            "tier": "active"
        }
        response = requests.post(
            f"{BASE_URL}/api/pricing/execution-receipt",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify receipt structure (actual)
        assert "receipt_id" in data
        assert "fees" in data
        assert "nbbo_bid" in data
        assert "nbbo_ask" in data
        assert "savings_vs_competitors" in data
        
        print(f"✓ Execution receipt: {data['receipt_id']}")
        print(f"  NBBO: bid={data['nbbo_bid']}, ask={data['nbbo_ask']}")


class TestMonthlyReport:
    """Monthly Report API Tests"""
    
    def test_monthly_report(self):
        """GET /api/pricing/monthly-report/{user_id} returns report"""
        response = requests.get(f"{BASE_URL}/api/pricing/monthly-report/demo_user")
        assert response.status_code == 200
        data = response.json()
        
        # Verify report structure
        assert "user_id" in data
        assert "period" in data or "total_trades" in data
        
        print(f"✓ Monthly report: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
