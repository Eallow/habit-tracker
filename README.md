# 🌿 Habits – Daily Tracker

A minimal, beautiful habit tracker. Works on mobile and desktop. Installable as a PWA.

## Features

- ✅ Daily habit check-ins with streaks
- 📅 Calendar & heatmap views
- 📊 Stats & progress tracking
- 💾 Data saved locally in your browser
- 📱 Installable as a PWA (add to home screen)
- 🌙 Dark theme

## Deploy to Vercel (2 minutes)

### Option 1: Vercel CLI
```bash
npm install -g vercel
npm install
vercel
```

### Option 2: GitHub + Vercel (recommended)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**
5. Done! You get a URL like `habits-xxx.vercel.app`

### Option 3: Drag & Drop
1. Run `npm install && npm run build`
2. Go to [vercel.com/new](https://vercel.com/new)
3. Drag the `dist/` folder onto the page

## Install on Mobile (PWA)

After deploying:
- **iPhone**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Open in Chrome → Menu → "Add to Home Screen"

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack

- React 18 + Vite
- date-fns for date logic
- vite-plugin-pwa for PWA/offline support
- LocalStorage for persistence
- No backend needed
