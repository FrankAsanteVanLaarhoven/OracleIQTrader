"""
Supply Chain Hub API Tests
Tests for /api/supply-chain/* endpoints - Control Tower, Markets, Suppliers, Ports, Instruments, Geopolitical Risk
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSupplyChainControlTower:
    """Control Tower endpoint tests"""
    
    def test_control_tower_returns_200(self):
        """GET /api/supply-chain/control-tower returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/control-tower")
        assert response.status_code == 200
        
    def test_control_tower_has_overview(self):
        """Control tower response has overview with supplier/port counts"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/control-tower")
        data = response.json()
        
        assert "overview" in data
        assert "total_suppliers_monitored" in data["overview"]
        assert "total_ports_tracked" in data["overview"]
        assert "active_markets" in data["overview"]
        assert "scf_instruments" in data["overview"]
        
    def test_control_tower_has_risk_summary(self):
        """Control tower response has risk summary"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/control-tower")
        data = response.json()
        
        assert "risk_summary" in data
        assert "avg_port_congestion" in data["risk_summary"]
        assert "high_risk_suppliers" in data["risk_summary"]
        assert "active_alerts" in data["risk_summary"]
        assert "global_risk_level" in data["risk_summary"]
        
    def test_control_tower_has_top_risks(self):
        """Control tower response has top risks list"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/control-tower")
        data = response.json()
        
        assert "top_risks" in data
        assert isinstance(data["top_risks"], list)
        if len(data["top_risks"]) > 0:
            risk = data["top_risks"][0]
            assert "title" in risk
            assert "impact_score" in risk


class TestSupplyChainMarkets:
    """Event Markets endpoint tests"""
    
    def test_markets_returns_200(self):
        """GET /api/supply-chain/markets returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/markets")
        assert response.status_code == 200
        
    def test_markets_returns_list(self):
        """Markets endpoint returns list of tradeable markets"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/markets")
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
    def test_market_has_required_fields(self):
        """Each market has required trading fields"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/markets")
        data = response.json()
        
        market = data[0]
        assert "market_id" in market
        assert "title" in market
        assert "event_type" in market
        assert "yes_price" in market
        assert "no_price" in market
        assert "volume" in market
        assert "impact_score" in market
        
    def test_market_prices_valid_range(self):
        """Market yes/no prices are between 0 and 1"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/markets")
        data = response.json()
        
        for market in data:
            assert 0 <= market["yes_price"] <= 1
            assert 0 <= market["no_price"] <= 1


class TestSupplyChainSuppliers:
    """Suppliers endpoint tests"""
    
    def test_suppliers_returns_200(self):
        """GET /api/supply-chain/suppliers returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/suppliers")
        assert response.status_code == 200
        
    def test_suppliers_returns_list(self):
        """Suppliers endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/suppliers")
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
    def test_supplier_has_required_fields(self):
        """Each supplier has required fields"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/suppliers")
        data = response.json()
        
        supplier = data[0]
        assert "supplier_id" in supplier
        assert "name" in supplier
        assert "region" in supplier
        assert "risk_score" in supplier
        assert "risk_level" in supplier
        assert "metrics" in supplier
        assert "commodities" in supplier
        
    def test_supplier_metrics_complete(self):
        """Supplier metrics include financial health, delivery, quality, ESG"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/suppliers")
        data = response.json()
        
        metrics = data[0]["metrics"]
        assert "financial_health" in metrics
        assert "delivery_reliability" in metrics
        assert "quality_score" in metrics
        assert "esg_score" in metrics


class TestSupplyChainPorts:
    """Ports endpoint tests"""
    
    def test_ports_returns_200(self):
        """GET /api/supply-chain/ports returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/ports")
        assert response.status_code == 200
        
    def test_ports_returns_list(self):
        """Ports endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/ports")
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
    def test_port_has_required_fields(self):
        """Each port has required fields"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/ports")
        data = response.json()
        
        port = data[0]
        assert "port_id" in port
        assert "name" in port
        assert "region" in port
        assert "country" in port
        assert "congestion" in port
        assert "throughput_teu" in port
        
    def test_port_congestion_data(self):
        """Port congestion data includes level, status, queue"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/ports")
        data = response.json()
        
        congestion = data[0]["congestion"]
        assert "level" in congestion
        assert "status" in congestion
        assert "vessel_queue" in congestion
        assert "avg_wait_days" in congestion


class TestSupplyChainInstruments:
    """SCF Derivatives/Instruments endpoint tests"""
    
    def test_instruments_returns_200(self):
        """GET /api/supply-chain/instruments returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/instruments")
        assert response.status_code == 200
        
    def test_instruments_returns_list(self):
        """Instruments endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/instruments")
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
    def test_instrument_has_required_fields(self):
        """Each instrument has required fields"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/instruments")
        data = response.json()
        
        instrument = data[0]
        assert "instrument_id" in instrument
        assert "name" in instrument
        assert "commodity" in instrument
        assert "pricing" in instrument
        assert "risk" in instrument
        assert "trading" in instrument
        
    def test_instrument_pricing_data(self):
        """Instrument pricing includes current price and changes"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/instruments")
        data = response.json()
        
        pricing = data[0]["pricing"]
        assert "current_price" in pricing
        assert "change_24h" in pricing
        assert "change_7d" in pricing


class TestSupplyChainGeopoliticalRisk:
    """Geopolitical Risk endpoint tests"""
    
    def test_geopolitical_risk_returns_200(self):
        """GET /api/supply-chain/geopolitical-risk returns 200"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/geopolitical-risk")
        assert response.status_code == 200
        
    def test_geopolitical_risk_has_index(self):
        """Geopolitical risk response has index and level"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/geopolitical-risk")
        data = response.json()
        
        assert "index" in data
        assert "level" in data
        assert "events_tracked" in data
        assert "key_risks" in data
        
    def test_geopolitical_risk_level_valid(self):
        """Geopolitical risk level is valid value"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/geopolitical-risk")
        data = response.json()
        
        valid_levels = ["Low", "Moderate", "Elevated", "High", "Critical"]
        assert data["level"] in valid_levels
        
    def test_geopolitical_key_risks_structure(self):
        """Key risks have title, probability, impact"""
        response = requests.get(f"{BASE_URL}/api/supply-chain/geopolitical-risk")
        data = response.json()
        
        if len(data["key_risks"]) > 0:
            risk = data["key_risks"][0]
            assert "title" in risk
            assert "probability" in risk
            assert "impact" in risk


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
