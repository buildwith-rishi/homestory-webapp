# Deployment Guide for Good Homestory CRM

## Logo Fix Applied ✅

The website logo has been properly configured for Netlify deployment.

### Changes Made:

1. **Logo File Location**
   - Logo file moved from project root to `public/logo.png`
   - This ensures Vite copies it to the `dist` folder during build

2. **Netlify Configuration** (`netlify.toml`)
   - Added cache headers for logo file for optimal performance
   - Logo will be cached for 1 year (immutable)

3. **Build Output**
   - Logo is now included in `dist/logo.png` after build
   - Logo serves at `/logo.png` in production

### File Structure:

```
project/
├── public/
│   ├── logo.png          ← Logo source (copied during build)
│   ├── _headers
│   └── _redirects
├── dist/                 (generated on build)
│   ├── logo.png          ← Logo in production
│   ├── index.html
│   └── assets/
```

### Logo Component Usage:

The logo is used via the `Logo` component in:

- `src/components/shared/Logo.tsx` - Main logo component
- `src/components/dashboard/DashboardSidebar.tsx` - Sidebar branding
- `src/components/landing/LandingNav.tsx` - Landing page navigation
- `index.html` - Favicon

All references use `/logo.png` which works correctly in both development and production.

## Deployment Steps:

### 1. Build the Project

```bash
npm run build
```

### 2. Verify Build Output

```bash
ls -lh dist/logo.png
# Should show: ~22KB file
```

### 3. Deploy to Netlify

**Option A: Manual Deploy**

```bash
# If you have Netlify CLI installed:
netlify deploy --prod --dir=dist
```

**Option B: Git-based Deploy**

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Fix: Add logo to public folder for Netlify deployment"
   git push origin main
   ```
2. Netlify will auto-deploy from your repository

### 4. Verify Deployment

After deployment, check:

- ✅ Logo appears in navigation bar
- ✅ Logo appears in dashboard sidebar
- ✅ Favicon shows in browser tab
- ✅ Logo loads on all pages

**Test URL**: `https://your-site-name.netlify.app/logo.png`

## Important Notes:

⚠️ **Always keep logo in `public/` folder** - Don't move it back to project root

⚠️ **Image paths in Vite:**

- Files in `public/` folder are served at root path (`/logo.png`)
- Files imported in code go through bundler (use `import logo from './logo.png'`)

## Troubleshooting:

### Logo Still Not Showing?

1. Clear Netlify cache and redeploy
2. Check browser console for 404 errors
3. Verify logo exists in deployed site: `https://your-site.netlify.app/logo.png`
4. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Build Issues?

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

**Status**: ✅ Logo fix applied and tested
**Last Updated**: January 21, 2026
