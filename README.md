# NFProjects

NextGen Fusion Projects (NFProjects) — Expo + React Native app template used in this repository.

## Contents
- App source: `src/`
- Project config: `app.json`, `eas.json`, `package.json`
- Claude agent notes: `CLAUDE.md`

## Prerequisites
- Node.js (LTS) and npm or Yarn
- Java JDK 11+ (for Android local builds)
- Android SDK / Android Studio (for local Gradle builds)
- Expo CLI: `npm install -g expo-cli` (optional for classic Expo flows)
- EAS CLI (recommended for cloud builds): `npm install -g eas-cli`

## Quick start (development)
1. Install dependencies:

```bash
cd "/Users/ritesh5001/PlayGround/Projects/NextGen Fusion Projects /NFProjects"
npm install
```

2. Start Metro / Expo dev server:

```bash
npx expo start
```

3. Open the app on a device or emulator using Expo Go or a simulator.

## Build an Android APK

Recommended: use EAS (Expo Application Services) cloud builds.

### Cloud build (EAS)
1. Install and login to EAS:

```bash
npm install -g eas-cli
eas login
```

2. Trigger a production build (runs in the cloud):

```bash
cd "/Users/ritesh5001/PlayGround/Projects/NextGen Fusion Projects /NFProjects"
eas build -p android --profile production
```

Follow the EAS prompts to let Expo handle credentials or provide your own. When the build finishes, follow the provided URL to download the APK or AAB.

### Local EAS build
You can run builds locally (requires Docker):

```bash
eas build --platform android --local --profile production
```

### Bare / Ejected Android (Gradle)
If the project is ejected to a native Android project, build with Gradle:

```bash
cd android
./gradlew assembleRelease
# Output APK: android/app/build/outputs/apk/release/app-release.apk
```

## App signing & credentials
- EAS can manage uploading and storing keystores for you during the cloud build.
- For Play Store distribution, prefer producing an AAB and signing it with your keystore.

## Claude automation note
See `CLAUDE.md` for agent-related configuration. This repo includes a non-interactive Claude configuration in the `.claude` files enabling `nonInteractive` and `autoApprove` settings — edit those if you prefer interactive prompts.

## Troubleshooting
- If `eas build` fails, confirm `eas-cli` is up-to-date and you're logged in.
- For Android SDK issues, ensure `ANDROID_HOME` is set and `sdkmanager` components are installed.

## License
This repository follows the LICENSE file in the project root.
