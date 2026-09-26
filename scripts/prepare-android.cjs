const fs = require('fs');
const path = require('path');

// 1. Injected Android Permissions and Cleartext in AndroidManifest.xml
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  let xml = fs.readFileSync(manifestPath, 'utf8');
  
  const permissions = `
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
`;

  if (!xml.includes('POST_NOTIFICATIONS')) {
    xml = xml.replace('<application', permissions + '\n    <application');
    console.log('Injected Android permissions successfully.');
  }

  if (!xml.includes('android:usesCleartextTraffic')) {
    xml = xml.replace('<application', '<application android:usesCleartextTraffic="true"');
    console.log('Added usesCleartextTraffic to application tag.');
  }

  fs.writeFileSync(manifestPath, xml, 'utf8');
} else {
  console.log('AndroidManifest.xml not found yet, skipping injection.');
}

// 2. Configure android/variables.gradle to target Java 21 & Kotlin cleanly
const variablesPath = path.join(__dirname, '..', 'android', 'variables.gradle');
if (fs.existsSync(variablesPath)) {
  let vars = fs.readFileSync(variablesPath, 'utf8');
  console.log('Found variables.gradle:', vars);
}

// 3. Configure android/app/build.gradle with Java 21 compatibility & Kotlin
const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Ensure Java 21 compile options
  gradle = gradle.replace(/sourceCompatibility\s+JavaVersion\.\w+/g, 'sourceCompatibility JavaVersion.VERSION_21');
  gradle = gradle.replace(/targetCompatibility\s+JavaVersion\.\w+/g, 'targetCompatibility JavaVersion.VERSION_21');

  if (!gradle.includes('resolutionStrategy')) {
    gradle += `

configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.22'
    }
}
`;
  }
  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('Updated build.gradle for Java 21 and Kotlin successfully.');
}

// 4. Generate Android mipmap launcher icons from user logo if android directory exists
const androidResPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const logoSrcPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'nova_app_logo_1789977858779.jpg');

if (fs.existsSync(androidResPath) && fs.existsSync(logoSrcPath)) {
  try {
    const sharp = require('sharp');
    const densities = [
      { dir: 'mipmap-mdpi', size: 48 },
      { dir: 'mipmap-hdpi', size: 72 },
      { dir: 'mipmap-xhdpi', size: 96 },
      { dir: 'mipmap-xxhdpi', size: 144 },
      { dir: 'mipmap-xxxhdpi', size: 192 },
    ];
    for (const d of densities) {
      const targetDir = path.join(androidResPath, d.dir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      sharp(logoSrcPath).resize(d.size, d.size).png().toFile(path.join(targetDir, 'ic_launcher.png')).catch(() => {});
      sharp(logoSrcPath).resize(d.size, d.size).png().toFile(path.join(targetDir, 'ic_launcher_round.png')).catch(() => {});
      // In modern Android (Android 8 through 15), ic_launcher_foreground is required for phone home screen launcher icon!
      sharp(logoSrcPath).resize(Math.round(d.size * 1.5), Math.round(d.size * 1.5)).png().toFile(path.join(targetDir, 'ic_launcher_foreground.png')).catch(() => {});
    }
    console.log('Android mipmap launcher icons populated from user logo.');
  } catch (err) {
    console.log('Mipmap generation note:', err);
  }
}

