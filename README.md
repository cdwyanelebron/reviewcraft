# 📖 ReviewCraft AI
### AI-powered reviewer generator — by DL Caliwan

---

## 📁 Project Structure
```
reviewcraft-ai/
├── api/
│   ├── generate.js      → POST /api/generate
│   ├── auth.js          → POST /api/auth
│   ├── reviewers.js     → GET/DELETE /api/reviewers
│   └── health.js        → GET /api/health
├── lib/
│   └── supabase.js      → Shared DB client
├── public/
│   └── index.html       → Frontend UI
├── .vscode/             → VS Code config
├── supabase_schema.sql  → Run once in Supabase
├── vercel.json          → Deployment routing
├── package.json
├── .env.example         → Copy → .env.local
└── .gitignore
```

---

## 🚀 SETUP FROM VS CODE

### 1. Clone & Open
After pushing to GitHub, clone it:
```bash
git clone https://github.com/YOUR_USERNAME/reviewcraft-ai.git
cd reviewcraft-ai
code .
```

### 2. Install Dependencies
Open VS Code terminal (`Ctrl + `` ` ``):
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env.local
```
Then open `.env.local` and fill in your actual keys (see steps below).

---

## 🗄️ SUPABASE SETUP (free)

1. Go to [supabase.com](https://supabase.com) → **Start your project**
2. **New Project** → name it `reviewcraft` → region: **Southeast Asia (Singapore)**
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** → **New query**
5. Paste entire contents of `supabase_schema.sql` → **Run**
6. Go to **Settings → API** and copy:

```
Project URL      → paste as SUPABASE_URL
anon/public      → paste as SUPABASE_ANON_KEY
service_role     → paste as SUPABASE_SERVICE_KEY  ⚠️ keep secret!
```

---

## 🤖 ANTHROPIC API KEY

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key** → copy it
3. Paste as `ANTHROPIC_API_KEY` in `.env.local`

---

## ☁️ VERCEL DEPLOYMENT (free)

### Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Deploy
```bash
vercel
```
Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (your account)
- Link to existing project? **N**
- Project name? `reviewcraft-ai`
- In which directory is your code? `.`
- Override settings? **N**

You'll get a URL like: `https://reviewcraft-ai-xxx.vercel.app`

### Add Environment Variables
Either via CLI:
```bash
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add SUPABASE_ANON_KEY
vercel env add APP_SECRET
```
Or via dashboard: **vercel.com → Project → Settings → Environment Variables**

### Deploy to Production
```bash
vercel --prod
```

---

## 🔗 CONNECT FRONTEND TO YOUR BACKEND

Open `public/index.html`, find line ~10 of the `<script>`:
```js
const API_BASE = "https://YOUR-PROJECT.vercel.app";
```
Change to your actual Vercel URL:
```js
const API_BASE = "https://reviewcraft-ai-xxx.vercel.app";
```
Then redeploy: `vercel --prod`

---

## 💻 LOCAL DEVELOPMENT

```bash
# Run locally with hot reload
npm run dev
# Opens at http://localhost:3000
```

Make sure `.env.local` has all 4 keys filled in before running.

---

## 📡 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if API is running |
| POST | `/api/generate` | Generate AI reviewer |
| POST | `/api/auth?action=signup` | Create account |
| POST | `/api/auth?action=login` | Log in |
| POST | `/api/auth?action=logout` | Log out |
| GET | `/api/auth?action=me` | Get current user |
| GET | `/api/reviewers` | List saved reviewers |
| GET | `/api/reviewers?id=xxx` | Get single reviewer |
| DELETE | `/api/reviewers?id=xxx` | Delete reviewer |

---

## 🔄 GITHUB WORKFLOW

```bash
# After making changes
git add .
git commit -m "your message"
git push origin main

# Vercel auto-deploys on every push to main!
# (after you connect GitHub repo in vercel.com dashboard)
```

### Connect GitHub to Vercel (auto-deploy)
1. Go to [vercel.com](https://vercel.com) → your project
2. **Settings → Git** → **Connect Git Repository**
3. Choose your GitHub repo
4. From now on, every `git push` auto-deploys! ✅

---

## 💰 COST (all free tier)
- **Supabase** — free: 500MB DB, 2GB bandwidth/month
- **Vercel** — free: 100GB bandwidth, unlimited deployments
- **Anthropic Haiku** — ~₱0.014 per reviewer generated

---

*ReviewCraft AI — by DL Caliwan*
