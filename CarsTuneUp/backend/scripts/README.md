# Employee Management Scripts

This directory contains scripts to manage employee accounts in the CarsTuneUp database.

## Scripts Available

### 1. Add Single Employee (Interactive)
**File:** `addEmployee.js`

This script allows you to add one employee at a time with interactive prompts.

**Usage:**
```bash
cd backend
npm run add-employee
```

**You will be prompted for:**
- Name
- Email
- Phone
- Password (minimum 6 characters)
- Service Area (e.g., Jayanagar, Koramangala)
- Daily Job Limit (default: 6)

**Example:**
```
Name: Rajesh Kumar
Email: rajesh@carstuneup.com
Phone: 9876543210
Password: employee123
Service Area: Jayanagar
Daily Job Limit: 6
```

---

### 2. Add Multiple Employees (Batch)
**File:** `addEmployeeBatch.js`

This script adds multiple pre-configured sample employees at once.

**Usage:**
```bash
cd backend
npm run add-employees-batch
```

**Default Sample Employees:**
1. **Rajesh Kumar**
   - Email: rajesh@carstuneup.com
   - Password: employee123
   - Area: Jayanagar

2. **Priya Sharma**
   - Email: priya@carstuneup.com
   - Password: employee123
   - Area: Koramangala

3. **Amit Patel**
   - Email: amit@carstuneup.com
   - Password: employee123
   - Area: Indiranagar

**To customize:** Edit the `sampleEmployees` array in `addEmployeeBatch.js`

---

## Employee Account Details

Each employee account includes:

### User Profile
- Name
- Email (unique, used for login)
- Phone number
- Password (hashed with bcrypt)
- Role: 'employee'
- Service area
- Active status

### Employee Profile
- Employee ID (auto-generated, e.g., EMP123456789)
- Service area
- Daily job limit (default: 6 jobs/day)
- Availability status
- Working days (Monday-Saturday by default)
- Job statistics (completed jobs, ratings)

---

## Important Notes

1. **Email must be unique** - Script will skip if email already exists
2. **Password minimum length** - 6 characters required
3. **Automatic features:**
   - Employee ID is auto-generated
   - Password is automatically hashed
   - Default working days: Monday-Saturday
   - Initial rating: 5.0
   - Status: Active and Available

4. **Database connection** - Scripts use the MongoDB URI from `.env` file

---

## Troubleshooting

### Error: "MONGODB_URI is not set"
- Ensure `.env` file exists in the backend directory
- Check that `MONGODB_URI` is properly configured

### Error: "User with this email already exists"
- Use a different email address
- Or delete the existing user from database first

### Error: "Cannot connect to MongoDB"
- Check your internet connection
- Verify MongoDB URI is correct
- Ensure MongoDB cluster is accessible

---

## Login to Employee App

After creating an employee account, use these credentials in the employee mobile app:

**Login Screen:**
- Email: [employee email]
- Password: [employee password]

The app will verify the user has 'employee' role before allowing access.
