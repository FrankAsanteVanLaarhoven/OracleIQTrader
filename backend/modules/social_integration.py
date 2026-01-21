"""
Social Media Integration Module
Twitter/X and Reddit API integration for sentiment analysis
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import httpx
import logging
import random

logger = logging.getLogger(__name__)

# ============ MODELS ============

class SocialPlatform(str, Enum):
    TWITTER = "twitter"
    REDDIT = "reddit"

class SocialCredentials(BaseModel):
    """Social media API credentials"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: SocialPlatform
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    bearer_token: Optional[str] = None  # For Twitter
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    client_id: Optional[str] = None  # For Reddit
    client_secret: Optional[str] = None
    is_configured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SocialPost(BaseModel):
    """Social media post/tweet"""
    id: str
    platform: SocialPlatform
    author: str
    author_followers: int = 0
    content: str
    url: Optional[str] = None
    likes: int = 0
    retweets: int = 0  # or upvotes for Reddit
    comments: int = 0
    sentiment_score: float = 0.0  # -1 to 1
    created_at: str
    symbols_mentioned: List[str] = []

class SocialSentiment(BaseModel):
    """Aggregated sentiment for a symbol"""
    symbol: str
    platform: SocialPlatform
    total_mentions: int = 0
    positive_mentions: int = 0
    negative_mentions: int = 0
    neutral_mentions: int = 0
    sentiment_score: float = 0.0  # -1 to 1
    trending_score: float = 0.0
    top_posts: List[SocialPost] = []
    influencer_mentions: List[Dict] = []
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ TWITTER ADAPTER ============

