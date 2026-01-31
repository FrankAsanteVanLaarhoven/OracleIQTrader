#!/bin/bash

# ============================================
# SSL Certificate Setup Script
# ============================================

set -e

DOMAIN="oracleiqtrader.com"
EMAIL="admin@oracleiqtrader.com"  # Change this!

echo "🔒 Setting up SSL certificates for $DOMAIN..."

# Create certbot directories
mkdir -p certbot/conf certbot/www

# Stop nginx if running
docker-compose down nginx 2>/dev/null || true

# Start nginx with initial config for ACME challenge
docker run -d --name temp-nginx \
    -p 80:80 \
    -v $(pwd)/nginx/nginx-initial.conf:/etc/nginx/nginx.conf:ro \
    -v $(pwd)/certbot/www:/var/www/certbot:ro \
    nginx:alpine

# Wait for nginx to start
sleep 5

# Get SSL certificate
docker run --rm \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Stop temp nginx
docker stop temp-nginx
docker rm temp-nginx

# Update docker-compose to use real certs
echo "✅ SSL certificates obtained!"
echo "🚀 Starting full application..."

docker-compose up -d

echo "🎉 Deployment complete!"
echo "🌐 Visit: https://$DOMAIN"
