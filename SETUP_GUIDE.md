# CarsTuneUp - Complete Setup Guide

## 🚀 Project Overview

CarsTuneUp is a comprehensive car wash service management platform with three applications:
- **Admin Dashboard** (Next.js) - Manage services, subscriptions, customers, employees, and jobs
- **Customer App** (React Native/Expo) - Browse services, subscribe, and track washes
- **Employee App** (React Native/Expo) - View assigned jobs and manage tasks

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Expo CLI (for mobile apps)
- Android Studio / Xcode (for mobile development)

## 🛠️ Installation Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carstuneup?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=5242880

# App URLs (optional)
ADMIN_DASHBOARD_URL=http://localhost:3000
CUSTOMER_APP_URL=http://localhost:8081
EMPLOYEE_APP_URL=http://localhost:8082
```

**Start Backend:**
```bash
npm start
```

Backend will run on: `http://localhost:5000`

### 2. Admin Dashboard Setup

```bash
cd admin-dashboard
npm install
```

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Start Admin Dashboard:**
```bash
npm run dev
```

Dashboard will run on: `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@carstuneup.com`
- Password: `admin123`

### 3. Customer App Setup

```bash
cd customer-app
npm install
```

Update `src/config/api.js`:
```javascript
const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
// Example: 'http://192.168.1.7:5000/api'
```

**Start Customer App:**
```bash
npx expo start
```

### 4. Employee App Setup

```bash
cd employee-app
npm install
```

Update `src/config/api.js`:
```javascript
const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
// Example: 'http://192.168.1.7:5000/api'
```

**Start Employee App:**
```bash
npx expo start
```

## 🔑 Finding Your Local IP Address

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address under your active network interface.

## 📱 Testing Mobile Apps

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. Make sure phone and computer are on same WiFi network

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string and update `.env`

### Local MongoDB (Development)

```bash
# Install MongoDB locally
# Update .env:
MONGODB_URI=mongodb://localhost:27017/carstuneup
```

## 👤 Creating Initial Admin User

Run this script in backend folder:
```bash
node scripts/createAdmin.js
```

Or use MongoDB Compass/Shell to insert:
```javascript
db.users.insertOne({
  name: "Admin",
  email: "admin@carstuneup.com",
  password: "$2a$10$hashed_password_here",
  phone: "1234567890",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 📂 Project Structure

```
CarsTuneUp/
├── backend/                 # Node.js/Express API
│   ├── controllers/        # Business logic
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & upload middleware
│   ├── services/          # Automation services
│   └── uploads/           # Image storage
│
├── admin-dashboard/        # Next.js admin panel
│   ├── app/               # Next.js 13+ app directory
│   ├── components/        # React components
│   └── lib/               # Utilities & API client
│
├── customer-app/          # React Native customer app
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── config/       # API configuration
│   │   └── components/   # Reusable components
│   └── App.js
│
└── employee-app/          # React Native employee app
    ├── src/
    │   ├── screens/      # App screens
    │   ├── config/       # API configuration
    │   └── components/   # Reusable components
    └── App.js
```

## 🎨 Features Implemented

### Admin Dashboard
✅ Dashboard with analytics
✅ Services management (CRUD with image upload)
✅ Subscriptions management
✅ Customers list
✅ Employees list
✅ Jobs management
✅ Authentication & logout

### Customer App
✅ User authentication (login/register)
✅ Browse services
✅ View service details
✅ My subscriptions
✅ Insurance information
✅ Profile management
✅ Logout functionality

### Employee App
✅ Employee authentication
✅ Today's jobs
✅ All jobs list
✅ Job details
✅ Profile
✅ Logout functionality

## 🖼️ Image Upload Configuration

### Current Setup (Development)
- Images stored in `backend/uploads/` folder
- Served statically at `http://localhost:5000/uploads/`
- Organized by type: services/, profiles/, jobs/

### Production Recommendations

