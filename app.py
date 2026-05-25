import base64
import io
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from PIL import Image
from transformers import pipeline

MODEL_ID = os.getenv("MODEL_ID", "google/gemma-4-31B-it")
LOAD_IN_4BIT = os.getenv("LOAD_IN_4BIT", "1") == "1"
pipe = None


def _load_pipeline():
    kwargs: dict[str, Any] = {
        "task": "image-text-to-text",
        "model": MODEL_ID,
        "device_map": "auto",
    }
    if LOAD_IN_4BIT:
        kwargs["model_kwargs"] = {
            "load_in_4bit": True,
            "torch_dtype": "auto",
        }
    return pipeline(**kwargs)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipe
    pipe = _load_pipeline()
    yield


app = FastAPI(title="Gemma Vision API", lifespan=lifespan)


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


def _normalize_result(raw: Any) -> Any:
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        if "generated_text" in raw[0]:
            return raw[0]["generated_text"]
    return raw


def _build_messages(req: ChatRequest) -> list[dict[str, Any]]:
    out = []
    for msg in req.messages:
        content = []
        for part in msg.content:
            if part.type == "text":
                if not part.text:
                    raise HTTPException(400, "text part requires 'text'")
                content.append({"type": "text", "text": part.text})
            elif part.type == "image":
                if part.url:
                    content.append({"type": "image", "url": part.url})
                elif part.image_base64:
                    content.append({"type": "image", "image": part.image_base64})
                else:
                    raise HTTPException(
                        400, "image part requires 'url' or 'image_base64'"
                    )
            else:
                raise HTTPException(400, f"unsupported content type: {part.type}")
        out.append({"role": msg.role, "content": content})
    return out


@app.get("/health")
def health():
    return {
        "ok": True,
        "model_loaded": pipe is not None,
        "model_id": MODEL_ID,
        "load_in_4bit": LOAD_IN_4BIT,
    }


@app.post("/v1/chat")
def chat(req: ChatRequest):
    if pipe is None:
        raise HTTPException(503, "Model not loaded")
    messages = _build_messages(req)
    raw = pipe(text=messages)
    return {"result": _normalize_result(raw)}


@app.post("/v1/ask")
async def ask(
    question: str = Form(...),
    image: UploadFile | None = File(default=None),
    image_url: str | None = Form(default=None),
):
    if pipe is None:
        raise HTTPException(503, "Model not loaded")
    if not image and not image_url:
        raise HTTPException(400, "Provide 'image' file or 'image_url'")

    content: list[dict[str, Any]] = []
    if image:
        raw = await image.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        content.append({"type": "image", "image": b64})
    else:
        content.append({"type": "image", "url": image_url})

    content.append({"type": "text", "text": question})
    messages = [{"role": "user", "content": content}]
    raw = pipe(text=messages)
    return {"result": _normalize_result(raw)}
