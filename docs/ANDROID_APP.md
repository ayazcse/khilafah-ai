# KHALAF Android App (APK)

KHALAF is packaged for Android with Capacitor. The Android WebView loads the
existing HTTPS production web application, so the Next.js server-rendered
routes and backend APIs continue to work without converting the whole site to
a static export.

## Current packaging model

- App ID: `org.khalaf.app`
- App name: `KHALAF`
- Web app: `https://khilafah-ai-frontend.vercel.app`
- Transport: HTTPS only; cleartext traffic is disabled.
- The APK is a native Android shell around the hosted web app. It is not an
  offline-capable native rewrite; an internet connection is required.

## Build an APK for free

1. Open the repository's **Actions** tab on GitHub.
2. Select **Build KHALAF Android APK**.
3. Choose **Run workflow** and run it from the branch containing this workflow.
4. Wait for the job to finish successfully.
5. Open the completed workflow run and download the
   **KHALAF-Android-APK** artifact.
6. Extract the ZIP and install `app-debug.apk` on an Android device. Allow
   installation from the browser/file manager if Android asks.

The workflow uses GitHub-hosted Ubuntu, Node.js, Java, Gradle and open-source
Capacitor. GitHub Actions usage limits apply; no paid service is required for
this build workflow on a public repository under GitHub's applicable free
usage rules.

## Local build (Windows PowerShell)

Install Node.js 20+, Android Studio, Android SDK Platform Tools and a JDK
supported by the installed Android Gradle Plugin. Then:

```powershell
cd frontend
npm install
npx cap add android
npx cap sync android
cd android
.`gradlew.bat` assembleDebug
```

The APK is written to
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

## Important limitations

- This wrapper depends on the deployed KHALAF website and backend being online.
- Updating the website updates what the app displays; a new APK is not needed
  for ordinary web UI changes.
- If the production domain changes, update `server.url` and
  `allowNavigation` in `frontend/capacitor.config.ts`, then rebuild.
- This workflow produces a debug APK for testing and direct installation.
  A Play Store release requires a separately signed release build and
  protected signing credentials; never commit a keystore or passwords.
- Native push notifications, background services, offline content and
  dedicated native screens are not included by this initial packaging pass.
- Validate sign-in, file upload, media permissions, back navigation and
  calling features on real Android devices before broad distribution.
