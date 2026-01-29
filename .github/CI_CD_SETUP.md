# OracleIQTrader CI/CD Setup Guide

## Automated Deployment Pipeline

This project includes GitHub Actions for automatic deployment to your Hostinger VPS.

---

## 🔧 One-Time Setup (5 minutes)

### Step 1: Generate SSH Key on Your Server

SSH into your server and run:
```bash
ssh root@srv1304213.hstgr.cloud
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy
```

Copy the **private key** output (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`).

### Step 2: Add Secret to GitHub

1. Go to your GitHub repo: `https://github.com/FrankAsanteVanLaarhoven/OracleIQTrader`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the private key from Step 1
6. Click **Add secret**

### Step 3: Initial Server Setup

Run this once on your server:
```bash
cd /opt/oracleiq-trader
git remote set-url origin https://github.com/FrankAsanteVanLaarhoven/OracleIQTrader.git
```

---

## 🚀 How It Works

### Automatic Deployment
Every push to `main` or `master` branch triggers:
1. **Test** - Lint & build frontend, verify backend
2. **Deploy** - SSH to server, pull code, rebuild containers
3. **Verify** - Health check on live site

### Manual Deployment
Go to **Actions** tab → **Deploy OracleIQTrader** → **Run workflow**

---

## 📁 Workflow File

Located at: `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main, master]  # Auto-deploy on push
  workflow_dispatch:           # Manual trigger
```

---

## ⚡ Zero-Downtime Deployment

The pipeline uses Docker rolling updates:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

For true zero-downtime, upgrade to Docker Swarm or Kubernetes.

---

## 🔒 Security

- SSH key stored as GitHub Secret (encrypted)
- No passwords in code
- HTTPS enforced via Nginx + Let's Encrypt

---

## 📊 Monitoring Deployments

Check deployment status:
1. GitHub → **Actions** tab → View workflow runs
2. Server: `docker-compose logs -f`
3. Site: `https://srv1304213.hstgr.cloud`

---

## 🛠️ Troubleshooting

### Deployment Failed
```bash
ssh root@srv1304213.hstgr.cloud
cd /opt/oracleiq-trader
docker-compose logs --tail=100
```

### Manual Redeploy
```bash
git pull
docker-compose up -d --build
```

### Check Running Containers
```bash
docker-compose ps
```

---

## 📜 License

© 2026 OracleIQTrader.com. All rights reserved.
