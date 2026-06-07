"""End-to-end backend tests for Omni Multimodal AI API.

Covers: health, auth gating, /auth/me + logout, /transcribe (Whisper),
/ask (Gemma vision), /chat (text), /history list + delete + cross-tenant isolation,
and absence of MongoDB _id in any response.
"""
import io
import wave
import struct

import pytest
from PIL import Image


TIMEOUT = 120


# ---------- helpers ----------
def _silent_wav_bytes(seconds: float = 1.0, sr: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        n = int(seconds * sr)
        w.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


def _red_jpg_bytes(size: int = 96) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (size, size), (255, 0, 0)).save(buf, format="JPEG", quality=70)
    return buf.getvalue()


def _assert_no_underscore_id(payload):
    """Recursively assert no '_id' field present in payload."""
    if isinstance(payload, dict):
        assert "_id" not in payload, f"_id leaked in response: {payload}"
        for v in payload.values():
            _assert_no_underscore_id(v)
    elif isinstance(payload, list):
        for v in payload:
            _assert_no_underscore_id(v)


# ---------- Health ----------
class TestHealth:
    def test_health_ok(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/health", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["hf_token_configured"] is True
        assert d["emergent_llm_configured"] is True
        _assert_no_underscore_id(d)


# ---------- Auth gating ----------
class TestAuthGating:
    @pytest.mark.parametrize("path,method,kwargs", [
        ("/api/auth/me", "get", {}),
        ("/api/history", "get", {}),
        ("/api/transcribe", "post", {"files": {"audio": ("a.wav", b"", "audio/wav")}}),
        ("/api/ask", "post", {"data": {"question": "hi"}}),
        ("/api/chat", "post", {"json": {"messages": [{"role": "user", "content": [{"type": "text", "text": "hi"}]}]}}),
    ])
    def test_protected_requires_auth(self, base_url, anon_client, path, method, kwargs):
        r = getattr(anon_client, method)(f"{base_url}{path}", timeout=TIMEOUT, **kwargs)
        assert r.status_code == 401, f"{path} should be 401 without token, got {r.status_code}: {r.text[:200]}"

    def test_invalid_token_rejected(self, base_url, anon_client):
        r = anon_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": "Bearer bogus-token-zzz"},
            timeout=TIMEOUT,
        )
        assert r.status_code == 401


# ---------- /auth/me + logout ----------
class TestAuthMe:
    def test_auth_me_returns_seeded_user(self, base_url, client_a, user_a):
        r = client_a.get(f"{base_url}/api/auth/me", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_id"] == user_a["user_id"]
        assert d["email"] == user_a["email"]
        _assert_no_underscore_id(d)

    def test_logout_invalidates_session(self, base_url, mongo):
        # Seed a one-off session so we don't kill user_a's session for later tests
        from datetime import datetime, timedelta, timezone
        import uuid
        uid = f"TEST_user_logout_{uuid.uuid4().hex[:8]}"
        tok = f"TEST_token_logout_{uuid.uuid4().hex}"
        mongo["users"].insert_one({"user_id": uid, "email": f"TEST_lo_{uid}@x.com", "created_at": datetime.now(timezone.utc)})
        mongo["user_sessions"].insert_one({
            "user_id": uid, "session_token": tok,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "created_at": datetime.now(timezone.utc),
        })
        import requests
        h = {"Authorization": f"Bearer {tok}"}
        # works pre-logout
        assert requests.get(f"{base_url}/api/auth/me", headers=h, timeout=TIMEOUT).status_code == 200
        # logout
        r = requests.post(f"{base_url}/api/auth/logout", headers=h, timeout=TIMEOUT)
        assert r.status_code == 200
        # now invalidated
        assert requests.get(f"{base_url}/api/auth/me", headers=h, timeout=TIMEOUT).status_code == 401
        # cleanup
        mongo["users"].delete_one({"user_id": uid})
        mongo["user_sessions"].delete_many({"session_token": tok})


# ---------- /transcribe (Whisper) ----------
class TestTranscribe:
    def test_transcribe_returns_text_and_persists_history(self, base_url, client_a, user_a, mongo):
        files = {"audio": ("silent.wav", _silent_wav_bytes(1.0), "audio/wav")}
        r = client_a.post(f"{base_url}/api/transcribe", files=files, timeout=TIMEOUT)
        assert r.status_code == 200, f"transcribe failed: {r.status_code} {r.text[:500]}"
        d = r.json()
        assert "text" in d
        assert isinstance(d["text"], str)
        assert "id" in d
        _assert_no_underscore_id(d)
        # verify history item persisted of kind transcribe
        item = mongo["history"].find_one({"id": d["id"], "user_id": user_a["user_id"]})
        assert item is not None
        assert item["kind"] == "transcribe"


# ---------- /ask (image + question) ----------
class TestAsk:
    def test_ask_image_returns_result_and_persists(self, base_url, client_a, user_a, mongo):
        files = {"image": ("red.jpg", _red_jpg_bytes(96), "image/jpeg")}
        data = {"question": "What color is this image? Answer in one word."}
        r = client_a.post(f"{base_url}/api/ask", files=files, data=data, timeout=TIMEOUT)
        assert r.status_code == 200, f"ask failed: {r.status_code} {r.text[:500]}"
        d = r.json()
        assert "result" in d and isinstance(d["result"], str) and len(d["result"]) > 0
        assert "model" in d
        _assert_no_underscore_id(d)
        # verify history item of kind 'image'
        items = list(mongo["history"].find({"user_id": user_a["user_id"], "kind": "image"}))
        assert len(items) >= 1


# ---------- /chat text-only ----------
class TestChat:
    def test_chat_text_only_returns_result(self, base_url, client_a):
        body = {
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": "Reply with the single word: pong"}]}
            ]
        }
        r = client_a.post(f"{base_url}/api/chat", json=body, timeout=TIMEOUT)
        assert r.status_code == 200, f"chat failed: {r.status_code} {r.text[:500]}"
        d = r.json()
        assert "result" in d and isinstance(d["result"], str)
        assert "model" in d
        _assert_no_underscore_id(d)


