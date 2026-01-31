#!/bin/bash
# OracleIQTrader Quick Deploy Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
APP_DIR="/opt/oracleiq-trader"

echo "🚀 OracleIQTrader Deployment Script"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR || { log_error "App directory not found: $APP_DIR"; exit 1; }

# Create backup
log_info "Creating backup..."
BACKUP_DIR="/opt/backups/oracleiq-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
git rev-parse HEAD > $BACKUP_DIR/commit.txt
docker exec oracleiq-mongodb mongodump --out /tmp/backup 2>/dev/null && \
    docker cp oracleiq-mongodb:/tmp/backup $BACKUP_DIR/mongodb 2>/dev/null || \
    log_warn "MongoDB backup skipped (container not running)"
log_info "Backup created at $BACKUP_DIR"

# Pull latest code
log_info "Pulling latest code..."
git fetch origin
if [ "$ENVIRONMENT" = "staging" ]; then
    git checkout develop 2>/dev/null || git checkout staging 2>/dev/null || git checkout main
else
    git checkout main 2>/dev/null || git checkout master
fi
git pull

# Configure environment
log_info "Configuring environment..."
if [ "$ENVIRONMENT" = "staging" ]; then
    DB_NAME="oracleiq_staging"
else
    DB_NAME="oracleiq_trader"
fi

cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=https://oracleiqtrader.com/api
EOF

cat > backend/.env << EOF
MONGO_URL=mongodb://mongodb:27017
DB_NAME=$DB_NAME
ENVIRONMENT=$ENVIRONMENT
EOF

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build containers
log_info "Building Docker containers..."
docker-compose build --parallel

# Start containers
log_info "Starting containers..."
docker-compose up -d

# Wait for services
log_info "Waiting for services to start..."
sleep 15

# Health checks
log_info "Running health checks..."
BACKEND_OK=false
FRONTEND_OK=false

for i in {1..10}; do
    if curl -sf http://localhost:8001/api/health > /dev/null 2>&1; then
        BACKEND_OK=true
        break
    fi
    log_warn "Backend not ready, retrying... ($i/10)"
    sleep 3
done

for i in {1..10}; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_OK=true
        break
    fi
    log_warn "Frontend not ready, retrying... ($i/10)"
    sleep 3
done

# Report status
echo ""
echo "=================================="
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    log_info "✅ Deployment successful!"
    echo ""
    echo "Services:"
    echo "  - Backend:  http://localhost:8001/api/health"
    echo "  - Frontend: http://localhost:3000"
    echo "  - MongoDB:  mongodb://localhost:27017"
    echo ""
    echo "External URL: https://oracleiqtrader.com"
else
    log_error "❌ Deployment may have issues"
    [ "$BACKEND_OK" = false ] && log_error "Backend is not responding"
    [ "$FRONTEND_OK" = false ] && log_error "Frontend is not responding"
    echo ""
    echo "Check logs with: docker-compose logs -f"
    echo "Rollback with: git checkout \$(cat $BACKUP_DIR/commit.txt) && docker-compose up -d --build"
    exit 1
fi

# Cleanup old images
log_info "Cleaning up old Docker images..."
docker image prune -f

echo ""
log_info "Deployment complete!"