**Option 1: Cloudinary (Recommended)**
```bash
npm install cloudinary multer-storage-cloudinary
```

Benefits:
- Free tier: 25GB storage
- Automatic image optimization
- CDN included
- Easy integration

**Option 2: AWS S3**
```bash
npm install aws-sdk multer-s3
```

Benefits:
- Scalable
- Pay-as-you-go
- Industry standard

**Option 3: Firebase Storage**
```bash
npm install firebase-admin
```

Benefits:
- Good for mobile apps
- Real-time capabilities
- Google infrastructure

## 🔐 Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Implement rate limiting
- [ ] Add HTTPS in production
- [ ] Validate and sanitize all inputs
- [ ] Implement proper CORS policies
- [ ] Use secure password hashing (bcrypt)
- [ ] Add request logging
- [ ] Implement API key authentication for mobile apps

## 🚀 Deployment Guide

### Backend (Node.js)
**Recommended Platforms:**
- Heroku
- Railway
- Render
- DigitalOcean
- AWS EC2

**Steps:**
1. Set environment variables
2. Update CORS origins
3. Configure MongoDB Atlas
4. Deploy code
5. Run migrations if needed

### Admin Dashboard (Next.js)
**Recommended Platforms:**
- Vercel (easiest)
- Netlify
- AWS Amplify

**Steps:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Mobile Apps (React Native)
**Options:**
1. **Expo EAS Build** (Recommended)
   ```bash
   npm install -g eas-cli
   eas build --platform android
   eas build --platform ios
   ```

2. **Manual Build**
   - Android: Generate APK/AAB
   - iOS: Use Xcode

## 📊 API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user

### Services
- GET `/api/services` - Get all services
- POST `/api/services` - Create service (Admin)
- PUT `/api/services/:id` - Update service (Admin)
- DELETE `/api/services/:id` - Delete service (Admin)

### Subscriptions
- GET `/api/subscriptions/my-subscriptions` - Get user subscriptions
- POST `/api/subscriptions` - Create subscription
- GET `/api/subscriptions` - Get all subscriptions (Admin)

### Jobs
- GET `/api/jobs` - Get all jobs (Admin)
- GET `/api/jobs/my-jobs` - Get employee jobs
- PUT `/api/jobs/:id/status` - Update job status

### Users
- GET `/api/users` - Get all users (Admin)
- GET `/api/users/profile` - Get user profile

### Employees
- GET `/api/employees` - Get all employees (Admin)

### Analytics
- GET `/api/analytics/dashboard` - Get dashboard stats (Admin)

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure port 5000 is not in use
- Verify all environment variables are set

### Mobile app can't connect to backend
- Use local IP address, not localhost
- Ensure backend is running
- Check firewall settings
- Verify phone and computer on same network

### Images not loading
- Check uploads folder exists
- Verify static file serving in server.js
- Check file permissions
- Ensure correct image URL format

### Authentication issues
- Clear AsyncStorage/localStorage
- Check JWT_SECRET is set
- Verify token expiration
- Check CORS configuration

## 💳 Payment Gateway Integration (Future)

Recommended options:
1. **Razorpay** (India) - Easy integration, good for Indian market
2. **Stripe** - International, comprehensive features
3. **PayPal** - Widely accepted
4. **Paytm** - Popular in India

## 📞 Support

For issues or questions:
- Check logs in backend console
- Use MongoDB Compass to inspect database
- Test API endpoints with Postman
- Check React Native debugger for mobile issues

## 🎯 Next Steps

1. ✅ Test all authentication flows
2. ✅ Add sample services via admin dashboard
3. ✅ Test subscription creation
4. ✅ Verify employee job assignment
5. ⏳ Integrate payment gateway
6. ⏳ Add push notifications
7. ⏳ Implement analytics
8. ⏳ Deploy to production

## 📝 License

Private project - All rights reserved

---

**Built with ❤️ for CarsTuneUp**
