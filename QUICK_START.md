# CarsTuneUp - Quick Start Guide ⚡

## 🚀 Get Running in 10 Minutes

### Step 1: Start Backend (2 minutes)

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
```

```bash
npm start
```

✅ Backend running at `http://localhost:5000`

---

### Step 2: Start Admin Dashboard (2 minutes)

```bash
cd admin-dashboard
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

✅ Admin dashboard at `http://localhost:3000`

**Login:** admin@carstuneup.com / admin123

---

### Step 3: Start Customer App (3 minutes)

```bash
cd customer-app
npm install
```

Find your local IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Edit `src/config/api.js`:
```javascript
const API_URL = 'http://YOUR_IP:5000/api';
// Example: 'http://192.168.1.7:5000/api'
```

```bash
npx expo start
```

✅ Scan QR code with Expo Go app

---

### Step 4: Start Employee App (3 minutes)

```bash
cd employee-app
npm install
```

Edit `src/config/api.js`:
```javascript
const API_URL = 'http://YOUR_IP:5000/api';
```

```bash
npx expo start
```

✅ Scan QR code with Expo Go app

---

## 🎯 First Tasks

### 1. Add Services (Admin Dashboard)
1. Go to http://localhost:3000
2. Login with admin credentials
3. Click "Services" in sidebar
4. Click "Add Service"
5. Fill form and upload image
6. Click "Create Service"

### 2. Register Customer (Customer App)
1. Open customer app
2. Click "Sign Up"
3. Fill registration form
4. Login with new credentials

### 3. Browse Services (Customer App)
1. View services on home page
2. Click on a service to see details
3. Services you added in admin will appear here!

---

## 🐛 Quick Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is free
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### Mobile app can't connect
- ✅ Use IP address, not localhost
- ✅ Ensure phone and PC on same WiFi
- ✅ Check Windows Firewall
- ✅ Restart Expo server

### MongoDB connection error
- ✅ Check connection string in `.env`
- ✅ Whitelist your IP in MongoDB Atlas
- ✅ Verify username/password

---

## 📱 Test Accounts

### Admin
- Email: admin@carstuneup.com
- Password: admin123

### Customer (Create your own)
- Register in customer app

### Employee (Create via backend script)
```bash
cd backend
node scripts/addEmployee.js
```

---

## 📚 Full Documentation

- **Complete Setup:** `SETUP_GUIDE.md`
- **Image Storage:** `IMAGE_STORAGE_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Admin dashboard accessible
- [ ] Customer app connects to backend
- [ ] Employee app connects to backend
- [ ] Can login to admin dashboard
- [ ] Can add services in admin
- [ ] Services appear in customer app
- [ ] Can register new customer
- [ ] All apps working without errors

---

## 🎉 You're Ready!

Your CarsTuneUp platform is now running locally. 

**Next Steps:**
1. Add your subscription plans as services
2. Test the complete flow
3. Integrate payment gateway
4. Deploy to production

**Need Help?** Check the full documentation files!

---

**Happy Coding! 🚗✨**
