import argparse
import json
import sys

import requests

DEFAULT_URL = (
    "https://huggingface.co/datasets/huggingface/documentation-images/"
    "resolve/main/p-blog/candy.JPG"
)
DEFAULT_QUESTION = "What animal is on the candy?"


def chat(base: str, image_url: str, question: str) -> None:
    payload = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "url": image_url},
                    {"type": "text", "text": question},
                ],
            }
        ]
    }
    r = requests.post(f"{base.rstrip('/')}/v1/chat", json=payload, timeout=600)
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2))


def ask(base: str, image_url: str, question: str) -> None:
    r = requests.post(
        f"{base.rstrip('/')}/v1/ask",
        data={"question": question, "image_url": image_url},
        timeout=600,
    )
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2))


def main() -> None:
    p = argparse.ArgumentParser(description="Gemma Vision API client")
    p.add_argument("--base", default="http://127.0.0.1:8000")
    p.add_argument("--image-url", default=DEFAULT_URL)
    p.add_argument("--question", default=DEFAULT_QUESTION)
    p.add_argument("--mode", choices=("chat", "ask"), default="chat")
    args = p.parse_args()
    try:
        if args.mode == "chat":
            chat(args.base, args.image_url, args.question)
        else:
            ask(args.base, args.image_url, args.question)
    except requests.RequestException as e:
        print(e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
