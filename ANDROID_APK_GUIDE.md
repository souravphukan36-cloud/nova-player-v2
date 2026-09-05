# 📱 NOVA Player - Android APK Generation Guide
**Developed by Sourav Phukan**

This project is pre-configured with **Capacitor Android**, **Web Audio DSP**, and **PWA Manifest** ready for instant APK packaging.

---

## ⚡ Method 1: 1-Minute Cloud APK (No Android Studio or PC Needed)
The fastest way to get an installable `.apk` file directly on your phone:

1. Open **[PWABuilder.com](https://www.pwabuilder.com)** (Official Microsoft tool for Android APK generation).
2. Enter your app's live URL:
   ```
   https://ais-pre-fbhban2e5wt3mdzpzgznj3-920461303128.asia-southeast1.run.app
   ```
3. Click **"Start"** -> **"Package for Stores"** -> **"Android"**.
4. Click **"Generate APK / Package"**.
5. Download the `.apk` file directly to your phone, tap to install, and enjoy **NOVA Player**!

---

## 🚀 Method 2: Automatic GitHub Actions Build (Cloud CI/CD)
The repository includes a ready-made `.github/workflows/build-apk.yml`:

1. In AI Studio top-right menu, click **Settings > Export to GitHub**.
2. Open your new GitHub repository and click on the **"Actions"** tab.
3. The **"Build Android APK"** action will run and compile the APK in Ubuntu cloud.
4. Click on the completed run and download **`NOVA-Player-v3.4.0-debug.apk`** from the **Artifacts** section!

---

## 💻 Method 3: Local Android Studio Build
If you have Android Studio installed on your computer:

1. In AI Studio, click **Settings > Download ZIP** and extract the folder.
2. Open terminal in the extracted folder:
   ```bash
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. Android Studio will open with the full native project.
4. In Android Studio top menu:
   - Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. The generated file will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
6. Transfer this APK to your phone via USB, WhatsApp, or Google Drive and install!
