const fs = require('fs');
const path = require('path');

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

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
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
    fs.writeFileSync(gradlePath, gradle, 'utf8');
    console.log('Added Kotlin stdlib force resolution to build.gradle.');
  }
}
