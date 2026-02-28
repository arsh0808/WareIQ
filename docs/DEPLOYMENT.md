# Deployment Guide

Complete guide for deploying the Smart Warehouse System to production.

## Prerequisites

- Firebase project set up
- Vercel account
- GitHub repository
- Domain name (optional)

## Part 1: Deploy to Vercel (Frontend)

### Option A: Deploy via GitHub (Recommended)

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/smart-warehouse.git
git push -u origin main
```

2. **Connect to Vercel**

- Go to [Vercel](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Configure project:
  - Framework Preset: Next.js
  - Root Directory: `web-app`
  - Build Command: `npm run build`
  - Output Directory: `.next`

3. **Add Environment Variables**

In Vercel project settings, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

4. **Deploy**

- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web-app
vercel --prod
```

## Part 2: Deploy Firebase (Backend)

### 1. Deploy Firestore Rules

```bash
cd firebase
firebase deploy --only firestore:rules
```

### 2. Deploy Realtime Database Rules

```bash
firebase deploy --only database:rules
```

### 3. Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 5. Deploy All at Once

```bash
firebase deploy
```

## Part 3: Configure Production Settings

### 1. Update CORS Settings

In Firebase Console:
- Go to Storage
- Click on your bucket
- Add CORS configuration

```json
[
  {
    "origin": ["https://your-domain.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

### 2. Update Security Rules

Change Firestore rules from test mode to production:

```javascript
// Before (test mode)
allow read, write: if true;

// After (production)
allow read, write: if request.auth != null;
```

### 3. Enable App Check (Security)

1. Go to Firebase Console > App Check
2. Enable reCAPTCHA v3
3. Add your domain
4. Update web app to use App Check

### 4. Configure Custom Domain (Optional)

**In Vercel:**
1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

**In Firebase:**
1. Go to Hosting (if using)
2. Add custom domain
3. Follow DNS setup instructions

## Part 4: Performance Optimization

### 1. Enable Firestore Indexes

Deploy composite indexes:

```bash
firebase deploy --only firestore:indexes
```

### 2. Configure CDN

Vercel automatically provides CDN. For Firebase Storage:
- Enable CDN in Firebase Console
- Configure cache headers

### 3. Optimize Images

Add to `next.config.js`:

```javascript
images: {
  domains: ['firebasestorage.googleapis.com'],
  formats: ['image/avif', 'image/webp'],
}
```

## Part 5: Monitoring & Logging

### 1. Set up Error Tracking

Install Sentry (optional):

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 2. Enable Firebase Analytics

```javascript
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### 3. Configure Cloud Functions Logging

Cloud Functions automatically log to Google Cloud Logging.

View logs:
```bash
firebase functions:log
```

## Part 6: Continuous Deployment

### Auto-deploy on Push

Vercel automatically deploys on push to main branch.

### Preview Deployments

- Push to feature branch
- Vercel creates preview deployment
- Test before merging to main

### Rollback

In Vercel Dashboard:
- Go to Deployments
- Click on previous deployment
- Click "Promote to Production"

## Part 7: Backup Strategy

### 1. Firestore Backups

Enable automatic backups:
```bash
gcloud firestore export gs://your-bucket/backups
```

### 2. Scheduled Backups

Create Cloud Function:
```javascript
export const scheduledBackup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    // Backup logic
  });
```

## Part 8: Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Security rules deployed
- [ ] Cloud Functions deployed
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Backups configured
- [ ] Performance monitoring enabled
- [ ] Test user authentication
- [ ] Test real-time features
- [ ] Test IoT data flow
- [ ] Load testing completed

## Production URLs

- **Web App**: https://your-domain.vercel.app
- **Firebase Console**: https://console.firebase.google.com/project/your-project-id
- **Vercel Dashboard**: https://vercel.com/dashboard

## Maintenance

### Update Dependencies

```bash
# Web app
cd web-app
npm update

# Firebase functions
cd firebase/functions
npm update
```

### Monitor Costs

- Firebase: Check Firebase Console > Usage
- Vercel: Check Vercel Dashboard > Usage

### Scale as Needed

**Firestore:**
- Automatically scales
- Monitor read/write operations

**Cloud Functions:**
- Set memory limits
- Configure max instances

**Vercel:**
- Upgrade plan if needed
- Monitor bandwidth usage

## Troubleshooting

### Build Fails on Vercel

```bash
# Test build locally
cd web-app
npm run build
```

### Functions Not Working

```bash
# Check logs
firebase functions:log --only functionName

# Redeploy
firebase deploy --only functions:functionName
```

### CORS Errors

- Check allowed origins in Firebase
- Update CORS configuration
- Verify environment variables

## Support

- Firebase: https://firebase.google.com/support
- Vercel: https://vercel.com/support
- Next.js: https://nextjs.org/docs
