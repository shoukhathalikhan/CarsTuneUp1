# Firebase Push Notifications Setup Guide

## 🎯 Overview
This guide will help you set up Firebase Cloud Messaging (FCM) for automatic push notifications in the CarsTuneUp app.

## 📋 Prerequisites
- Firebase project already created (you have `google-services.json`)
- Firebase Admin SDK credentials
- Backend server running

---

## 🔧 Step 1: Backend Setup

### 1.1 Install Firebase Admin SDK
```bash
cd C:\CarsTuneUp\backend
npm install firebase-admin
```

### 1.2 Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **carztuneup**
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-admin-key.json` in `C:\CarsTuneUp\backend\config\`

### 1.3 Initialize Firebase Admin in Backend
Create/Update `C:\CarsTuneUp\backend\config\firebase-admin.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
```

### 1.4 Update Backend Server Entry Point
Add to `C:\CarsTuneUp\backend\server.js` (at the top):
```javascript
// Initialize Firebase Admin
require('./config/firebase-admin');
```

---

## 📱 Step 2: Customer App Setup

### 2.1 Install Required Packages
```bash
cd C:\CarsTuneUp\customer-app
npx expo install expo-notifications expo-device
```

### 2.2 Update App.json Configuration
Add notification configuration to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1453b4",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#1453b4",
      "androidMode": "default",
      "androidCollapsedTitle": "CarsTuneUp"
    }
  }
}
```

### 2.3 Initialize Notifications in App
Update `C:\CarsTuneUp\customer-app\App.js`:
```javascript
import { registerForPushNotificationsAsync, setupNotificationListeners } from './src/services/notificationService';

// Inside your main App component
useEffect(() => {
  // Register for push notifications
  registerForPushNotificationsAsync();
  
  // Setup notification listeners
  const cleanup = setupNotificationListeners(navigationRef);
  
  return cleanup;
}, []);
```

---

## 🔔 Step 3: Notification Triggers

### 3.1 Booking Confirmation
In `C:\CarsTuneUp\backend\controllers\subscription.controller.js`:
```javascript
const notificationController = require('./notification.controller');

// After creating subscription
await notificationController.sendBookingConfirmation(
  userId,
  service.name
);
```

### 3.2 Employee Assignment
In admin dashboard or backend when assigning employee:
```javascript
await notificationController.sendEmployeeAssigned(
  subscription.userId,
  employee.userId.name,
  service.name
);
```

### 3.3 Scheduled Service Notification
In `C:\CarsTuneUp\backend\services\automation.service.js`:
```javascript
const notificationController = require('../controllers/notification.controller');

// After creating scheduled job
await notificationController.sendUpcomingServiceNotification(
  customerId,
  service.name,
  scheduledDate
);
```

### 3.4 Service Completed
In `C:\CarsTuneUp\backend\controllers\job.controller.js`:
```javascript
// After job completion
await notificationController.sendServiceCompletedNotification(
  job.customerId,
  service.name
);
```

### 3.5 New Service Added
In `C:\CarsTuneUp\backend\controllers\service.controller.js`:
```javascript
// After creating new service
await notificationController.sendNewServiceNotification(
  newService.name,
  newService.description
);
```

---

## ⏰ Step 4: Automated Daily Reminders

### 4.1 Install Cron Job Package
```bash
cd C:\CarsTuneUp\backend
npm install node-cron
```

### 4.2 Setup Cron Job
Create `C:\CarsTuneUp\backend\jobs\notificationCron.js`:
```javascript
const cron = require('node-cron');
const notificationController = require('../controllers/notification.controller');

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Running daily service reminders...');
  await notificationController.sendDailyServiceReminders();
});

console.log('✅ Notification cron jobs initialized');
```

### 4.3 Initialize Cron in Server
Add to `C:\CarsTuneUp\backend\server.js`:
```javascript
// Initialize cron jobs
require('./jobs/notificationCron');
```

---

## 🧪 Step 5: Testing

### 5.1 Test Local Notification
In customer app, add test button:
```javascript
import { sendLocalNotification } from './src/services/notificationService';

<Button 
  title="Test Notification" 
  onPress={() => sendLocalNotification(
    '🎉 Test Notification',
    'This is a test notification from CarsTuneUp!'
  )}
/>
```

### 5.2 Test Backend Notification
Create test endpoint in backend:
```javascript
router.post('/test-notification', async (req, res) => {
  const { userId } = req.body;
  await notificationController.sendBookingConfirmation(userId, 'Premium Wash');
  res.json({ success: true });
});
```

---

## 📊 Notification Types Summary

| Trigger | Title | When Sent |
|---------|-------|-----------|
| **Booking** | 🎉 Service Booked Successfully! | Immediately after booking |
| **Employee Assigned** | 👨‍🔧 Employee Assigned | When admin assigns employee |
| **Service Scheduled** | 📅 Next Service Scheduled | When job is scheduled |
| **Service Reminder** | ⏰ Service Reminder | 1 day before service |
| **Service Completed** | ✅ Service Completed | After job completion |
| **New Service** | 🆕 New Service Available! | When new service is added |

---

## 🔐 Environment Variables

Add to `C:\CarsTuneUp\backend\.env`:
```env
FIREBASE_PROJECT_ID=carztuneup
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

---

## ✅ Verification Checklist

- [ ] Firebase Admin SDK installed
- [ ] Service account key downloaded and placed in config folder
- [ ] Firebase Admin initialized in backend
- [ ] Notification controller created
- [ ] Expo notifications installed in customer app
- [ ] Notification service configured
- [ ] FCM token registration working
- [ ] Notification triggers added to all relevant endpoints
- [ ] Cron job setup for daily reminders
- [ ] Test notifications working
- [ ] App rebuilt with `npx expo prebuild` (if using bare workflow)

---

## 🚀 Deployment Notes

### For Production:
1. **Build new APK** with notification support:
   ```bash
   cd C:\CarsTuneUp\customer-app
   npx expo prebuild
   cd android
   ./gradlew assembleRelease
   ```

2. **Ensure Firebase credentials** are secure:
   - Never commit `firebase-admin-key.json` to git
   - Add to `.gitignore`
   - Use environment variables in production

3. **Test on physical device** (notifications don't work in emulator)

---

## 📞 Support

If notifications aren't working:
1. Check FCM token is being saved to user document
2. Verify Firebase Admin is initialized correctly
3. Check backend logs for notification sending errors
4. Ensure app has notification permissions
5. Test with local notifications first

---

## 🎉 Done!

Your CarsTuneUp app now has professional automatic push notifications for:
- ✅ Service bookings
- ✅ Employee assignments
- ✅ Scheduled services
- ✅ Service reminders
- ✅ Service completions
- ✅ New service announcements

All notifications are sent automatically based on user actions and scheduled events!
