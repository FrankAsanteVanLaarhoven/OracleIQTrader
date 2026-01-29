"""
Interactive Training System Module
Tutorial walkthroughs, AI-guided lessons, trading simulators, and backtesting
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import random

# ============ ENUMS ============

class LessonCategory(str, Enum):
    BASICS = "basics"
    TECHNICAL_ANALYSIS = "technical_analysis"
    RISK_MANAGEMENT = "risk_management"
    TRADING_STRATEGIES = "trading_strategies"
    PSYCHOLOGY = "psychology"
    ADVANCED = "advanced"

class ScenarioDifficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

# ============ MODELS ============

class TutorialStep(BaseModel):
    """Single step in a tutorial"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order: int
    title: str
    content: str
    action_type: str  # "read", "click", "input", "trade", "quiz"
    target_element: Optional[str] = None  # CSS selector for highlighting
    expected_action: Optional[Dict] = None
    hints: List[str] = []
    completed: bool = False

class Tutorial(BaseModel):
    """Complete tutorial walkthrough"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: LessonCategory
    difficulty: ScenarioDifficulty
    estimated_time_minutes: int
    steps: List[TutorialStep] = []
    prerequisites: List[str] = []  # IDs of required tutorials
    rewards: Dict = {"xp": 100, "badge": None}

class Lesson(BaseModel):
    """AI-guided trading lesson"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: LessonCategory
    difficulty: ScenarioDifficulty
    description: str
    content: str  # Markdown content
    key_concepts: List[str] = []
    examples: List[Dict] = []
    quiz_questions: List[Dict] = []
    practical_exercise: Optional[Dict] = None
    estimated_time_minutes: int = 15

