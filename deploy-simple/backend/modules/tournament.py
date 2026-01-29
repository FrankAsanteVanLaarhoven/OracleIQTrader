"""
Paper Trading Tournament Module
Weekly competitions with virtual portfolios, leaderboards, and prizes
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import random
import logging

logger = logging.getLogger(__name__)

# ============ ENUMS ============

class TournamentStatus(str, Enum):
    REGISTRATION = "registration"
    ACTIVE = "active"
    CALCULATING = "calculating"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TournamentType(str, Enum):
    WEEKLY = "weekly"
    DAILY = "daily"
    SPECIAL = "special"
    BEGINNER = "beginner"

class PrizeType(str, Enum):
    PRO_CREDITS = "pro_credits"
    BADGE = "badge"
    TITLE = "title"
    XP = "xp"

# ============ MODELS ============

class Prize(BaseModel):
    """Tournament prize"""
    rank: int
    prize_type: PrizeType
    value: Any  # credits amount, badge ID, title string, XP amount
    description: str

class TournamentParticipant(BaseModel):
    """Participant in a tournament"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    
    # Portfolio
    starting_balance: float = 100000.0
    current_balance: float = 100000.0
    cash_available: float = 100000.0
    
    # Performance
    total_pnl: float = 0.0
    total_pnl_percent: float = 0.0
    peak_balance: float = 100000.0
    max_drawdown: float = 0.0
    
    # Trading stats
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    avg_trade_pnl: float = 0.0
    best_trade_pnl: float = 0.0
    worst_trade_pnl: float = 0.0
    
    # Positions
    positions: List[Dict] = []
    
    # Ranking
    rank: int = 0
    previous_rank: int = 0
    
    # Registration
    registered_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    # Prize won
    prize_won: Optional[Prize] = None

class TournamentTrade(BaseModel):
    """Trade executed in a tournament"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    participant_id: str
    
    # Trade details
    symbol: str
    side: str  # "buy" or "sell"
    quantity: float
    price: float
    total_value: float
    
    # Result (for closed trades)
    exit_price: Optional[float] = None
    pnl: float = 0.0
    pnl_percent: float = 0.0
    status: str = "open"  # open, closed
    
    # Timestamps
    opened_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    closed_at: Optional[str] = None

class Tournament(BaseModel):
    """Paper trading tournament"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    tournament_type: TournamentType
    status: TournamentStatus = TournamentStatus.REGISTRATION
    
    # Timing
    registration_start: str
    registration_end: str
    trading_start: str
    trading_end: str
    
    # Rules
    starting_balance: float = 100000.0
    allowed_symbols: List[str] = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE"]
    max_position_size_pct: float = 25.0  # Max 25% of portfolio in single position
    max_leverage: int = 1
    min_trades_required: int = 3
    
    # Scoring
    ranking_metric: str = "total_return"  # total_return, sharpe_ratio, risk_adjusted
    
    # Prizes
    prizes: List[Prize] = []
    total_prize_pool: float = 0.0
    
    # Participation
    max_participants: Optional[int] = 1000
    participants: List[TournamentParticipant] = []
    participant_count: int = 0
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = "system"
    
    # Winner info (after completion)
    winners: List[Dict] = []


