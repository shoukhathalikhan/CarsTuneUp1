# Admin Dashboard - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Prepare Your Code
1. Make sure all your changes are committed to Git
2. Push your code to GitHub/GitLab/Bitbucket

#### Step 2: Sign Up/Login to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your repositories

#### Step 3: Import Project
1. Click "Add New..." → "Project"
2. Find your repository in the list
3. Click "Import" next to your repository
4. If you have a monorepo, select the `admin-dashboard` folder as the root directory

#### Step 4: Configure Project
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: `admin-dashboard` (if monorepo)
3. **Build Command**: `npm run build` (auto-filled)
4. **Output Directory**: `.next` (auto-filled)
5. **Install Command**: `npm install` (auto-filled)

#### Step 5: Add Environment Variables
Click "Environment Variables" and add:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```
**Important**: Replace `your-backend-url.onrender.com` with your actual backend URL

#### Step 6: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Once done, you'll get a URL like: `https://your-project.vercel.app`

#### Step 7: Test Your Deployment
1. Visit your Vercel URL
2. Try logging in with admin credentials
3. Verify all features work correctly

---

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

#### Step 2: Login to Vercel
```powershell
vercel login
```
Follow the prompts to authenticate

#### Step 3: Navigate to Admin Dashboard
```powershell
cd c:\CarsTuneUp\admin-dashboard
```

#### Step 4: Deploy
```powershell
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your account
- **Link to existing project**: No
- **Project name**: carstuneup-admin (or your choice)
- **Directory**: `./` (current directory)
- **Override settings**: No

#### Step 5: Add Environment Variables
```powershell
vercel env add NEXT_PUBLIC_API_URL
```
Enter your backend URL when prompted: `https://your-backend-url.onrender.com/api`

Choose environment: Production

#### Step 6: Deploy to Production
```powershell
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### Update Backend CORS
After deployment, update your backend to allow requests from your Vercel domain:

In your backend `.env` or Render environment variables:
```
ADMIN_DASHBOARD_URL=https://your-project.vercel.app
```

### Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `admin.carstuneup.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your repository:
- **Push to main branch** → Deploys to production
- **Push to other branches** → Creates preview deployment

To disable auto-deployment:
1. Go to Project Settings → Git
2. Toggle "Production Branch" settings

---

## 📊 Monitoring Your Deployment

### View Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment to view logs

### Analytics
1. Go to Project → Analytics
2. View page views, performance metrics, etc.

---

## 🐛 Troubleshooting

### Build Fails
**Error**: "Module not found"
- **Solution**: Run `npm install` locally and commit `package-lock.json`

**Error**: "Build exceeded maximum duration"
- **Solution**: Optimize build by removing unused dependencies

### Environment Variables Not Working
- Make sure variable names start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables

### 404 on Routes
- Next.js handles routing automatically
- Check your `app/` directory structure

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS settings
- Ensure backend is deployed and running

---

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** - Vercel provides this automatically
4. **Restrict API access** - Configure CORS properly in backend
5. **Use strong admin passwords** - Never use default credentials

---

## 📝 Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Backend deployed and URL obtained
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Admin login tested
- [ ] API connection verified
- [ ] Backend CORS updated
- [ ] Custom domain configured (optional)

---

## 🎉 Success!

Your admin dashboard is now live! Access it at your Vercel URL and start managing your CarsTuneUp application.

**Need Help?**
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- CarsTuneUp Support: Check main README.md
