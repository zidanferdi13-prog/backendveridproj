# Railway Deployment Guide

## Persiapan

### 1. Prasyarat
- Akun Railway (https://railway.app)
- Git repository sudah di-push
- Node.js 18+ (Railway akan auto-detect)

### 2. Environment Variables yang Diperlukan

Untuk deployment di Railway, set environment variables berikut di project settings:

#### MySQL/MariaDB Connection
```
MYSQLHOST=<host dari Railway MySQL plugin>
MYSQLPORT=3306
MYSQLUSER=<username>
MYSQLPASSWORD=<password>
MYSQLDATABASE=veridface
```

#### MQTT Broker
```
MQTT_BROKER_URL=mqtt://your-mqtt-broker:1883
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=mqtt_password
```

#### Server
```
PORT=3000 (Railway akan auto-set ini, tapi bisa di-override)
LOG_LEVEL=info
```

## Langkah-Langkah Deployment

### Opsi 1: Deploy dengan Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login ke Railway**
   ```bash
   railway login
   ```

3. **Link Project**
   ```bash
   railway link
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Opsi 2: Deploy dengan GitHub Integration

1. Buka dashboard Railroad (https://railway.app/dashboard)
2. Klik "New Project"
3. Pilih "Deploy from GitHub"
4. Hubungkan repository Anda
5. Railway akan auto-detect `package.json` dan deploy

### Opsi 3: Deploy dengan Railway Web UI

1. Buat project baru di Railway
2. Pilih "Deploy from GitHub Repo"
3. Koneksikan repository
4. Set environment variables di project settings
5. Deploy automatic

## Setup Database di Railway

### Jika menggunakan Railway MySQL Plugin:

1. Di Railway dashboard, klik "Add Service"
2. Pilih "MySQL"
3. Railway akan auto-set MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD
4. Klik "Add" untuk menambahkan ke project
5. Database variables akan auto-available di backend service

### Jalankan Inisialisasi Database

Setelah database connected, jalankan SQL init:

```bash
# Bisa dilakukan via Railway Shell atau local mysql client
mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD -D $MYSQLDATABASE < docs/DATABASE_INIT_NEW.sql
```

## Health Check Endpoints

Untuk verify deployment:

```bash
# Status server
curl https://your-railway-url.railway.app/

# Health check lengkap
curl https://your-railway-url.railway.app/health

# API status dengan database & MQTT
curl https://your-railway-url.railway.app/api/status
```

## Monitoring

### Logs di Railway
1. Buka project di Railway dashboard
2. Klik service Anda
3. Tab "Logs" untuk real-time logs
4. Filter by level: INFO, ERROR, WARN

### Health Monitoring
- Endpoint `/health` menunjukkan status database & MQTT
- Endpoint `/api/status` lebih detailed

## Troubleshooting

### Build Error
- Ensure `package.json` di root directory ✓
- Ensure `src/index.js` sebagai entry point ✓

### Database Connection Error
- Verify MYSQLHOST, MYSQLUSER, MYSQLPASSWORD correct
- Ensure firewall memungkinkan connection (Railway allows by default)
- Check logs untuk detail error

### MQTT Connection Error
- Verify MQTT_BROKER_URL accessible dari Railway region
- Check MQTT_USERNAME dan MQTT_PASSWORD
- MQTT tidak required untuk server jalan (graceful fallback)

### Port Issues
- Railway auto-assigns PORT env var
- App sudah config untuk use PORT dari env ✓

## Best Practices

1. **Never commit .env** - Gunakan .env.example sebagai template
2. **Keep logs tidy** - Configure LOG_LEVEL=info di production
3. **Monitor regularly** - Check Rails dashboard untuk anomalies
4. **Update dependencies** - Keep npm packages updated
5. **Database backups** - Use Railway's backup features untuk MySQL

## Rollback

Jika ada issue setelah deploy:

```bash
railway rollback
```

Atau di web UI: Project > Deployments > Select previous > Redeploy

## Estimasi Biaya

Railway pricing (per usage):
- Compute: $0.50/hour (shared), $0.00/hour included free tier
- Storage: $0.1/GB/month
- Outbound bandwidth: $0.10/GB

Check dashboard untuk real-time usage.

---

Butuh bantuan? Lihat docs lainnya:
- [API_ENDPOINTS.md](API_ENDPOINTS.md)
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
