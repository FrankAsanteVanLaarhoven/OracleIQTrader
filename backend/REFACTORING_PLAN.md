# OracleIQTrader Backend Refactoring Plan

## Current State
- **server.py**: 4,116 lines, 170+ routes
- **Problem**: Monolithic file violates single-responsibility principle, hard to maintain

## Target Architecture
```
/app/backend/
├── server.py              # Main app, middleware, startup (< 500 lines)
├── routes/
│   ├── __init__.py        # Route aggregation
│   ├── auth.py            # Authentication routes (3 routes)
│   ├── market.py          # Market data routes (3 routes)
│   ├── trading.py         # Trading execution routes
│   ├── bot.py             # AI Bot routes (9 routes)
│   ├── ml.py              # ML prediction routes (19 routes)
│   ├── tournament.py      # Tournament routes (8 routes)
│   ├── competition.py     # Competition routes (12 routes)
│   ├── playground.py      # Paper trading routes (6 routes)
│   ├── journal.py         # Trading journal routes (3 routes)
│   ├── crawler.py         # Signal crawler routes (5 routes)
│   ├── social.py          # Social media routes (11 routes)
│   ├── exchange.py        # Real exchange routes (11 routes)
│   ├── demo.py            # Demo mode routes (10 routes)
│   ├── quant.py           # ✅ COMPLETED - Quantitative research (25 routes)
│   ├── alerts.py          # Alert routes (3 routes)
│   ├── portfolio.py       # Portfolio routes (3 routes)
│   ├── avatar.py          # 3D Avatar routes (4 routes)
│   ├── news.py            # News integration routes (4 routes)
│   └── export.py          # Data export routes (3 routes)
├── models/
│   ├── __init__.py
│   ├── user.py            # User Pydantic models
│   ├── trade.py           # Trade/Order models
│   └── ...
└── modules/               # Business logic (existing, keep as-is)
```

## Migration Steps

### Phase 1: Create Route Files (CURRENT)
1. ✅ Created `/app/backend/routes/quant.py` - Quantitative Research routes
2. Create remaining route files following same pattern

### Phase 2: Update server.py
1. Import route routers from `/app/backend/routes/`
2. Include routers with `app.include_router(router, prefix="/api")`
3. Remove migrated routes from server.py
4. Keep shared utilities, middleware, and startup code

### Phase 3: Extract Pydantic Models
1. Move all Pydantic models to `/app/backend/models/`
2. Import models in route files

### Phase 4: Cleanup
1. Remove dead code from server.py
2. Update imports
3. Run full test suite

## Route Migration Template

```python
# routes/example.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

router = APIRouter()

@router.get("/endpoint")
async def get_endpoint():
    """Endpoint description"""
    return {"data": "value"}
```

## Integration in server.py

```python
# In server.py
from routes.quant import router as quant_router
from routes.ml import router as ml_router
# ... other routers

api_router.include_router(quant_router, prefix="/quant", tags=["Quantitative"])
api_router.include_router(ml_router, prefix="/ml", tags=["Machine Learning"])
```

## Priority Order
1. **High Impact** (largest route groups):
   - quant.py (25 routes) ✅ DONE
   - ml.py (19 routes)
   - competition.py (12 routes)
   - social.py (11 routes)
   - exchange.py (11 routes)
   
2. **Medium Impact**:
   - demo.py (10 routes)
   - bot.py (9 routes)
   - tournament.py (8 routes)
   
3. **Low Impact** (smaller groups):
   - playground.py, crawler.py, news.py, avatar.py, etc.

## Notes
- Keep server.py functional during migration (routes work from both locations)
- Test each migrated route group before removing from server.py
- Maintain backwards compatibility with frontend API calls
- All routes keep `/api` prefix via api_router

## Estimated Effort
- Full migration: ~2-3 hours
- Can be done incrementally without breaking changes
