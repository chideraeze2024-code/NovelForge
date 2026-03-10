# 📖 NovelForge AI — Complete Deployment Guide

Your AI webnovel generation platform. Follow these steps to get your site live.

---

## 🗂 Project Structure

```
novelforge/
├── src/
│   ├── pages/
│   │   ├── index.js          ← Landing page
│   │   ├── auth.js           ← Login / Register
│   │   ├── dashboard.js      ← User dashboard
│   │   ├── payment.js        ← Payment page
│   │   ├── payment/verify.js ← Payment callback
│   │   ├── editor/[id].js    ← Novel editor (main writing UI)
│   │   ├── admin/index.js    ← Admin dashboard (YOUR control panel)
│   │   └── api/              ← All backend API routes
│   ├── components/           ← Reusable UI
│   ├── lib/                  ← DB, auth, AI, pricing utilities
│   └── styles/               ← Global CSS
├── .env.example              ← Copy to .env.local
├── package.json
└── next.config.js
```

---

## ⚡ STEP 1 — Get Your API Keys

### Anthropic (AI)
1. Go to https://console.anthropic.com
2. Click "API Keys" → "Create Key"
3. Copy your key (starts with `sk-ant-`)

### MongoDB (Database — FREE)
1. Go to https://mongodb.com/cloud/atlas
2. Create free account → "Build a Cluster" → choose FREE M0
3. Create a database user (save username/password)
4. Click "Connect" → "Connect your application"
5. Copy the connection string, replace `<password>` with your DB password

### Paystack (Nigerian Payments)
1. Go to https://dashboard.paystack.com
2. Register/login → Settings → API Keys & Webhooks
3. Copy your **Live** Secret Key and Public Key
4. Add your callback URL in webhook settings: `https://yoursite.com/payment/verify`

### Flutterwave (Nigerian Payments)
1. Go to https://dashboard.flutterwave.com
2. Register/login → Settings → API Keys
3. Copy your **Live** Secret Key and Public Key

---

## ⚡ STEP 2 — Deploy to Vercel (Easiest — FREE)

### 2a. Push to GitHub
```bash
# Install git if needed, then:
git init
git add .
git commit -m "Initial NovelForge AI"
git remote add origin https://github.com/YOURUSERNAME/novelforge-ai.git
git push -u origin main
```

### 2b. Deploy on Vercel
1. Go to https://vercel.com → Sign up with GitHub
2. Click "New Project" → Import your `novelforge-ai` repo
3. Click "Deploy" (it will auto-detect Next.js)

### 2c. Add Environment Variables on Vercel
1. In your Vercel project → Settings → Environment Variables
2. Add ALL of these (copy from `.env.example`):

```
MONGODB_URI          = mongodb+srv://user:pass@cluster.mongodb.net/novelforge
JWT_SECRET           = [generate a random 64-char string at randomkeygen.com]
ANTHROPIC_API_KEY    = sk-ant-api03-xxxxx
PAYSTACK_SECRET_KEY  = sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = pk_live_xxxxx
FLUTTERWAVE_SECRET_KEY = FLWSECK_xxxxx
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = FLWPUBK_xxxxx
ADMIN_EMAIL          = your@email.com
ADMIN_PASSWORD       = YourStrongPassword123!
NEXT_PUBLIC_APP_URL  = https://your-project.vercel.app
```

3. Click "Redeploy" after adding variables

---

## ⚡ STEP 3 — Custom Domain (Optional)

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In Vercel → Settings → Domains → Add your domain
3. Follow DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` to your domain

---

## 👑 YOUR ADMIN ACCESS

After deployment, go to: `https://yoursite.com/auth`

Login with:
- **Email:** whatever you set as `ADMIN_EMAIL`
- **Password:** whatever you set as `ADMIN_PASSWORD`

You will be automatically redirected to `/admin` where you can:
- 📊 See all users
- 💰 See every payment and total revenue
- 📚 See all novels being generated
- 🏷️ Create and manage coupon codes
- 📈 See monthly revenue charts

---

## 💰 PAYMENT FLOW

When a user pays:
1. They click "Pay via Paystack/Flutterwave"
2. They're redirected to the payment page
3. After payment, they're redirected back to `/payment/verify`
4. Your server verifies the payment with Paystack/Flutterwave API
5. Their project is unlocked
6. Payment is recorded in your database — visible in admin

**You receive money directly to your Paystack/Flutterwave account**

---

## 🔧 Local Development

```bash
# Install Node.js (version 18+) from nodejs.org first

# Clone and install
cd novelforge
npm install

# Copy env file and fill in values
cp .env.example .env.local
# Edit .env.local with your keys

# Run locally
npm run dev

# Open http://localhost:3000
```

---

## 📊 Pricing Structure

| Package | Chapters | Price |
|---------|----------|-------|
| Starter | 30       | ₦10,000 |
| Writer  | 40       | ₦15,000 |
| Author  | 50       | ₦20,000 |
| Pro     | 60       | ₦25,000 |
| Master  | 70       | ₦30,000 |

To change prices, edit: `src/lib/pricing.js`

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (React)
- **Backend:** Next.js API Routes (Node.js)
- **Database:** MongoDB (via Mongoose)
- **AI:** Anthropic Claude (claude-opus-4-5 for quality)
- **Auth:** JWT tokens + bcrypt
- **Payments:** Paystack + Flutterwave
- **Hosting:** Vercel (recommended)
- **Fonts:** Playfair Display + Crimson Text + DM Sans

---

## 📧 Support

If you need help deploying, the key steps are:
1. Get your API keys (Anthropic, MongoDB, Paystack)
2. Push to GitHub
3. Import to Vercel
4. Add environment variables
5. Deploy!

Your website will be live and you'll have full admin access to monitor all users and payments.
