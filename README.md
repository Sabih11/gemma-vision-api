# Gemma Vision API

FastAPI wrapper around Hugging Face `pipeline("image-text-to-text")` using `google/gemma-4-31B-it`.

## Setup

```powershell
cd $env:USERPROFILE\Projects\gemma-vision-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Hugging Face token (gated model)

`google/gemma-4-31B-it` requires a Hugging Face account, accepted license, and an access token.

1. Create a token: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (read access is enough).
2. Accept the model license: [google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it).
3. Copy the example env file and add your token:

```powershell
Copy-Item .env.example .env
# Edit .env and set HF_TOKEN=hf_...
```

Or set it in the shell (not saved to disk):

```powershell
$env:HF_TOKEN = "hf_your_token_here"
```

The app also accepts `HUGGING_FACE_HUB_TOKEN` (same value). `/health` reports `hf_token_configured` without exposing the token.

Alternative: CLI login (writes token to your HF cache, no `.env` needed):

```powershell
huggingface-cli login
```

## Run

```powershell
# 4-bit quantization (default, lower VRAM)
$env:LOAD_IN_4BIT = "1"
uvicorn app:app --host 127.0.0.1 --port 8000

# Full precision (needs a lot of GPU memory)
$env:LOAD_IN_4BIT = "0"
uvicorn app:app --host 127.0.0.1 --port 8000
```

Optional: override model id:

```powershell
$env:MODEL_ID = "google/gemma-4-31B-it"
```

## Test

In another terminal (with venv active):

```powershell
python client.py
python client.py --mode ask
curl http://127.0.0.1:8000/health
```

## Endpoints


| Method | Path       | Description                                             |
| ------ | ---------- | ------------------------------------------------------- |
| GET    | `/health`  | Model load status                                       |
| POST   | `/v1/chat` | JSON messages (same shape as `pipeline(text=messages)`) |
| POST   | `/v1/ask`  | Form: `question` + `image_url` or uploaded `image`      |


## Hardware

- 31B vision models need a strong GPU; 4-bit often still needs ~20GB+ VRAM.
- First run downloads weights from Hugging Face.
- CUDA + `bitsandbytes` on Windows can be unreliable; WSL2/Linux is often easier.

