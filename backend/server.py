"""Omni Multimodal AI Assistant - FastAPI backend.

Endpoints (all under /api):
  GET    /api/health
  POST   /api/auth/google          - exchange session_id -> session_token cookie
  GET    /api/auth/me              - current user
  POST   /api/auth/logout          - clear session
  POST   /api/chat                 - JSON multimodal chat (image+text via HF Gemma)
  POST   /api/ask                  - multipart image + question (HF Gemma vision)
  POST   /api/transcribe           - upload audio file -> Whisper transcript
  GET    /api/history              - list user's history items
  DELETE /api/history/{id}         - delete a history item

Auth: session_token cookie OR Authorization: Bearer header.
"""
from __future__ import annotations

import base64
import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI as HFOpenAI
from PIL import Image
from pydantic import BaseModel, Field

from emergentintegrations.llm.openai import OpenAISpeechToText

load_dotenv()

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
HF_TOKEN = os.environ.get("HF_TOKEN", "").strip()
HF_ROUTER_BASE_URL = os.environ.get("HF_ROUTER_BASE_URL", "https://router.huggingface.co/v1")
MODEL_ID = os.environ.get("MODEL_ID", "google/gemma-4-31B-it")
AUDIO_MODEL_ID = os.environ.get("AUDIO_MODEL_ID", "google/gemma-4-E2B-it")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
EMERGENT_AUTH_BASE = os.environ.get(
    "EMERGENT_AUTH_BASE", "https://demobackend.emergentagent.com"
)
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# ---------- App ----------
app = FastAPI(title="Omni Multimodal AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]
users_col = db["users"]
sessions_col = db["user_sessions"]
history_col = db["history"]
acceptances_col = db["terms_acceptances"]

TERMS_VERSION = "1.0"
TERMS_EFFECTIVE_DATE = "2026-06-07"
TERMS_TEXT = """\
# Omni — Terms of Service

**Version 1.0 · Effective June 7, 2026**

These Terms of Service ("Terms") govern your use of Omni ("the Service"), a multimodal AI workspace that performs image recognition, audio transcription, and result sharing. By signing in to or using the Service, you agree to be bound by these Terms.

## 1. The Service
Omni lets authenticated users upload images for AI analysis (via the Gemma vision model), upload or record audio for transcription (via OpenAI Whisper), view a personal history of their results, and share results to WhatsApp via standard `wa.me` links.

## 2. Eligibility & Accounts
You must be at least 13 years old to use the Service. You are responsible for everything that happens under your account and for keeping your authentication credentials safe.

## 3. Acceptable Use
You agree NOT to use the Service to:
- upload, transcribe, or analyse content that is illegal, defamatory, hateful, sexually explicit involving minors, or that infringes anyone's rights;
- upload content containing sensitive personal data (medical records, government IDs, payment data) of yourself or any third party;
- attempt to reverse-engineer, scrape, overload, or attack the Service or its underlying AI providers;
- impersonate any person or misrepresent your affiliation.

## 4. Third-Party Processing
By submitting content, you understand that:
- **Images** are sent to HuggingFace's inference router and processed by Google's Gemma vision model.
- **Audio** is sent to OpenAI's Whisper API for transcription.
- These providers process your content under their own terms of service.

We do not control what those providers do with submitted content beyond their public policies.

## 5. Your Content
You retain ownership of content you upload. You grant Omni a limited, non-exclusive license to transmit that content to the AI providers strictly to deliver the Service to you, and to store the resulting outputs in your private history.

You may delete any history item from your account at any time.

## 6. Sharing
Sharing to WhatsApp opens a standard `wa.me/?text=` link; the resulting message and its delivery are entirely outside Omni's control.

## 7. Privacy
We store: your Google identity (id, email, name, profile picture), session tokens, and your prompts + AI responses (your "history"). We do NOT sell personal data. Sessions expire after 7 days.

## 8. No Warranty
The Service is provided "AS IS" without warranties of any kind. AI outputs may be inaccurate, biased, or incomplete; you must verify critical information independently.

## 9. Limitation of Liability
To the maximum extent permitted by law, Omni shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.

## 10. Termination
You may stop using the Service at any time by clicking Logout. We may suspend or terminate accounts that violate these Terms, with or without notice.

## 11. Changes
We may update these Terms. If we make material changes, you will be asked to re-accept the latest version on your next sign-in.

## 12. Contact
Questions about these Terms can be sent to the email address you find on your deployment page.

---

*By clicking "I agree" you confirm that you have read and accepted these Terms.*
"""


# ---------- Helpers ----------
def utcnow() -> datetime:
    return datetime.now(timezone.utc)


AUDIO_EXT = {
    "wav": "wav",
    "mp3": "mp3",
    "mpeg": "mp3",
    "ogg": "ogg",
    "webm": "webm",
    "flac": "flac",
    "m4a": "m4a",
    "mp4": "mp4",
    "mpga": "mp3",
}


def _hf_client() -> HFOpenAI:
    if not HF_TOKEN:
        raise HTTPException(503, "HF_TOKEN not configured")
    return HFOpenAI(base_url=HF_ROUTER_BASE_URL, api_key=HF_TOKEN)


def _strip_b64(data: str) -> str:
    return data.split("base64,", 1)[1] if "base64," in data else data


def _guess_audio_ext(filename: Optional[str], content_type: Optional[str]) -> str:
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in AUDIO_EXT:
            return AUDIO_EXT[ext]
    if content_type and "/" in content_type:
        sub = content_type.split("/", 1)[1].split(";")[0].strip().lower()
        if sub in AUDIO_EXT:
            return AUDIO_EXT[sub]
    return "wav"


# ---------- Auth ----------
async def _resolve_token(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> str:
    token: Optional[str] = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(401, "Not authenticated")
    return token


async def _current_user(token: str = Depends(_resolve_token)) -> dict:
    sess = await sessions_col.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(401, "Invalid session")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < utcnow():
        raise HTTPException(401, "Session expired")
    user = await users_col.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


class GoogleAuthRequest(BaseModel):
    session_id: str


@api.post("/auth/google")
async def auth_google(payload: GoogleAuthRequest, response: Response):
    """Exchange Emergent session_id (from URL fragment) for our session cookie."""
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            r = await client.get(
                f"{EMERGENT_AUTH_BASE}/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": payload.session_id},
            )
        except httpx.HTTPError as exc:
            raise HTTPException(502, f"Auth provider unreachable: {exc}") from exc
    if r.status_code != 200:
        raise HTTPException(401, "Invalid session_id")
    data = r.json()
    email = data.get("email")
    if not email:
        raise HTTPException(400, "Auth response missing email")

    existing = await users_col.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await users_col.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name"), "picture": data.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await users_col.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": data.get("name"),
                "picture": data.get("picture"),
                "created_at": utcnow(),
            }
        )

    session_token = data.get("session_token") or uuid.uuid4().hex
    expires_at = utcnow() + timedelta(days=7)
    await sessions_col.insert_one(
        {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": expires_at,
            "created_at": utcnow(),
        }
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    user_doc = await users_col.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}


