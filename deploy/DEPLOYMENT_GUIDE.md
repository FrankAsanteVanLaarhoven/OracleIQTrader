# OracleIQTrader - Hostinger VPS Deployment Guide

## Server Details
- **Server:** oracleiqtrader.com
- **IP:** 72.62.211.165
- **OS:** Ubuntu 24.04 LTS

---

## 🚀 Quick Deploy (Copy & Paste)

### Step 1: SSH into your server
```bash
ssh root@oracleiqtrader.com
```

### Step 2: Run this ONE command to set up everything
```bash
curl -fsSL https://get.docker.com | sh && \
apt-get install -y git docker-compose && \
mkdir -p /opt/oracleiq-trader && \
cd /opt/oracleiq-trader
```

### Step 3: Download the code from Emergent
Click **"Save to GitHub"** in Emergent, then clone it:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

**OR** download the ZIP and upload via SFTP.

### Step 4: Copy deployment files
```bash
cp -r deploy/* .
cp backend/* backend/ 2>/dev/null || true
cp -r frontend/* frontend/ 2>/dev/null || true
```

### Step 5: Update environment variables
```bash
nano .env
```
Add your EMERGENT_LLM_KEY:
```
EMERGENT_LLM_KEY=sk-emergent-your-key-here
```

### Step 6: Update frontend URL
Edit `frontend/.env`:
```bash
echo "REACT_APP_BACKEND_URL=https://oracleiqtrader.com/api" > frontend/.env
```

### Step 7: Build and start
```bash
docker-compose build
docker-compose up -d
```

### Step 8: Setup SSL (HTTPS)
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

---

## 📁 File Structure on Server

```
/opt/oracleiq-trader/
├── docker-compose.yml
├── .env
├── setup-ssl.sh
├── backend/
│   ├── Dockerfile
│   ├── server.py
│   ├── requirements.txt
│   └── modules/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
└── nginx/
    └── nginx.conf
```

---

## 🔧 Management Commands

### View logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
docker-compose restart
docker-compose restart backend
```

### Stop everything
```bash
docker-compose down
```

### Update and redeploy
```bash
git pull
docker-compose build
docker-compose up -d
```

### Check status
```bash
docker-compose ps
```

---

## 🌐 URLs After Deployment

- **Website:** https://oracleiqtrader.com
- **API:** https://oracleiqtrader.com/api
- **WebSocket:** wss://oracleiqtrader.com/ws

---

## 🔒 SSL Certificate Renewal

Certificates auto-renew. To manually renew:
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## ⚠️ Troubleshooting

### Port already in use
```bash
lsof -i :80
lsof -i :443
kill -9 <PID>
```

### Docker not starting
```bash
systemctl status docker
systemctl restart docker
```

### Check backend logs
```bash
docker-compose logs backend | tail -100
```

### MongoDB connection issues
```bash
docker-compose exec mongodb mongosh
```

---

## 📧 Support

For issues, check:
1. `docker-compose logs`
2. Backend health: `curl http://localhost:8001/api/health`
3. Frontend: `curl http://localhost:3000`
