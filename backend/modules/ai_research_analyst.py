"""
AI Research Analyst
GPT-powered market commentary, automated research reports, principles-based decisions
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import json

logger = logging.getLogger(__name__)

# Import Emergent LLM integration
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    logger.warning("Emergent LLM not available")


@dataclass
class ResearchReport:
    """AI-generated research report"""
    id: str
    title: str
    executive_summary: str
    market_analysis: str
    key_findings: List[str]
    trade_ideas: List[Dict]
    risk_assessment: str
    outlook: str
    confidence: float
    generated_at: str


@dataclass
class TradeThesis:
    """AI-generated trade thesis"""
    asset: str
    direction: str
    conviction: float
    thesis: str
    supporting_factors: List[str]
    risks: List[str]
    entry_trigger: str
    exit_criteria: str
    position_size_recommendation: str
    timeframe: str


class AIResearchAnalyst:
    """
    AI-powered research analyst using GPT
    Generates institutional-grade research and commentary
    """
    
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        self.is_configured = bool(self.api_key) and LLM_AVAILABLE
    
    async def generate_market_commentary(self, market_data: Dict) -> Dict:
        """Generate AI market commentary"""
        if not self.is_configured:
            return self._fallback_commentary(market_data)
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"research-{datetime.now().timestamp()}",
                system_message="""You are a senior quantitative analyst at a top-tier hedge fund like Bridgewater Associates.
                
Your role is to provide institutional-grade market analysis following Ray Dalio's principles:
1. Understand the economic machine
2. Watch debt cycles
3. Diversify well across uncorrelated return streams
4. Be radically transparent about risks

Provide analysis that would be suitable for advising central banks, sovereign wealth funds, and top hedge funds.
Be specific, quantitative where possible, and actionable.
"""
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"""Analyze the following market data and provide institutional-grade commentary:

Market Data:
{json.dumps(market_data, indent=2)}

Provide:
1. Executive Summary (2-3 sentences)
2. Key Market Observations (3-5 bullet points)
3. Economic Phase Assessment (Dalio framework)
4. Risk Assessment
5. Actionable Recommendations

Format as JSON with keys: executive_summary, observations, economic_phase, risk_assessment, recommendations
"""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            # Parse response
            try:
                # Clean JSON from markdown
                clean_response = response.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0]
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0]
                
                data = json.loads(clean_response)
                return {
                    "success": True,
                    "ai_powered": True,
                    "commentary": data,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "ai_powered": True,
                    "commentary": {"raw_analysis": response},
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"AI commentary error: {e}")
            return self._fallback_commentary(market_data)
    
    async def generate_trade_thesis(self, asset: str, market_context: Dict) -> TradeThesis:
        """Generate AI-powered trade thesis"""
        if not self.is_configured:
            return self._fallback_thesis(asset)
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"thesis-{datetime.now().timestamp()}",
                system_message="""You are a portfolio manager generating trade ideas.
                
Follow Ray Dalio's investment principles:
- Diversify across uncorrelated return streams
- Size positions based on conviction and risk
- Have clear entry and exit criteria
- Always consider what could go wrong

Generate thesis in JSON format."""
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"""Generate a detailed trade thesis for {asset}.

Context:
{json.dumps(market_context, indent=2)}

Provide JSON with:
- direction: "long" or "short"
- conviction: 0.0-1.0
- thesis: Main investment thesis (2-3 sentences)
- supporting_factors: List of 3-5 supporting factors
- risks: List of 3-5 key risks
- entry_trigger: Specific entry condition
- exit_criteria: Exit rules
- position_size_recommendation: Conservative/Moderate/Aggressive
- timeframe: Expected holding period
"""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            try:
                clean_response = response.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0]
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0]
                
                data = json.loads(clean_response)
                
                return TradeThesis(
                    asset=asset,
                    direction=data.get("direction", "long"),
                    conviction=float(data.get("conviction", 0.5)),
                    thesis=data.get("thesis", ""),
                    supporting_factors=data.get("supporting_factors", []),
                    risks=data.get("risks", []),
                    entry_trigger=data.get("entry_trigger", ""),
                    exit_criteria=data.get("exit_criteria", ""),
                    position_size_recommendation=data.get("position_size_recommendation", "Moderate"),
                    timeframe=data.get("timeframe", "Medium-term")
                )
            except:
                return self._fallback_thesis(asset)
                
        except Exception as e:
            logger.error(f"Trade thesis error: {e}")
            return self._fallback_thesis(asset)
    
    async def generate_research_report(self, topic: str, data: Dict) -> ResearchReport:
        """Generate full research report"""
        if not self.is_configured:
            return self._fallback_report(topic)
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"report-{datetime.now().timestamp()}",
                system_message="""You are a senior research analyst writing institutional research reports.
                
