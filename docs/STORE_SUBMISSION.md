# App Store & Google Play submission runbook

Last updated: 9 Oct 2026. Bundle / package id: `com.pitchnest.app`.

This is the single checklist for getting PitchNest Mobile into TestFlight / Play internal testing and then into review. The **Code** section is done in this repo; everything under **Accounts & consoles** needs a person with the right logins.

---

## 1. Code: done in this repo

| Requirement | Where | Status |
|---|---|---|
| In-app account deletion (Apple 5.1.1(v), Play) | `DeleteAccountScreen` → `POST /api/auth/delete-account` | ✅ |
| Web account-deletion URL (Play Data safety form) | https://pitchnestapp.vercel.app/delete-account | ✅ |
| In-app reporting of AI content (Play AI-Generated Content policy) | "Report" under each AI message in the live room, and "Report this AI feedback" on the report → `POST /api/reports/ai-content` | ✅ code. **Backend PR + migration 0015 must be deployed first** |
| Privacy policy matches what the app actually does | `PrivacyScreen` (Azure OpenAI + Azure Speech, camera never sent, audio not stored on mobile) | ✅ |
| Permission strings are accurate (Apple 5.1.1) | `app.json` camera/microphone text | ✅ |
| No unused permissions or background modes | `expo-audio` background playback off (no iOS `UIBackgroundModes: audio`, no Android media foreground service); legacy storage permissions blocked; photo-library string removed | ✅ |
| No steering to outside payments (Apple 3.1.1/3.1.3, Play payments) | Quota message is neutral; "upgrades on the web" text removed. The app has no paid features and no purchase links | ✅ |
| No third-party login, so Sign in with Apple is **not** required (Apple 4.8) | Email/password only | ✅ |
| iPhone only (no iPad review/screenshots) | `ios.supportsTablet: false` | ✅ |
| App doesn't crash on reports | `next_steps` objects rendered as text (they crashed the report screen) | ✅ |
| Accent-aware speech | sends `speechLocale` from device timezone (e.g. Lagos → `en-NG`) | ✅ |
| Encryption export | `ITSAppUsesNonExemptEncryption: false` (HTTPS only) | ✅ |

**Android permissions after config plugins:** `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `INTERNET`. Verify any time with:

```bash
npx expo config --type introspect --json | jq '.android.permissions, .ios.infoPlist.UIBackgroundModes'
```

---

## 2. Backend: must be live before submitting

1. Merge and deploy the backend PR **"In-app reporting of AI-generated content"**, then run `migrations/0015_ai_content_reports.sql` in Supabase. Without this, the Report buttons show an error, and a reviewer testing them would reject the app.
2. Recommended: set `AZURE_SPEECH_DEFAULT_LOCALE=en-NG` on the live pitch service.
3. Make sure the live pitch service doesn't sleep. A reviewer hitting a 40-second cold start will report the app as broken. Use the Render paid tier, or wait for ECS Fargate.
4. The app talks to `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL` (default `https://pitchnest-live.onrender.com`). When Render is retired, set both in `eas.json` build env (REST: `https://www.pitchnest.app`, WS: the new live service URL) and rebuild.

---

## 3. Accounts & consoles: needs a person

### One-time setup
- [ ] **Apple Developer Program**: $99/year, enrolled as the organization (needs a D-U-N-S number) or as an individual.
- [ ] **Google Play Console**: $25 once. New *personal* accounts must run a closed test with ≥12 testers for 14 days before production; an *organization* account skips that.
- [ ] **Expo project**: run `npx eas-cli init` in this repo. It replaces the placeholder `extra.eas.projectId` (`"pitchnest-mobile"` is not a valid project id, so EAS builds fail until this is done). Commit the change.
- [ ] **App Store Connect app**: create it for `com.pitchnest.app`, then put its numeric **Apple ID** in `eas.json → submit.production.ios.ascAppId` and your **Team ID** in `appleTeamId`.
- [ ] **Play service account**: Play Console → Setup → API access. Save the JSON as `google-play-service-account.json` in the repo root (it is git-ignored; never commit it).

### Builds
```bash
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android
npx eas-cli submit --profile production --platform ios      # → TestFlight
npx eas-cli submit --profile production --platform android  # → Play internal track
```

### Store listing
- [ ] **Reviewer demo account**: a verified email/password account with a sample deck uploaded and enough free sessions left. Put it in App Review notes / Play "App access".
- [ ] **Review notes**: "PitchNest is a pitch-practice app. Start a session from Home → Setup → Start. AI investors respond by voice; tap Report under any AI message to flag it. No purchases in the app."
- [ ] **Screenshots**: iPhone 6.9" (1320×2868) and Android phone. Show Home, Setup, Live room, Report, Profile/Delete account. Plus a Play feature graphic (1024×500).
- [ ] **Privacy policy URL**: https://pitchnestapp.vercel.app/privacy. **Update the web page to match the in-app text** (it must not mention Google Gemini).
- [ ] **Support URL**: https://pitchnestapp.vercel.app/support
- [ ] **Age rating**: 13+ (or 12+ on iOS), with no objectionable content. Answer "yes" to AI-generated content where asked.

### Apple privacy "nutrition label"
| Data type | Collected | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Name, Email address | Yes | Yes | No | App functionality, account |
| User ID | Yes | Yes | No | App functionality |
| Audio data (voice during a pitch) | Yes | Yes | No | App functionality. Transcribed live; the mobile app stores no recording |
| Other user content (transcripts, decks, reports) | Yes | Yes | No | App functionality |
| Photos or videos | **No** | | | The camera preview never leaves the device |

### Google Play Data safety
- **Collected:** Personal info (name, email, user IDs); Audio (voice recordings, *processed ephemerally*); Files and docs (pitch decks); App activity / other user-generated content (transcripts, reports).
- **Shared:** No. Microsoft Azure, Supabase, AWS etc. are service providers processing on our behalf, which Play does not count as sharing.
- **Encrypted in transit:** Yes.
- **Users can request deletion:** Yes, in-app and at https://pitchnestapp.vercel.app/delete-account.

---

## 4. Before pressing "Submit for review"

Do a smoke test on a **real device** with the production build:

1. Sign up, then verify the email.
2. Upload a deck and start a live pitch.
3. Speak, and confirm the panel answers by voice.
4. Tap **Report** on an AI message and send it.
5. End the session, open the report, and tap **Report this AI feedback**.
6. Open Privacy, Terms and Support.
7. Delete the account, then relaunch the app and confirm you're logged out.
