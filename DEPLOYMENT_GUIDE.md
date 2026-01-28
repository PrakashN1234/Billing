# Deployment Guide

This guide will help you deploy the Supermarket Management System to GitHub and various hosting platforms.

## 📋 Prerequisites

- Git installed on your system
- Node.js (v18 or higher)
- GitHub account
- Firebase project configured

## 🚀 GitHub Deployment

### Step 1: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Supermarket Management System"

# Set main branch
git branch -M main

# Add remote origin
git remote add origin https://github.com/PrakashN1234/Billing.git

# Push to GitHub
git push -u origin main
```

### Step 2: GitHub Pages Deployment

```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Deploy to GitHub Pages
npm run deploy
```

Your application will be available at: `https://prakashn1234.github.io/Supermarket`

## 🌐 Alternative Deployment Options

### Netlify Deployment

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18`

3. **Environment Variables**
   - Add Firebase configuration as environment variables
   - Prefix with `REACT_APP_` for client-side access

### Vercel Deployment

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Build Settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Hosting**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## 🔧 Environment Configuration

### Firebase Configuration

Create a `.env` file in your project root:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Update `src/firebase.js` to use environment variables:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

## 🔒 Security Considerations

### Firebase Security Rules

Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables

- Never commit `.env` files to version control
- Add `.env` to your `.gitignore` file
- Use platform-specific environment variable settings for deployment

## 📊 Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build:analyze

# Build for production
npm run build
```

### Caching Strategy

- Enable browser caching for static assets
- Use Firebase Firestore offline persistence
- Implement service worker for offline functionality

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

2. **Firebase Connection Issues**
   - Verify Firebase configuration
   - Check Firestore security rules
   - Ensure authentication is properly configured

3. **Deployment Issues**
   - Check build output for errors
   - Verify environment variables are set
   - Test locally before deploying: `npm run build && npx serve -s build`

## 📝 Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Firebase authentication works
- [ ] Inventory data loads correctly
- [ ] All user roles function properly
- [ ] Barcode generation/scanning works
- [ ] Responsive design works on mobile
- [ ] HTTPS is enabled (required for camera access)

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      run: npm run deploy
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This will automatically deploy your application whenever you push to the main branch.

## 📞 Support

If you encounter any issues during deployment:

1. Check the [Issues](https://github.com/PrakashN1234/Supermarket/issues) page
2. Create a new issue with detailed error information
3. Contact: nprakash315349@gmail.com

---

**Happy Deploying! 🚀**