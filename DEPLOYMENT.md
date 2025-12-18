# CarsTuneUp - Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying all components of the CarsTuneUp application to production.

---

## 📦 Backend Deployment (Render/Railway)

### Option 1: Deploy to Render

#### 1. Prepare Repository
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 2. Create Render Account
- Go to [Render.com](https://render.com)
- Sign up with GitHub

#### 3. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the `backend` directory

#### 4. Configure Service
```
Name: carstuneup-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

#### 5. Add Environment Variables
```
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
WHATSAPP_BUSINESS_NUMBER=<your-whatsapp-number>
ADMIN_DASHBOARD_URL=https://your-admin-dashboard.vercel.app
CUSTOMER_APP_URL=*
EMPLOYEE_APP_URL=*
```

#### 6. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://carstuneup-backend.onrender.com`

### Option 2: Deploy to Railway

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize
```bash
cd backend
railway login
railway init
```

#### 3. Add Environment Variables
```bash
railway variables set MONGODB_URI=<your-mongodb-uri>
railway variables set JWT_SECRET=<your-jwt-secret>
# Add all other environment variables
```

#### 4. Deploy
```bash
railway up
```

---

## 🌐 Admin Dashboard Deployment (Vercel)

### 1. Prepare Repository
```bash
cd admin-dashboard
git init
git add .
git commit -m "Initial admin dashboard commit"
git push
```

### 2. Deploy to Vercel

#### Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Via Vercel Dashboard
1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select `admin-dashboard` directory
5. Framework Preset: Next.js
6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   ```
7. Click "Deploy"

### 3. Configure Domain (Optional)
- Go to Project Settings → Domains
- Add custom domain
- Update DNS records

---

## 📱 Mobile Apps Deployment

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Customer App Deployment

#### 1. Configure EAS
```bash
cd customer-app
eas build:configure
```

#### 2. Update app.json
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### 3. Update API URL
Edit `src/config/api.js`:
```javascript
const API_URL = 'https://your-backend-url.onrender.com/api';
```

#### 4. Build for Android
```bash
eas build --platform android --profile production
```

#### 5. Build for iOS
```bash
eas build --platform ios --profile production
```

#### 6. Submit to Stores

**Google Play Store:**
```bash
eas submit --platform android
```

**Apple App Store:**
```bash
eas submit --platform ios
```

### Employee App Deployment

Follow the same steps as Customer App:
```bash
cd employee-app
eas build:configure
# Update API URL in src/config/api.js
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

---

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Production Database
- Create separate production cluster
- Use strong credentials
- Configure IP whitelist (0.0.0.0/0 for cloud services)
- Enable backup

### 2. Connection String
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/carstuneup_prod?retryWrites=true&w=majority
```

### 3. Indexes (Run in MongoDB Shell)
```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });

// Subscriptions collection
db.subscriptions.createIndex({ userId: 1, status: 1 });
db.subscriptions.createIndex({ nextWashDate: 1, status: 1 });

// Jobs collection
db.jobs.createIndex({ employeeId: 1, scheduledDate: 1 });
db.jobs.createIndex({ status: 1, scheduledDate: 1 });
```

---

## 🔐 Security Checklist

### Backend
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] MongoDB connection string secured
- [ ] Environment variables not committed

### Admin Dashboard
- [ ] HTTPS enabled
- [ ] API URL uses HTTPS
- [ ] No sensitive data in client code
- [ ] Admin-only routes protected

### Mobile Apps
- [ ] API URL uses HTTPS
- [ ] Tokens stored securely (AsyncStorage)
- [ ] No hardcoded secrets
- [ ] App signing configured

---

## 📊 Monitoring & Maintenance

### Backend Monitoring
- Set up error logging (Sentry, LogRocket)
- Monitor API response times
- Track database performance
- Set up uptime monitoring (UptimeRobot)

### Database Backups
- Enable automated backups in MongoDB Atlas
- Test restore procedures
- Keep backup retention policy

### Updates
```bash
# Backend
cd backend
npm update
npm audit fix

# Admin Dashboard
cd admin-dashboard
npm update

# Mobile Apps
cd customer-app
npm update
cd ../employee-app
npm update
```

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### GitHub Actions for Admin Dashboard

Create `.github/workflows/deploy-admin.yml`:
```yaml
name: Deploy Admin Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'admin-dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🧪 Post-Deployment Testing

### 1. Backend API
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Test authentication
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Admin Dashboard
- Navigate to your Vercel URL
- Test login functionality
- Verify dashboard loads
- Check API connections

### 3. Mobile Apps
- Download from TestFlight/Internal Testing
- Test all core features
- Verify API connectivity
- Test push notifications

---

## 📝 Environment-Specific Configurations

### Development
```env
NODE_ENV=development
API_URL=http://localhost:5000/api
```

### Staging
```env
NODE_ENV=staging
API_URL=https://staging-api.carstuneup.com/api
```

### Production
```env
NODE_ENV=production
API_URL=https://api.carstuneup.com/api
```

---

## 🚨 Rollback Procedures

### Backend Rollback (Render)
1. Go to Render Dashboard
2. Select your service
3. Click "Manual Deploy"
4. Select previous commit
5. Deploy

### Admin Dashboard Rollback (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments
4. Find previous deployment
5. Click "Promote to Production"

### Mobile Apps Rollback
- Cannot rollback app store versions
- Push hotfix update
- Use OTA updates (Expo Updates) for minor fixes

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend not connecting to MongoDB:**
- Check connection string
- Verify IP whitelist
- Check database user permissions

**CORS errors:**
- Verify CORS configuration in backend
- Check allowed origins
- Ensure credentials are included

**Mobile app can't reach API:**
- Verify API URL is HTTPS
- Check network permissions
- Test API endpoint in browser

---

## ✅ Deployment Checklist

- [ ] Backend deployed and running
- [ ] Database configured and secured
- [ ] Admin dashboard deployed
- [ ] Customer app built and submitted
- [ ] Employee app built and submitted
- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] Domain names configured
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Documentation updated
- [ ] Team trained on production access

---

**Congratulations! Your CarsTuneUp application is now live! 🎉🚗**