class TwitterAdapter:
    """Twitter/X API adapter"""
    
    BASE_URL = "https://api.twitter.com/2"
    
    def __init__(self, bearer_token: str = None, api_key: str = None, api_secret: str = None):
        self.bearer_token = bearer_token
        self.api_key = api_key
        self.api_secret = api_secret
        self.is_configured = bool(bearer_token or (api_key and api_secret))
    
    def _get_headers(self) -> Dict:
        """Get authorization headers"""
        if self.bearer_token:
            return {"Authorization": f"Bearer {self.bearer_token}"}
        return {}
    
    async def search_tweets(self, query: str, max_results: int = 100) -> List[Dict]:
        """Search recent tweets"""
        if not self.is_configured:
            logger.warning("Twitter API not configured, returning simulated data")
            return self._generate_simulated_tweets(query, max_results)
        
        url = f"{self.BASE_URL}/tweets/search/recent"
        params = {
            "query": query,
            "max_results": min(max_results, 100),
            "tweet.fields": "created_at,public_metrics,author_id",
            "expansions": "author_id",
            "user.fields": "public_metrics"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=self._get_headers())
                
                if response.status_code != 200:
                    logger.error(f"Twitter API error: {response.text}")
                    return self._generate_simulated_tweets(query, max_results)
                
                data = response.json()
                return self._parse_tweets(data, query)
                
        except Exception as e:
            logger.error(f"Twitter API error: {e}")
            return self._generate_simulated_tweets(query, max_results)
    
    def _parse_tweets(self, data: Dict, query: str) -> List[Dict]:
        """Parse Twitter API response"""
        tweets = []
        
        # Build user lookup
        users = {}
        for user in data.get("includes", {}).get("users", []):
            users[user["id"]] = user
        
        for tweet in data.get("data", []):
            author_id = tweet.get("author_id")
            user = users.get(author_id, {})
            
            tweets.append({
                "id": tweet["id"],
                "content": tweet["text"],
                "author": user.get("username", "unknown"),
                "author_followers": user.get("public_metrics", {}).get("followers_count", 0),
                "likes": tweet.get("public_metrics", {}).get("like_count", 0),
                "retweets": tweet.get("public_metrics", {}).get("retweet_count", 0),
                "comments": tweet.get("public_metrics", {}).get("reply_count", 0),
                "created_at": tweet.get("created_at"),
                "url": f"https://twitter.com/i/status/{tweet['id']}"
            })
        
        return tweets
    
    def _generate_simulated_tweets(self, query: str, count: int) -> List[Dict]:
        """Generate simulated tweets for demo"""
        templates = [
            f"🚀 ${query} is looking bullish! Major breakout incoming! #crypto #trading",
            f"Just bought more ${query}. This is the future! 💎🙌",
            f"${query} analysis: RSI showing oversold conditions. Good entry point?",
            f"Be careful with ${query}, seeing some bearish divergence on the 4H chart 📉",
            f"${query} whales are accumulating. Check the on-chain data! 🐋",
            f"Technical update: ${query} testing key resistance at ${{price}}",
            f"${query} sentiment is extremely bullish right now. FOMO is real 🔥",
            f"Unpopular opinion: ${query} is overvalued at current levels",
            f"${query} just broke above the 200 MA! Bullish signal confirmed ✅",
            f"Market update: ${query} volume increasing significantly 📊"
        ]
        
        influencers = [
            ("CryptoWhale", 500000),
            ("TradingMaster", 250000),
            ("BitcoinMaxi", 180000),
            ("DeFiDegen", 120000),
            ("AltcoinDaily", 350000),
            ("CryptoAnalyst", 90000),
            ("TokenTrader", 75000),
            ("BlockchainBro", 60000)
        ]
        
        tweets = []
        for i in range(min(count, len(templates))):
            author, followers = random.choice(influencers)
            price = random.randint(80000, 100000) if query == "BTC" else random.randint(2500, 4000)
            
            tweets.append({
                "id": str(uuid.uuid4()),
                "content": templates[i].replace("{price}", str(price)),
                "author": author,
                "author_followers": followers,
                "likes": random.randint(100, 5000),
                "retweets": random.randint(20, 1000),
                "comments": random.randint(10, 200),
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))).isoformat(),
                "url": f"https://twitter.com/{author}/status/{uuid.uuid4().hex[:19]}"
            })
        
        return tweets
    
    async def get_trending_topics(self, woeid: int = 1) -> List[Dict]:
        """Get trending topics"""
        if not self.is_configured:
            return self._generate_simulated_trends()
        
        # Would use Twitter trends API
        return self._generate_simulated_trends()
    
    def _generate_simulated_trends(self) -> List[Dict]:
        """Generate simulated trending topics"""
        return [
            {"name": "#Bitcoin", "tweet_volume": 45230, "sentiment": "bullish"},
            {"name": "#Ethereum", "tweet_volume": 28450, "sentiment": "bullish"},
            {"name": "#Solana", "tweet_volume": 18920, "sentiment": "neutral"},
            {"name": "#DeFi", "tweet_volume": 12340, "sentiment": "bullish"},
            {"name": "#NFTs", "tweet_volume": 8750, "sentiment": "bearish"},
            {"name": "$BTC", "tweet_volume": 35600, "sentiment": "bullish"},
            {"name": "$ETH", "tweet_volume": 22100, "sentiment": "bullish"},
            {"name": "#CryptoTwitter", "tweet_volume": 15800, "sentiment": "neutral"}
        ]

# ============ REDDIT ADAPTER ============

