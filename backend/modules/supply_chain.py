# OracleIQTrader - Supply Chain Trading Engine
# Prediction Markets + SCF Derivatives + Risk Signals for Supply Chain Events

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import uuid
import random
import math

class SupplyChainEventType(str, Enum):
    PORT_CONGESTION = "port_congestion"
    SUPPLIER_DELAY = "supplier_delay"
    TARIFF_CHANGE = "tariff_change"
    COMMODITY_SHORTAGE = "commodity_shortage"
    GEOPOLITICAL = "geopolitical"
    WEATHER_DISRUPTION = "weather_disruption"
    LABOR_STRIKE = "labor_strike"
    QUALITY_ISSUE = "quality_issue"
    ESG_VIOLATION = "esg_violation"
    LOGISTICS_FAILURE = "logistics_failure"

class CommodityType(str, Enum):
    LITHIUM = "lithium"
    COPPER = "copper"
    SEMICONDUCTORS = "semiconductors"
    RARE_EARTH = "rare_earth"
    STEEL = "steel"
    ALUMINUM = "aluminum"
    OIL = "oil"
    NATURAL_GAS = "natural_gas"
    WHEAT = "wheat"
    COFFEE = "coffee"

class Region(str, Enum):
    CHINA = "china"
    EUROPE = "europe"
    NORTH_AMERICA = "north_america"
    SOUTHEAST_ASIA = "southeast_asia"
    INDIA = "india"
    MIDDLE_EAST = "middle_east"
    SOUTH_AMERICA = "south_america"
    AFRICA = "africa"

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"
    HIGH = "high"
    CRITICAL = "critical"


class SupplyChainMarket:
    """Individual supply chain prediction market"""
    
    def __init__(self, market_id: str, title: str, event_type: SupplyChainEventType,
                 region: Region, resolution_date: datetime):
        self.market_id = market_id
        self.title = title
        self.event_type = event_type
        self.region = region
        self.resolution_date = resolution_date
        self.created_at = datetime.utcnow()
        
        # Market dynamics
        self.yes_price = 0.50
        self.no_price = 0.50
        self.volume = 0
        self.liquidity = 50000
        
        # Metadata
        self.description = ""
        self.impact_score = 0  # 1-100 impact on supply chains
        self.affected_commodities: List[str] = []
        self.affected_industries: List[str] = []
        self.data_sources: List[str] = []
        
        # Resolution
        self.resolved = False
        self.outcome = None
        
    def to_dict(self) -> Dict:
        return {
            "market_id": self.market_id,
            "title": self.title,
            "event_type": self.event_type.value,
            "region": self.region.value,
            "resolution_date": self.resolution_date.isoformat(),
            "created_at": self.created_at.isoformat(),
            "yes_price": round(self.yes_price, 4),
            "no_price": round(self.no_price, 4),
            "implied_probability": f"{self.yes_price * 100:.1f}%",
            "volume": self.volume,
            "liquidity": self.liquidity,
            "description": self.description,
            "impact_score": self.impact_score,
            "affected_commodities": self.affected_commodities,
            "affected_industries": self.affected_industries,
            "resolved": self.resolved,
            "outcome": self.outcome,
            "time_to_resolution": str(self.resolution_date - datetime.utcnow()) if not self.resolved else None
        }


