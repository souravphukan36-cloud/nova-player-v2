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
