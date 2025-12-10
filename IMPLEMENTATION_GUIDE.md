# CarsTuneUp Implementation Guide

## ✅ Completed Changes

### 1. IP Address Configuration
**Status:** ✅ COMPLETED
- Both apps already use `http://172.21.103.137:5000/api`
- No changes needed

### 2. Onboarding Flow (3-Step Process)
**Status:** ✅ COMPLETED

After signup or login, users are guided through a 3-step onboarding process:

**Step 1: Address Selection**
- User can use current location or enter manually
- Required fields: Street, City, State, PIN Code
- Optional: Landmark
- Can skip and complete later from profile

**Step 2: Vehicle Selection**
- Two-step process: Select Brand → Select Model
- Search functionality for easy selection
- Hardcoded list of popular Indian car brands and models
- Can skip and complete later from profile

**Step 3: Main App**
- Once both steps are completed, user enters the main app
- If user skips, they can complete from Profile section later

**Files Modified:**
- `customer-app/src/screens/RegisterScreen.js` - Navigate to AddressSelection after signup
- `customer-app/src/screens/LoginScreen.js` - Check profile completion and navigate accordingly
- `customer-app/App.js` - Simplified navigation stack
- `customer-app/src/screens/AddressSelectionScreen.js` - Improved onboarding flow
- `customer-app/src/screens/VehicleSelectionScreen.js` - Improved onboarding flow

### 3. Smart Job Assignment System
**Status:** ✅ COMPLETED

**🎯 Core Business Logic:**

**1. Customer-Employee Assignment:**
- Each employee can handle **maximum 6 customers** at a time
- Same employee is assigned to same customer for ALL their washes
- Builds familiarity, trust, and efficiency

**2. Subscription Plans & Job Creation:**
When a customer subscribes, ALL wash jobs are created upfront:
- **Daily Plan (30 washes/month)** → 30 job entries created
- **2-Days-Once (15 washes/month)** → 15 job entries created
- **3-Days-Once (10 washes/month)** → 10 job entries created
- **Weekly-Once (4 washes/month)** → 4 job entries created
- **One-Time** → 1 job entry created

**3. Assignment Algorithm:**
```
Step 1: Check if customer already has assigned employee
        → YES: Use same employee for all new washes
        → NO: Go to Step 2

Step 2: Find employee with least customers (< 6 capacity)
        → Assign customer to that employee
        → Create ALL wash jobs for subscription period

Step 3: All future washes for this customer go to same employee
```

**Example Scenario:**
```
Employee 1: 3 customers (Capacity: 3/6)
Employee 2: 5 customers (Capacity: 5/6)
Employee 3: 2 customers (Capacity: 2/6)

New Customer subscribes to 30-wash plan:
→ Assigned to Employee 3 (has least customers)
→ 30 jobs created, all assigned to Employee 3
→ Employee 3 now: 3/6 customers
```

**Database Structure:**
```javascript
Employee Model:
{
  maxCustomers: 6,
  assignedCustomers: [customerId1, customerId2, ...],
  // Max 6 customers per employee
}

Job Model:
{
  employeeId: "same employee for all customer's washes",
  customerId: "customer",
  subscriptionId: "subscription",
  scheduledDate: "wash date",
  status: "scheduled/completed/cancelled"
}
```

**Files Modified:**
- `backend/models/Employee.model.js` - Added `maxCustomers` and `assignedCustomers` fields
- `backend/services/automation.service.js` - Complete rewrite with new logic
- `backend/routes/job.routes.js` - Added employee stats endpoint

**API Endpoints:**
```
GET /api/jobs/stats/employees - View employee-customer assignments (Admin)
```

**Testing:**
```bash
cd backend
node scripts/redistribute-jobs.js
```

This shows which customers are assigned to which employees.

### 4. Employee Management (Admin Dashboard)
**Status:** ✅ COMPLETED

**Features:**
- ✅ Admin can create employees from dashboard
- ✅ All employees get default password: `Employee@123`
- ✅ Admin can delete employees (removes from database completely)
- ✅ Employee list shows: ID, Name, Contact, Area, Jobs, Status
- ✅ Employees can login to Employee App with email + default password

**How It Works:**
1. Admin clicks "Add Employee" in dashboard
2. Fills in: Name, Email, Phone, Service Area
3. Employee is created with default password `Employee@123`
4. Employee can now login to Employee App
5. Admin can delete employees anytime (removes user account + employee profile)

