const admin = require('firebase-admin');

let firebaseInitialized = false;

const initFirebaseAdmin = () => {
  if (firebaseInitialized) return { admin, firebaseInitialized };

  try {
    if (admin.apps && admin.apps.length > 0) {
      firebaseInitialized = true;
      return { admin, firebaseInitialized };
    }

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️  Firebase credentials not provided. Firebase features disabled.');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }

  return { admin, firebaseInitialized };
};

module.exports = {
  initFirebaseAdmin,
};
