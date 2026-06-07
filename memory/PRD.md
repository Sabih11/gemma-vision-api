# Omni — Multimodal AI Assistant · PRD

## Original problem statement
> "Add whispr audio transcribe and build an iOS app plus existing image and text support this package has, in addition add login as well. Image recognition, audio transcribe with whisper, ability to share on whatsapp."
> Existing repo: https://github.com/Sabih11/gemma-vision-api (FastAPI + Gemma HF Router + Angular UI).

## Stack
- **Backend:** FastAPI on port 8001, all routes under `/api`. MongoDB (motor).
- **Frontend:** React 18 + Tailwind + Phosphor Icons. Brutalist/Swiss design (Outfit + IBM Plex Sans + JetBrains Mono).
- **Mobile:** Native SwiftUI iOS app (iOS 16+) under `/app/ios/Omni/`.
- **Integrations:**
  - HuggingFace OpenAI-compatible Router → `google/gemma-4-31B-it` (image+text) and `google/gemma-4-E2B-it` (audio chat).
  - OpenAI **Whisper-1** via `emergentintegrations.llm.openai.OpenAISpeechToText` (Emergent Universal LLM key).
  - **Emergent-managed Google OAuth** for login (cookie + Bearer token).

## User personas
1. Knowledge worker who needs quick image analysis on the go.
2. Mobile journalist transcribing voice notes and forwarding to WhatsApp groups.
3. Casual user playing with multimodal AI from any device.

## Core requirements
- Sign in with Google.
- Upload image → ask any question → receive Gemma's answer.
- Upload or record audio → receive Whisper transcript.
- See history of past results, scoped per user.
- One-tap share of any result to WhatsApp.
- iOS-native parity for all of the above.

## What's been implemented (Jun 7, 2026)
- Backend `/api` endpoints: `health`, `auth/google`, `auth/me`, `auth/logout`, `chat`, `ask`, `transcribe`, `history`, `history/{id}` (DELETE). 
- React frontend: brutalist login page, dashboard with Image / Audio tabs, history sidebar, WhatsApp share on every result and history item.
- iOS Swift project (`/app/ios/Omni/`): `OmniApp`, `LoginView`, `DashboardView`, `VisionView`, `TranscribeView`, `HistoryView`, `ShareSheet`, `APIClient`, `AuthManager`, `KeychainStore`.
- Auth via Emergent Google OAuth (cookie + Bearer); session token stored in iOS Keychain.
- WhatsApp share via `wa.me` link (web) and `UIActivityViewController` (iOS).
- Full backend testing: 15/15 pytest tests passed via `testing_agent_v3` (iteration_1).

## Prioritized backlog
**P0 (next)**
- Run iOS project on a real Mac/simulator and verify Emergent custom-scheme callback.
**P1**
- Streaming responses for chat (token-by-token rendering on web).
- Per-user rate limits on `/transcribe`, `/ask`, `/chat`.
- Session de-duplication (currently each login inserts a new session row).
**P2**
- File-based audio splitting for >25MB recordings.
- Push notifications on iOS when long transcriptions finish (if background mode added).
- Optional Mistral re-ranking / summarisation of Whisper output.

## Files
```
/app/backend/server.py                 — FastAPI app
/app/backend/.env                      — config (MONGO_URL, HF_TOKEN, EMERGENT_LLM_KEY, etc.)
/app/frontend/src/                      — React app (App.js, pages/, components/, lib/)
/app/ios/Omni/Omni/                    — Swift sources
/app/ios/OPEN_IN_XCODE.md              — instructions to open in Xcode
/app/auth_testing.md                   — auth seeding playbook
/app/design_guidelines.json            — design system source-of-truth
/app/memory/test_credentials.md        — seeded test session generation
/app/test_reports/iteration_1.json     — backend test results (all green)
```
