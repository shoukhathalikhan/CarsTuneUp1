# Google Authentication Setup Guide - Complete Implementation

## Overview
This guide provides complete step-by-step instructions to integrate Google Sign-In authentication in your CarsTuneUp customer app using Expo and Firebase.

---

## Part 1: Firebase Console Setup

### Step 1: Enable Google Sign-In in Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **carztuneup**

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Click on "Sign-in method" tab

3. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Click on it
   - Toggle "Enable" switch to ON
   - **Project support email**: Enter your email (e.g., admin@carstuneup.com)
   - Click "Save"

4. **Note Your Web Client ID**
   - After enabling, you'll see a "Web SDK configuration" section
   - Copy the **Web client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - Save this for later use

---

## Part 2: Google Cloud Console Setup (Android)

### Step 2: Get SHA-1 Certificate Fingerprint

**For Development (Debug):**

Open terminal in your project directory and run:

```bash
cd customer-app/android
./gradlew signingReport
```

Or on Windows PowerShell:
```bash
cd customer-app\android
.\gradlew.bat signingReport
```

**Note**: In PowerShell, you need `.\` prefix to run executables in the current directory.

**Look for output like:**
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: androiddebugkey
MD5: DA:F9:E6:8D:A8:CD:C4:AA:7B:81:E3:F4:F7:D7:06:1A
SHA1: 09:BA:58:0C:63:D1:B4:9E:86:85:C6:94:F0:0B:0F:62:2D:64:4A:2F
SHA-256: 8C:42:3E:8A:16:5E:7D:04:1F:F2:CA:9B:D2:F2:C7:8E:50:67:F5:7D:BC:12:BB:18:67:29:49:60:84:25:0F:67
```

**Copy the SHA-1 fingerprint** (the long string after SHA1:)

**For Production (Release):**
You'll need to generate a release keystore and get its SHA-1. We'll cover this later.

### Step 3: Add SHA-1 to Firebase

1. **Go to Firebase Console**
   - Project Settings (gear icon) → General tab

2. **Scroll to "Your apps" section**
   - Find your Android app
   - If you don't have an Android app registered:
     - Click "Add app" → Select Android
     - **Android package name**: `com.carstuneup.customer` (or your actual package name)
     - **App nickname**: CarsTuneUp Customer
     - Click "Register app"
     - Download `google-services.json` (save for later)

3. **Add SHA-1 Fingerprint**
   - In your Android app settings
   - Scroll to "SHA certificate fingerprints"
   - Click "Add fingerprint"
   - Paste your SHA-1 fingerprint
   - Click "Save"

### Step 4: Download google-services.json

1. In Firebase Console → Project Settings → Your Android app
2. Click "Download google-services.json"
3. **Place the file at**: `customer-app/android/app/google-services.json`

---

## Part 3: Install Required Packages

### Step 5: Install Dependencies

Open terminal in `customer-app` directory:

```bash
npx expo install @react-native-google-signin/google-signin
npx expo install expo-auth-session expo-crypto
```

Update `package.json` to include:
```json
{
  "dependencies": {
    "@react-native-google-signin/google-signin": "^11.0.0",
    "expo-auth-session": "~6.0.3",
    "expo-crypto": "~14.0.1"
  }
}
```

Then run:
```bash
npm install
```

---

## Part 4: Configure Expo App

### Step 6: Update app.json

Add Google Sign-In configuration to `customer-app/app.json`:

```json
{
  "expo": {
    "name": "CarsTuneUp Customer",
    "slug": "carstuneup-customer",
    "android": {
      "package": "com.carstuneup.customerapp",
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleSignIn": {
          "apiKey": "AIzaSyArrDEz9QzOAj8-Jz8zePlT8or7C6wORwk",
          "certificateHash": "09:BA:58:0C:63:D1:B4:9E:86:85:C6:94:F0:0B:0F:62:2D:64:4A:2F"
        }
      }
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

**Replace**:
- `YOUR_ANDROID_API_KEY`: Get from Firebase Console → Project Settings → General → Web API Key
- `YOUR_SHA1_FINGERPRINT`: The SHA-1 you copied earlier

---

## Part 5: Update Firebase Config

### Step 7: Update firebase.js

Update `customer-app/src/config/firebase.js`:

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyA2Ja4MTY-A2LE9vUyHWY6Z2LIQgrOY4x4',
  authDomain: 'carztuneup.firebaseapp.com',
  projectId: 'carztuneup',
  storageBucket: 'carztuneup.firebasestorage.app',
  messagingSenderId: '139313575789',
  appId: '1:139313575789:web:8c7599ab73b6dc53180c64',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

---

## Part 6: Implement Google Sign-In in LoginScreen

### Step 8: Update LoginScreen.js

Add Google Sign-In button and functionality:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Firebase Console
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      const { token, user } = response.data.data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      if (Platform.OS === 'android') {
        ToastAndroid.show('Successfully logged in!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Successfully logged in!');
      }

      if (!user.isProfileSetupComplete) {
        navigation.replace('AddressSelection');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid email or password';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Get user info from Google
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Google Sign-In Success:', userInfo);

      // Send Google token to your backend
      const response = await api.post('/auth/google-login', {
        idToken: userInfo.idToken,
        user: {
          email: userInfo.user.email,
          name: userInfo.user.name,
          photo: userInfo.user.photo,
          googleId: userInfo.user.id,
        }
      });

      const { token, user } = response.data.data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      if (Platform.OS === 'android') {
        ToastAndroid.show('Successfully logged in with Google!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Successfully logged in with Google!');
      }

      if (!user.isProfileSetupComplete) {
        navigation.replace('AddressSelection');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in
        console.log('User cancelled sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is in progress
        Alert.alert('Please wait', 'Sign-in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>KEEP SHINING ALWAYS</Text>
        </View>
        <Text style={styles.subtitle}>Welcome Back!</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1453b4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerLink}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  tagline: {
    fontSize: 14,
    color: '#1453b4',
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1F2937',
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  loginButton: {
    backgroundColor: '#1453b4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  registerText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },
  registerLink: {
    color: '#1453b4',
    fontWeight: 'bold',
  },
});
```

