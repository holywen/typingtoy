# Production Deployment Guide

This guide covers deploying Typing Toy to production with Docker, including database setup, authentication, email verification, and admin features.

## Prerequisites

- Docker and Docker Compose installed
- MongoDB connection (Atlas or self-hosted)
- SMTP email service (Gmail, SendGrid, etc.)
- Domain name (optional, for production URL)
- SSL certificate (for HTTPS in production)

## Environment Configuration

### 1. Create Production Environment File

Create `.env.production` file with all required environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typingtoy?retryWrites=true&w=majority
# OR for self-hosted MongoDB:
# MONGODB_URI=mongodb://mongodb:27017/typingtoy

# Redis (Optional - for caching)
REDIS_URL=redis://redis:6379

# Authentication
NEXTAUTH_SECRET=your-production-secret-key-use-openssl-rand-base64-32
NEXTAUTH_URL=https://yourdomain.com
# For development/staging:
# NEXTAUTH_URL=http://your-server-ip:3000

# Email Verification (SMTP) - REQUIRED
# Option 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-production-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=noreply@yourdomain.com

# Option 2: SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=apikey
# SMTP_PASSWORD=your-sendgrid-api-key
# SMTP_FROM=noreply@yourdomain.com

# Option 3: AWS SES
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-ses-username
# SMTP_PASSWORD=your-ses-password
# SMTP_FROM=noreply@yourdomain.com

# OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# Node Environment
NODE_ENV=production
```

### 2. Generate Secure Secrets

Generate a production authentication secret:

```bash
openssl rand -base64 32
```

Use this value for `NEXTAUTH_SECRET` in your production environment file.

### 3. Set Up Production MongoDB

**Option A: MongoDB Atlas (Recommended)**
1. Create production cluster at https://cloud.mongodb.com
2. Configure IP whitelist (add your server IP or allow all: 0.0.0.0/0)
3. Create database user with read/write access
4. Get connection string and add to `MONGODB_URI`

**Option B: Self-Hosted MongoDB**
1. Deploy MongoDB container via Docker Compose (included)
2. Configure persistent volume for data
3. Set up authentication and backup strategy

### 4. Configure Production SMTP

**Gmail (Development/Small Scale)**
- Enable 2FA on Google account
- Generate App Password at https://myaccount.google.com/apppasswords
- Use `SMTP_SECURE=false` with port 587

**SendGrid (Recommended for Production)**
- Create account at https://sendgrid.com
- Generate API key with full email sending access
- Verify sender domain for better deliverability
- Monitor email statistics in SendGrid dashboard

**AWS SES (Scalable)**
- Set up AWS SES in your region
- Verify domain and email addresses
- Create SMTP credentials in SES console
- Monitor bounces and complaints

### 5. Set Up Google OAuth (Optional)

For production Google Sign-In:

1. Go to https://console.cloud.google.com/
2. Select your project or create new one
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `http://your-staging-server:3000/api/auth/callback/google` (if using staging)
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.production`

## Docker Deployment

### Quick Deploy Commands

When you've pushed new code and need to deploy:

```bash
# 1. Stop all containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 2. Clean up old images and build cache
docker system prune -f

# 3. Rebuild with no cache (ensures latest code is used)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 4. Start containers in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Check logs to verify everything started correctly
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100
```

## After Deployment

### 1. Verify Deployment

Check that all services are running:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

You should see:
- `app` - Next.js application (healthy)
- `mongodb` - MongoDB database (healthy)
- `redis` - Redis cache (optional, healthy)

### 2. Check Application Logs

Monitor logs for errors:

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Just the app
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app -f
```

Look for:
- ✅ `Server started on port 3000`
- ✅ `MongoDB connected successfully`
- ✅ `Redis connected` (if using Redis)

### 3. Test SMTP Email Configuration

From your server, run the email test script:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app npx tsx scripts/test-email.ts
```

You should receive a test email. If not, check SMTP credentials.

### 4. Create First Admin User

**Important**: The first user registered automatically becomes admin!

1. Visit your production URL (e.g., https://yourdomain.com)
2. Click "Sign Up" in the top right
3. Fill in registration form with your admin email
4. As first user:
   - Email verification is automatically skipped
   - You'll be logged in immediately
   - Admin role is assigned
5. Access admin dashboard at `/admin`

### 5. Verify Admin Dashboard

1. Navigate to https://yourdomain.com/admin
2. You should see:
   - Platform statistics
   - User management page
   - Room management page
   - Analytics dashboard

### 6. Test Email Verification (Regular Users)

After creating first admin user, test regular user registration:

1. Sign out from admin account
2. Register a new account
3. Check email inbox for verification link
4. Click verification link
5. Sign in with verified account

### 7. Test OAuth Authentication (If Configured)

1. Click "Sign in with Google"
2. Authorize the application
3. Verify successful login
4. Check that user is created in admin dashboard

### 8. Clear Browser Cache

For clients accessing the site:
- **Chrome/Edge**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- **Or use Incognito/Private mode** for testing
- **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Monitoring and Maintenance

### View Live Logs

```bash
# Real-time logs with timestamps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --timestamps

