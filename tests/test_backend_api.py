"""
Comprehensive Backend API Tests for Cognitive Oracle Trading Platform
Tests: Market Data, ML Predictions, Trading Competitions, Auth, Trades, Alerts, Crawler
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "2.0.0"
        print(f"SUCCESS: API root returns version {data['version']}")


class TestMarketData:
    """Market data endpoint tests - CoinGecko integration"""
    
    def test_get_all_market_prices(self):
        """Test GET /api/market/prices - returns all tracked symbols"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check for expected crypto symbols
        symbols = [item['symbol'] for item in data]
        assert 'BTC' in symbols, "BTC should be in market prices"
        assert 'ETH' in symbols, "ETH should be in market prices"
        
        # Validate data structure
        for item in data:
            assert 'symbol' in item
            assert 'price' in item
            assert 'change_percent' in item
            assert item['price'] > 0
        print(f"SUCCESS: Market prices returned {len(data)} symbols including BTC, ETH")
    
    def test_get_btc_price(self):
        """Test GET /api/market/BTC - returns Bitcoin price"""
        response = requests.get(f"{BASE_URL}/api/market/BTC")
        assert response.status_code == 200
        data = response.json()
        assert data['symbol'] == 'BTC'
        assert data['price'] > 0
        assert 'source' in data
        print(f"SUCCESS: BTC price is ${data['price']:,.2f} from {data['source']}")
    
    def test_get_eth_price(self):
        """Test GET /api/market/ETH - returns Ethereum price"""
        response = requests.get(f"{BASE_URL}/api/market/ETH")
        assert response.status_code == 200
        data = response.json()
        assert data['symbol'] == 'ETH'
        assert data['price'] > 0
        print(f"SUCCESS: ETH price is ${data['price']:,.2f}")
    
    def test_get_spy_price(self):
        """Test GET /api/market/SPY - returns S&P 500 ETF price"""
        response = requests.get(f"{BASE_URL}/api/market/SPY")
        assert response.status_code == 200
        data = response.json()
        assert data['symbol'] == 'SPY'
        assert data['price'] > 0
        print(f"SUCCESS: SPY price is ${data['price']:,.2f}")
    
    def test_get_price_history(self):
        """Test GET /api/market/BTC/history - returns historical data"""
        response = requests.get(f"{BASE_URL}/api/market/BTC/history?periods=30")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 30
        
        # Validate OHLCV structure
        for candle in data:
            assert 'open' in candle
            assert 'high' in candle
            assert 'low' in candle
            assert 'close' in candle
            assert 'volume' in candle
        print(f"SUCCESS: Price history returned {len(data)} candles")
    
    def test_invalid_symbol(self):
        """Test GET /api/market/INVALID - returns 404"""
        response = requests.get(f"{BASE_URL}/api/market/INVALID")
        assert response.status_code == 404
        print("SUCCESS: Invalid symbol returns 404")


class TestMLPredictions:
    """ML Predictions endpoint tests - Phase 7 feature"""
    
    def test_comprehensive_prediction(self):
        """Test GET /api/ml/predict/comprehensive/BTC"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/comprehensive/BTC")
        assert response.status_code == 200
        data = response.json()
        
        assert 'symbol' in data
        assert 'prediction' in data
        assert 'confidence' in data
        assert 'sentiment' in data
        assert 'risk_level' in data
        print(f"SUCCESS: ML prediction for BTC - {data['prediction']} with {data['confidence']}% confidence")
    
    def test_direction_prediction(self):
        """Test GET /api/ml/predict/direction/ETH"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/direction/ETH")
        assert response.status_code == 200
        data = response.json()
        assert 'direction' in data
        assert data['direction'] in ['UP', 'DOWN', 'NEUTRAL']
        print(f"SUCCESS: ETH direction prediction: {data['direction']}")
    
    def test_volatility_prediction(self):
        """Test GET /api/ml/predict/volatility/BTC"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/volatility/BTC")
        assert response.status_code == 200
        data = response.json()
        assert 'volatility' in data
        print(f"SUCCESS: BTC volatility prediction: {data['volatility']}")
    
    def test_trend_prediction(self):
        """Test GET /api/ml/predict/trend/SOL"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/trend/SOL")
        assert response.status_code == 200
        data = response.json()
        assert 'trend' in data
        print(f"SUCCESS: SOL trend prediction: {data['trend']}")
    
    def test_model_accuracy(self):
        """Test GET /api/ml/accuracy"""
        response = requests.get(f"{BASE_URL}/api/ml/accuracy")
        assert response.status_code == 200
        data = response.json()
        assert 'overall_accuracy' in data or 'accuracy' in data
        print(f"SUCCESS: ML model accuracy endpoint working")


