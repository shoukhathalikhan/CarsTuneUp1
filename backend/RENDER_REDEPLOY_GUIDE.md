# Backend Redeployment Guide for Render

## 🚀 Quick Redeploy

Your backend is already deployed at: **https://carstuneup1.onrender.com**

### Method 1: Trigger Manual Deploy (Fastest)

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com](https://dashboard.render.com)
   - Login with your account

2. **Select Your Service**
   - Find and click on `carstuneup-backend` or `carstuneup1`

3. **Manual Deploy**
   - Click **"Manual Deploy"** button (top right)
   - Select **"Deploy latest commit"**
   - Click **"Deploy"**
   - Wait 2-3 minutes for deployment to complete

---

### Method 2: Push to Git (Auto-Deploy)

If you have auto-deploy enabled:

```powershell
cd c:\CarsTuneUp\backend
git add .
git commit -m "Update backend configuration with admin dashboard URL"
git push origin master
```

Render will automatically detect the push and redeploy.

---

## 🔧 Environment Variables to Update

Make sure these environment variables are set in Render Dashboard:

### Required Variables (Already Set)
- `NODE_ENV` = `production`
- `PORT` = `5000`
- `MONGODB_URI` = `mongodb+srv://zaibasaniya944_db_user:UIBtPQkrCHF46jyM@cluster0.etloubc.mongodb.net/carztuneup?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET` = `9f6c3d2a8b7e4c1f0a9d5b2e7c3f1a4d9e6b2c1f8a7d4e3b2c1a9f0e6d3b5c79`
- `JWT_EXPIRE` = `7d`

### Firebase Variables (Already Set)
- `FIREBASE_PROJECT_ID` = `carztuneup`
- `FIREBASE_PRIVATE_KEY` = (your private key)
- `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-fbsvc@carztuneup.iam.gserviceaccount.com`

### Google OAuth (Already Set)
- `GOOGLE_CLIENT_ID` = `139313575789-h0alijj4pbdod8tok98psi1sas63a9cd.apps.googleusercontent.com`

### Cloudinary (Already Set)
- `CLOUDINARY_CLOUD_NAME` = `dcpaa0vub`
- `CLOUDINARY_API_KEY` = `632754616818144`
- `CLOUDINARY_API_SECRET` = `VMw2ahaQGuCbKb-XCDozE2DEx3c`

### **NEW: Frontend URLs (Add These)**
- `ADMIN_DASHBOARD_URL` = `https://admin-dashboard-gr6yld5by-shoukhat2003-gmailcoms-projects.vercel.app`
- `CUSTOMER_APP_URL` = `*`
- `EMPLOYEE_APP_URL` = `*`
- `CORS_ORIGIN` = `*`

---

## 📝 How to Add/Update Environment Variables

1. **Go to Service Settings**
   - Click on your service in Render Dashboard
   - Go to **"Environment"** tab

2. **Add New Variables**
   - Click **"Add Environment Variable"**
   - Enter **Key** and **Value**
   - Click **"Save Changes"**

3. **Redeploy After Changes**
   - After adding variables, click **"Manual Deploy"**
   - Select **"Clear build cache & deploy"** if needed

---

## 🧪 Test Backend After Deployment

### Test Health Endpoint
```powershell
curl https://carstuneup1.onrender.com/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "CarsTuneUp API is running",
  "timestamp": "2025-12-28T..."
}
```

### Test from Admin Dashboard
1. Open your admin dashboard: https://admin-dashboard-gr6yld5by-shoukhat2003-gmailcoms-projects.vercel.app
2. Try to login
3. Check if data loads correctly

---

## 🔍 Troubleshooting

### Backend Not Responding
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set
- Check MongoDB connection string is correct

### CORS Errors
- Verify `ADMIN_DASHBOARD_URL` is set correctly
- Check `CORS_ORIGIN` is set to `*`
- Redeploy after changing CORS settings

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check MongoDB credentials are correct
- Ensure database name is `carztuneup`

### Build Fails
- Check Render build logs
- Verify `package.json` has correct dependencies
- Try "Clear build cache & deploy"

---

## 📊 Monitor Your Backend

### View Logs
```
Dashboard → Your Service → Logs
```

### Check Metrics
```
Dashboard → Your Service → Metrics
```
- CPU usage
- Memory usage
- Response times
- Error rates

---

## 🔄 Deployment Status

- ✅ Backend URL: `https://carstuneup1.onrender.com`
- ✅ API Base: `https://carstuneup1.onrender.com/api`
- ✅ Health Check: Working
- ✅ Admin Dashboard: Connected
- ⏳ Environment Variables: Need to add new frontend URLs

---

## 🎯 Next Steps

1. **Add the new environment variables** listed above
2. **Trigger manual deploy** in Render
3. **Test the connection** from admin dashboard
4. **Verify all features** work correctly

---

**Your backend is ready! Just add the environment variables and redeploy.** 🚀
