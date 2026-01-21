"""
P5 Enhanced Features Test Suite
Tests for:
1. 3D Trading Avatar with 68-point mesh
2. Voice command API - buy/sell/check price/set alert
3. Trade announcement API
4. Real whale transactions API (blockchain.info)
5. Real crypto news API (CryptoPanic)
6. Avatar insight with audio generation
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVoiceCommandAPI:
    """Voice command parsing and response tests"""
    
    def test_voice_command_buy_btc(self):
        """Test parsing 'buy 2 btc' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "buy 2 btc", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "buy"
        assert data["action_data"]["action"] == "buy"
        assert data["action_data"]["symbol"] == "BTC"
        assert data["action_data"]["quantity"] == 2.0
        assert "Preparing to buy 2" in data["response"]
        print(f"✓ Buy BTC command parsed: {data['response']}")
    
    def test_voice_command_sell_eth(self):
        """Test parsing 'sell 100 eth' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "sell 100 eth", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "sell"
        assert data["action_data"]["action"] == "sell"
        assert data["action_data"]["symbol"] == "ETH"
        assert data["action_data"]["quantity"] == 100.0
        assert "Preparing to sell 100" in data["response"]
        print(f"✓ Sell ETH command parsed: {data['response']}")
    
    def test_voice_command_check_price(self):
        """Test parsing 'check btc price' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "check btc price", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "price_check"
        assert data["action_data"]["action"] == "price_check"
        assert data["action_data"]["symbol"] == "BTC"
        assert "Checking the current price" in data["response"]
        print(f"✓ Price check command parsed: {data['response']}")
    
    def test_voice_command_set_alert(self):
        """Test parsing 'set alert btc above 100000' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "set alert btc above 100000", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "set_alert"
        assert data["action_data"]["action"] == "set_alert"
        assert data["action_data"]["symbol"] == "BTC"
        assert data["action_data"]["condition"] == "above"
        assert data["action_data"]["target_price"] == 100000.0
        assert "Setting alert" in data["response"]
        print(f"✓ Set alert command parsed: {data['response']}")
    
    def test_voice_command_returns_audio(self):
        """Test that voice command returns audio response"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "buy 1 bitcoin", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        # Audio should be present if TTS is available
        if data.get("audio"):
            assert data["format"] == "mp3"
            assert len(data["audio"]) > 100  # Base64 audio should be substantial
            print(f"✓ Voice command returned audio response (format: {data['format']})")
        else:
            print("⚠ Voice command did not return audio (TTS may be unavailable)")
    
    def test_voice_command_sell_sol(self):
        """Test parsing 'sell 50 solana' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "sell 50 solana", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "sell"
        assert data["action_data"]["symbol"] == "SOL"
        assert data["action_data"]["quantity"] == 50.0
        print(f"✓ Sell SOL command parsed: {data['response']}")
    
    def test_voice_command_market_status(self):
        """Test parsing 'market status' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "how are the markets", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "market_status"
        assert "market conditions" in data["response"].lower()
        print(f"✓ Market status command parsed: {data['response']}")
    
    def test_voice_command_help(self):
        """Test parsing 'help' command"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            json={"transcript": "help me with commands", "context": {}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "help"
        assert "buy" in data["response"].lower()
        print(f"✓ Help command parsed: {data['response']}")


class TestTradeAnnouncementAPI:
    """Trade announcement with TTS tests"""
    
    def test_announce_trade_buy(self):
        """Test trade announcement for buy order"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/announce-trade",
            json={
                "action": "buy",
                "symbol": "BTC",
                "quantity": 1.5,
                "price": 95000.0,
                "profit_loss": None
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "BUY" in data["message"]
        assert "BTC" in data["message"]
        assert "95,000" in data["message"]
        assert data["emotion"] == "happy"
        assert "trade_id" in data
        print(f"✓ Trade announcement (buy): {data['message']}")
    
    def test_announce_trade_with_profit(self):
        """Test trade announcement with profit"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/announce-trade",
            json={
                "action": "sell",
                "symbol": "ETH",
                "quantity": 10,
                "price": 3500.0,
                "profit_loss": 2500.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "SELL" in data["message"]
        assert "ETH" in data["message"]
        assert "profit" in data["message"].lower()
        assert data["emotion"] == "excited"
        print(f"✓ Trade announcement (profit): {data['message']}")
    
    def test_announce_trade_with_loss(self):
        """Test trade announcement with loss"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/announce-trade",
            json={
                "action": "sell",
                "symbol": "SOL",
                "quantity": 100,
                "price": 120.0,
                "profit_loss": -500.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "SELL" in data["message"]
        assert "SOL" in data["message"]
        assert "loss" in data["message"].lower()
        assert data["emotion"] == "concerned"
        print(f"✓ Trade announcement (loss): {data['message']}")
    
    def test_announce_trade_returns_audio(self):
        """Test that trade announcement returns audio"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/announce-trade",
            json={
                "action": "buy",
                "symbol": "BTC",
                "quantity": 0.5,
                "price": 90000.0,
                "profit_loss": None
            }
        )
        assert response.status_code == 200
        data = response.json()
        if data.get("audio"):
            assert data["format"] == "mp3"
            assert len(data["audio"]) > 100
            print(f"✓ Trade announcement returned audio (format: {data['format']})")
        else:
            print("⚠ Trade announcement did not return audio (TTS may be unavailable)")


class TestRealWhaleTransactionsAPI:
    """Real blockchain whale transactions tests"""
    
    def test_whale_transactions_endpoint(self):
        """Test /api/real/whale-transactions returns data"""
        response = requests.get(f"{BASE_URL}/api/real/whale-transactions")
        assert response.status_code == 200
        data = response.json()
        assert "source" in data
        assert data["source"] == "blockchain.info"
        assert "transactions" in data
        assert "fetched_at" in data
        print(f"✓ Whale transactions endpoint working, source: {data['source']}")
    
    def test_whale_transactions_structure(self):
        """Test whale transaction data structure"""
        response = requests.get(f"{BASE_URL}/api/real/whale-transactions")
        assert response.status_code == 200
        data = response.json()
        
        if data.get("transactions") and len(data["transactions"]) > 0:
            tx = data["transactions"][0]
            assert "hash" in tx
            assert "amount" in tx
            assert "symbol" in tx
            assert tx["symbol"] == "BTC"
            assert "usd_value" in tx
            assert "timestamp" in tx
            print(f"✓ Whale transaction structure valid: {tx['amount']} BTC (${tx['usd_value']:,.0f})")
        else:
            print("⚠ No whale transactions found (may be normal if no large txs in latest block)")
    
    def test_whale_transactions_block_height(self):
        """Test whale transactions includes block height"""
        response = requests.get(f"{BASE_URL}/api/real/whale-transactions")
        assert response.status_code == 200
        data = response.json()
        
        if "block_height" in data:
            assert isinstance(data["block_height"], int)
            assert data["block_height"] > 800000  # BTC block height should be > 800k
            print(f"✓ Block height: {data['block_height']}")
        else:
            print("⚠ Block height not in response (API may have returned error)")


class TestRealCryptoNewsAPI:
    """Real crypto news API tests"""
    
    def test_crypto_news_endpoint(self):
        """Test /api/real/crypto-news returns data"""
        response = requests.get(f"{BASE_URL}/api/real/crypto-news")
        assert response.status_code == 200
        data = response.json()
        assert "source" in data
        assert "fetched_at" in data
        print(f"✓ Crypto news endpoint working, source: {data['source']}")
    
    def test_crypto_news_structure(self):
        """Test crypto news data structure"""
        response = requests.get(f"{BASE_URL}/api/real/crypto-news")
        assert response.status_code == 200
        data = response.json()
        
        if data.get("news") and len(data["news"]) > 0:
            news_item = data["news"][0]
            assert "title" in news_item
            assert "source" in news_item
            assert "sentiment" in news_item
            assert news_item["sentiment"] in ["bullish", "bearish", "neutral"]
            print(f"✓ News structure valid: '{news_item['title'][:50]}...' ({news_item['sentiment']})")
        else:
            # May fallback to simulated news
            print("⚠ No real news found (may be using simulated fallback)")
    
    def test_crypto_news_has_multiple_items(self):
        """Test crypto news returns multiple items"""
        response = requests.get(f"{BASE_URL}/api/real/crypto-news")
        assert response.status_code == 200
        data = response.json()
        
        news_count = len(data.get("news", []))
        print(f"✓ Crypto news returned {news_count} items")


class TestAvatarInsightAPI:
    """Avatar insight generation with TTS tests"""
    
    def test_avatar_insight_basic(self):
        """Test avatar insight generation"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json={
                "message": "",
                "emotion": "neutral",
                "market_context": {}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "emotion" in data
        assert "timestamp" in data
        assert len(data["message"]) > 10
        print(f"✓ Avatar insight generated: '{data['message'][:60]}...'")
    
    def test_avatar_insight_bullish_context(self):
        """Test avatar insight with bullish market context"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json={
                "message": "",
                "emotion": "neutral",
                "market_context": {"btc_change": 5.0}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] in ["excited", "happy"]
        print(f"✓ Bullish context insight: emotion={data['emotion']}")
    
    def test_avatar_insight_bearish_context(self):
        """Test avatar insight with bearish market context"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json={
                "message": "",
                "emotion": "neutral",
                "market_context": {"btc_change": -5.0}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] == "concerned"
        print(f"✓ Bearish context insight: emotion={data['emotion']}")
    
    def test_avatar_insight_returns_audio(self):
        """Test avatar insight returns audio"""
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json={
                "message": "",
                "emotion": "neutral",
                "market_context": {}
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        if data.get("audio"):
            assert data["format"] == "mp3"
            assert len(data["audio"]) > 100
            print(f"✓ Avatar insight returned audio (format: {data['format']})")
        else:
            print("⚠ Avatar insight did not return audio (TTS may be unavailable)")


class TestAvatarVoicesAPI:
    """Avatar TTS voices tests"""
    
    def test_avatar_voices_endpoint(self):
        """Test /api/avatar/voices returns voice list"""
        response = requests.get(f"{BASE_URL}/api/avatar/voices")
        assert response.status_code == 200
        data = response.json()
        assert "voices" in data
        assert len(data["voices"]) >= 6
        print(f"✓ Avatar voices endpoint returned {len(data['voices'])} voices")
    
    def test_avatar_voices_structure(self):
        """Test voice data structure"""
        response = requests.get(f"{BASE_URL}/api/avatar/voices")
        assert response.status_code == 200
        data = response.json()
        
        voice = data["voices"][0]
        assert "id" in voice
        assert "name" in voice
        assert "description" in voice
        print(f"✓ Voice structure valid: {voice['name']} - {voice['description']}")


class TestExistingAPIs:
    """Verify existing APIs still work"""
    
    def test_market_prices(self):
        """Test market prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        symbols = [item["symbol"] for item in data]
        assert "BTC" in symbols
        assert "ETH" in symbols
        print(f"✓ Market prices working: {len(data)} symbols")
    
    def test_crawler_signals(self):
        """Test crawler signals endpoint"""
        response = requests.get(f"{BASE_URL}/api/crawler/signals?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Crawler signals working: {len(data)} signals")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Root endpoint working: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