**Files Created/Modified:**
- `admin-dashboard/app/dashboard/employees/page.tsx` - Complete employee management UI
- `backend/controllers/employee.controller.js` - Added `createEmployee` function
- `backend/routes/employee.routes.js` - Added POST route

**API Endpoints:**
```
POST   /api/employees          - Create employee (Admin only)
GET    /api/employees          - List all employees (Admin only)
DELETE /api/employees/:id      - Delete employee (Admin only)
```

**Default Credentials:**
- Email: As provided by admin
- Password: `Employee@123` (same for all employees)

### 5. Brand & Model Management
**Status:** ✅ COMPLETED

**Backend Files:**
- `backend/models/Brand.model.js`
- `backend/controllers/brand.controller.js`
- `backend/routes/brand.routes.js`
- `backend/config/cloudinary.js` (created for image uploads)
- Added to `server.js`

**Admin Dashboard:**
- `admin-dashboard/app/dashboard/brands/page.tsx` (new page)
- Updated `admin-dashboard/components/DashboardLayout.tsx` (added Brands menu)

**Features:**
- ✅ Create/Update/Delete brands
- ✅ Upload brand logos (Cloudinary)
- ✅ Add/Delete models per brand
- ✅ Admin dashboard interface for brand management
- ✅ Public API for customer app

**Note:** Job assignment is NOT based on area - it will be based on subscription plans when business expands.

---

## 📋 Brand API Endpoints

### Get All Brands (Public)
```
GET /api/brands?isActive=true
```

### Admin Endpoints (Require Auth)
```
POST   /api/brands                    - Create brand (with logo upload)
PUT    /api/brands/:id                - Update brand
DELETE /api/brands/:id                - Delete brand
POST   /api/brands/:id/models         - Add model
PUT    /api/brands/:id/models/:modelId - Update model
DELETE /api/brands/:id/models/:modelId - Delete model
```

---

## 🔧 Customer App Integration

### Create Brand Service
File: `customer-app/src/services/brand.service.js`

```javascript
import api from '../config/api';

export const brandService = {
  getAllBrands: async () => {
    const response = await api.get('/brands?isActive=true');
    return response.data;
  }
};
```

### Update Registration Screen
```javascript
import { brandService } from '../services/brand.service';

const [brands, setBrands] = useState([]);

useEffect(() => {
  loadBrands();
}, []);

const loadBrands = async () => {
  const response = await brandService.getAllBrands();
  setBrands(response.data.brands);
};
```

---

## 💳 Payment Gateway - Razorpay Integration

### 1. Install Package
```bash
cd customer-app
npm install react-native-razorpay
```

### 2. Backend Setup

Add to `.env`:
```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Create `backend/config/razorpay.js`:
```javascript
const Razorpay = require('razorpay');

module.exports = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

### 3. Payment Controller
Create `backend/controllers/payment.controller.js`:
```javascript
const razorpay = require('../config/razorpay');

exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  });
  res.json({ status: 'success', data: { order } });
};
```

### 4. Frontend Usage
```javascript
import RazorpayCheckout from 'react-native-razorpay';

const handlePayment = async () => {
  // Create order
  const orderRes = await api.post('/payments/create-order', { amount: 500 });
  
  // Open Razorpay
  const options = {
    key: 'YOUR_KEY_ID',
    amount: orderRes.data.order.amount,
    order_id: orderRes.data.order.id,
    name: 'CarsTuneUp',
    currency: 'INR'
  };
  
  const data = await RazorpayCheckout.open(options);
  
  // Create subscription with payment ID
  await api.post('/subscriptions', {
    serviceId: selectedService,
    paymentId: data.razorpay_payment_id
  });
};
```

---

## 🚀 Next Steps

1. **Test auto-assignment:** Ensure employees have `area` field set
2. **Implement brand UI:** Update customer app registration
3. **Setup Razorpay:** Get API keys and integrate payment
4. **Admin Dashboard:** Create UI for brand management

---

## 📝 Admin Credentials Needed

Create admin user to manage brands:
```javascript
// Use existing auth endpoint
POST /api/auth/register
{
  "name": "Admin",
  "email": "admin@carstuneup.com",
  "password": "admin123",
  "phone": "1234567890",
  "role": "admin"
}
```

Then use admin token for brand management endpoints.
