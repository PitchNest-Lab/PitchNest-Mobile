# Android release checklist

## Permanent identity

- Application ID: `app.pitchnest`
- Display name: `PitchNest`
- Minimum Android version: API 24
- Compile/target SDK: API 36

Do not change the application ID after the first Play release. Increase `versionCode` for every uploaded bundle and update `versionName` for user-visible releases.

## Google sign-in

1. Keep one web OAuth client for ID-token audience validation. Put its client ID in the mobile `.env` as `VITE_GOOGLE_CLIENT_ID` and in the existing backend as `GOOGLE_CLIENT_ID`.
2. Create an Android OAuth client for package `app.pitchnest`.
3. Register the SHA-1 certificate fingerprints for local debug, the upload key, and Google Play App Signing. The native plugin still receives the web client ID; the Android OAuth client establishes that the signed package is trusted.
4. Test a fresh account, a returning account, cancellation, logout, and token restoration on a physical device.

## Backend addresses and origin

The app calls the API on AWS and the live-pitch server on Render directly; it has no `/api` rewrite like the website. Without `.env` overrides it uses PROD:

| | DEV | PROD (default) |
| --- | --- | --- |
| `VITE_API_URL` | `https://l5isutzx18.execute-api.eu-west-2.amazonaws.com` | `https://mkrkiditq5.execute-api.eu-west-2.amazonaws.com` |
| `VITE_WS_BACKEND_URL` | `wss://pitchnest-backend-dev.onrender.com/ws` | `wss://pitchnest-live.onrender.com/ws` |

The Android WebView sends requests from the origin `https://localhost` (iOS would send `capacitor://localhost`). Both the Lambda API and the Render service of the target environment must accept it. On 2026-10-28 DEV accepted it and PROD refused it, so a PROD build cannot sign in yet.

Do not add `https://localhost` to PROD's `CORS_EXTRA_ORIGINS`: in production the backend refuses to start when any configured origin is localhost (`publicOriginProblem` in the backend's `src/config/env.ts`). PROD needs a backend change that accepts the app origins separately. `capacitor://localhost` also needs that change, because the backend compares `new URL(origin).origin`, which is `"null"` for a `capacitor:` origin.

## Verified app links

Publish `https://pitchnest.app/.well-known/assetlinks.json` and the same file for `www.pitchnest.app`. Replace the fingerprint with the Play App Signing SHA-256 value:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.pitchnest",
      "sha256_cert_fingerprints": ["REPLACE_WITH_PLAY_APP_SIGNING_SHA256"]
    }
  }
]
```

Only password reset, email verification, and public pitch-share URLs are routed into the app. Other website URLs stay in the browser.

## Release bundle

1. Point `.env` at PROD: remove `VITE_API_URL` and `VITE_WS_BACKEND_URL` (`.env.example` sets them to DEV) and set the PROD `VITE_GOOGLE_CLIENT_ID`. Then run `npm ci`, `npm run verify`, and `npm run android:sync`.
2. In Android Studio, select the release variant and generate a signed Android App Bundle (`.aab`). Keep the upload keystore outside this repository and in backed-up secret storage.
3. Confirm R8 minification/resource shrinking succeeds, inspect the release bundle, and test the Play internal-testing build on a low-end physical Android device.
4. Exercise microphone/camera permission denial and recovery, background/resume during a live pitch, interrupted connectivity, Android back behavior, password/verification links, sharing, and account deletion.
5. Complete Play Console privacy policy, Data safety, content rating, app access, account-deletion URL, advertising declaration, and microphone/camera disclosures.

## Payment boundary

This release does not sell or steer users to buy digital plans from Android. Checkout and plan changes remain on the website. If in-app purchasing is added later, implement Google Play Billing and server-side purchase verification before exposing it.

## App-link and signing checks

```powershell
# Debug certificate (after the first debug build)
keytool -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -keypass android

# Verify the installed app's links on a connected device
adb shell pm get-app-links app.pitchnest
```
