"""
Trading Competition Module
Paper trading challenges, tournaments, and leaderboards with prizes
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import random

# ============ ENUMS ============

class CompetitionType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    THEMED = "themed"
    TOURNAMENT = "tournament"

class CompetitionStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"

class TierLevel(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"

# ============ MODELS ============

class CompetitionPrize(BaseModel):
    """Prize for competition placement"""
    rank: int  # 1, 2, 3, etc.
    xp_reward: int
    badge_id: Optional[str] = None
    title: Optional[str] = None  # Special title for winners
    description: str = ""

class Competition(BaseModel):
    """Trading competition/challenge"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: CompetitionType
    status: CompetitionStatus = CompetitionStatus.UPCOMING
    
    # Timing
    start_time: str
    end_time: str
    registration_deadline: Optional[str] = None
    
    # Rules
    starting_balance: float = 10000.0
    allowed_symbols: List[str] = ["BTC", "ETH", "SOL", "XRP", "ADA"]
    max_leverage: int = 1
    max_trades_per_day: Optional[int] = None
    min_trade_size: float = 0.001
    
    # Goals and scoring
    objective: str = "highest_return"  # highest_return, lowest_drawdown, sharpe_ratio
    min_trades_required: int = 5
    
    # Theme (for themed competitions)
    theme: Optional[str] = None
    theme_description: Optional[str] = None
    special_rules: List[str] = []
    
    # Prizes
    prizes: List[CompetitionPrize] = []
    
    # Participation
    max_participants: Optional[int] = None
    participant_count: int = 0
    entry_fee_xp: int = 0  # XP cost to enter
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = "system"

class CompetitionEntry(BaseModel):
    """User's entry in a competition"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    competition_id: str
    user_id: str
    username: str
    
    # Account state
    starting_balance: float
    current_balance: float
    current_equity: float
    
    # Performance
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    
    # Positions and trades
    open_positions: List[Dict] = []
    trade_history: List[Dict] = []
    
    # Ranking
    current_rank: int = 0
    best_rank: int = 0
    score: float = 0.0  # Calculated based on competition objective
    
    # Status
    is_disqualified: bool = False
    disqualification_reason: Optional[str] = None
    
    joined_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_trade_at: Optional[str] = None

class CompetitionResult(BaseModel):
    """Final results of a competition"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    competition_id: str
    competition_name: str
    
    # Winners
    rankings: List[Dict] = []  # [{rank, user_id, username, pnl_percent, prize}]
    
    # Statistics
    total_participants: int
    average_return: float
    median_return: float
    best_return: float
    worst_return: float
    
    finalized_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCompetitionStats(BaseModel):
    """User's overall competition statistics"""
    user_id: str
    
    # Participation
    competitions_entered: int = 0
    competitions_completed: int = 0
    competitions_won: int = 0
    
    # Rankings
    total_podium_finishes: int = 0  # Top 3
    best_rank: int = 0
    average_rank: float = 0.0
    
    # Performance
    total_prize_xp: int = 0
    badges_earned: List[str] = []
    titles_earned: List[str] = []
    
    # Tier
    tier: TierLevel = TierLevel.BRONZE
    tier_points: int = 0
    
    # Streaks
    current_streak: int = 0  # Consecutive positive competitions
    best_streak: int = 0
    
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ COMPETITION ENGINE ============

