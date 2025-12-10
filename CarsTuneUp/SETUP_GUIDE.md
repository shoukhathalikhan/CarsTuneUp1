# CarsTuneUp - Complete Setup Guide

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (or local MongoDB)
- **Expo CLI** for React Native apps
- **Git** for version control

## 🚀 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
WHATSAPP_BUSINESS_NUMBER=+1234567890
```

### 4. Start Backend Server
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## 🖥️ Admin Dashboard Setup

### 1. Navigate to Admin Dashboard Directory
```bash
cd admin-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Development Server
```bash
npm run dev
```

Admin dashboard will run on `http://localhost:3000`

**Default Admin Credentials** (Create via MongoDB or API):
- Email: admin@carstuneup.com
- Password: admin123
- Role: admin

## 📱 Customer App Setup

### 1. Navigate to Customer App Directory
```bash
cd customer-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Update API URL
Edit `src/config/api.js` and update the API_URL:
```javascript
const API_URL = 'http://YOUR_LOCAL_IP:5000/api'; // Use your machine's IP, not localhost
```

### 4. Start Expo Development Server
```bash
npx expo start
```

### 5. Run on Device/Emulator
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## 👷 Employee App Setup

### 1. Navigate to Employee App Directory
```bash
cd employee-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Update API URL
Edit `src/config/api.js` and update the API_URL:
```javascript
const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

### 4. Start Expo Development Server
```bash
npx expo start --port 19001
```

### 5. Run on Device/Emulator
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app

## 🗄️ Database Setup

### MongoDB Atlas Setup

1. **Create Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select your preferred region
   - Create cluster

3. **Create Database User**:
   - Go to Database Access
   - Add new database user
   - Save username and password

4. **Whitelist IP Address**:
   - Go to Network Access
   - Add IP Address
   - Allow access from anywhere (0.0.0.0/0) for development

5. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Add to backend `.env` file

### Initial Data Seeding (Optional)

Create an admin user via API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@carstuneup.com",
    "password": "admin123",
    "phone": "+1234567890",
    "role": "admin",
    "area": "Central"
  }'
```

## 🔧 Firebase Setup (Push Notifications)

### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create new project
- Add Android/iOS apps

### 2. Download Service Account Key
- Go to Project Settings > Service Accounts
- Generate new private key
- Save JSON file

### 3. Configure Backend
Add to backend `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 4. Configure Mobile Apps
- Add `google-services.json` (Android) to customer-app and employee-app
- Add `GoogleService-Info.plist` (iOS) to customer-app and employee-app

## 🗺️ Google Maps Setup

### 1. Get API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable Maps SDK for Android/iOS
- Create API key

### 2. Configure Backend
Add to backend `.env`:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Configure Mobile Apps
Add to `app.json` in both mobile apps:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

## 📞 WhatsApp Integration

Update the WhatsApp business number in:
- Backend `.env`: `WHATSAPP_BUSINESS_NUMBER`
- Customer app `src/screens/InsuranceScreen.js`: `WHATSAPP_NUMBER`

## ✅ Testing the Setup

### 1. Test Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "CarsTuneUp API is running"
}
```

### 2. Test Admin Dashboard
- Navigate to `http://localhost:3000`
- Login with admin credentials
- Check dashboard loads

### 3. Test Mobile Apps
- Open Expo Go app
- Scan QR code
- Test registration and login

## 🚢 Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Add environment variables
4. Deploy

### Admin Dashboard (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Mobile Apps
1. Build APK/IPA using EAS Build
2. Submit to Google Play Store / Apple App Store

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure all environment variables are set
- Check port 5000 is not in use

### Mobile app can't connect to backend
- Use your machine's local IP instead of localhost
- Ensure backend is running
- Check firewall settings

### Admin dashboard shows errors
- Run `npm install` again
- Clear `.next` folder and rebuild
- Check API URL in `.env.local`

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🆘 Support

For issues or questions:
1. Check this setup guide
2. Review error logs
3. Check API endpoints are responding
4. Verify environment variables are correct

---

**Happy Coding! 🚗✨**