class TradingScenario(BaseModel):
    """Trading simulator scenario"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    difficulty: ScenarioDifficulty
    scenario_type: str  # "bull_market", "bear_market", "sideways", "crash", "rally"
    
    # Starting conditions
    initial_balance: float = 10000.0
    starting_positions: List[Dict] = []
    market_data: List[Dict] = []  # Historical candles
    
    # Objectives
    target_profit_percent: float = 10.0
    max_drawdown_percent: float = 20.0
    time_limit_minutes: int = 30
    
    # Hints and guidance
    hints: List[str] = []
    optimal_strategy: Optional[str] = None
    
    # Scoring
    scoring_criteria: Dict = {
        "profit": 40,
        "risk_management": 30,
        "timing": 20,
        "learning_objectives": 10
    }

class BacktestConfig(BaseModel):
    """Backtesting configuration"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str = "My Backtest"
    
    # Symbol and timeframe
    symbol: str = "BTC"
    start_date: str
    end_date: str
    timeframe: str = "1h"  # 1m, 5m, 15m, 1h, 4h, 1d
    
    # Strategy parameters
    strategy_type: str  # "sma_cross", "rsi", "macd", "custom"
    parameters: Dict = {}
    
    # Risk settings
    initial_capital: float = 10000.0
    position_size_percent: float = 10.0
    stop_loss_percent: float = 5.0
    take_profit_percent: float = 10.0
    
    # Results
    status: str = "pending"  # pending, running, completed, failed
    results: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserProgress(BaseModel):
    """Track user's learning progress"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Progress tracking
    completed_tutorials: List[str] = []
    completed_lessons: List[str] = []
    completed_scenarios: List[Dict] = []
    completed_backtests: List[str] = []
    
    # Stats
    total_xp: int = 0
    current_level: int = 1
    badges: List[str] = []
    
    # Skill scores (0-100)
    skills: Dict = {
        "technical_analysis": 0,
        "risk_management": 0,
        "trading_psychology": 0,
        "strategy_development": 0,
        "market_analysis": 0
    }
    
    # Learning path
    current_path: str = "beginner"  # beginner, trader, advanced, expert
    next_recommended: List[str] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ TRAINING ENGINE ============

class TrainingEngine:
    """Engine for managing the training system"""
    
    # XP requirements per level
    LEVEL_XP = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000]
    
    def __init__(self, db):
        self.db = db
        self._init_content()
    
    def _init_content(self):
        """Initialize default training content"""
        self.default_tutorials = self._create_default_tutorials()
        self.default_lessons = self._create_default_lessons()
        self.default_scenarios = self._create_default_scenarios()
    
    def _create_default_tutorials(self) -> List[Tutorial]:
        """Create default tutorial content"""
        return [
            Tutorial(
                id="tut_welcome",
                title="Welcome to Oracle Trading",
                description="Learn the basics of the platform",
                category=LessonCategory.BASICS,
                difficulty=ScenarioDifficulty.BEGINNER,
                estimated_time_minutes=5,
                steps=[
                    TutorialStep(order=1, title="Dashboard Overview", 
                                content="Welcome to the Cognitive Oracle Trading Platform! This is your main dashboard where you can monitor markets, execute trades, and track your portfolio.",
                                action_type="read"),
                    TutorialStep(order=2, title="Market Data",
                                content="The top section shows real-time cryptocurrency prices. BTC, ETH, and other major coins are displayed with their current prices and 24h changes.",
                                action_type="read", target_element="[data-testid='market-prices']"),
                    TutorialStep(order=3, title="Navigation Tabs",
                                content="Use the tabs on the left to navigate between different sections: Dashboard, Paper Trading, Alerts, and more.",
                                action_type="click", target_element="[data-testid='nav-tabs']"),
                    TutorialStep(order=4, title="Your First View",
                                content="Click on 'Paper' tab to access the paper trading playground where you can practice without risking real money.",
                                action_type="click", target_element="text=Paper"),
                ],
                rewards={"xp": 50, "badge": "welcome"}
            ),
            Tutorial(
                id="tut_paper_trading",
                title="Paper Trading Basics",
                description="Learn to trade with virtual money",
                category=LessonCategory.BASICS,
                difficulty=ScenarioDifficulty.BEGINNER,
                estimated_time_minutes=10,
                prerequisites=["tut_welcome"],
                steps=[
                    TutorialStep(order=1, title="Your Virtual Account",
                                content="You start with $100,000 in virtual money. This allows you to practice trading strategies without any financial risk.",
                                action_type="read"),
                    TutorialStep(order=2, title="Placing a Buy Order",
                                content="To buy cryptocurrency, select the coin, enter the amount, and click 'Buy'. The order will execute at the current market price.",
                                action_type="trade", expected_action={"type": "buy"}),
                    TutorialStep(order=3, title="Understanding Your Position",
                                content="After buying, you'll see your position in the portfolio. It shows your entry price, current price, and profit/loss.",
                                action_type="read"),
                    TutorialStep(order=4, title="Selling Your Position",
                                content="To take profits or cut losses, sell your position. Try selling what you just bought.",
                                action_type="trade", expected_action={"type": "sell"}),
                ],
                rewards={"xp": 100, "badge": "paper_trader"}
            ),
            Tutorial(
                id="tut_risk_management",
                title="Risk Management Essentials",
                description="Protect your capital with proper risk management",
                category=LessonCategory.RISK_MANAGEMENT,
                difficulty=ScenarioDifficulty.BEGINNER,
                estimated_time_minutes=15,
                prerequisites=["tut_paper_trading"],
                steps=[
                    TutorialStep(order=1, title="The 2% Rule",
                                content="Never risk more than 2% of your total capital on a single trade. This protects you from significant losses.",
                                action_type="read"),
                    TutorialStep(order=2, title="Stop Loss Orders",
                                content="A stop loss automatically sells your position if the price drops to a certain level, limiting your loss.",
                                action_type="read"),
                    TutorialStep(order=3, title="Setting a Stop Loss",
                                content="When placing a trade, always set a stop loss. Try setting one 5% below your entry price.",
                                action_type="trade", expected_action={"type": "buy", "stop_loss": True}),
                    TutorialStep(order=4, title="Take Profit Levels",
                                content="Take profit orders automatically close your position when it reaches your target profit.",
                                action_type="read"),
                ],
                rewards={"xp": 150, "badge": "risk_aware"}
            ),
        ]
    
    def _create_default_lessons(self) -> List[Lesson]:
        """Create default lesson content"""
        return [
            Lesson(
                id="lesson_ta_basics",
                title="Technical Analysis Fundamentals",
                category=LessonCategory.TECHNICAL_ANALYSIS,
                difficulty=ScenarioDifficulty.BEGINNER,
                description="Learn the basics of reading charts and understanding price patterns",
                content="""