@api.get("/auth/me")
async def auth_me(user: dict = Depends(_current_user)):
    return user


@api.post("/auth/logout")
async def auth_logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if token:
        await sessions_col.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------- Chat / Vision (HF Gemma) ----------
class ContentPart(BaseModel):
    type: str
    text: Optional[str] = None
    url: Optional[str] = None
    image_base64: Optional[str] = Field(default=None, alias="image_base64")
    audio_base64: Optional[str] = Field(default=None, alias="audio_base64")
    audio_format: Optional[str] = Field(default=None, alias="audio_format")
    audio_url: Optional[str] = None

    model_config = {"populate_by_name": True}


class Message(BaseModel):
    role: str = "user"
    content: list[ContentPart]


class ChatRequest(BaseModel):
    messages: list[Message]
    model: Optional[str] = None


def _image_url_part(url: str) -> dict[str, Any]:
    return {"type": "image_url", "image_url": {"url": url}}


def _image_b64_part(b64: str) -> dict[str, Any]:
    url = b64 if b64.startswith("data:") else f"data:image/jpeg;base64,{_strip_b64(b64)}"
    return {"type": "image_url", "image_url": {"url": url}}


def _audio_b64_part(b64: str, fmt: str) -> dict[str, Any]:
    return {
        "type": "input_audio",
        "input_audio": {"data": _strip_b64(b64), "format": fmt},
    }


