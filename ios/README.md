# OMNI — iOS Native Swift App

A native SwiftUI iOS client for the OMNI Multimodal AI Assistant backend.

## What it includes
- **SwiftUI** app targeting iOS 16+
- **Google login** via the same Emergent Auth flow (in-app `ASWebAuthenticationSession`)
- **Image recognition** (upload from photo library / camera, ask a question)
- **Audio transcription** (record with AVAudioRecorder or import file, send to `/api/transcribe`)
- **History** of past results
- **WhatsApp share** for any result via `UIActivityViewController` (system share sheet → WhatsApp)

## Open in Xcode (on macOS)
```bash
cd ios/Omni
open Omni.xcodeproj
```
> **Note:** This environment is Linux and cannot build/run an iOS Simulator. You must open the project on a Mac with Xcode 15+ to compile and run it.

## Configuration
Edit `Omni/Config.swift` and set:
```swift
static let backendBaseURL = URL(string: "https://YOUR-DEPLOYMENT.preview.emergentagent.com")!
```
The default already points at your current deployment URL.

## Project structure
```
ios/Omni/
├── Omni.xcodeproj/project.pbxproj
└── Omni/
    ├── OmniApp.swift          # @main entry
    ├── Config.swift           # backend URL + helpers
    ├── Models.swift           # Codable models
    ├── APIClient.swift        # session cookie + endpoints
    ├── AuthManager.swift      # session storage + login flow
    ├── Info.plist             # mic + photo + camera permissions
    └── Views/
        ├── LoginView.swift
        ├── DashboardView.swift
        ├── VisionView.swift
        ├── TranscribeView.swift
        ├── HistoryView.swift
        └── ShareSheet.swift
```

## Permissions (Info.plist)
- `NSMicrophoneUsageDescription` — for audio recording
- `NSPhotoLibraryUsageDescription` — for image picker
- `NSCameraUsageDescription` — for camera capture

## How auth works on iOS
1. App opens `ASWebAuthenticationSession` to `https://auth.emergentagent.com/?redirect=omni://callback`.
2. Emergent redirects to `omni://callback#session_id=...`.
3. App parses `session_id`, POSTs to `/api/auth/google`, gets `session_token`, stores it in the Keychain.
4. All subsequent requests send `Authorization: Bearer <session_token>`.

> The `omni://` URL scheme is configured in `Info.plist` under `CFBundleURLTypes`. Make sure Emergent allows custom-scheme redirects, OR test by pasting the `session_id` returned at the web `/dashboard` URL into the iOS login screen's "Paste session ID" debug field.
