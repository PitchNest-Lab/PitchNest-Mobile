# PitchNest Mobile

The focused Android client for PitchNest. It is an independent Git repository and Capacitor 8 application, but it deliberately uses the existing PitchNest Express API, WebSocket service, user accounts, entitlements, and Supabase-backed data. The mobile client never connects to the database directly.

## Product scope

Included in Android:

- founder sign-up, verification, password reset, and native Google sign-in
- pitch setup, deck upload, camera/microphone live room, and AI panel
- reports, replay, re-pitch, pitch archive, and Android share sheet
- profile, account, appearance, notification, and voice preferences
- privacy, terms, refunds and cancellations, support, and account deletion

Website-only:

- plan purchase/change and Flutterwave checkout
- organizations, workspaces, staff/admin tools, and analytics
- community, founder discovery, opportunities, business profiles, and marketing pages

Paid entitlements purchased on the website remain available in Android because the API is authoritative. Android is a consumption-only client: it contains no purchase button or external checkout link.

## Local setup

Prerequisites are Node 24, Android Studio 2025.2.1 or newer, its bundled JDK, and Android SDK Platform 36.

```powershell
Copy-Item .env.example .env
npm ci
npm run verify
npm run android:sync
npm run android:open
```

The checked-in `.env` is intentionally ignored. `VITE_API_URL` and `VITE_WS_BACKEND_URL` point to the existing backend; `VITE_GOOGLE_CLIENT_ID` must be the same web OAuth client ID configured as `GOOGLE_CLIENT_ID` on that backend.

Useful commands:

- `npm run dev` — web preview on port 5174
- `npm run verify` — TypeScript check plus production web build
- `npm run android:sync` — build and copy web/native plugin changes into Android
- `npm run android:open` — open the native project in Android Studio
- `npm run android:run` — sync and run on a connected device/emulator
- `npm run android:doctor` — check the local Capacitor toolchain

See [docs/android-release.md](docs/android-release.md) before signing or publishing a release.
