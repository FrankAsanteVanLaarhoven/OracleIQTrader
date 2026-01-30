"""
P6 Features Test Suite - Cognitive Oracle Trading Platform
Tests for: Trading Journal, Portfolio Leaderboard, Social Signals, Webcam Face Tracking
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smart-trade-agents-1.preview.emergentagent.com').rstrip('/')


class TestTradingJournal:
    """Trading Journal API tests - P6 Feature"""
    
    def test_daily_summary_returns_data(self):
        """Test daily summary endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/journal/daily-summary?date=2025-01-15")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "date" in data
        assert "trades_count" in data
        assert "wins" in data
        assert "losses" in data
        assert "win_rate" in data
        assert "total_pnl" in data
        assert "ai_insights" in data
        assert "emotion" in data
        
    def test_daily_summary_has_trades_stats(self):
        """Test daily summary includes trade statistics"""
        response = requests.get(f"{BASE_URL}/api/journal/daily-summary?date=2025-01-15")
        assert response.status_code == 200
        data = response.json()
        
        # Verify trades count is a number
        assert isinstance(data["trades_count"], int)
        assert data["trades_count"] >= 0
        
        # Verify wins and losses
        assert isinstance(data["wins"], int)
        assert isinstance(data["losses"], int)
        
        # Verify win rate is percentage
        assert isinstance(data["win_rate"], (int, float))
        assert 0 <= data["win_rate"] <= 100
        
    def test_daily_summary_has_pnl(self):
        """Test daily summary includes P&L data"""
        response = requests.get(f"{BASE_URL}/api/journal/daily-summary?date=2025-01-15")
        assert response.status_code == 200
        data = response.json()
        
        # Verify total P&L is a number
        assert isinstance(data["total_pnl"], (int, float))
        
    def test_daily_summary_has_best_worst_trades(self):
        """Test daily summary includes best and worst trades"""
        response = requests.get(f"{BASE_URL}/api/journal/daily-summary?date=2025-01-15")
        assert response.status_code == 200
        data = response.json()
        
        # Verify best trade structure
        if data.get("best_trade"):
            best = data["best_trade"]
            assert "action" in best
            assert "symbol" in best
            assert "profit_loss" in best
            
        # Verify worst trade structure
        if data.get("worst_trade"):
            worst = data["worst_trade"]
            assert "action" in worst
            assert "symbol" in worst
            assert "profit_loss" in worst
            
    def test_daily_summary_has_ai_insights(self):
        """Test daily summary includes AI insights"""
        response = requests.get(f"{BASE_URL}/api/journal/daily-summary?date=2025-01-15")
        assert response.status_code == 200
        data = response.json()
        
        # Verify AI insights
        assert "ai_insights" in data
        assert isinstance(data["ai_insights"], str)
        assert len(data["ai_insights"]) > 0
        
        # Verify emotion
        assert "emotion" in data
        assert data["emotion"] in ["excited", "happy", "concerned", "neutral"]
        
    def test_weekly_summary_returns_data(self):
        """Test weekly summary endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/journal/weekly-summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "period" in data
        assert "daily_summaries" in data
        assert "total_pnl" in data
        assert "total_trades" in data
        assert "overall_win_rate" in data
        assert "ai_insights" in data
        
    def test_weekly_summary_has_daily_breakdown(self):
        """Test weekly summary includes daily breakdown"""
        response = requests.get(f"{BASE_URL}/api/journal/weekly-summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify daily summaries is a list
        assert isinstance(data["daily_summaries"], list)
        assert len(data["daily_summaries"]) == 7  # 7 days
        
        # Verify each day has required fields
        for day in data["daily_summaries"]:
            assert "date" in day
            assert "pnl" in day
            assert "trades" in day
            assert "win_rate" in day
            
    def test_add_journal_note(self):
        """Test adding a journal note"""
        response = requests.post(
            f"{BASE_URL}/api/journal/add-note?date=2025-01-15&note=Test%20note%20from%20pytest"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Note added successfully"


class TestPortfolioLeaderboard:
    """Portfolio Leaderboard API tests - P6 Feature"""
    
    def test_public_portfolios_returns_data(self):
        """Test public portfolios endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=total_value")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "portfolios" in data
        assert "total_count" in data
        assert "sort_by" in data
        
    def test_portfolios_have_required_fields(self):
        """Test each portfolio has required fields"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=total_value")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["portfolios"]) > 0
        
        for portfolio in data["portfolios"]:
            assert "id" in portfolio
            assert "username" in portfolio
            assert "total_value" in portfolio
            assert "daily_pnl" in portfolio
            assert "daily_pnl_percent" in portfolio
            assert "win_rate" in portfolio
            assert "followers" in portfolio
            assert "rank" in portfolio
            
    def test_portfolios_sorted_by_value(self):
        """Test portfolios are sorted by total value"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=total_value")
        assert response.status_code == 200
        data = response.json()
        
        portfolios = data["portfolios"]
        if len(portfolios) > 1:
            # Verify descending order by total_value
            for i in range(len(portfolios) - 1):
                assert portfolios[i]["total_value"] >= portfolios[i + 1]["total_value"]
                
    def test_portfolios_have_rankings(self):
        """Test portfolios have correct rankings"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=total_value")
        assert response.status_code == 200
        data = response.json()
        
        portfolios = data["portfolios"]
        for i, portfolio in enumerate(portfolios):
            assert portfolio["rank"] == i + 1
            
    def test_portfolios_have_top_holdings(self):
        """Test portfolios include top holdings"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=total_value")
        assert response.status_code == 200
        data = response.json()
        
        for portfolio in data["portfolios"]:
            assert "top_holdings" in portfolio
            assert isinstance(portfolio["top_holdings"], list)
            
    def test_sort_by_daily_pnl(self):
        """Test sorting by daily P&L"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=daily_pnl")
        assert response.status_code == 200
        data = response.json()
        assert data["sort_by"] == "daily_pnl"
        
    def test_sort_by_win_rate(self):
        """Test sorting by win rate"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=win_rate")
        assert response.status_code == 200
        data = response.json()
        assert data["sort_by"] == "win_rate"
        
    def test_sort_by_followers(self):
        """Test sorting by followers"""
        response = requests.get(f"{BASE_URL}/api/portfolios/public?sort_by=followers")
        assert response.status_code == 200
        data = response.json()
        assert data["sort_by"] == "followers"


