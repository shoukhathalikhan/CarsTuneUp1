# CarsTuneUp - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Setup & Installation](#setup--installation)
6. [Configuration Details](#configuration-details)
7. [Features](#features)
8. [API Documentation](#api-documentation)
9. [Authentication Flow](#authentication-flow)
10. [Database Schema](#database-schema)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Project Overview

**CarsTuneUp** is a comprehensive car wash and maintenance service platform consisting of:
- **Customer Mobile App** (React Native/Expo)
- **Employee Mobile App** (React Native/Expo)
- **Backend API** (Node.js/Express)

### Project Purpose
A mobile-first platform connecting car owners with professional car wash and maintenance services, enabling:
- Service booking and scheduling
- Real-time job tracking
- Subscription management
- Payment processing
- Live chat support
- Push notifications

---

## 📁 Project Structure

```
CarsTuneUp/
├── customer-app/                 # Customer mobile application
│   ├── android/                  # Android native code
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   └── res/
│   │   │   ├── build.gradle
│   │   │   └── google-services.json
│   │   ├── build.gradle
│   │   ├── gradle.properties
│   │   └── settings.gradle
│   ├── assets/                   # Images, videos, logos
│   │   ├── logo.jpg
│   │   ├── BG_IMAGE.jpg
│   │   └── service images/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AddressSelector.js
│   │   │   ├── FeedbackCarousel.js
│   │   │   ├── FloatingChatButton.js
│   │   │   ├── SafeAreaWrapper.js
│   │   │   ├── StarRating.js
│   │   │   └── VehicleSelector.js
│   │   ├── config/              # Configuration files
│   │   │   ├── api.js           # Axios API configuration
│   │   │   └── firebase.js      # Firebase configuration
│   │   ├── context/             # React Context providers
│   │   │   ├── AppContext.js
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── screens/             # App screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── ServicesScreen.js
│   │   │   ├── CartScreen.js
│   │   │   ├── PaymentScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── ChatScreen.js
│   │   │   └── [20+ more screens]
│   │   ├── services/            # Service utilities
│   │   │   └── notificationService.js
│   │   └── utils/               # Utility functions
│   ├── App.js                   # Main app entry point
│   ├── app.json                 # Expo configuration
│   ├── package.json             # Dependencies
│   └── README.md
│
├── employee-app/                # Employee mobile application
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── JobsScreen.js
│   │       ├── TodayJobsScreen.js
│   │       ├── JobDetailScreen.js
│   │       ├── ProfileScreen.js
│   │       └── NotificationsScreen.js
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── backend/                     # Node.js/Express backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── service.controller.js
│   │   ├── subscription.controller.js
│   │   ├── payment.controller.js
│   │   └── [more controllers]
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   ├── models/                 # Mongoose models
│   │   ├── User.model.js
│   │   ├── Booking.model.js
│   │   ├── Service.model.js
│   │   ├── Subscription.model.js
│   │   └── [more models]
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── service.routes.js
│   │   └── [more routes]
│   ├── utils/                  # Utility functions
│   ├── .env                    # Environment variables
│   ├── server.js               # Server entry point
│   └── package.json
│
└── Documentation files
    ├── DEPLOYMENT.md
    ├── GOOGLE_AUTH_SETUP_GUIDE.md
    ├── BOOKING_WORKFLOW_STATUS.md
    └── PROJECT_DOCUMENTATION.md (this file)
```

---

## 🛠 Technology Stack

### Customer App (React Native/Expo)
- **Framework:** React Native 0.81.5
- **Platform:** Expo SDK 54
- **Navigation:** React Navigation 6.x
  - Native Stack Navigator
  - Bottom Tabs Navigator
- **State Management:**
  - React Context API
  - AsyncStorage for persistence
- **UI Components:**
  - Custom components
  - React Native Vector Icons
  - Expo Linear Gradient
- **Maps:** React Native Maps
- **Authentication:** 
  - @react-native-google-signin/google-signin
  - Firebase SDK (for Firestore only)
- **Media:** 
  - Expo Image Picker
  - Expo AV (audio/video)
- **Notifications:** Expo Notifications
- **HTTP Client:** Axios
- **Date Handling:** date-fns

### Backend (Node.js)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** 
  - JWT (JSON Web Tokens)
  - Google OAuth2 (google-auth-library)
  - bcryptjs for password hashing
- **Payment:** Razorpay integration
- **Real-time:** Socket.io (for chat)
- **File Upload:** Multer
- **Validation:** express-validator
- **Security:** 
  - helmet
  - cors
  - express-rate-limit
- **Environment:** dotenv

### Development Tools
- **Version Control:** Git/GitHub
- **Package Manager:** npm
- **Code Editor:** VS Code (recommended)
- **API Testing:** Postman/Thunder Client
- **Android Development:** Android Studio
- **Build Tool:** Gradle

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Customer App   │         │  Employee App   │
│  (React Native) │         │  (React Native) │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │      HTTP/REST API        │
         │      WebSocket (Chat)     │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────┐
         │   Backend Server      │
         │   (Node.js/Express)   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   MongoDB Database    │
         └───────────────────────┘
                     │
         ┌───────────▼───────────┐
         │  External Services    │
         │  - Google OAuth       │
         │  - Razorpay          │
         │  - Firebase (FCM)    │
         └───────────────────────┘
```

### Authentication Flow

```
User Action → Google Sign-In SDK → Google OAuth Server
                                           ↓
                                    Returns idToken
                                           ↓
                              Send to Backend API
                                           ↓
                              Verify with Google
                                           ↓
                              Create/Update User
                                           ↓
                              Generate JWT Token
                                           ↓
                              Return to App
                                           ↓
                              Store in AsyncStorage
                                           ↓
                              Navigate to App
```

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Android Studio (for Android development)
- Expo CLI: `npm install -g expo-cli`
- Git

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (see Configuration section)
cp .env.example .env

# 4. Start MongoDB (if local)
mongod

# 5. Start backend server
npm start
# or for development with auto-reload
npm run dev
```

### Customer App Setup

```bash
# 1. Navigate to customer-app directory
cd customer-app

# 2. Install dependencies
npm install

# 3. Configure app.json and google-services.json
# (see Configuration section)

# 4. Start Expo development server
npm start

# 5. Run on Android
npm run android
# or
npx expo run:android
```

### Employee App Setup

```bash
# 1. Navigate to employee-app directory
cd employee-app

# 2. Install dependencies
npm install

# 3. Start Expo development server
npm start

# 4. Run on Android
npm run android
```

---

## ⚙️ Configuration Details

### Backend Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/carstuneup
# or MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carstuneup

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=139313575789-h0alijj4pbdod8tok98psi1sas63a9cd.apps.googleusercontent.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Firebase Admin SDK (for push notifications)
FIREBASE_PROJECT_ID=carztuneup
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081
```

### Customer App Configuration (app.json)

```json
{
  "expo": {
    "name": "CarsTuneUp",
    "slug": "carstuneup-customer",
    "version": "1.0.0",
    "android": {
      "package": "com.carstuneup.customer",
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyArrDEz9QzOAj8-Jz8zePlT8or7C6wORwk"
        },
        "googleSignIn": {
          "apiKey": "AIzaSyArrDEz9QzOAj8-Jz8zePlT8or7C6wORwk",
          "certificateHash": "09:BA:58:0C:63:D1:B4:9E:86:85:C6:94:F0:0B:0F:62:2D:64:4A:2F"
        }
      }
    }
  }
}
```

### Google Services Configuration (google-services.json)

```json
{
  "project_info": {
    "project_number": "139313575789",
    "project_id": "carztuneup",
    "storage_bucket": "carztuneup.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:139313575789:android:0b99c462f07e640c180c64",
        "android_client_info": {
          "package_name": "com.carstuneup.customer"
        }
      },
      "oauth_client": [
        {
          "client_id": "139313575789-q79261mfnjkmrnp2edl1scpek7u45m8p.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "com.carstuneup.customer",
            "certificate_hash": "09ba580c63d1b49e8685c694f00b0f622d644a2f"
          }
        },
        {
          "client_id": "139313575789-h0alijj4pbdod8tok98psi1sas63a9cd.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyArrDEz9QzOAj8-Jz8zePlT8or7C6wORwk"
        }
      ]
    }
  ]
}
```

### API Configuration (customer-app/src/config/api.js)

The API automatically detects the backend URL:
- **Development:** Uses Expo host IP (e.g., `http://192.168.1.107:5000/api`)
- **Android Emulator:** Uses `http://10.0.2.2:5000/api`
- **Production:** Set via `EXPO_PUBLIC_API_URL` environment variable