# Technical Analysis Fundamentals

Technical analysis is the study of historical price movements to predict future price action.

## Key Concepts

### 1. Candlestick Charts
Each candle shows four prices: Open, High, Low, Close (OHLC)
- **Green/White candles**: Price went up (Close > Open)
- **Red/Black candles**: Price went down (Close < Open)

### 2. Support and Resistance
- **Support**: Price level where buying pressure tends to overcome selling
- **Resistance**: Price level where selling pressure tends to overcome buying

### 3. Trend Lines
- Connect successive lows for an uptrend
- Connect successive highs for a downtrend
- Breaking a trend line may signal a reversal

## Why It Works
Technical analysis works because many traders watch the same levels and patterns, creating self-fulfilling prophecies.
                """,
                key_concepts=["Candlesticks", "Support/Resistance", "Trend Lines", "Volume"],
                quiz_questions=[
                    {"question": "What does a green candlestick indicate?", 
                     "options": ["Price went down", "Price went up", "No change", "Market closed"],
                     "correct": 1},
                    {"question": "What is a support level?",
                     "options": ["Maximum price", "Where buyers step in", "Where sellers dominate", "Trading volume"],
                     "correct": 1}
                ],
                estimated_time_minutes=20
            ),
            Lesson(
                id="lesson_indicators",
                title="Essential Trading Indicators",
                category=LessonCategory.TECHNICAL_ANALYSIS,
                difficulty=ScenarioDifficulty.INTERMEDIATE,
                description="Master RSI, MACD, and Moving Averages",
                content="""
# Essential Trading Indicators

## RSI (Relative Strength Index)
Measures momentum on a scale of 0-100
- **Below 30**: Oversold (potential buy signal)
- **Above 70**: Overbought (potential sell signal)

## MACD (Moving Average Convergence Divergence)
Shows trend direction and momentum
- **MACD line crossing above signal**: Bullish
- **MACD line crossing below signal**: Bearish

## Moving Averages
- **SMA (Simple)**: Equal weight to all prices
- **EMA (Exponential)**: More weight to recent prices
- **Golden Cross**: 50-day MA crosses above 200-day (bullish)
- **Death Cross**: 50-day MA crosses below 200-day (bearish)
                """,
                key_concepts=["RSI", "MACD", "Moving Averages", "Golden Cross"],
                quiz_questions=[
                    {"question": "An RSI below 30 typically indicates:",
                     "options": ["Overbought conditions", "Oversold conditions", "Neutral market", "High volume"],
                     "correct": 1},
                ],
                estimated_time_minutes=25
            ),
            Lesson(
                id="lesson_psychology",
                title="Trading Psychology",
                category=LessonCategory.PSYCHOLOGY,
                difficulty=ScenarioDifficulty.INTERMEDIATE,
                description="Master your emotions for consistent trading",
                content="""
# Trading Psychology

The most important factor in trading success is managing your emotions.

## Common Psychological Traps

### 1. Fear of Missing Out (FOMO)
Buying at the top because everyone else is buying.
**Solution**: Stick to your trading plan.

### 2. Revenge Trading
Trying to recover losses by making impulsive trades.
**Solution**: Take a break after losses.

### 3. Overconfidence
Increasing position sizes after wins.
**Solution**: Follow consistent position sizing.

### 4. Loss Aversion
Holding losing positions too long, hoping they'll recover.
**Solution**: Honor your stop losses.

