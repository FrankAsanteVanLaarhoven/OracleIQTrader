"""
Real Social Media Integration Module
Twitter (X) and Reddit APIs for sentiment analysis

Requires API keys in .env:
- TWITTER_BEARER_TOKEN
- REDDIT_CLIENT_ID
- REDDIT_CLIENT_SECRET
"""

import httpx
import asyncio
import logging
import os
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
from collections import Counter

logger = logging.getLogger(__name__)


class SentimentScore(str, Enum):
    VERY_BULLISH = "very_bullish"
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"
    VERY_BEARISH = "very_bearish"


@dataclass
class SocialPost:
    id: str
    platform: str  # 'twitter' or 'reddit'
    text: str
    author: str
    timestamp: datetime
    likes: int
    comments: int
    shares: int
    url: str
    sentiment: SentimentScore
    symbols: List[str]
    hashtags: List[str]


class SentimentAnalyzer:
    """Simple rule-based sentiment analyzer for crypto/trading content"""
    
    BULLISH_WORDS = {
        'bull', 'bullish', 'moon', 'mooning', 'pump', 'buy', 'long', 'hodl',
        'breakout', 'rally', 'surge', 'soar', 'gain', 'profit', 'win',
        'rocket', 'lambo', 'ath', 'support', 'accumulate', 'dip', 'btfd',
        'green', 'up', 'high', 'rise', 'rising', 'boom', 'explosive'
    }
    
    BEARISH_WORDS = {
        'bear', 'bearish', 'dump', 'sell', 'short', 'crash', 'drop',
        'fall', 'falling', 'plunge', 'tank', 'rekt', 'loss', 'fear',
        'fud', 'scam', 'rug', 'rugpull', 'dead', 'resistance', 'reject',
        'red', 'down', 'low', 'decline', 'panic', 'capitulation'
    }
    
    @classmethod
    def analyze(cls, text: str) -> SentimentScore:
        """Analyze sentiment of text"""
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        bullish_count = len(words & cls.BULLISH_WORDS)
        bearish_count = len(words & cls.BEARISH_WORDS)
        
        # Check for negations
        negations = ['not', 'no', "don't", "doesn't", "isn't", "aren't", "won't"]
        has_negation = any(neg in text_lower for neg in negations)
        
        if has_negation:
            bullish_count, bearish_count = bearish_count, bullish_count
        
        diff = bullish_count - bearish_count
        
        if diff >= 3:
            return SentimentScore.VERY_BULLISH
        elif diff >= 1:
            return SentimentScore.BULLISH
        elif diff <= -3:
            return SentimentScore.VERY_BEARISH
        elif diff <= -1:
            return SentimentScore.BEARISH
        else:
            return SentimentScore.NEUTRAL
    
    @classmethod
    def extract_symbols(cls, text: str) -> List[str]:
        """Extract cryptocurrency/stock symbols from text"""
        # Common crypto symbols
        known_symbols = {
            'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX',
            'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'NEAR',
            'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'
        }
        
        # Find $SYMBOL patterns
        cashtags = set(re.findall(r'\$([A-Z]{2,5})\b', text.upper()))
        
        # Find known symbols mentioned
        text_upper = text.upper()
        mentioned = {s for s in known_symbols if s in text_upper}
        
        return list(cashtags | mentioned)
    
    @classmethod
    def extract_hashtags(cls, text: str) -> List[str]:
        """Extract hashtags from text"""
        return re.findall(r'#(\w+)', text)


