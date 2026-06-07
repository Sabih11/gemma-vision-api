"""Shared fixtures for backend tests: seed users/sessions in Mongo and clean up."""
import os
import uuid
import time
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

# Load backend .env to get MONGO_URL / DB_NAME (they are NOT in frontend env)
load_dotenv("/app/backend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fall back to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def mongo():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


def _seed_user(db, suffix: str):
    user_id = f"TEST_user_{suffix}_{uuid.uuid4().hex[:8]}"
    session_token = f"TEST_token_{suffix}_{uuid.uuid4().hex}"
    email = f"TEST_{suffix}_{int(time.time()*1000)}@example.com"
    db["users"].insert_one({
        "user_id": user_id,
        "email": email,
        "name": f"Test {suffix}",
        "picture": "https://via.placeholder.com/150",
        "created_at": datetime.now(timezone.utc),
    })
    db["user_sessions"].insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    return {"user_id": user_id, "session_token": session_token, "email": email}


@pytest.fixture(scope="session")
def user_a(mongo):
    u = _seed_user(mongo, "A")
    yield u
    # Cleanup
    mongo["users"].delete_many({"user_id": u["user_id"]})
    mongo["user_sessions"].delete_many({"user_id": u["user_id"]})
    mongo["history"].delete_many({"user_id": u["user_id"]})


@pytest.fixture(scope="session")
def user_b(mongo):
    u = _seed_user(mongo, "B")
    yield u
    mongo["users"].delete_many({"user_id": u["user_id"]})
    mongo["user_sessions"].delete_many({"user_id": u["user_id"]})
    mongo["history"].delete_many({"user_id": u["user_id"]})


@pytest.fixture
def client_a(user_a):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {user_a['session_token']}"})
    return s


@pytest.fixture
def client_b(user_b):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {user_b['session_token']}"})
    return s


@pytest.fixture
def anon_client():
    return requests.Session()
