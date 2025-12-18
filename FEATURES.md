# CarsTuneUp - Feature Documentation

## 🎯 Core Features

### 👥 Customer App Features

#### 1. **Authentication**
- User registration with email/password
- Secure login with JWT tokens
- Profile management
- Password change functionality

#### 2. **Service Discovery**
- Browse available car wash services
- View service details (price, frequency, features)
- Filter services by category (basic, premium, deluxe)
- Beautiful card-based UI with service images

#### 3. **Subscription Management**
- Subscribe to car wash plans
- View active subscriptions
- Track next wash date
- View assigned employee details
- Cancel subscriptions
- Subscription history

#### 4. **Insurance Integration**
- Direct WhatsApp integration
- Pre-filled message template
- One-tap contact with insurance team
- Information about required documents
- Feature highlights and benefits

#### 5. **Notifications**
- Push notifications for upcoming washes
- Service completion alerts
- Employee assignment notifications
- Subscription renewal reminders

#### 6. **Profile Management**
- Update personal information
- Manage address and location
- View subscription history
- Rate completed services

---

### 👷 Employee App Features

#### 1. **Authentication**
- Employee login with credentials
- Secure JWT authentication
- Profile viewing

#### 2. **Job Management**
- View today's assigned jobs (max 6/day)
- View all jobs history
- Job status tracking (scheduled, in-progress, completed)
- Customer information display
- Service details for each job

#### 3. **Navigation**
- Integrated Google Maps
- Customer address display
- Route navigation to job location
- Real-time location tracking

#### 4. **Job Execution**
- Start job functionality
- Upload before/after photos
- Add job notes
- Mark job as completed
- Cancel job with reason

#### 5. **Performance Tracking**
- View total jobs completed
- Check daily job count
- Rating from customers
- Performance statistics

#### 6. **Availability Management**
- Toggle availability status
- View working schedule
- Daily job limit management

---

### 🧑‍💼 Admin Dashboard Features

#### 1. **Authentication**
- Admin-only login
- Role-based access control
- Secure session management

#### 2. **Dashboard Analytics**
- Total customers count
- Total employees count
- Active subscriptions
- Completed jobs
- Today's jobs
- Total revenue
- Visual charts and graphs

#### 3. **Customer Management**
- View all customers
- Customer details and history
- Filter by status
- Deactivate/activate accounts
- View customer subscriptions

#### 4. **Employee Management**
- Add/edit/delete employees
- Assign service areas
- Set daily job limits
- View employee performance
- Track ratings and completed jobs
- Manage availability

#### 5. **Service Management**
- Create new services
- Edit service details
- Upload service images
- Set pricing and frequency
- Manage service features
- Activate/deactivate services

#### 6. **Subscription Management**
- View all subscriptions
- Filter by status and date
- Assign employees to subscriptions
- View subscription details
- Track payment status

#### 7. **Job Management**
- View all jobs
- Filter by status, date, employee
- Job details with photos
- Customer feedback and ratings
- Job completion tracking

#### 8. **Revenue Analytics**
- Monthly revenue reports
- Revenue by service type
- Payment status tracking
- Revenue charts and trends

#### 9. **Employee Performance**
- Jobs completed ranking
- Average ratings
- Area-wise distribution
- Availability status

---

## 🤖 Automation Features

### 1. **Automatic Job Assignment**
- Runs daily at 6 AM
- Finds available employees by area
- Assigns jobs to employees with <6 jobs/day
- Creates job records automatically
- Updates employee job counts

### 2. **Notification System**
- Runs daily at 8 AM
- Sends upcoming wash reminders
- Notifies customers 1 day before service
- Push notifications via Firebase FCM

### 3. **Daily Reset**
- Resets employee daily job counts
- Runs at midnight
- Prepares for next day assignments

---

## 🎨 Design Features

### Theme
- **Primary Color**: Blue (#007BFF)
- **Background**: White (#FFFFFF)
- **Modern, clean UI inspired by DYD app**

### UI Components
- Rounded cards with shadows
- Blue accent buttons
- Icon-based navigation
- Bottom tab navigation (mobile)
- Sidebar navigation (admin)
- Responsive design

### Typography
- Clean, readable fonts
- Proper hierarchy
- Consistent sizing

---

## 🔐 Security Features

### 1. **Authentication**
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration (7 days)
- Secure token storage

### 2. **Authorization**
- Role-based access control (customer, employee, admin)
- Route protection
- API endpoint protection
- Middleware validation

### 3. **Data Protection**
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

---

## 📱 Mobile App Features

### Customer App
- **Platform**: iOS & Android (React Native + Expo)
- **Navigation**: Bottom tabs + Stack navigation
- **Offline Support**: AsyncStorage for tokens
- **Maps Integration**: React Native Maps
- **Image Handling**: Expo Image Picker
- **Notifications**: Expo Notifications

### Employee App
- **Platform**: iOS & Android (React Native + Expo)
- **Navigation**: Bottom tabs + Stack navigation
- **Camera Access**: Photo capture for job completion
- **Location Services**: GPS for navigation
- **Real-time Updates**: Job status synchronization

---

## 🌐 Web Dashboard Features

### Admin Dashboard
- **Framework**: Next.js 14 (React)
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Responsive**: Mobile, tablet, desktop support

---

## 🔄 Integration Features

### 1. **WhatsApp Integration**
- Direct link to WhatsApp Business
- Pre-filled message templates
- Automatic phone number formatting
- Cross-platform support

### 2. **Google Maps Integration**
- Address geocoding
- Route navigation
- Location display
- Distance calculation

### 3. **Firebase Integration**
- Push notifications
- Cloud messaging
- Token management
- Multi-device support

---

## 📊 Data Management

### Collections
1. **Users**: Customer, employee, admin accounts
2. **Services**: Car wash service plans
3. **Subscriptions**: Active and historical subscriptions
4. **Employees**: Employee profiles and stats
5. **Jobs**: Job assignments and completion records

### Relationships
- Users ↔ Subscriptions (one-to-many)
- Subscriptions ↔ Services (many-to-one)
- Subscriptions ↔ Employees (many-to-one)
- Jobs ↔ Employees (many-to-one)
- Jobs ↔ Customers (many-to-one)

---

## 🚀 Performance Features

### Backend
- Efficient MongoDB queries
- Indexed collections
- Cron job optimization
- Error handling and logging

### Frontend
- Lazy loading
- Image optimization
- Code splitting
- Caching strategies

### Mobile
- Optimized bundle size
- Efficient re-renders
- AsyncStorage caching
- Background task handling

---

## 📈 Future Enhancements

### Planned Features
1. In-app payment integration (Stripe/PayPal)
2. Real-time chat between customer and employee
3. Video call support for insurance consultation
4. Loyalty points and rewards system
5. Referral program
6. Multi-language support
7. Dark mode
8. Advanced analytics dashboard
9. Automated invoice generation
10. SMS notifications backup

---

## 🎯 Business Logic

### Subscription Flow
1. Customer browses services
2. Selects a plan and subscribes
3. Payment processed (dummy or live)
4. System auto-assigns available employee
5. Job created for next wash date
6. Customer receives confirmation
7. Employee receives job assignment
8. Employee completes job
9. Customer rates service
10. Next wash scheduled automatically

### Employee Assignment Algorithm
```
1. Get customer's area
2. Find employees in same area
3. Filter employees with <6 jobs today
4. Filter available employees
5. Sort by current job count (ascending)
6. Assign to employee with least jobs
7. Create job record
8. Update employee job count
9. Send notifications
```

---

**This comprehensive feature set makes CarsTuneUp a complete solution for car wash and insurance management! 🚗✨**
