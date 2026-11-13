# Expense Tracker (React + Capacitor)

Data is stored in the WebView's localStorage under the key `expense-tracker:v1`.

## Run in the browser
    npm install
    npm run dev

## Build for Android
    npm install
    npm run build
    npx cap add android     # first time only
    npm run android         # builds, syncs, opens Android Studio

Then press Run in Android Studio (emulator or USB device).

After any code change: `npm run android` again (or `npm run sync`).

## Building an APK from the command line
    npm run sync                                            # build web app + copy into android/
    cd android
    .\gradlew.bat assembleDebug                             # APK -> android\app\build\outputs\apk\debug\app-debug.apk

Requires `ANDROID_HOME` set and a JDK; this project is configured for Gradle 9.5.0 + AGP 8.13.0
so it builds on JDK 17 through JDK 25.

## Notes
- Needs Node 18+ and Android Studio.
- For iOS: `npm i @capacitor/ios`, then `npx cap add ios` (macOS only).