class Supplier:
    """Supplier entity for risk tracking"""
    
    def __init__(self, supplier_id: str, name: str, region: Region):
        self.supplier_id = supplier_id
        self.name = name
        self.region = region
        self.created_at = datetime.utcnow()
        
        # Risk metrics
        self.risk_score = 50  # 0-100
        self.risk_level = RiskLevel.MODERATE
        self.financial_health = 75
        self.delivery_reliability = 85
        self.quality_score = 90
        self.esg_score = 70
        
        # Capacity
        self.capacity_utilization = 0.75
        self.lead_time_days = 14
        
        # Commodities supplied
        self.commodities: List[str] = []
        self.industries_served: List[str] = []
        
        # Historical
        self.delays_last_90d = 0
        self.quality_issues_last_90d = 0
        
    def to_dict(self) -> Dict:
        return {
            "supplier_id": self.supplier_id,
            "name": self.name,
            "region": self.region.value,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level.value,
            "metrics": {
                "financial_health": self.financial_health,
                "delivery_reliability": self.delivery_reliability,
                "quality_score": self.quality_score,
                "esg_score": self.esg_score
            },
            "operations": {
                "capacity_utilization": f"{self.capacity_utilization * 100:.0f}%",
                "lead_time_days": self.lead_time_days
            },
            "commodities": self.commodities,
            "industries_served": self.industries_served,
            "incidents": {
                "delays_last_90d": self.delays_last_90d,
                "quality_issues_last_90d": self.quality_issues_last_90d
            }
        }


class Port:
    """Port entity for congestion tracking"""
    
    def __init__(self, port_id: str, name: str, region: Region, country: str):
        self.port_id = port_id
        self.name = name
        self.region = region
        self.country = country
        
        # Congestion metrics
        self.congestion_level = 0.35  # 0-1
        self.vessel_queue = 0
        self.avg_wait_days = 2.5
        self.throughput_teu = 0  # Twenty-foot Equivalent Units
        
        # Trends
        self.congestion_trend = "stable"  # rising, falling, stable
        self.week_over_week_change = 0.0
        
    def to_dict(self) -> Dict:
        return {
            "port_id": self.port_id,
            "name": self.name,
            "region": self.region.value,
            "country": self.country,
            "congestion": {
                "level": round(self.congestion_level, 2),
                "level_pct": f"{self.congestion_level * 100:.0f}%",
                "status": "Critical" if self.congestion_level > 0.8 else "High" if self.congestion_level > 0.6 else "Moderate" if self.congestion_level > 0.4 else "Normal",
                "vessel_queue": self.vessel_queue,
                "avg_wait_days": self.avg_wait_days
            },
            "throughput_teu": self.throughput_teu,
            "trend": self.congestion_trend,
            "week_over_week_change": f"{self.week_over_week_change:+.1f}%"
        }


class SCFInstrument:
    """Supply Chain Finance Derivative Instrument"""
    
    def __init__(self, instrument_id: str, name: str, commodity: CommodityType):
        self.instrument_id = instrument_id
        self.name = name
        self.commodity = commodity
        self.created_at = datetime.utcnow()
        
        # Pricing
        self.current_price = 100.0
        self.change_24h = 0.0
        self.change_7d = 0.0
        
        # Risk metrics
        self.volatility = 0.15
        self.supply_risk_premium = 0.0
        self.geopolitical_risk_factor = 0.0
        
        # Supply chain factors
        self.inventory_days = 30
        self.production_utilization = 0.80
        self.import_dependency = 0.60
        
        # Trading
        self.volume_24h = 0
        self.open_interest = 0
        
    def to_dict(self) -> Dict:
        return {
            "instrument_id": self.instrument_id,
            "name": self.name,
            "commodity": self.commodity.value,
            "pricing": {
                "current_price": round(self.current_price, 2),
                "change_24h": round(self.change_24h, 2),
                "change_24h_pct": f"{self.change_24h:+.2f}%",
                "change_7d": round(self.change_7d, 2),
                "change_7d_pct": f"{self.change_7d:+.2f}%"
            },
            "risk": {
                "volatility": f"{self.volatility * 100:.1f}%",
                "supply_risk_premium": f"{self.supply_risk_premium * 100:.2f}%",
                "geopolitical_factor": round(self.geopolitical_risk_factor, 2)
            },
            "supply_chain": {
                "inventory_days": self.inventory_days,
                "production_utilization": f"{self.production_utilization * 100:.0f}%",
                "import_dependency": f"{self.import_dependency * 100:.0f}%"
            },
            "trading": {
                "volume_24h": self.volume_24h,
                "open_interest": self.open_interest
            }
        }


