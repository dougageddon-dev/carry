# carry. 🧡
### Shared parenting, simplified.

A mental load sharing app that helps the primary organizer manage family schedules, kids' info, and communicate everything to the co-parent — powered by Claude AI, Google Maps, and web search.

---

## ✨ Features

- **Today View** — Daily schedule, urgent reminders, one-tap co-parent sync
- **Kids Profiles** — Medical info, allergies, medications, schools, doctors
- **Find** — Search camps & activities with Google Maps + AI-powered summaries
- **Share** — AI-drafted messages sent directly to iMessage
- **carry. AI** — Chat assistant that knows your whole family context

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/carry-app.git
cd carry-app
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your real API keys:

| Variable | Where to get it | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ✅ Yes |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) | ✅ Yes |
| `GOOGLE_PLACES_API_KEY` | Same as above (server-side key, no referrer restrictions) | ✅ Yes |
| `BRAVE_SEARCH_API_KEY` | [api.search.brave.com](https://api.search.brave.com) | ✅ Yes |

### 3. Run Locally

```bash
# Install Netlify CLI globally if you haven't
npm install -g netlify-cli

# Run with Netlify Dev (includes serverless functions)
netlify dev
```

App runs at `http://localhost:8888`

> **Why `netlify dev` instead of `npm start`?**  
> The app uses Netlify Functions for serverless API routes. `netlify dev` runs both the React app AND the functions locally together.

---

## 🔑 API Setup Guide

### Anthropic (Claude AI)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### Google Maps & Places
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable these APIs:
   - **Maps JavaScript API** (for the map in Find tab)
   - **Places API** (for business search)
   - **Geocoding API** (for address lookup)
4. Create **two keys**:
   - Browser key (restrict to your domain) → `REACT_APP_GOOGLE_MAPS_API_KEY`
   - Server key (restrict to your Netlify function IP or unrestricted) → `GOOGLE_PLACES_API_KEY`

### Brave Search API
1. Go to [api.search.brave.com](https://api.search.brave.com)
2. Sign up for free tier (2,000 queries/month free)
3. Create a subscription and get your key → `BRAVE_SEARCH_API_KEY`

---

## 📁 Project Structure

```
carry-app/
├── netlify/
│   └── functions/
│       ├── claude.js        # Claude AI proxy (keeps API key server-side)
│       ├── places.js        # Google Places API proxy
│       └── search.js        # Brave web search proxy
├── src/
│   ├── components/
│   │   ├── AIAssistant.js   # Floating AI chat panel
│   │   └── FindTab.js       # Camp/activity search with map
│   ├── hooks/
│   │   ├── useClaude.js     # React hook for Claude API
│   │   └── useGoogleMaps.js # React hook for Maps SDK
│   ├── lib/
│   │   ├── api.js           # Centralized API client
│   │   └── AppContext.js    # Global app state + family data
│   ├── App.js               # Main app + Today/Kids/Share tabs
│   └── index.js
├── public/
│   └── index.html
├── .env.example             # Template — copy to .env.local
├── .gitignore               # Excludes .env files ✅
├── netlify.toml             # Netlify build + redirect config
└── package.json
```

---

## 🌐 Deploy to Netlify

### Option A: Connect GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Select your repo
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `build`
5. Go to **Site settings → Environment variables** and add all 4 keys from `.env.example`
6. Deploy!

### Option B: Netlify CLI

```bash
netlify login
netlify init
netlify env:set ANTHROPIC_API_KEY your_key_here
netlify env:set REACT_APP_GOOGLE_MAPS_API_KEY your_key_here
netlify env:set GOOGLE_PLACES_API_KEY your_key_here
netlify env:set BRAVE_SEARCH_API_KEY your_key_here
netlify deploy --prod
```

---

## 🔧 Architecture

```
Browser (React)
    │
    ├── /api/claude   → netlify/functions/claude.js  → Anthropic API
    ├── /api/places   → netlify/functions/places.js  → Google Places API  
    └── /api/search   → netlify/functions/search.js  → Brave Search API
```

All API keys live in Netlify environment variables — never in the browser bundle.

---

## 🛣️ Roadmap

- [ ] User authentication (Netlify Identity or Auth0)
- [ ] Persistent family data (Fauna DB or Supabase)
- [ ] Push notifications for reminders
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] Co-parent mobile app view
- [ ] Voice input for quick adds
- [ ] Receipt/document scanning for medical records

---

## 📄 License

MIT
