# Test Credentials — Omni Multimodal AI

## Authentication
Omni uses **Emergent-managed Google OAuth** — no app-managed passwords.
A real test login requires signing in with a Google account via `https://auth.emergentagent.com/?redirect=<frontend>/dashboard`.

## Seeded test session (for backend curl / automated tests)
Generate fresh seed data on demand via mongosh:
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var token  = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'qa.' + Date.now() + '@example.com',
  name: 'QA Tester',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: token,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('user_id=' + userId);
print('session_token=' + token);
"
```
Use the printed `session_token` as `Authorization: Bearer <token>` against any
`/api/*` endpoint, OR set it as `session_token` cookie.

## Domain / email allowlist
No restrictions — any Google account can log in.

## RBAC
Flat — all authenticated users have full access to their own resources only
(history is scoped by `user_id`; cross-tenant isolation tested and verified).

## Test artifacts created during automated runs
- /app/backend/tests/conftest.py
- /app/backend/tests/test_omni_api.py
- /app/test_reports/iteration_1.json
- /app/test_reports/pytest/pytest_results.xml

All seeded `TEST_*` users/sessions/history are cleaned up after each run.
