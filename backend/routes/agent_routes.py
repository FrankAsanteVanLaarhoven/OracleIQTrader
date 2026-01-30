# OracleIQTrader - AI Trading Agent Routes
# AI-powered trading agent management and operations

from fastapi import APIRouter, HTTPException

from modules.ai_trading_agents import ai_trading_engine, AgentStatus

agent_router = APIRouter(prefix="/agents", tags=["agents"])


def init_agent_db(db):
    """Initialize the AI trading engine with database"""
    ai_trading_engine.set_db(db)


@agent_router.get("/templates")
async def get_agent_templates():
    """Get all available agent templates"""
    return ai_trading_engine.get_templates()


@agent_router.get("")
async def get_user_agents(user_id: str = "demo_user"):
    """Get all agents for a user"""
    agents = await ai_trading_engine.get_user_agents(user_id)
    return [a.model_dump() for a in agents]


@agent_router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get agent by ID"""
    agent = await ai_trading_engine.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent.model_dump()


@agent_router.post("")
async def create_agent(data: dict):
    """Create a new trading agent"""
    try:
        user_id = data.pop("user_id", "demo_user")
        agent = await ai_trading_engine.create_agent(user_id, data)
        return {"success": True, "agent": agent.model_dump()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@agent_router.post("/from-template")
async def create_agent_from_template(data: dict):
    """Create agent from a template"""
    try:
        user_id = data.get("user_id", "demo_user")
        template_id = data.get("template_id")
        overrides = data.get("overrides", {})
        agent = await ai_trading_engine.create_from_template(user_id, template_id, overrides)
        return {"success": True, "agent": agent.model_dump()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@agent_router.put("/{agent_id}")
async def update_agent(agent_id: str, data: dict):
    """Update agent configuration"""
    agent = await ai_trading_engine.update_agent(agent_id, data)
    if agent:
        return {"success": True, "agent": agent.model_dump()}
    return {"success": False, "error": "Agent not found"}


@agent_router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    success = await ai_trading_engine.delete_agent(agent_id)
    return {"success": success}


@agent_router.post("/{agent_id}/activate")
async def activate_agent(agent_id: str):
    """Activate agent for trading"""
    success = await ai_trading_engine.activate_agent(agent_id)
    return {"success": success, "status": "active" if success else "error"}


@agent_router.post("/{agent_id}/pause")
async def pause_agent(agent_id: str):
    """Pause an agent"""
    success = await ai_trading_engine.pause_agent(agent_id)
    return {"success": success, "status": "paused" if success else "error"}


@agent_router.post("/{agent_id}/analyze")
async def agent_analyze_market(agent_id: str, data: dict):
    """Have agent analyze market data and make a decision"""
    decision = await ai_trading_engine.analyze_market(agent_id, data)
    if decision:
        return {"success": True, "decision": decision.model_dump()}
    return {"success": False, "error": "Agent not active or not found"}


@agent_router.get("/{agent_id}/decisions")
async def get_agent_decisions(agent_id: str, limit: int = 50):
    """Get recent decisions for an agent"""
    decisions = ai_trading_engine.get_agent_decisions(agent_id, limit)
    return [d.model_dump() for d in decisions]


@agent_router.get("/{agent_id}/performance")
async def get_agent_performance(agent_id: str):
    """Get performance metrics for an agent"""
    perf = ai_trading_engine.get_agent_performance(agent_id)
    if perf:
        return perf.model_dump()
    return {"error": "Agent not found"}


@agent_router.post("/{agent_id}/chat")
async def chat_with_agent(agent_id: str, data: dict):
    """Chat with an agent about trading"""
    message = data.get("message", "")
    context = data.get("market_context", {})
    response = ai_trading_engine.chat_with_agent(agent_id, message, context)
    return response