# ---------- /history list + cross-tenant isolation + delete ----------
class TestHistory:
    def test_history_lists_only_callers_items_and_sorted_desc(self, base_url, client_a, user_a, mongo):
        r = client_a.get(f"{base_url}/api/history", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        _assert_no_underscore_id(items)
        # all items belong to user_a
        for it in items:
            assert it["user_id"] == user_a["user_id"]
        # sorted desc by created_at
        if len(items) >= 2:
            assert items[0]["created_at"] >= items[-1]["created_at"]

    def test_cross_tenant_isolation(self, base_url, client_a, client_b, user_a, user_b, mongo):
        # Seed history rows for both users
        import uuid
        from datetime import datetime, timezone
        a_id = uuid.uuid4().hex
        b_id = uuid.uuid4().hex
        mongo["history"].insert_one({
            "id": a_id, "user_id": user_a["user_id"], "kind": "chat",
            "prompt": "TEST_A", "response": "ra", "extra": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        mongo["history"].insert_one({
            "id": b_id, "user_id": user_b["user_id"], "kind": "chat",
            "prompt": "TEST_B", "response": "rb", "extra": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # A should only see A's items
        ra = client_a.get(f"{base_url}/api/history", timeout=TIMEOUT).json()
        rb = client_b.get(f"{base_url}/api/history", timeout=TIMEOUT).json()
        a_ids = {i["id"] for i in ra}
        b_ids = {i["id"] for i in rb}
        assert a_id in a_ids and b_id not in a_ids, "user A leaked user B's history!"
        assert b_id in b_ids and a_id not in b_ids, "user B leaked user A's history!"

    def test_delete_history_only_own_item(self, base_url, client_a, client_b, user_a, mongo):
        import uuid
        from datetime import datetime, timezone
        target_id = uuid.uuid4().hex
        mongo["history"].insert_one({
            "id": target_id, "user_id": user_a["user_id"], "kind": "chat",
            "prompt": "TEST_delete", "response": "x", "extra": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # user B cannot delete user A's item -> 404
        r_forbidden = client_b.delete(f"{base_url}/api/history/{target_id}", timeout=TIMEOUT)
        assert r_forbidden.status_code == 404
        # user A can delete
        r_ok = client_a.delete(f"{base_url}/api/history/{target_id}", timeout=TIMEOUT)
        assert r_ok.status_code == 200
        # confirm removed
        assert mongo["history"].find_one({"id": target_id}) is None
        # deleting again -> 404
        r2 = client_a.delete(f"{base_url}/api/history/{target_id}", timeout=TIMEOUT)
        assert r2.status_code == 404
