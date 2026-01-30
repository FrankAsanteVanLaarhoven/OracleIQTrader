"""
Test ML Predictions, Trading Competitions, and Benzinga News Features
Tests for Phase 7 features: ML Predictions, Trading Competitions, Benzinga News
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smart-trade-agents-1.preview.emergentagent.com').rstrip('/')


class TestMLPredictions:
    """ML Prediction endpoint tests"""
    
    def test_comprehensive_prediction_btc(self):
        """Test comprehensive ML prediction for BTC"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/comprehensive/BTC?horizon=24h")
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "id" in data
        assert "symbol" in data
        assert data["symbol"] == "BTC"
        assert "horizon" in data
        assert data["horizon"] == "24h"
        
        # Verify price direction prediction
        assert "price_direction" in data
        price_dir = data["price_direction"]
        assert "direction" in price_dir
        assert price_dir["direction"] in ["up", "down", "sideways"]
        assert "confidence" in price_dir
        assert 0 <= price_dir["confidence"] <= 1
        assert "predicted_change_percent" in price_dir
        assert "price_targets" in price_dir
        assert "reasoning" in price_dir
        
        # Verify volatility prediction
        assert "volatility" in data
        vol = data["volatility"]
        assert "level" in vol
        assert vol["level"] in ["very_low", "low", "moderate", "high", "extreme"]
        assert "expected_range_percent" in vol
        assert "confidence" in vol
        
        # Verify trend prediction
        assert "trend" in data
        trend = data["trend"]
        assert "direction" in trend
        assert trend["direction"] in ["strong_bullish", "bullish", "neutral", "bearish", "strong_bearish"]
        assert "strength" in trend
        assert 0 <= trend["strength"] <= 1
        
        # Verify overall analysis
        assert "overall_sentiment" in data
        assert data["overall_sentiment"] in ["bullish", "bearish", "neutral"]
        assert "overall_confidence" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high"]
        assert "recommendation" in data
        assert data["recommendation"] in ["strong_buy", "buy", "hold", "sell", "strong_sell"]
        
        # Verify AI analysis
        assert "ai_analysis" in data
        assert len(data["ai_analysis"]) > 0
        assert "key_factors" in data
        assert "risks" in data
        
        print(f"✓ BTC comprehensive prediction: {data['overall_sentiment']} ({data['recommendation']})")
    
    def test_comprehensive_prediction_eth(self):
        """Test comprehensive ML prediction for ETH"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/comprehensive/ETH?horizon=4h")
        assert response.status_code == 200
        
        data = response.json()
        assert data["symbol"] == "ETH"
        assert data["horizon"] == "4h"
        assert "price_direction" in data
        assert "volatility" in data
        assert "trend" in data
        
        print(f"✓ ETH 4h prediction: {data['overall_sentiment']}")
    
    def test_price_direction_prediction(self):
        """Test price direction prediction endpoint"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/direction/SOL?horizon=1h")
        assert response.status_code == 200
        
        data = response.json()
        assert "symbol" in data
        assert data["symbol"] == "SOL"
        assert "direction" in data
        assert "confidence" in data
        assert "predicted_change_percent" in data
        
        print(f"✓ SOL price direction: {data['direction']} ({data['confidence']:.2%} confidence)")
    
    def test_volatility_prediction(self):
        """Test volatility prediction endpoint"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/volatility/BTC?horizon=24h")
        assert response.status_code == 200
        
        data = response.json()
        assert "symbol" in data
        assert "level" in data
        assert "expected_range_percent" in data
        assert "factors" in data
        
        print(f"✓ BTC volatility: {data['level']} (±{data['expected_range_percent']:.1f}%)")
    
    def test_trend_prediction(self):
        """Test trend prediction endpoint"""
        response = requests.get(f"{BASE_URL}/api/ml/predict/trend/ETH?horizon=1w")
        assert response.status_code == 200
        
        data = response.json()
        assert "symbol" in data
        assert "direction" in data
        assert "strength" in data
        assert "key_levels" in data
        assert "indicators" in data
        
        print(f"✓ ETH trend: {data['direction']} (strength: {data['strength']:.2f})")
    
    def test_ml_accuracy_stats(self):
        """Test ML accuracy statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/ml/accuracy")
        assert response.status_code == 200
        
        data = response.json()
        assert "price_direction" in data
        assert "volatility" in data
        assert "trend" in data
        assert "overall" in data
        
        # Verify accuracy structure
        assert "accuracy" in data["price_direction"]
        assert "accuracy" in data["overall"]
        
        print(f"✓ ML accuracy: {data['overall']['accuracy']}% overall")


