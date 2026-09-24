# 🚀 100% Free Online Hosting Guide for Habesha Auto (No Paid Domain Needed)

You do **not** need to buy a custom domain. The free cloud hosting platforms below provide **free HTTPS public URLs** (e.g. `https://habesha-auto.onrender.com` or `https://habesha-auto.vercel.app`) that you can share immediately with auto shop owners and test subscribers.

---

## 🏆 Option 1: Render.com (Recommended — Simplest Setup)

Render provides a **free web server** and a **free public URL** with zero serverless limitations.

### Step 1: Push your code to GitHub
If you haven't pushed to GitHub yet:
```bash
git init
git add .
git commit -m "Production ready Habesha Auto app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/habesha-auto.git
git push -u origin main
```

### Step 2: Get a Free Cloud PostgreSQL Database
1. Go to **[Neon.tech](https://neon.tech)** (Recommended - Free Forever Postgres) or **[Render.com](https://render.com)**.
2. Sign up with GitHub $\rightarrow$ Click **"Create Project"**.
3. Copy your `Connection String` (`postgres://...sslmode=require`).

### Step 3: Deploy Web Service on Render
1. Go to **[render.com](https://render.com)** $\rightarrow$ Click **"New +"** $\rightarrow$ **"Web Service"**.
2. Connect your GitHub repository.
3. Set the following options:
   * **Name:** `torque-app` (Your free domain will be `https://torque-app.onrender.com`)
   * **Language:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Under **"Environment Variables"**, add:
   * `NODE_ENV` = `production`
   * `DATABASE_URL` = *(Paste your Neon/Render PostgreSQL URL here)*
   * `SESSION_SECRET` = `torque-live-cloud-secret-2026`
5. Click **"Deploy Web Service"**.
6. That's it! Your app will be live at `https://torque-app.onrender.com` with full database support!

---

## ⚡ Option 2: Vercel + Neon Database

### Step 1: Get Free Database on Neon.tech
1. Create a free database at **[neon.tech](https://neon.tech)**.
2. Copy your `DATABASE_URL`.

### Step 2: Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com)** $\rightarrow$ Log in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **"Project"** $\rightarrow$ Import your `torque-app` repo.
3. Under **"Environment Variables"**, add:
   * `DATABASE_URL` = *(Your Neon database connection string)*
   * `NODE_ENV` = `production`
4. Click **"Deploy"**.
5. Your free link will be ready at: `https://your-project.vercel.app`.

---

## 🛠️ What We Updated in the Code for You:
1. **Cloud Database SSL:** Enabled automatic SSL handshake for any cloud provider ([server/db.js](file:///e:/torque-app/server/db.js)).
2. **Auto Database Setup:** The server automatically sets up all required database tables on its first boot in the cloud ([server/index.js](file:///e:/torque-app/server/index.js)).
3. **Vercel Config:** Created [vercel.json](file:///e:/torque-app/vercel.json) for 1-click serverless routing.
4. **HTTPS Cookie Security:** Configured secure proxy headers so sessions work over HTTPS.
