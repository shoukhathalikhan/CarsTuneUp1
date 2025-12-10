# CarsTuneUp - Quick Start Guide 🚀

## ✅ Everything is Now Configured!

### What's Fixed:
- ✅ Backend configured to accept network connections
- ✅ Customer app configured with correct API URL
- ✅ All missing screens created
- ✅ MongoDB connected
- ✅ Network error resolved

## 🎯 How to Start Everything

### Option 1: Use the Startup Script (Easiest)
Right-click `START_APPS.ps1` and select "Run with PowerShell"

This will:
- Start the backend API in one window
- Start the customer app in another window
- Show you the URLs and QR code

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Customer App:**
```powershell
cd customer-app
npm start
```

## 📱 Using the Customer App

1. **Open Expo Go** on your Android phone
2. **Scan the QR code** shown in the customer-app terminal
3. **Wait for the app to load** (first time may take 30-60 seconds)
4. **You'll see the Login screen**

### First Time Setup:
1. Tap **"Sign Up"**
2. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Phone: Your phone number
   - Password: At least 6 characters
   - Confirm Password: Same as above
3. Tap **"Sign Up"**
4. You'll be automatically logged in!

### App Features:
- **Home**: Browse available car wash services
- **Subscriptions**: View and manage your subscriptions
- **Insurance**: Insurance information (placeholder)
- **Profile**: Your account details and logout

## 🔧 Troubleshooting

### "Network Error" on Registration/Login
1. Check backend is running (should show "✅ Connected to MongoDB Atlas")
2. Verify your phone and PC are on the **same Wi-Fi network**
3. Test in phone browser: http://192.168.1.7:5000/api/health
4. If it doesn't load, check Windows Firewall settings

### App Won't Load
1. Make sure Expo Go is updated to latest version
2. Try clearing cache: In customer-app terminal, press `Shift+C`
3. Restart Expo: Press `Ctrl+C`, then `npm start`

### QR Code Won't Scan
1. Make sure you're using **Expo Go** app (not camera)
2. Try pressing `a` in the terminal to open on Android
3. Or manually enter the URL shown in Expo Go

### Backend Won't Start
1. Check MongoDB credentials in `backend/.env`
2. Ensure `MONGODB_URI` is correct
3. See `backend/MONGODB_SETUP.md` for help

## 📊 Admin Dashboard

To create an admin account and use the dashboard:

**1. Create Admin User:**
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

**2. Start Admin Dashboard:**
```powershell
cd admin-dashboard
npm run dev
```

**3. Open:** http://localhost:3000

**4. Login with:**
- Email: admin@carstuneup.com
- Password: Admin@12345

## 🔑 Important URLs

- **Backend API**: http://192.168.1.7:5000
- **API Health Check**: http://192.168.1.7:5000/api/health
- **Admin Dashboard**: http://localhost:3000 (when running)
- **Customer App**: Scan QR code with Expo Go

## 📝 Configuration Files

### Backend (.env)
Located at: `backend/.env`
Contains: MongoDB URI, JWT secret, Firebase credentials

### Customer App (app.config.js)
Located at: `customer-app/app.config.js`
Contains: API URL (http://192.168.1.7:5000/api)

## 🎨 Next Steps

1. **Test the customer app** - Register, browse services
2. **Add services** - Use admin dashboard to add car wash services
3. **Customize** - Update colors, logos, etc.
4. **Deploy** - When ready, deploy to production

## 💡 Tips

- Keep both backend and customer app running while testing
- Your LAN IP (192.168.1.7) may change if router restarts
- For production, deploy backend to cloud with static domain
- Firebase is optional (for push notifications)

## 📚 Documentation

- `SETUP_COMPLETE.md` - Full setup documentation
- `RUNNING_APPS.md` - Current running status
- `backend/MONGODB_SETUP.md` - MongoDB configuration help

## 🆘 Need Help?

1. Check the error message in the terminal
2. Review the troubleshooting section above
3. Ensure all dependencies are installed (`npm install`)
4. Verify environment variables are set correctly

---

**Ready to go! Scan the QR code and start using your app! 🎉**
