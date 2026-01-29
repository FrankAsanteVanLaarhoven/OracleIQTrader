"""
Test Copy Trading WebSocket API Endpoints
Tests real-time copy trading propagation via WebSocket
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCopyTradingWSStats:
    """Test GET /api/copy-trading/ws/stats endpoint"""
    
    def test_stats_returns_200(self):
        """Stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats")
        assert response.status_code == 200
    
    def test_stats_has_required_fields(self):
        """Stats response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats")
        data = response.json()
        
        required_fields = [
            "active_connections",
            "total_subscribers",
            "total_events_propagated",
            "total_trades_copied",
            "total_volume_copied",
            "events_in_history"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_stats_values_are_numeric(self):
        """Stats values are numeric types"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats")
        data = response.json()
        
        assert isinstance(data["active_connections"], int)
        assert isinstance(data["total_subscribers"], int)
        assert isinstance(data["total_events_propagated"], int)
        assert isinstance(data["total_trades_copied"], int)
        assert isinstance(data["total_volume_copied"], (int, float))
        assert isinstance(data["events_in_history"], int)


class TestCopyTradingWSEvents:
    """Test GET /api/copy-trading/ws/events endpoint"""
    
    def test_events_returns_200(self):
        """Events endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/events")
        assert response.status_code == 200
    
    def test_events_returns_list(self):
        """Events endpoint returns a list"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/events")
        data = response.json()
        assert isinstance(data, list)
    
    def test_events_with_limit_parameter(self):
        """Events endpoint respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/events?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5


class TestCopyTradingWSUserTrades:
    """Test GET /api/copy-trading/ws/trades/{user_id} endpoint"""
    
    def test_user_trades_returns_200(self):
        """User trades endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/trades/demo_user")
        assert response.status_code == 200
    
    def test_user_trades_returns_list(self):
        """User trades endpoint returns a list"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/trades/demo_user")
        data = response.json()
        assert isinstance(data, list)
    
    def test_user_trades_with_limit(self):
        """User trades endpoint respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/trades/demo_user?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10


class TestCopyTradingWSFollowers:
    """Test GET /api/copy-trading/ws/followers/{trader_id} endpoint"""
    
    def test_followers_returns_200(self):
        """Followers endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/followers/MTR-001")
        assert response.status_code == 200
    
    def test_followers_has_required_fields(self):
        """Followers response has trader_id and followers list"""
        response = requests.get(f"{BASE_URL}/api/copy-trading/ws/followers/MTR-001")
        data = response.json()
        
        assert "trader_id" in data
        assert "followers" in data
        assert data["trader_id"] == "MTR-001"
        assert isinstance(data["followers"], list)


class TestCopyTradingWSSimulate:
    """Test POST /api/copy-trading/ws/simulate endpoint"""
    
    def test_simulate_returns_200(self):
        """Simulate endpoint returns 200"""
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
            json=payload
        )
        assert response.status_code == 200
    
    def test_simulate_returns_success(self):
        """Simulate endpoint returns success=true"""
        payload = {
            "master_trader_id": "MTR-TEST",
            "master_name": "Test Trader",
            "action": "buy",
            "symbol": "ETH",
            "quantity": 1.0,
            "price": 3000
        }
        response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload
        )
        data = response.json()
        assert data.get("success") == True
    
    def test_simulate_returns_event_data(self):
        """Simulate endpoint returns event with correct fields"""
        payload = {
            "master_trader_id": "MTR-003",
            "master_name": "Renaissance Quant",
            "action": "sell",
            "symbol": "SOL",
            "quantity": 10.0,
            "price": 130
        }
        response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload
        )
        data = response.json()
        
        assert "event" in data
        event = data["event"]
        
        # Verify event fields
        assert event["master_trader_id"] == "MTR-003"
        assert event["master_name"] == "Renaissance Quant"
        assert event["action"] == "sell"
        assert event["symbol"] == "SOL"
        assert event["quantity"] == 10.0
        assert event["price"] == 130
        assert "event_id" in event
        assert event["event_id"].startswith("CTE-")
        assert "timestamp" in event
    
    def test_simulate_buy_action(self):
        """Simulate buy action works correctly"""
        payload = {
            "master_trader_id": "MTR-004",
            "master_name": "DeFi Alpha Hunter",
            "action": "buy",
            "symbol": "AVAX",
            "quantity": 5.0,
            "price": 40
        }
        response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload
        )
        data = response.json()
        assert data["success"] == True
        assert data["event"]["action"] == "buy"
    
    def test_simulate_sell_action(self):
        """Simulate sell action works correctly"""
        payload = {
            "master_trader_id": "MTR-005",
            "master_name": "Trend Surfer Pro",
            "action": "sell",
            "symbol": "LINK",
            "quantity": 20.0,
            "price": 15
        }
        response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload
        )
        data = response.json()
        assert data["success"] == True
        assert data["event"]["action"] == "sell"
    
    def test_simulate_event_appears_in_events_list(self):
        """Simulated event appears in events list"""
        # Create a unique event
        payload = {
            "master_trader_id": "MTR-UNIQUE",
            "master_name": "Unique Test Trader",
            "action": "buy",
            "symbol": "MATIC",
            "quantity": 100.0,
            "price": 0.85
        }
        sim_response = requests.post(
            f"{BASE_URL}/api/copy-trading/ws/simulate",
            json=payload
        )
        event_id = sim_response.json()["event"]["event_id"]
        
        # Check events list
        events_response = requests.get(f"{BASE_URL}/api/copy-trading/ws/events?limit=10")
        events = events_response.json()
        
        event_ids = [e["event_id"] for e in events]
        assert event_id in event_ids, f"Event {event_id} not found in events list"


class TestCopyTradingWSIntegration:
    """Integration tests for copy trading WS flow"""
    
    def test_stats_update_after_simulate(self):
        """Stats update after simulating a trade"""
        # Get initial stats
        initial_stats = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats").json()
        initial_events = initial_stats["total_events_propagated"]
        
        # Simulate a trade
        payload = {
            "master_trader_id": "MTR-INT",
            "master_name": "Integration Test",
            "action": "buy",
            "symbol": "ARB",
            "quantity": 50.0,
            "price": 1.2
        }
        requests.post(f"{BASE_URL}/api/copy-trading/ws/simulate", json=payload)
        
        # Check stats updated
        new_stats = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats").json()
        assert new_stats["total_events_propagated"] > initial_events
    
    def test_events_history_grows(self):
        """Events history grows after simulating trades"""
        # Get initial events count
        initial_stats = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats").json()
        initial_count = initial_stats["events_in_history"]
        
        # Simulate a trade
        payload = {
            "master_trader_id": "MTR-HIST",
            "master_name": "History Test",
            "action": "sell",
            "symbol": "BTC",
            "quantity": 0.1,
            "price": 95000
        }
        requests.post(f"{BASE_URL}/api/copy-trading/ws/simulate", json=payload)
        
        # Check history grew
        new_stats = requests.get(f"{BASE_URL}/api/copy-trading/ws/stats").json()
        assert new_stats["events_in_history"] > initial_count


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
