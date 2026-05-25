import base64
import io
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from openai import OpenAI
from pydantic import BaseModel, Field
from PIL import Image

load_dotenv()

HF_ROUTER_BASE_URL = os.getenv(
    "HF_ROUTER_BASE_URL", "https://router.huggingface.co/v1"
)
MODEL_ID = os.getenv("MODEL_ID", "google/gemma-4-31B-it")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGING_FACE_HUB_TOKEN")

app = FastAPI(title="Gemma Vision API")


class ContentPart(BaseModel):
    type: str
    text: str | None = None
    url: str | None = None
    image_base64: str | None = Field(default=None, alias="image_base64")


class Message(BaseModel):
    role: str = "user"
    content: list[ContentPart]


class ChatRequest(BaseModel):
    messages: list[Message]
    stream: bool = False


def _hf_token_configured() -> bool:
    return bool(HF_TOKEN and HF_TOKEN.strip())


def _get_client() -> OpenAI:
    if not _hf_token_configured():
        raise HTTPException(
            503,
            "HF_TOKEN not configured. Copy .env.example to .env and set your token.",
        )
    return OpenAI(base_url=HF_ROUTER_BASE_URL, api_key=HF_TOKEN)


def _image_url_part(url: str) -> dict[str, Any]:
    return {"type": "image_url", "image_url": {"url": url}}


def _image_base64_part(b64: str) -> dict[str, Any]:
    if b64.startswith("data:"):
        url = b64
    else:
        url = f"data:image/jpeg;base64,{b64}"
    return {"type": "image_url", "image_url": {"url": url}}


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
        else:
            raise HTTPException(400, f"unsupported content type: {part.type}")
    return content


def _build_openai_messages(req: ChatRequest) -> list[dict[str, Any]]:
    return [
        {"role": msg.role, "content": _parts_to_openai_content(msg.content)}
        for msg in req.messages
    ]


def _completion_result(client: OpenAI, messages: list[dict[str, Any]], stream: bool):
    try:
        if stream:
            stream_resp = client.chat.completions.create(
                model=MODEL_ID,
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
            model=MODEL_ID,
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
    }


@app.post("/v1/chat")
def chat(req: ChatRequest):
    client = _get_client()
    messages = _build_openai_messages(req)
    result = _completion_result(client, messages, req.stream)
    return {"result": result}


@app.post("/v1/ask")
async def ask(
    question: str = Form(...),
    image: UploadFile | None = File(default=None),
    image_url: str | None = Form(default=None),
    stream: bool = Form(default=False),
):
    if not image and not image_url:
        raise HTTPException(400, "Provide 'image' file or 'image_url'")

    content: list[dict[str, Any]] = []
    if image:
        raw = await image.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        content.append(_image_base64_part(b64))
    else:
        content.append(_image_url_part(image_url))

    content.append({"type": "text", "text": question})
    messages = [{"role": "user", "content": content}]

    client = _get_client()
    result = _completion_result(client, messages, stream)
    return {"result": result}
