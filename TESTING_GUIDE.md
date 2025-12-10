# 🧪 CarsTuneUp - Testing Guide

## Current Status
✅ **Backend**: Running on port 5000  
✅ **Customer App**: Running on port 8082  
✅ **Firebase**: Initialized and ready  

---

## 1. Test Push Notifications

### Step 1: Login to Customer App
1. Open customer app (web or Android)
2. Login with your credentials
3. **Watch the console** for:
   ```
   📱 FCM Token: ExponentPushToken[xxxxxxxxxxxxxx]
   ✅ FCM token saved to backend
   ```

### Step 2: Verify Backend Received Token
Check backend logs for:
```
POST /api/users/fcm-token 200
```

### Step 3: Send Test Notification (Manual)
You can test in 2 ways:

#### Option A: Firebase Console
1. Go to https://console.firebase.google.com/
2. Select project: **carztuneup**
3. Navigate to: **Cloud Messaging** → **Send test message**
4. Paste your FCM token from Step 1
5. Enter title and body
6. Click **Test**

#### Option B: Backend API (Coming Soon)
We can create a test endpoint to send notifications.

---

## 2. Test Service Images

### Step 1: Upload Image in Admin Dashboard
1. Open admin dashboard: http://localhost:3001
2. Navigate to **Services**
3. Click **Add Service** or **Edit** existing service
4. Upload an image
5. Save

### Step 2: View in Customer App
1. Open customer app
2. Go to **Home** screen
3. **Verify**: Service image displays at top of card

**Expected**: Image loads from Cloudinary URL

---

## 3. Test WhatsApp Insurance Flow

### Step 1: Open Insurance Screen
1. Open customer app
2. Navigate to **Insurance** tab
3. Scroll down to "Ready to Get Started?"

### Step 2: Click WhatsApp Button
1. Click **"Contact on WhatsApp"** button
2. **Expected**: WhatsApp opens with:
   - Number: +91 73377 18170
   - Message: "Hello CarsTuneUp, I want to apply for car insurance."

### Step 3: Verify Required Documents
Check that the app shows:
- ✅ Registration Card (RC) - Mandatory
- ✅ Old Insurance Copy - Mandatory
- ✅ Vehicle Number - Mandatory

---

## 4. Test Employee Names Display

### Step 1: Open Admin Dashboard
1. Navigate to http://localhost:3001
2. Login as admin
3. Click **Employees** in sidebar

### Step 2: Verify Display
**Expected**: Employee table shows:
- Name (not blank)
- Email
- Phone
- Status (Active/Inactive)
- Joined date

**If blank**: Employee data might not be populated yet

---

## 5. Test Auto Job Assignment

### Option A: Wait for Scheduled Run (6 AM)
The system automatically runs at 6:00 AM daily

### Option B: Manual Trigger (For Testing)
You can manually trigger the assignment:

1. Create a subscription in admin dashboard
2. Ensure:
   - Subscription is active
   - Customer has an area set
   - At least one employee in same area
   - Employee is available

3. Check backend logs for:
   ```
   Assigned employee [ID] to subscription [ID]
   ```

---

## 6. Test Network Connectivity (Android)

### Step 1: Open on Android Device/Emulator
1. Scan QR code from Expo
2. App should load

### Step 2: Verify Connection
**Expected Console Output**:
```
✅ API Response: 200
```

**If Error**:
```
❌ Network Error
```
- Check if backend is running
- Verify IP address: 172.21.103.137
- Check firewall settings

---

## 7. Test Cloudinary Image Upload

### Step 1: Upload Any Image
Try uploading in:
- Services (admin dashboard)
- Profile image (customer app)
- Job photos (employee app)

### Step 2: Verify Cloudinary
1. Login to Cloudinary: https://cloudinary.com/console
2. Navigate to **Media Library**
3. Check folders:
   - `carstuneup/services`
   - `carstuneup/profiles`
   - `carstuneup/jobs`

**Expected**: Images appear in respective folders

---

## 🐛 Common Issues & Solutions

### Issue 1: "FCM Token not received"
**Cause**: Must use physical device or emulator with Google Play Services  
**Solution**: 
- Use real Android device
- Or use Android emulator with Google Play
- Web doesn't support push notifications

### Issue 2: "Network Error" on Android
**Cause**: Wrong API URL or CORS issue  
**Solution**:
- Check `customer-app/src/config/api.js`
- Verify IP: `172.21.103.137`
- Ensure backend CORS allows all origins in dev

### Issue 3: "Employee names blank"
**Cause**: No employee data or not populated  
**Solution**:
- Create employee accounts
- Ensure employees have userId populated
- Check backend logs for errors

### Issue 4: "Images not loading"
**Cause**: Cloudinary credentials or CORS  
**Solution**:
- Check `.env` has Cloudinary credentials
- Verify images uploaded to Cloudinary
- Check browser console for CORS errors

### Issue 5: "WhatsApp doesn't open"
**Cause**: WhatsApp not installed  
**Solution**:
- Install WhatsApp on device
- Or test on device with WhatsApp installed

---

## 📊 Test Results Checklist

### Push Notifications
- [ ] FCM token generated on login
- [ ] Token saved to backend
- [ ] Test notification received
- [ ] Notification shows in tray
- [ ] Tapping notification opens app

### Service Images
- [ ] Image uploads in admin dashboard
- [ ] Image appears in Cloudinary
- [ ] Image displays in customer app
- [ ] Image loads correctly on Android
- [ ] Image loads correctly on web

### WhatsApp Flow
- [ ] Button opens WhatsApp
- [ ] Correct number: +91 73377 18170
- [ ] Pre-filled message appears
- [ ] Required documents listed
- [ ] Message sends successfully

### Employee Display
- [ ] Names display correctly
- [ ] Email displays correctly
- [ ] Phone displays correctly
- [ ] Status shows correctly
- [ ] Date formats correctly

### Auto Job Assignment
- [ ] Subscription created
- [ ] Employee assigned automatically
- [ ] Job created in database
- [ ] Employee in same area
- [ ] Load balanced correctly

### Network
- [ ] Backend accessible
- [ ] Customer app connects
- [ ] API calls successful
- [ ] No CORS errors
- [ ] Android connects

### Cloudinary
- [ ] Service images upload
- [ ] Profile images upload
- [ ] Job photos upload
- [ ] Images in correct folders
- [ ] URLs accessible

---

## 🎯 Success Criteria

**All Tests Pass** = ✅ Ready for Production

**Minimum Required**:
- ✅ Backend running
- ✅ Customer app connects
- ✅ Service images display
- ✅ WhatsApp opens
- ✅ Employee names show

**Nice to Have**:
- ✅ Push notifications working
- ✅ Auto assignment tested
- ✅ All images uploading

---

## 📞 Need Help?

### Check Logs
**Backend**: Look for errors in terminal  
**Customer App**: Check browser console (F12)  
**Admin Dashboard**: Check browser console (F12)

### Documentation
- `FINAL_IMPLEMENTATION_STATUS.md` - Overall status
- `PUSH_NOTIFICATIONS_SETUP_COMPLETE.md` - Notifications
- `FIREBASE_SETUP_GUIDE.md` - Firebase setup
- `WHATSAPP_AUTOMATION_GUIDE.md` - WhatsApp options

### Quick Fixes
```bash
# Restart backend
cd backend
npm start

# Restart customer app
cd customer-app
npx expo start --port 8082 --clear

# Restart admin dashboard
cd admin-dashboard
npm run dev
```

---

**Happy Testing! 🎉**
