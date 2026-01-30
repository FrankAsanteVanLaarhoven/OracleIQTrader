#!/bin/bash
#
# OracleIQTrader Production Deployment Script
# Run this on your production server: srv1304213.hstgr.cloud
#
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy/production-deploy.sh | bash
# Or: ./production-deploy.sh
#

set -e

echo "========================================"
echo "  OracleIQTrader Production Deployment"
echo "========================================"

APP_DIR="/opt/oracleiq-trader"
BACKUP_DIR="/opt/backups"
DOMAIN="srv1304213.hstgr.cloud"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (sudo)"
    exit 1
fi

# Step 1: Install dependencies if needed
log_info "Checking dependencies..."
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_info "Installing Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Step 2: Create directories
log_info "Setting up directories..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR

# Step 3: Clone or update repo
if [ -d "$APP_DIR/.git" ]; then
    log_info "Updating existing repository..."
    cd $APP_DIR
    git fetch origin
    git checkout main 2>/dev/null || git checkout master
    git pull
else
    log_info "Cloning repository..."
    # If repo doesn't exist, user needs to clone manually or provide repo URL
    log_warn "Repository not found. Please clone your repository to $APP_DIR first:"
    log_warn "  git clone https://github.com/YOUR_USERNAME/oracleiq-trader.git $APP_DIR"
    exit 1
fi

# Step 4: Create backup
log_info "Creating backup..."
BACKUP_NAME="oracleiq-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
git rev-parse HEAD > "$BACKUP_DIR/$BACKUP_NAME/commit.txt"

# Backup MongoDB if running
if docker ps | grep -q mongodb; then
    docker exec oracleiq-mongodb mongodump --out /tmp/backup 2>/dev/null || true
    docker cp oracleiq-mongodb:/tmp/backup "$BACKUP_DIR/$BACKUP_NAME/mongodb" 2>/dev/null || true
    log_info "MongoDB backup created"
fi

# Step 5: Configure environment
log_info "Configuring environment files..."

# Frontend .env
cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}/api
EOF

# Backend .env (preserve existing keys if they exist)
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
MONGO_URL=mongodb://mongodb:27017
DB_NAME=oracleiq_trader
CORS_ORIGINS=*
ENVIRONMENT=production
# Add your API keys below:
# EMERGENT_LLM_KEY=your_key
# ALPHA_VANTAGE_KEY=your_key
# ALPACA_API_KEY=your_key
# ALPACA_SECRET_KEY=your_key
EOF
    log_warn "Created backend/.env - Please add your API keys!"
fi

# Step 6: Stop existing containers
log_info "Stopping existing containers..."
cd $APP_DIR/deploy
docker-compose down 2>/dev/null || true

# Step 7: Build containers
log_info "Building Docker containers (this may take a few minutes)..."
docker-compose build --no-cache --parallel

# Step 8: Start containers
log_info "Starting containers..."
docker-compose up -d

# Step 9: Wait for services
log_info "Waiting for services to start..."
sleep 20

# Step 10: Health checks
log_info "Running health checks..."
BACKEND_OK=false
FRONTEND_OK=false

for i in {1..10}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        BACKEND_OK=true
        break
    fi
    log_warn "Backend not ready, waiting... ($i/10)"
    sleep 3
done

for i in {1..10}; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_OK=true
        break
    fi
    log_warn "Frontend not ready, waiting... ($i/10)"
    sleep 3
done

# Step 11: Report status
echo ""
echo "========================================"
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    log_info "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "Services running:"
    docker-compose ps
    echo ""
    echo "Access your app at: https://${DOMAIN}"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:        docker-compose logs -f"
    echo "  - Restart:          docker-compose restart"
    echo "  - Stop:             docker-compose down"
    echo "  - Rollback:         git checkout \$(cat $BACKUP_DIR/$BACKUP_NAME/commit.txt)"
else
    log_error "❌ DEPLOYMENT MAY HAVE ISSUES"
    [ "$BACKEND_OK" = false ] && log_error "Backend is not responding"
    [ "$FRONTEND_OK" = false ] && log_error "Frontend is not responding"
    echo ""
    echo "Debug commands:"
    echo "  - Check logs:       docker-compose logs"
    echo "  - Check status:     docker-compose ps"
    echo "  - Restart:          docker-compose restart"
    exit 1
fi

# Step 12: Cleanup
log_info "Cleaning up old Docker images..."
docker image prune -f 2>/dev/null || true

echo ""
log_info "Deployment complete!"
echo "========================================"