# Filter logs by service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app -f
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs mongodb -f
```

### Database Backup

```bash
# Backup MongoDB
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec mongodb mongodump --out=/backup

# Copy backup from container
docker cp typingtoy-mongodb-1:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Health Check

```bash
# Check container health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Test HTTP response
curl -I https://yourdomain.com

# Check MongoDB connection
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec mongodb mongosh --eval "db.stats()"
```

## Troubleshooting

### Email Verification Not Working

**Symptoms**: Users not receiving verification emails

**Solutions**:
- Check SMTP logs: `docker compose logs app | grep -i smtp`
- Test SMTP: `docker compose exec app npx tsx scripts/test-email.ts`
- Verify SMTP credentials in `.env.production`
- Check spam folder
- For Gmail: Ensure 2FA enabled and using App Password
- Port 587 requires `SMTP_SECURE=false` (STARTTLS)
- Port 465 requires `SMTP_SECURE=true` (SSL/TLS)

### Cannot Access Admin Dashboard

**Symptoms**: Redirect to home page when accessing `/admin`

**Solutions**:
- Verify you're logged in
- Check user role: Only users with `role: 'admin'` can access
- First registered user automatically becomes admin
- Other users need admin role assigned via admin dashboard
- Check session in browser DevTools → Application → Cookies

### MongoDB Connection Errors

**Symptoms**: App fails to start, MongoDB connection errors in logs

**Solutions**:
- Check `MONGODB_URI` in `.env.production`
- For Atlas: Whitelist server IP in MongoDB Atlas
- For self-hosted: Ensure MongoDB container is running
- Verify MongoDB credentials
- Test connection: `docker compose exec app mongosh $MONGODB_URI`

### OAuth Not Working

**Symptoms**: "OAuth callback error" or redirect fails

**Solutions**:
- Verify `NEXTAUTH_URL` matches your production domain
- Check Google Console authorized redirect URIs
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify OAuth consent screen is published (not in testing mode)
- Check browser console for detailed error messages

### Port Conflicts

**Symptoms**: "Port already in use" error

**Solutions**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill

# Or change port in docker-compose
ports:
  - "3001:3000"
```

### High Memory Usage

**Symptoms**: Server slow or crashes

**Solutions**:
- Increase Docker memory limit
- Optimize MongoDB indexes
- Enable Redis caching
- Monitor with: `docker stats`

### SSL Certificate Issues

**Symptoms**: "Not secure" warning in browser

**Solutions**:
- Use Nginx reverse proxy with Let's Encrypt
- Configure Caddy server for automatic HTTPS
- Or use Cloudflare for SSL termination

## Production Checklist

Before going live, ensure:

- [ ] `.env.production` configured with all required variables
- [ ] `NEXTAUTH_SECRET` is a strong, unique value (32+ characters)
- [ ] `NEXTAUTH_URL` points to production domain with HTTPS
- [ ] MongoDB has authentication enabled
- [ ] MongoDB backups configured
- [ ] SMTP email service configured and tested
- [ ] Google OAuth redirect URIs updated for production
- [ ] First admin user created and tested
- [ ] Email verification working for new users
- [ ] Admin dashboard accessible
- [ ] SSL/HTTPS configured
- [ ] Domain DNS pointing to server
- [ ] Firewall configured (allow ports 80, 443)
- [ ] Monitoring and logging set up
- [ ] robots.txt configured (admin pages blocked)
- [ ] Error tracking enabled (Sentry, etc.)

## Security Best Practices

1. **Never commit `.env.production` to git**
2. Use strong passwords for MongoDB users
3. Enable MongoDB authentication in production
4. Keep Docker images updated: `docker compose pull`
5. Monitor failed login attempts
6. Set up rate limiting for API routes
7. Use HTTPS in production (not HTTP)
8. Regularly backup MongoDB data
9. Monitor email sending limits (avoid spam flags)
10. Review admin user list periodically

## Support and Resources

- **Documentation**: See README.md, ARCHITECTURE.md, GETTING_STARTED.md
- **Admin Guide**: See ADMIN_SYSTEM.md
- **Issues**: Report at GitHub repository
- **Logs**: Always check Docker logs first when debugging