def _parts_to_openai(parts: list[ContentPart]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for p in parts:
        if p.type == "text":
            if not p.text:
                raise HTTPException(400, "text part requires 'text'")
            out.append({"type": "text", "text": p.text})
        elif p.type == "image":
            if p.url:
                out.append(_image_url_part(p.url))
            elif p.image_base64:
                out.append(_image_b64_part(p.image_base64))
            else:
                raise HTTPException(400, "image part requires url or image_base64")
        elif p.type == "audio":
            fmt = (p.audio_format or "wav").lower()
            if p.audio_url:
                out.append({"type": "input_audio", "input_audio": {"url": p.audio_url}})
            elif p.audio_base64:
                out.append(_audio_b64_part(p.audio_base64, fmt))
            else:
                raise HTTPException(400, "audio part requires audio_url or audio_base64")
        else:
            raise HTTPException(400, f"unsupported content type: {p.type}")
    return out


def _call_hf(messages: list[dict[str, Any]], model: str) -> str:
    client = _hf_client()
    try:
        resp = client.chat.completions.create(model=model, messages=messages)
        return resp.choices[0].message.content or ""
    except Exception as exc:
        raise HTTPException(502, f"HF router error: {exc}") from exc


def _has_audio(content: list[dict[str, Any]]) -> bool:
    return any(c.get("type") == "input_audio" for c in content)


async def _save_history(
    user_id: str,
    kind: str,
    prompt: str,
    response_text: str,
    extra: Optional[dict] = None,
) -> dict:
    item = {
        "id": uuid.uuid4().hex,
        "user_id": user_id,
        "kind": kind,
        "prompt": prompt,
        "response": response_text,
        "extra": extra or {},
        "created_at": utcnow().isoformat(),
    }
    await history_col.insert_one(dict(item))
    return item


@api.post("/chat")
async def chat(req: ChatRequest, user: dict = Depends(_current_user)):
    openai_messages = [
        {"role": m.role, "content": _parts_to_openai(m.content)} for m in req.messages
    ]
    model = req.model or MODEL_ID
    # Auto-switch to audio-capable model if audio parts present and default is used
    if _has_audio(openai_messages[-1]["content"]) and not req.model:
        model = AUDIO_MODEL_ID
    result = _call_hf(openai_messages, model)
    last_text = ""
    for p in reversed(req.messages[-1].content):
        if p.type == "text" and p.text:
            last_text = p.text
            break
    await _save_history(user["user_id"], "chat", last_text or "(multimodal input)", result, {"model": model})
    return {"result": result, "model": model}


@api.post("/ask")
async def ask(
    question: str = Form(...),
    image: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
    audio: Optional[UploadFile] = File(default=None),
    audio_url: Optional[str] = Form(default=None),
    model: Optional[str] = Form(default=None),
    user: dict = Depends(_current_user),
):
    if not image and not image_url and not audio and not audio_url:
        raise HTTPException(400, "Provide at least one of: image, image_url, audio, audio_url")

    content: list[dict[str, Any]] = []
    if image:
        raw = await image.read()
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as exc:
            raise HTTPException(400, f"Invalid image: {exc}") from exc
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        content.append(_image_b64_part(b64))
    elif image_url:
        content.append(_image_url_part(image_url))

    if audio:
        raw = await audio.read()
        fmt = _guess_audio_ext(audio.filename, audio.content_type)
        b64 = base64.b64encode(raw).decode("ascii")
        content.append(_audio_b64_part(b64, fmt))
    elif audio_url:
        content.append({"type": "input_audio", "input_audio": {"url": audio_url}})

    content.append({"type": "text", "text": question})
    messages = [{"role": "user", "content": content}]
    resolved_model = model or (AUDIO_MODEL_ID if _has_audio(content) else MODEL_ID)
    result = _call_hf(messages, resolved_model)

    kind = "image" if (image or image_url) else "audio"
    await _save_history(user["user_id"], kind, question, result, {"model": resolved_model})
    return {"result": result, "model": resolved_model}


# ---------- Whisper transcription ----------
@api.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
    prompt: Optional[str] = Form(default=None),
    user: dict = Depends(_current_user),
):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "EMERGENT_LLM_KEY not configured")
    raw = await audio.read()
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(413, "Audio file exceeds 25MB limit")
    fmt = _guess_audio_ext(audio.filename, audio.content_type)
    filename = audio.filename or f"audio.{fmt}"
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    try:
        file_tuple = (filename, raw, audio.content_type or "audio/mpeg")
        kwargs = {"file": file_tuple, "model": "whisper-1", "response_format": "json"}
        if language:
            kwargs["language"] = language
        if prompt:
            kwargs["prompt"] = prompt
        response = await stt.transcribe(**kwargs)
    except Exception as exc:
        raise HTTPException(502, f"Whisper error: {exc}") from exc

    text = getattr(response, "text", None) or (response.get("text") if isinstance(response, dict) else None) or str(response)
    item = await _save_history(
        user["user_id"],
        "transcribe",
        audio.filename or "audio",
        text,
        {"language": language},
    )
    return {"text": text, "id": item["id"]}