**Important**: Replace `YOUR_WEB_CLIENT_ID` with the Web Client ID from Firebase Console.

---

## Part 7: Backend Implementation

### Step 9: Create Google Auth Route

Create `backend/routes/auth.routes.js` (or update existing):

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Existing routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// New Google auth route
router.post('/google-login', authController.googleLogin);

module.exports = router;
```

### Step 10: Create Google Auth Controller

Update `backend/controllers/auth.controller.js`:

```javascript
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Existing login function
exports.login = async (req, res) => {
  // ... existing code
};

// New Google login function
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, user: googleUser } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        name: name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'customer',
        googleId: googleId,
        profilePicture: picture,
        isEmailVerified: true, // Google emails are verified
        isProfileSetupComplete: false, // User needs to complete profile
      });
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Google login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profilePicture,
          isProfileSetupComplete: user.isProfileSetupComplete,
        },
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};
```

### Step 11: Update User Model

Update `backend/models/User.model.js` to include Google ID:

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  googleId: { type: String, unique: true, sparse: true }, // Add this
  profilePicture: { type: String }, // Add this
  isEmailVerified: { type: Boolean, default: false },
  isProfileSetupComplete: { type: Boolean, default: false },
  // ... other fields
}, { timestamps: true });
```

### Step 12: Install Backend Dependencies

In `backend` directory:

```bash
npm install google-auth-library
```

### Step 13: Update .env File

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Replace with your actual Web Client ID from Firebase Console.

---

## Part 8: Build and Test

### Step 14: Rebuild the App

Since we added native modules, rebuild the app:

```bash
cd customer-app
npx expo prebuild --clean
npx expo run:android
```

### Step 15: Test Google Sign-In

1. **Open the app** on your Android device/emulator
2. **Click "Continue with Google"** button
3. **Select Google account** from the picker
4. **Grant permissions** if asked
5. **App should log you in** and navigate to appropriate screen

---

## Troubleshooting

### Issue 1: "Developer Error" or "Error 10"
**Solution**: 
- Verify SHA-1 fingerprint is correct in Firebase Console
- Make sure `google-services.json` is in the right location
- Rebuild the app after adding SHA-1

### Issue 2: "SIGN_IN_REQUIRED" Error
**Solution**:
- Check Web Client ID in `GoogleSignin.configure()`
- Verify Google Sign-In is enabled in Firebase Console

### Issue 3: "PLAY_SERVICES_NOT_AVAILABLE"
**Solution**:
- Update Google Play Services on device
- Use a real device instead of emulator
- Ensure emulator has Google Play Store

### Issue 4: Backend "Invalid token" Error
**Solution**:
- Verify `GOOGLE_CLIENT_ID` in backend `.env` matches Firebase Web Client ID
- Check `google-auth-library` is installed in backend

---

## Security Best Practices

1. **Never commit** `google-services.json` to version control
2. **Use environment variables** for sensitive keys
3. **Validate tokens** on the backend
4. **Implement rate limiting** on auth endpoints
5. **Use HTTPS** for all API calls

---

## Summary Checklist

- [ ] Enable Google Sign-In in Firebase Console
- [ ] Get SHA-1 fingerprint and add to Firebase
- [ ] Download and place `google-services.json`
- [ ] Install required npm packages
- [ ] Update `app.json` with Google config
- [ ] Update `firebase.js` with auth imports
- [ ] Implement Google Sign-In in LoginScreen
- [ ] Create backend Google auth route
- [ ] Update User model with googleId field
- [ ] Install `google-auth-library` in backend
- [ ] Add `GOOGLE_CLIENT_ID` to backend `.env`
- [ ] Rebuild app with `expo prebuild`
- [ ] Test Google Sign-In flow

---

## Next Steps

After successful implementation:

1. **Add Google Sign-In to RegisterScreen** (optional)
2. **Implement Sign-Out** functionality
3. **Handle account linking** (if user signs up with email then uses Google)
4. **Add profile picture** from Google account
5. **Test on iOS** (requires additional setup)

---

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Check backend server logs
3. Check React Native logs: `npx react-native log-android`
4. Verify all configuration values match

**Status**: Ready for implementation
