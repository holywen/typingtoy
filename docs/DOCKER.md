# Docker Deployment Guide

Complete guide for deploying Typing Toy using Docker and Docker Compose.

## Table of Contents
- [Quick Start](#quick-start)
- [Services](#services)
- [Production Deployment](#production-deployment)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

Install Docker: [Get Docker](https://docs.docker.com/get-docker/)

---

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate a secret key
openssl rand -base64 32
```

Edit `.env` and configure:

```env
# MongoDB Connection (for Docker)
MONGODB_URI=mongodb://mongodb:27017/typingtoy

# NextAuth Secret (use generated key above)
NEXTAUTH_SECRET=your-generated-secret-key
AUTH_SECRET=your-generated-secret-key

# App URL
NEXTAUTH_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Start the Application

**Option A: Using the helper script**
```bash
./docker-start.sh dev
```

**Option B: Using Make**
```bash
make up
```

**Option C: Using Docker Compose directly**
```bash
docker compose up -d --build
```

### 3. Access the Application

- **Application**: http://localhost:3000
- **MongoDB**: localhost:27017

That's it! 🎉

---

## Docker Services

### Main Services

1. **app** - Next.js application
   - Port: 3000
   - Depends on: MongoDB
   - Auto-restarts on failure

2. **mongodb** - MongoDB database
   - Port: 27017
   - Data persisted in: `mongodb-data` volume
   - Config in: `mongodb-config` volume

### Optional Services

Uncomment in `docker compose.yml` if needed:

3. **redis** - Redis cache
   - Port: 6379
   - Data persisted in: `redis-data` volume
   - For session management

4. **mongo-express** - MongoDB web UI
   - Port: 8081
   - URL: http://localhost:8081
   - For database administration

---

## Production Deployment

### 1. Security Configuration

**Generate strong secrets:**
```bash
openssl rand -base64 32
```

**Enable MongoDB authentication:**
Uncomment in `docker compose.yml`:
```yaml
environment:
  MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
```

Set in `.env`:
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=strong-password-here
```

**Update production URL:**
```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
AUTH_SECRET=<strong-random-secret>
```

### 2. Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. HTTPS with Let's Encrypt

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal
certbot renew --dry-run
```

### 4. Start in Production Mode

```bash
./docker-start.sh prod
# or
make prod
# or
docker compose -f docker compose.yml -f docker compose.prod.yml up -d
```

---

## Commands Reference

### Using Helper Script

```bash
./docker-start.sh dev          # Start in development mode
./docker-start.sh prod         # Start in production mode
./docker-start.sh stop         # Stop all services
./docker-start.sh restart      # Restart services
./docker-start.sh logs         # View logs
./docker-start.sh status       # Check status
./docker-start.sh clean        # Clean up everything
```

### Using Make

```bash
make up          # Start services
make down        # Stop services
make logs        # View logs
make status      # Check status
make restart     # Restart
make clean       # Clean up
make shell       # Open app shell
make db-shell    # Open MongoDB shell
```

### Using Docker Compose

```bash
# Start services
docker compose up -d

# Stop services
docker compose stop
docker compose down

# Restart services
docker compose restart

# View running containers
docker compose ps

# View logs
docker compose logs -f
docker compose logs -f app          # Specific service
docker compose logs --tail=100 app  # Last 100 lines

# Remove stopped containers
docker compose rm
```

### Rebuilding

```bash
# Rebuild app after code changes
docker compose up -d --build app

# Rebuild all services
docker compose build --no-cache
docker compose up -d
```

### Database Management

```bash
# Access MongoDB shell
docker compose exec mongodb mongosh typingtoy

# Backup database
docker compose exec mongodb mongodump --db=typingtoy --out=/data/backup

# Restore database
docker compose exec mongodb mongorestore --db=typingtoy /data/backup/typingtoy
```

---

## Volumes and Data Persistence

Data is persisted in Docker volumes:

- `mongodb-data` - MongoDB database files
- `mongodb-config` - MongoDB configuration
- `redis-data` - Redis cache (if enabled)

### Backup Volumes

```bash
# Backup MongoDB data
docker run --rm \
  -v typingtoy_mongodb-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/mongodb-backup.tar.gz /data

# Restore MongoDB data
docker run --rm \
  -v typingtoy_mongodb-data:/data \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/mongodb-backup.tar.gz -C /
```

### List volumes

```bash
docker volume ls | grep typingtoy
```

### Remove volumes (⚠️ WARNING: Deletes all data)

```bash
docker compose down -v
```

---

## Monitoring

### Resource Usage

```bash
# View resource usage
docker stats

# Specific container
docker stats typingtoy-app
```

### Container Information

```bash
# Inspect container
docker inspect typingtoy-app

# View container processes
docker compose top
```

### Health Checks

Add to `docker compose.yml`:

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## Troubleshooting

### App won't start

1. Check logs:
   ```bash
   docker compose logs app
   ```

2. Verify environment variables:
   ```bash
   docker compose config
   ```

3. Ensure MongoDB is running:
   ```bash
   docker compose ps mongodb
   ```

### Cannot connect to MongoDB

1. Check MongoDB logs:
   ```bash
   docker compose logs mongodb
   ```

2. Verify network:
   ```bash
   docker network inspect typingtoy_typingtoy-network
   ```

3. Test connection from app container:
   ```bash
   docker compose exec app ping mongodb
   ```

### Port already in use

Change ports in `docker compose.yml`:

```yaml
services:
  app:
    ports:
      - "3001:3000"  # Use port 3001 instead
```

### Services won't start?

```bash
# Check what went wrong
docker compose logs

# Check if ports are available
lsof -i :3000
lsof -i :27017
```

### Need to reset everything?

```bash
# Stop and remove everything
docker compose down -v

# Start fresh
docker compose up -d --build
```

### Container keeps restarting

```bash
# Check logs for errors
docker compose logs app

# Check resource limits
docker stats

# Inspect container
docker inspect typingtoy-app
```

---

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build app

# Or rebuild everything
docker compose down
docker compose up -d --build
```

---

## Development vs Production

### Development Mode

```bash
# Use development environment
docker compose -f docker compose.yml -f docker compose.dev.yml up

# Features:
# - Hot reload enabled
# - Debug mode on
# - Development tools available
```

### Production Mode

```bash
# Use production environment
docker compose -f docker compose.yml -f docker compose.prod.yml up -d

# Features:
# - Optimized builds
# - Security hardened
# - Performance tuned
```

---

## Multi-stage Docker Build

The Dockerfile uses a multi-stage build for optimization:

1. **deps** - Install production dependencies only
2. **builder** - Build Next.js application
3. **runner** - Run production server (minimal image)

Benefits:
- Smaller final image size
- Faster builds with layer caching
- Security (no build tools in production)

---

## Environment-Specific Configurations

### docker compose.yml (base)
- Common configuration for all environments
- Network setup
- Volume definitions

### docker compose.dev.yml (development)
- Development-specific overrides
- Enable hot reload
- Mount source code volumes

### docker compose.prod.yml (production)
- Production-specific overrides
- Resource limits
- Security settings
- Health checks

---

## Support

For issues and questions:
- Check the logs: `docker compose logs`
- Review `.env` configuration
- Ensure all required ports are available
- Verify Docker and Docker Compose versions

**Minimum Versions:**
- Docker: 20.10+
- Docker Compose: 2.0+

---

**Last Updated:** November 2025
