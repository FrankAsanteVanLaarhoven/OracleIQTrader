"""
P4 Features Test Suite - Cognitive Oracle Trading Platform
Tests: Export (CSV/PDF), Price Alerts API, Crawler API, Language Support
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trade-ai-platform-7.preview.emergentagent.com')

class TestExportEndpoints:
    """Export functionality tests - CSV and PDF exports"""
    
    def test_export_trades_csv(self):
        """Test CSV export for trades"""
        response = requests.get(f"{BASE_URL}/api/export/trades/csv")
        assert response.status_code == 200
        assert 'text/csv' in response.headers.get('content-type', '')
        
        # Verify CSV structure
        content = response.text
        lines = content.strip().split('\n')
        assert len(lines) >= 1  # At least header
        
        # Check header columns
        header = lines[0]
        assert 'ID' in header
        assert 'Date' in header
        assert 'Action' in header
        assert 'Symbol' in header
        assert 'Quantity' in header
        assert 'Price' in header
        print(f"CSV export successful - {len(lines)} lines")
    
    def test_export_trades_pdf(self):
        """Test PDF export for trades"""
        response = requests.get(f"{BASE_URL}/api/export/trades/pdf")
        assert response.status_code == 200
        assert 'application/pdf' in response.headers.get('content-type', '')
        
        # Verify PDF magic bytes
        content = response.content
        assert content[:4] == b'%PDF'
        print(f"PDF export successful - {len(content)} bytes")
    
    def test_export_alerts_csv(self):
        """Test CSV export for alerts"""
        response = requests.get(f"{BASE_URL}/api/export/alerts/csv")
        assert response.status_code == 200
        assert 'text/csv' in response.headers.get('content-type', '')
        
        # Verify CSV structure
        content = response.text
        lines = content.strip().split('\n')
        assert len(lines) >= 1  # At least header
        
        header = lines[0]
        assert 'ID' in header
        assert 'Symbol' in header
        assert 'Condition' in header
        assert 'Target Price' in header
        print(f"Alerts CSV export successful - {len(lines)} lines")


class TestPriceAlertsAPI:
    """Price Alerts CRUD operations"""
    
    def test_create_alert(self):
        """Test creating a price alert"""
        payload = {
            "symbol": "ETH",
            "condition": "above",
            "target_price": 5000.0
        }
        response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data['symbol'] == 'ETH'
        assert data['condition'] == 'above'
        assert data['target_price'] == 5000.0
        assert data['triggered'] == False
        assert 'id' in data
        assert 'current_price' in data
        
        # Store for cleanup
        self.__class__.created_alert_id = data['id']
        print(f"Alert created: {data['id']}")
    
    def test_get_alerts(self):
        """Test getting all alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} alerts")
    
    def test_get_alerts_include_triggered(self):
        """Test getting alerts including triggered ones"""
        response = requests.get(f"{BASE_URL}/api/alerts?include_triggered=true")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} alerts (including triggered)")
    
    def test_delete_alert(self):
        """Test deleting a price alert"""
        # First create an alert to delete
        payload = {
            "symbol": "SOL",
            "condition": "below",
            "target_price": 100.0
        }
        create_response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert create_response.status_code == 200
        alert_id = create_response.json()['id']
        
        # Delete the alert
        delete_response = requests.delete(f"{BASE_URL}/api/alerts/{alert_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data['message'] == 'Alert deleted'
        assert data['id'] == alert_id
        print(f"Alert deleted: {alert_id}")


class TestCrawlerAPI:
    """Trade Crawler API tests - whale, news, social, orderbook signals"""
    
    def test_get_crawler_signals(self):
        """Test getting all crawler signals"""
        response = requests.get(f"{BASE_URL}/api/crawler/signals?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            signal = data[0]
            assert 'id' in signal
            assert 'signal_type' in signal
            assert 'urgency' in signal
            assert 'symbol' in signal
            assert 'message' in signal
            assert 'timestamp' in signal
            assert signal['signal_type'] in ['whale', 'news', 'social', 'orderbook']
            assert signal['urgency'] in ['critical', 'high', 'medium', 'low']
        print(f"Retrieved {len(data)} crawler signals")
    
    def test_get_crawler_signals_by_type(self):
        """Test filtering crawler signals by type"""
        for signal_type in ['whale', 'news', 'social', 'orderbook']:
            response = requests.get(f"{BASE_URL}/api/crawler/signals?signal_type={signal_type}&limit=5")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
            
            # All returned signals should match the filter
            for signal in data:
                assert signal['signal_type'] == signal_type
            print(f"Retrieved {len(data)} {signal_type} signals")
    
    def test_get_whale_transactions(self):
        """Test getting whale transactions"""
        response = requests.get(f"{BASE_URL}/api/crawler/whales?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for signal in data:
            assert signal['signal_type'] == 'whale'
            assert 'data' in signal
            # Whale data should have blockchain info
            if signal.get('data'):
                whale_data = signal['data']
                assert 'blockchain' in whale_data or 'amount' in whale_data
        print(f"Retrieved {len(data)} whale transactions")
    
    def test_get_news_signals(self):
        """Test getting news signals"""
        response = requests.get(f"{BASE_URL}/api/crawler/news?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for signal in data:
            assert signal['signal_type'] == 'news'
            if signal.get('data'):
                news_data = signal['data']
                assert 'title' in news_data or 'sentiment' in news_data
        print(f"Retrieved {len(data)} news signals")
    
    def test_get_social_signals(self):
        """Test getting social media signals"""
        response = requests.get(f"{BASE_URL}/api/crawler/social?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for signal in data:
            assert signal['signal_type'] == 'social'
        print(f"Retrieved {len(data)} social signals")
    
    def test_get_orderbook_signals(self):
        """Test getting order book signals"""
        response = requests.get(f"{BASE_URL}/api/crawler/orderbook?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for signal in data:
            assert signal['signal_type'] == 'orderbook'
        print(f"Retrieved {len(data)} orderbook signals")


class TestExistingAPIs:
    """Verify existing APIs still work after P4 changes"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        assert 'version' in data
    
    def test_market_prices(self):
        """Test market prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check for crypto and stock symbols
        symbols = [item['symbol'] for item in data]
        assert 'BTC' in symbols
        assert 'ETH' in symbols
    
    def test_market_symbol(self):
        """Test individual market symbol"""
        response = requests.get(f"{BASE_URL}/api/market/BTC")
        assert response.status_code == 200
        data = response.json()
        assert data['symbol'] == 'BTC'
        assert 'price' in data
        assert 'change_percent' in data
    
    def test_trades_history(self):
        """Test trades history endpoint"""
        response = requests.get(f"{BASE_URL}/api/trades/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_portfolio_summary(self):
        """Test portfolio summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/portfolio/summary")
        assert response.status_code == 200
        data = response.json()
        assert 'total_value' in data
        assert 'positions' in data


class TestAlertConditions:
    """Test various alert conditions"""
    
    def test_create_alert_above(self):
        """Test creating above condition alert"""
        payload = {
            "symbol": "BTC",
            "condition": "above",
            "target_price": 150000.0
        }
        response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['condition'] == 'above'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/alerts/{data['id']}")
    
    def test_create_alert_below(self):
        """Test creating below condition alert"""
        payload = {
            "symbol": "ETH",
            "condition": "below",
            "target_price": 1000.0
        }
        response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['condition'] == 'below'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/alerts/{data['id']}")
    
    def test_create_alert_stock_symbol(self):
        """Test creating alert for stock symbol"""
        payload = {
            "symbol": "AAPL",
            "condition": "above",
            "target_price": 300.0
        }
        response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['symbol'] == 'AAPL'
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/alerts/{data['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
