# 📱 GitHub Se NOVA Player APK Download & Install Karne Ka Step-by-Step Guide
**Developer: Sourav Phukan**

Aapka project ab **GitHub Actions Automated APK Pipeline** ke sath 100% configured hai! Jaise hi aap code GitHub par daalte hain, GitHub automatically cloud mein Android SDK chalakar aapke liye ready-to-install `.apk` bana deta hai.

---

## 🚀 Step 1: Project Ko GitHub Par Export Kijiye

1. Google AI Studio ki screen par sabse upar right-hand side mein **Settings ⚙️** (ya menu icon) par click kijiye.
2. Wahan **"Export to GitHub"** par click kijiye.
3. Apne GitHub account se connect karke **"Create Repository"** / Export kar dijiye.

---

## ⚡ Step 2: GitHub Par APK Kaise Banegi? (Automated)

1. Apne phone ya computer mein apni nayi GitHub Repository open kijiye.
2. Repository ke upar wale navigation bar mein **"Actions"** tab par click kijiye.
3. Wahan aapko **"Build Android APK"** workflow automatically start hota hua dikhega (ya right side mein "Run workflow" button dabakar manual bhi start kar sakte hain).
4. GitHub ka cloud server 2 se 3 minute mein:
   - Node.js & Java 21 install karega.
   - Vite production bundle banayega.
   - Capacitor Android engine wrap karega.
   - Gradle se **`NOVA-Player-APK`** generate kar dega!

---

## 📥 Step 3: APK Phone Mein Download Aur Install Kaise Karein?

1. Jab workflow par **Green Checkmark (✔)** aa jaye, toh us run par click kijiye.
2. Page ko thoda scroll karke neeche **"Artifacts"** section mein jaiye.
3. Wahan **`NOVA-Player-APK`** likha hoga — uspar tap karke zip file download kijiye.
4. Download hone ke baad use extract (unzip) kijiye, aapko mil jayegi **`app-debug.apk`**!
5. Us par tap kijiye:
   - Agar phone pooche *"Install unknown apps"*, toh Chrome/Files ko allow kar dijiye.
   - **"Install"** dabaiye.
6. **NOVA Player** aapke phone mein Spotify ki tarah install ho jayega!

---

## 🎵 Phone Par Sabkuch Proper Work Karega:
- **Cloud Telegram Music Stream:** App mein cloud backend bridge add kar diya gaya hai, isliye phone par bhi saare Telegram songs (Anuv Jain, The Local Train, etc.) bina kisi rukawat ke direct play honge.
- **AMOLED Dark Theme & Equalizer:** 10-band studio EQ aur dynamic waveform chalegi.
- **Lock Screen & Background Playback:** Gana chalte waqt notification bar aur lock screen controls active rahenge.
