# OracleIQTrader CI/CD Setup Guide

## Overview

This project uses GitHub Actions for a fully automated CI/CD pipeline with:

- **Automated Testing**: Unit tests, lint checks, security scans
- **Docker Builds**: Multi-stage builds with caching
- **Multi-Environment**: Staging and Production deployments
- **Automated Rollback**: Backup and restore capabilities
- **Health Monitoring**: Scheduled health checks every 15 minutes
- **Weekly Maintenance**: Automated cleanup and backups

---

## Workflows

### 1. Main Deploy Pipeline (`deploy.yml`)

**Triggers:**
- Push to `main`, `master`, `develop`, `staging`
- Manual dispatch with environment selection

**Jobs:**
1. `lint-and-security` - ESLint, Ruff, npm audit, pip-audit
2. `test-backend` - Python tests with MongoDB
3. `test-frontend` - React tests and build verification
4. `build` - Docker image builds pushed to GHCR
5. `deploy-staging` - Deploy to staging (develop/staging branches)
6. `deploy-production` - Deploy to production (main/master branches)
7. `post-deploy` - Notifications, release tagging
8. `rollback` - Emergency rollback on failure

### 2. PR Checks (`pr-checks.yml`)

**Triggers:**
- Pull requests to main, master, develop

**Checks:**
- Large file detection
- Lint checks
- Build verification
- Docker build test

### 3. Scheduled Tasks (`scheduled.yml`)

| Task | Schedule | Description |
|------|----------|-------------|
| Health Check | Every 15 min | API & frontend health |
| Daily Tests | 3 AM UTC | Integration tests |
| Weekly Cleanup | Sunday 4 AM | Docker/log cleanup |
| Backup | Manual | MongoDB backup |

---

## Required Secrets

Configure these in GitHub Repository Settings → Secrets:

```
SSH_PRIVATE_KEY     - SSH key for server access
EMERGENT_LLM_KEY    - AI/LLM API key (optional)
GITHUB_TOKEN        - Auto-provided by GitHub
```

### Generating SSH Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@oracleiqtrader.com" -f ~/.ssh/oracleiq_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/oracleiq_deploy.pub root@srv1304213.hstgr.cloud

# Add private key to GitHub Secrets as SSH_PRIVATE_KEY
cat ~/.ssh/oracleiq_deploy
```

---

## Manual Deployment

### Deploy to Production
```bash
gh workflow run deploy.yml -f environment=production
```

### Deploy to Staging
```bash
gh workflow run deploy.yml -f environment=staging
```

### Emergency Deploy (Skip Tests)
```bash
gh workflow run deploy.yml -f environment=production -f skip_tests=true
```

### Manual Backup
```bash
gh workflow run scheduled.yml -f task=backup
```

### Manual Cleanup
```bash
gh workflow run scheduled.yml -f task=cleanup
```

---

## Server Requirements

The production server needs:

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin

# Create app directory
mkdir -p /opt/oracleiq-trader
mkdir -p /opt/backups

# Clone repository
git clone https://github.com/YOUR_ORG/oracleiq-trader.git /opt/oracleiq-trader
```

---

## Deployment Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Git Push   │────▶│    Tests     │────▶│ Docker Build │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Monitor    │◀────│   Deploy     │◀────│   Backup     │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│ Health Check │──── Every 15 min
└──────────────┘
```

---

## Rollback Procedure

### Automatic Rollback
The pipeline automatically creates backups before deployment. If deployment fails, run:

```bash
gh workflow run deploy.yml  # Will trigger rollback job on failure
```

### Manual Rollback

```bash
# SSH to server
ssh root@srv1304213.hstgr.cloud

# List available backups
ls -la /opt/backups/

# Rollback to specific backup
cd /opt/oracleiq-trader
BACKUP="/opt/backups/oracleiq-YYYYMMDD-HHMMSS"
git checkout $(cat $BACKUP/commit.txt)
docker-compose down
docker-compose build
docker-compose up -d

# Restore database if needed
docker cp $BACKUP/mongodb oracleiq-mongodb:/tmp/restore
docker exec oracleiq-mongodb mongorestore /tmp/restore
```

---

## Monitoring

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Backend health |
| `/api/risk/ws/stats` | WebSocket status |
| `/` | Frontend status |

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific service
docker logs -f oracleiq-backend
docker logs -f oracleiq-frontend
docker logs -f oracleiq-mongodb
```

---

## Environment Variables

### Frontend (`.env`)
```
REACT_APP_BACKEND_URL=https://srv1304213.hstgr.cloud/api
```

### Backend (`.env`)
```
MONGO_URL=mongodb://mongodb:27017
DB_NAME=oracleiq_trader
ENVIRONMENT=production
EMERGENT_LLM_KEY=your_key_here
```

---

## Troubleshooting

### Build Fails
```bash
# Check Docker logs
docker-compose logs --tail=100

# Rebuild without cache
docker-compose build --no-cache
```

### Database Issues
```bash
# Check MongoDB
docker exec -it oracleiq-mongodb mongosh

# View databases
show dbs
use oracleiq_trader
db.stats()
```

### SSL Issues
```bash
# Renew certificates
docker exec oracleiq-certbot certbot renew
docker exec oracleiq-nginx nginx -s reload
```
