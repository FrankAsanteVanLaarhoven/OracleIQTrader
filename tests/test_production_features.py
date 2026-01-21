"""
Test Production Features - Trading Playground, Autonomous Bot, Training System, Exchange & Social Integration
Tests for Cognitive Oracle Trading Platform production-ready features
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API is running"""
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
        # API returns list directly
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Market prices: {len(data)} coins")


class TestTradingPlayground:
    """Trading Playground - Paper trading with virtual money"""
    
    account_id = None
    
    def test_create_playground_account(self):
        """Create a new paper trading account with $100,000"""
        response = requests.post(f"{BASE_URL}/api/playground/account?initial_balance=100000")
        assert response.status_code == 200
        data = response.json()
        
        # Verify account structure
        assert "id" in data
        assert data["initial_balance"] == 100000.0
        assert data["current_balance"] == 100000.0
        assert data["buying_power"] == 100000.0
        assert data["total_equity"] == 100000.0
        assert data["total_pnl"] == 0.0
        assert "positions" in data
        assert "trade_history" in data
        
        TestTradingPlayground.account_id = data["id"]
        print(f"✓ Created playground account: {data['id']}")
        print(f"  Balance: ${data['current_balance']:,.2f}")
        
    def test_get_playground_account(self):
        """Get playground account details"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.get(f"{BASE_URL}/api/playground/account/{TestTradingPlayground.account_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == TestTradingPlayground.account_id
        assert "current_balance" in data
        assert "total_equity" in data
        print(f"✓ Retrieved account: Balance=${data['current_balance']:,.2f}, Equity=${data['total_equity']:,.2f}")
        
    def test_place_buy_order(self):
        """Place a market buy order"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/playground/order",
            params={
                "account_id": TestTradingPlayground.account_id,
                "symbol": "BTC",
                "side": "buy",
                "order_type": "market",
                "quantity": 0.1
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "order" in data
        assert data["order"]["status"] == "filled"
        assert data["order"]["symbol"] == "BTC"
        assert data["order"]["side"] == "buy"
        assert data["order"]["filled_quantity"] == 0.1
        
        print(f"✓ Buy order executed: {data['order']['filled_quantity']} BTC @ ${data['order']['filled_price']:,.2f}")
        print(f"  Fees: ${data['order']['fees']:.2f}")
        print(f"  New balance: ${data['account']['balance']:,.2f}")
        
    def test_view_positions_after_buy(self):
        """Verify position was created after buy"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.get(f"{BASE_URL}/api/playground/account/{TestTradingPlayground.account_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["positions"]) > 0
        btc_position = next((p for p in data["positions"] if p["symbol"] == "BTC"), None)
        assert btc_position is not None
        assert btc_position["quantity"] == 0.1
        assert btc_position["side"] == "long"
        
        print(f"✓ Position verified: {btc_position['quantity']} BTC @ ${btc_position['entry_price']:,.2f}")
        print(f"  Unrealized P&L: ${btc_position['unrealized_pnl']:.2f}")
        
    def test_place_sell_order(self):
        """Place a market sell order to close position"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/playground/order",
            params={
                "account_id": TestTradingPlayground.account_id,
                "symbol": "BTC",
                "side": "sell",
                "order_type": "market",
                "quantity": 0.1
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["order"]["status"] == "filled"
        assert data["order"]["side"] == "sell"
        
        print(f"✓ Sell order executed: {data['order']['filled_quantity']} BTC @ ${data['order']['filled_price']:,.2f}")
        print(f"  Total P&L: ${data['account']['pnl']:.2f}")
        
    def test_account_balance_after_trades(self):
        """Verify account balance and P&L after trades"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.get(f"{BASE_URL}/api/playground/account/{TestTradingPlayground.account_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Balance should be close to initial (minus fees and slippage)
        assert data["current_balance"] > 0
        assert len(data["trade_history"]) >= 2  # Buy and sell
        
        print(f"✓ Final account state:")
        print(f"  Balance: ${data['current_balance']:,.2f}")
        print(f"  Equity: ${data['total_equity']:,.2f}")
        print(f"  Total P&L: ${data['total_pnl']:.2f} ({data['total_pnl_percent']:.2f}%)")
        print(f"  Trade history: {len(data['trade_history'])} trades")
        
    def test_reset_account(self):
        """Reset account to initial state"""
        if not TestTradingPlayground.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/playground/reset/{TestTradingPlayground.account_id}",
            params={"initial_balance": 100000}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["account"]["current_balance"] == 100000.0
        assert data["account"]["total_pnl"] == 0.0
        assert len(data["account"]["positions"]) == 0
        assert len(data["account"]["trade_history"]) == 0
        
        print(f"✓ Account reset: Balance=${data['account']['current_balance']:,.2f}")
        
    def test_playground_leaderboard(self):
        """Get playground leaderboard"""
        response = requests.get(f"{BASE_URL}/api/playground/leaderboard?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert "leaderboard" in data
        print(f"✓ Leaderboard: {len(data['leaderboard'])} traders")


class TestAutonomousBot:
    """Autonomous AI Trading Bot tests"""
    
    bot_id = None
    account_id = None
    
    def test_create_bot_account_first(self):
        """Create playground account for bot"""
        response = requests.post(f"{BASE_URL}/api/playground/account?initial_balance=100000")
        assert response.status_code == 200
        data = response.json()
        TestAutonomousBot.account_id = data["id"]
        print(f"✓ Created account for bot: {data['id']}")
        
    def test_create_conservative_bot(self):
        """Create bot with conservative strategy"""
        if not TestAutonomousBot.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/create",
            params={
                "account_id": TestAutonomousBot.account_id,
                "strategy": "conservative",
                "trading_pairs": ["BTC", "ETH"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["account_id"] == TestAutonomousBot.account_id
        assert data["strategy_settings"]["strategy"] == "conservative"
        assert data["mode"] == "paused"
        assert data["is_active"] == False
        
        # Conservative strategy should have lower risk settings
        assert data["risk_settings"]["max_trade_size_percent"] == 2.0
        assert data["risk_settings"]["daily_loss_limit_percent"] == 1.0
        assert data["strategy_settings"]["confidence_threshold"] == 0.85
        
        TestAutonomousBot.bot_id = data["id"]
        print(f"✓ Created conservative bot: {data['id']}")
        print(f"  Strategy: {data['strategy_settings']['strategy']}")
        print(f"  Max trade size: {data['risk_settings']['max_trade_size_percent']}%")
        
    def test_create_moderate_bot(self):
        """Create bot with moderate strategy"""
        if not TestAutonomousBot.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/create",
            params={
                "account_id": TestAutonomousBot.account_id,
                "strategy": "moderate",
                "trading_pairs": ["BTC", "ETH", "SOL"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["strategy_settings"]["strategy"] == "moderate"
        print(f"✓ Created moderate bot: {data['id']}")
        
    def test_create_aggressive_bot(self):
        """Create bot with aggressive strategy"""
        if not TestAutonomousBot.account_id:
            pytest.skip("No account created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/create",
            params={
                "account_id": TestAutonomousBot.account_id,
                "strategy": "aggressive",
                "trading_pairs": ["BTC"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["strategy_settings"]["strategy"] == "aggressive"
        # Aggressive should have higher risk tolerance
        assert data["risk_settings"]["max_trade_size_percent"] == 10.0
        assert data["strategy_settings"]["confidence_threshold"] == 0.6
        
        print(f"✓ Created aggressive bot: {data['id']}")
        print(f"  Max trade size: {data['risk_settings']['max_trade_size_percent']}%")
        
    def test_get_bot(self):
        """Get bot details"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.get(f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == TestAutonomousBot.bot_id
        assert "risk_settings" in data
        assert "strategy_settings" in data
        assert "trading_pairs" in data
        
        print(f"✓ Retrieved bot: {data['id']}")
        print(f"  Trading pairs: {data['trading_pairs']}")
        
    def test_set_bot_mode_semi_auto(self):
        """Set bot to semi-auto mode"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/mode",
            params={"mode": "semi_auto"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["mode"] == "semi_auto"
        
        print(f"✓ Bot mode set to: semi_auto")
        
    def test_set_bot_mode_full_auto(self):
        """Set bot to full-auto mode"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/mode",
            params={"mode": "full_auto"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["mode"] == "full_auto"
        
        print(f"✓ Bot mode set to: full_auto")
        
    def test_set_bot_mode_paused(self):
        """Set bot to paused mode"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/mode",
            params={"mode": "paused"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["mode"] == "paused"
        
        print(f"✓ Bot mode set to: paused")
        
    def test_trigger_market_analysis(self):
        """Trigger manual market analysis and signal generation"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.post(
            f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/analyze",
            params={"symbol": "BTC"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify analysis structure
        assert "analysis" in data
        analysis = data["analysis"]
        assert "technical" in analysis
        assert "sentiment" in analysis
        assert "ai_prediction" in analysis
        assert "total_score" in analysis
        
        # Verify technical indicators
        tech = analysis["technical"]
        assert "rsi" in tech
        assert "macd" in tech
        assert "bollinger" in tech
        assert "ma_trend" in tech
        assert "volume" in tech
        
        # Verify signal structure
        assert "signal" in data
        signal = data["signal"]
        assert "signal" in signal  # Signal strength
        assert "confidence" in signal
        assert "action" in signal
        assert "reasoning" in signal
        assert len(signal["reasoning"]) > 0
        
        print(f"✓ Market analysis completed:")
        print(f"  RSI: {tech['rsi']:.1f}")
        print(f"  MACD: {tech['macd']}")
        print(f"  Total Score: {analysis['total_score']:.3f}")
        print(f"  Signal: {signal['signal']} ({signal['confidence']*100:.0f}% confidence)")
        print(f"  Action: {signal['action']}")
        
    def test_get_bot_performance(self):
        """Get bot performance statistics"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.get(f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/performance")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_trades" in data
        assert "winning_trades" in data
        assert "losing_trades" in data
        assert "win_rate" in data
        assert "total_pnl" in data
        assert "recent_signals" in data
        
        print(f"✓ Bot performance:")
        print(f"  Total trades: {data['total_trades']}")
        print(f"  Win rate: {data['win_rate']:.1f}%")
        print(f"  Recent signals: {len(data['recent_signals'])}")
        
    def test_get_pending_signals(self):
        """Get pending signals for semi-auto mode"""
        if not TestAutonomousBot.bot_id:
            pytest.skip("No bot created")
            
        response = requests.get(f"{BASE_URL}/api/bot/{TestAutonomousBot.bot_id}/signals")
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        print(f"✓ Pending signals: {len(data['signals'])}")
        
    def test_get_user_bots(self):
        """Get all bots for user"""
        response = requests.get(f"{BASE_URL}/api/bot/user/bots")
        assert response.status_code == 200
        data = response.json()
        
        assert "bots" in data
        assert len(data["bots"]) >= 1
        
        print(f"✓ User bots: {len(data['bots'])}")


class TestTrainingSystem:
    """Training Center - Tutorials, lessons, scenarios"""
    
    def test_get_training_content(self):
        """Get all training content"""
        response = requests.get(f"{BASE_URL}/api/training/content")
        assert response.status_code == 200
        data = response.json()
        
        assert "tutorials" in data
        assert "lessons" in data
        assert "scenarios" in data
        
        assert len(data["tutorials"]) > 0
        assert len(data["lessons"]) > 0
        assert len(data["scenarios"]) > 0
        
        # Verify tutorial structure
        tutorial = data["tutorials"][0]
        assert "id" in tutorial
        assert "title" in tutorial
        assert "description" in tutorial
        assert "category" in tutorial
        assert "difficulty" in tutorial
        assert "steps" in tutorial
        assert "rewards" in tutorial
        
        # Verify lesson structure
        lesson = data["lessons"][0]
        assert "id" in lesson
        assert "title" in lesson
        assert "content" in lesson
        assert "key_concepts" in lesson
        
        # Verify scenario structure
        scenario = data["scenarios"][0]
        assert "id" in scenario
        assert "title" in scenario
        assert "difficulty" in scenario
        assert "target_profit_percent" in scenario
        assert "max_drawdown_percent" in scenario
        
        print(f"✓ Training content loaded:")
        print(f"  Tutorials: {len(data['tutorials'])}")
        print(f"  Lessons: {len(data['lessons'])}")
        print(f"  Scenarios: {len(data['scenarios'])}")
        
    def test_get_user_progress(self):
        """Get user's training progress"""
        response = requests.get(f"{BASE_URL}/api/training/progress")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_xp" in data
        assert "current_level" in data
        assert "skills" in data
        assert "completed_tutorials" in data
        assert "completed_lessons" in data
        assert "badges" in data
        
        # Verify skills structure
        skills = data["skills"]
        assert "technical_analysis" in skills
        assert "risk_management" in skills
        assert "trading_psychology" in skills
        
        print(f"✓ User progress:")
        print(f"  Level: {data['current_level']}")
        print(f"  XP: {data['total_xp']}")
        print(f"  Badges: {len(data['badges'])}")
        print(f"  Completed tutorials: {len(data['completed_tutorials'])}")
        
    def test_complete_tutorial(self):
        """Complete a tutorial and earn XP"""
        # First get content to find a tutorial ID
        content_response = requests.get(f"{BASE_URL}/api/training/content")
        tutorials = content_response.json()["tutorials"]
        tutorial_id = tutorials[0]["id"]
        
        # Get initial progress
        progress_before = requests.get(f"{BASE_URL}/api/training/progress").json()
        initial_xp = progress_before["total_xp"]
        
        # Complete tutorial
        response = requests.post(f"{BASE_URL}/api/training/tutorial/{tutorial_id}/complete")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "xp_earned" in data
        assert data["xp_earned"] > 0
        
        # Verify XP was added
        progress_after = requests.get(f"{BASE_URL}/api/training/progress").json()
        assert progress_after["total_xp"] >= initial_xp
        assert tutorial_id in progress_after["completed_tutorials"]
        
        print(f"✓ Tutorial completed: {tutorial_id}")
        print(f"  XP earned: {data['xp_earned']}")
        print(f"  New level: {data.get('new_level', progress_after['current_level'])}")
        
    def test_complete_lesson(self):
        """Complete a lesson with quiz score"""
        # Get a lesson ID
        content_response = requests.get(f"{BASE_URL}/api/training/content")
        lessons = content_response.json()["lessons"]
        lesson_id = lessons[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/training/lesson/{lesson_id}/complete",
            params={"quiz_score": 85}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        
        print(f"✓ Lesson completed: {lesson_id}")
        print(f"  Quiz score: 85%")
        
    def test_run_backtest(self):
        """Run a strategy backtest"""
        response = requests.post(
            f"{BASE_URL}/api/training/backtest",
            params={
                "symbol": "BTC",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "strategy_type": "sma_cross",
                "initial_capital": 10000
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "config" in data
        assert "results" in data
        
        results = data["results"]
        # Verify backtest results structure (actual keys)
        assert "final_balance" in results
        assert "total_trades" in results
        assert "win_rate" in results
        assert "max_drawdown" in results
        assert "sharpe_ratio" in results
        
        # Calculate return from final balance
        total_return = ((results["final_balance"] - 10000) / 10000) * 100
        
        print(f"✓ Backtest completed:")
        print(f"  Strategy: {data['config']['strategy_type']}")
        print(f"  Final balance: ${results['final_balance']:,.2f}")
        print(f"  Total return: {total_return:.2f}%")
        print(f"  Win rate: {results['win_rate']:.1f}%")
        print(f"  Max drawdown: {results['max_drawdown']:.2f}%")
        print(f"  Sharpe ratio: {results['sharpe_ratio']:.2f}")


class TestExchangeIntegration:
    """Exchange Integration - Binance testnet structure"""
    
    def test_get_supported_exchanges(self):
        """Get list of supported exchanges"""
        response = requests.get(f"{BASE_URL}/api/exchange/supported")
        assert response.status_code == 200
        data = response.json()
        
        assert "exchanges" in data
        exchanges = data["exchanges"]
        
        # Verify exchange structure
        assert len(exchanges) > 0
        exchange = exchanges[0]
        assert "id" in exchange
        assert "name" in exchange
        assert "features" in exchange  # Actual key name
        assert "testnet" in exchange  # Actual key name
        
        # Binance should be supported
        binance = next((e for e in exchanges if e["id"] == "binance"), None)
        assert binance is not None
        assert binance["testnet"] == True
        
        print(f"✓ Supported exchanges: {len(exchanges)}")
        for ex in exchanges:
            print(f"  - {ex['name']} (testnet: {ex['testnet']})")


class TestSocialIntegration:
    """Social Integration - Twitter/Reddit sentiment"""
    
    def test_get_social_trending(self):
        """Get trending topics and sentiment"""
        response = requests.get(f"{BASE_URL}/api/social/trending")
        assert response.status_code == 200
        data = response.json()
        
        assert "fear_greed_index" in data
        assert "trending" in data  # Actual key name
        
        # Verify fear/greed index
        fg_value = data["fear_greed_index"]
        fg_label = data.get("fear_greed_label", "")
        assert 0 <= fg_value <= 100
        
        # Verify trending topics
        topics = data["trending"]
        assert len(topics) > 0
        topic = topics[0]
        assert "topic" in topic
        assert "mentions" in topic
        assert "sentiment" in topic
        
        print(f"✓ Social trending data:")
        print(f"  Fear & Greed: {fg_value} ({fg_label})")
        print(f"  Trending topics: {len(topics)}")
        for t in topics[:3]:
            print(f"    - {t['topic']}: {t['mentions']} mentions, sentiment: {t['sentiment']}")
            
    def test_get_symbol_sentiment(self):
        """Get sentiment analysis for a specific symbol"""
        response = requests.get(f"{BASE_URL}/api/social/sentiment/BTC")
        assert response.status_code == 200
        data = response.json()
        
        assert "symbol" in data
        assert "sentiment" in data  # Actual key name
        assert "sentiment_label" in data
        
        # Verify sentiment value
        sentiment = data["sentiment"]
        assert -1 <= sentiment <= 1
        
        print(f"✓ BTC Sentiment:")
        print(f"  Overall: {sentiment:.2f} ({data['sentiment_label']})")
        if "key_influencers" in data:
            print(f"  Key influencers: {len(data['key_influencers'])}")


class TestIntegrationFlows:
    """End-to-end integration tests"""
    
    def test_full_trading_flow(self):
        """Test complete trading flow: create account -> trade -> check P&L"""
        # 1. Create account
        account_resp = requests.post(f"{BASE_URL}/api/playground/account?initial_balance=50000")
        assert account_resp.status_code == 200
        account = account_resp.json()
        account_id = account["id"]
        
        # 2. Buy ETH
        buy_resp = requests.post(
            f"{BASE_URL}/api/playground/order",
            params={
                "account_id": account_id,
                "symbol": "ETH",
                "side": "buy",
                "order_type": "market",
                "quantity": 1.0
            }
        )
        assert buy_resp.status_code == 200
        buy_data = buy_resp.json()
        assert buy_data["success"] == True
        
        # 3. Check position
        account_resp = requests.get(f"{BASE_URL}/api/playground/account/{account_id}")
        account = account_resp.json()
        assert len(account["positions"]) == 1
        assert account["positions"][0]["symbol"] == "ETH"
        
        # 4. Sell ETH
        sell_resp = requests.post(
            f"{BASE_URL}/api/playground/order",
            params={
                "account_id": account_id,
                "symbol": "ETH",
                "side": "sell",
                "order_type": "market",
                "quantity": 1.0
            }
        )
        assert sell_resp.status_code == 200
        
        # 5. Verify final state
        final_resp = requests.get(f"{BASE_URL}/api/playground/account/{account_id}")
        final = final_resp.json()
        assert len(final["positions"]) == 0
        assert len(final["trade_history"]) == 2
        
        print(f"✓ Full trading flow completed:")
        print(f"  Initial: $50,000")
        print(f"  Final: ${final['current_balance']:,.2f}")
        print(f"  P&L: ${final['total_pnl']:.2f}")
        
    def test_bot_with_playground_integration(self):
        """Test bot creation linked to playground account"""
        # 1. Create playground account
        account_resp = requests.post(f"{BASE_URL}/api/playground/account?initial_balance=100000")
        account = account_resp.json()
        account_id = account["id"]
        
        # 2. Create bot linked to account
        bot_resp = requests.post(
            f"{BASE_URL}/api/bot/create",
            params={
                "account_id": account_id,
                "strategy": "moderate",
                "trading_pairs": ["BTC", "ETH"]
            }
        )
        assert bot_resp.status_code == 200
        bot = bot_resp.json()
        
        assert bot["account_id"] == account_id
        
        # 3. Trigger analysis
        analysis_resp = requests.post(
            f"{BASE_URL}/api/bot/{bot['id']}/analyze",
            params={"symbol": "BTC"}
        )
        assert analysis_resp.status_code == 200
        
        print(f"✓ Bot-Playground integration working")
        print(f"  Account: {account_id}")
        print(f"  Bot: {bot['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