## Building Mental Discipline
1. Keep a trading journal
2. Review your trades weekly
3. Set daily loss limits
4. Take regular breaks
                """,
                key_concepts=["FOMO", "Discipline", "Risk Management", "Trading Journal"],
                estimated_time_minutes=15
            ),
        ]
    
    def _create_default_scenarios(self) -> List[TradingScenario]:
        """Create default trading scenarios"""
        return [
            TradingScenario(
                id="scenario_bull_run",
                title="Bull Market Rally",
                description="Navigate a strong upward trend and maximize profits while managing risk",
                difficulty=ScenarioDifficulty.BEGINNER,
                scenario_type="bull_market",
                initial_balance=10000.0,
                target_profit_percent=15.0,
                max_drawdown_percent=10.0,
                time_limit_minutes=20,
                hints=[
                    "Look for pullbacks to enter positions",
                    "Trail your stop losses to lock in profits",
                    "Don't chase prices that have already moved significantly"
                ],
                optimal_strategy="Buy on pullbacks, use trailing stops"
            ),
            TradingScenario(
                id="scenario_crash",
                title="Market Crash",
                description="Survive a sudden market crash and minimize losses",
                difficulty=ScenarioDifficulty.INTERMEDIATE,
                scenario_type="crash",
                initial_balance=10000.0,
                starting_positions=[{"symbol": "BTC", "quantity": 0.05, "entry_price": 90000}],
                target_profit_percent=-5.0,  # Minimize losses
                max_drawdown_percent=15.0,
                time_limit_minutes=15,
                hints=[
                    "Quick exits are crucial in a crash",
                    "Consider short positions if available",
                    "Cash is a position too"
                ],
                optimal_strategy="Cut losses early, stay mostly in cash"
            ),
            TradingScenario(
                id="scenario_sideways",
                title="Range Trading",
                description="Profit from a sideways market using support and resistance",
                difficulty=ScenarioDifficulty.INTERMEDIATE,
                scenario_type="sideways",
                initial_balance=10000.0,
                target_profit_percent=8.0,
                max_drawdown_percent=10.0,
                time_limit_minutes=25,
                hints=[
                    "Identify clear support and resistance levels",
                    "Buy near support, sell near resistance",
                    "Use smaller position sizes in ranging markets"
                ],
                optimal_strategy="Range trade between support and resistance"
            ),
        ]
    
    async def get_user_progress(self, user_id: str) -> UserProgress:
        """Get or create user progress"""
        doc = await self.db.user_progress.find_one({"user_id": user_id}, {"_id": 0})
        if doc:
            return UserProgress(**doc)
        
        # Create new progress
        progress = UserProgress(user_id=user_id)
        progress.next_recommended = ["tut_welcome", "lesson_ta_basics"]
        await self.db.user_progress.insert_one(progress.model_dump())
        return progress
    
    async def complete_tutorial(self, user_id: str, tutorial_id: str) -> Dict:
        """Mark tutorial as completed and award XP"""
        progress = await self.get_user_progress(user_id)
        
        if tutorial_id in progress.completed_tutorials:
            return {"success": False, "message": "Tutorial already completed"}
        
        # Find tutorial
        tutorial = next((t for t in self.default_tutorials if t.id == tutorial_id), None)
        if not tutorial:
            return {"success": False, "error": "Tutorial not found"}
        
        # Award XP and update progress
        xp_earned = tutorial.rewards.get("xp", 100)
        progress.completed_tutorials.append(tutorial_id)
        progress.total_xp += xp_earned
        
        # Check for level up
        old_level = progress.current_level
        for i, required_xp in enumerate(self.LEVEL_XP):
            if progress.total_xp >= required_xp:
                progress.current_level = i + 1
        
        leveled_up = progress.current_level > old_level
        
        # Award badge if applicable
        if tutorial.rewards.get("badge"):
            progress.badges.append(tutorial.rewards["badge"])
        
        # Update skill scores based on category
        category_skill_map = {
            LessonCategory.BASICS: "market_analysis",
            LessonCategory.TECHNICAL_ANALYSIS: "technical_analysis",
            LessonCategory.RISK_MANAGEMENT: "risk_management",
            LessonCategory.PSYCHOLOGY: "trading_psychology",
            LessonCategory.TRADING_STRATEGIES: "strategy_development"
        }
        skill = category_skill_map.get(tutorial.category)
        if skill:
            progress.skills[skill] = min(100, progress.skills[skill] + 10)
        
        # Update recommendations
        progress.next_recommended = self._get_recommendations(progress)
        progress.updated_at = datetime.now(timezone.utc).isoformat()
        
        await self.db.user_progress.update_one(
            {"user_id": user_id},
            {"$set": progress.model_dump()}
        )
        
        return {
            "success": True,
            "xp_earned": xp_earned,
            "total_xp": progress.total_xp,
            "level": progress.current_level,
            "leveled_up": leveled_up,
            "badge": tutorial.rewards.get("badge"),
            "next_recommended": progress.next_recommended
        }
    
    async def complete_lesson(self, user_id: str, lesson_id: str, quiz_score: int = 0) -> Dict:
        """Mark lesson as completed"""
        progress = await self.get_user_progress(user_id)
        
        if lesson_id in progress.completed_lessons:
            return {"success": False, "message": "Lesson already completed"}
        
        lesson = next((l for l in self.default_lessons if l.id == lesson_id), None)
        if not lesson:
            return {"success": False, "error": "Lesson not found"}
        
        # Base XP + bonus for quiz score
        base_xp = 75
        quiz_bonus = int(quiz_score * 0.5)  # Up to 50 bonus XP
        xp_earned = base_xp + quiz_bonus
        
        progress.completed_lessons.append(lesson_id)
        progress.total_xp += xp_earned
        
        # Update skill
        category_skill_map = {
            LessonCategory.TECHNICAL_ANALYSIS: "technical_analysis",
            LessonCategory.RISK_MANAGEMENT: "risk_management",
            LessonCategory.PSYCHOLOGY: "trading_psychology",
            LessonCategory.TRADING_STRATEGIES: "strategy_development"
        }
        skill = category_skill_map.get(lesson.category)
        if skill:
            progress.skills[skill] = min(100, progress.skills[skill] + 15)
        
        progress.next_recommended = self._get_recommendations(progress)
        progress.updated_at = datetime.now(timezone.utc).isoformat()
        
        await self.db.user_progress.update_one(
            {"user_id": user_id},
            {"$set": progress.model_dump()}
        )
        
        return {
            "success": True,
            "xp_earned": xp_earned,
            "quiz_score": quiz_score,
            "total_xp": progress.total_xp
        }
    
    async def complete_scenario(self, user_id: str, scenario_id: str, 
                               final_balance: float, max_drawdown: float) -> Dict:
        """Complete a trading scenario and calculate score"""
        progress = await self.get_user_progress(user_id)
        
        scenario = next((s for s in self.default_scenarios if s.id == scenario_id), None)
        if not scenario:
            return {"success": False, "error": "Scenario not found"}
        
        # Calculate performance
        profit_percent = ((final_balance - scenario.initial_balance) / scenario.initial_balance) * 100
        
        # Calculate score
        score = 0
        feedback = []
        
        # Profit score (40%)
        if profit_percent >= scenario.target_profit_percent:
            profit_score = 40
            feedback.append("✅ Target profit achieved!")
        else:
            profit_score = max(0, int(40 * (profit_percent / scenario.target_profit_percent)))
            feedback.append(f"📊 Profit: {profit_percent:.1f}% (Target: {scenario.target_profit_percent}%)")
        score += profit_score
        
        # Risk management score (30%)
        if max_drawdown <= scenario.max_drawdown_percent:
            risk_score = 30
            feedback.append("✅ Risk well managed!")
        else:
            risk_score = max(0, int(30 * (scenario.max_drawdown_percent / max_drawdown)))
            feedback.append(f"⚠️ Drawdown: {max_drawdown:.1f}% (Max allowed: {scenario.max_drawdown_percent}%)")
        score += risk_score
        
        # Timing score (simulated) (20%)
        timing_score = random.randint(10, 20)
        score += timing_score
        
        # Learning objectives (10%)
        learning_score = 10 if score >= 50 else 5
        score += learning_score
        
        # Award XP based on score
        xp_earned = int(score * 2)  # Up to 200 XP
        
        # Record completion
        completion_record = {
            "scenario_id": scenario_id,
            "score": score,
            "profit_percent": profit_percent,
            "max_drawdown": max_drawdown,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        progress.completed_scenarios.append(completion_record)
        progress.total_xp += xp_earned
        progress.skills["strategy_development"] = min(100, progress.skills["strategy_development"] + 10)
        progress.updated_at = datetime.now(timezone.utc).isoformat()
        
        await self.db.user_progress.update_one(
            {"user_id": user_id},
            {"$set": progress.model_dump()}
        )
        
        # Award badge for high scores
        badge = None
        if score >= 90:
            badge = f"master_{scenario.scenario_type}"
            progress.badges.append(badge)
        
        return {
            "success": True,
            "score": score,
            "grade": "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D",
            "feedback": feedback,
            "xp_earned": xp_earned,
            "badge": badge
        }
    
    async def run_backtest(self, config: BacktestConfig) -> Dict:
        """Run a strategy backtest"""
        # Simulate backtest results
        await self.db.backtests.insert_one(config.model_dump())
        
        # Generate simulated results
        num_trades = random.randint(50, 200)
        win_rate = random.uniform(0.4, 0.65)
        winning_trades = int(num_trades * win_rate)
        losing_trades = num_trades - winning_trades
        
        avg_win = random.uniform(2, 5)
        avg_loss = random.uniform(1, 3)
        
        total_profit = (winning_trades * avg_win) - (losing_trades * avg_loss)
        total_return = (total_profit / config.initial_capital) * 100
        
        max_drawdown = random.uniform(5, 20)
        sharpe_ratio = random.uniform(0.5, 2.5)
        
        results = {
            "total_trades": num_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": win_rate * 100,
            "avg_win_percent": avg_win,
            "avg_loss_percent": avg_loss,
            "total_return_percent": total_return,
            "max_drawdown_percent": max_drawdown,
            "sharpe_ratio": sharpe_ratio,
            "profit_factor": (winning_trades * avg_win) / (losing_trades * avg_loss) if losing_trades > 0 else 0,
            "final_balance": config.initial_capital * (1 + total_return / 100),
            "equity_curve": self._generate_equity_curve(config.initial_capital, total_return, num_trades)
        }
        
        config.status = "completed"
        config.results = results
        
        await self.db.backtests.update_one(
            {"id": config.id},
            {"$set": {"status": "completed", "results": results}}
        )
        
        return results
    
    def _generate_equity_curve(self, initial: float, total_return: float, 
                               num_points: int = 100) -> List[Dict]:
        """Generate simulated equity curve data"""
        curve = []
        current = initial
        step_return = total_return / num_points
        
        for i in range(num_points):
            # Add some randomness
            variation = random.uniform(-2, 2)
            current = current * (1 + (step_return + variation) / 100)
            curve.append({
                "index": i,
                "equity": round(current, 2),
                "drawdown": max(0, (max(c["equity"] for c in curve + [{"equity": current}]) - current) / max(c["equity"] for c in curve + [{"equity": current}]) * 100) if curve else 0
            })
        
        return curve
    
    def _get_recommendations(self, progress: UserProgress) -> List[str]:
        """Get personalized recommendations based on progress"""
        recommendations = []
        
        # Recommend tutorials not yet completed
        for tutorial in self.default_tutorials:
            if tutorial.id not in progress.completed_tutorials:
                # Check prerequisites
                prereqs_met = all(p in progress.completed_tutorials for p in tutorial.prerequisites)
                if prereqs_met:
                    recommendations.append(tutorial.id)
        
        # Recommend lessons based on skill gaps
        weakest_skill = min(progress.skills, key=progress.skills.get)
        for lesson in self.default_lessons:
            if lesson.id not in progress.completed_lessons:
                category_skill_map = {
                    LessonCategory.TECHNICAL_ANALYSIS: "technical_analysis",
                    LessonCategory.RISK_MANAGEMENT: "risk_management",
                    LessonCategory.PSYCHOLOGY: "trading_psychology"
                }
                if category_skill_map.get(lesson.category) == weakest_skill:
                    recommendations.append(lesson.id)
        
        # Recommend scenarios based on skill level
        for scenario in self.default_scenarios:
            scenario_record = next((s for s in progress.completed_scenarios if s["scenario_id"] == scenario.id), None)
            if not scenario_record or scenario_record.get("score", 0) < 80:
                recommendations.append(scenario.id)
        
        return recommendations[:5]  # Return top 5 recommendations
    
    async def get_all_content(self) -> Dict:
        """Get all available training content"""
        return {
            "tutorials": [t.model_dump() for t in self.default_tutorials],
            "lessons": [l.model_dump() for l in self.default_lessons],
            "scenarios": [s.model_dump() for s in self.default_scenarios]
        }
