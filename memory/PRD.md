# Cognitive Oracle Trading Platform - PRD

## Original Problem Statement
Build a state-of-the-art Cognitive Oracle Trading Platform - an enterprise-level system combining AI agents, real-time voice interfaces, facial recognition, gesture control, and ephemeral glassmorphic UI with XTrend speed trading, eToro, and TradingView capabilities.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM Key for multi-agent consensus
- **Voice**: Web Speech API (browser-native)
- **Market Data**: CoinGecko API (real crypto), simulated stocks
- **Auth**: Google OAuth via Emergent Auth
- **Real-time**: WebSocket with REST fallback
- **Database**: MongoDB for users, sessions, trades

## User Personas
1. **Hedge Fund Traders**: Fast execution, AI analysis, hands-free trading
2. **Academic Researchers**: Historical data, pattern analysis, oracle memory
3. **Professional Day Traders**: Real-time markets, quick execution

## Core Requirements (Static)
- [x] Glassmorphism Design (Apple Liquid Glass aesthetic)
- [x] Matrix-style animated background
- [x] Ephemeral UI elements (fade after 5 seconds)
- [x] Voice-First Interface
- [x] Facial Recognition with mood detection
- [x] Gesture Recognition
- [x] Multi-Agent Consensus System
- [x] Oracle Memory System
- [x] Real-time status badges
- [x] TradingView-style charts

## P1 Features Implemented (Jan 21, 2025)
- [x] **Real Webcam Facial Recognition** - Camera toggle, face mesh visualization, mood detection UI
- [x] **WebSocket Live Prices** - Real-time streaming with REST fallback
- [x] **Google OAuth Authentication** - Emergent Auth integration, login page, user menu
- [x] **CoinGecko Real Market Data** - BTC, ETH, SOL, XRP, DOGE, ADA with live prices

## What's Been Implemented

### Frontend Components
- SplashScreen with Matrix animation
- LoginPage with Google OAuth
- AuthCallback for OAuth flow
- UserMenu with logout
- WebcamFacialRecognition with camera toggle
- LiveMarketsRealtime with WebSocket + CoinGecko
- TradingChart (BTC/ETH)
- AgentConsensus with animated voting
- OracleMemory lookup
- VoicePanel with Web Speech API
- GestureRecognition
- StatusBar, ControlPanel
- GlassCard, NeonButton, StatusBadge UI components

### Backend Endpoints
- GET /api/ - Platform info
- GET /api/market/prices - Real CoinGecko + simulated stocks
- GET /api/market/{symbol} - Single symbol price
- GET /api/market/{symbol}/history - Price history
- POST /api/agents/consensus - Multi-agent AI consensus
- POST /api/oracle/query - Oracle memory
- POST /api/voice/parse - Voice command parsing
- POST /api/trades/execute - Trade execution
- GET /api/trades/history - Trade history
- POST /api/auth/session - OAuth session exchange
- GET /api/auth/me - Current user
- POST /api/auth/logout - Logout
- GET /api/portfolio/summary - Portfolio
- WS /ws/prices - WebSocket price streaming

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Core dashboard layout
- [x] Real-time market data (CoinGecko)
- [x] Multi-agent consensus
- [x] Voice commands
- [x] Ephemeral UI

### P1 - Important (Done)
- [x] Real webcam facial recognition UI
- [x] WebSocket for real-time streaming
- [x] Google OAuth authentication
- [x] Real market data from CoinGecko

### P2 - Nice to Have (Next Phase)
- [ ] Social trading (eToro-style copy trading)
- [ ] Advanced TradingView charting integration
- [ ] Push notifications
- [ ] Mobile responsive optimization
- [ ] Full TensorFlow.js mood analysis ML model

## Next Tasks
1. Implement social/copy trading features
2. Advanced candlestick charting
3. Portfolio analytics dashboard
4. Mobile optimization
5. Real ML-based facial expression analysis

## Technical Notes
- CoinGecko free tier: 5-15 calls/min (cached 30s)
- WebSocket falls back to REST polling if connection fails
- OAuth uses Emergent Auth (no Google credentials needed)
- Facial recognition shows camera feed + simulated mood (real ML optional)