class TournamentEngine:
    """Engine for managing paper trading tournaments"""
    
    def __init__(self):
        self.tournaments: Dict[str, Tournament] = {}
        self.participants: Dict[str, Dict[str, TournamentParticipant]] = {}  # tournament_id -> user_id -> participant
        self.trades: Dict[str, List[TournamentTrade]] = {}  # tournament_id -> trades
        
        # Create default weekly tournament
        self._create_default_tournament()
    
    def _create_default_tournament(self):
        """Create the default weekly tournament"""
        now = datetime.now(timezone.utc)
        
        # Find next Monday for start
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0 and now.hour >= 12:
            days_until_monday = 7
        
        registration_start = now
        registration_end = now + timedelta(days=days_until_monday)
        trading_start = registration_end
        trading_end = trading_start + timedelta(days=7)
        
        tournament = Tournament(
            name="Weekly Trading Championship",
            description="Compete against traders worldwide! Start with $100,000 virtual and see who can make the most profit in a week.",
            tournament_type=TournamentType.WEEKLY,
            registration_start=registration_start.isoformat(),
            registration_end=registration_end.isoformat(),
            trading_start=trading_start.isoformat(),
            trading_end=trading_end.isoformat(),
            prizes=[
                Prize(rank=1, prize_type=PrizeType.PRO_CREDITS, value=100, description="100 Pro Credits + Gold Trophy"),
                Prize(rank=1, prize_type=PrizeType.BADGE, value="champion_badge", description="Tournament Champion Badge"),
                Prize(rank=1, prize_type=PrizeType.TITLE, value="Weekly Champion", description="Champion Title"),
                Prize(rank=2, prize_type=PrizeType.PRO_CREDITS, value=50, description="50 Pro Credits + Silver Trophy"),
                Prize(rank=2, prize_type=PrizeType.BADGE, value="runner_up_badge", description="Runner Up Badge"),
                Prize(rank=3, prize_type=PrizeType.PRO_CREDITS, value=25, description="25 Pro Credits + Bronze Trophy"),
                Prize(rank=3, prize_type=PrizeType.BADGE, value="third_place_badge", description="Third Place Badge"),
                Prize(rank=4, prize_type=PrizeType.XP, value=1000, description="1000 XP"),
                Prize(rank=5, prize_type=PrizeType.XP, value=500, description="500 XP"),
            ],
            total_prize_pool=175.0,
            status=TournamentStatus.REGISTRATION
        )
        
        self.tournaments[tournament.id] = tournament
        self.participants[tournament.id] = {}
        self.trades[tournament.id] = []
        
        # Add some simulated participants
        self._add_simulated_participants(tournament.id)
    
    def _add_simulated_participants(self, tournament_id: str):
        """Add simulated participants for demo purposes"""
        fake_names = [
            ("CryptoKing", 15420.50, 15.42),
            ("TradeMaster", 12350.00, 12.35),
            ("BullRunner", 10890.00, 10.89),
            ("DiamondHands", 9540.00, 9.54),
            ("MoonShot", 8210.00, 8.21),
            ("WhaleCatcher", 7890.00, 7.89),
            ("BTCMaxi", 6540.00, 6.54),
            ("ETHEnthusiast", 5230.00, 5.23),
            ("DeFiDegen", 4120.00, 4.12),
            ("TokenTrader", 3450.00, 3.45),
        ]
        
        for rank, (name, pnl, pnl_pct) in enumerate(fake_names, 1):
            participant = TournamentParticipant(
                user_id=f"sim_{uuid.uuid4().hex[:8]}",
                username=name,
                starting_balance=100000.0,
                current_balance=100000.0 + pnl,
                cash_available=50000.0 + pnl / 2,
                total_pnl=pnl,
                total_pnl_percent=pnl_pct,
                total_trades=random.randint(10, 50),
                winning_trades=random.randint(5, 30),
                rank=rank
            )
            participant.win_rate = participant.winning_trades / max(participant.total_trades, 1) * 100
            self.participants[tournament_id][participant.user_id] = participant
            self.tournaments[tournament_id].participant_count += 1
    
    def get_active_tournaments(self) -> List[Tournament]:
        """Get all active/upcoming tournaments"""
        return [t for t in self.tournaments.values() 
                if t.status in [TournamentStatus.REGISTRATION, TournamentStatus.ACTIVE]]
    
    def get_tournament(self, tournament_id: str) -> Optional[Tournament]:
        """Get tournament by ID"""
        return self.tournaments.get(tournament_id)
    
    def register_participant(self, tournament_id: str, user_id: str, username: str) -> Dict:
        """Register user for a tournament"""
        tournament = self.tournaments.get(tournament_id)
        if not tournament:
            return {"success": False, "error": "Tournament not found"}
        
        if tournament.status != TournamentStatus.REGISTRATION:
            return {"success": False, "error": "Registration is closed"}
        
        if tournament.max_participants and tournament.participant_count >= tournament.max_participants:
            return {"success": False, "error": "Tournament is full"}
        
        if user_id in self.participants.get(tournament_id, {}):
            return {"success": False, "error": "Already registered"}
        
        participant = TournamentParticipant(
            user_id=user_id,
            username=username,
            starting_balance=tournament.starting_balance,
            current_balance=tournament.starting_balance,
            cash_available=tournament.starting_balance
        )
        
        self.participants[tournament_id][user_id] = participant
        tournament.participant_count += 1
        
        return {
            "success": True,
            "participant": participant.model_dump(),
            "tournament": tournament.model_dump()
        }
    
    def execute_trade(
        self, 
        tournament_id: str, 
        user_id: str, 
        symbol: str, 
        side: str, 
        quantity: float, 
        price: float
    ) -> Dict:
        """Execute a trade in a tournament"""
        tournament = self.tournaments.get(tournament_id)
        if not tournament:
            return {"success": False, "error": "Tournament not found"}
        
        if tournament.status != TournamentStatus.ACTIVE:
            return {"success": False, "error": "Tournament is not active"}
        
        participant = self.participants.get(tournament_id, {}).get(user_id)
        if not participant:
            return {"success": False, "error": "Not registered for this tournament"}
        
        total_value = quantity * price
        
        # Check position size limit
        max_position = participant.current_balance * (tournament.max_position_size_pct / 100)
        if total_value > max_position:
            return {"success": False, "error": f"Position too large. Max: ${max_position:,.2f}"}
        
        if side.lower() == "buy":
            if total_value > participant.cash_available:
                return {"success": False, "error": "Insufficient funds"}
            
            # Execute buy
            participant.cash_available -= total_value
            
            # Add to positions
            participant.positions.append({
                "symbol": symbol,
                "quantity": quantity,
                "entry_price": price,
                "current_value": total_value
            })
        
        elif side.lower() == "sell":
            # Find position to sell
            position = None
            for p in participant.positions:
                if p["symbol"] == symbol and p["quantity"] >= quantity:
                    position = p
                    break
            
            if not position:
                return {"success": False, "error": "No position to sell"}
            
            # Calculate PnL
            entry_value = quantity * position["entry_price"]
            exit_value = quantity * price
            pnl = exit_value - entry_value
            pnl_pct = (pnl / entry_value) * 100
            
            # Update participant
            participant.cash_available += exit_value
            participant.total_pnl += pnl
            participant.current_balance += pnl
            participant.total_pnl_percent = (participant.total_pnl / participant.starting_balance) * 100
            
            # Update position
            position["quantity"] -= quantity
            if position["quantity"] <= 0:
                participant.positions.remove(position)
            
            # Update trade stats
            if pnl > 0:
                participant.winning_trades += 1
            else:
                participant.losing_trades += 1
            
            if pnl > participant.best_trade_pnl:
                participant.best_trade_pnl = pnl
            if pnl < participant.worst_trade_pnl:
                participant.worst_trade_pnl = pnl
        
        # Update trade count
        participant.total_trades += 1
        participant.win_rate = (participant.winning_trades / max(participant.total_trades, 1)) * 100
        
        # Create trade record
        trade = TournamentTrade(
            tournament_id=tournament_id,
            participant_id=participant.id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            total_value=total_value,
            status="closed" if side.lower() == "sell" else "open"
        )
        
        self.trades[tournament_id].append(trade)
        
        # Update rankings
        self._update_rankings(tournament_id)
        
        return {
            "success": True,
            "trade": trade.model_dump(),
            "participant": participant.model_dump()
        }
    
    def _update_rankings(self, tournament_id: str):
        """Update participant rankings based on performance"""
        participants = list(self.participants.get(tournament_id, {}).values())
        
        # Sort by total PnL percent
        participants.sort(key=lambda p: p.total_pnl_percent, reverse=True)
        
        for rank, participant in enumerate(participants, 1):
            participant.previous_rank = participant.rank
            participant.rank = rank
    
    def get_leaderboard(self, tournament_id: str, limit: int = 100) -> List[Dict]:
        """Get tournament leaderboard"""
        participants = list(self.participants.get(tournament_id, {}).values())
        participants.sort(key=lambda p: p.total_pnl_percent, reverse=True)
        
        leaderboard = []
        for p in participants[:limit]:
            leaderboard.append({
                "rank": p.rank,
                "rank_change": p.previous_rank - p.rank if p.previous_rank > 0 else 0,
                "username": p.username,
                "pnl": p.total_pnl,
                "pnl_percent": p.total_pnl_percent,
                "total_trades": p.total_trades,
                "win_rate": p.win_rate,
                "current_balance": p.current_balance
            })
        
        return leaderboard
    
    def get_participant(self, tournament_id: str, user_id: str) -> Optional[TournamentParticipant]:
        """Get participant info"""
        return self.participants.get(tournament_id, {}).get(user_id)
    
    def get_user_tournaments(self, user_id: str) -> List[Dict]:
        """Get all tournaments a user is participating in"""
        result = []
        for tournament_id, participants in self.participants.items():
            if user_id in participants:
                tournament = self.tournaments[tournament_id]
                participant = participants[user_id]
                result.append({
                    "tournament": tournament.model_dump(),
                    "participant": participant.model_dump()
                })
        return result


# Global tournament engine
tournament_engine = TournamentEngine()


# FastAPI integration functions
def get_active_tournaments() -> List[Dict]:
    """Get active tournaments for API"""
    return [t.model_dump() for t in tournament_engine.get_active_tournaments()]

def get_tournament_details(tournament_id: str) -> Optional[Dict]:
    """Get tournament details"""
    t = tournament_engine.get_tournament(tournament_id)
    return t.model_dump() if t else None

def get_tournament_leaderboard(tournament_id: str, limit: int = 100) -> List[Dict]:
    """Get leaderboard"""
    return tournament_engine.get_leaderboard(tournament_id, limit)

def register_for_tournament(tournament_id: str, user_id: str, username: str) -> Dict:
    """Register for tournament"""
    return tournament_engine.register_participant(tournament_id, user_id, username)

def execute_tournament_trade(
    tournament_id: str,
    user_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: float
) -> Dict:
    """Execute trade in tournament"""
    return tournament_engine.execute_trade(
        tournament_id, user_id, symbol, side, quantity, price
    )

def get_user_tournament_status(tournament_id: str, user_id: str) -> Optional[Dict]:
    """Get user's tournament status"""
    p = tournament_engine.get_participant(tournament_id, user_id)
    return p.model_dump() if p else None
