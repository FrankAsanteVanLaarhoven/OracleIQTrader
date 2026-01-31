#!/bin/bash

# ============================================
# OracleIQTrader Deployment Script
# Server: oracleiqtrader.com
# ============================================

set -e

echo "🚀 Starting OracleIQTrader Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="oracleiqtrader.com"
EMAIL="admin@$DOMAIN"  # Change this to your email
APP_DIR="/opt/oracleiq-trader"

# Step 1: Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Step 2: Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Step 4: Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Step 5: Create nginx SSL directory
mkdir -p nginx/ssl

# Step 6: Create environment file
echo -e "${YELLOW}🔐 Creating environment file...${NC}"
cat > .env << 'EOF'
# OracleIQTrader Environment Variables
EMERGENT_LLM_KEY=sk-emergent-your-key-here
MONGO_URL=mongodb://mongodb:27017
DB_NAME=oracleiq_trader
CORS_ORIGINS=*
EOF

echo -e "${GREEN}✅ Environment file created. Please update EMERGENT_LLM_KEY in .env${NC}"

# Step 7: Create initial nginx config for SSL setup
echo -e "${YELLOW}🔒 Creating initial nginx config for SSL...${NC}"
cat > nginx/nginx-initial.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name oracleiqtrader.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'OracleIQTrader - Setting up SSL...';
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo -e "${GREEN}✅ Initial setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Upload application files to $APP_DIR"
echo "2. Update .env with your EMERGENT_LLM_KEY"
echo "3. Run: docker-compose up -d"
echo "4. Run SSL setup: ./setup-ssl.sh"
echo ""
echo -e "${GREEN}🎉 Server is ready for deployment!${NC}"
