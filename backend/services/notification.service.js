const { initFirebaseAdmin } = require('./firebaseAdmin.service');

// Send push notification
exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const { admin, firebaseInitialized } = initFirebaseAdmin();
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
  const { admin, firebaseInitialized } = initFirebaseAdmin();
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
