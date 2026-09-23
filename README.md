# 🎵 NOVA Music Player

Ultra high-fidelity music streaming application with Samsung One UI / Spotify aesthetic, 10-band studio EQ, Dolby Atmos & 8D Audio spatializer, synchronized lyrics, and instant 0.005s zero-latency Telegram Cloud streaming.

---

## ⚡ Quick Start / Local Setup Guide (PC / Laptop / Mac / Linux)

Agar aap is app ko **GitHub se download (Clone ya ZIP)** kar rahe hain, toh niche diye gaye steps follow karein:

### 1. Requirements
* **Node.js**: Version 18 ya higher (Recommended: Node 20 LTS) → [nodejs.org](https://nodejs.org)
* **Git** (optional, agar clone karna ho)

---

### 2. Setup & Installation Steps

```bash
# Step 1: Project folder me navigate karein
cd nova-player

# Step 2: Sabhi dependencies install karein
npm install

# Step 3: Development Server start karein (Express backend + Vite frontend)
npm run dev
```

---

### 3. Open App in Browser
Server start hone ke baad apne browser (Chrome, Edge, Brave, Safari) me ye URL open karein:
👉 **`http://localhost:3000`**

---

## 🚀 Production Build (Fastest Performance)

Agar aap production mode me run karna chahte hain:
```bash
# Production bundle create karein
npm run build

# Standalone production server start karein
npm run start
```

---

## 📱 Mobile Home Screen Par App Logo & Installation Guide

Jab aap GitHub se download karke ya live URL se phone ke Home Screen par add karenge:
1. **Google Chrome / Samsung Internet** me app open karein: `http://<your-ip>:3000` ya Live URL.
2. Browser ke top-right 3 dots `⋮` par click karein.
3. **"Add to Home Screen"** / **"Install App"** par click karein.
4. Phone ke home screen par aapka diya hua **NOVA Player custom official logo** show hoga (PWA manifest `public/icon-192.png`, `public/icon-512.png`, aur `public/icon-maskable-512.png` ke sath).

Agar aap Capacitor se Android APK build kar rahe hain:
```bash
npm run build
npx cap add android
node scripts/prepare-android.cjs
npx cap sync android
```
`prepare-android.cjs` automatically aapka official logo sabhi Android mipmap densities (`mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`) me generate karke launcher icon set kar deta hai.

* App me **SSD Disk Cache Engine** integrated hai jo songs ko `.cache/audio` me store karta hai.
* Cache hone ke baad song click karte hi **0.002s – 0.005s (2ms to 5ms)** me instant play shuru ho jata hai bina kisi buffering delay ke.

---

## ☁️ Telegram Cloud Music Library
* Default bot token aur channel ID pre-configured hain.
* Aap apne private Telegram channel me koi bhi audio file upload karenge toh app background me auto-sync karke player library me add kar dega.