class SupplyChainTradingEngine:
    """
    Supply Chain Trading Engine for OracleIQTrader.
    
    Features:
    - Prediction markets for supply chain events
    - Supplier risk monitoring and trading
    - Port congestion tracking
    - SCF derivatives trading
    - Geopolitical risk signals
    """
    
    def __init__(self):
        self.markets: Dict[str, SupplyChainMarket] = {}
        self.suppliers: Dict[str, Supplier] = {}
        self.ports: Dict[str, Port] = {}
        self.instruments: Dict[str, SCFInstrument] = {}
        self.user_positions: Dict[str, Dict] = {}
        self.user_balances: Dict[str, float] = {}
        
        # Initialize sample data
        self._create_sample_data()
        
    def _generate_id(self, prefix: str) -> str:
        return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
    
    def _create_sample_data(self):
        """Initialize sample supply chain data"""
        
        # Create Supply Chain Prediction Markets
        markets_data = [
            {
                "title": "Port of Shanghai congestion exceeds 14-day average by March 2026",
                "event_type": SupplyChainEventType.PORT_CONGESTION,
                "region": Region.CHINA,
                "resolution_date": datetime(2026, 3, 31),
                "yes_price": 0.62,
                "impact_score": 85,
                "description": "Will the Port of Shanghai experience vessel wait times exceeding 14-day rolling average?",
                "affected_commodities": ["electronics", "consumer_goods", "automotive_parts"],
                "affected_industries": ["Retail", "Automotive", "Electronics"]
            },
            {
                "title": "US-China tariff increase on semiconductors by Q2 2026",
                "event_type": SupplyChainEventType.TARIFF_CHANGE,
                "region": Region.CHINA,
                "resolution_date": datetime(2026, 6, 30),
                "yes_price": 0.45,
                "impact_score": 95,
                "description": "Will the US implement additional tariffs (>5%) on semiconductor imports from China?",
                "affected_commodities": ["semiconductors", "electronics"],
                "affected_industries": ["Technology", "Automotive", "Defense"]
            },
            {
                "title": "Lithium supply shortage declaration by major producer",
                "event_type": SupplyChainEventType.COMMODITY_SHORTAGE,
                "region": Region.SOUTH_AMERICA,
                "resolution_date": datetime(2026, 4, 30),
                "yes_price": 0.38,
                "impact_score": 90,
                "description": "Will Chile, Argentina, or Australia declare force majeure on lithium production?",
                "affected_commodities": ["lithium"],
                "affected_industries": ["EV Manufacturing", "Battery Production", "Energy Storage"]
            },
            {
                "title": "European port strike affecting >3 major ports",
                "event_type": SupplyChainEventType.LABOR_STRIKE,
                "region": Region.EUROPE,
                "resolution_date": datetime(2026, 5, 15),
                "yes_price": 0.28,
                "impact_score": 75,
                "description": "Will coordinated labor action affect Rotterdam, Hamburg, and/or Antwerp simultaneously?",
                "affected_commodities": ["all"],
                "affected_industries": ["All European Import-Dependent"]
            },
            {
                "title": "Taiwan Strait shipping disruption event",
                "event_type": SupplyChainEventType.GEOPOLITICAL,
                "region": Region.SOUTHEAST_ASIA,
                "resolution_date": datetime(2026, 12, 31),
                "yes_price": 0.18,
                "impact_score": 100,
                "description": "Will geopolitical tensions cause >24hr shipping route deviation in Taiwan Strait?",
                "affected_commodities": ["semiconductors", "electronics", "all_asian_trade"],
                "affected_industries": ["All Global"]
            },
            {
                "title": "Red Sea shipping rerouting continues through Q2 2026",
                "event_type": SupplyChainEventType.GEOPOLITICAL,
                "region": Region.MIDDLE_EAST,
                "resolution_date": datetime(2026, 6, 30),
                "yes_price": 0.72,
                "impact_score": 80,
                "description": "Will major shipping lines continue Cape of Good Hope routing due to Houthi attacks?",
                "affected_commodities": ["oil", "consumer_goods", "automotive"],
                "affected_industries": ["Energy", "Retail", "Manufacturing"]
            },
            {
                "title": "Major EV battery supplier bankruptcy or restructuring",
                "event_type": SupplyChainEventType.SUPPLIER_DELAY,
                "region": Region.CHINA,
                "resolution_date": datetime(2026, 9, 30),
                "yes_price": 0.32,
                "impact_score": 85,
                "description": "Will a top-10 EV battery supplier file for bankruptcy or enter restructuring?",
                "affected_commodities": ["batteries", "lithium", "cobalt"],
                "affected_industries": ["EV Manufacturing", "Energy Storage"]
            },
            {
                "title": "India becomes net semiconductor exporter",
                "event_type": SupplyChainEventType.COMMODITY_SHORTAGE,
                "region": Region.INDIA,
                "resolution_date": datetime(2026, 12, 31),
                "yes_price": 0.15,
                "impact_score": 70,
                "description": "Will India achieve net positive semiconductor exports by end of 2026?",
                "affected_commodities": ["semiconductors"],
                "affected_industries": ["Technology", "Manufacturing"]
            }
        ]
        
        for data in markets_data:
            market_id = self._generate_id("SCM")
            market = SupplyChainMarket(
                market_id, data["title"], data["event_type"],
                data["region"], data["resolution_date"]
            )
            market.yes_price = data["yes_price"]
            market.no_price = 1 - data["yes_price"]
            market.impact_score = data["impact_score"]
            market.description = data["description"]
            market.affected_commodities = data["affected_commodities"]
            market.affected_industries = data["affected_industries"]
            market.volume = random.randint(100000, 5000000)
            
            self.markets[market_id] = market
        
        # Create Suppliers
        suppliers_data = [
            {"name": "TSMC (Taiwan)", "region": Region.SOUTHEAST_ASIA, "commodities": ["semiconductors"], "risk_score": 35, "industries": ["Technology", "Automotive"]},
            {"name": "Samsung Electronics", "region": Region.SOUTHEAST_ASIA, "commodities": ["semiconductors", "displays"], "risk_score": 30, "industries": ["Technology", "Consumer Electronics"]},
            {"name": "CATL", "region": Region.CHINA, "commodities": ["batteries", "lithium"], "risk_score": 45, "industries": ["EV Manufacturing", "Energy Storage"]},
            {"name": "BYD", "region": Region.CHINA, "commodities": ["batteries", "ev_components"], "risk_score": 40, "industries": ["EV Manufacturing", "Automotive"]},
            {"name": "Albemarle Corp", "region": Region.NORTH_AMERICA, "commodities": ["lithium"], "risk_score": 25, "industries": ["Battery Production", "Chemical"]},
            {"name": "SQM (Chile)", "region": Region.SOUTH_AMERICA, "commodities": ["lithium", "potassium"], "risk_score": 35, "industries": ["Battery Production", "Agriculture"]},
            {"name": "Foxconn", "region": Region.CHINA, "commodities": ["electronics_assembly"], "risk_score": 50, "industries": ["Technology", "Consumer Electronics"]},
            {"name": "Bosch", "region": Region.EUROPE, "commodities": ["automotive_parts", "sensors"], "risk_score": 20, "industries": ["Automotive", "Industrial"]},
            {"name": "Nippon Steel", "region": Region.SOUTHEAST_ASIA, "commodities": ["steel"], "risk_score": 30, "industries": ["Automotive", "Construction"]},
            {"name": "Rio Tinto", "region": Region.SOUTHEAST_ASIA, "commodities": ["iron_ore", "copper", "aluminum"], "risk_score": 25, "industries": ["Mining", "Manufacturing"]}
        ]
        
        for data in suppliers_data:
            supplier_id = self._generate_id("SUP")
            supplier = Supplier(supplier_id, data["name"], data["region"])
            supplier.risk_score = data["risk_score"]
            supplier.risk_level = self._get_risk_level(data["risk_score"])
            supplier.commodities = data["commodities"]
            supplier.industries_served = data["industries"]
            supplier.financial_health = random.randint(60, 95)
            supplier.delivery_reliability = random.randint(75, 98)
            supplier.quality_score = random.randint(80, 99)
            supplier.esg_score = random.randint(50, 90)
            supplier.delays_last_90d = random.randint(0, 5)
            
            self.suppliers[supplier_id] = supplier
        
        # Create Ports
        ports_data = [
            {"name": "Port of Shanghai", "region": Region.CHINA, "country": "China", "congestion": 0.65, "queue": 45, "wait": 4.2, "teu": 47000000},
            {"name": "Port of Singapore", "region": Region.SOUTHEAST_ASIA, "country": "Singapore", "congestion": 0.42, "queue": 22, "wait": 2.1, "teu": 39000000},
            {"name": "Port of Rotterdam", "region": Region.EUROPE, "country": "Netherlands", "congestion": 0.38, "queue": 18, "wait": 1.8, "teu": 15000000},
            {"name": "Port of Los Angeles", "region": Region.NORTH_AMERICA, "country": "USA", "congestion": 0.55, "queue": 35, "wait": 3.5, "teu": 10000000},
            {"name": "Port of Shenzhen", "region": Region.CHINA, "country": "China", "congestion": 0.58, "queue": 38, "wait": 3.8, "teu": 30000000},
            {"name": "Port of Busan", "region": Region.SOUTHEAST_ASIA, "country": "South Korea", "congestion": 0.35, "queue": 15, "wait": 1.5, "teu": 23000000},
            {"name": "Port of Hamburg", "region": Region.EUROPE, "country": "Germany", "congestion": 0.32, "queue": 12, "wait": 1.2, "teu": 9000000},
            {"name": "Port of Antwerp", "region": Region.EUROPE, "country": "Belgium", "congestion": 0.40, "queue": 20, "wait": 2.0, "teu": 14000000}
        ]
        
        for data in ports_data:
            port_id = self._generate_id("PRT")
            port = Port(port_id, data["name"], data["region"], data["country"])
            port.congestion_level = data["congestion"]
            port.vessel_queue = data["queue"]
            port.avg_wait_days = data["wait"]
            port.throughput_teu = data["teu"]
            port.congestion_trend = random.choice(["rising", "falling", "stable"])
            port.week_over_week_change = random.uniform(-10, 15)
            
            self.ports[port_id] = port
        
        # Create SCF Instruments
        instruments_data = [
            {"name": "Lithium Supply Risk Index", "commodity": CommodityType.LITHIUM, "price": 142.50, "vol": 0.28, "risk_premium": 0.12},
            {"name": "Copper Working Capital Future", "commodity": CommodityType.COPPER, "price": 98.75, "vol": 0.18, "risk_premium": 0.05},
            {"name": "Semiconductor Supply Chain ETN", "commodity": CommodityType.SEMICONDUCTORS, "price": 215.30, "vol": 0.22, "risk_premium": 0.15},
            {"name": "Rare Earth Hedge Contract", "commodity": CommodityType.RARE_EARTH, "price": 178.90, "vol": 0.35, "risk_premium": 0.18},
            {"name": "Steel Prepayment Derivative", "commodity": CommodityType.STEEL, "price": 85.20, "vol": 0.15, "risk_premium": 0.03},
            {"name": "Natural Gas Supply Risk Swap", "commodity": CommodityType.NATURAL_GAS, "price": 112.45, "vol": 0.42, "risk_premium": 0.08},
            {"name": "Aluminum Working Capital Index", "commodity": CommodityType.ALUMINUM, "price": 92.10, "vol": 0.16, "risk_premium": 0.04}
        ]
        
        for data in instruments_data:
            inst_id = self._generate_id("SCF")
            instrument = SCFInstrument(inst_id, data["name"], data["commodity"])
            instrument.current_price = data["price"]
            instrument.volatility = data["vol"]
            instrument.supply_risk_premium = data["risk_premium"]
            instrument.change_24h = random.uniform(-3, 5)
            instrument.change_7d = random.uniform(-8, 12)
            instrument.volume_24h = random.randint(10000, 500000)
            instrument.open_interest = random.randint(50000, 2000000)
            instrument.geopolitical_risk_factor = random.uniform(0.1, 0.8)
            
            self.instruments[inst_id] = instrument
    
    def _get_risk_level(self, score: int) -> RiskLevel:
        if score < 25: return RiskLevel.LOW
        if score < 45: return RiskLevel.MODERATE
        if score < 65: return RiskLevel.ELEVATED
        if score < 85: return RiskLevel.HIGH
        return RiskLevel.CRITICAL
    
    # Market Operations
    def get_all_markets(self, event_type: str = None, region: str = None) -> List[Dict]:
        """Get all supply chain prediction markets"""
        markets = list(self.markets.values())
        
        if event_type:
            markets = [m for m in markets if m.event_type.value == event_type]
        if region:
            markets = [m for m in markets if m.region.value == region]
        
        return sorted([m.to_dict() for m in markets], key=lambda x: x["impact_score"], reverse=True)
    
    def get_market(self, market_id: str) -> Optional[Dict]:
        """Get single market"""
        market = self.markets.get(market_id)
        return market.to_dict() if market else None
    
    def get_high_impact_markets(self, min_impact: int = 80) -> List[Dict]:
        """Get high-impact supply chain events"""
        markets = [m for m in self.markets.values() if m.impact_score >= min_impact]
        return sorted([m.to_dict() for m in markets], key=lambda x: x["impact_score"], reverse=True)
    
    def buy_market_position(self, user_id: str, market_id: str, 
                            side: str, amount: float) -> Dict:
        """Buy position in supply chain market"""
        market = self.markets.get(market_id)
        if not market:
            return {"error": "Market not found"}
        
        if market.resolved:
            return {"error": "Market already resolved"}
        
        balance = self.user_balances.get(user_id, 10000)
        if amount > balance:
            return {"error": "Insufficient balance"}
        
        price = market.yes_price if side.lower() == "yes" else market.no_price
        shares = amount / price
        
        # Update market
        impact = (amount / market.liquidity) * 0.01
        if side.lower() == "yes":
            market.yes_price = min(0.99, market.yes_price + impact)
            market.no_price = 1 - market.yes_price
        else:
            market.no_price = min(0.99, market.no_price + impact)
            market.yes_price = 1 - market.no_price
        
        market.volume += amount
        self.user_balances[user_id] = balance - amount
        
        return {
            "success": True,
            "trade": {
                "market_id": market_id,
                "side": side.upper(),
                "shares": round(shares, 4),
                "price": round(price, 4),
                "amount": amount
            },
            "new_balance": round(self.user_balances[user_id], 2)
        }
    
    # Supplier Operations
    def get_all_suppliers(self, region: str = None, risk_level: str = None) -> List[Dict]:
        """Get all suppliers"""
        suppliers = list(self.suppliers.values())
        
        if region:
            suppliers = [s for s in suppliers if s.region.value == region]
        if risk_level:
            suppliers = [s for s in suppliers if s.risk_level.value == risk_level]
        
        return sorted([s.to_dict() for s in suppliers], key=lambda x: x["risk_score"])
    
    def get_supplier(self, supplier_id: str) -> Optional[Dict]:
        """Get single supplier"""
        supplier = self.suppliers.get(supplier_id)
        return supplier.to_dict() if supplier else None
    
    def get_at_risk_suppliers(self, threshold: int = 40) -> List[Dict]:
        """Get suppliers above risk threshold"""
        suppliers = [s for s in self.suppliers.values() if s.risk_score >= threshold]
        return sorted([s.to_dict() for s in suppliers], key=lambda x: x["risk_score"], reverse=True)
    
    # Port Operations
    def get_all_ports(self, region: str = None) -> List[Dict]:
        """Get all ports"""
        ports = list(self.ports.values())
        
        if region:
            ports = [p for p in ports if p.region.value == region]
        
        return sorted([p.to_dict() for p in ports], key=lambda x: x["congestion"]["level"], reverse=True)
    
    def get_congested_ports(self, threshold: float = 0.5) -> List[Dict]:
        """Get ports above congestion threshold"""
        ports = [p for p in self.ports.values() if p.congestion_level >= threshold]
        return sorted([p.to_dict() for p in ports], key=lambda x: x["congestion"]["level"], reverse=True)
    
    # SCF Instruments
    def get_all_instruments(self, commodity: str = None) -> List[Dict]:
        """Get all SCF instruments"""
        instruments = list(self.instruments.values())
        
        if commodity:
            instruments = [i for i in instruments if i.commodity.value == commodity]
        
        return [i.to_dict() for i in instruments]
    
    def get_instrument(self, instrument_id: str) -> Optional[Dict]:
        """Get single instrument"""
        instrument = self.instruments.get(instrument_id)
        return instrument.to_dict() if instrument else None
    
    def trade_instrument(self, user_id: str, instrument_id: str,
                         side: str, quantity: float) -> Dict:
        """Trade SCF instrument"""
        instrument = self.instruments.get(instrument_id)
        if not instrument:
            return {"error": "Instrument not found"}
        
        price = instrument.current_price
        total_cost = price * quantity
        
        balance = self.user_balances.get(user_id, 10000)
        if side.lower() == "buy" and total_cost > balance:
            return {"error": "Insufficient balance"}
        
        # Execute trade
        if side.lower() == "buy":
            self.user_balances[user_id] = balance - total_cost
        else:
            self.user_balances[user_id] = balance + total_cost
        
        instrument.volume_24h += int(quantity)
        
        return {
            "success": True,
            "trade": {
                "instrument_id": instrument_id,
                "instrument_name": instrument.name,
                "side": side.upper(),
                "quantity": quantity,
                "price": price,
                "total_value": round(total_cost, 2)
            },
            "new_balance": round(self.user_balances.get(user_id, 0), 2)
        }
    
    # Control Tower
    def get_control_tower_summary(self) -> Dict:
        """Get supply chain control tower overview"""
        # Calculate aggregates
        avg_port_congestion = sum(p.congestion_level for p in self.ports.values()) / len(self.ports)
        high_risk_suppliers = len([s for s in self.suppliers.values() if s.risk_score >= 50])
        active_alerts = len([m for m in self.markets.values() if m.yes_price > 0.6 and not m.resolved])
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "overview": {
                "total_suppliers_monitored": len(self.suppliers),
                "total_ports_tracked": len(self.ports),
                "active_markets": len([m for m in self.markets.values() if not m.resolved]),
                "scf_instruments": len(self.instruments)
            },
            "risk_summary": {
                "avg_port_congestion": f"{avg_port_congestion * 100:.1f}%",
                "high_risk_suppliers": high_risk_suppliers,
                "active_alerts": active_alerts,
                "global_risk_level": "Elevated" if avg_port_congestion > 0.5 or high_risk_suppliers > 3 else "Moderate"
            },
            "top_risks": self.get_high_impact_markets(80)[:5],
            "congested_ports": self.get_congested_ports(0.5)[:3],
            "at_risk_suppliers": self.get_at_risk_suppliers(45)[:3]
        }
    
    def get_geopolitical_risk_index(self) -> Dict:
        """Get geopolitical risk index"""
        geo_markets = [m for m in self.markets.values() if m.event_type == SupplyChainEventType.GEOPOLITICAL]
        
        if not geo_markets:
            return {"index": 0, "level": "Low"}
        
        # Weighted average by impact
        total_weight = sum(m.impact_score for m in geo_markets)
        weighted_prob = sum(m.yes_price * m.impact_score for m in geo_markets) / total_weight
        
        index_value = weighted_prob * 100
        
        return {
            "index": round(index_value, 1),
            "level": "Critical" if index_value > 60 else "High" if index_value > 40 else "Elevated" if index_value > 25 else "Moderate",
            "events_tracked": len(geo_markets),
            "key_risks": [
                {"title": m.title, "probability": f"{m.yes_price * 100:.0f}%", "impact": m.impact_score}
                for m in sorted(geo_markets, key=lambda x: x.impact_score, reverse=True)[:3]
            ]
        }
    
    def get_commodity_risk_dashboard(self, commodity: str) -> Dict:
        """Get risk dashboard for specific commodity"""
        # Find related markets
        related_markets = [
            m for m in self.markets.values() 
            if commodity.lower() in [c.lower() for c in m.affected_commodities]
        ]
        
        # Find related suppliers
        related_suppliers = [
            s for s in self.suppliers.values()
            if commodity.lower() in [c.lower() for c in s.commodities]
        ]
        
        # Find related instruments
        related_instruments = [
            i for i in self.instruments.values()
            if i.commodity.value.lower() == commodity.lower()
        ]
        
        return {
            "commodity": commodity,
            "timestamp": datetime.utcnow().isoformat(),
            "risk_events": [m.to_dict() for m in related_markets],
            "suppliers": [s.to_dict() for s in related_suppliers],
            "instruments": [i.to_dict() for i in related_instruments],
            "supply_chain_health": self._calculate_commodity_health(related_suppliers, related_markets)
        }
    
    def _calculate_commodity_health(self, suppliers: List, markets: List) -> Dict:
        if not suppliers:
            return {"score": 50, "status": "Unknown"}
        
        avg_supplier_risk = sum(s.risk_score for s in suppliers) / len(suppliers)
        market_risk = sum(m.yes_price * m.impact_score for m in markets) / 100 if markets else 0
        
        health_score = max(0, 100 - avg_supplier_risk - market_risk)
        
        return {
            "score": round(health_score, 0),
            "status": "Healthy" if health_score > 70 else "Moderate" if health_score > 40 else "At Risk",
            "supplier_risk_avg": round(avg_supplier_risk, 1),
            "event_risk_factor": round(market_risk, 1)
        }


