# Employee Login Credentials

## 🔐 Test Employee Accounts

Use these credentials to login to the **Employee App**:

### 1. Rajesh Kumar
- **Email:** `rajesh@carstuneup.com`
- **Password:** `employee123`
- **Area:** Jayanagar
- **Employee ID:** EMP935078988
- **Phone:** 9876543210

### 2. Priya Sharma
- **Email:** `priya@carstuneup.com`
- **Password:** `employee123`
- **Area:** Koramangala
- **Employee ID:** EMP935471144
- **Phone:** 9876543211

### 3. Amit Patel
- **Email:** `amit@carstuneup.com`
- **Password:** `employee123`
- **Area:** Indiranagar
- **Employee ID:** EMP935943054
- **Phone:** 9876543212

---

## 📱 How to Login

1. Open the **CarsTuneUp Employee App**
2. Enter the email and password from above
3. Tap **Login**

---

## ➕ Add More Employees

### Option 1: Interactive (One at a time)
```bash
cd backend
npm run add-employee
```
Follow the prompts to enter employee details.

### Option 2: Batch (Multiple at once)
```bash
cd backend
npm run add-employees-batch
```
This will add pre-configured sample employees.

**To customize batch employees:**
Edit `backend/scripts/addEmployeeBatch.js` and modify the `sampleEmployees` array.

---

## 📋 Employee Features

Each employee can:
- ✅ View assigned jobs
- ✅ View today's schedule
- ✅ Update job status (Start/Complete)
- ✅ Call customers directly
- ✅ Navigate to job locations
- ✅ View job details and services
- ✅ Manage their profile

---

## 🔧 Employee Settings

Default settings for new employees:
- **Daily Job Limit:** 6 jobs per day
- **Working Days:** Monday - Saturday
- **Status:** Active and Available
- **Initial Rating:** 5.0 stars

---

## 🗄️ Database Storage

Employee data is stored in MongoDB with two collections:
1. **users** - Basic account info (name, email, password, role)
2. **employees** - Employee-specific data (area, limits, stats)

All passwords are securely hashed using bcrypt before storage.