class TestSocialSignals:
    """Social Signals API tests - P6 Feature"""
    
    def test_trending_returns_data(self):
        """Test trending endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "trending" in data
        assert "overall_sentiment" in data
        assert "fear_greed_index" in data
        assert "fear_greed_label" in data
        assert "updated_at" in data
        
    def test_fear_greed_index_valid(self):
        """Test Fear & Greed index is valid"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        # Verify Fear & Greed index is 0-100
        assert isinstance(data["fear_greed_index"], (int, float))
        assert 0 <= data["fear_greed_index"] <= 100
        
        # Verify label
        assert data["fear_greed_label"] in ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"]
        
    def test_trending_topics_structure(self):
        """Test trending topics have correct structure"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["trending"]) > 0
        
        for topic in data["trending"]:
            assert "topic" in topic
            assert "mentions" in topic
            assert "sentiment" in topic
            assert "sentiment_score" in topic
            assert "change_24h" in topic
            
    def test_trending_has_sample_tweets(self):
        """Test trending topics include sample tweets"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        for topic in data["trending"]:
            assert "sample_tweets" in topic
            assert isinstance(topic["sample_tweets"], list)
            
    def test_sentiment_score_valid(self):
        """Test sentiment scores are valid (0-1)"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        for topic in data["trending"]:
            assert 0 <= topic["sentiment_score"] <= 1
            assert topic["sentiment"] in ["bullish", "bearish", "neutral"]
            
    def test_symbol_sentiment_btc(self):
        """Test BTC sentiment endpoint"""
        response = requests.get(f"{BASE_URL}/api/social/sentiment/BTC")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["symbol"] == "BTC"
        assert "sentiment_score" in data
        assert "sentiment_label" in data
        assert "mentions_24h" in data
        assert "mentions_change" in data
        assert "sources" in data
        assert "key_influencers" in data
        
    def test_symbol_sentiment_eth(self):
        """Test ETH sentiment endpoint"""
        response = requests.get(f"{BASE_URL}/api/social/sentiment/ETH")
        assert response.status_code == 200
        data = response.json()
        
        assert data["symbol"] == "ETH"
        assert "sentiment_score" in data
        
    def test_symbol_sentiment_sources(self):
        """Test sentiment includes source breakdown"""
        response = requests.get(f"{BASE_URL}/api/social/sentiment/BTC")
        assert response.status_code == 200
        data = response.json()
        
        sources = data["sources"]
        assert "twitter" in sources
        assert "reddit" in sources
        assert "telegram" in sources
        
    def test_symbol_sentiment_influencers(self):
        """Test sentiment includes key influencers"""
        response = requests.get(f"{BASE_URL}/api/social/sentiment/BTC")
        assert response.status_code == 200
        data = response.json()
        
        influencers = data["key_influencers"]
        assert isinstance(influencers, list)
        assert len(influencers) > 0
        
        for influencer in influencers:
            assert "name" in influencer
            assert "followers" in influencer
            assert "sentiment" in influencer


class TestExistingAPIs:
    """Verify existing APIs still work after P6 changes"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Cognitive Oracle Trading Platform API"
        
    def test_market_prices(self):
        """Test market prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
    def test_avatar_insight(self):
        """Test avatar insight endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json={"message": "Test insight", "emotion": "neutral"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "emotion" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
