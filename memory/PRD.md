# Cognitive Oracle Trading Platform - PRD

## Original Problem Statement
Build a state-of-the-art Cognitive Oracle Trading Platform - an enterprise-level system combining AI agents, real-time voice interfaces, facial recognition, gesture control, and ephemeral glassmorphic UI with XTrend speed trading, eToro, and TradingView capabilities.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM Key, TensorFlow.js for facial analysis
- **Voice**: Web Speech API (browser-native)
- **Market Data**: CoinGecko API (real crypto), simulated stocks
- **Auth**: Google OAuth via Emergent Auth
- **Real-time**: WebSocket with REST fallback
- **Database**: MongoDB for users, sessions, trades

## Core Features Implemented

### P0 - MVP (Complete)
- [x] Glassmorphism Design (Apple Liquid Glass aesthetic)
- [x] Matrix-style animated background
- [x] Ephemeral UI elements (fade after 5 seconds)
- [x] Voice-First Interface
- [x] Facial Recognition with mood detection
- [x] Gesture Recognition
- [x] Multi-Agent Consensus System (GPT-5.2)
- [x] Oracle Memory System
- [x] Real-time status badges
- [x] TradingView-style charts

### P1 - Important (Complete)
- [x] Real Webcam Facial Recognition UI
- [x] WebSocket Live Prices with REST fallback
- [x] Google OAuth Authentication
- [x] CoinGecko Real Market Data

### P2 - Advanced (Complete - Jan 21, 2025)
- [x] **Social/Copy Trading** - eToro-style top traders (CryptoWhale, TechBull, QuantMaster, SteadyEddie)
- [x] **Advanced Candlestick Charts** - RSI indicator, SMA7/SMA21 moving averages, timeframe selectors
- [x] **Portfolio Analytics** - Performance charts, allocation pie chart, position tracking
- [x] **TensorFlow.js Facial Recognition** - AI Vision with expression detection
- [x] **Paper Trading Mode** - $100k virtual funds, practice trading, localStorage persistence

## Navigation Structure
1. **Trading** - Main dashboard with charts, AI vision, voice panel, agent consensus
2. **Social** - Copy trading with top traders, filters (Low Risk, High Return, Verified)
3. **Portfolio** - Analytics with total value, daily P&L, allocation breakdown
4. **Paper Trade** - Virtual trading with $100k balance, BUY/SELL execution

## Frontend Components
- SplashScreen, MatrixBackground
- LoginPage, AuthCallback, UserMenu (OAuth flow)
- TensorFlowFacialRecognition (AI vision)
- CandlestickChart (RSI, SMA indicators)
- LiveMarketsRealtime (WebSocket + CoinGecko)
- SocialTrading (copy traders)
- PortfolioAnalytics (performance + allocation)
- PaperTradingPanel ($100k virtual)
- AgentConsensus, OracleMemory, VoicePanel
- GestureRecognition, StatusBar, ControlPanel

## Backend Endpoints
- Market: `/api/market/prices`, `/api/market/{symbol}`, `/api/market/{symbol}/history`
- AI: `/api/agents/consensus`, `/api/oracle/query`
- Voice: `/api/voice/parse`
- Trades: `/api/trades/execute`, `/api/trades/history`
- Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/logout`
- Portfolio: `/api/portfolio/summary`
- WebSocket: `/ws/prices`

## Tech Stack
- React 19 + Framer Motion + Recharts
- FastAPI + MongoDB + Motor
- TensorFlow.js (facial recognition)
- CoinGecko API (crypto prices)
- Emergent Auth (Google OAuth)
- Emergent LLM Key (GPT-5.2)

## Testing Results
- Overall: 95% success rate
- All P2 features working
- Minor: WebGL warnings (CPU fallback works)
- Minor: WebSocket fallback to REST (data still updates)

## Next Tasks (P3)
1. Mobile responsive optimization
2. Push notifications for price alerts
3. Advanced order types (limit, stop-loss)
4. Trading history export (CSV)
5. Real ML model for expression analysis
