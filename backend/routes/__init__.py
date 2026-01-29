# OracleIQTrader Backend Routes
# This directory contains modular route handlers organized by feature

from fastapi import APIRouter

# Create a main router that combines all sub-routers
def create_routes_router():
    """Create and return the combined routes router"""
    from routes.quant import router as quant_router
    
    combined_router = APIRouter()
    combined_router.include_router(quant_router, prefix="/quant", tags=["Quantitative Research"])
    
    return combined_router
