# CarsTuneUp - Apps Running Successfully ✅

## Current Status

### ✅ Backend API
- **Status**: Running
- **Port**: 5000
- **Network**: Accessible on LAN at `http://192.168.1.7:5000`
- **Database**: Connected to MongoDB Atlas
- **Health Check**: http://192.168.1.7:5000/api/health

### ✅ Customer App (React Native)
- **Status**: Running
- **Metro**: Port 8081
- **API URL**: `http://192.168.1.7:5000/api`
- **SDK**: Expo 54
- **Access**: Scan QR code with Expo Go app

### 📱 How to Use the Customer App

1. **On your Android phone:**
   - Open Expo Go app
   - Scan the QR code shown in the terminal
   - App will load and connect to the backend

2. **Register a new account:**
   - Open the app
   - Tap "Sign Up"
   - Fill in: Name, Email, Phone, Password
   - Tap "Sign Up"
   - You'll be logged in automatically

3. **Or Login:**
   - Email: (your registered email)
   - Password: (your password)

## What's Working

### Customer App Features:
- ✅ User Registration
- ✅ User Login
- ✅ Browse Services (Home Screen)
- ✅ View Service Details
- ✅ Create Subscriptions
- ✅ View My Subscriptions
- ✅ User Profile
- ✅ Logout

### Backend API Endpoints:
- ✅ POST /api/auth/register - Register new user
- ✅ POST /api/auth/login - Login
- ✅ GET /api/auth/me - Get current user
- ✅ GET /api/services - Get all services
- ✅ POST /api/subscriptions - Create subscription
- ✅ GET /api/subscriptions - Get user subscriptions
- ✅ GET /api/health - Health check

## Network Configuration

### Backend
- Listening on: `0.0.0.0:5000` (all network interfaces)
- LAN IP: `192.168.1.7`
- Accessible from: Any device on the same Wi-Fi network

### Customer App
- API Base URL: `http://192.168.1.7:5000/api`
- Set via: `EXPO_PUBLIC_API_URL` environment variable

## Admin Dashboard (Not Started Yet)

To run the admin dashboard:
```bash
cd admin-dashboard
npm run dev
```
Then open http://localhost:3000

## Employee App (Not Started Yet)

To run the employee app:
```bash
cd employee-app
$env:EXPO_PUBLIC_API_URL="http://192.168.1.7:5000/api"
npm start
```

## Create Admin User

Before using the admin dashboard, create an admin account:

```powershell
$body = @{
  name     = "Admin"
  email    = "admin@carstuneup.com"
  password = "Admin@12345"
  phone    = "9535958887"
  role     = "admin"
  address  = @{}
  area     = "HQ"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.7:5000/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Troubleshooting

### "Network Error" in app
- Ensure backend is running (check terminal)
- Verify phone and PC are on same Wi-Fi
- Test backend: http://192.168.1.7:5000/api/health in phone browser
- Check Windows Firewall allows port 5000

### Backend not accessible
- Restart backend: `npm start` in backend folder
- Check it shows: "🌐 Accessible at http://192.168.1.7:5000"
- Verify MongoDB connection: "✅ Connected to MongoDB Atlas"

### App won't load
- Restart Expo: Ctrl+C, then `npm start`
- Clear cache: `npm start -- --clear`
- Ensure Expo Go is updated to latest version

## Next Steps

1. **Test the customer app** - Register, browse services, create subscription
2. **Add services** - Use admin dashboard or API to add car wash services
3. **Start employee app** - For employees to manage jobs
4. **Configure Firebase** - For push notifications (optional)
5. **Add custom assets** - Replace placeholder icons/splash screens

## Important Notes

- Firebase warning is normal (push notifications disabled until configured)
- Keep backend running while using mobile apps
- LAN IP (192.168.1.7) may change if router restarts
- For production, deploy backend to a cloud service with static IP/domain