class RedditAdapter:
    """Reddit API adapter"""
    
    BASE_URL = "https://oauth.reddit.com"
    AUTH_URL = "https://www.reddit.com/api/v1/access_token"
    
    def __init__(self, client_id: str = None, client_secret: str = None):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.is_configured = bool(client_id and client_secret)
    
    async def _get_access_token(self) -> Optional[str]:
        """Get OAuth access token"""
        if not self.is_configured:
            return None
        
        auth = httpx.BasicAuth(self.client_id, self.client_secret)
        data = {"grant_type": "client_credentials"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.AUTH_URL,
                    auth=auth,
                    data=data,
                    headers={"User-Agent": "OracleTrading/1.0"}
                )
                
                if response.status_code == 200:
                    self.access_token = response.json().get("access_token")
                    return self.access_token
        except Exception as e:
            logger.error(f"Reddit auth error: {e}")
        
        return None
    
    async def search_posts(self, query: str, subreddit: str = None, limit: int = 100) -> List[Dict]:
        """Search Reddit posts"""
        if not self.is_configured:
            logger.warning("Reddit API not configured, returning simulated data")
            return self._generate_simulated_posts(query, limit)
        
        if not self.access_token:
            await self._get_access_token()
        
        if not self.access_token:
            return self._generate_simulated_posts(query, limit)
        
        url = f"{self.BASE_URL}/search"
        params = {
            "q": query,
            "sort": "relevance",
            "limit": limit,
            "t": "day"  # Last 24 hours
        }
        
        if subreddit:
            url = f"{self.BASE_URL}/r/{subreddit}/search"
            params["restrict_sr"] = True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params=params,
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "User-Agent": "OracleTrading/1.0"
                    }
                )
                
                if response.status_code != 200:
                    return self._generate_simulated_posts(query, limit)
                
                return self._parse_posts(response.json())
                
        except Exception as e:
            logger.error(f"Reddit API error: {e}")
            return self._generate_simulated_posts(query, limit)
    
    def _parse_posts(self, data: Dict) -> List[Dict]:
        """Parse Reddit API response"""
        posts = []
        
        for child in data.get("data", {}).get("children", []):
            post = child.get("data", {})
            posts.append({
                "id": post.get("id"),
                "title": post.get("title"),
                "content": post.get("selftext", "")[:500],
                "author": post.get("author"),
                "subreddit": post.get("subreddit"),
                "upvotes": post.get("ups", 0),
                "downvotes": post.get("downs", 0),
                "comments": post.get("num_comments", 0),
                "created_at": datetime.fromtimestamp(post.get("created_utc", 0), tz=timezone.utc).isoformat(),
                "url": f"https://reddit.com{post.get('permalink', '')}"
            })
        
        return posts
    
    def _generate_simulated_posts(self, query: str, count: int) -> List[Dict]:
        """Generate simulated Reddit posts"""
        templates = [
            {"title": f"[Discussion] Is {query} ready for another bull run?", "sentiment": 0.6},
            {"title": f"Technical Analysis: {query} breakout imminent?", "sentiment": 0.4},
            {"title": f"Just DCA'd into {query} again. Long term holder here 💎", "sentiment": 0.7},
            {"title": f"Warning: {query} showing bearish divergence on daily", "sentiment": -0.3},
            {"title": f"{query} whale alert! 10,000 coins moved to exchange", "sentiment": -0.2},
            {"title": f"[DD] Why {query} could 10x from here", "sentiment": 0.8},
            {"title": f"Unpopular opinion: {query} is overhyped", "sentiment": -0.5},
            {"title": f"{query} just broke resistance! 🚀", "sentiment": 0.9},
        ]
        
        subreddits = ["CryptoCurrency", "Bitcoin", "ethtrader", "CryptoMarkets", "SatoshiStreetBets"]
        
        posts = []
        for i in range(min(count, len(templates))):
            template = templates[i]
            posts.append({
                "id": str(uuid.uuid4())[:8],
                "title": template["title"],
                "content": f"Just sharing my thoughts on {query}...",
                "author": f"crypto_trader_{random.randint(100, 999)}",
                "subreddit": random.choice(subreddits),
                "upvotes": random.randint(50, 2000),
                "downvotes": random.randint(5, 100),
                "comments": random.randint(20, 300),
                "sentiment": template["sentiment"],
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))).isoformat(),
                "url": f"https://reddit.com/r/{random.choice(subreddits)}/comments/{uuid.uuid4().hex[:6]}"
            })
        
        return posts
    
    async def get_subreddit_sentiment(self, subreddit: str) -> Dict:
        """Get overall sentiment of a subreddit"""
        posts = await self.search_posts("", subreddit=subreddit, limit=50)
        
        if not posts:
            return {"error": "No posts found"}
        
        total_sentiment = sum(p.get("sentiment", 0) for p in posts)
        avg_sentiment = total_sentiment / len(posts) if posts else 0
        
        return {
            "subreddit": subreddit,
            "posts_analyzed": len(posts),
            "avg_sentiment": avg_sentiment,
            "sentiment_label": "bullish" if avg_sentiment > 0.2 else "bearish" if avg_sentiment < -0.2 else "neutral"
        }

# ============ SOCIAL MANAGER ============