---

## ✨ Features

### Customer App Features

#### 1. Authentication & Profile
- Email/Password registration and login
- Google OAuth sign-in
- Profile management
- Address management (multiple addresses)
- Vehicle management (multiple vehicles)

#### 2. Service Booking
- Browse car wash services
- Service categories:
  - Exterior wash
  - Interior cleaning
  - Full detailing
  - Waxing & polishing
  - Engine cleaning
- Vehicle type selection (Sedan, SUV, Hatchback)
- Date and time slot selection
- Address selection
- Add-on services

#### 3. Subscriptions
- Monthly/Quarterly/Annual plans
- Subscription management
- Auto-renewal options
- Subscription booking

#### 4. Cart & Checkout
- Add multiple services to cart
- Apply promo codes
- View total and discounts
- Order summary

#### 5. Payment
- Razorpay integration
- Multiple payment methods:
  - Credit/Debit cards
  - UPI
  - Net banking
  - Wallets
- Payment history

#### 6. Orders & Tracking
- View booking history
- Real-time order status
- Track service provider location
- Rate and review services

#### 7. Insurance
- Car insurance information
- Insurance renewal reminders

#### 8. Chat Support
- Real-time chat with support
- Chat history
- Image sharing

#### 9. Notifications
- Push notifications for:
  - Booking confirmations
  - Service updates
  - Promotional offers
  - Payment confirmations

