# ✅ Railway Deployment Checklist

## Pre-Deployment Checklist

### 1. Project Readiness
- [x] package.json ada dengan dependencies yang correct
- [x] src/index.js sebagai entry point
- [x] Railway.json configuration sudah dibuat
- [x] Procfile sudah ada
- [x] .env.example sudah ada (untuk reference)

### 2. Code Quality
- [ ] All dependencies di package.json (no global npm installs)
- [ ] No hardcoded credentials di source code
- [ ] PORT dari environment variable (✓ sudah benar)
- [ ] Database connection graceful fallback (✓ sudah ada)
- [ ] Logs diset ke Winston logger (✓ sudah ada)

### 3. Environment Variables
Pastikan variables ini sudah di-set di Railway dashboard:

#### Database (REQUIRED)
```
MYSQLHOST=
MYSQLPORT=3306
MYSQLUSER=
MYSQLPASSWORD=
MYSQLDATABASE=veridface
```

#### MQTT (OPTIONAL - graceful fallback)
```
MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
```

#### Server (OPTIONAL)
```
PORT=3000 (auto-set by Railway)
LOG_LEVEL=info
```

### 4. Database Setup
- [ ] MySQL database sudah dibuat
- [ ] Schema sudah di-initialize (run DATABASE_INIT_NEW.sql)
- [ ] Test connection dari Railway environment

### 5. Git Repository
- [ ] All files di-commit (except .env, node_modules)
- [ ] .gitignore correct (check file berikut)
- [ ] Remote URL benar (untuk GitHub integration)

## Deployment Steps

### Step 1: Link Repository (Jika belum)
```bash
git remote -v  # Verify remote
git push -u origin main  # Make sure main branch exists
```

### Step 2: Create Railway Project

**Option A - GitHub Integration (Recommended)**
1. Buka https://railway.app
2. Login dengan akun Railway
3. New Project → Deploy from GitHub
4. Authorize GitHub app
5. Select repository
6. Railway auto-detect Node.js

**Option B - Railway CLI**
```bash
railway login
railway link
```

### Step 3: Configure Environment

Di Railway dashboard:
1. Klik project → Settings
2. Add variables (copy dari .env.example):
   - MYSQLHOST
   - MYSQLUSER
   - MYSQLPASSWORD
   - MYSQLDATABASE
   - MQTT_BROKER_URL (optional)
   - LOG_LEVEL

### Step 4: Add MySQL Service (Jika perlu)

1. Di Railway dashboard → Add Service
2. Pilih "MySQL"
3. Railway auto-add MYSQL* variables
4. Klik Add

### Step 5: Deploy

**If using GitHub integration:**
- Automatic deploy on push, atau
- Manual trigger dari dashboard

**If using CLI:**
```bash
railway up
```

### Step 6: Initialize Database

```bash
# SSH ke Railway app
railway shell

# Run init script
mysql -h $MYSQLHOST -u $MYSQLUSER -p"$MYSQLPASSWORD" $MYSQLDATABASE < docs/DATABASE_INIT_NEW.sql
```

Atau via local:
```bash
mysql -h <your-railway-mysql-host> -u <user> -p <password> <database> < docs/DATABASE_INIT_NEW.sql
```

## Post-Deployment Verification

### 1. Check Deployment Status
```bash
# Via CLI
railway status

# Or check dashboard Logs tab
```

### 2. Test Health Endpoints
```bash
# Server running?
curl https://your-railway-url.railway.app/

# Complete health?
curl https://your-railway-url.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "mqtt": "connected|disconnected",
  "database": "connected|disconnected",
  "dbHost": "your-mysql-host",
  "timestamp": "2024-01-25T..."
}
```

### 3. Test API Endpoint
```bash
# Test user API
curl https://your-railway-url.railway.app/user/all
```

### 4. Check Logs
- Railway dashboard → Logs tab
- Look for "MySQL/MariaDB connected" or errors

## Troubleshooting

### Build Failed
```
Check:
- package.json di root directory
- All dependencies exist
- npm install locally dulu
```

### Deployment Success but App Crashes
```
1. Check Logs tab di Railway
2. Common issues:
   - Missing MYSQLHOST → database connection fails
   - MQTT connection timeout → should be graceful
   - Missing required files → check Procfile
```

### Database Connection Fails
```
1. Verify credentials di Railway env vars
2. Check if MySQL service running
3. Test manually:
   mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD
```

### MQTT Connection Fails
```
- This is OK (graceful fallback enabled)
- Check MQTT_BROKER_URL accessible from Railway
- MQTT is optional, app runs without it
```

### Port Issues
```
1. Railway auto-assigns PORT env variable
2. App reads process.env.PORT
3. If localhost:3000 doesn't work → use Railway URL
```

## Monitoring & Maintenance

### Daily
- [ ] Check health endpoint
- [ ] Monitor error logs
- [ ] Verify database connectivity

### Weekly
- [ ] Review Railway dashboard for anomalies
- [ ] Check storage usage
- [ ] Update dependencies if needed

### Monthly
- [ ] Full backup of database
- [ ] Review & optimize queries
- [ ] Update documentation

## Useful Commands

```bash
# Check Railway deployment status
railway status

# View live logs
railway logs --follow

# SSH into app
railway shell

# View environment variables
railway variables

# Rollback to previous version
railway rollback

# View project info
railway info
```

## Important Notes

✅ **Already Configured in Code:**
- PORT from environment variable
- Database graceful fallback
- MQTT optional (non-blocking)
- Winston logger setup
- Proper error handling

❌ **Manual Setup Required:**
- Create Railway project
- Set environment variables
- Add MySQL service (if needed)
- Initialize database schema
- Configure MQTT broker (optional)

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Node.js on Railway](https://docs.railway.app/deploy/nodejs)
- [MySQL on Railway](https://docs.railway.app/databases/mysql)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

**Status**: Ready for deployment ✅
**Last Updated**: 2024-01-25
**Deploy Time Estimate**: 5-10 minutes