class CompetitionEngine:
    """Engine for managing trading competitions"""
    
    # Tier thresholds
    TIER_THRESHOLDS = {
        TierLevel.BRONZE: 0,
        TierLevel.SILVER: 500,
        TierLevel.GOLD: 1500,
        TierLevel.PLATINUM: 3500,
        TierLevel.DIAMOND: 7500
    }
    
    def __init__(self, db, playground_engine=None):
        self.db = db
        self.playground_engine = playground_engine
    
    async def create_competition(self, competition: Competition) -> Competition:
        """Create a new competition"""
        await self.db.competitions.insert_one(competition.model_dump())
        return competition
    
    async def create_daily_challenge(self) -> Competition:
        """Create a daily trading challenge"""
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        
        competition = Competition(
            name=f"Daily Challenge - {start.strftime('%B %d')}",
            description="Compete for the highest return in 24 hours!",
            type=CompetitionType.DAILY,
            status=CompetitionStatus.ACTIVE if now >= start else CompetitionStatus.UPCOMING,
            start_time=start.isoformat(),
            end_time=end.isoformat(),
            starting_balance=10000.0,
            objective="highest_return",
            min_trades_required=3,
            prizes=[
                CompetitionPrize(rank=1, xp_reward=500, badge_id="daily_champion", title="Daily Champion", description="First place in daily challenge"),
                CompetitionPrize(rank=2, xp_reward=300, badge_id="daily_silver", description="Second place"),
                CompetitionPrize(rank=3, xp_reward=150, badge_id="daily_bronze", description="Third place"),
                CompetitionPrize(rank=10, xp_reward=50, description="Top 10 finish")
            ]
        )
        
        return await self.create_competition(competition)
    
    async def create_weekly_tournament(self) -> Competition:
        """Create a weekly trading tournament"""
        now = datetime.now(timezone.utc)
        # Start on Monday
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0 and now.hour >= 0:
            days_until_monday = 7
        start = (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=7)
        
        competition = Competition(
            name=f"Weekly Tournament - Week {start.isocalendar()[1]}",
            description="A week-long battle for trading supremacy! Higher stakes, bigger rewards.",
            type=CompetitionType.WEEKLY,
            status=CompetitionStatus.UPCOMING,
            start_time=start.isoformat(),
            end_time=end.isoformat(),
            registration_deadline=(start - timedelta(hours=1)).isoformat(),
            starting_balance=25000.0,
            objective="highest_return",
            min_trades_required=10,
            prizes=[
                CompetitionPrize(rank=1, xp_reward=2000, badge_id="weekly_champion", title="Weekly Champion", description="Weekly tournament winner"),
                CompetitionPrize(rank=2, xp_reward=1200, badge_id="weekly_silver", title="Weekly Runner-up", description="Second place"),
                CompetitionPrize(rank=3, xp_reward=800, badge_id="weekly_bronze", description="Third place"),
                CompetitionPrize(rank=5, xp_reward=400, description="Top 5 finish"),
                CompetitionPrize(rank=10, xp_reward=200, description="Top 10 finish"),
                CompetitionPrize(rank=25, xp_reward=100, description="Top 25 finish")
            ]
        )
        
        return await self.create_competition(competition)
    
    async def create_themed_event(self, theme: str) -> Competition:
        """Create a themed trading event"""
        themes = {
            "bear_market": {
                "name": "🐻 Bear Market Survival",
                "description": "Navigate a simulated bear market. The trader with the lowest drawdown wins!",
                "objective": "lowest_drawdown",
                "special_rules": ["Market will trend downward", "Short positions allowed", "Survival is key"],
                "duration_hours": 48
            },
            "moon_mission": {
                "name": "🚀 Moon Mission",
                "description": "Aggressive gains challenge! Go for maximum returns in a bull run simulation.",
                "objective": "highest_return",
                "special_rules": ["High volatility enabled", "2x leverage allowed", "Risk it for the biscuit"],
                "duration_hours": 24
            },
            "steady_hands": {
                "name": "✋ Steady Hands",
                "description": "Consistency is key. Best Sharpe ratio wins!",
                "objective": "sharpe_ratio",
                "special_rules": ["Focus on risk-adjusted returns", "No more than 5% per trade", "Patience rewarded"],
                "duration_hours": 72
            },
            "speed_trader": {
                "name": "⚡ Speed Trader",
                "description": "Fast-paced trading challenge. Most profitable trades in 4 hours!",
                "objective": "highest_return",
                "special_rules": ["4-hour time limit", "Minimum 20 trades required", "Quick decisions only"],
                "duration_hours": 4
            }
        }
        
        theme_config = themes.get(theme, themes["moon_mission"])
        
        now = datetime.now(timezone.utc)
        start = now + timedelta(hours=1)
        end = start + timedelta(hours=theme_config["duration_hours"])
        
        competition = Competition(
            name=theme_config["name"],
            description=theme_config["description"],
            type=CompetitionType.THEMED,
            status=CompetitionStatus.UPCOMING,
            start_time=start.isoformat(),
            end_time=end.isoformat(),
            starting_balance=15000.0,
            objective=theme_config["objective"],
            theme=theme,
            theme_description=theme_config["description"],
            special_rules=theme_config["special_rules"],
            min_trades_required=5 if theme != "speed_trader" else 20,
            max_leverage=2 if theme == "moon_mission" else 1,
            prizes=[
                CompetitionPrize(rank=1, xp_reward=1500, badge_id=f"themed_{theme}_1", title=f"{theme_config['name'].split()[0]} Master", description="First place"),
                CompetitionPrize(rank=2, xp_reward=900, description="Second place"),
                CompetitionPrize(rank=3, xp_reward=500, description="Third place"),
                CompetitionPrize(rank=10, xp_reward=150, description="Top 10")
            ]
        )
        
        return await self.create_competition(competition)
    
    async def join_competition(self, competition_id: str, user_id: str, username: str) -> Dict:
        """Join a competition"""
        competition = await self.get_competition(competition_id)
        if not competition:
            return {"success": False, "error": "Competition not found"}
        
        if competition.status != CompetitionStatus.ACTIVE and competition.status != CompetitionStatus.UPCOMING:
            return {"success": False, "error": "Competition is not accepting entries"}
        
        if competition.max_participants and competition.participant_count >= competition.max_participants:
            return {"success": False, "error": "Competition is full"}
        
        # Check if already entered
        existing = await self.db.competition_entries.find_one({
            "competition_id": competition_id,
            "user_id": user_id
        })
        if existing:
            return {"success": False, "error": "Already entered this competition"}
        
        # Create entry
        entry = CompetitionEntry(
            competition_id=competition_id,
            user_id=user_id,
            username=username,
            starting_balance=competition.starting_balance,
            current_balance=competition.starting_balance,
            current_equity=competition.starting_balance
        )
        
        await self.db.competition_entries.insert_one(entry.model_dump())
        
        # Update participant count
        await self.db.competitions.update_one(
            {"id": competition_id},
            {"$inc": {"participant_count": 1}}
        )
        
        return {"success": True, "entry": entry.model_dump()}
    
    async def execute_competition_trade(self, entry_id: str, symbol: str, side: str, 
                                        quantity: float, current_price: float) -> Dict:
        """Execute a trade within a competition"""
        entry = await self.db.competition_entries.find_one({"id": entry_id}, {"_id": 0})
        if not entry:
            return {"success": False, "error": "Entry not found"}
        
        entry = CompetitionEntry(**entry)
        
        if entry.is_disqualified:
            return {"success": False, "error": "Entry is disqualified"}
        
        # Calculate trade
        trade_value = quantity * current_price
        fee = trade_value * 0.001  # 0.1% fee
        
        if side == "buy":
            total_cost = trade_value + fee
            if total_cost > entry.current_balance:
                return {"success": False, "error": "Insufficient balance"}
            
            entry.current_balance -= total_cost
            
            # Add position
            position = {
                "id": str(uuid.uuid4()),
                "symbol": symbol,
                "side": "long",
                "quantity": quantity,
                "entry_price": current_price,
                "current_price": current_price,
                "unrealized_pnl": 0
            }
            entry.open_positions.append(position)
            
        else:  # sell
            # Find and close position
            position_idx = None
            for i, pos in enumerate(entry.open_positions):
                if pos["symbol"] == symbol:
                    position_idx = i
                    break
            
            if position_idx is None:
                return {"success": False, "error": "No position to close"}
            
            position = entry.open_positions[position_idx]
            pnl = (current_price - position["entry_price"]) * quantity
            entry.current_balance += trade_value - fee
            entry.total_pnl += pnl
            
            # Update win/loss
            if pnl > 0:
                entry.winning_trades += 1
            else:
                entry.losing_trades += 1
            
            # Remove position
            entry.open_positions.pop(position_idx)
        
        # Record trade
        trade_record = {
            "id": str(uuid.uuid4()),
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "price": current_price,
            "value": trade_value,
            "fee": fee,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        entry.trade_history.append(trade_record)
        
        # Update stats
        entry.total_trades += 1
        entry.total_pnl_percent = ((entry.current_balance - entry.starting_balance) / entry.starting_balance) * 100
        entry.win_rate = (entry.winning_trades / entry.total_trades * 100) if entry.total_trades > 0 else 0
        entry.last_trade_at = datetime.now(timezone.utc).isoformat()
        
        # Calculate current equity (balance + unrealized)
        entry.current_equity = entry.current_balance
        for pos in entry.open_positions:
            entry.current_equity += pos["quantity"] * pos.get("current_price", pos["entry_price"])
        
        # Calculate max drawdown
        peak = max(entry.starting_balance, entry.current_equity)
        drawdown = ((peak - entry.current_equity) / peak) * 100
        entry.max_drawdown = max(entry.max_drawdown, drawdown)
        
        # Save updated entry
        await self.db.competition_entries.update_one(
            {"id": entry_id},
            {"$set": entry.model_dump()}
        )
        
        return {"success": True, "trade": trade_record, "entry": entry.model_dump()}
    
    async def get_competition(self, competition_id: str) -> Optional[Competition]:
        """Get competition by ID"""
        doc = await self.db.competitions.find_one({"id": competition_id}, {"_id": 0})
        return Competition(**doc) if doc else None
    
    async def get_active_competitions(self) -> List[Competition]:
        """Get all active competitions"""
        now = datetime.now(timezone.utc).isoformat()
        docs = await self.db.competitions.find({
            "status": {"$in": [CompetitionStatus.ACTIVE, CompetitionStatus.UPCOMING]},
            "end_time": {"$gt": now}
        }, {"_id": 0}).to_list(100)
        
        return [Competition(**doc) for doc in docs]
    
    async def get_competition_leaderboard(self, competition_id: str, limit: int = 50) -> List[Dict]:
        """Get competition leaderboard"""
        entries = await self.db.competition_entries.find(
            {"competition_id": competition_id, "is_disqualified": False},
            {"_id": 0}
        ).sort("total_pnl_percent", -1).limit(limit).to_list(limit)
        
        leaderboard = []
        for rank, entry in enumerate(entries, 1):
            leaderboard.append({
                "rank": rank,
                "user_id": entry["user_id"],
                "username": entry["username"],
                "pnl_percent": entry["total_pnl_percent"],
                "total_pnl": entry["total_pnl"],
                "current_equity": entry["current_equity"],
                "total_trades": entry["total_trades"],
                "win_rate": entry["win_rate"],
                "max_drawdown": entry["max_drawdown"]
            })
        
        return leaderboard
    
    async def get_user_entry(self, competition_id: str, user_id: str) -> Optional[CompetitionEntry]:
        """Get user's entry in a competition"""
        doc = await self.db.competition_entries.find_one({
            "competition_id": competition_id,
            "user_id": user_id
        }, {"_id": 0})
        return CompetitionEntry(**doc) if doc else None
    
    async def finalize_competition(self, competition_id: str) -> CompetitionResult:
        """Finalize competition and distribute prizes"""
        competition = await self.get_competition(competition_id)
        if not competition:
            raise ValueError("Competition not found")
        
        # Get final leaderboard
        leaderboard = await self.get_competition_leaderboard(competition_id, 100)
        
        # Calculate statistics
        returns = [e["pnl_percent"] for e in leaderboard]
        
        result = CompetitionResult(
            competition_id=competition_id,
            competition_name=competition.name,
            rankings=leaderboard[:25],  # Top 25
            total_participants=len(leaderboard),
            average_return=sum(returns) / len(returns) if returns else 0,
            median_return=sorted(returns)[len(returns)//2] if returns else 0,
            best_return=max(returns) if returns else 0,
            worst_return=min(returns) if returns else 0
        )
        
        # Distribute prizes
        for entry in leaderboard:
            rank = entry["rank"]
            for prize in competition.prizes:
                if rank <= prize.rank:
                    # Award XP and badges
                    await self._award_prize(entry["user_id"], prize, competition.name, rank)
                    break
        
        # Update competition status
        await self.db.competitions.update_one(
            {"id": competition_id},
            {"$set": {"status": CompetitionStatus.ENDED}}
        )
        
        await self.db.competition_results.insert_one(result.model_dump())
        
        return result
    
    async def _award_prize(self, user_id: str, prize: CompetitionPrize, 
                          competition_name: str, rank: int):
        """Award prize to user"""
        # Update user stats
        update = {
            "$inc": {
                "tier_points": prize.xp_reward,
                "total_prize_xp": prize.xp_reward
            }
        }
        
        if rank <= 3:
            update["$inc"]["total_podium_finishes"] = 1
        
        if rank == 1:
            update["$inc"]["competitions_won"] = 1
        
        if prize.badge_id:
            update["$addToSet"] = {"badges_earned": prize.badge_id}
        
        if prize.title:
            if "$addToSet" not in update:
                update["$addToSet"] = {}
            update["$addToSet"]["titles_earned"] = prize.title
        
        await self.db.user_competition_stats.update_one(
            {"user_id": user_id},
            update,
            upsert=True
        )
        
        # Update tier based on points
        stats = await self.get_user_stats(user_id)
        new_tier = self._calculate_tier(stats.tier_points)
        if new_tier != stats.tier:
            await self.db.user_competition_stats.update_one(
                {"user_id": user_id},
                {"$set": {"tier": new_tier}}
            )
    
    def _calculate_tier(self, points: int) -> TierLevel:
        """Calculate tier based on points"""
        for tier in reversed(list(TierLevel)):
            if points >= self.TIER_THRESHOLDS[tier]:
                return tier
        return TierLevel.BRONZE
    
    async def get_user_stats(self, user_id: str) -> UserCompetitionStats:
        """Get user's competition statistics"""
        doc = await self.db.user_competition_stats.find_one({"user_id": user_id}, {"_id": 0})
        if doc:
            return UserCompetitionStats(**doc)
        
        # Create default stats
        stats = UserCompetitionStats(user_id=user_id)
        await self.db.user_competition_stats.insert_one(stats.model_dump())
        return stats
    
    async def get_global_leaderboard(self, limit: int = 100) -> List[Dict]:
        """Get global competition leaderboard by tier points"""
        docs = await self.db.user_competition_stats.find(
            {},
            {"_id": 0}
        ).sort("tier_points", -1).limit(limit).to_list(limit)
        
        leaderboard = []
        for rank, doc in enumerate(docs, 1):
            leaderboard.append({
                "rank": rank,
                "user_id": doc["user_id"],
                "tier": doc.get("tier", TierLevel.BRONZE),
                "tier_points": doc.get("tier_points", 0),
                "competitions_won": doc.get("competitions_won", 0),
                "podium_finishes": doc.get("total_podium_finishes", 0),
                "badges_count": len(doc.get("badges_earned", []))
            })
        
        return leaderboard
