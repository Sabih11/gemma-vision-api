"""Backend tests for Legal / Terms endpoints.

Covers:
- GET /api/legal/terms (public) returns {version, effective_date, content}
- GET /api/legal/status auth gating + fresh state + post-accept state
- POST /api/legal/accept happy path, wrong version (400), idempotency, cross-tenant isolation
- Sanity: previously working endpoints still pass (/api/health, /api/auth/me, /api/history, /api/transcribe)
- No '_id' key leaks
"""
import io
import wave
import struct
import uuid

import pytest


TIMEOUT = 120


def _assert_no_underscore_id(payload):
    if isinstance(payload, dict):
        assert "_id" not in payload, f"_id leaked in response: {payload}"
        for v in payload.values():
            _assert_no_underscore_id(v)
    elif isinstance(payload, list):
        for v in payload:
            _assert_no_underscore_id(v)


def _silent_wav_bytes(seconds: float = 1.0, sr: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        n = int(seconds * sr)
        w.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


# ---------- Isolated user fixtures (function scope) so accept-state doesn't bleed between tests ----------
@pytest.fixture
def fresh_user(mongo):
    """Seed a brand-new user + session for a single test, then clean up."""
    from datetime import datetime, timedelta, timezone
    uid = f"TEST_user_legal_{uuid.uuid4().hex[:10]}"
    tok = f"TEST_token_legal_{uuid.uuid4().hex}"
    email = f"TEST_legal_{uuid.uuid4().hex[:6]}@example.com"
    mongo["users"].insert_one({
        "user_id": uid, "email": email, "name": "Legal QA",
        "picture": "https://via.placeholder.com/150",
        "created_at": datetime.now(timezone.utc),
    })
    mongo["user_sessions"].insert_one({
        "user_id": uid, "session_token": tok,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
        "created_at": datetime.now(timezone.utc),
    })
    yield {"user_id": uid, "session_token": tok, "email": email}
    # Cleanup
    mongo["users"].delete_many({"user_id": uid})
    mongo["user_sessions"].delete_many({"user_id": uid})
    mongo["history"].delete_many({"user_id": uid})
    mongo["terms_acceptances"].delete_many({"user_id": uid})


@pytest.fixture
def auth_session(fresh_user):
    import requests
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {fresh_user['session_token']}"})
    return s


# ---------- GET /api/legal/terms (public) ----------
class TestLegalTerms:
    def test_terms_public_no_auth_required(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/legal/terms", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("version") == "1.0", f"unexpected version: {d.get('version')}"
        assert "effective_date" in d and isinstance(d["effective_date"], str) and len(d["effective_date"]) > 0
        assert "content" in d and isinstance(d["content"], str) and len(d["content"]) > 50
        _assert_no_underscore_id(d)


# ---------- GET /api/legal/status ----------
class TestLegalStatus:
    def test_status_requires_auth(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/legal/status", timeout=TIMEOUT)
        assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text[:200]}"

    def test_status_fresh_user_not_accepted(self, base_url, auth_session):
        r = auth_session.get(f"{base_url}/api/legal/status", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["current_version"] == "1.0"
        assert d["accepted"] is False
        assert d["accepted_at"] is None
        _assert_no_underscore_id(d)


# ---------- POST /api/legal/accept ----------
class TestLegalAccept:
    def test_accept_happy_path_and_status_reflects(self, base_url, auth_session, fresh_user, mongo):
        r = auth_session.post(f"{base_url}/api/legal/accept", json={"version": "1.0"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["version"] == "1.0"
        assert isinstance(d["accepted_at"], str) and len(d["accepted_at"]) > 0
        _assert_no_underscore_id(d)

        # Persisted to terms_acceptances collection
        doc = mongo["terms_acceptances"].find_one({"user_id": fresh_user["user_id"], "version": "1.0"})
        assert doc is not None, "acceptance not persisted"

        # GET /status reflects accepted=true with timestamp
        r2 = auth_session.get(f"{base_url}/api/legal/status", timeout=TIMEOUT)
        assert r2.status_code == 200
        s = r2.json()
        assert s["accepted"] is True
        assert s["current_version"] == "1.0"
        assert s["accepted_at"] is not None
        assert s["accepted_at"] == d["accepted_at"]

    def test_accept_wrong_version_400(self, base_url, auth_session):
        r = auth_session.post(f"{base_url}/api/legal/accept", json={"version": "99"}, timeout=TIMEOUT)
        assert r.status_code == 400, f"expected 400 got {r.status_code}: {r.text[:200]}"

    def test_accept_requires_auth(self, base_url, anon_client):
        r = anon_client.post(f"{base_url}/api/legal/accept", json={"version": "1.0"}, timeout=TIMEOUT)
        assert r.status_code == 401

    def test_accept_is_idempotent(self, base_url, auth_session, fresh_user, mongo):
        r1 = auth_session.post(f"{base_url}/api/legal/accept", json={"version": "1.0"}, timeout=TIMEOUT)
        assert r1.status_code == 200
        r2 = auth_session.post(f"{base_url}/api/legal/accept", json={"version": "1.0"}, timeout=TIMEOUT)
        assert r2.status_code == 200
        count = mongo["terms_acceptances"].count_documents(
            {"user_id": fresh_user["user_id"], "version": "1.0"}
        )
        assert count == 1, f"expected exactly 1 row after double-accept, got {count}"


# ---------- Cross-tenant isolation ----------
class TestLegalCrossTenant:
    def test_acceptance_of_a_does_not_affect_b(self, base_url, mongo):
        import requests
        from datetime import datetime, timedelta, timezone
        # Seed two fresh users
        def _seed(suffix):
            uid = f"TEST_user_iso_{suffix}_{uuid.uuid4().hex[:8]}"
            tok = f"TEST_token_iso_{suffix}_{uuid.uuid4().hex}"
            mongo["users"].insert_one({
                "user_id": uid, "email": f"TEST_iso_{suffix}@x.com",
                "created_at": datetime.now(timezone.utc),
            })
            mongo["user_sessions"].insert_one({
                "user_id": uid, "session_token": tok,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
                "created_at": datetime.now(timezone.utc),
            })
            return uid, tok
        uid_a, tok_a = _seed("A")
        uid_b, tok_b = _seed("B")
        try:
            # A accepts
            ra = requests.post(
                f"{base_url}/api/legal/accept",
                json={"version": "1.0"},
                headers={"Authorization": f"Bearer {tok_a}"},
                timeout=TIMEOUT,
            )
            assert ra.status_code == 200, ra.text
            # B remains not accepted
            rb = requests.get(
                f"{base_url}/api/legal/status",
                headers={"Authorization": f"Bearer {tok_b}"},
                timeout=TIMEOUT,
            )
            assert rb.status_code == 200
            db = rb.json()
            assert db["accepted"] is False, f"B leaked A's acceptance: {db}"
            assert db["accepted_at"] is None
            # And A still accepted
            ra_st = requests.get(
                f"{base_url}/api/legal/status",
                headers={"Authorization": f"Bearer {tok_a}"},
                timeout=TIMEOUT,
            )
            assert ra_st.json()["accepted"] is True
        finally:
            for uid in (uid_a, uid_b):
                mongo["users"].delete_many({"user_id": uid})
                mongo["user_sessions"].delete_many({"user_id": uid})
                mongo["terms_acceptances"].delete_many({"user_id": uid})


# ---------- Sanity: previously-working endpoints still work ----------
class TestSanityRegression:
    def test_health_still_ok(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/health", timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        # New surfaced field
        assert d.get("terms_version") == "1.0"
        _assert_no_underscore_id(d)

    def test_auth_me_still_works(self, base_url, auth_session, fresh_user):
        r = auth_session.get(f"{base_url}/api/auth/me", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_id"] == fresh_user["user_id"]
        _assert_no_underscore_id(d)

    def test_history_still_works(self, base_url, auth_session):
        r = auth_session.get(f"{base_url}/api/history", timeout=TIMEOUT)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        _assert_no_underscore_id(r.json())

    def test_transcribe_still_works(self, base_url, auth_session):
        files = {"audio": ("silent.wav", _silent_wav_bytes(1.0), "audio/wav")}
        r = auth_session.post(f"{base_url}/api/transcribe", files=files, timeout=TIMEOUT)
        assert r.status_code == 200, f"transcribe failed: {r.status_code} {r.text[:500]}"
        d = r.json()
        assert "text" in d and "id" in d
        _assert_no_underscore_id(d)