# ---------- History ----------
@api.get("/history")
async def list_history(user: dict = Depends(_current_user), limit: int = 50):
    cursor = (
        history_col.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("created_at", -1)
        .limit(min(max(limit, 1), 200))
    )
    return await cursor.to_list(length=200)


@api.delete("/history/{item_id}")
async def delete_history(item_id: str, user: dict = Depends(_current_user)):
    res = await history_col.delete_one({"id": item_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


# ---------- Health ----------
@api.get("/health")
async def health():
    return {
        "ok": True,
        "hf_token_configured": bool(HF_TOKEN),
        "emergent_llm_configured": bool(EMERGENT_LLM_KEY),
        "model_id": MODEL_ID,
        "audio_model_id": AUDIO_MODEL_ID,
        "terms_version": TERMS_VERSION,
    }


# ---------- Legal / Terms ----------
@api.get("/legal/terms")
async def get_terms():
    return {
        "version": TERMS_VERSION,
        "effective_date": TERMS_EFFECTIVE_DATE,
        "content": TERMS_TEXT,
    }


@api.get("/legal/status")
async def terms_status(user: dict = Depends(_current_user)):
    rec = await acceptances_col.find_one(
        {"user_id": user["user_id"], "version": TERMS_VERSION},
        {"_id": 0},
    )
    return {
        "current_version": TERMS_VERSION,
        "accepted": bool(rec),
        "accepted_at": rec.get("accepted_at") if rec else None,
    }


class AcceptTermsRequest(BaseModel):
    version: str


@api.post("/legal/accept")
async def accept_terms(payload: AcceptTermsRequest, user: dict = Depends(_current_user)):
    if payload.version != TERMS_VERSION:
        raise HTTPException(400, f"Version mismatch. Current version is {TERMS_VERSION}.")
    accepted_at = utcnow().isoformat()
    await acceptances_col.update_one(
        {"user_id": user["user_id"], "version": TERMS_VERSION},
        {
            "$set": {
                "user_id": user["user_id"],
                "version": TERMS_VERSION,
                "accepted_at": accepted_at,
            }
        },
        upsert=True,
    )
    return {"ok": True, "version": TERMS_VERSION, "accepted_at": accepted_at}


app.include_router(api)


@app.get("/")
async def root():
    return {"name": "Omni Multimodal AI API", "docs": "/docs"}