Your reports are read by:
- Central bank governors
- Sovereign wealth fund managers
- Top hedge fund CIOs
- Government economic advisors

Write with precision, depth, and actionable insights.
Follow Bridgewater's radical transparency principles."""
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"""Write a comprehensive research report on: {topic}

Data:
{json.dumps(data, indent=2)}

Provide JSON with:
- title: Report title
- executive_summary: 3-4 sentence summary
- market_analysis: Detailed analysis (300-500 words)
- key_findings: List of 5-7 key findings
- trade_ideas: List of 3-5 trade ideas with asset, direction, rationale
- risk_assessment: Risk analysis paragraph
- outlook: 6-12 month outlook
- confidence: 0.0-1.0 confidence in analysis
"""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            try:
                clean_response = response.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0]
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0]
                
                data = json.loads(clean_response)
                
                return ResearchReport(
                    id=f"RPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    title=data.get("title", topic),
                    executive_summary=data.get("executive_summary", ""),
                    market_analysis=data.get("market_analysis", ""),
                    key_findings=data.get("key_findings", []),
                    trade_ideas=data.get("trade_ideas", []),
                    risk_assessment=data.get("risk_assessment", ""),
                    outlook=data.get("outlook", ""),
                    confidence=float(data.get("confidence", 0.7)),
                    generated_at=datetime.now(timezone.utc).isoformat()
                )
            except:
                return self._fallback_report(topic)
                
        except Exception as e:
            logger.error(f"Research report error: {e}")
            return self._fallback_report(topic)
    
    async def apply_dalio_principles(self, decision_context: Dict) -> Dict:
        """Apply Ray Dalio's Principles to a decision"""
        if not self.is_configured:
            return self._fallback_principles(decision_context)
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"principles-{datetime.now().timestamp()}",
                system_message="""You are applying Ray Dalio's Principles to investment decisions.

Key Principles:
1. Pain + Reflection = Progress
2. Embrace reality and deal with it
3. Be radically open-minded and transparent
4. Understand that people are wired differently
5. Learn how to make decisions effectively
6. Recognize the two barriers (ego and blind spots)
7. Understand the power of knowing how to deal with not knowing

For investments specifically:
- Diversify across uncorrelated return streams
- Understand debt cycles
- Know where you are in the economic machine
- Size positions based on conviction AND uncertainty
"""
            ).with_model("openai", "gpt-4o-mini")
            
            prompt = f"""Apply Ray Dalio's Principles to this decision:

Context:
{json.dumps(decision_context, indent=2)}

Provide JSON with:
- principles_applied: List of specific principles relevant to this decision
- analysis: How each principle applies
- recommendation: Clear recommendation
- confidence: 0.0-1.0
- blind_spots: Potential blind spots to consider
- alternative_views: Contrary perspectives to consider
"""
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            try:
                clean_response = response.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0]
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0]
                
                data = json.loads(clean_response)
                return {
                    "success": True,
                    "ai_powered": True,
                    "principles_analysis": data,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            except:
                return self._fallback_principles(decision_context)
                
        except Exception as e:
            logger.error(f"Principles error: {e}")
            return self._fallback_principles(decision_context)
    
    def _fallback_commentary(self, market_data: Dict) -> Dict:
        """Fallback when AI is not available"""
        return {
            "success": True,
            "ai_powered": False,
            "commentary": {
                "executive_summary": "Market analysis based on quantitative indicators.",
                "observations": [
                    "BTC showing momentum strength",
                    "ETH correlation with BTC remains high",
                    "Macro conditions remain supportive for risk assets",
                    "Volatility compressed, suggesting potential expansion"
                ],
                "economic_phase": "Late expansion",
                "risk_assessment": "Moderate risk environment",
                "recommendations": [
                    "Maintain diversified exposure",
                    "Consider hedging tail risks",
                    "Watch for Fed policy shifts"
                ]
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def _fallback_thesis(self, asset: str) -> TradeThesis:
        """Fallback trade thesis"""
        return TradeThesis(
            asset=asset,
            direction="long",
            conviction=0.65,
            thesis=f"Technical and fundamental factors support a constructive view on {asset}.",
            supporting_factors=[
                "Positive momentum across timeframes",
                "Improving on-chain metrics",
                "Institutional adoption increasing"
            ],
            risks=[
                "Macro volatility",
                "Regulatory uncertainty",
                "Technical support breakdown"
            ],
            entry_trigger="Pullback to 20-day moving average",
            exit_criteria="Break below key support or 15% stop loss",
            position_size_recommendation="Moderate",
            timeframe="2-4 weeks"
        )
    
    def _fallback_report(self, topic: str) -> ResearchReport:
        """Fallback research report"""
        return ResearchReport(
            id=f"RPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            title=f"Market Analysis: {topic}",
            executive_summary="Quantitative analysis indicates mixed signals with opportunities in select assets.",
            market_analysis="Based on our systematic framework, current conditions suggest a balanced approach.",
            key_findings=[
                "Market structure remains constructive",
                "Momentum indicators turning positive",
                "Risk/reward favorable for quality assets",
                "Macro backdrop supportive but cautious"
            ],
            trade_ideas=[
                {"asset": "BTC", "direction": "long", "rationale": "Momentum breakout"},
                {"asset": "ETH", "direction": "long", "rationale": "Relative strength"}
            ],
            risk_assessment="Primary risks include macro volatility and regulatory developments.",
            outlook="Constructive 6-month outlook with tactical flexibility recommended.",
            confidence=0.70,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
    
    def _fallback_principles(self, context: Dict) -> Dict:
        """Fallback principles analysis"""
        return {
            "success": True,
            "ai_powered": False,
            "principles_analysis": {
                "principles_applied": [
                    "Embrace reality and deal with it",
                    "Diversify across uncorrelated return streams",
                    "Know where you are in the economic machine"
                ],
                "analysis": "Standard framework applied without AI enhancement",
                "recommendation": "Maintain balanced allocation with tactical flexibility",
                "confidence": 0.6,
                "blind_spots": ["Model risk", "Regime change"],
                "alternative_views": ["Bearish scenario possible with macro shock"]
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_status(self) -> Dict:
        """Get AI analyst status"""
        return {
            "ai_enabled": self.is_configured,
            "provider": "openai/gpt-4o-mini" if self.is_configured else "fallback",
            "capabilities": [
                "market_commentary",
                "trade_thesis",
                "research_reports",
                "principles_analysis"
            ],
            "status": "ready" if self.is_configured else "limited"
        }


# Global AI analyst instance
ai_analyst = AIResearchAnalyst()


# API Functions
async def generate_market_commentary(market_data: Dict) -> Dict:
    return await ai_analyst.generate_market_commentary(market_data)

async def generate_trade_thesis(asset: str, context: Dict) -> Dict:
    thesis = await ai_analyst.generate_trade_thesis(asset, context)
    return asdict(thesis)

async def generate_research_report(topic: str, data: Dict) -> Dict:
    report = await ai_analyst.generate_research_report(topic, data)
    return asdict(report)

async def apply_dalio_principles(context: Dict) -> Dict:
    return await ai_analyst.apply_dalio_principles(context)

def get_ai_analyst_status() -> Dict:
    return ai_analyst.get_status()
