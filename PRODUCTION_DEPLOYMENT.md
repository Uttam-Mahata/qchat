# QChat Production Deployment Guide

## 🚀 Production-Ready Post-Quantum Chat Application

This guide covers deploying QChat to production with enterprise-grade security and reliability.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Production Features Implemented

✅ **Security**
- AES-256-GCM + ML-KEM-768 hybrid encryption
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Security headers (Helmet.js)
- HTTPS enforcement
- CORS protection
- Request size validation (10MB limit)
- Authentication rate limiting

✅ **Infrastructure**
- PostgreSQL connection pooling (2-20 connections)
- Graceful shutdown handling
- Comprehensive error handling
- Health check endpoints
- Process monitoring

✅ **Logging & Monitoring**
- Winston structured logging
- Daily log rotation (14 days retention)
- Separate error logs (30 days retention)
- Security event logging
- Request/response logging

✅ **Performance**
- Gzip compression
- Connection pooling
- Response caching
- Optimized database queries

---

## Prerequisites

### Required Software
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9.x or higher

### Required Services
- PostgreSQL database (Aiven, AWS RDS, or similar)
- HTTPS certificate (Let's Encrypt, CloudFlare, etc.)
- Domain name (optional but recommended)

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Production Environment

Edit `.env` with your production values:

```env
# Environment
NODE_ENV=production

# Server
PORT=5000
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Database Pool (adjust based on traffic)
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=10000

# Session Secret (MUST CHANGE - generate with: openssl rand -base64 64)
SESSION_SECRET=your-super-secret-session-key-change-this

# Security
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # requests per window
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads
```

### 3. SSL Certificate (if using Aiven/managed PostgreSQL)

If your PostgreSQL provider (like Aiven) requires a custom SSL certificate:

```env
DB_SSL_CERT=-----BEGIN CERTIFICATE-----
...your certificate here...
-----END CERTIFICATE-----
```

---

## Database Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE qchat;
CREATE USER qchat_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE qchat TO qchat_user;
```

### 2. Run Database Migrations

Push the schema to your PostgreSQL database:

```bash
npm run db:push
```

This will create the following tables:
- `users` - User accounts with public keys
- `messages` - Encrypted messages
- `rooms` - Chat rooms with invite codes
- `room_members` - Room membership tracking
- `documents` - Encrypted file attachments

### 3. Verify Database Connection

```bash
# Test database connectivity
node -e "require('dotenv').config(); const { pool } = require('./server/db'); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows[0]); pool.end(); });"
```

---

## Application Deployment

### Option 1: Direct Node.js Deployment

#### 1. Install Dependencies

```bash
npm ci --production=false
```

#### 2. Build Application

```bash
npm run build
```

This creates:
- `/dist/public/` - Frontend static assets
- `/dist/index.js` - Backend bundle

#### 3. Start Production Server

```bash
npm start
```

Or use a process manager:

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name qchat -i max
pm2 save
pm2 startup

# Using systemd
sudo cp deployment/qchat.service /etc/systemd/system/
sudo systemctl enable qchat
sudo systemctl start qchat
```

### Option 2: Docker Deployment

#### 1. Build Docker Image

```bash
docker build -t qchat:latest .
```

#### 2. Run Container

```bash
docker run -d \
  --name qchat \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  qchat:latest
```

#### 3. Docker Compose (with PostgreSQL)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://qchat:password@postgres:5432/qchat
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: qchat
      POSTGRES_USER: qchat
      POSTGRES_PASSWORD: change-this-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Option 3: Cloud Platform Deployment

#### Railway.app
1. Connect GitHub repository
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy automatically

#### Heroku
```bash
heroku create qchat-production
heroku addons:create heroku-postgresql:standard-0
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 64)
git push heroku main
```

#### DigitalOcean App Platform
1. Connect repository
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy

---

## Security Checklist

### Before Going Live

- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/TLS for all traffic
- [ ] Set appropriate `CORS_ORIGIN` (not `*`)
- [ ] Use strong PostgreSQL password
- [ ] Enable database SSL/TLS
- [ ] Review rate limit settings
- [ ] Set up firewall rules (only allow ports 80, 443)
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Review file upload size limits
- [ ] Test graceful shutdown

### Recommended Security Enhancements

```bash
# 1. Generate strong session secret
openssl rand -base64 64

# 2. Enable firewall (Ubuntu/Debian)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Set up automated backups (PostgreSQL)
pg_dump -U qchat_user qchat > backup-$(date +%Y%m%d).sql

# 4. Configure fail2ban for DDoS protection
sudo apt install fail2ban
```

---

## Monitoring & Maintenance

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:5000/health

# Detailed health (includes database, memory, CPU)
curl http://localhost:5000/health/detailed

# Kubernetes readiness probe
curl http://localhost:5000/health/ready

# Kubernetes liveness probe
curl http://localhost:5000/health/live
```

### Log Management

Logs are written to:
- `logs/qchat-YYYY-MM-DD.log` - Application logs (14 days retention)
- `logs/qchat-error-YYYY-MM-DD.log` - Error logs (30 days retention)

```bash
# View recent logs
tail -f logs/qchat-$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" logs/qchat-*.log

# View security events
grep "Security Event" logs/qchat-*.log
```

### Database Pool Monitoring

Monitor connection pool health:

```bash
curl http://localhost:5000/health/detailed | jq '.database.poolStats'
```

### Performance Metrics

Monitor with PM2:

```bash
pm2 monit
pm2 logs qchat
pm2 restart qchat --watch
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `getaddrinfo ENOTFOUND`

```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test network connectivity
ping <database-host>

# Check SSL certificate
openssl s_client -connect <database-host>:<port> -showcerts
```

**Error:** `SSL connection required`

Ensure `?sslmode=require` is in `DATABASE_URL` or `DB_SSL_CERT` is configured.

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Adjust pool size in .env
DB_POOL_MAX=10  # Reduce if memory constrained

# Restart application
pm2 restart qchat
```

### Rate Limiting Too Strict

Adjust in `.env`:

```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200      # Increase limit
```

### WebSocket Connection Issues

Ensure your reverse proxy (Nginx, Traefik) supports WebSocket upgrade:

```nginx
location /ws {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## Scaling Recommendations

### Horizontal Scaling

1. **Use connection pooling** - Already configured (2-20 connections)
2. **Load balancer** - Nginx, HAProxy, or cloud LB
3. **Session store** - Redis for multi-instance sessions
4. **File storage** - S3, MinIO for distributed file storage

### Vertical Scaling

Adjust based on traffic:

```env
# High traffic (4GB+ RAM, 2+ CPU cores)
DB_POOL_MAX=30
RATE_LIMIT_MAX_REQUESTS=500

# Low traffic (1GB RAM, 1 CPU core)
DB_POOL_MAX=10
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups (cron)
0 2 * * * pg_dump -U qchat_user qchat | gzip > /backups/qchat-$(date +\%Y\%m\%d).sql.gz

# Restore from backup
gunzip < qchat-20250101.sql.gz | psql -U qchat_user qchat
```

### Application Backups

```bash
# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

---

## Support & Resources

- **GitHub Issues**: https://github.com/your-repo/qchat/issues
- **Documentation**: See README.md
- **Security Issues**: security@yourdomain.com

---

## License

MIT License - See LICENSE file for details
