# GitHub Pages Troubleshooting Guide

## Current Issue
The React app is not working when deployed to GitHub Pages at https://prakashn1234.github.io/Billing-System

## Common Issues and Solutions

### 1. Repository Settings Check
First, ensure GitHub Pages is properly configured:

1. Go to your repository: https://github.com/PrakashN1234/Billing-System
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Ensure:
   - Source is set to "Deploy from a branch"
   - Branch is set to "gh-pages"
   - Folder is set to "/ (root)"

### 2. Build Path Issues
The most common issue is incorrect asset paths. Check if:

**Problem**: Assets (CSS, JS) are not loading due to incorrect paths
**Solution**: Ensure `homepage` in package.json matches exactly:
```json
"homepage": "https://prakashn1234.github.io/Billing-System"
```

### 3. Routing Issues (SPA)
**Problem**: React Router routes return 404 on direct access
**Solution**: We already have `public/_redirects` file, but GitHub Pages might not support it.

**Alternative Solution**: Add `404.html` file:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Supermarket Management System</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      var pathSegmentsToKeep = 1;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>
```

### 4. Firebase Configuration Issues
**Problem**: Firebase might not work with GitHub Pages domain
**Solution**: Update Firebase project settings to allow GitHub Pages domain

### 5. HTTPS/HTTP Mixed Content
**Problem**: Loading HTTP resources on HTTPS GitHub Pages
**Solution**: Ensure all resources use HTTPS

### 6. Build Issues
**Problem**: Build might have errors or warnings
**Solution**: Check build output for issues

## Immediate Fixes to Try

### Fix 1: Update Package.json and Redeploy
Ensure correct configuration and redeploy:

```bash
# 1. Clean install
npm ci

# 2. Build locally to check for errors
npm run build

# 3. Deploy again
npm run deploy
```

### Fix 2: Check GitHub Pages Status
1. Go to repository Settings > Pages
2. Check if there are any error messages
3. Verify the source branch is correct

### Fix 3: Alternative Deployment Method
If gh-pages package fails, try manual deployment:

```bash
# Build the project
npm run build

# Create gh-pages branch manually
git checkout --orphan gh-pages
git rm -rf .
cp -r build/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
git checkout main
```

### Fix 4: Use GitHub Actions (Recommended)
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
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

## Debugging Steps

### Step 1: Check Browser Console
1. Open https://prakashn1234.github.io/Billing-System
2. Open Developer Tools (F12)
3. Check Console for errors
4. Check Network tab for failed requests

### Step 2: Verify Build Output
```bash
npm run build
# Check if build folder is created successfully
# Look for any warnings or errors
```

### Step 3: Test Build Locally
```bash
npm run build
npx serve -s build
# Test if the built version works locally
```

### Step 4: Check Repository Structure
Ensure the gh-pages branch contains:
- index.html
- static/ folder with CSS and JS files
- All necessary assets

## Firebase Specific Issues

### Issue: Firebase Auth Domain
Add GitHub Pages domain to Firebase:
1. Go to Firebase Console
2. Authentication > Settings > Authorized domains
3. Add: `prakashn1234.github.io`

### Issue: Firestore Security Rules
Ensure rules allow access from GitHub Pages domain

## Quick Fix Commands

Run these commands to fix common issues:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json
npm install

# 2. Update homepage (if needed)
npm pkg set homepage="https://prakashn1234.github.io/Billing-System"

# 3. Build and deploy
npm run build
npm run deploy

# 4. Check deployment status
git log --oneline -n 5
```

## Alternative Hosting Options

If GitHub Pages continues to have issues:

1. **Netlify**: Drag and drop build folder
2. **Vercel**: Connect GitHub repository
3. **Firebase Hosting**: `firebase deploy`

## Contact Support

If issues persist:
1. Check GitHub Pages status: https://www.githubstatus.com/
2. Create issue in repository with error details
3. Include browser console errors and network tab information