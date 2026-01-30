"""
AI Trading Agent Builder - Backend API Tests
Tests for: GET /api/agents/templates, POST /api/agents, POST /api/agents/from-template,
GET /api/agents, POST /api/agents/{id}/activate, POST /api/agents/{id}/pause,
DELETE /api/agents/{id}, POST /api/agents/{id}/analyze, POST /api/agents/{id}/chat
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAgentTemplates:
    """Test GET /api/agents/templates - returns 6 agent templates"""
    
    def test_get_templates_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/agents/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_templates_returns_6_templates(self):
        response = requests.get(f"{BASE_URL}/api/agents/templates")
        data = response.json()
        assert len(data) == 6, f"Expected 6 templates, got {len(data)}"
    
    def test_templates_have_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/agents/templates")
        data = response.json()
        required_fields = ['name', 'description', 'avatar_emoji', 'strategy', 'custom_prompt', 
                          'risk_tolerance', 'position_size_pct', 'stop_loss_pct', 'take_profit_pct']
        for template_id, template in data.items():
            for field in required_fields:
                assert field in template, f"Template {template_id} missing field: {field}"
    
    def test_templates_include_expected_strategies(self):
        response = requests.get(f"{BASE_URL}/api/agents/templates")
        data = response.json()
        expected_templates = ['momentum_hunter', 'mean_reversion_bot', 'trend_surfer', 
                             'contrarian_alpha', 'news_sentinel', 'quant_analyzer']
        for template_id in expected_templates:
            assert template_id in data, f"Missing template: {template_id}"


class TestCreateAgent:
    """Test POST /api/agents - create custom agent"""
    
    def test_create_agent_returns_success(self):
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_Agent_{uuid.uuid4().hex[:6]}",
            "description": "Test agent for automated testing",
            "strategy": "momentum",
            "risk_tolerance": 50,
            "position_size_pct": 10,
            "stop_loss_pct": 5,
            "take_profit_pct": 15,
            "entry_confidence_threshold": 70
        }
        response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
    
    def test_create_agent_returns_agent_data(self):
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_Agent_{uuid.uuid4().hex[:6]}",
            "description": "Test agent",
            "strategy": "mean_reversion",
            "risk_tolerance": 40
        }
        response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        data = response.json()
        assert "agent" in data, "Response should contain 'agent' field"
        agent = data["agent"]
        assert "agent_id" in agent, "Agent should have agent_id"
        assert agent["name"] == payload["name"], "Agent name should match"
        assert agent["strategy"] == payload["strategy"], "Agent strategy should match"


class TestCreateFromTemplate:
    """Test POST /api/agents/from-template - create agent from template"""
    
    def test_create_from_template_momentum_hunter(self):
        payload = {
            "user_id": "demo_user",
            "template_id": "momentum_hunter"
        }
        response = requests.post(f"{BASE_URL}/api/agents/from-template", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        assert "agent" in data
        assert data["agent"]["name"] == "Momentum Hunter"
    
    def test_create_from_template_mean_reversion(self):
        payload = {
            "user_id": "demo_user",
            "template_id": "mean_reversion_bot"
        }
        response = requests.post(f"{BASE_URL}/api/agents/from-template", json=payload)
        data = response.json()
        assert data.get("success") == True
        assert data["agent"]["strategy"] == "mean_reversion"
    
    def test_create_from_invalid_template_fails(self):
        payload = {
            "user_id": "demo_user",
            "template_id": "invalid_template_xyz"
        }
        response = requests.post(f"{BASE_URL}/api/agents/from-template", json=payload)
        # Should return error for invalid template
        assert response.status_code in [400, 500], f"Expected error status, got {response.status_code}"


class TestGetUserAgents:
    """Test GET /api/agents?user_id=demo_user - list user's agents"""
    
    def test_get_user_agents_returns_list(self):
        response = requests.get(f"{BASE_URL}/api/agents?user_id=demo_user")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_created_agent_appears_in_list(self):
        # Create an agent first
        unique_name = f"TEST_ListCheck_{uuid.uuid4().hex[:6]}"
        create_payload = {
            "user_id": "demo_user",
            "name": unique_name,
            "description": "Test for list verification",
            "strategy": "contrarian"
        }
        create_response = requests.post(f"{BASE_URL}/api/agents", json=create_payload)
        assert create_response.status_code == 200
        
        # Verify it appears in list
        list_response = requests.get(f"{BASE_URL}/api/agents?user_id=demo_user")
        agents = list_response.json()
        agent_names = [a["name"] for a in agents]
        assert unique_name in agent_names, f"Created agent {unique_name} not found in list"


class TestAgentActivateAndPause:
    """Test POST /api/agents/{id}/activate and /pause"""
    
    @pytest.fixture
    def test_agent(self):
        """Create a test agent for activation tests"""
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_ActivateTest_{uuid.uuid4().hex[:6]}",
            "description": "Agent for activate/pause testing",
            "strategy": "momentum"
        }
        response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        data = response.json()
        return data["agent"]
    
    def test_activate_agent(self, test_agent):
        agent_id = test_agent["agent_id"]
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/activate")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("status") == "active"
    
    def test_pause_agent(self, test_agent):
        agent_id = test_agent["agent_id"]
        # First activate
        requests.post(f"{BASE_URL}/api/agents/{agent_id}/activate")
        # Then pause
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/pause")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("status") == "paused"
    
    def test_activate_invalid_agent_fails(self):
        response = requests.post(f"{BASE_URL}/api/agents/INVALID-AGENT-ID/activate")
        assert response.status_code in [404, 400, 500]


