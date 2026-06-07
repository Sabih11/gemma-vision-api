## Auth-Gated App Testing Playbook
(See /app/memory/test_credentials.md for active test session token & user_id.)

### Step 1: Create Test User & Session in MongoDB
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

### Step 2: Test Backend API
```
# Auth check
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Protected endpoint
curl -X GET "$REACT_APP_BACKEND_URL/api/history" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Step 3: Browser testing — set cookie before navigation
```
await page.context.add_cookies([{
  "name": "session_token",
  "value": "YOUR_SESSION_TOKEN",
  "domain": "YOUR_DOMAIN",
  "path": "/",
  "httpOnly": True,
  "secure": True,
  "sameSite": "None"
}]);
await page.goto("https://YOUR_DOMAIN");
```

### Checklist
- users collection has `user_id` (custom UUID)
- user_sessions.user_id == users.user_id
- All queries use `{"_id": 0}` projection
- Backend uses `user_id` (not `_id`)
- `/api/auth/me` returns user
- Protected endpoints return data with valid token
