# Cognitive Oracle Trading Platform - Product Requirements Document

## Original Problem Statement
Build a state-of-the-art "Cognitive Oracle Trading Platform" with:
- Glassmorphism design with ephemeral UI
- Voice-first interface, facial recognition, and gesture control
- Multi-agent AI consensus system and "Oracle" memory for historical trade lookups

## User Personas
1. **Active Traders** - Professional day traders seeking AI-assisted insights
2. **Crypto Enthusiasts** - Users interested in market trends and social signals
3. **Portfolio Managers** - Users tracking multiple positions and performance

## Core Requirements

### Phase 1 (MVP) ✅ COMPLETE
- Dashboard with real-time market data
- Paper trading functionality
- Basic AI agent consensus system

### Phase 2 ✅ COMPLETE
- Real webcam facial recognition (TensorFlow.js)
- WebSocket for live prices (CoinGecko)
- User Authentication (Google OAuth)
- Social/copy trading
- Advanced candlestick charts
- Portfolio analytics

### Phase 3 ✅ COMPLETE
- Mobile responsive optimization
- Price alert notifications
- Advanced order types (limit, stop-loss)
- Live newsfeed
- Auto-trading capabilities
- Individual user portal with wallet

### Phase 4 ✅ COMPLETE
- Trading history export (CSV/PDF)
- Multi-language support (i18next)
- Real-time trade crawler

### Phase 5 ✅ COMPLETE
- 3D interactive voice trading avatar (Three.js/SVG)
- Real blockchain API for whale alerts
- Browser push notifications
- Theme toggle (Dark/Light/Matrix)
- Voice-activated trading commands ("Buy 1 BTC")
- OpenAI TTS for avatar voice synthesis

### Phase 6 ✅ COMPLETE (Jan 21, 2026)
- **Trading Journal** - Daily/weekly performance summaries with AI insights
- **Portfolio Leaderboard** - Top traders ranking with follow functionality
- **Social Signals** - Fear & Greed Index and trending topics analysis
- **Enhanced Webcam Facial Tracking** - MediaPipe 468-point face mesh mirroring

## Technical Architecture

### Frontend (React)
- **UI Framework:** React with TailwindCSS
- **Components:** Shadcn/UI, custom glassmorphism components
- **3D/Animation:** Three.js (avatar), Framer Motion
- **AI Vision:** MediaPipe Face Mesh, TensorFlow.js
- **i18n:** i18next with EN/ES/FR/DE/ZH/JA support
- **Charts:** Recharts
- **State:** React Context (Auth, Theme)

### Backend (FastAPI)
- **Framework:** FastAPI with async/await
- **Database:** MongoDB
- **WebSocket:** Real-time price updates
- **Auth:** Google OAuth (Emergent-managed)
- **AI:** OpenAI TTS integration (Emergent LLM Key)

### Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard | ✅ Working | Real-time market data |
| Paper Trading | ✅ Working | Full CRUD |
| Price Alerts | ✅ Working | Push notifications |
| Advanced Orders | ✅ Working | Limit, Stop-Loss |
| Auto-Trading | ✅ Working | AI-powered |
| 3D Avatar | ✅ Working | SVG face mesh with voice |
| Voice Commands | ✅ Working | "Buy 1 BTC" etc. |
| Trading Journal | ✅ Working | Daily/weekly with AI insights |
| Leaderboard | ✅ Working | Top traders ranking |
| Social Signals | ✅ Working | Fear & Greed, trending |
| Face Tracking | ✅ Working | MediaPipe 468-point mesh |

### API Endpoints

**Trading Journal:**
- `GET /api/journal/daily-summary?date={date}&include_audio={bool}`
- `GET /api/journal/weekly-summary`
- `POST /api/journal/add-note?date={date}&note={note}`

**Portfolio Leaderboard:**
- `GET /api/portfolios/public?sort_by={field}`
- `GET /api/portfolios/{id}`
- `POST /api/portfolios/{id}/follow`

**Social Signals:**
- `GET /api/social/trending`
- `GET /api/social/sentiment/{symbol}`

**Avatar:**
- `POST /api/avatar/insight`
- `POST /api/avatar/tts`
- `POST /api/trading/voice-command`

## Mocked Features
- Social media signals (Twitter/Reddit) - simulated data
- Leaderboard portfolios - simulated trader data
- CoinGecko fallback - simulated when rate limited

## Future Backlog (P7+)
- Full React Native mobile app
- Real Twitter/Reddit API integration (pending API keys)
- Advanced ML models for prediction
- Gamification features

## Test Coverage
- **Backend:** 28+ pytest tests covering all P6 APIs
- **Frontend:** E2E tests via Playwright
- **Test Reports:** `/app/test_reports/iteration_*.json`

---
*Last Updated: January 21, 2026*
*Status: P6 Complete - All features tested and working*
