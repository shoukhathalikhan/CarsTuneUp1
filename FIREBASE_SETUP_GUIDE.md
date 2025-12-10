# Firebase Push Notifications Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: **CarsTuneUp**
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Add Android App

1. In Firebase Console, click "Add app" → Select Android
2. Enter package name: `com.carstuneup.customerapp`
3. Download `google-services.json`
4. Place it in: `customer-app/android/app/`

## Step 3: Add iOS App (Optional)

1. Click "Add app" → Select iOS
2. Enter bundle ID: `com.carstuneup.customerapp`
3. Download `GoogleService-Info.plist`
4. Place it in: `customer-app/ios/`

## Step 4: Get Service Account Key

1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Extract these values:

```json
{
  "project_id": "carstuneup-xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@carstuneup-xxxxx.iam.gserviceaccount.com"
}
```

## Step 5: Update Backend .env

Add to `backend/.env`:

```env
# Firebase Configuration (for Push Notifications)
FIREBASE_PROJECT_ID=carstuneup-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@carstuneup-xxxxx.iam.gserviceaccount.com
```

**Important**: Keep the private key in quotes and preserve the `\n` characters.

## Step 6: Install Firebase in Customer App

```bash
cd customer-app
npx expo install expo-notifications expo-device expo-constants
npm install firebase
```

## Step 7: Configure Expo for Push Notifications

Create `customer-app/app.json` configuration:

 

## Step 8: Test Push Notifications

1. Restart backend server
2. Check logs for: `✅ Firebase Admin initialized successfully`
3. Test sending notification from backend

## Notification Types

### 1. Job Assignment Notification
Sent when a job is assigned to an employee:
```
Title: "New Job Assigned"
Body: "You have been assigned a car wash job for [Customer Name]"
```

### 2. Upcoming Wash Reminder
Sent 1 day before scheduled wash:
```
Title: "Car Wash Tomorrow"
Body: "Your car wash is scheduled for tomorrow at [Time]"
```

### 3. Job Completion
Sent when employee completes a job:
```
Title: "Car Wash Completed"
Body: "Your car wash has been completed. Check photos in the app!"
```

## Troubleshooting

### Error: "Firebase credentials not provided"
- Check if all three Firebase env variables are set
- Ensure private key is properly formatted with `\n`
- Restart backend server

### Error: "Failed to send notification"
- Verify FCM token is valid
- Check Firebase project permissions
- Ensure device has internet connection

### No notifications received
- Check device notification permissions
- Verify app is registered for push notifications
- Test with Firebase Console → Cloud Messaging → Send test message

## Security Best Practices

1. **Never commit** `google-services.json` or `.env` files to git
2. Add to `.gitignore`:
   ```
   google-services.json
   GoogleService-Info.plist
   .env
   ```
3. Use environment variables in production
4. Rotate Firebase keys periodically
