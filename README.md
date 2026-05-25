# Gemma Vision API

FastAPI wrapper that calls [Hugging Face Inference Router](https://huggingface.co/docs/inference-providers) via the OpenAI-compatible API (`https://router.huggingface.co/v1`) using `google/gemma-4-31B-it`.

No local GPU or model download required.

## Setup

```powershell
cd $env:USERPROFILE\Projects\gemma-vision-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env and set HF_TOKEN=hf_...
```

1. Create a token: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Accept the model license: [google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it)
3. Set `HF_TOKEN` in `.env` (or `$env:HF_TOKEN`)

## Run

```powershell
uvicorn app:app --host 127.0.0.1 --port 8000
```

Server starts immediately (inference runs on Hugging Face, not locally).

## Test

```powershell
curl http://127.0.0.1:8000/health
python client.py
python client.py --mode ask
```

## Endpoints

| Method | Path       | Description                                                        |
| ------ | ---------- | ------------------------------------------------------------------ |
| GET    | `/health`  | Config status (`hf_token_configured`, router URL, model id)        |
| POST   | `/v1/chat` | JSON messages; set `"stream": true` to aggregate streamed chunks   |
| POST   | `/v1/ask`  | Form: `question` + `image_url` or uploaded `image`; optional `stream` |

## How it works

Same pattern as the Hugging Face OpenAI SDK example:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"],
)
client.chat.completions.create(model="google/gemma-4-31B-it", messages=[...])
```

Image inputs are converted to OpenAI-style `image_url` parts (HTTP URLs or `data:image/jpeg;base64,...`).
