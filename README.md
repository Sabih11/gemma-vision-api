# Gemma Vision API

FastAPI wrapper around Hugging Face `pipeline("image-text-to-text")` using `google/gemma-4-31B-it`.

## Setup

```powershell
cd $env:USERPROFILE\Projects\gemma-vision-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Log in to Hugging Face if the model is gated:

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

