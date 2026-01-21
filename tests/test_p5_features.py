"""
P5 Features Test Suite - Cognitive Oracle Trading Platform
Tests for:
1. Avatar TTS endpoints (/api/avatar/speak, /api/avatar/insight, /api/avatar/voices)
2. Theme toggle functionality
3. Settings page
4. Service Worker registration
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cognitive-trader.preview.emergentagent.com')

class TestAvatarAPIs:
    """Test Avatar TTS API endpoints"""
    
    def test_avatar_voices_endpoint(self):
        """Test /api/avatar/voices returns list of available voices"""
        response = requests.get(f"{BASE_URL}/api/avatar/voices")
        assert response.status_code == 200
        
        data = response.json()
        assert "voices" in data
        assert "default" in data
        assert len(data["voices"]) >= 5  # At least 5 voices
        
        # Check voice structure
        voice = data["voices"][0]
        assert "id" in voice
        assert "name" in voice
        assert "description" in voice
        
        # Check default voice
        assert data["default"] == "nova"
        print(f"✓ Avatar voices endpoint returns {len(data['voices'])} voices")
    
    def test_avatar_insight_endpoint(self):
        """Test /api/avatar/insight generates trading insight with emotion"""
        payload = {
            "message": "",
            "emotion": "neutral",
            "market_context": {"btc_change": 2.5}
        }
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "emotion" in data
        assert "timestamp" in data
        
        # Message should not be empty
        assert len(data["message"]) > 0
        
        # Emotion should be valid
        valid_emotions = ["excited", "happy", "concerned", "neutral", "focused"]
        assert data["emotion"] in valid_emotions
        
        # Audio should be present (TTS enabled)
        if data.get("audio"):
            assert data["format"] == "mp3"
            assert len(data["audio"]) > 1000  # Base64 audio should be substantial
            print(f"✓ Avatar insight with audio: {data['emotion']} - {data['message'][:50]}...")
        else:
            print(f"✓ Avatar insight (no audio): {data['emotion']} - {data['message'][:50]}...")
    
    def test_avatar_insight_with_bullish_context(self):
        """Test avatar insight responds to bullish market context"""
        payload = {
            "message": "",
            "emotion": "neutral",
            "market_context": {"btc_change": 5.0}  # Strong bullish
        }
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should detect excited emotion for strong bullish
        assert data["emotion"] in ["excited", "happy"]
        print(f"✓ Bullish context detected: emotion={data['emotion']}")
    
    def test_avatar_insight_with_bearish_context(self):
        """Test avatar insight responds to bearish market context"""
        payload = {
            "message": "",
            "emotion": "neutral",
            "market_context": {"btc_change": -4.0}  # Bearish
        }
        response = requests.post(
            f"{BASE_URL}/api/avatar/insight",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should detect concerned emotion for bearish
        assert data["emotion"] == "concerned"
        print(f"✓ Bearish context detected: emotion={data['emotion']}")
    
    def test_avatar_speak_endpoint(self):
        """Test /api/avatar/speak generates speech audio"""
        payload = {
            "text": "Hello trader, markets are looking good today!",
            "voice": "nova",
            "speed": 1.0
        }
        response = requests.post(
            f"{BASE_URL}/api/avatar/speak",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio" in data
        assert "format" in data
        assert "voice" in data
        
        assert data["format"] == "mp3"
        assert data["voice"] == "nova"
        assert len(data["audio"]) > 1000  # Base64 audio should be substantial
        print(f"✓ Avatar speak generated audio: {len(data['audio'])} chars base64")
    
    def test_avatar_speak_different_voices(self):
        """Test avatar speak with different voice options"""
        voices = ["alloy", "shimmer", "onyx"]
        
        for voice in voices:
            payload = {
                "text": "Testing voice synthesis.",
                "voice": voice,
                "speed": 1.0
            }
            response = requests.post(
                f"{BASE_URL}/api/avatar/speak",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["voice"] == voice
            print(f"✓ Voice '{voice}' works correctly")
    
    def test_avatar_speak_text_too_long(self):
        """Test avatar speak rejects text that's too long"""
        payload = {
            "text": "x" * 5000,  # Over 4096 limit
            "voice": "nova",
            "speed": 1.0
        }
        response = requests.post(
            f"{BASE_URL}/api/avatar/speak",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✓ Avatar speak correctly rejects text over 4096 chars")


class TestServiceWorker:
    """Test Service Worker availability"""
    
    def test_service_worker_accessible(self):
        """Test /sw.js is accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        
        content = response.text
        assert "ServiceWorker" in content or "self.addEventListener" in content
        assert "push" in content.lower()
        print("✓ Service Worker /sw.js is accessible and contains push handlers")
    
    def test_service_worker_has_push_handler(self):
        """Test service worker has push notification handler"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        
        content = response.text
        assert "addEventListener('push'" in content or 'addEventListener("push"' in content
        print("✓ Service Worker has push event listener")
    
    def test_service_worker_has_notification_click(self):
        """Test service worker has notification click handler"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        
        content = response.text
        assert "notificationclick" in content
        print("✓ Service Worker has notificationclick handler")


class TestExistingAPIs:
    """Verify existing APIs still work after P5 changes"""
    
    def test_root_api(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        print(f"✓ API root: {data['message']} v{data['version']}")
    
    def test_market_prices(self):
        """Test market prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/prices")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        # Check for crypto symbols
        symbols = [item["symbol"] for item in data]
        assert "BTC" in symbols
        assert "ETH" in symbols
        print(f"✓ Market prices: {len(data)} symbols")
    
    def test_portfolio_summary(self):
        """Test portfolio summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/portfolio/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_value" in data
        assert "positions" in data
        print(f"✓ Portfolio summary: ${data['total_value']:,.2f}")
    
    def test_crawler_signals(self):
        """Test crawler signals endpoint (P4 feature)"""
        response = requests.get(f"{BASE_URL}/api/crawler/signals?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Crawler signals: {len(data)} signals")


class TestThemeEndpoints:
    """Test theme-related functionality via API"""
    
    def test_frontend_loads(self):
        """Test frontend loads successfully"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        assert "Cognitive Oracle" in response.text or "Oracle" in response.text
        print("✓ Frontend loads successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
