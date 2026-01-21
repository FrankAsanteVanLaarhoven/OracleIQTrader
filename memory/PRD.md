# Cognitive Oracle Trading Platform - Product Requirements Document

## Original Problem Statement
Build a state-of-the-art "Cognitive Oracle Trading Platform" with:
- Glassmorphism design with ephemeral UI
- Voice-first interface, facial recognition, and gesture control
- Multi-agent AI consensus system and "Oracle" memory for historical trade lookups
- Production-ready trading capabilities with paper trading, AI bots, and training
- Next-phase features: ML predictions, trading competitions, news alerts, mobile app

## User Personas
1. **Beginner Traders** - Users learning to trade through tutorials and paper trading
2. **Active Traders** - Professional day traders seeking AI-assisted insights
3. **Crypto Enthusiasts** - Users interested in market trends and social signals
4. **Algorithmic Traders** - Users deploying autonomous AI trading bots
5. **Competitive Traders** - Users participating in trading competitions

## Core Requirements

### Phase 1-6 ✅ COMPLETE (Previous)
- Dashboard, real-time market data, paper trading
- Facial recognition, WebSocket, Google OAuth
- Social trading, charts, portfolio analytics
- Price alerts, advanced orders, newsfeed, auto-trading
- Trading history export, multi-language support
- 3D avatar, voice commands, theme toggle
- Trading Journal, Leaderboard, Social Signals

### Phase 7 ✅ COMPLETE (Jan 21, 2026)
**Production-Ready Trading Platform**

#### Trading Playground (Paper Trading 2.0)
- Virtual $100,000 starting balance
- Real-time order execution with slippage simulation
- Position management with P&L tracking
- Stop loss and take profit support
- Trade history and account reset
- Playground leaderboard

#### Autonomous AI Trading Bot
- Three strategy modes: Conservative, Moderate, Aggressive
- Risk management: Max trade size, daily loss limits, stop loss/take profit
- Operating modes: Full Auto, Semi Auto, Paused
- Real-time market analysis with technical indicators
- Signal generation with confidence scoring

#### Interactive Training System
- Tutorials, Lessons, Scenarios, Backtesting
- Progress tracking with XP, levels, and badges
- Skill development across 5 areas

### Phase 7.5 ✅ COMPLETE (Jan 21, 2026)
**Next Phase Features - ML, Competitions, News**

#### ML Predictions
- Comprehensive predictions for BTC, ETH, SOL, XRP, ADA, DOGE
- Time horizons: 1 Hour, 4 Hours, 24 Hours, 1 Week
- Price Direction with confidence and targets
- Volatility Forecast (very_low to extreme)
- Trend Analysis (strong_bullish to strong_bearish)
- AI Analysis with key factors and risks
- Trade setup suggestions (entry, stop loss, take profit, position size)
- Model accuracy statistics

#### Trading Competitions
- Daily Challenges (24-hour highest return)
- Weekly Tournaments (week-long competitions)
- Themed Events:
  - 🐻 Bear Market Survival (lowest drawdown wins)
  - 🚀 Moon Mission (maximum returns)
  - ✋ Steady Hands (best Sharpe ratio)
  - ⚡ Speed Trader (4-hour blitz)
- User tiers: Bronze, Silver, Gold, Platinum, Diamond
- XP rewards and badges for top finishers
- Global leaderboard by tier points

#### Benzinga News Alerts (PLACEHOLDER)
- Breaking news alerts with sentiment
- Category filtering (ETF, Macro, Regulatory, Network, etc.)
- Bullish/Bearish/High Impact filters
- News feed with source and timestamp
- *Note: Uses simulated data until API key provided*

## Technical Architecture

### Backend Structure
```
/app/backend/
├── server.py                      # Main FastAPI app
├── modules/
│   ├── __init__.py
│   ├── trading_playground.py      # Paper trading engine
│   ├── autonomous_bot.py          # AI bot engine
│   ├── training_system.py         # Training/education
│   ├── exchange_integration.py    # Binance adapter
│   ├── social_integration.py      # Twitter/Reddit
│   ├── additional_exchanges.py    # Coinbase/Kraken (structure)
│   ├── ml_prediction.py           # ML prediction engine
│   └── trading_competition.py     # Competition engine
└── tests/
    ├── test_p6_features.py
    ├── test_production_features.py
    └── test_ml_competitions.py
```

### Frontend Structure
```
/app/frontend/src/components/
├── MLPredictions.jsx         # ML predictions UI
├── TradingCompetitions.jsx   # Competition UI
├── BenzingaNews.jsx          # News alerts UI (placeholder)
├── TradingPlayground.jsx     # Paper trading UI
├── AutonomousBot.jsx         # AI bot management
├── TrainingCenter.jsx        # Training UI
└── ... (45+ components)
```

### Key API Endpoints

**ML Predictions:**
- `GET /api/ml/predict/comprehensive/{symbol}` - Full prediction
- `GET /api/ml/predict/direction/{symbol}` - Price direction
- `GET /api/ml/predict/volatility/{symbol}` - Volatility forecast
- `GET /api/ml/predict/trend/{symbol}` - Trend analysis
- `GET /api/ml/accuracy` - Model accuracy stats

**Trading Competitions:**
- `GET /api/competition/active` - Active competitions
- `POST /api/competition/create/daily` - Create daily challenge
- `POST /api/competition/create/themed?theme={theme}` - Create themed event
- `POST /api/competition/{id}/join` - Join competition
- `GET /api/competition/{id}/leaderboard` - Competition leaderboard
- `GET /api/competition/user/stats` - User competition stats
- `GET /api/competition/global/leaderboard` - Global rankings

## Test Coverage
- **Backend:** 78+ pytest tests (100% pass rate)
- **Test Reports:** `/app/test_reports/iteration_*.json`
- **Latest:** iteration_10.json (18 tests for ML/Competitions)

## Mocked/Simulated Features
- **Benzinga News** - Simulated until API key provided
- **ML Predictions** - Uses simulated technical indicators (RSI, MACD, etc.)
- **Social media signals** - Simulated until API keys provided
- **Exchange trading** - Uses testnet by default

## Configuration Required for Production
1. **Benzinga API** - API key for real news feeds
2. **Twitter API** - Bearer token for real tweets
3. **Reddit API** - Client ID/secret for real posts
4. **Binance API** - API key/secret for real trading
5. **Additional Exchanges** - Coinbase/Kraken API keys

## Future Backlog (P8+)

### Priority 0 (Next)
- **React Native Mobile App** - User requested as priority
  - Scaffolding in `/app/mobile/`
  - Core trading features
  - Push notifications

### Priority 1
- Coinbase/Kraken exchange adapters with testnet support
- UI for managing exchange & social media API keys in settings

### Priority 2
- Real ML model training (scikit-learn/pytorch)
- Real Twitter/Reddit API integration
- Custom ML model deployment

---
*Last Updated: January 21, 2026*
*Status: P7.5 Complete - ML Predictions, Trading Competitions, Benzinga News integrated*