# Singleton instance
supply_chain_engine = SupplyChainTradingEngine()


# API Functions
def get_supply_chain_markets(event_type: str = None, region: str = None) -> List[Dict]:
    return supply_chain_engine.get_all_markets(event_type, region)

def get_supply_chain_market(market_id: str) -> Dict:
    return supply_chain_engine.get_market(market_id) or {"error": "Market not found"}

def get_high_impact_events() -> List[Dict]:
    return supply_chain_engine.get_high_impact_markets()

def buy_supply_chain_position(user_id: str, market_id: str, side: str, amount: float) -> Dict:
    return supply_chain_engine.buy_market_position(user_id, market_id, side, amount)

def get_suppliers(region: str = None, risk_level: str = None) -> List[Dict]:
    return supply_chain_engine.get_all_suppliers(region, risk_level)

def get_supplier(supplier_id: str) -> Dict:
    return supply_chain_engine.get_supplier(supplier_id) or {"error": "Supplier not found"}

def get_at_risk_suppliers() -> List[Dict]:
    return supply_chain_engine.get_at_risk_suppliers()

def get_ports(region: str = None) -> List[Dict]:
    return supply_chain_engine.get_all_ports(region)

def get_congested_ports() -> List[Dict]:
    return supply_chain_engine.get_congested_ports()

def get_scf_instruments(commodity: str = None) -> List[Dict]:
    return supply_chain_engine.get_all_instruments(commodity)

def get_scf_instrument(instrument_id: str) -> Dict:
    return supply_chain_engine.get_instrument(instrument_id) or {"error": "Instrument not found"}

def trade_scf_instrument(user_id: str, instrument_id: str, side: str, quantity: float) -> Dict:
    return supply_chain_engine.trade_instrument(user_id, instrument_id, side, quantity)

def get_control_tower() -> Dict:
    return supply_chain_engine.get_control_tower_summary()

def get_geopolitical_risk() -> Dict:
    return supply_chain_engine.get_geopolitical_risk_index()

def get_commodity_dashboard(commodity: str) -> Dict:
    return supply_chain_engine.get_commodity_risk_dashboard(commodity)
