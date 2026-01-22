"""
AI-Powered Sentiment Analysis Module
Uses Emergent LLM Key with GPT-4o-mini for intelligent sentiment analysis
"""

import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Import emergent integrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False
    logger.warning("emergentintegrations not available, using fallback sentiment")


@dataclass
class SentimentResult:
    """Result of AI sentiment analysis"""
    text: str
    sentiment: str  # bullish, bearish, neutral
    confidence: float  # 0-1
    reasoning: str
    key_points: List[str]
    trading_signal: str  # buy, sell, hold


class AISentimentAnalyzer:
    """AI-powered sentiment analyzer using LLM"""
    
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        self.is_configured = bool(self.api_key) and EMERGENT_AVAILABLE
        
    async def analyze_text(self, text: str, symbol: str = "BTC") -> SentimentResult:
        """Analyze a single text for sentiment"""
        if not self.is_configured:
            return self._fallback_analysis(text)
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"sentiment-{datetime.now().timestamp()}",
                system_message="""You are an expert financial sentiment analyzer specializing in cryptocurrency and stock markets.
                
Analyze the given text and provide:
1. Overall sentiment (bullish/bearish/neutral)
2. Confidence score (0.0-1.0)
3. Brief reasoning (1-2 sentences)
4. Key points mentioned
5. Trading signal recommendation (buy/sell/hold)

Respond in this exact JSON format:
{
    "sentiment": "bullish|bearish|neutral",
    "confidence": 0.85,
    "reasoning": "Brief explanation",
    "key_points": ["point1", "point2"],
    "trading_signal": "buy|sell|hold"
}"""
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(
                text=f"Analyze this text about {symbol}:\n\n{text[:1000]}"
            )
            
            response = await chat.send_message(user_message)
            
            # Parse JSON response
            import json
            try:
                # Clean response - extract JSON if wrapped in markdown
                clean_response = response.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0]
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0]
                
                data = json.loads(clean_response)
                return SentimentResult(
                    text=text[:200],
                    sentiment=data.get("sentiment", "neutral"),
                    confidence=float(data.get("confidence", 0.5)),
                    reasoning=data.get("reasoning", ""),
                    key_points=data.get("key_points", []),
                    trading_signal=data.get("trading_signal", "hold")
                )
            except json.JSONDecodeError:
                # If JSON parsing fails, extract sentiment from text
                response_lower = response.lower()
                if "bullish" in response_lower:
                    sentiment = "bullish"
                elif "bearish" in response_lower:
                    sentiment = "bearish"
                else:
                    sentiment = "neutral"
                    
                return SentimentResult(
                    text=text[:200],
                    sentiment=sentiment,
                    confidence=0.6,
                    reasoning=response[:200],
                    key_points=[],
                    trading_signal="hold"
                )
                
        except Exception as e:
            logger.error(f"AI sentiment analysis error: {str(e)}")
            return self._fallback_analysis(text)
    
    async def analyze_batch(self, texts: List[str], symbol: str = "BTC") -> Dict:
        """Analyze multiple texts and aggregate sentiment"""
        if not texts:
            return {
                "symbol": symbol,
                "error": "No texts provided",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        # Analyze texts (limit to 10 for performance)
        sample_texts = texts[:10]
        results = []
        
        for text in sample_texts:
            result = await self.analyze_text(text, symbol)
            results.append(result)
            await asyncio.sleep(0.1)  # Rate limiting
        
        # Aggregate results
        sentiment_counts = {"bullish": 0, "bearish": 0, "neutral": 0}
        total_confidence = 0
        signal_counts = {"buy": 0, "sell": 0, "hold": 0}
        all_key_points = []
        
        for r in results:
            sentiment_counts[r.sentiment] += 1
            total_confidence += r.confidence
            signal_counts[r.trading_signal] += 1
            all_key_points.extend(r.key_points)
        
        total = len(results)
        
        # Calculate weighted sentiment score (-1 to +1)
        sentiment_score = (
            (sentiment_counts["bullish"] - sentiment_counts["bearish"]) / total
        ) if total > 0 else 0
        
        # Determine overall sentiment
        if sentiment_score > 0.3:
            overall_sentiment = "bullish"
        elif sentiment_score < -0.3:
            overall_sentiment = "bearish"
        else:
            overall_sentiment = "neutral"
        
        # Determine recommended signal
        max_signal = max(signal_counts, key=signal_counts.get)
        
        return {
            "symbol": symbol,
            "ai_powered": True,
            "total_analyzed": total,
            "sentiment_score": round(sentiment_score, 2),
            "overall_sentiment": overall_sentiment,
            "avg_confidence": round(total_confidence / total, 2) if total > 0 else 0,
            "distribution": sentiment_counts,
            "recommended_signal": max_signal,
            "signal_distribution": signal_counts,
            "key_themes": list(set(all_key_points))[:10],
            "sample_analyses": [
                {
                    "text": r.text[:100] + "...",
                    "sentiment": r.sentiment,
                    "confidence": r.confidence,
                    "reasoning": r.reasoning
                }
                for r in results[:3]
            ],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def _fallback_analysis(self, text: str) -> SentimentResult:
        """Fallback rule-based analysis when AI is not available"""
        text_lower = text.lower()
        
        bullish_words = {'bull', 'bullish', 'moon', 'pump', 'buy', 'long', 'breakout', 'rally', 'surge', 'rocket', 'ath'}
        bearish_words = {'bear', 'bearish', 'dump', 'sell', 'short', 'crash', 'drop', 'tank', 'rekt', 'fear'}
        
        bullish_count = sum(1 for w in bullish_words if w in text_lower)
        bearish_count = sum(1 for w in bearish_words if w in text_lower)
        
        if bullish_count > bearish_count:
            sentiment = "bullish"
            signal = "buy"
            confidence = min(0.5 + (bullish_count * 0.1), 0.85)
        elif bearish_count > bullish_count:
            sentiment = "bearish"
            signal = "sell"
            confidence = min(0.5 + (bearish_count * 0.1), 0.85)
        else:
            sentiment = "neutral"
            signal = "hold"
            confidence = 0.5
        
        return SentimentResult(
            text=text[:200],
            sentiment=sentiment,
            confidence=confidence,
            reasoning="Rule-based analysis (AI unavailable)",
            key_points=[],
            trading_signal=signal
        )


# Global instance
ai_analyzer = AISentimentAnalyzer()


async def analyze_social_sentiment(texts: List[str], symbol: str = "BTC") -> Dict:
    """Main function to analyze social media sentiment"""
    return await ai_analyzer.analyze_batch(texts, symbol)


async def get_ai_sentiment_status() -> Dict:
    """Get AI sentiment analyzer status"""
    return {
        "ai_powered": ai_analyzer.is_configured,
        "provider": "openai/gpt-4o-mini" if ai_analyzer.is_configured else "rule-based",
        "emergent_key_configured": bool(os.environ.get("EMERGENT_LLM_KEY")),
        "status": "ready" if ai_analyzer.is_configured else "fallback_mode"
    }
