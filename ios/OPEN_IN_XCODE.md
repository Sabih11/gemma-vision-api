# Opening Omni in Xcode

Because Xcode project file formats are tightly coupled to Xcode's UUIDs and tooling, the cleanest path is to create a fresh Xcode project on your Mac and pull the existing Swift sources in. It takes about 60 seconds.

## One-time Xcode setup
1. Open Xcode → **File → New → Project…** → **App** (iOS).
2. Product Name: `Omni`. Interface: **SwiftUI**. Language: **Swift**. Storage: **None**. Uncheck tests if you don't need them.
3. Save the project somewhere on your Mac (let's call it `~/Projects/OmniApp`).
4. **Delete** the auto-generated `OmniApp.swift` and `ContentView.swift` from the project (move to trash).
5. In Finder, copy everything from `/app/ios/Omni/Omni/` (this repo) into the new project's `Omni/` folder (the one that has `Assets.xcassets`).
6. In Xcode, right-click the `Omni` group → **Add Files to "Omni"…** → select the newly-copied files (`OmniApp.swift`, `Config.swift`, `Models.swift`, `APIClient.swift`, `AuthManager.swift`, `KeychainStore.swift`, and the entire `Views/` folder). Make sure **Copy items if needed** is **off** (they're already in place) and the **Omni** target is checked.
7. In **Project → Omni → Info**:
   - Add **NSMicrophoneUsageDescription** = "Omni records audio to transcribe with Whisper."
   - Add **NSPhotoLibraryUsageDescription** = "Omni accesses your photos so you can analyze them with AI."
   - Add **NSCameraUsageDescription** = "Omni uses the camera to capture images for analysis."
   - Under **URL Types**, add a new entry → **URL Schemes**: `omni`.
8. Set **Deployment Target** ≥ iOS 16.
9. Build & Run on a simulator or device.

## Configure the backend URL
Open `Config.swift` and edit `backendBaseURL` if your backend lives at a different URL.

## Sign in
- Tap **Continue with Google** — opens Emergent Auth via `ASWebAuthenticationSession`.
- After Google sign-in, Emergent redirects to `omni://callback#session_id=...` and the app exchanges it for a `session_token` (stored in Keychain).
- If `omni://` callback doesn't return (e.g., if your tenant doesn't whitelist custom schemes), tap **Paste session_id (debug)** on the login screen, open `https://YOUR-DEPLOYMENT.../dashboard` in Safari, sign in via Google, copy the `session_id` from the URL fragment, paste it into the iOS app.

## Features wired up
- `VisionView.swift` → POST `/api/ask` (multipart, image + question)
- `TranscribeView.swift` → POST `/api/transcribe` (multipart, m4a audio)
- `HistoryView.swift` → GET `/api/history`, DELETE `/api/history/{id}`
- `ShareSheet.swift` → `UIActivityViewController` (WhatsApp + system share)
- Auth → POST `/api/auth/google`, GET `/api/auth/me`, POST `/api/auth/logout`
