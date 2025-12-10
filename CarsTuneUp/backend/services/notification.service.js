const admin = require('firebase-admin');

// Initialize Firebase Admin (only if credentials are provided)
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } else {
    console.log('⚠️  Firebase credentials not provided. Push notifications disabled.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

// Send push notification
exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.log('Push notification skipped (Firebase not initialized)');
    return;
  }
  
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };
    
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to multiple devices
exports.sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.log('Multicast notification skipped (Firebase not initialized)');
    return;
  }
  
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens: fcmTokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    throw error;
  }
};