class TestDeleteAgent:
    """Test DELETE /api/agents/{id}"""
    
    def test_delete_agent(self):
        # Create agent to delete
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "description": "Agent to be deleted",
            "strategy": "trend_following"
        }
        create_response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        agent_id = create_response.json()["agent"]["agent_id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/agents/{agent_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
    
    def test_deleted_agent_not_in_list(self):
        # Create agent
        unique_name = f"TEST_DeleteVerify_{uuid.uuid4().hex[:6]}"
        payload = {
            "user_id": "demo_user",
            "name": unique_name,
            "description": "Agent to verify deletion",
            "strategy": "momentum"
        }
        create_response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        agent_id = create_response.json()["agent"]["agent_id"]
        
        # Delete it
        requests.delete(f"{BASE_URL}/api/agents/{agent_id}")
        
        # Verify not in list
        list_response = requests.get(f"{BASE_URL}/api/agents?user_id=demo_user")
        agents = list_response.json()
        agent_ids = [a["agent_id"] for a in agents]
        assert agent_id not in agent_ids, "Deleted agent should not appear in list"


class TestAgentAnalyze:
    """Test POST /api/agents/{id}/analyze - analyze market with agent"""
    
    @pytest.fixture
    def active_agent(self):
        """Create and activate an agent for analysis"""
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_Analyzer_{uuid.uuid4().hex[:6]}",
            "description": "Agent for market analysis",
            "strategy": "momentum",
            "entry_confidence_threshold": 60
        }
        response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        agent = response.json()["agent"]
        # Activate it
        requests.post(f"{BASE_URL}/api/agents/{agent['agent_id']}/activate")
        return agent
    
    def test_analyze_market_returns_decision(self, active_agent):
        agent_id = active_agent["agent_id"]
        market_data = {
            "symbol": "BTC",
            "price": 45000,
            "change_percent": 5.5,
            "volume": 1000000,
            "rsi": 65
        }
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/analyze", json=market_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "decision" in data
    
    def test_analyze_decision_has_required_fields(self, active_agent):
        agent_id = active_agent["agent_id"]
        market_data = {
            "symbol": "ETH",
            "price": 3000,
            "change_percent": -2.0,
            "volume": 500000,
            "rsi": 35
        }
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/analyze", json=market_data)
        data = response.json()
        if data.get("decision"):
            decision = data["decision"]
            required_fields = ["decision_id", "agent_id", "asset", "action", "confidence", "reasoning"]
            for field in required_fields:
                assert field in decision, f"Decision missing field: {field}"


class TestAgentChat:
    """Test POST /api/agents/{id}/chat - chat with agent"""
    
    @pytest.fixture
    def chat_agent(self):
        """Create an agent for chat testing"""
        payload = {
            "user_id": "demo_user",
            "name": f"TEST_ChatBot_{uuid.uuid4().hex[:6]}",
            "description": "Agent for chat testing",
            "strategy": "contrarian"
        }
        response = requests.post(f"{BASE_URL}/api/agents", json=payload)
        return response.json()["agent"]
    
    def test_chat_returns_response(self, chat_agent):
        agent_id = chat_agent["agent_id"]
        payload = {"message": "What is your trading strategy?"}
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data, "Chat should return a response"
        assert len(data["response"]) > 0, "Response should not be empty"
    
    def test_chat_includes_agent_info(self, chat_agent):
        agent_id = chat_agent["agent_id"]
        payload = {"message": "Tell me about yourself"}
        response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/chat", json=payload)
        data = response.json()
        assert "agent_id" in data
        assert "agent_name" in data
        assert "avatar" in data
    
    def test_chat_with_invalid_agent_fails(self):
        payload = {"message": "Hello"}
        response = requests.post(f"{BASE_URL}/api/agents/INVALID-ID/chat", json=payload)
        # Should return error
        data = response.json()
        assert "error" in data or response.status_code in [404, 400, 500]


class TestAgentIntegration:
    """Integration tests for full agent workflow"""
    
    def test_full_agent_lifecycle(self):
        """Test: Create -> Activate -> Analyze -> Chat -> Pause -> Delete"""
        # 1. Create agent
        create_payload = {
            "user_id": "demo_user",
            "name": f"TEST_Lifecycle_{uuid.uuid4().hex[:6]}",
            "description": "Full lifecycle test agent",
            "strategy": "technical_analysis",
            "risk_tolerance": 45,
            "position_size_pct": 15
        }
        create_response = requests.post(f"{BASE_URL}/api/agents", json=create_payload)
        assert create_response.status_code == 200
        agent = create_response.json()["agent"]
        agent_id = agent["agent_id"]
        print(f"✓ Created agent: {agent_id}")
        
        # 2. Activate agent
        activate_response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/activate")
        assert activate_response.status_code == 200
        assert activate_response.json()["status"] == "active"
        print(f"✓ Activated agent")
        
        # 3. Analyze market
        analyze_response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/analyze", json={
            "symbol": "SOL",
            "price": 100,
            "change_percent": 3.0,
            "rsi": 55
        })
        assert analyze_response.status_code == 200
        print(f"✓ Analyzed market")
        
        # 4. Chat with agent
        chat_response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/chat", json={
            "message": "What do you think about the current market?"
        })
        assert chat_response.status_code == 200
        assert "response" in chat_response.json()
        print(f"✓ Chatted with agent")
        
        # 5. Pause agent
        pause_response = requests.post(f"{BASE_URL}/api/agents/{agent_id}/pause")
        assert pause_response.status_code == 200
        assert pause_response.json()["status"] == "paused"
        print(f"✓ Paused agent")
        
        # 6. Delete agent
        delete_response = requests.delete(f"{BASE_URL}/api/agents/{agent_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted agent")
        
        print("✓ Full lifecycle test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
