# Cognitive Oracle Trading Platform - PRD

## Original Problem Statement
Build a state-of-the-art Cognitive Oracle Trading Platform - an enterprise-level system combining AI agents, real-time voice interfaces, facial recognition, gesture control, and ephemeral glassmorphic UI with XTrend speed trading, eToro, and TradingView capabilities.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM Key for multi-agent consensus
- **Voice**: Web Speech API (browser-native)
- **Database**: MongoDB for trades, status checks

## User Personas
1. **Hedge Fund Traders**: Need fast execution, AI-driven analysis, hands-free trading
2. **Academic Researchers**: Need historical data, pattern analysis, oracle memory
3. **Professional Day Traders**: Need real-time markets, quick execution, multi-screen support

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

## What's Been Implemented (Jan 21, 2025)
### Frontend Components
- SplashScreen with Matrix falling characters animation
- LiveMarkets panel (BTC, ETH, SPY prices)
- TradingChart with Recharts (BTC/ETH)
- FacialRecognition panel with mood cycling
- GestureRecognition with gesture buttons
- AgentConsensus with animated voting
- OracleMemory with historical data lookup
- VoicePanel with Web Speech API + simulated commands
- StatusBar and ControlPanel
- GlassCard, NeonButton, StatusBadge UI components

### Backend Endpoints
- GET /api/ - Platform info
- GET /api/market/prices - All market prices
- GET /api/market/{symbol} - Single symbol price
- GET /api/market/{symbol}/history - Price history for charts
- POST /api/agents/consensus - Multi-agent AI consensus (GPT-5.2)
- POST /api/oracle/query - Oracle memory lookup
- POST /api/voice/parse - Voice command parsing
- POST /api/trades/execute - Trade execution
- GET /api/trades/history - Trade history
- GET /api/user/mood - Mood analysis
- GET /api/gestures/detected - Gesture detection
- GET /api/portfolio/summary - Portfolio summary

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Core dashboard layout
- [x] Real-time market data
- [x] Multi-agent consensus
- [x] Voice commands
- [x] Ephemeral UI

### P1 - Important (Next Phase)
- [ ] Real webcam facial recognition (TensorFlow.js)
- [ ] Real webcam gesture detection (MediaPipe)
- [ ] WebSocket for real-time price streaming
- [ ] User authentication (JWT/OAuth)
- [ ] Persistent trade history

### P2 - Nice to Have
- [ ] Social trading (eToro-style copy trading)
- [ ] Advanced TradingView charting integration
- [ ] Push notifications
- [ ] Mobile responsive optimization
- [ ] Dark/Light theme toggle

## Next Tasks
1. Implement real camera-based facial recognition
2. Add WebSocket for live price updates
3. User authentication system
4. Advanced charting with candlestick patterns
5. Portfolio analytics dashboard

## Technical Notes
- Market data is simulated for demo (can integrate CoinGecko/Alpha Vantage)
- Agent consensus has fallback to simulation when AI unavailable
- Voice uses Web Speech API with demo simulation option
