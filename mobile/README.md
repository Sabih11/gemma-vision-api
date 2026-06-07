# Omni Mobile — Expo (iOS + Android, no Mac required)

A native mobile build of Omni that you install on your iPhone or Android **without Xcode, without a Mac, and without paying $99/yr**.

## What you need (one-time setup, ~10 min)

1. **Node.js 20+** on your computer (Windows / Linux / Mac — anything).
   - https://nodejs.org → download LTS → install.
2. **Yarn** package manager (we already use it elsewhere):
   ```bash
   npm install -g yarn
   ```
3. **Expo Go** app on your phone:
   - iPhone: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

## Run it on your phone (3 minutes)

```bash
# 1. From this repo on your computer
cd mobile

# 2. Install JS dependencies (first time only)
yarn install

# 3. Start the Expo dev server
yarn start
```

A QR code will appear in the terminal.

- **iPhone**: open the **Camera** app, point it at the QR code, tap the yellow Expo Go banner.
- **Android**: open the **Expo Go** app, tap "Scan QR Code", scan it.

The Omni app will load on your phone in 10–20 seconds. Sign in with Google, and it just works.

> Both your phone and the computer running `yarn start` must be on the **same Wi-Fi network**.

## Configure the backend URL

Open `mobile/app.json` and find:

```json
"extra": {
  "backendUrl": "https://whispr-transcribe.preview.emergentagent.com"
}
```

Change that to your **deployed** backend URL once you click Deploy on Emergent. No rebuild needed — just save the file and the app hot-reloads on your phone.

## How sign-in works on mobile

1. Tap **Continue with Google** in the app
2. An in-app Safari/Chrome view opens to `auth.emergentagent.com` with redirect = `omni://auth-callback`
3. After Google sign-in, the browser closes and Omni captures the `session_id`
4. App POSTs it to `/api/auth/google`, gets back a `session_token`, saves it in **secure keychain storage** on your device, and shows the dashboard
5. The token is reused across app launches for 7 days

## Features available in this build

| Feature | Web | iOS (this build) | Notes |
|---|---|---|---|
| Google sign-in (Emergent Auth) | ✓ | ✓ | Custom-scheme deep link `omni://` |
| Image analysis (Gemma Vision) | ✓ | ✓ | Library picker + camera capture |
| Audio transcription (Whisper) | ✓ | ✓ | In-app recording via `expo-av` |
| History (per user) | ✓ | ✓ | Pull-to-refresh, swipe delete |
| Share to WhatsApp | ✓ | ✓ | Native iOS share sheet (`Share` API) |
| Terms acceptance | ✓ | Auto-accepted on web before mobile use | Visit `/terms` in browser |

## Building a real `.ipa` / `.apk` (when you want to graduate from Expo Go)

This is **optional**. Expo Go is great for development and personal use.

Later, if you want a real installable package that doesn't need Expo Go:

```bash
npm install -g eas-cli
eas login
eas build --platform android   # produces .apk — install on any Android phone directly
eas build --platform ios       # produces .ipa — needs $99/yr Apple Developer to install/distribute
```

EAS Build runs on Expo's cloud servers — works from **any OS** including Windows/Linux. iOS builds still cost the Apple Developer subscription to actually install on a device or publish to the App Store, but **no Mac is ever needed**.

For Android, the `.apk` from `eas build` can be sideloaded onto any Android phone for free — just download and tap to install (enable "Install from unknown sources").

## Troubleshooting

| Issue | Fix |
|---|---|
| "Network response timed out" when scanning QR | Your phone and computer must be on the same Wi-Fi |
| Audio recording errors on iOS | Make sure you tapped "Allow" when iOS asked for microphone permission |
| Sign-in browser opens but never returns to the app | Confirm the `scheme: "omni"` line is present in `app.json` (it is by default) |
| Camera/library access denied | Open iOS Settings → Omni (or "Expo Go" if using Expo Go) → enable Camera and Photos |
| Backend errors after Emergent deploy | Update `extra.backendUrl` in `app.json` to your deployed URL |

## Files

```
mobile/
├── App.js                          # entry — sets up Auth + bottom-tab nav
├── app.json                        # Expo config: scheme, permissions, backend URL
├── package.json                    # deps: expo, expo-av, expo-image-picker, react-navigation
├── babel.config.js
├── assets/icon.png + splash.png    # auto-generated placeholder
└── src/
    ├── lib/
    │   ├── api.js                  # axios client + token storage (expo-secure-store)
    │   ├── auth.js                 # AuthProvider context
    │   └── theme.js                # dark theme tokens
    └── screens/
        ├── LoginScreen.js          # Emergent Google OAuth via expo-web-browser
        ├── VisionScreen.js         # image picker / camera + /api/ask
        ├── TranscribeScreen.js     # expo-av recording + /api/transcribe
        └── HistoryScreen.js        # FlatList + pull-to-refresh + delete + share
```

That's it. From `yarn start` to running on your iPhone is about 3 minutes.