#### 10. Help & Support
- FAQs
- Contact support
- Terms & Privacy policy

### Employee App Features

#### 1. Authentication
- Employee login
- Profile management

#### 2. Job Management
- View assigned jobs
- Today's jobs list
- Job details
- Update job status:
  - Pending
  - In Progress
  - Completed
  - Cancelled

#### 3. Navigation
- Get directions to customer location
- View customer address on map

#### 4. Notifications
- New job assignments
- Job updates
- Customer messages

---

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "customer"
}

Response: 200 OK
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Google Login
```http
POST /auth/google-login
Content-Type: application/json

{
  "idToken": "google_id_token",
  "user": {
    "email": "john@example.com",
    "name": "John Doe",
    "photo": "https://...",
    "googleId": "google_user_id"
  }
}

Response: 200 OK
{
  "status": "success",
  "message": "Google login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Service Endpoints

#### Get All Services
```http
GET /services
Authorization: Bearer {token}

Response: 200 OK
{
  "status": "success",
  "data": {
    "services": [ ... ]
  }
}
```

#### Get Service Details
```http
GET /services/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "status": "success",
  "data": {
    "service": { ... }
  }
}
```

### Booking Endpoints

#### Create Booking
```http
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "services": ["service_id_1", "service_id_2"],
  "vehicleType": "sedan",
  "address": "address_id",
  "scheduledDate": "2025-12-20",
  "timeSlot": "10:00 AM - 12:00 PM",
  "totalAmount": 500
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "booking": { ... }
  }
}
```

#### Get User Bookings
```http
GET /bookings/user
Authorization: Bearer {token}

Response: 200 OK
{
  "status": "success",
  "data": {
    "bookings": [ ... ]
  }
}
```

### Payment Endpoints

#### Create Payment Order
```http
POST /payments/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "booking_id",
  "amount": 500
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "orderId": "razorpay_order_id",
    "amount": 500,
    "currency": "INR"
  }
}
```

#### Verify Payment
```http
POST /payments/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "razorpay_order_id",
  "paymentId": "razorpay_payment_id",
  "signature": "razorpay_signature",
  "bookingId": "booking_id"
}

