# NOVA Music Player

Ultra high-fidelity music streaming player with Samsung One UI / Spotify aesthetic, 10-band studio EQ, Dolby Atmos & 8D Audio spatializer, synchronized lyrics, and Telegram Bot Cloud Library streaming.

---

## 🚀 Local Run (GitHub / PC / Laptop)

Apne PC/Laptop par run karne ke liye:

### 1. Requirements
- **Node.js**: v18+ ya v20+ ([Download Node.js](https://nodejs.org))
- **npm** (Node.js ke sath install hota hai)

### 2. Steps to Run

```bash
# 1. Repository clone ya zip extract karein
git clone <your-repo-url>
cd nova-player

# 2. Dependencies install karein
npm install

# 3. Development Server start karein (Express backend + Vite frontend)
npm run dev
```

Ab browser me open karein:
👉 **`http://localhost:3000`**

---

## ⚡ Telegram Cloud Streaming
- App me aapke Telegram Bot Token aur Channel ID default configuration me set hain.
- Aap jo bhi gana channel me upload karenge, background sync har 10 seconds me use fetch karke player me stream karega.
- Songs 320 kbps high-speed disk cache aur direct hardware audio routing ke sath play hote hain.