class TestTradingCompetitions:
    """Trading Competition endpoint tests"""
    
    def test_get_active_competitions(self):
        """Test getting active competitions"""
        response = requests.get(f"{BASE_URL}/api/competition/active")
        assert response.status_code == 200
        
        data = response.json()
        assert "competitions" in data
        assert isinstance(data["competitions"], list)
        
        if len(data["competitions"]) > 0:
            comp = data["competitions"][0]
            assert "id" in comp
            assert "name" in comp
            assert "type" in comp
            assert "status" in comp
            assert "starting_balance" in comp
            assert "prizes" in comp
            
            print(f"✓ Found {len(data['competitions'])} active competitions")
        else:
            print("✓ No active competitions (empty list returned)")
    
    def test_create_daily_challenge(self):
        """Test creating a daily challenge"""
        response = requests.post(f"{BASE_URL}/api/competition/create/daily")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "Daily Challenge" in data["name"]
        assert data["type"] == "daily"
        assert data["starting_balance"] == 10000.0
        assert "prizes" in data
        assert len(data["prizes"]) > 0
        
        # Verify prizes structure
        first_prize = data["prizes"][0]
        assert first_prize["rank"] == 1
        assert first_prize["xp_reward"] == 500
        
        print(f"✓ Created daily challenge: {data['name']}")
        return data["id"]
    
    def test_create_themed_moon_mission(self):
        """Test creating a Moon Mission themed event"""
        response = requests.post(f"{BASE_URL}/api/competition/create/themed?theme=moon_mission")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "Moon Mission" in data["name"]
        assert data["type"] == "themed"
        assert data["theme"] == "moon_mission"
        assert data["max_leverage"] == 2  # Moon mission allows 2x leverage
        assert "special_rules" in data
        assert len(data["special_rules"]) > 0
        
        print(f"✓ Created themed event: {data['name']}")
        return data["id"]
    
    def test_create_themed_bear_market(self):
        """Test creating a Bear Market themed event"""
        response = requests.post(f"{BASE_URL}/api/competition/create/themed?theme=bear_market")
        assert response.status_code == 200
        
        data = response.json()
        assert "Bear Market" in data["name"]
        assert data["objective"] == "lowest_drawdown"
        
        print(f"✓ Created bear market event: {data['name']}")
    
    def test_create_themed_steady_hands(self):
        """Test creating a Steady Hands themed event"""
        response = requests.post(f"{BASE_URL}/api/competition/create/themed?theme=steady_hands")
        assert response.status_code == 200
        
        data = response.json()
        assert "Steady Hands" in data["name"]
        assert data["objective"] == "sharpe_ratio"
        
        print(f"✓ Created steady hands event: {data['name']}")
    
    def test_create_themed_speed_trader(self):
        """Test creating a Speed Trader themed event"""
        response = requests.post(f"{BASE_URL}/api/competition/create/themed?theme=speed_trader")
        assert response.status_code == 200
        
        data = response.json()
        assert "Speed Trader" in data["name"]
        assert data["min_trades_required"] == 20  # Speed trader requires 20 trades
        
        print(f"✓ Created speed trader event: {data['name']}")
    
    def test_get_user_competition_stats(self):
        """Test getting user competition statistics"""
        response = requests.get(f"{BASE_URL}/api/competition/user/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "competitions_entered" in data
        assert "competitions_won" in data
        assert "tier" in data
        assert "tier_points" in data
        assert "badges_earned" in data
        
        print(f"✓ User stats: Tier {data['tier']}, {data['tier_points']} points")
    
    def test_get_global_leaderboard(self):
        """Test getting global competition leaderboard"""
        response = requests.get(f"{BASE_URL}/api/competition/global/leaderboard?limit=20")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        
        print(f"✓ Global leaderboard: {len(data['leaderboard'])} entries")
    
    def test_join_competition(self):
        """Test joining a competition"""
        # First create a competition
        create_response = requests.post(f"{BASE_URL}/api/competition/create/daily")
        assert create_response.status_code == 200
        comp_id = create_response.json()["id"]
        
        # Join the competition
        join_response = requests.post(f"{BASE_URL}/api/competition/{comp_id}/join")
        assert join_response.status_code == 200
        
        data = join_response.json()
        assert "success" in data
        
        if data["success"]:
            assert "entry" in data
            entry = data["entry"]
            assert entry["competition_id"] == comp_id
            assert entry["starting_balance"] == 10000.0
            print(f"✓ Joined competition: {comp_id}")
        else:
            # May already be entered
            print(f"✓ Join response: {data.get('error', 'Already entered')}")
    
    def test_get_competition_leaderboard(self):
        """Test getting competition-specific leaderboard"""
        # Get active competitions first
        active_response = requests.get(f"{BASE_URL}/api/competition/active")
        assert active_response.status_code == 200
        
        competitions = active_response.json()["competitions"]
        if len(competitions) > 0:
            comp_id = competitions[0]["id"]
            
            leaderboard_response = requests.get(f"{BASE_URL}/api/competition/{comp_id}/leaderboard")
            assert leaderboard_response.status_code == 200
            
            data = leaderboard_response.json()
            assert "leaderboard" in data
            
            print(f"✓ Competition leaderboard: {len(data['leaderboard'])} entries")
        else:
            print("✓ No competitions to get leaderboard for")


class TestBenzingaNews:
    """Benzinga News tests - Note: Uses MOCKED/simulated data"""
    
    def test_frontend_benzinga_component_exists(self):
        """Verify BenzingaNews component file exists"""
        import os
        component_path = "/app/frontend/src/components/BenzingaNews.jsx"
        assert os.path.exists(component_path), "BenzingaNews.jsx component should exist"
        
        with open(component_path, 'r') as f:
            content = f.read()
            assert "BenzingaNews" in content
            assert "data-testid" in content
            assert "PLACEHOLDER" in content  # Should indicate it's mocked
        
        print("✓ BenzingaNews component exists with placeholder indicator")


class TestNavigationTabs:
    """Test that new navigation tabs are properly configured"""
    
    def test_app_js_has_new_tabs(self):
        """Verify App.js has ML Predict, Compete, and Benzinga tabs"""
        import os
        app_path = "/app/frontend/src/App.js"
        assert os.path.exists(app_path)
        
        with open(app_path, 'r') as f:
            content = f.read()
            
            # Check for new tab IDs
            assert "predictions" in content, "predictions tab should exist"
            assert "competitions" in content, "competitions tab should exist"
            assert "benzinga" in content, "benzinga tab should exist"
            
            # Check for tab labels
            assert "ML Predict" in content, "ML Predict label should exist"
            assert "Compete" in content, "Compete label should exist"
            assert "Benzinga" in content, "Benzinga label should exist"
            
            # Check for component imports
            assert "MLPredictions" in content
            assert "TradingCompetitions" in content
            assert "BenzingaNews" in content
        
        print("✓ App.js has all new navigation tabs configured")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
