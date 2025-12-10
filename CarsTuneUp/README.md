# CarsTuneUp - Complete Car Care & Insurance Management Platform

## 🚗 Overview
CarsTuneUp is a comprehensive car care and insurance companion app that simplifies car wash services, subscription management, and insurance communication.

## 📁 Project Structure
```
CarsTuneUp/
├── backend/                 # Node.js + Express API
├── admin-dashboard/         # Next.js Admin Web Dashboard
├── customer-app/           # React Native Customer App
├── employee-app/           # React Native Employee App
└── README.md
```

## 🎯 Features
- **Customer App**: Subscribe to car wash plans, track services, contact insurance via WhatsApp
- **Employee App**: Manage daily jobs, navigate to customer locations, upload service photos
- **Admin Dashboard**: Manage services, users, employees, subscriptions, and analytics

## 🛠️ Technology Stack
- **Frontend Web**: Next.js (React)
- **Mobile Apps**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Push Notifications**: Firebase Cloud Messaging
- **Maps**: Google Maps API
- **Messaging**: WhatsApp API Integration

## 🎨 Design Theme
- **Colors**: Blue (#007BFF) and White (#FFFFFF)
- **Style**: Modern, clean, professional
- **Inspiration**: DYD app design principles

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MongoDB URI and JWT secret
npm run dev
```

### Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm run dev
```

### Customer App Setup
```bash
cd customer-app
npm install
npx expo start
```

### Employee App Setup
```bash
cd employee-app
npm install
npx expo start
```

## 📦 Deployment
- **Backend**: Render/Netlify
- **Admin Dashboard**: Vercel
- **Database**: MongoDB Atlas
- **Mobile Apps**: Google Play Store / Apple App Store

## 🔑 Environment Variables
See individual `.env.example` files in each directory for required configuration.

## 📄 License
Proprietary - CarsTuneUp © 2024
