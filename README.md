# EIE-Technology | Explore the Secur Payment

Production-ready, zero-leak payment verification and protected digital-link delivery platform with one-time token security, direct UPI bank account QR code settlement, and PWA mobile app support.

---

## 🚀 GitHub Par Web Page Automatic Update Hone Ka Tarika

Aapke repository me har baar `git push` karte hi GitHub Pages automatically update hoga. Iske liye dono deployment tarike configure kar diye gaye hain:

### ⚡ 1. GitHub Pages Settings (Sirf Ek Baar Check Karein):
1. GitHub par apni repository open karein.
2. Upar **Settings** > Left me **Pages** par jayein.
3. **Build and deployment > Source** dropdown me:
   - **"GitHub Actions"** select karein (Best recommended).
   - *(Agar aap Branch use karna chahte hain, toh **"Deploy from a branch"** me `gh-pages` branch select karein — workflow automatically `gh-pages` branch ko bhi update karta hai).*

### 🔄 2. Cache Issue Completely Fixed:
Pehle browser aur GitHub CDN purani `index.js` file ko cache kar lete the. Ab:
- Har build me unique **Content Hash** (`index-[hash].js`) generate hota hai.
- Service Worker me **Instant Auto-Update** aur **Skip-Waiting** add kar diya gaya hai.
- HTML me **No-Cache** headers lagaye gaye hain.
Jaise hi aap GitHub par push karenge, GitHub Actions build banayega aur user ke browser me naya update bina purana cache dikhaye turant show ho jayega.

---

## 💻 Local Machine Par Run Karne Ka Tarika

Agar aap apne computer ya VPS par chalana chahte hain:

```bash
# 1. Dependencies install karein
npm install

# 2. Production build create karein
npm run build

# 3. Live production server start karein (Port 3000)
npm start

# Ya phir development mode me live server ke liye:
npm run dev
```

Browser me open karein: `http://localhost:3000`

---

## ☁️ Full-Stack Hosting (Render / Railway / Vercel)

Agar aap full backend Express server + real HMAC webhooks + database chahte hain:

### Option A: Render (Free Web Service)
1. [Render.com](https://render.com) par New Web Service banayein.
2. Apni GitHub repository connect karein.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Click **Deploy**.

### Option B: Vercel
1. [Vercel.com](https://vercel.com) par Import Git Repository karein.
2. Repository me `vercel.json` already shamil hai.
3. Click **Deploy**.