class TestTradingCompetitions:
    """Trading Competitions endpoint tests - Phase 7 feature"""
    
    def test_get_active_competitions(self):
        """Test GET /api/competition/active"""
        response = requests.get(f"{BASE_URL}/api/competition/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Active competitions returned {len(data)} competitions")
    
    def test_create_daily_challenge(self):
        """Test POST /api/competition/create/daily"""
        response = requests.post(f"{BASE_URL}/api/competition/create/daily")
        assert response.status_code == 200
        data = response.json()
        assert 'id' in data or 'competition_id' in data
        print(f"SUCCESS: Daily challenge created")
    
    def test_create_themed_competition(self):
        """Test POST /api/competition/create/themed?theme=moon_mission"""
        response = requests.post(f"{BASE_URL}/api/competition/create/themed?theme=moon_mission")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Moon Mission themed competition created")
    
    def test_user_competition_stats(self):
        """Test GET /api/competition/user/stats"""
        response = requests.get(f"{BASE_URL}/api/competition/user/stats")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: User competition stats retrieved")
    
    def test_global_leaderboard(self):
        """Test GET /api/competition/global/leaderboard"""
        response = requests.get(f"{BASE_URL}/api/competition/global/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Global leaderboard returned {len(data)} entries")


class TestAgentConsensus:
    """AI Agent consensus endpoint tests"""
    
    def test_request_consensus(self):
        """Test POST /api/agents/consensus"""
        payload = {
            "action": "BUY",
            "symbol": "AAPL",
            "quantity": 100,
            "current_price": 250.0,
            "market_context": "Bullish market conditions"
        }
        response = requests.post(f"{BASE_URL}/api/agents/consensus", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert 'agents' in data
        assert 'final_decision' in data
        assert 'overall_confidence' in data
        assert len(data['agents']) >= 3
        print(f"SUCCESS: Agent consensus - {data['final_decision']} with {data['overall_confidence']} confidence")


class TestOracleMemory:
    """Oracle memory endpoint tests"""
    
    def test_query_oracle(self):
        """Test POST /api/oracle/query"""
        payload = {
            "symbol": "BTC",
            "action": "BUY",
            "context": "Testing oracle memory"
        }
        response = requests.post(f"{BASE_URL}/api/oracle/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert 'similar_instances' in data
        assert 'success_rate' in data
        assert 'recommendation' in data
        print(f"SUCCESS: Oracle query - {data['similar_instances']} similar instances, {data['success_rate']}% success rate")


class TestVoiceCommands:
    """Voice command parsing tests"""
    
    def test_parse_buy_command(self):
        """Test POST /api/voice/parse - BUY command"""
        payload = {
            "transcript": "Buy 100 shares of AAPL at market price",
            "confidence": 0.95
        }
        response = requests.post(f"{BASE_URL}/api/voice/parse", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data['action'] == 'BUY'
        assert data['symbol'] == 'AAPL'
        assert data['quantity'] == 100
        print(f"SUCCESS: Voice command parsed - {data['action']} {data['quantity']} {data['symbol']}")
    
    def test_parse_sell_command(self):
        """Test POST /api/voice/parse - SELL command"""
        payload = {
            "transcript": "Sell 50 BTC",
            "confidence": 0.90
        }
        response = requests.post(f"{BASE_URL}/api/voice/parse", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data['action'] == 'SELL'
        assert data['symbol'] == 'BTC'
        print(f"SUCCESS: Voice command parsed - {data['action']} {data['symbol']}")


class TestTradeExecution:
    """Trade execution tests"""
    
    def test_execute_trade(self):
        """Test POST /api/trades/execute"""
        response = requests.post(
            f"{BASE_URL}/api/trades/execute",
            params={"action": "BUY", "symbol": "ETH", "quantity": 10}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data['action'] == 'BUY'
        assert data['symbol'] == 'ETH'
        assert data['quantity'] == 10
        assert data['status'] == 'EXECUTED'
        assert data['price'] > 0
        print(f"SUCCESS: Trade executed - {data['action']} {data['quantity']} {data['symbol']} at ${data['price']:,.2f}")
    
    def test_get_trade_history(self):
        """Test GET /api/trades/history"""
        response = requests.get(f"{BASE_URL}/api/trades/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Trade history returned {len(data)} trades")


class TestPriceAlerts:
    """Price alerts CRUD tests"""
    
    def test_create_alert(self):
        """Test POST /api/alerts - create price alert"""
        payload = {
            "symbol": "BTC",
            "condition": "above",
            "target_price": 100000.0
        }
        response = requests.post(f"{BASE_URL}/api/alerts", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data['symbol'] == 'BTC'
        assert data['condition'] == 'above'
        assert data['target_price'] == 100000.0
        print(f"SUCCESS: Alert created - {data['symbol']} {data['condition']} ${data['target_price']:,.2f}")
        return data.get('id')
    
    def test_get_alerts(self):
        """Test GET /api/alerts - list alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Alerts list returned {len(data)} alerts")


class TestCrawlerSignals:
    """Trade crawler signals tests"""
    
    def test_get_crawler_signals(self):
        """Test GET /api/crawler/signals"""
        response = requests.get(f"{BASE_URL}/api/crawler/signals")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Crawler signals returned {len(data)} signals")
    
    def test_get_whale_transactions(self):
        """Test GET /api/crawler/whales"""
        response = requests.get(f"{BASE_URL}/api/crawler/whales")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Whale transactions returned {len(data)} entries")
    
    def test_get_news_signals(self):
        """Test GET /api/crawler/news"""
        response = requests.get(f"{BASE_URL}/api/crawler/news")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: News signals returned {len(data)} entries")


class TestPortfolio:
    """Portfolio summary tests"""
    
    def test_get_portfolio_summary(self):
        """Test GET /api/portfolio/summary"""
        response = requests.get(f"{BASE_URL}/api/portfolio/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert 'total_value' in data
        assert 'positions' in data
        assert 'cash_balance' in data
        print(f"SUCCESS: Portfolio summary - Total value: ${data['total_value']:,.2f}")


class TestUserState:
    """User state endpoints tests"""
    
    def test_get_mood_analysis(self):
        """Test GET /api/user/mood"""
        response = requests.get(f"{BASE_URL}/api/user/mood")
        assert response.status_code == 200
        data = response.json()
        
        assert 'state' in data
        assert 'confidence' in data
        print(f"SUCCESS: Mood analysis - {data['state']} ({data['confidence']*100:.0f}% confidence)")
    
    def test_get_gesture(self):
        """Test GET /api/gestures/detected"""
        response = requests.get(f"{BASE_URL}/api/gestures/detected")
        assert response.status_code == 200
        data = response.json()
        
        assert 'gesture' in data
        assert 'action' in data
        print(f"SUCCESS: Gesture detected - {data['gesture']} -> {data['action']}")


class TestAvatar:
    """Avatar TTS endpoints tests"""
    
    def test_get_available_voices(self):
        """Test GET /api/avatar/voices"""
        response = requests.get(f"{BASE_URL}/api/avatar/voices")
        assert response.status_code == 200
        data = response.json()
        
        assert 'voices' in data
        assert len(data['voices']) > 0
        print(f"SUCCESS: Avatar voices - {len(data['voices'])} voices available")
    
    def test_avatar_insight(self):
        """Test POST /api/avatar/insight"""
        payload = {
            "message": "Test insight",
            "emotion": "neutral",
            "market_context": {"btc_change": 2.5}
        }
        response = requests.post(f"{BASE_URL}/api/avatar/insight", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert 'message' in data
        assert 'emotion' in data
        print(f"SUCCESS: Avatar insight - {data['emotion']} emotion")


class TestExport:
    """Export endpoints tests"""
    
    def test_export_trades_csv(self):
        """Test GET /api/export/trades/csv"""
        response = requests.get(f"{BASE_URL}/api/export/trades/csv")
        assert response.status_code == 200
        assert 'text/csv' in response.headers.get('content-type', '')
        print(f"SUCCESS: Trades CSV export working")
    
    def test_export_trades_pdf(self):
        """Test GET /api/export/trades/pdf"""
        response = requests.get(f"{BASE_URL}/api/export/trades/pdf")
        assert response.status_code == 200
        assert 'application/pdf' in response.headers.get('content-type', '')
        print(f"SUCCESS: Trades PDF export working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
