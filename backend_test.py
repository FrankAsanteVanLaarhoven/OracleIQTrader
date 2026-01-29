#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class CognitiveOracleAPITester:
    def __init__(self, base_url="https://oracleiq-trader.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict[str, Any] = None) -> tuple[bool, Dict[str, Any]]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {"raw_response": response.text[:200]}
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "name": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - {name}")
            print(f"   Error: {str(e)}")
            self.failed_tests.append({
                "name": name,
                "error": str(e)
            })
            return False, {}

    def test_platform_info(self):
        """Test basic platform info endpoint"""
        return self.run_test(
            "Platform Info",
            "GET",
            "",
            200
        )

    def test_market_prices(self):
        """Test market prices endpoint"""
        return self.run_test(
            "Market Prices",
            "GET", 
            "market/prices",
            200
        )

    def test_individual_market_data(self):
        """Test individual market data endpoints"""
        symbols = ["BTC", "ETH", "SPY", "AAPL"]
        results = []
        
        for symbol in symbols:
            success, data = self.run_test(
                f"Market Data - {symbol}",
                "GET",
                f"market/{symbol}",
                200
            )
            results.append((symbol, success, data))
        
        return results

    def test_price_history(self):
        """Test price history endpoints"""
        symbols = ["BTC", "ETH"]
        results = []
        
        for symbol in symbols:
            success, data = self.run_test(
                f"Price History - {symbol}",
                "GET",
                f"market/{symbol}/history?periods=20",
                200
            )
            results.append((symbol, success, data))
        
        return results

    def test_agent_consensus(self):
        """Test multi-agent consensus system"""
        consensus_request = {
            "action": "BUY",
            "symbol": "AAPL", 
            "quantity": 1000,
            "current_price": 248.50,
            "market_context": "Testing agent consensus system"
        }
        
        return self.run_test(
            "Agent Consensus",
            "POST",
            "agents/consensus",
            200,
            consensus_request
        )

    def test_oracle_memory(self):
        """Test Oracle memory system"""
        oracle_query = {
            "query_type": "similar_trades",
            "symbol": "AAPL",
            "action": "BUY",
            "context": "Testing oracle memory system"
        }
        
        return self.run_test(
            "Oracle Memory Query",
            "POST",
            "oracle/query",
            200,
            oracle_query
        )

    def test_voice_parsing(self):
        """Test voice command parsing"""
        voice_command = {
            "transcript": "Buy 1000 shares of AAPL at market price",
            "confidence": 0.92
        }
        
        return self.run_test(
            "Voice Command Parsing",
            "POST",
            "voice/parse",
            200,
            voice_command
        )

    def test_trade_execution(self):
        """Test trade execution"""
        return self.run_test(
            "Trade Execution",
            "POST",
            "trades/execute?action=BUY&symbol=AAPL&quantity=100",
            200
        )

    def test_mood_analysis(self):
        """Test mood analysis endpoint"""
        return self.run_test(
            "Mood Analysis",
            "GET",
            "user/mood",
            200
        )

    def test_gesture_detection(self):
        """Test gesture detection endpoint"""
        return self.run_test(
            "Gesture Detection",
            "GET",
            "gestures/detected",
            200
        )

    def test_portfolio_summary(self):
        """Test portfolio summary endpoint"""
        return self.run_test(
            "Portfolio Summary",
            "GET",
            "portfolio/summary",
            200
        )

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Cognitive Oracle Trading Platform API Tests")
        print("=" * 60)
        
        # Basic platform tests
        print("\n📊 BASIC PLATFORM TESTS")
        self.test_platform_info()
        
        # Market data tests
        print("\n📈 MARKET DATA TESTS")
        self.test_market_prices()
        self.test_individual_market_data()
        self.test_price_history()
        
        # AI Agent tests
        print("\n🤖 AI AGENT TESTS")
        self.test_agent_consensus()
        self.test_oracle_memory()
        
        # Voice & Gesture tests
        print("\n🎤 VOICE & GESTURE TESTS")
        self.test_voice_parsing()
        self.test_mood_analysis()
        self.test_gesture_detection()
        
        # Trading tests
        print("\n💰 TRADING TESTS")
        self.test_trade_execution()
        self.test_portfolio_summary()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {len(self.failed_tests)}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                error_msg = test.get('error', f'Status {test.get("actual", "unknown")}')
                print(f"   - {test['name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CognitiveOracleAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())