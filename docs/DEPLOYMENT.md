# Deployment Guide

Mini Trainer Engine supports multiple deployment options, from USB distribution to Progressive Web Apps (PWA). This guide covers all deployment scenarios.

## Deployment Options

| Option | Use Case | Offline | Installation |
|--------|----------|---------|--------------|
| USB Distribution | Schools, offline environments | Full | Copy files |
| Static Hosting | Web servers, CDNs | Partial | Upload dist/ |
| PWA | Mobile devices, app-like experience | Full | Install from browser |

## Building for USB Distribution

USB distribution allows the application to run directly from a USB drive using the file:// protocol, without any web server.

### Build Command

```bash
npm run build
```

This generates a `dist/` directory optimized for file:// protocol.

### USB-Specific Optimizations

The build includes several optimizations for file:// compatibility:

1. **IIFE Format**: Code wrapped in Immediately Invoked Function Expressions
2. **Relative Paths**: All assets use relative paths (`./`)
3. **No Module Preload**: Avoids ES module loading issues
4. **Inline Dynamic Imports**: All code bundled into single files

### Deploying to USB

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Copy the dist/ directory** to your USB drive:
   - Windows: Copy `dist/` contents to `X:\trainer\` (where X is the USB drive letter)
   - macOS: Copy to `/Volumes/USBNAME/trainer/`
   - Linux: Copy to `/media/username/USBNAME/trainer/`

3. **Test the deployment**:
   - Open the USB drive in file explorer
   - Double-click `index.html`
   - The application should open in the default browser

### USB Distribution Requirements

| Requirement | Details |
|-------------|---------|
| Browser | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |
| Storage | ~10-50MB depending on content |
| Internet | Not required after initial load |

### USB Best Practices

1. **Test on target browsers**: Different browsers handle file:// differently
2. **Include a README.txt** on the USB with instructions
3. **Use descriptive folder names** (e.g., "German-Trainer" not "dist")
4. **Test on multiple operating systems**

## Building for Static Hosting

Deploy to any static web hosting service (Netlify, Vercel, GitHub Pages, Apache, Nginx).

### Build Command

```bash
npm run build
```

### Output Structure

```
dist/
âââ index.html
âââ assets/
â   âââ index-[hash].js
â   âââ index-[hash].css
âââ data/
â   âââ exercises.js
âââ fonts/
```

### Deployment Targets

#### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

**netlify.toml**:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

1. Import your repository in Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

**vercel.json**:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### GitHub Pages

1. Build the application:

   ```bash
   npm run build
   ```

2. Push the `dist/` directory to the `gh-pages` branch:

   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

3. Enable GitHub Pages in repository settings

#### Apache

1. Copy `dist/` contents to your web directory
2. Add `.htaccess` for SPA routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

1. Copy `dist/` contents to your web root
2. Configure nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/trainer;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Building for PWA

Progressive Web App (PWA) deployment enables offline use, installation on devices, and app-like experience.

### Build Command

```bash
npm run build:pwa
```

This generates the standard build plus PWA-specific files.

### PWA Files

| File | Purpose |
|------|---------|
| `manifest.json` | PWA manifest for installation |
| `sw.js` | Service worker for offline support |
| Icons | App icons in various sizes |

### PWA Manifest

The manifest is located at [`public/manifest.json`](../public/manifest.json):

```json
{
  "name": "Mini Trainer Engine",
  "short_name": "MiniTrainer",
  "description": "A configurable learning platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Customizing PWA Settings

1. **Edit manifest.json**:
   - Update `name` and `short_name`
   - Set your `theme_color`
   - Add appropriate icons

2. **Add app icons**:
   - Create 192x192 and 512x512 PNG icons
   - Place in `public/` directory
   - Reference in manifest

### PWA Installation

Users can install the PWA:

- **Chrome**: Menu > "Install Mini Trainer Engine"
- **iOS Safari**: Share > "Add to Home Screen"
- **Android Chrome**: Menu > "Add to Home Screen"

### Offline Support

The service worker caches:

- Application shell (HTML, CSS, JS)
- Exercise data
- Fonts
- Static assets

Offline functionality:

- Full app functionality without internet
- Data persists in IndexedDB
- Syncs when back online

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate configuration
        run: npm run validate
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
      
      - name: Deploy to hosting
        # Add your deployment step here
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run validate
    - npm run test

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - # Add deployment commands
  only:
    - main
```

## Environment Configuration

### Build-Time Variables

Set environment variables during build:

```bash
VITE_APP_TITLE="My Trainer" npm run build
```

Access in code:

```typescript
const appTitle = import.meta.env.VITE_APP_TITLE;
```

### Runtime Configuration

For runtime configuration, create a `config.js`:

```javascript
// public/config.js
window.TRAINER_CONFIG = {
  apiEndpoint: 'https://api.example.com',
  analyticsId: 'UA-XXXXX-Y'
};
```

Load before the app:

```html
<script src="./config.js"></script>
```

## Performance Optimization

### Build Analysis

Analyze bundle size:

```bash
npm run build -- --mode analyze
```

### Optimization Tips

1. **Minimize exercise data**: Only include necessary fields
2. **Optimize images**: Use WebP format, appropriate sizes
3. **Code splitting**: The build automatically splits code
4. **Gzip compression**: Enable on your web server

### Caching Strategy

| Resource | Cache Strategy |
|----------|----------------|
| HTML | No cache (or short cache) |
| JS/CSS | Long cache with hash |
| Data | Cache with revalidation |
| Images | Long cache |

## Security Considerations

### HTTPS

For web deployment, always use HTTPS:

- Required for PWA
- Required for service workers
- Protects user data

### Content Security Policy

Add CSP headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
```

### XSS Prevention

The application escapes user input by default. For USB distribution:

- No server-side vulnerabilities
- Data stored locally in browser

## Troubleshooting

### USB Distribution Issues

| Issue | Solution |
|-------|----------|
| Blank page | Try a different browser |
| CORS errors | Should not occur with IIFE build |
| Missing data | Ensure `data/exercises.js` exists |

### PWA Issues

| Issue | Solution |
|-------|----------|
| Not installable | Check manifest.json is valid |
| Offline not working | Check service worker registration |
| Cache not updating | Increment service worker version |

### General Build Issues

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run validate` first |
| Missing exercises | Run `npm run build:data` |
| Type errors | Run `npm run typecheck` |

## Next Steps

- [Configure your trainer](CONFIGURATION.md)
- [Create exercises](EXERCISES.md)
- [Extend the engine](EXTENDING.md)