class TwitterClient:
    """Twitter/X API Client for crypto sentiment"""
    
    BASE_URL = "https://api.twitter.com/2"
    
    def __init__(self, bearer_token: str = None):
        self.bearer_token = bearer_token or os.environ.get("TWITTER_BEARER_TOKEN")
        self.client = httpx.AsyncClient(timeout=30.0)
        self.analyzer = SentimentAnalyzer()
    
    @property
    def is_configured(self) -> bool:
        return bool(self.bearer_token)
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated request to Twitter API"""
        if not self.is_configured:
            raise ValueError("Twitter API not configured")
        
        url = f"{self.BASE_URL}{endpoint}"
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        
        response = await self.client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    async def search_tweets(
        self,
        query: str,
        max_results: int = 100,
        sort_order: str = "relevancy"
    ) -> List[SocialPost]:
        """Search recent tweets"""
        if not self.is_configured:
            return []
        
        try:
            params = {
                "query": f"{query} -is:retweet lang:en",
                "max_results": min(max_results, 100),
                "sort_order": sort_order,
                "tweet.fields": "created_at,public_metrics,author_id",
                "expansions": "author_id",
                "user.fields": "username",
            }
            
            data = await self._make_request("/tweets/search/recent", params)
            
            tweets = data.get("data", [])
            users = {u["id"]: u["username"] for u in data.get("includes", {}).get("users", [])}
            
            posts = []
            for tweet in tweets:
                text = tweet.get("text", "")
                metrics = tweet.get("public_metrics", {})
                
                post = SocialPost(
                    id=tweet["id"],
                    platform="twitter",
                    text=text,
                    author=users.get(tweet.get("author_id"), "unknown"),
                    timestamp=datetime.fromisoformat(tweet["created_at"].replace("Z", "+00:00")),
                    likes=metrics.get("like_count", 0),
                    comments=metrics.get("reply_count", 0),
                    shares=metrics.get("retweet_count", 0),
                    url=f"https://twitter.com/i/status/{tweet['id']}",
                    sentiment=self.analyzer.analyze(text),
                    symbols=self.analyzer.extract_symbols(text),
                    hashtags=self.analyzer.extract_hashtags(text),
                )
                posts.append(post)
            
            return posts
        except Exception as e:
            logger.error(f"Twitter search error: {str(e)}")
            return []
    
    async def get_crypto_sentiment(self, symbol: str = "BTC") -> Dict:
        """Get sentiment analysis for a crypto symbol"""
        posts = await self.search_tweets(f"${symbol} OR #{symbol}", max_results=100)
        
        if not posts:
            return {"error": "No data available"}
        
        sentiment_counts = Counter(p.sentiment for p in posts)
        total = len(posts)
        
        # Calculate weighted score (-2 to +2)
        weights = {
            SentimentScore.VERY_BULLISH: 2,
            SentimentScore.BULLISH: 1,
            SentimentScore.NEUTRAL: 0,
            SentimentScore.BEARISH: -1,
            SentimentScore.VERY_BEARISH: -2,
        }
        
        weighted_sum = sum(weights[s] * c for s, c in sentiment_counts.items())
        score = weighted_sum / total if total > 0 else 0
        
        return {
            "symbol": symbol,
            "platform": "twitter",
            "total_posts": total,
            "sentiment_score": round(score, 2),
            "sentiment_label": self._score_to_label(score),
            "distribution": {s.value: c for s, c in sentiment_counts.items()},
            "sample_posts": [
                {"text": p.text[:200], "sentiment": p.sentiment.value, "likes": p.likes}
                for p in sorted(posts, key=lambda x: x.likes, reverse=True)[:5]
            ],
            "top_hashtags": Counter(h for p in posts for h in p.hashtags).most_common(10),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    def _score_to_label(self, score: float) -> str:
        if score >= 1.0:
            return "very_bullish"
        elif score >= 0.3:
            return "bullish"
        elif score <= -1.0:
            return "very_bearish"
        elif score <= -0.3:
            return "bearish"
        return "neutral"
    
    async def close(self):
        await self.client.aclose()


class RedditClient:
    """Reddit API Client for crypto sentiment"""
    
    AUTH_URL = "https://www.reddit.com/api/v1/access_token"
    BASE_URL = "https://oauth.reddit.com"
    
    def __init__(
        self,
        client_id: str = None,
        client_secret: str = None,
        user_agent: str = None
    ):
        self.client_id = client_id or os.environ.get("REDDIT_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("REDDIT_CLIENT_SECRET")
        self.user_agent = user_agent or os.environ.get("REDDIT_USER_AGENT", "OracleTrading/1.0")
        self.client = httpx.AsyncClient(timeout=30.0)
        self.analyzer = SentimentAnalyzer()
        self.access_token = None
        self.token_expiry = None
    
    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)
    
    async def _get_access_token(self) -> str:
        """Get OAuth access token"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        auth = (self.client_id, self.client_secret)
        headers = {"User-Agent": self.user_agent}
        data = {"grant_type": "client_credentials"}
        
        response = await self.client.post(
            self.AUTH_URL,
            auth=auth,
            headers=headers,
            data=data
        )
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"] - 60)
        
        return self.access_token
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated request to Reddit API"""
        if not self.is_configured:
            raise ValueError("Reddit API not configured")
        
        token = await self._get_access_token()
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": self.user_agent,
        }
        
        response = await self.client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_subreddit_posts(
        self,
        subreddit: str,
        sort: str = "hot",
        limit: int = 50
    ) -> List[SocialPost]:
        """Get posts from a subreddit"""
        if not self.is_configured:
            return []
        
        try:
            data = await self._make_request(
                f"/r/{subreddit}/{sort}",
                {"limit": limit}
            )
            
            posts = []
            for child in data.get("data", {}).get("children", []):
                post_data = child.get("data", {})
                text = f"{post_data.get('title', '')} {post_data.get('selftext', '')}"
                
                post = SocialPost(
                    id=post_data.get("id", ""),
                    platform="reddit",
                    text=text[:500],
                    author=post_data.get("author", "unknown"),
                    timestamp=datetime.fromtimestamp(post_data.get("created_utc", 0), timezone.utc),
                    likes=post_data.get("score", 0),
                    comments=post_data.get("num_comments", 0),
                    shares=0,
                    url=f"https://reddit.com{post_data.get('permalink', '')}",
                    sentiment=self.analyzer.analyze(text),
                    symbols=self.analyzer.extract_symbols(text),
                    hashtags=[],
                )
                posts.append(post)
            
            return posts
        except Exception as e:
            logger.error(f"Reddit fetch error: {str(e)}")
            return []
    
    async def search_posts(self, query: str, limit: int = 50) -> List[SocialPost]:
        """Search Reddit posts"""
        if not self.is_configured:
            return []
        
        try:
            data = await self._make_request(
                "/search",
                {"q": query, "sort": "relevance", "limit": limit, "type": "link"}
            )
            
            posts = []
            for child in data.get("data", {}).get("children", []):
                post_data = child.get("data", {})
                text = f"{post_data.get('title', '')} {post_data.get('selftext', '')}"
                
                post = SocialPost(
                    id=post_data.get("id", ""),
                    platform="reddit",
                    text=text[:500],
                    author=post_data.get("author", "unknown"),
                    timestamp=datetime.fromtimestamp(post_data.get("created_utc", 0), timezone.utc),
                    likes=post_data.get("score", 0),
                    comments=post_data.get("num_comments", 0),
                    shares=0,
                    url=f"https://reddit.com{post_data.get('permalink', '')}",
                    sentiment=self.analyzer.analyze(text),
                    symbols=self.analyzer.extract_symbols(text),
                    hashtags=[],
                )
                posts.append(post)
            
            return posts
        except Exception as e:
            logger.error(f"Reddit search error: {str(e)}")
            return []
    
    async def get_crypto_sentiment(self, symbol: str = "BTC") -> Dict:
        """Get sentiment from crypto subreddits"""
        subreddits = ["cryptocurrency", "bitcoin", "ethtrader", "CryptoMarkets"]
        all_posts = []
        
        for sub in subreddits:
            posts = await self.get_subreddit_posts(sub, limit=25)
            # Filter posts mentioning the symbol
            relevant = [p for p in posts if symbol.upper() in p.text.upper()]
            all_posts.extend(relevant)
        
        if not all_posts:
            # Try direct search
            all_posts = await self.search_posts(symbol, limit=50)
        
        if not all_posts:
            return {"error": "No data available"}
        
        sentiment_counts = Counter(p.sentiment for p in all_posts)
        total = len(all_posts)
        
        weights = {
            SentimentScore.VERY_BULLISH: 2,
            SentimentScore.BULLISH: 1,
            SentimentScore.NEUTRAL: 0,
            SentimentScore.BEARISH: -1,
            SentimentScore.VERY_BEARISH: -2,
        }
        
        weighted_sum = sum(weights[s] * c for s, c in sentiment_counts.items())
        score = weighted_sum / total if total > 0 else 0
        
        return {
            "symbol": symbol,
            "platform": "reddit",
            "total_posts": total,
            "sentiment_score": round(score, 2),
            "sentiment_label": self._score_to_label(score),
            "distribution": {s.value: c for s, c in sentiment_counts.items()},
            "sample_posts": [
                {"text": p.text[:200], "sentiment": p.sentiment.value, "score": p.likes}
                for p in sorted(all_posts, key=lambda x: x.likes, reverse=True)[:5]
            ],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    def _score_to_label(self, score: float) -> str:
        if score >= 1.0:
            return "very_bullish"
        elif score >= 0.3:
            return "bullish"
        elif score <= -1.0:
            return "very_bearish"
        elif score <= -0.3:
            return "bearish"
        return "neutral"
    
    async def close(self):
        await self.client.aclose()


# ============ COMBINED SOCIAL SENTIMENT ============

class SocialSentimentAggregator:
    """Aggregates sentiment from multiple social platforms"""
    
    def __init__(self):
        self.twitter = TwitterClient()
        self.reddit = RedditClient()
    
    async def get_combined_sentiment(self, symbol: str) -> Dict:
        """Get combined sentiment from all platforms"""
        results = await asyncio.gather(
            self.twitter.get_crypto_sentiment(symbol) if self.twitter.is_configured else asyncio.sleep(0),
            self.reddit.get_crypto_sentiment(symbol) if self.reddit.is_configured else asyncio.sleep(0),
            return_exceptions=True
        )
        
        twitter_data = results[0] if isinstance(results[0], dict) else None
        reddit_data = results[1] if isinstance(results[1], dict) else None
        
        # Calculate combined score
        scores = []
        weights = []
        
        if twitter_data and "sentiment_score" in twitter_data:
            scores.append(twitter_data["sentiment_score"])
            weights.append(twitter_data.get("total_posts", 1))
        
        if reddit_data and "sentiment_score" in reddit_data:
            scores.append(reddit_data["sentiment_score"])
            weights.append(reddit_data.get("total_posts", 1))
        
        if not scores:
            return {
                "symbol": symbol,
                "error": "No social data available",
                "twitter_configured": self.twitter.is_configured,
                "reddit_configured": self.reddit.is_configured,
            }
        
        # Weighted average
        combined_score = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
        
        return {
            "symbol": symbol,
            "combined_score": round(combined_score, 2),
            "combined_label": self._score_to_label(combined_score),
            "twitter": twitter_data if twitter_data else {"configured": False},
            "reddit": reddit_data if reddit_data else {"configured": False},
            "total_posts": sum(
                d.get("total_posts", 0) for d in [twitter_data, reddit_data] if d
            ),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    def _score_to_label(self, score: float) -> str:
        if score >= 1.0:
            return "very_bullish"
        elif score >= 0.3:
            return "bullish"
        elif score <= -1.0:
            return "very_bearish"
        elif score <= -0.3:
            return "bearish"
        return "neutral"
    
    async def close(self):
        await self.twitter.close()
        await self.reddit.close()


# Factory function
def get_social_aggregator() -> SocialSentimentAggregator:
    return SocialSentimentAggregator()


# FastAPI integration
async def get_social_sentiment(symbol: str) -> Dict:
    """Get social sentiment for API endpoint"""
    aggregator = get_social_aggregator()
    try:
        return await aggregator.get_combined_sentiment(symbol)
    finally:
        await aggregator.close()


async def get_social_status() -> Dict:
    """Get social media integration status"""
    return {
        "twitter": {
            "configured": bool(os.environ.get("TWITTER_BEARER_TOKEN")),
        },
        "reddit": {
            "configured": bool(os.environ.get("REDDIT_CLIENT_ID") and os.environ.get("REDDIT_CLIENT_SECRET")),
        },
    }
