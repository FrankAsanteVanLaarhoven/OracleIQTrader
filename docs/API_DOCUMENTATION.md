# OracleIQTrader API Documentation

## Overview

The OracleIQTrader API provides programmatic access to our institutional-grade trading platform. This API enables you to:

- Execute trades across multiple asset classes
- Access real-time market data
- Manage portfolios and positions
- Set price alerts
- Use AI trading agents
- Subscribe to copy trading signals
- Access risk analytics

**Base URL:** `https://api.oracleiqtrader.com/api`

**Authentication:** All authenticated endpoints require a Bearer token in the Authorization header.

---

## Authentication

### API Keys

Generate API keys from the OracleIQ dashboard under **Settings > API Keys**.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.oracleiqtrader.com/api/account/balance
```

### Rate Limits

| Tier | Requests/min | Requests/day |
|------|-------------|--------------|
| Free | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Enterprise | 1,000 | Unlimited |

---

## Endpoints

### Market Data

#### GET /market/prices
Get real-time prices for specified assets.

**Parameters:**
- `symbols` (required): Comma-separated list of symbols

**Response:**
```json
{
  "BTC": {
    "price": 45123.45,
    "change_24h": 2.34,
    "volume": 28947238947,
    "high_24h": 46000.00,
    "low_24h": 44500.00
  }
}
```

#### GET /market/history
Get historical price data.

**Parameters:**
- `symbol` (required): Asset symbol
- `interval`: 1m, 5m, 15m, 1h, 4h, 1d, 1w (default: 1d)
- `start`: Start timestamp (ISO 8601)
- `end`: End timestamp (ISO 8601)
- `limit`: Number of candles (max 1000)

---

### Trading

#### POST /orders
Place a new order.

**Request Body:**
```json
{
  "symbol": "BTC",
  "side": "buy",
  "type": "limit",
  "quantity": 0.5,
  "price": 45000.00,
  "time_in_force": "GTC",
  "stop_loss": 44000.00,
  "take_profit": 48000.00
}
```

**Response:**
```json
{
  "order_id": "ORD-ABC123",
  "status": "pending",
  "created_at": "2026-01-30T12:00:00Z"
}
```

#### GET /orders/{order_id}
Get order details.

#### DELETE /orders/{order_id}
Cancel an order.

#### GET /orders
List all orders.

**Parameters:**
- `status`: open, filled, cancelled, all
- `symbol`: Filter by symbol
- `limit`: Max results (default: 50)

---

### Portfolio

#### GET /portfolio/positions
Get current positions.

**Response:**
```json
{
  "positions": [
    {
      "symbol": "BTC",
      "quantity": 0.5,
      "entry_price": 44500.00,
      "current_price": 45123.45,
      "unrealized_pnl": 311.73,
      "unrealized_pnl_pct": 1.40
    }
  ],
  "total_value": 127432.50,
  "total_pnl": 2340.50,
  "total_pnl_pct": 1.87
}
```

#### GET /portfolio/history
Get portfolio value history.

---

### AI Trading Agents

#### GET /agents/templates
Get available agent templates.

#### GET /agents
List your agents.

#### POST /agents
Create a new agent.

**Request Body:**
```json
{
  "name": "My Momentum Bot",
  "strategy": "momentum",
  "risk_tolerance": 70,
  "position_size_pct": 15,
  "stop_loss_pct": 4.0,
  "take_profit_pct": 12.0,
  "allowed_assets": ["BTC", "ETH", "SOL"]
}
```

#### POST /agents/{agent_id}/activate
Activate an agent.

#### POST /agents/{agent_id}/pause
Pause an agent.

#### POST /agents/{agent_id}/analyze
Request market analysis from agent.

---

### Copy Trading

#### GET /copy-trading/traders
Get list of available master traders.

**Response:**
```json
{
  "traders": [
    {
      "id": "MTR-001",
      "name": "Bridgewater Alpha",
      "win_rate": 68.5,
      "total_return_ytd": 34.2,
      "followers": 1247,
      "min_follow_amount": 100
    }
  ]
}
```

#### POST /copy-trading/follow
Start following a trader.

**Request Body:**
```json
{
  "trader_id": "MTR-001",
  "copy_ratio": 0.5,
  "max_trade_size": 1000.00
}
```

#### DELETE /copy-trading/follow/{trader_id}
Stop following a trader.

---

### Pricing & Fees

#### GET /pricing/fee-schedule
Get complete fee schedule.

#### POST /pricing/estimate
Get cost estimate for an order.

**Request Body:**
```json
{
  "asset": "BTC",
  "asset_class": "crypto",
  "side": "buy",
  "quantity": 0.5,
  "current_price": 45000,
  "tier": "pro"
}
```

---

### WebSocket Streams

Connect to real-time data streams.

**URL:** `wss://api.oracleiqtrader.com/ws`

#### Subscribe to Price Updates
```json
{
  "action": "subscribe",
  "channel": "prices",
  "symbols": ["BTC", "ETH", "SOL"]
}
```

#### Subscribe to Order Updates
```json
{
  "action": "subscribe",
  "channel": "orders"
}
```

#### Subscribe to Copy Trading
```json
{
  "action": "subscribe",
  "channel": "copy_trading"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Symbol 'XYZ' is not supported",
    "details": {}
  }
}
```

---

## SDKs

### Python

```bash
pip install oracleiq-python
```

```python
from oracleiq import OracleIQClient

client = OracleIQClient(api_key="YOUR_API_KEY")

# Get prices
prices = client.market.get_prices(["BTC", "ETH"])

# Place order
order = client.orders.create(
    symbol="BTC",
    side="buy",
    type="limit",
    quantity=0.5,
    price=45000.00
)

# Get portfolio
portfolio = client.portfolio.positions()
```

### JavaScript/TypeScript

```bash
npm install @oracleiq/sdk
```

```typescript
import { OracleIQClient } from '@oracleiq/sdk';

const client = new OracleIQClient({ apiKey: 'YOUR_API_KEY' });

// Get prices
const prices = await client.market.getPrices(['BTC', 'ETH']);

// Place order
const order = await client.orders.create({
  symbol: 'BTC',
  side: 'buy',
  type: 'limit',
  quantity: 0.5,
  price: 45000.00
});

// Subscribe to WebSocket
client.ws.subscribe('prices', ['BTC', 'ETH'], (data) => {
  console.log('Price update:', data);
});
```

---

## White-Label Integration

OracleIQ offers white-label solutions for institutional clients.

### Features

- Custom branding and domain
- Private API endpoints
- Dedicated support
- Custom fee structures
- Compliance integration
- Multi-tenant architecture

### Contact

For white-label inquiries: **enterprise@oracleiqtrader.com**

---

## Changelog

### v2.0.0 (2026-01-30)
- Added AI Trading Agents API
- Added Copy Trading WebSocket
- Added Glass-Box Pricing endpoints
- New execution audit trail endpoints

### v1.5.0 (2025-12-15)
- Added prediction markets endpoints
- Added supply chain trading
- Improved rate limits

### v1.0.0 (2025-10-01)
- Initial release