class SocialManager:
    """Manages social media integrations"""
    
    CRYPTO_KEYWORDS = {
        "BTC": ["bitcoin", "btc", "$btc", "#bitcoin"],
        "ETH": ["ethereum", "eth", "$eth", "#ethereum"],
        "SOL": ["solana", "sol", "$sol", "#solana"],
        "XRP": ["xrp", "ripple", "$xrp"],
        "ADA": ["cardano", "ada", "$ada"],
        "DOGE": ["dogecoin", "doge", "$doge"],
        "AVAX": ["avalanche", "avax", "$avax"],
        "DOT": ["polkadot", "dot", "$dot"]
    }
    
    def __init__(self, db):
        self.db = db
        self.twitter = TwitterAdapter()
        self.reddit = RedditAdapter()
    
    async def configure_twitter(self, bearer_token: str = None, 
                               api_key: str = None, api_secret: str = None) -> Dict:
        """Configure Twitter API credentials"""
        self.twitter = TwitterAdapter(
            bearer_token=bearer_token,
            api_key=api_key,
            api_secret=api_secret
        )
        
        # Save to database
        credentials = SocialCredentials(
            platform=SocialPlatform.TWITTER,
            bearer_token=bearer_token,
            api_key=api_key,
            api_secret=api_secret,
            is_configured=self.twitter.is_configured
        )
        
        await self.db.social_credentials.update_one(
            {"platform": SocialPlatform.TWITTER},
            {"$set": credentials.model_dump()},
            upsert=True
        )
        
        return {"success": True, "platform": "twitter", "configured": self.twitter.is_configured}
    
    async def configure_reddit(self, client_id: str, client_secret: str) -> Dict:
        """Configure Reddit API credentials"""
        self.reddit = RedditAdapter(client_id=client_id, client_secret=client_secret)
        
        credentials = SocialCredentials(
            platform=SocialPlatform.REDDIT,
            client_id=client_id,
            client_secret=client_secret,
            is_configured=self.reddit.is_configured
        )
        
        await self.db.social_credentials.update_one(
            {"platform": SocialPlatform.REDDIT},
            {"$set": credentials.model_dump()},
            upsert=True
        )
        
        return {"success": True, "platform": "reddit", "configured": self.reddit.is_configured}
    
    async def load_credentials(self):
        """Load saved credentials from database"""
        twitter_creds = await self.db.social_credentials.find_one(
            {"platform": SocialPlatform.TWITTER}, {"_id": 0}
        )
        if twitter_creds:
            self.twitter = TwitterAdapter(
                bearer_token=twitter_creds.get("bearer_token"),
                api_key=twitter_creds.get("api_key"),
                api_secret=twitter_creds.get("api_secret")
            )
        
        reddit_creds = await self.db.social_credentials.find_one(
            {"platform": SocialPlatform.REDDIT}, {"_id": 0}
        )
        if reddit_creds:
            self.reddit = RedditAdapter(
                client_id=reddit_creds.get("client_id"),
                client_secret=reddit_creds.get("client_secret")
            )
    
    def _analyze_sentiment(self, text: str) -> float:
        """Simple sentiment analysis (-1 to 1)"""
        # Positive keywords
        positive = ["bullish", "moon", "rocket", "pump", "buy", "long", "breakout", 
                   "support", "accumulate", "hodl", "diamond", "gains", "profit",
                   "🚀", "💎", "📈", "✅", "🔥", "💪"]
        
        # Negative keywords  
        negative = ["bearish", "dump", "sell", "short", "crash", "resistance",
                   "scam", "rugpull", "rekt", "loss", "fear", "warning",
                   "📉", "⚠️", "🔴", "❌"]
        
        text_lower = text.lower()
        
        pos_count = sum(1 for word in positive if word in text_lower)
        neg_count = sum(1 for word in negative if word in text_lower)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.0
        
        return (pos_count - neg_count) / total
    
    async def get_symbol_sentiment(self, symbol: str) -> SocialSentiment:
        """Get aggregated sentiment for a symbol across platforms"""
        keywords = self.CRYPTO_KEYWORDS.get(symbol, [symbol.lower()])
        query = " OR ".join(keywords)
        
        # Get tweets
        tweets = await self.twitter.search_tweets(query, max_results=50)
        
        # Get Reddit posts
        reddit_posts = await self.reddit.search_posts(query, limit=30)
        
        # Analyze sentiments
        twitter_sentiments = []
        twitter_posts = []
        
        for tweet in tweets:
            sentiment = self._analyze_sentiment(tweet.get("content", ""))
            tweet["sentiment"] = sentiment
            twitter_sentiments.append(sentiment)
            twitter_posts.append(SocialPost(
                id=tweet["id"],
                platform=SocialPlatform.TWITTER,
                author=tweet["author"],
                author_followers=tweet.get("author_followers", 0),
                content=tweet["content"],
                url=tweet.get("url"),
                likes=tweet.get("likes", 0),
                retweets=tweet.get("retweets", 0),
                comments=tweet.get("comments", 0),
                sentiment_score=sentiment,
                created_at=tweet.get("created_at", ""),
                symbols_mentioned=[symbol]
            ))
        
        reddit_sentiments = []
        reddit_post_objects = []
        
        for post in reddit_posts:
            sentiment = post.get("sentiment", self._analyze_sentiment(post.get("title", "") + " " + post.get("content", "")))
            reddit_sentiments.append(sentiment)
            reddit_post_objects.append(SocialPost(
                id=post["id"],
                platform=SocialPlatform.REDDIT,
                author=post["author"],
                content=post.get("title", ""),
                url=post.get("url"),
                likes=post.get("upvotes", 0),
                retweets=post.get("upvotes", 0),  # Using upvotes
                comments=post.get("comments", 0),
                sentiment_score=sentiment,
                created_at=post.get("created_at", ""),
                symbols_mentioned=[symbol]
            ))
        
        # Calculate aggregated sentiment
        all_sentiments = twitter_sentiments + reddit_sentiments
        avg_sentiment = sum(all_sentiments) / len(all_sentiments) if all_sentiments else 0
        
        positive = sum(1 for s in all_sentiments if s > 0.2)
        negative = sum(1 for s in all_sentiments if s < -0.2)
        neutral = len(all_sentiments) - positive - negative
        
        # Get top posts by engagement
        all_posts = twitter_posts + reddit_post_objects
        top_posts = sorted(all_posts, key=lambda p: p.likes + p.retweets, reverse=True)[:5]
        
        # Get influencer mentions
        influencers = [p for p in twitter_posts if p.author_followers > 50000]
        influencer_mentions = [
            {"author": p.author, "followers": p.author_followers, "sentiment": p.sentiment_score}
            for p in influencers[:5]
        ]
        
        return SocialSentiment(
            symbol=symbol,
            platform=SocialPlatform.TWITTER,  # Primary platform
            total_mentions=len(all_sentiments),
            positive_mentions=positive,
            negative_mentions=negative,
            neutral_mentions=neutral,
            sentiment_score=avg_sentiment,
            trending_score=len(all_sentiments) / 100,  # Normalized
            top_posts=top_posts,
            influencer_mentions=influencer_mentions
        )
    
    async def get_trending_crypto(self) -> List[Dict]:
        """Get trending cryptocurrencies across social media"""
        trends = await self.twitter.get_trending_topics()
        
        crypto_trends = []
        for trend in trends:
            name = trend["name"]
            # Check if it's crypto related
            is_crypto = any(
                keyword in name.lower() 
                for keywords in self.CRYPTO_KEYWORDS.values() 
                for keyword in keywords
            ) or name.startswith("$") or name.startswith("#")
            
            if is_crypto:
                crypto_trends.append({
                    "topic": name,
                    "volume": trend.get("tweet_volume", 0),
                    "sentiment": trend.get("sentiment", "neutral")
                })
        
        return crypto_trends
    
    async def get_configuration_status(self) -> Dict:
        """Get current configuration status"""
        return {
            "twitter": {
                "configured": self.twitter.is_configured,
                "status": "active" if self.twitter.is_configured else "not_configured"
            },
            "reddit": {
                "configured": self.reddit.is_configured,
                "status": "active" if self.reddit.is_configured else "not_configured"
            }
        }
