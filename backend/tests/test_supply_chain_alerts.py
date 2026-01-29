"""
Supply Chain Alert System API Tests
Tests for the new alert notification feature in OracleIQTrader
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSupplyChainAlertPresets:
    """Test GET /api/supply-chain/alerts/presets - Returns 6 preset alert configurations"""
    
    def test_get_presets_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/presets")
        assert response.status_code == 200
    
    def test_get_presets_returns_6_presets(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/presets")
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6
    
    def test_presets_have_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/presets")
        data = response.json()
        required_fields = ["name", "description", "alert_type", "condition", "threshold", "priority", "icon"]
        for preset in data:
            for field in required_fields:
                assert field in preset, f"Missing field: {field}"
    
    def test_presets_have_valid_alert_types(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/presets")
        data = response.json()
        valid_types = ["port_congestion", "supplier_risk", "geopolitical_risk", "commodity_price", "market_event", "delivery_delay"]
        for preset in data:
            assert preset["alert_type"] in valid_types


class TestSupplyChainAlertStats:
    """Test GET /api/supply-chain/alerts/stats - Returns alert statistics"""
    
    def test_get_stats_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/stats")
        assert response.status_code == 200
    
    def test_stats_have_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/stats")
        data = response.json()
        required_fields = ["total_alerts", "enabled_alerts", "disabled_alerts", "triggered_today", "total_triggered_history"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_stats_values_are_integers(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/stats")
        data = response.json()
        assert isinstance(data["total_alerts"], int)
        assert isinstance(data["enabled_alerts"], int)
        assert isinstance(data["disabled_alerts"], int)


class TestSupplyChainAlertCRUD:
    """Test CRUD operations for supply chain alerts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_alert_data = {
            "user_id": "TEST_demo_user",
            "alert_type": "port_congestion",
            "target_entity": "PORT-TEST",
            "entity_name": "Test Port Alert",
            "condition": "above",
            "threshold": 85,
            "priority": "high"
        }
        self.created_alert_ids = []
        yield
        # Cleanup: Delete all test alerts
        for alert_id in self.created_alert_ids:
            try:
                requests.delete(f"{BASE_URL}/api/supply-chain/alerts/{alert_id}")
            except:
                pass
    
    def test_create_alert_returns_success(self):
        """POST /api/supply-chain/alerts - Creates new alert"""
        response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "alert" in data
        self.created_alert_ids.append(data["alert"]["alert_id"])
    
    def test_create_alert_returns_alert_with_id(self):
        """Created alert has alert_id"""
        response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        data = response.json()
        assert "alert_id" in data["alert"]
        assert data["alert"]["alert_id"].startswith("SCA-")
        self.created_alert_ids.append(data["alert"]["alert_id"])
    
    def test_create_alert_has_correct_data(self):
        """Created alert has correct field values"""
        response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        data = response.json()
        alert = data["alert"]
        assert alert["user_id"] == self.test_alert_data["user_id"]
        assert alert["alert_type"] == self.test_alert_data["alert_type"]
        assert alert["target_entity"] == self.test_alert_data["target_entity"]
        assert alert["entity_name"] == self.test_alert_data["entity_name"]
        assert alert["condition"] == self.test_alert_data["condition"]
        assert alert["threshold"] == self.test_alert_data["threshold"]
        assert alert["priority"] == self.test_alert_data["priority"]
        assert alert["enabled"] == True
        self.created_alert_ids.append(alert["alert_id"])
    
    def test_get_user_alerts_returns_list(self):
        """GET /api/supply-chain/alerts?user_id=demo_user - Returns user's alerts"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts?user_id=demo_user")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_alert_disable(self):
        """PUT /api/supply-chain/alerts/{id} - Updates alert (disable)"""
        # First create an alert
        create_response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        alert_id = create_response.json()["alert"]["alert_id"]
        self.created_alert_ids.append(alert_id)
        
        # Update to disable
        update_response = requests.put(
            f"{BASE_URL}/api/supply-chain/alerts/{alert_id}",
            json={"enabled": False}
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["success"] == True
        assert data["alert"]["enabled"] == False
    
    def test_update_alert_threshold(self):
        """PUT /api/supply-chain/alerts/{id} - Updates alert threshold"""
        # First create an alert
        create_response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        alert_id = create_response.json()["alert"]["alert_id"]
        self.created_alert_ids.append(alert_id)
        
        # Update threshold
        update_response = requests.put(
            f"{BASE_URL}/api/supply-chain/alerts/{alert_id}",
            json={"threshold": 90}
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["success"] == True
        assert data["alert"]["threshold"] == 90
    
    def test_delete_alert(self):
        """DELETE /api/supply-chain/alerts/{id} - Deletes alert"""
        # First create an alert
        create_response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=self.test_alert_data
        )
        alert_id = create_response.json()["alert"]["alert_id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/supply-chain/alerts/{alert_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["success"] == True
    
    def test_delete_nonexistent_alert(self):
        """DELETE /api/supply-chain/alerts/{id} - Returns false for nonexistent"""
        delete_response = requests.delete(f"{BASE_URL}/api/supply-chain/alerts/SCA-NONEXISTENT")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["success"] == False


class TestSupplyChainAlertHistory:
    """Test GET /api/supply-chain/alerts/history - Returns triggered alerts"""
    
    def test_get_history_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/history?user_id=demo_user")
        assert response.status_code == 200
    
    def test_get_history_returns_list(self):
        response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/history?user_id=demo_user")
        data = response.json()
        assert isinstance(data, list)


class TestSupplyChainAlertCheck:
    """Test POST /api/supply-chain/alerts/check - Checks alerts against current data"""
    
    def test_check_alerts_returns_200(self):
        response = requests.post(f"{BASE_URL}/api/supply-chain/alerts/check")
        assert response.status_code == 200
    
    def test_check_alerts_returns_required_fields(self):
        response = requests.post(f"{BASE_URL}/api/supply-chain/alerts/check")
        data = response.json()
        assert "checked_at" in data
        assert "alerts_checked" in data
        assert "alerts_triggered" in data
        assert "triggered" in data
    
    def test_check_alerts_triggered_is_list(self):
        response = requests.post(f"{BASE_URL}/api/supply-chain/alerts/check")
        data = response.json()
        assert isinstance(data["triggered"], list)


class TestSupplyChainAlertIntegration:
    """Integration tests for alert workflow"""
    
    def test_full_alert_lifecycle(self):
        """Test create -> get -> update -> check -> delete workflow"""
        # 1. Create alert
        create_data = {
            "user_id": "TEST_integration_user",
            "alert_type": "geopolitical_risk",
            "target_entity": "global",
            "entity_name": "Global Risk Index",
            "condition": "above",
            "threshold": 30,  # Low threshold to potentially trigger
            "priority": "critical"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/supply-chain/alerts",
            json=create_data
        )
        assert create_response.status_code == 200
        alert_id = create_response.json()["alert"]["alert_id"]
        
        try:
            # 2. Get alerts - verify it exists
            get_response = requests.get(f"{BASE_URL}/api/supply-chain/alerts?user_id=TEST_integration_user")
            assert get_response.status_code == 200
            alerts = get_response.json()
            assert any(a["alert_id"] == alert_id for a in alerts)
            
            # 3. Update alert
            update_response = requests.put(
                f"{BASE_URL}/api/supply-chain/alerts/{alert_id}",
                json={"enabled": False}
            )
            assert update_response.status_code == 200
            assert update_response.json()["alert"]["enabled"] == False
            
            # 4. Check alerts
            check_response = requests.post(f"{BASE_URL}/api/supply-chain/alerts/check")
            assert check_response.status_code == 200
            
            # 5. Get stats
            stats_response = requests.get(f"{BASE_URL}/api/supply-chain/alerts/stats")
            assert stats_response.status_code == 200
            
        finally:
            # 6. Delete alert (cleanup)
            delete_response = requests.delete(f"{BASE_URL}/api/supply-chain/alerts/{alert_id}")
            assert delete_response.status_code == 200
            assert delete_response.json()["success"] == True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