Response: 200 OK
{
  "status": "success",
  "message": "Payment verified successfully"
}
```

---

## 🔐 Authentication Flow

### Google Sign-In Flow (Pure OAuth)

1. **User taps "Continue with Google"**
2. **Google Sign-In SDK opens account picker**
3. **User selects Google account**
4. **Google returns idToken to app**
5. **App validates idToken exists**
6. **App sends idToken + user info to backend**
   ```javascript
   POST /auth/google-login
   {
     idToken: "google_id_token",
     user: { email, name, photo, googleId }
   }
   ```
7. **Backend verifies idToken with Google**
   ```javascript
   const ticket = await client.verifyIdToken({
     idToken: idToken,
     audience: process.env.GOOGLE_CLIENT_ID
   });
   ```
8. **Backend creates/updates user in database**
9. **Backend generates JWT token**
10. **Backend returns JWT + user data**
11. **App stores JWT in AsyncStorage**
12. **App navigates to main screen**

### JWT Token Usage

All authenticated API requests include:
```http
Authorization: Bearer {jwt_token}
```

Token contains:
- User ID
- Email
- Role (customer/employee/admin)
- Expiration (7 days)

---

## 💾 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  phone: String,
  password: String (hashed),
  role: String (customer/employee/admin),
  googleId: String,
  profilePicture: String,
  isEmailVerified: Boolean,
  isProfileSetupComplete: Boolean,
  addresses: [{
    type: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number },
    isDefault: Boolean
  }],
  vehicles: [{
    type: String,
    brand: String,
    model: String,
    registrationNumber: String,
    isDefault: Boolean
  }],
  fcmToken: String,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Service Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  pricing: {
    sedan: Number,
    suv: Number,
    hatchback: Number
  },
  duration: Number (minutes),
  image: String,
  isActive: Boolean,
  features: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  services: [ObjectId] (ref: Service),
  vehicleType: String,
  address: Object,
  scheduledDate: Date,
  timeSlot: String,
  status: String (pending/confirmed/in-progress/completed/cancelled),
  assignedEmployee: ObjectId (ref: User),
  totalAmount: Number,
  paymentStatus: String,
  paymentId: String,
  notes: String,
  rating: Number,
  review: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  plan: String (monthly/quarterly/annual),
  services: [ObjectId] (ref: Service),
  startDate: Date,
  endDate: Date,
  status: String (active/expired/cancelled),
  amount: Number,
  autoRenew: Boolean,
  remainingBookings: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. **Prepare for deployment:**
   ```bash
   # Ensure all dependencies are in package.json
   npm install
   
   # Test locally
   npm start
   ```

2. **Set environment variables** on hosting platform

3. **Deploy:**
   ```bash
   # For Heroku
   heroku create carstuneup-backend
   git push heroku master
   
   # For Railway
   railway init
   railway up
   ```

### Customer App Deployment

#### Debug APK (Testing)
```bash
cd customer-app
npx expo run:android --variant debug
# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release APK (Production)
```bash
cd customer-app
npx expo run:android --variant release
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

#### Google Play Store
1. Generate signed APK/AAB
2. Create Google Play Console account
3. Upload APK/AAB
4. Fill store listing details
5. Submit for review

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Google Sign-In DEVELOPER_ERROR
**Cause:** SHA-1 mismatch or wrong package name
**Solution:**
- Verify SHA-1 in Firebase Console matches debug keystore
- Ensure package name is `com.carstuneup.customer`
- Delete old OAuth clients in Google Cloud Console
- Regenerate google-services.json

#### 2. Backend Connection Failed
**Cause:** Wrong API URL or backend not running
**Solution:**
- Check backend is running on correct port
- Verify API URL in customer-app/src/config/api.js
- Check firewall/network settings
- Ensure both devices on same network (development)

#### 3. Build Failures (Android)
**Cause:** Gradle cache issues or path length
**Solution:**
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx expo run:android
```

#### 4. MongoDB Connection Error
**Cause:** MongoDB not running or wrong URI
**Solution:**
- Start MongoDB: `mongod`
- Check MONGODB_URI in .env
- Verify MongoDB Atlas whitelist (if using cloud)

#### 5. Payment Integration Issues
**Cause:** Wrong Razorpay keys
**Solution:**
- Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
- Use test keys for development
- Check Razorpay dashboard for errors

---

## 📝 Important Notes

### Security Considerations
1. **Never commit .env files** to version control
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** on API endpoints
4. **Validate all user inputs** on backend
5. **Use HTTPS** in production
6. **Keep dependencies updated** regularly

### Performance Optimization
1. **Implement pagination** for large data lists
2. **Use image optimization** for uploaded images
3. **Enable caching** where appropriate
4. **Optimize database queries** with indexes
5. **Use lazy loading** for screens

### Best Practices
1. **Follow consistent code style**
2. **Write meaningful commit messages**
3. **Test on real devices** before release
4. **Keep documentation updated**
5. **Use error tracking** (Sentry, etc.)

---

## 📞 Support & Contact

For issues or questions:
- **GitHub Issues:** https://github.com/shoukhathalikhan/CarsTuneUp1/issues
- **Email:** support@carstuneup.com
- **Documentation:** See individual guide files in project root

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🎯 Project Status

**Current Version:** 1.0.0
**Status:** In Development
**Last Updated:** December 20, 2025

### Completed Features
✅ User authentication (Email/Password + Google OAuth)
✅ Service browsing and booking
✅ Cart and checkout flow
✅ Payment integration (Razorpay)
✅ Profile and address management
✅ Vehicle management
✅ Subscription plans
✅ Real-time chat
✅ Push notifications
✅ Employee job management

### In Progress
🔄 Advanced analytics dashboard
🔄 Loyalty rewards program
🔄 Referral system

### Planned Features
📋 Multi-language support
📋 Dark mode
📋 Voice commands
📋 AR vehicle inspection
📋 AI-powered service recommendations

---

**End of Documentation**
