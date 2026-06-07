import base64
import io
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field
from PIL import Image

load_dotenv()

HF_ROUTER_BASE_URL = os.getenv(
    "HF_ROUTER_BASE_URL", "https://router.huggingface.co/v1"
)
MODEL_ID = os.getenv("MODEL_ID", "google/gemma-4-31B-it")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGING_FACE_HUB_TOKEN")
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200"
).split(",")

app = FastAPI(title="Gemma Vision API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_EXTENSIONS = {
    "wav": "wav",
    "mp3": "mp3",
    "mpeg": "mp3",
    "ogg": "ogg",
    "webm": "webm",
    "flac": "flac",
    "m4a": "mp4",
    "mp4": "mp4",
}


class ContentPart(BaseModel):
    type: str
    text: str | None = None
    url: str | None = None
    image_base64: str | None = Field(default=None, alias="image_base64")
    audio_base64: str | None = Field(default=None, alias="audio_base64")
    audio_format: str | None = Field(default=None, alias="audio_format")
    audio_url: str | None = None


class Message(BaseModel):
    role: str = "user"
    content: list[ContentPart]


class ChatRequest(BaseModel):
    messages: list[Message]
    stream: bool = False
    model: str | None = None


def _hf_token_configured() -> bool:
    return bool(HF_TOKEN and HF_TOKEN.strip())


def _get_client() -> OpenAI:
    if not _hf_token_configured():
        raise HTTPException(
            503,
            "HF_TOKEN not configured. Copy .env.example to .env and set your token.",
        )
    return OpenAI(base_url=HF_ROUTER_BASE_URL, api_key=HF_TOKEN)


def _strip_base64_payload(data: str) -> str:
    if "base64," in data:
        return data.split("base64,", 1)[1]
    return data


def _guess_audio_format(filename: str | None, content_type: str | None) -> str:
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in AUDIO_EXTENSIONS:
            return AUDIO_EXTENSIONS[ext]
    if content_type:
        mime = content_type.split(";")[0].strip().lower()
        if "/" in mime:
            subtype = mime.split("/", 1)[1]
            if subtype in AUDIO_EXTENSIONS:
                return AUDIO_EXTENSIONS[subtype]
            if subtype == "mpeg":
                return "mp3"
    return "wav"


def _image_url_part(url: str) -> dict[str, Any]:
    return {"type": "image_url", "image_url": {"url": url}}


def _image_base64_part(b64: str) -> dict[str, Any]:
    if b64.startswith("data:"):
        url = b64
    else:
        url = f"data:image/jpeg;base64,{_strip_base64_payload(b64)}"
    return {"type": "image_url", "image_url": {"url": url}}


def _audio_base64_part(b64: str, fmt: str) -> dict[str, Any]:
    return {
        "type": "input_audio",
        "input_audio": {
            "data": _strip_base64_payload(b64),
            "format": fmt,
        },
    }


def _audio_url_part(url: str) -> dict[str, Any]:
    return {"type": "input_audio", "input_audio": {"url": url}}


def _parts_to_openai_content(parts: list[ContentPart]) -> list[dict[str, Any]]:
    content: list[dict[str, Any]] = []
    for part in parts:
        if part.type == "text":
            if not part.text:
                raise HTTPException(400, "text part requires 'text'")
            content.append({"type": "text", "text": part.text})
        elif part.type == "image":
            if part.url:
                content.append(_image_url_part(part.url))
            elif part.image_base64:
                content.append(_image_base64_part(part.image_base64))
            else:
                raise HTTPException(
                    400, "image part requires 'url' or 'image_base64'"
                )
        elif part.type == "audio":
            fmt = (part.audio_format or "wav").lower()
            if part.audio_url:
                content.append(_audio_url_part(part.audio_url))
            elif part.audio_base64:
                content.append(_audio_base64_part(part.audio_base64, fmt))
            else:
                raise HTTPException(
                    400,
                    "audio part requires 'audio_url' or 'audio_base64'",
                )
        else:
            raise HTTPException(400, f"unsupported content type: {part.type}")
    return content


def _build_openai_messages(req: ChatRequest) -> list[dict[str, Any]]:
    return [
        {"role": msg.role, "content": _parts_to_openai_content(msg.content)}
        for msg in req.messages
    ]


def _completion_result(
    client: OpenAI,
    messages: list[dict[str, Any]],
    stream: bool,
    model: str,
):
    try:
        if stream:
            stream_resp = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )
            chunks: list[str] = []
            for chunk in stream_resp:
                delta = chunk.choices[0].delta.content
                if delta:
                    chunks.append(delta)
            return "".join(chunks)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
        )
        return response.choices[0].message.content
    except Exception as exc:
        raise HTTPException(502, f"Hugging Face router error: {exc}") from exc


@app.get("/health")
def health():
    return {
        "ok": True,
        "backend": "huggingface_router",
        "base_url": HF_ROUTER_BASE_URL,
        "model_id": MODEL_ID,
        "hf_token_configured": _hf_token_configured(),
        "audio_note": "Native audio works on google/gemma-4-E2B-it / E4B models",
    }


@app.post("/v1/chat")
def chat(req: ChatRequest):
    client = _get_client()
    messages = _build_openai_messages(req)
    model = req.model or MODEL_ID
    result = _completion_result(client, messages, req.stream, model)
    return {"result": result, "model": model}


@app.post("/v1/ask")
async def ask(
    question: str = Form(...),
    image: UploadFile | None = File(default=None),
    image_url: str | None = Form(default=None),
    audio: UploadFile | None = File(default=None),
    audio_url: str | None = Form(default=None),
    stream: bool = Form(default=False),
    model: str | None = Form(default=None),
):
    if not image and not image_url and not audio and not audio_url:
        raise HTTPException(
            400,
            "Provide at least one of: image, image_url, audio, audio_url",
        )

    content: list[dict[str, Any]] = []

    if image:
        raw = await image.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        content.append(_image_base64_part(b64))
    elif image_url:
        content.append(_image_url_part(image_url))

    if audio:
        raw = await audio.read()
        fmt = _guess_audio_format(audio.filename, audio.content_type)
        b64 = base64.b64encode(raw).decode("ascii")
        content.append(_audio_base64_part(b64, fmt))
    elif audio_url:
        content.append(_audio_url_part(audio_url))

    content.append({"type": "text", "text": question})
    messages = [{"role": "user", "content": content}]

    client = _get_client()
    resolved_model = model or MODEL_ID
    result = _completion_result(client, messages, stream, resolved_model)
    return {"result": result, "model": resolved_model}
